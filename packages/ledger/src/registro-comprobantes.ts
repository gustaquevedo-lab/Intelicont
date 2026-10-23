// Registro de Comprobantes, obligación 955 (monthly), per DNIT's "Especificación Técnica para registro de
// comprobantes en Marangatu" (June 2021). Only the VENTAS (type 1) and COMPRAS (type 2) records.
// Pure: no I/O. Electronic documents (SIFEN e-kuatia) are left out: Marangatu already has them.
import { strToU8, zipSync } from "fflate";
import { TABLA_3, isSupportedInRegistro, type RegistroSide } from "./registro-codes";

export type RegistroDoc = {
  documentId: string;
  side: RegistroSide;
  docCode: number;
  counterpartyIdType: number;
  /** Without DV. */
  counterpartyId: string;
  counterpartyName: string;
  /** YYYY-MM-DD */
  issueDate: string;
  timbrado: string;
  number: string;
  gravado10: number;
  gravado5: number;
  exento: number;
  total: number;
  condition: "cash" | "credit";
  foreignCurrency: boolean;
  imputaIva: boolean;
  imputaIre: boolean;
  imputaIrp: boolean;
  noImputa: boolean;
  relatedNumber?: string | null;
  relatedTimbrado?: string | null;
  isElectronic: boolean;
};

export type RegistroFile = { name: string; csv: string; rows: number };
export type RegistroError = { documentId: string; message: string };
export type RegistroResult = {
  files: RegistroFile[];
  errors: RegistroError[];
  excluded: { electronic: number };
  /** Rows emitted per side. */
  counts: { ventas: number; compras: number };
};

// shortcut: the PDF text says comma but its examples use ';' — confirm with a real import in Marangatu
const DELIMITER = ";";
// shortcut: the PDF does not name a line terminator; '\n' is unverified — confirm with a real import in Marangatu
const EOL = "\n";
export const MAX_ROWS_PER_FILE = 5000;

