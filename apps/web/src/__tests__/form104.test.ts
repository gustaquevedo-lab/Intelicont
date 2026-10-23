import { describe, expect, it } from "vitest";
import { buildForm104 } from "@intelicont/ledger/form104";

const zero = { gravado10: 0, gravado5: 0, exento: 0, iva10: 0, iva5: 0, total: 0 };
const t = (o: Partial<typeof zero>) => ({ ...zero, ...o });

describe("buildForm104", () => {
  it("debit and credit come from the IVA of ventas and compras", () => {
    const r = buildForm104(t({ gravado10: 110_000, iva10: 10_000, gravado5: 10_500, iva5: 500 }), t({ gravado10: 58_000, iva10: 5_273 }));
    expect(r.debitoFiscal).toBe(10_500);
    expect(r.creditoFiscal).toBe(5_273);
  });

  it("saldo is positive when debit exceeds credit and negative otherwise", () => {
    expect(buildForm104(t({ iva10: 1_000 }), t({ iva10: 400 })).saldo).toBe(600);
    expect(buildForm104(t({ iva10: 400 }), t({ iva10: 1_000 })).saldo).toBe(-600);
  });

  it("bases are gross minus IVA", () => {
    const r = buildForm104(t({ gravado10: 110_000, iva10: 10_000, gravado5: 10_500, iva5: 500 }), zero);
    expect(r.ventas).toMatchObject({ base10: 100_000, base5: 10_000, gravado10: 110_000 });
  });

  it("credit notes already signed in the totals reduce the figures", () => {
    const r = buildForm104(zero, t({ gravado10: 9_900_000, iva10: 900_000, total: 9_900_000 }));
    expect(r.creditoFiscal).toBe(900_000);
    expect(r.compras.base10).toBe(9_000_000);
    expect(r.saldo).toBe(-900_000);
  });

  it("a month without documents is all zeros", () => {
    const r = buildForm104(zero, zero);
    expect(r).toMatchObject({ debitoFiscal: 0, creditoFiscal: 0, saldo: 0 });
    expect(r.ventas).toEqual({ ...zero, base10: 0, base5: 0 });
  });
});
