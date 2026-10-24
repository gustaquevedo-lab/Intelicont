/**
 * Parser XML SIFEN — Facturas Electrónicas Paraguay
 *
 * Extrae datos de XML de facturas SIFEN (DNIT) y los mapea
 * a estructuras contables para sugerencia de asiento automático.
 */

import { parseSifenDE, type SifenDocument } from "@intelicont/ledger/sifen";

export interface SifenInvoice {
  cdc: string;
  numero: string;
  fechaEmision: string;
  tipoDoc: "factura" | "nota_credito" | "nota_debito" | "recibo";
  condicion: "contado" | "credito";
  timbrado: string;
  emisor: {
    ruc: string;
    nombre: string;
    nombreFantasia?: string;
  };
  receptor: {
    ruc: string;
    nombre: string;
  };
  montos: {
    gravado10: number;
    gravado5: number;
    exento: number;
    iva10: number;
    iva5: number;
    totalIva: number;
    total: number;
  };
  items: SifenItem[];
  direccion: string;
}

export interface SifenItem {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  ivaRate: number;
  total: number;
}

const TIPO_DOC: Record<SifenDocument["docType"], SifenInvoice["tipoDoc"]> = {
  invoice: "factura",
  self_invoice: "factura",
  remito: "factura",
  credit_note: "nota_credito",
  debit_note: "nota_debito",
};

/** Adapter over the server-side parser (parseSifenDE) for the existing UI shape. */
export function parseSifenXML(xmlString: string): SifenInvoice | null {
  const r = parseSifenDE(xmlString);
  if (!r.ok) return null;
  const d = r.value;
  return {
    cdc: d.cdc,
    numero: d.number,
    fechaEmision: d.issueDate,
    tipoDoc: TIPO_DOC[d.docType],
    condicion: d.condition === "credit" ? "credito" : "contado",
    timbrado: d.timbrado,
    emisor: { ruc: `${d.issuer.ruc}-${d.issuer.dv}`, nombre: d.issuer.name },
    receptor: { ruc: d.receiver.dv === null ? d.receiver.ruc : `${d.receiver.ruc}-${d.receiver.dv}`, nombre: d.receiver.name },
    montos: {
      gravado10: d.gravado10,
      gravado5: d.gravado5,
      exento: d.exento,
      iva10: d.iva10,
      iva5: d.iva5,
      totalIva: d.iva10 + d.iva5,
      total: d.total,
    },
    items: d.lines.map((l) => ({
      codigo: l.code,
      descripcion: l.description,
      cantidad: l.quantity,
      precioUnitario: l.unitPrice,
      ivaRate: l.ivaRate,
      total: l.amount,
    })),
    direccion: TIPO_DOC[d.docType] === "factura" ? "received" : "issued",
  };
}

/**
 * Generates a suggested journal entry from a parsed SIFEN invoice.
 * This simulates the AI suggestion engine.
 */
