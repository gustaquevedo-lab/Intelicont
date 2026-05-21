/**
 * SIFEN XML Parser — InteliCont
 *
 * Parses XML de facturas electrónicas del sistema SIFEN (DNIT Paraguay).
 * Soporta: factura (tipo 1), nota crédito (tipo 5), nota débito (tipo 6),
 *          autofactura (tipo 4), nota de remisión (tipo 7).
 *
 * Spec: Manual Técnico SIFEN v150 y posteriores.
 * El XML viene firmado (XAdES); aquí solo parseamos el payload sin validar firma.
 */

export type DocType = "factura" | "nota_credito" | "nota_debito" | "autofactura" | "nota_remision" | "retencion";

export interface SifenLine {
  lineNumber:  number;
  description: string;
  quantity:    number;
  unitPrice:   number;
  ivaRate:     0 | 5 | 10;
  ivaAmount:   number;
  lineTotal:   number;
}

export interface SifenDocument {
  cdc:          string | null;
  timbrado:     string | null;
  docType:      DocType;
  docNumber:    string | null;   // "001-001-0000001"
  issueDate:    string;          // "YYYY-MM-DD"
  issuerRuc:    string;
  issuerName:   string;
  receiverRuc:  string | null;
  receiverName: string | null;
  subtotal:     number;
  iva10:        number;
  iva5:         number;
  ivaExento:    number;
  total:        number;
  currency:     string;
  lines:        SifenLine[];
  rawXml:       string;
  filename:     string;
}

export interface ParseResult {
  ok:       true;
  doc:      SifenDocument;
} | {
  ok:       false;
  error:    string;
}

// ─── Type-code map (SIFEN iTiDE) ──────────────────────────────────────────────
const TYPE_MAP: Record<string, DocType> = {
  "1": "factura",
  "2": "nota_credito",  // some specs use 2 for NC
  "4": "autofactura",
  "5": "nota_credito",
  "6": "nota_debito",
  "7": "nota_remision",
  "11": "retencion",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getText(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, "i"));
  return m?.[1]?.trim() ?? "";
}

function getFloat(xml: string, tag: string): number {
  return parseFloat(getText(xml, tag) || "0") || 0;
}

function getAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i"));
  return m?.[1]?.trim() ?? "";
}

