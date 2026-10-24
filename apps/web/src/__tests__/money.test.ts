import { describe, it, expect } from "vitest";
import { assertMoney, ivaFromGross } from "@intelicont/core";

describe("integer money", () => {
  it("computes IVA from gross, rounded to integer", () => {
    expect(ivaFromGross(58000, 10)).toBe(5273);
    expect(ivaFromGross(11000000, 10)).toBe(1000000);
    expect(ivaFromGross(105000, 5)).toBe(5000);
  });
  it("assertMoney rejects non-integers and unsafe integers", () => {
    expect(assertMoney(1000)).toBe(1000);
    expect(() => assertMoney(1.5)).toThrow();
    expect(() => assertMoney(2 ** 53)).toThrow();
    expect(() => assertMoney(NaN)).toThrow();
  });
});

import { calculateTaxFromTotal } from "@ledger/src/fiscal-py";
import { calculateRetentions } from "@intelicont/ledger/retentions";

describe("integer flow", () => {
  it("calculateTaxFromTotal splits gross into integers that add up", () => {
    const r = calculateTaxFromTotal(58000, 10);
    expect(r.iva10).toBe(5273);
    expect(r.gravado10 + r.iva10).toBe(58000);
  });
  it("retention amounts are safe integers", () => {
    const rs = calculateRetentions({ gravado10: 2750001, gravado5: 0, exento: 0, iva10: 250000, iva5: 0, total: 2750001, profile: { iva: { rate: 0.3 }, ire: { rate: 0.333 } } });
    expect(rs).toHaveLength(2);
    for (const r of rs) expect(Number.isSafeInteger(r.amount) && Number.isSafeInteger(r.base)).toBe(true);
  });
});
