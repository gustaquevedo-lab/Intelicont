/**
 * Parser XML SIFEN — Facturas Electrónicas Paraguay
 *
 * Extrae datos de XML de facturas SIFEN (DNIT) y los mapea
 * a estructuras contables para sugerencia de asiento automático.
 */

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

export function parseSifenXML(xmlString: string): SifenInvoice | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Check for parse errors
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) return null;

    // CDC
    const cdc = getTagValue(xmlDoc, "dEmis") || getTagValue(xmlDoc, "CDC") || "";

    // Timbrado
    const timbrado = getTagValue(xmlDoc, "dTimbrado") || getTagValue(xmlDoc, "Timbrado") || "";

    // Number
    const numeroEstablecimiento = getTagValue(xmlDoc, "dNroEstab") || "";
    const numeroPuntoVenta = getTagValue(xmlDoc, "dPtoExp") || "";
    const numeroDocumento = getTagValue(xmlDoc, "dNroDoc") || "";
    const numero = `${numeroEstablecimiento}-${numeroPuntoVenta}-${numeroDocumento}`;

    // Date
    const fechaEmision = getTagValue(xmlDoc, "dFEEmis") || getTagValue(xmlDoc, "FechaEmision") || "";

    // Type
    const tipoDocumento = getTagValue(xmlDoc, "cTiOpe") || getTagValue(xmlDoc, "TipoDocumento") || "";
    let tipoDoc: SifenInvoice["tipoDoc"] = "factura";
    if (tipoDocumento === "2" || tipoDocumento.includes("credito")) tipoDoc = "nota_credito";
    if (tipoDocumento === "3" || tipoDocumento.includes("debito")) tipoDoc = "nota_debito";
    if (tipoDocumento === "4" || tipoDocumento.includes("recibo")) tipoDoc = "recibo";

    // Condition
    const condicion = getTagValue(xmlDoc, "cCond") || getTagValue(xmlDoc, "Condicion") || "";
    const condicionFinal: "contado" | "credito" = condicion === "2" ? "credito" : "contado";

    // Emitter
    const emisorRuc = getTagValue(xmlDoc, "dRucEmis") || getTagValue(xmlDoc, "RucEmisor") || "";
    const emisorNombre = getTagValue(xmlDoc, "dNomEmis") || getTagValue(xmlDoc, "NombreEmisor") || getTagValue(xmlDoc, "EmiNom") || "";
    const emisorFantasia = getTagValue(xmlDoc, "dNomFanEmis") || getTagValue(xmlDoc, "NombreFantasia") || "";

    // Receiver
    const receptorRuc = getTagValue(xmlDoc, "dRucRece") || getTagValue(xmlDoc, "RucReceptor") || "";
    const receptorNombre = getTagValue(xmlDoc, "dNomRece") || getTagValue(xmlDoc, "NombreReceptor") || "";

    // Amounts
    const gravado10 = parseFloat(getTagValue(xmlDoc, "dTotGrav10") || getTagValue(xmlDoc, "dTot Grav 10") || getTagValue(xmlDoc, "TotGralItem") || "0");
    const gravado5 = parseFloat(getTagValue(xmlDoc, "dTotGrav5") || getTagValue(xmlDoc, "dTot Grav 5") || getTagValue(xmlDoc, "TotGralItem5") || "0");
    const exento = parseFloat(getTagValue(xmlDoc, "dTot Exe") || getTagValue(xmlDoc, "TotExe") || "0");
    const iva10 = parseFloat(getTagValue(xmlDoc, "dTotIVA10") || getTagValue(xmlDoc, "Iva10") || "0");
    const iva5 = parseFloat(getTagValue(xmlDoc, "dTotIVA5") || getTagValue(xmlDoc, "Iva5") || "0");
    const totalIva = iva10 + iva5;
    const total = parseFloat(getTagValue(xmlDoc, "dTotOpe") || getTagValue(xmlDoc, "Total") || "0") || (gravado10 + gravado5 + exento + totalIva);

    // Items
    const items: SifenItem[] = [];
    const itemElements = xmlDoc.querySelectorAll("dDetItem, Item");
    itemElements.forEach((el) => {
      const parent = el.parentElement;
      if (parent) {
        items.push({
          codigo: getTagValue(xmlDoc, "dCodProd") || "",
          descripcion: getTagValue(xmlDoc, "dDSProd") || "",
          cantidad: parseFloat(getTagValue(xmlDoc, "dCant") || "1"),
          precioUnitario: parseFloat(getTagValue(xmlDoc, "dPUni") || "0"),
          ivaRate: parseFloat(getTagValue(xmlDoc, "cIVA") || "10"),
          total: parseFloat(getTagValue(xmlDoc, "dTotItem") || "0"),
        });
      }
    });

    return {
      cdc,
      numero: numero || "S/N",
      fechaEmision,
      tipoDoc,
      condicion: condicionFinal,
      timbrado,
      emisor: {
        ruc: emisorRuc,
        nombre: emisorNombre,
        nombreFantasia: emisorFantasia || undefined,
      },
      receptor: {
        ruc: receptorRuc,
        nombre: receptorNombre,
      },
      montos: {
        gravado10: gravado10 || 0,
        gravado5: gravado5 || 0,
        exento: exento || 0,
        iva10: iva10 || 0,
        iva5: iva5 || 0,
        totalIva,
        total,
      },
      items,
      direccion: tipoDoc === "factura" ? "received" : "issued",
    };
  } catch {
    return null;
  }
}

function getTagValue(doc: Document, tagName: string): string {
  // Try exact match first
  let el = doc.getElementsByTagName(tagName)[0];
  if (el?.textContent) return el.textContent.trim();

  // Try case-insensitive search
  const allElements = doc.getElementsByTagName("*");
  for (let i = 0; i < allElements.length; i++) {
    if (allElements[i].tagName.toLowerCase() === tagName.toLowerCase()) {
      return allElements[i].textContent?.trim() || "";
    }
  }

  return "";
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