/** Extract all occurrences of a repeating tag block */
function getAllBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[\\s>][\\s\\S]*?<\\/${tag}>`, "gi");
  return xml.match(re) ?? [];
}

// ─── Date normalization ────────────────────────────────────────────────────────
function normalizeDate(raw: string): string {
  // SIFEN uses YYYY-MM-DD or YYYY-MM-DDThh:mm:ss
  if (!raw) return new Date().toISOString().split("T")[0];
  const d = raw.slice(0, 10); // take YYYY-MM-DD part
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : new Date().toISOString().split("T")[0];
}

// ─── IVA rate normalization ────────────────────────────────────────────────────
function normalizeIvaRate(raw: string | number): 0 | 5 | 10 {
  const n = Number(raw);
  if (n === 5)  return 5;
  if (n === 10) return 10;
  return 0;
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseSifenXml(xml: string, filename = "documento.xml"): ParseResult {
  try {
    // ── CDC ────────────────────────────────────────────────────────────────────
    const cdc = getText(xml, "CDC") || getText(xml, "dCDC") || getText(xml, "Id") || null;

    // ── Timbrado ───────────────────────────────────────────────────────────────
    const timbrado = getText(xml, "dNumTim") || getText(xml, "nroTimbrado") || getText(xml, "timbrado") || null;

    // ── Document type ──────────────────────────────────────────────────────────
    const rawType = getText(xml, "iTiDE") || getText(xml, "tipoDocumento") || getText(xml, "tipo") || "1";
    const docType: DocType = TYPE_MAP[rawType] ?? "factura";

    // ── Document number (establecimiento-punto-numero) ─────────────────────────
    const estab  = getText(xml, "dEst")  || getText(xml, "establecimiento") || "001";
    const punto  = getText(xml, "dPunExp")|| getText(xml, "puntoExpedicion") || "001";
    const numero = getText(xml, "dNumDoc")|| getText(xml, "numeroDocumento")  || getText(xml, "nroDocumento") || "0000001";
    const docNumber = `${estab.padStart(3,"0")}-${punto.padStart(3,"0")}-${numero.padStart(7,"0")}`;

    // ── Issue date ─────────────────────────────────────────────────────────────
    const rawDate   = getText(xml, "dFeEmiDE") || getText(xml, "fechaEmision") || getText(xml, "dFecFirma") || "";
    const issueDate = normalizeDate(rawDate);

    // ── Issuer (emisor) ────────────────────────────────────────────────────────
    const issuerRuc  = getText(xml, "dRucEm")   || getText(xml, "rucEmisor")   || getText(xml, "dRUCEmi") || "";
    const issuerName = getText(xml, "dNomEmi")  || getText(xml, "razonSocialEmisor") || getText(xml, "dNomRazSocEmi") || "";

    if (!issuerRuc) {
      return { ok: false, error: "RUC del emisor no encontrado en el XML" };
    }

    // ── Receiver (receptor) ────────────────────────────────────────────────────
    const receiverRuc  = getText(xml, "dRucRec")  || getText(xml, "rucReceptor")  || getText(xml, "dRUCRec")  || null;
    const receiverName = getText(xml, "dNomRec")  || getText(xml, "razonSocialReceptor") || getText(xml, "dNomRazSocRec") || null;

    // ── Currency ───────────────────────────────────────────────────────────────
    const currency = getText(xml, "cMoneOpe") || getText(xml, "moneda") || "PYG";

    // ── Totals ─────────────────────────────────────────────────────────────────
    // Try multiple tag names (SIFEN versions vary)
    const iva10 = getFloat(xml, "dTotOpe10") || getFloat(xml, "ivaGravado10") || getFloat(xml, "ivaGravadoTasa10");
    const iva5  = getFloat(xml, "dTotOpe5")  || getFloat(xml, "ivaGravado5")  || getFloat(xml, "ivaGravadoTasa5");
    const ivaEx = getFloat(xml, "dTotExe")   || getFloat(xml, "montoExento")  || getFloat(xml, "totalExento");

    let total = getFloat(xml, "dTotGralOpe") || getFloat(xml, "montoTotal") || getFloat(xml, "totalGeneral");

    // Subtotal (before IVA — in PY IVA is included in price)
    const subtotal10 = getFloat(xml, "dBasGravIva10") || getFloat(xml, "baseImponible10") || (iva10 ? iva10 / 0.10 * 0.90 : 0);
    const subtotal5  = getFloat(xml, "dBasGravIva5")  || getFloat(xml, "baseImponible5")  || (iva5  ? iva5  / 0.05 * 0.95 : 0);
    const subtotal   = subtotal10 + subtotal5 + ivaEx;

    // ── Line items ─────────────────────────────────────────────────────────────
    const lineBlocks = getAllBlocks(xml, "gCamItem") || getAllBlocks(xml, "item") || getAllBlocks(xml, "detalle");

    const lines: SifenLine[] = lineBlocks.map((block, idx) => {
      const desc      = getText(block, "dDesProSer") || getText(block, "descripcion") || getText(block, "dDesProd") || `Ítem ${idx + 1}`;
      const qty       = getFloat(block, "dCantProSer") || getFloat(block, "cantidad") || 1;
      const unitPrice = getFloat(block, "dPUniProSer") || getFloat(block, "precioUnitario") || getFloat(block, "dPrecUniSinIva") || 0;
      const rawRate   = getText(block, "cTasaIva") || getText(block, "tasaIva") || getText(block, "ivaRate") || "10";
      const ivaRate   = normalizeIvaRate(rawRate);
      const ivaAmt    = getFloat(block, "dIvaItem") || getFloat(block, "montoIva") || 0;
      const lineTotal = getFloat(block, "dTotBruOpeItem") || getFloat(block, "totalItem") || (qty * unitPrice);

      return {
        lineNumber:  idx + 1,
        description: desc,
        quantity:    qty,
        unitPrice,
        ivaRate,
        ivaAmount:   ivaAmt,
        lineTotal,
      };
    });

    // If no lines found, create synthetic line from totals
    if (lines.length === 0 && total > 0) {
      lines.push({
        lineNumber:  1,
        description: `${docType === "factura" ? "Factura" : docType} ${docNumber}`,
        quantity:    1,
        unitPrice:   total,
        ivaRate:     10,
        ivaAmount:   iva10,
        lineTotal:   total,
      });
    }

    // If total is still 0, sum from lines
    if (!total && lines.length > 0) {
      total = lines.reduce((s, l) => s + l.lineTotal, 0);
    }

    return {
      ok: true,
      doc: {
        cdc,
        timbrado,
        docType,
        docNumber,
        issueDate,
        issuerRuc,
        issuerName,
        receiverRuc: receiverRuc || null,
        receiverName: receiverName || null,
        subtotal:    Math.round(subtotal * 10000) / 10000,
        iva10:       Math.round(iva10   * 10000) / 10000,
        iva5:        Math.round(iva5    * 10000) / 10000,
        ivaExento:   Math.round(ivaEx   * 10000) / 10000,
        total:       Math.round(total   * 10000) / 10000,
        currency,
        lines,
        rawXml:      xml,
        filename,
      },
    };
  } catch (err) {
    return {
      ok:    false,
      error: `Error al parsear XML: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── Validation helpers ────────────────────────────────────────────────────────

export function validateCDC(cdc: string): boolean {
  return /^\d{44}$/.test(cdc);
}

export function validateTimbrado(t: string): boolean {
  return /^\d{6,15}$/.test(t);
}