/** Compras codes that report only MONTO TOTAL (fields 9-11 = 0). Ventas have no such exception. */
const TOTAL_ONLY_COMPRAS = new Set([101, 104, 105, 112]);
/** Id types whose name is not required (the name comes from Marangatu's registry). */
const NAME_OPTIONAL: Record<RegistroSide, Set<number>> = { ventas: new Set([11, 12, 15]), compras: new Set([11, 12]) };
/** Codes whose NÚMERO DEL COMPROBANTE is not required. */
const NUMBER_OPTIONAL: Record<RegistroSide, Set<number>> = { ventas: new Set([106, 112]), compras: new Set([106, 107, 112]) };
const IMPORT_DISPATCH = 107; // compras: timbrado must be 0
const NUMBER_RE = /^\d{3}-\d{3}-\d{7}$/;
const TIMBRADO_RE = /^\d{8}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Removes the delimiter, quotes and control whitespace, collapses spaces, cuts to `max`. */
export function sanitizeField(s: string, max = 250): string {
  return s.replace(/[;"\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, max).trim();
}

const yn = (b: boolean) => (b ? "S" : "N");
const isMoney = (n: number) => Number.isSafeInteger(n) && n >= 0;

function isRealDate(y: number, m: number, d: number) {
  const days = [31, y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return m >= 1 && m <= 12 && d >= 1 && d <= days[m - 1];
}

/** Validates one document and returns its row fields, or the error message. */
function toRow(d: RegistroDoc): { fields: string[] } | { error: string } {
  const fail = (error: string) => ({ error });
  const side = d.side;
  if (!isSupportedInRegistro(d.docCode, side)) return fail(`Tipo de comprobante ${d.docCode} no admitido en el registro de ${side}`);
  if (!(d.counterpartyIdType in TABLA_3)) return fail(`Tipo de identificación ${d.counterpartyIdType} desconocido`);

  const id = sanitizeField(d.counterpartyId ?? "", 20);
  if (!id || (d.counterpartyId ?? "").trim().length > 20) return fail("Identificación de la contraparte vacía o mayor a 20 caracteres");
  if ((d.counterpartyIdType === 11 || d.counterpartyIdType === 12) && !/^\d+$/.test(id)) {
    return fail("RUC o cédula de la contraparte inválido (solo dígitos, RUC sin DV)");
  }
  const name = sanitizeField(d.counterpartyName ?? "");
  if (!name && !NAME_OPTIONAL[side].has(d.counterpartyIdType)) return fail("Falta el nombre o razón social de la contraparte");

  const m = DATE_RE.exec(d.issueDate);
  if (!m || !isRealDate(+m[1], +m[2], +m[3])) return fail("Fecha de emisión inválida");
  if (d.issueDate < "2021-01-01" && d.condition !== "credit") return fail("Fecha anterior al 01/01/2021 (solo se admite con condición crédito)");

  const isImport = side === "compras" && d.docCode === IMPORT_DISPATCH;
  const timbrado = isImport ? "0" : d.timbrado;
  if (!isImport && !TIMBRADO_RE.test(timbrado ?? "")) return fail("Timbrado inválido (8 dígitos)");
  const numberOptional = NUMBER_OPTIONAL[side].has(d.docCode) && !d.number;
  if (!numberOptional && !NUMBER_RE.test(d.number ?? "")) return fail("Número de comprobante inválido (###-###-#######)");

  if (![d.gravado10, d.gravado5, d.exento].every(isMoney)) return fail("Montos inválidos (enteros no negativos)");
  if (!Number.isSafeInteger(d.total) || d.total <= 0) return fail("El total debe ser un entero mayor a 0");
  const totalOnly = side === "compras" && TOTAL_ONLY_COMPRAS.has(d.docCode);
  if (!totalOnly && d.total !== d.gravado10 + d.gravado5 + d.exento) {
    return fail("El total no es igual a gravado 10 % + gravado 5 % + exento");
  }

  if (!d.imputaIva && !d.imputaIre && !d.imputaIrp) {
    return fail(d.noImputa
      ? "\"No imputa\" requiere imputar además a alguna obligación (IVA, IRE o IRP-RSP)"
      : "El comprobante no está imputado a ninguna obligación (IVA, IRE o IRP-RSP)");
  }

  const related = d.docCode === 110 || d.docCode === 111;
  const relNumber = d.relatedNumber ?? "";
  const relTimbrado = d.relatedTimbrado ?? "";
  if (related && (!relNumber || !relTimbrado)) return fail("Nota de crédito/débito sin número y timbrado del comprobante asociado");
  if (relNumber && !NUMBER_RE.test(relNumber)) return fail("Número del comprobante asociado inválido (###-###-#######)");
  if (relTimbrado && !TIMBRADO_RE.test(relTimbrado)) return fail("Timbrado del comprobante asociado inválido (8 dígitos)");

  const amounts = totalOnly ? ["0", "0", "0"] : [d.gravado10, d.gravado5, d.exento].map(String);
  const fields = [
    side === "ventas" ? "1" : "2",
    String(d.counterpartyIdType),
    id,
    name,
    String(d.docCode),
    `${m[3]}/${m[2]}/${m[1]}`,
    timbrado,
    numberOptional ? "" : d.number,
    ...amounts,
    String(d.total),
    d.condition === "credit" ? "2" : "1",
    yn(d.foreignCurrency),
    yn(d.imputaIva),
    yn(d.imputaIre),
    yn(d.imputaIrp),
    ...(side === "compras" ? [yn(d.noImputa)] : []),
    relNumber,
    relTimbrado,
  ];
  return { fields };
}

const order = (a: RegistroDoc, b: RegistroDoc) =>
  (a.side === b.side ? 0 : a.side === "ventas" ? -1 : 1)
  || a.issueDate.localeCompare(b.issueDate)
  || a.number.localeCompare(b.number)
  || a.documentId.localeCompare(b.documentId);

/** Builds the 955 files for one month: ventas then compras, by date and number, 5.000 rows per file. */
export function buildRegistro(input: { ruc: string; year: number; month: number; docs: RegistroDoc[] }): RegistroResult {
  const mm = String(input.month).padStart(2, "0");
  const prefix = `${input.year}-${mm}-`;
  const inMonth = input.docs.filter((d) => d.issueDate.startsWith(prefix));
  const errors: RegistroError[] = [];
  const rows: string[] = [];
  const counts = { ventas: 0, compras: 0 };

  for (const d of inMonth.filter((x) => !x.isElectronic).sort(order)) {
    const r = toRow(d);
    if ("error" in r) errors.push({ documentId: d.documentId, message: r.error });
    else {
      rows.push(r.fields.join(DELIMITER));
      counts[d.side]++;
    }
  }

  const files: RegistroFile[] = [];
  for (let i = 0; i < rows.length; i += MAX_ROWS_PER_FILE) {
    const chunk = rows.slice(i, i + MAX_ROWS_PER_FILE);
    const seq = String(files.length + 1).padStart(4, "0");
    files.push({ name: `${input.ruc}_REG_${mm}${input.year}_V${seq}`, csv: chunk.map((r) => r + EOL).join(""), rows: chunk.length });
  }
  return { files, errors, excluded: { electronic: inMonth.filter((d) => d.isElectronic).length }, counts };
}

/** ZIP with one UTF-8 (no BOM) entry `<name>.csv`; Marangatu requires the zip and the csv to share the name. */
export function zipRegistro(file: { name: string; csv: string }): Uint8Array {
  return zipSync({ [`${file.name}.csv`]: strToU8(file.csv) });
}
