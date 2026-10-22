import { describe, it, expect } from "vitest";
import {
  validateRuc,
  validateTimbrado,
  validateCDC,
  validateInvoiceData,
  calculateTaxFromTotal,
  calculateTaxFromBase,
  calculateIre,
  getVencimientoIVA,
  IVA_RATES,
  IRE_RATES,
  IRP_RETENTION_RATES,
} from "@ledger/src/fiscal-py";

describe("validateRuc", () => {
  // Helper: compute check digit for a juridical RUC body
  const dv = (body: string): number => {
    const w = [2, 3, 4, 5, 6, 7, 2, 3];
    const rev = body.split("").reverse();
    let sum = 0;
    for (let i = 0; i < rev.length && i < w.length; i++) sum += parseInt(rev[i]) * w[i];
    const r = sum % 11;
    return r <= 1 ? r : 11 - r;
  };

  // Valid juridical RUC: body + computed DV
  const validJuridicoBody = "80000000";
  const validJuridico = `${validJuridicoBody}-${dv(validJuridicoBody)}`;
  const invalidJuridico = `${validJuridicoBody}-${(dv(validJuridicoBody) + 1) % 10}`;
  it("rejects empty RUC", () => {
    const r = validateRuc("");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("El RUC es obligatorio");
  });

  it("rejects whitespace-only RUC", () => {
    const r = validateRuc("   ");
    expect(r.valid).toBe(false);
  });

  it("validates juridical RUC format", () => {
    const r = validateRuc(validJuridico);
    expect(r.valid).toBe(true);
  });

  it("rejects juridical RUC with wrong check digit", () => {
    const r = validateRuc(invalidJuridico);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes("Dígito verificador"))).toBe(true);
  });

  it("validates natural person RUC (6 digits)", () => {
    const r = validateRuc("123456-0");
    expect(r.valid).toBe(true);
  });

  it("validates natural person RUC (7 digits)", () => {
    const r = validateRuc("1234567-8");
    expect(r.valid).toBe(true);
  });

  it("validates cedula-only format", () => {
    const r = validateRuc("1234567");
    expect(r.valid).toBe(true);
  });

  it("rejects completely invalid format", () => {
    const r = validateRuc("abc-xyz");
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes("Formato de RUC inválido"))).toBe(true);
  });

  it("warns for RUC starting with 600", () => {
    const r = validateRuc("600123-0");
    expect(r.valid).toBe(true);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("validates known juridical RUC with correct DV", () => {
    const r = validateRuc(validJuridico);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });
});

describe("validateTimbrado", () => {
  it("rejects empty timbrado", () => {
    const r = validateTimbrado("");
    expect(r.valid).toBe(false);
  });

  it("validates 8-digit timbrado", () => {
    const r = validateTimbrado("12345678");
    expect(r.valid).toBe(true);
  });

  it("rejects non-8-digit timbrado", () => {
    const r = validateTimbrado("1234");
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes("8 dígitos"))).toBe(true);
  });

  it("rejects timbrado with letters", () => {
    const r = validateTimbrado("abcd1234");
    expect(r.valid).toBe(false);
  });
});

describe("validateCDC", () => {
  it("rejects empty CDC", () => {
    const r = validateCDC("");
    expect(r.valid).toBe(false);
  });

  it("rejects CDC shorter than 44 digits", () => {
    const r = validateCDC("1234567890");
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes("44 dígitos"))).toBe(true);
  });

  it("rejects CDC longer than 44 digits", () => {
    const r = validateCDC("1".repeat(45));
    expect(r.valid).toBe(false);
  });

  it("rejects CDC with non-numeric characters", () => {
    const r = validateCDC("a".repeat(44));
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes("dígitos numéricos"))).toBe(true);
  });

  it("validates 44-digit numeric CDC", () => {
    const cdc44 = "12345678901234567890123456789012345678901234"; // 44 digits
    const r = validateCDC(cdc44);
    expect(r.valid).toBe(true);
  });
});

describe("validateInvoiceData", () => {
  it("validates complete invoice data", () => {
    const r = validateInvoiceData({
      timbrado: "12345678",
      establecimiento: "001",
      puntoEmision: "001",
      numeroDocumento: "00234",
      fechaEmision: "2026-05-01",
      cdc: "12345678901234567890123456789012345678901234",
    });
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rejects invalid establecimiento", () => {
    const r = validateInvoiceData({
      timbrado: "12345678",
      establecimiento: "abc",
      puntoEmision: "001",
      numeroDocumento: "00234",
      fechaEmision: "2026-05-01",
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes("establecimiento"))).toBe(true);
  });

  it("rejects invalid punto de emision", () => {
    const r = validateInvoiceData({
      timbrado: "12345678",
      establecimiento: "001",
      puntoEmision: "99",
      numeroDocumento: "00234",
      fechaEmision: "2026-05-01",
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes("punto de emisión"))).toBe(true);
  });

  it("rejects invalid numero documento", () => {
    const r = validateInvoiceData({
      timbrado: "12345678",
      establecimiento: "001",
      puntoEmision: "001",
      numeroDocumento: "",
      fechaEmision: "2026-05-01",
    });
    expect(r.valid).toBe(false);
    expect(r.errors.some((e: string) => e.includes("número de documento"))).toBe(true);
  });

  it("warns for future dates", () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const r = validateInvoiceData({
      timbrado: "12345678",
      establecimiento: "001",
      puntoEmision: "001",
      numeroDocumento: "123",
      fechaEmision: futureDate.toISOString().split("T")[0],
    });
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w: string) => w.includes("futura"))).toBe(true);
  });

  it("warns for dates before 2022", () => {
    const r = validateInvoiceData({
      timbrado: "12345678",
      establecimiento: "001",
      puntoEmision: "001",
      numeroDocumento: "123",
      fechaEmision: "2021-12-31",
    });
    expect(r.valid).toBe(true);
    expect(r.warnings.some((w: string) => w.includes("anterior a 2022"))).toBe(true);
  });
});

