import { describe, it, expect } from "vitest";
import { generateCDC, validateCDCStructure, generateSecurityCode, generateInvoiceData } from "@/lib/cdc-generator";
import { calculateRetentions, calculateNetPayable } from "@/lib/retentions-engine";
import { matchBankToGL } from "@/lib/bank-matcher";
import { parseBankCSV } from "@/lib/bank-parser";

describe("CDC Generator", () => {
  it("generates a 44-digit CDC", () => {
    const cdc = generateCDC({
      rucEmisor: "80012345",
      dvEmisor: "1",
      tipoDocumento: 1,
      establecimiento: "001",
      puntoEmision: "001",
      numeroDocumento: "0000234",
      fechaProcesamiento: "2026-05-01",
      codigoSeguridad: "123456",
    });
    expect(cdc.length).toBe(44);
    expect(/^\d{44}$/.test(cdc)).toBe(true);
  });

  it("validates a correct CDC structure", () => {
    const cdc = generateCDC({
      rucEmisor: "80012345",
      dvEmisor: "1",
      tipoDocumento: 1,
      establecimiento: "001",
      puntoEmision: "001",
      numeroDocumento: "0000234",
      fechaProcesamiento: "2026-05-01",
      codigoSeguridad: "123456",
    });
    const result = validateCDCStructure(cdc);
    expect(result.valid).toBe(true);
  });

  it("rejects CDC with wrong length", () => {
    const result = validateCDCStructure("12345");
    expect(result.valid).toBe(false);
  });

  it("rejects CDC with non-numeric characters", () => {
    const result = validateCDCStructure("a".repeat(44));
    expect(result.valid).toBe(false);
  });

  it("generates 6-digit security code", () => {
    const code = generateSecurityCode();
    expect(code.length).toBe(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("generates complete invoice data with CDC and numero", () => {
    const data = generateInvoiceData({
      rucEmisor: "80012345",
      dvEmisor: "1",
      tipoDocumento: 1,
      establecimiento: "001",
      puntoEmision: "001",
      numeroDocumento: "0000234",
      fecha: "2026-05-01",
    });
    expect(data.cdc.length).toBe(44);
    expect(data.numero).toBe("001-001-0000234");
  });
});

describe("Retentions Engine", () => {
  it("calculates IRP retention on honorarios", () => {
    const result = calculateRetentions({
      gravado10: 2500000, gravado5: 0, exento: 0,
      iva10: 250000, iva5: 0, total: 2750000,
      concept: "Honorarios profesionales",
      partner: { regime: "general" },
    });
    const irp = result.find((r) => r.type === "irp");
    expect(irp).toBeDefined();
    expect(irp!.rate).toBe(0.10);
    expect(irp!.amount).toBeGreaterThan(0);
  });

  it("respects partner retention config", () => {
    const result = calculateRetentions({
      gravado10: 1000000, gravado5: 0, exento: 0,
      iva10: 100000, iva5: 0, total: 1100000,
      concept: "Servicios",
      partner: { regime: "simple", retentionConfig: { iva: false, ire: false } },
    });
    const iva = result.find((r) => r.type === "iva");
    expect(iva).toBeUndefined();
  });

  it("skips below minimum amount", () => {
    const result = calculateRetentions({
      gravado10: 10000, gravado5: 0, exento: 0,
      iva10: 1000, iva5: 0, total: 11000,
      concept: "Servicios",
    });
    expect(result.length).toBe(0);
  });

  it("calculates net payable after retentions", () => {
    const retentions = [
      { type: "irp" as const, concept: "IRP", base: 1000000, rate: 0.10, amount: 100000, certificateRequired: true },
      { type: "iva" as const, concept: "IVA", base: 1000000, rate: 0.30, amount: 300000, certificateRequired: false },
    ];
    const net = calculateNetPayable(1100000, retentions);
    expect(net).toBe(700000);
  });
});

describe("Bank Auto-Matching", () => {
  it("matches exact amount + same date", () => {
    const bank = [{ id: "b1", date: "2026-05-01", amount: 11000000, direction: "debit" as const, description: "Pago proveedor", ref: "CHQ-001" }];
    const gl = [{ id: "g1", date: "2026-05-01", amount: 11000000, direction: "credit" as const, description: "Pago Importadora del Este", partnerName: "ImportEste" }];

    const result = matchBankToGL(bank, gl);
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].score).toBeGreaterThanOrEqual(60);
    expect(result.matches[0].confidence).toBe("medium");
  });

  it("matches with date tolerance", () => {
    const bank = [{ id: "b1", date: "2026-05-03", amount: 5000000, direction: "debit" as const, description: "Pago servicios", ref: "TRF-002" }];
    const gl = [{ id: "g1", date: "2026-05-04", amount: 5000000, direction: "credit" as const, description: "Pago SerConPy", partnerName: "SerConPy" }];

    const result = matchBankToGL(bank, gl);
    expect(result.matches.length).toBe(1);
    expect(result.matches[0].confidence).toBe("medium");
  });

  it("skips same direction (debit-debit)", () => {
    const bank = [{ id: "b1", date: "2026-05-01", amount: 5000000, direction: "debit" as const, description: "", ref: "" }];
    const gl = [{ id: "g1", date: "2026-05-01", amount: 5000000, direction: "debit" as const, description: "", partnerName: "" }];

    const result = matchBankToGL(bank, gl);
    expect(result.matches.length).toBe(0);
  });

  it("identifies unmatched items", () => {
    const bank = [
      { id: "b1", date: "2026-05-01", amount: 11000000, direction: "debit" as const, description: "Pago", ref: "" },
      { id: "b2", date: "2026-05-10", amount: 3000000, direction: "credit" as const, description: "Desconocido", ref: "" },
    ];
    const gl = [
      { id: "g1", date: "2026-05-01", amount: 11000000, direction: "credit" as const, description: "Pago", partnerName: "" },
    ];

    const result = matchBankToGL(bank, gl);
    expect(result.matches.length).toBe(1);
    expect(result.unmatchedBank.length).toBe(1);
    expect(result.unmatchedGL.length).toBe(0);
  });
});

describe("Bank CSV Parser", () => {
  it("parses GNB-style CSV", () => {
    const csv = `Fecha,Descripción,Referencia,Crédito,Débito
01/05/2026,"Pago proveedor ImportEste","CHQ-001",0,11000000
03/05/2026,"Cobro cliente","DEP-002",5000000,0`;

    const result = parseBankCSV(csv, "gnb");
    expect(result.success).toBe(true);
    expect(result.movements.length).toBe(2);
    expect(result.movements[0].direction).toBe("debit");
    expect(result.movements[0].amount).toBe(11000000);
    expect(result.movements[1].direction).toBe("credit");
    expect(result.movements[1].amount).toBe(5000000);
  });

  it("parses CSV with single amount column", () => {
    const csv = `Fecha,Descripción,Importe
01/05/2026,"Pago",-5000000
02/05/2026,"Cobro",3000000`;

    const result = parseBankCSV(csv, "gnb");
    expect(result.success).toBe(true);
    expect(result.movements.length).toBe(2);
    expect(result.movements[0].direction).toBe("debit");
    expect(result.movements[0].amount).toBe(5000000);
    expect(result.movements[1].direction).toBe("credit");
    expect(result.movements[1].amount).toBe(3000000);
  });

  it("handles empty CSV", () => {
    const result = parseBankCSV("");
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("handles semicolon delimiters", () => {
    const csv = `Fecha;Descripción;Importe
01/05/2026;Pago;-1000000`;

    const result = parseBankCSV(csv, "gnb");
    expect(result.movements.length).toBe(1);
    expect(result.movements[0].amount).toBe(1000000);
  });
});
