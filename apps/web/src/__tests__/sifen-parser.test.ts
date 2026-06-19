import { describe, it, expect } from "vitest";
import { parseSifenXML, suggestJournalEntry } from "@/lib/sifen-parser";
import type { SifenInvoice } from "@/lib/sifen-parser";

const validInvoiceXML = `<?xml version="1.0" encoding="UTF-8"?>
<rRoot>
  <dEmis>5897185478912345678901234567890123456789012345</dEmis>
  <dTimbrado>12345678</dTimbrado>
  <dNroEstab>001</dNroEstab>
  <dPtoExp>001</dPtoExp>
  <dNroDoc>00234</dNroDoc>
  <dFEEmis>2026-05-01</dFEEmis>
  <cTiOpe>1</cTiOpe>
  <cCond>2</cCond>
  <dRucEmis>80012345-1</dRucEmis>
  <dNomEmis>Importadora del Este S.A.</dNomEmis>
  <dNomFanEmis>ImportEste</dNomFanEmis>
  <dRucRece>5001234-0</dRucRece>
  <dNomRece>Tech Asuncion</dNomRece>
  <dTotGrav10>10000000</dTotGrav10>
  <dTotExe>0</dTotExe>
  <dTotIVA10>1000000</dTotIVA10>
  <dTotIVA5>0</dTotIVA5>
  <dTotOpe>11000000</dTotOpe>
</rRoot>`;

const creditNoteXML = `<?xml version="1.0" encoding="UTF-8"?>
<rRoot>
  <dEmis>5897185478912345678901234567890123456789012345</dEmis>
  <dTimbrado>87654321</dTimbrado>
  <dNroEstab>001</dNroEstab>
  <dPtoExp>001</dPtoExp>
  <dNroDoc>00056</dNroDoc>
  <dFEEmis>2026-05-05</dFEEmis>
  <cTiOpe>2</cTiOpe>
  <cCond>2</cCond>
  <dRucEmis>1234567-8</dRucEmis>
  <dNomEmis>Distribuciones Nanduti</dNomEmis>
  <dRucRece>80012345-1</dRucRece>
  <dNomRece>Importadora del Este</dNomRece>
  <dTotGrav10>-500000</dTotGrav10>
  <dTotExe>0</dTotExe>
  <dTotIVA10>-50000</dTotIVA10>
  <dTotIVA5>0</dTotIVA5>
  <dTotOpe>-550000</dTotOpe>
</rRoot>`;

const invoiceWithItemsXML = `<?xml version="1.0" encoding="UTF-8"?>
<rRoot>
  <dEmis>5897185478912345678901234567890123456789012345</dEmis>
  <dTimbrado>11111111</dTimbrado>
  <dNroEstab>001</dNroEstab>
  <dPtoExp>001</dPtoExp>
  <dNroDoc>00001</dNroDoc>
  <dFEEmis>2026-05-01</dFEEmis>
  <cTiOpe>1</cTiOpe>
  <cCond>1</cCond>
  <dRucEmis>80012345-1</dRucEmis>
  <dNomEmis>Importadora del Este</dNomEmis>
  <dRucRece>5001234-0</dRucRece>
  <dNomRece>Tech Asuncion</dNomRece>
  <dTotGrav10>10000000</dTotGrav10>
  <dTotIVA10>1000000</dTotIVA10>
  <dTotOpe>11000000</dTotOpe>
</rRoot>`;

describe("parseSifenXML", () => {
  it("parses a valid purchase invoice XML", () => {
    const result = parseSifenXML(validInvoiceXML);
    expect(result).not.toBeNull();
    expect(result!.cdc).toBe("5897185478912345678901234567890123456789012345");
    expect(result!.timbrado).toBe("12345678");
    expect(result!.numero).toBe("001-001-00234");
    expect(result!.fechaEmision).toBe("2026-05-01");
    expect(result!.tipoDoc).toBe("factura");
    expect(result!.condicion).toBe("credito");
  });

  it("extracts emitter data correctly", () => {
    const result = parseSifenXML(validInvoiceXML);
    expect(result!.emisor.ruc).toBe("80012345-1");
    expect(result!.emisor.nombre).toBe("Importadora del Este S.A.");
    expect(result!.emisor.nombreFantasia).toBe("ImportEste");
  });

  it("extracts receiver data correctly", () => {
    const result = parseSifenXML(validInvoiceXML);
    expect(result!.receptor.ruc).toBe("5001234-0");
    expect(result!.receptor.nombre).toBe("Tech Asuncion");
  });

  it("extracts amounts correctly", () => {
    const result = parseSifenXML(validInvoiceXML);
    expect(result!.montos.gravado10).toBe(10000000);
    expect(result!.montos.iva10).toBe(1000000);
    expect(result!.montos.totalIva).toBe(1000000);
    expect(result!.montos.total).toBe(11000000);
    expect(result!.montos.exento).toBe(0);
  });

  it("parses credit note XML", () => {
    const result = parseSifenXML(creditNoteXML);
    expect(result).not.toBeNull();
    expect(result!.tipoDoc).toBe("nota_credito");
    expect(result!.montos.gravado10).toBe(-500000);
    expect(result!.montos.iva10).toBe(-50000);
    expect(result!.montos.total).toBe(-550000);
  });

  it("parses contado (cash) condition", () => {
    const result = parseSifenXML(invoiceWithItemsXML);
    expect(result!.condicion).toBe("contado");
  });

  it("returns null for invalid XML", () => {
    const result = parseSifenXML("not valid xml");
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = parseSifenXML("");
    expect(result).toBeNull();
  });

  it("handles missing fields gracefully", () => {
    const minimalXML = `<?xml version="1.0"?><root><dNroEstab>001</dNroEstab></root>`;
    const result = parseSifenXML(minimalXML);
    expect(result).not.toBeNull();
    expect(result!.numero).toBe("001--");
  });
});

describe("suggestJournalEntry", () => {
  const invoice: SifenInvoice = {
    cdc: "5897185478912345678901234567890123456789012345",
    numero: "001-001-00234",
    fechaEmision: "2026-05-01",
    tipoDoc: "factura",
    condicion: "credito",
    timbrado: "12345678",
    emisor: { ruc: "80012345-1", nombre: "Importadora del Este S.A." },
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