export function suggestJournalEntry(invoice: SifenInvoice) {
  const lines: Array<{
    accountCode: string;
    accountName: string;
    debit: string;
    credit: string;
    description: string;
  }> = [];

  const isCreditNote = invoice.tipoDoc === "nota_credito";
  const isDebitNote = invoice.tipoDoc === "nota_debito";

  if (invoice.direccion === "received") {
    // Purchase invoice or credit/debit note received

    if (isCreditNote) {
      // Credit note reverses a purchase — debit supplier, credit merchandise/IVA
      if (Math.abs(invoice.montos.gravado10) > 0) {
        lines.push({
          accountCode: "1.2.01",
          accountName: "Mercaderías",
          debit: "",
          credit: Math.abs(invoice.montos.gravado10).toFixed(2),
          description: `NC — Devolución compra gravada 10% — ${invoice.numero}`,
        });
      }
      if (Math.abs(invoice.montos.gravado5) > 0) {
        lines.push({
          accountCode: "1.2.01",
          accountName: "Mercaderías",
          debit: "",
          credit: Math.abs(invoice.montos.gravado5).toFixed(2),
          description: `NC — Devolución compra gravada 5% — ${invoice.numero}`,
        });
      }
      if (Math.abs(invoice.montos.exento) > 0) {
        lines.push({
          accountCode: "5.1.10",
          accountName: "Otros Gastos",
          debit: "",
          credit: Math.abs(invoice.montos.exento).toFixed(2),
          description: `NC — Devolución compra exenta — ${invoice.numero}`,
        });
      }
      if (Math.abs(invoice.montos.iva10) > 0) {
        lines.push({
          accountCode: "1.1.06",
          accountName: "IVA Crédito Fiscal",
          debit: "",
          credit: Math.abs(invoice.montos.iva10).toFixed(2),
          description: `NC — Reversión IVA 10% — ${invoice.numero}`,
        });
      }
      if (Math.abs(invoice.montos.iva5) > 0) {
        lines.push({
          accountCode: "1.1.07",
          accountName: "IVA Crédito Fiscal 5%",
          debit: "",
          credit: Math.abs(invoice.montos.iva5).toFixed(2),
          description: `NC — Reversión IVA 5% — ${invoice.numero}`,
        });
      }
      // Debit supplier for the total
      lines.push({
        accountCode: "2.1.01",
        accountName: "Cuentas a Pagar Proveedores",
        debit: Math.abs(invoice.montos.total).toFixed(2),
        credit: "",
        description: `NC — Proveedor: ${invoice.emisor.nombre}`,
      });
    } else {
      // Regular purchase invoice or debit note
      if (invoice.montos.gravado10 > 0) {
        lines.push({
          accountCode: "1.2.01",
          accountName: "Mercaderías",
          debit: invoice.montos.gravado10.toFixed(2),
          credit: "",
          description: `Compra gravada 10% — Factura ${invoice.numero}`,
        });
      }
      if (invoice.montos.gravado5 > 0) {
        lines.push({
          accountCode: "1.2.01",
          accountName: "Mercaderías",
          debit: invoice.montos.gravado5.toFixed(2),
          credit: "",
          description: `Compra gravada 5% — Factura ${invoice.numero}`,
        });
      }
      if (invoice.montos.exento > 0) {
        lines.push({
          accountCode: "5.1.10",
          accountName: "Otros Gastos",
          debit: invoice.montos.exento.toFixed(2),
          credit: "",
          description: `Compra exenta — Factura ${invoice.numero}`,
        });
      }
      if (invoice.montos.iva10 > 0) {
        lines.push({
          accountCode: "1.1.06",
          accountName: "IVA Crédito Fiscal",
          debit: invoice.montos.iva10.toFixed(2),
          credit: "",
          description: `IVA 10% — Factura ${invoice.numero}`,
        });
      }
      if (invoice.montos.iva5 > 0) {
        lines.push({
          accountCode: "1.1.07",
          accountName: "IVA Crédito Fiscal 5%",
          debit: invoice.montos.iva5.toFixed(2),
          credit: "",
          description: `IVA 5% — Factura ${invoice.numero}`,
        });
      }
      lines.push({
        accountCode: "2.1.01",
        accountName: "Cuentas a Pagar Proveedores",
        debit: "",
        credit: invoice.montos.total.toFixed(2),
        description: `Proveedor: ${invoice.emisor.nombre} — ${invoice.condicion}`,
      });
    }
  } else {
    // Sales invoice
    if (invoice.montos.total > 0) {
      lines.push({
        accountCode: invoice.condicion === "contado" ? "1.1.02" : "1.1.05",
        accountName: invoice.condicion === "contado" ? "Banco" : "Cuentas a Cobrar Clientes",
        debit: invoice.montos.total.toFixed(2),
        credit: "",
        description: `Venta — Factura ${invoice.numero}`,
      });
    }
    lines.push({
      accountCode: "4.1.01",
      accountName: "Ventas de Mercaderías",
      debit: "",
      credit: (invoice.montos.gravado10 + invoice.montos.gravado5 + invoice.montos.exento).toFixed(2),
      description: `Venta gravada — Factura ${invoice.numero}`,
    });
    if (invoice.montos.iva10 > 0) {
      lines.push({
        accountCode: "2.1.02",
        accountName: "IVA Débito Fiscal",
        debit: "",
        credit: invoice.montos.iva10.toFixed(2),
        description: `IVA 10% débito — Factura ${invoice.numero}`,
      });
    }
    if (invoice.montos.iva5 > 0) {
      lines.push({
        accountCode: "2.1.03",
        accountName: "IVA Débito Fiscal 5%",
        debit: "",
        credit: invoice.montos.iva5.toFixed(2),
        description: `IVA 5% débito — Factura ${invoice.numero}`,
      });
    }
  }

  // Verify balance
  const totalDebit = lines.reduce((sum, l) => sum + parseFloat(l.debit || "0"), 0);
  const totalCredit = lines.reduce((sum, l) => sum + parseFloat(l.credit || "0"), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return {
    lines,
    totalDebit,
    totalCredit,
    balanced,
    confidence: balanced ? 0.95 : 0.7,
    rationale: balanced
      ? "Asiento generado según reglas contables paraguayas. Débitos y créditos balanceados."
      : "Se requiere ajuste manual — diferencia detectada.",
  };
}
