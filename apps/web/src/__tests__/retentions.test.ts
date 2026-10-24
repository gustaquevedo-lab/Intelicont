import { describe, expect, it } from "vitest";
import { calculateNetPayable, calculateRetentions, parseRetentionProfile } from "@intelicont/ledger/retentions";

// Purchase of 11.000.000 gravado 10 % (IVA included): IVA 1.000.000, net 10.000.000.
const purchase = { gravado10: 11_000_000, gravado5: 0, exento: 0, iva10: 1_000_000, iva5: 0, total: 11_000_000 };

describe("retentions engine", () => {
  it("IVA retention base is the IVA amount, not the gross", () => {
    const [iva, ...rest] = calculateRetentions({ ...purchase, profile: { iva: { rate: 0.3 } } });
    expect(rest).toEqual([]);
    expect(iva).toMatchObject({ type: "iva", base: 1_000_000, rate: 0.3, amount: 300_000, unverified: false });
  });

  it("no partner profile means no retention", () => {
    expect(calculateRetentions({ ...purchase, profile: null })).toEqual([]);
    expect(calculateRetentions({ ...purchase })).toEqual([]);
    expect(calculateRetentions({ ...purchase, profile: {} })).toEqual([]);
    // A profile for another tax does not trigger the IVA retention.
    expect(calculateRetentions({ ...purchase, profile: { ire: { rate: 0.03 } } }).map((r) => r.type)).toEqual(["ire"]);
  });

  it("profile rate 70% applies to the IVA amount", () => {
    const [iva] = calculateRetentions({ ...purchase, gravado5: 2_100_000, iva5: 100_000, total: 13_100_000, profile: { iva: { rate: 0.7 } } });
    expect(iva).toMatchObject({ base: 1_100_000, amount: 770_000 });
  });

  it("amount below the profile minimum yields no retention", () => {
    expect(calculateRetentions({ ...purchase, profile: { iva: { rate: 0.3, minimum: 11_000_001 } } })).toEqual([]);
    // At the minimum it applies.
    expect(calculateRetentions({ ...purchase, profile: { iva: { rate: 0.3, minimum: 11_000_000 } } })).toHaveLength(1);
  });

  it("retention amounts are integers", () => {
    const rs = calculateRetentions({
      gravado10: 11_000_011, gravado5: 0, exento: 0, iva10: 1_000_001, iva5: 0, total: 11_000_011,
      profile: { iva: { rate: 0.3 }, ire: { rate: 0.333 }, irp: { rate: 0.077 } },
    });
    expect(rs).toHaveLength(3);
    expect(rs[0].amount).toBe(300_000); // round(300000.3)
    for (const r of rs) expect(Number.isSafeInteger(r.amount) && Number.isSafeInteger(r.base)).toBe(true);
  });

  it("IRE rate comes from the profile and is flagged unverified", () => {
    const rs = calculateRetentions({ ...purchase, profile: { ire: { rate: 0.03 }, irp: { rate: 0.1, minimum: 0 } } });
    // IRE/IRP base: the amount without IVA.
    expect(rs).toEqual([
      expect.objectContaining({ type: "ire", base: 10_000_000, rate: 0.03, amount: 300_000, unverified: true }),
      expect.objectContaining({ type: "irp", base: 10_000_000, rate: 0.1, amount: 1_000_000, unverified: true }),
    ]);
  });

  it("net payable is total minus retentions", () => {
    const rs = calculateRetentions({ ...purchase, profile: { iva: { rate: 0.3 }, ire: { rate: 0.03 } } });
    expect(calculateNetPayable(purchase.total, rs)).toBe(11_000_000 - 300_000 - 300_000);
    expect(calculateNetPayable(purchase.total, [])).toBe(11_000_000);
  });

  it("only valid profiles parse (IVA rate 30/70/100 %, non-negative integer minimum)", () => {
    expect(parseRetentionProfile(null)).toEqual({ ok: true, value: null });
    expect(parseRetentionProfile({ iva: { rate: 0.3, minimum: 50_000 } }).ok).toBe(true);
    expect(parseRetentionProfile({ iva: { rate: 0.5 } }).ok).toBe(false);
    expect(parseRetentionProfile({ iva: { rate: 0.3, minimum: 1.5 } }).ok).toBe(false);
    expect(parseRetentionProfile({ ire: { rate: 2 } }).ok).toBe(false);
    expect(parseRetentionProfile({ iva: true }).ok).toBe(false);
  });
});
