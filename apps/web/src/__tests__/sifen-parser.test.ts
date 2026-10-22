import { describe, it, expect } from "vitest";
import { suggestJournalEntry } from "@/lib/sifen-parser";
import type { SifenInvoice } from "@/lib/sifen-parser";

describe("suggestJournalEntry", () => {
  const invoice: SifenInvoice = {
    cdc: "5897185478912345678901234567890123456789012345",
    numero: "001-001-00234",
    fechaEmision: "2026-05-01",
    tipoDoc: "factura",
    condicion: "credito",
    timbrado: "12345678",
    emisor: { ruc: "80012345-0", nombre: "Importadora del Este S.A." },
    receptor: { ruc: "5001234-0", nombre: "Tech Asuncion" },
    montos: { gravado10: 10000000, gravado5: 0, exento: 0, iva10: 1000000, iva5: 0, totalIva: 1000000, total: 11000000 },
    items: [],
    direccion: "received",
  };

  it("generates lines for a purchase invoice (received)", () => {
    const result = suggestJournalEntry(invoice);
    expect(result.lines.length).toBeGreaterThan(0);
    expect(result.balanced).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("has balanced debit and credit", () => {
    const result = suggestJournalEntry(invoice);
    expect(result.balanced).toBe(true);
    expect(Math.abs(result.totalDebit - result.totalCredit)).toBeLessThan(0.01);
  });

  it("uses account 1.2.01 for merchandise purchases", () => {
    const result = suggestJournalEntry(invoice);
    const merchandiseLine = result.lines.find((l) => l.accountCode === "1.2.01");
    expect(merchandiseLine).toBeDefined();
    expect(parseFloat(merchandiseLine!.debit)).toBeGreaterThan(0);
  });

  it("uses account 1.1.06 for IVA on purchases", () => {
    const result = suggestJournalEntry(invoice);
    const ivaLine = result.lines.find((l) => l.accountCode === "1.1.06");
    expect(ivaLine).toBeDefined();
    expect(parseFloat(ivaLine!.debit)).toBeGreaterThan(0);
  });

  it("uses account 2.1.01 for payable", () => {
    const result = suggestJournalEntry(invoice);
    const payableLine = result.lines.find((l) => l.accountCode === "2.1.01");
    expect(payableLine).toBeDefined();
    expect(parseFloat(payableLine!.credit)).toBe(11000000);
  });

  it("handles sales invoices (issued direction)", () => {
    const salesInvoice: SifenInvoice = {
      ...invoice,
      direccion: "issued",
      montos: { gravado10: 5000000, gravado5: 0, exento: 0, iva10: 500000, iva5: 0, totalIva: 500000, total: 5500000 },
    };
    const result = suggestJournalEntry(salesInvoice);
    expect(result.balanced).toBe(true);
    // Should have accounts receivable or bank debit
    const debitLine = result.lines.find((l) => parseFloat(l.debit) > 0);
    expect(debitLine).toBeDefined();
    // Should have sales credit
    const salesLine = result.lines.find((l) => l.accountCode === "4.1.01");
    expect(salesLine).toBeDefined();
    expect(parseFloat(salesLine!.credit)).toBeGreaterThan(0);
  });

  it("handles credit notes correctly", () => {
    const creditNote: SifenInvoice = {
      ...invoice,
      tipoDoc: "nota_credito",
      direccion: "received",
      montos: { gravado10: -500000, gravado5: 0, exento: 0, iva10: -50000, iva5: 0, totalIva: -50000, total: -550000 },
    };
    const result = suggestJournalEntry(creditNote);
    expect(result.balanced).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("handles exempt purchases", () => {
    const exemptInvoice: SifenInvoice = {
      ...invoice,
      montos: { gravado10: 0, gravado5: 0, exento: 500000, iva10: 0, iva5: 0, totalIva: 0, total: 500000 },
    };
    const result = suggestJournalEntry(exemptInvoice);
    expect(result.balanced).toBe(true);
    const exemptLine = result.lines.find((l) => l.accountCode === "5.1.10");
    expect(exemptLine).toBeDefined();
  });

  it("handles mixed IVA rates", () => {
    const mixedInvoice: SifenInvoice = {
      ...invoice,
      montos: { gravado10: 10000000, gravado5: 5000000, exento: 0, iva10: 1000000, iva5: 250000, totalIva: 1250000, total: 16250000 },
    };
    const result = suggestJournalEntry(mixedInvoice);
    expect(result.balanced).toBe(true);
    const iva5Line = result.lines.find((l) => l.accountCode === "1.1.07");
    expect(iva5Line).toBeDefined();
  });

  it("returns rationale with suggestion", () => {
    const result = suggestJournalEntry(invoice);
    expect(result.rationale).toBeTruthy();
    expect(result.rationale.length).toBeGreaterThan(10);
  });
});