describe("calculateTaxFromTotal", () => {
  it("calculates IVA 10% from total", () => {
    const r = calculateTaxFromTotal(110000, 10);
    expect(r.gravado10).toBe(100000);
    expect(r.iva10).toBe(10000);
    expect(r.total).toBe(110000);
  });

  it("calculates IVA 5% from total", () => {
    const r = calculateTaxFromTotal(105000, 5);
    expect(r.gravado5).toBe(100000);
    expect(r.iva5).toBe(5000);
    expect(r.total).toBe(105000);
  });

  it("handles exempt items", () => {
    const r = calculateTaxFromTotal(50000, 0);
    expect(r.exento).toBe(50000);
    expect(r.totalIva).toBe(0);
    expect(r.iva10).toBe(0);
    expect(r.iva5).toBe(0);
  });

  it("calculates large amounts", () => {
    const r = calculateTaxFromTotal(11000000, 10);
    expect(r.gravado10).toBe(10000000);
    expect(r.iva10).toBe(1000000);
  });
});

describe("calculateTaxFromBase", () => {
  it("calculates from gravado base", () => {
    const r = calculateTaxFromBase(100000, 0, 0);
    expect(r.gravado10).toBe(100000);
    expect(r.iva10).toBe(10000);
    expect(r.total).toBe(110000);
  });

  it("handles both IVA rates", () => {
    const r = calculateTaxFromBase(100000, 50000, 0);
    expect(r.iva10).toBe(10000);
    expect(r.iva5).toBe(2500);
    expect(r.totalIva).toBe(12500);
    expect(r.total).toBe(162500);
  });

  it("handles exempt only", () => {
    const r = calculateTaxFromBase(0, 0, 30000);
    expect(r.exento).toBe(30000);
    expect(r.total).toBe(30000);
    expect(r.totalIva).toBe(0);
  });

  it("rounds correctly", () => {
    const r = calculateTaxFromBase(12345, 0, 0);
    expect(r.iva10).toBe(1235); // 12345 * 0.10 = 1234.5, rounded to 1235
  });
});

describe("calculateIre", () => {
  it("calculates IRE general", () => {
    const r = calculateIre(100000000, 40000000, 30000000, "general");
    expect(r.baseImponible).toBe(30000000);
    expect(r.tasa).toBe(0.30);
    expect(r.impuesto).toBe(9000000);
  });

  it("calculates IRE simple", () => {
    const r = calculateIre(50000000, 20000000, 10000000, "simple");
    expect(r.baseImponible).toBe(20000000);
    expect(r.tasa).toBe(0.10);
    expect(r.impuesto).toBe(2000000);
  });

  it("handles negative profit (cap at 0)", () => {
    const r = calculateIre(10000000, 15000000, 5000000, "general");
    expect(r.baseImponible).toBe(0);
    expect(r.impuesto).toBe(0);
  });
});

describe("getVencimientoIVA", () => {
  it("calculates due date based on RUC last digit", () => {
    const v = getVencimientoIVA(2026, 4, "80012345-1");
    expect(v.getFullYear()).toBe(2026);
    expect(v.getMonth()).toBe(4); // May (0-indexed)
    const expectedDay = 10 + 1; // last digit is 1
    // Could be adjusted for weekend
    const dow = new Date(2026, 4, expectedDay).getDay();
    if (dow === 0) {
      expect(v.getDate()).toBe(expectedDay + 1);
    } else if (dow === 6) {
      expect(v.getDate()).toBe(expectedDay + 2);
    } else {
      expect(v.getDate()).toBe(expectedDay);
    }
  });
});

describe("Constants", () => {
  it("has correct IVA rates", () => {
    expect(IVA_RATES.general).toBe(0.10);
    expect(IVA_RATES.reducido).toBe(0.05);
    expect(IVA_RATES.exento).toBe(0);
  });

  it("has correct IRE rates", () => {
    expect(IRE_RATES.general).toBe(0.30);
    expect(IRE_RATES.simple).toBe(0.10);
    expect(IRE_RATES.resimple).toBe(0.06);
  });

  it("has correct IRP retention rates", () => {
    expect(IRP_RETENTION_RATES.honorarios).toBe(0.10);
    expect(IRP_RETENTION_RATES.alquileres).toBe(0.10);
    expect(IRP_RETENTION_RATES.dividendos).toBe(0.06);
  });
});
