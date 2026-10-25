// Registro de Comprobantes, obligación 955 (mensual) y 956 (anual), per DNIT's "Especificación Técnica para registro de
// comprobantes en Marangatu" (Junio 2021). Soporta los 4 tipos: VENTAS (1), COMPRAS (2), INGRESOS (3), EGRESOS (4).
// Pure: no I/O. Los documentos electrónicos (SIFEN e-kuatia) se excluyen: Marangatu ya los tiene.
import { strToU8, zipSync } from "fflate";
import { TABLA_3, isSupportedInRegistro, type RegistroSide } from "./registro-codes";

export type RegistroDoc = {
  documentId: string;
  side: RegistroSide;
  docCode: number;
  counterpartyIdType?: number;
  /** Without DV. */
  counterpartyId?: string;
  counterpartyName?: string;
  /** YYYY-MM-DD or MM/YYYY for payroll/IPS */
  issueDate: string;
  timbrado?: string | null;
  number?: string | null;
  gravado10?: number;
  gravado5?: number;
  exento?: number;
  total: number;
  condition?: "cash" | "credit";
  foreignCurrency?: boolean;
  imputaIva?: boolean;
  imputaIre?: boolean;
  imputaIrp?: boolean;
  noImputa?: boolean;
  relatedNumber?: string | null;
  relatedTimbrado?: string | null;
  isElectronic?: boolean;
  // Campos específicos para Ingresos (3) y Egresos (4)
  montoGravado?: number;
  montoNoGravado?: number;
  especificarDoc?: string | null;
  numeroCuentaTarjeta?: string | null;
  bancoFinanciera?: string | null;
  nroPatronalIps?: string | null;
};

export type RegistroFile = { name: string; csv: string; rows: number; format?: "csv" | "txt" };
export type RegistroError = { documentId: string; message: string };
export type RegistroResult = {
  files: RegistroFile[];
  errors: RegistroError[];
  excluded: { electronic: number };
  /** Rows emitted per side. */
  counts: { ventas: number; compras: number; ingresos: number; egresos: number };
};

export const DELIMITER = ";";
const EOL = "\n";
export const MAX_ROWS_PER_FILE = 5000;

/** Compras codes that report only MONTO TOTAL (fields 9-11 = 0). Ventas have no such exception. */
const TOTAL_ONLY_COMPRAS = new Set([101, 104, 105, 112]);
/** Id types whose name is not required (the name comes from Marangatu's registry). */
const NAME_OPTIONAL: Record<RegistroSide, Set<number>> = {
  ventas: new Set([11, 12, 15]),
  compras: new Set([11, 12]),
  ingresos: new Set([11, 12]),
  egresos: new Set([11, 12]),
};
/** Codes whose NÚMERO DEL COMPROBANTE is not required. */
const NUMBER_OPTIONAL: Record<RegistroSide, Set<number>> = {
  ventas: new Set([106, 112]),
  compras: new Set([106, 107, 112]),
  ingresos: new Set([208]),
  egresos: new Set([205, 206, 207, 208]),
};
const IMPORT_DISPATCH = 107; // compras: timbrado must be 0
/** Compras: the supplier is always a RUC (11), except autofactura (101) and despacho de importación (107). */
const SUPPLIER_ANY_ID = new Set([101, 107]);
const NUMBER_RE = /^\d{3}-\d{3}-\d{7}$/;
const TIMBRADO_RE = /^\d{8}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_YEAR_RE = /^(\d{2})\/(\d{4})$/;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Delimiter, quotes, CR/LF and TAB: never valid inside a field. */
const unsafeRe = (delimiter: string) => new RegExp(`${escapeRe(delimiter)}|["\\r\\n\\t]`, "g");

/** Replaces the delimiter, quotes and control whitespace by a space, collapses spaces, cuts to `max`. */
export function sanitizeField(s: string, max = 250, delimiter = DELIMITER): string {
  return s.replace(unsafeRe(delimiter), " ").replace(/\s+/g, " ").trim().slice(0, max).trim();
}

const yn = (b?: boolean) => (b ? "S" : "N");
const isMoney = (n?: number) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;

function isRealDate(y: number, m: number, d: number) {
  const days = [31, y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return m >= 1 && m <= 12 && d >= 1 && d <= days[m - 1];
}

/** Validates one document and returns its row fields, or the error message. */
function toRow(d: RegistroDoc, delimiter: string): { fields: string[] } | { error: string } {
  const fail = (error: string) => ({ error });
  const side = d.side;
  if (!isSupportedInRegistro(d.docCode, side)) return fail(`Tipo de comprobante ${d.docCode} no admitido en el registro de ${side}`);

  const idType = d.counterpartyIdType ?? 11;
  const id = d.counterpartyId ?? "";
  const name = sanitizeField(d.counterpartyName ?? "", 250, delimiter);

  // Parse date: can be YYYY-MM-DD or MM/AAAA for payroll/IPS
  let dateFormatted = "";
  if (DATE_RE.test(d.issueDate)) {
    const m = DATE_RE.exec(d.issueDate)!;
    if (!isRealDate(+m[1], +m[2], +m[3])) return fail("Fecha de emisión inválida");
    if (d.issueDate < "2021-01-01" && d.condition !== "credit") {
      return fail("Fecha anterior al 01/01/2021 (solo se admite con condición crédito)");
    }
    dateFormatted = `${m[3]}/${m[2]}/${m[1]}`;
  } else if (MONTH_YEAR_RE.test(d.issueDate) && (d.docCode === 208 || d.docCode === 206)) {
    dateFormatted = d.issueDate;
  } else {
    return fail("Formato de fecha de emisión o período inválido");
  }

  if (!Number.isSafeInteger(d.total) || d.total <= 0) return fail("El total debe ser un entero mayor a 0");

  // ===================== TIPO 1: VENTAS (19 columnas) =====================
  if (side === "ventas") {
    if (!(idType in TABLA_3)) return fail(`Tipo de identificación ${idType} desconocido`);
    if (!id || id.length > 20) return fail("Identificación de la contraparte vacía o mayor a 20 caracteres");
    if (/\s/.test(id) || new RegExp(unsafeRe(delimiter).source).test(id)) return fail("Identificación inválida");
    if ((idType === 11 || idType === 12) && !/^\d+$/.test(id)) {
      return fail("RUC o cédula de la contraparte inválido (solo dígitos, RUC sin DV)");
    }
    if (!name && !NAME_OPTIONAL.ventas.has(idType)) return fail("Falta el nombre o razón social de la contraparte");

    const timbrado = d.timbrado ?? "";
    if (!TIMBRADO_RE.test(timbrado)) return fail("Timbrado inválido (8 dígitos)");
    const numberOptional = NUMBER_OPTIONAL.ventas.has(d.docCode) && !d.number;
    if (!numberOptional && !NUMBER_RE.test(d.number ?? "")) return fail("Número de comprobante inválido (###-###-#######)");

    const g10 = d.gravado10 ?? 0;
    const g5 = d.gravado5 ?? 0;
    const exe = d.exento ?? 0;
    if (![g10, g5, exe].every(isMoney)) return fail("Montos inválidos (enteros no negativos)");
    if (d.total !== g10 + g5 + exe) return fail("El total no es igual a gravado 10 % + gravado 5 % + exento");

    if (!d.imputaIva && !d.imputaIre && !d.imputaIrp) {
      return fail("El comprobante no está imputado a ninguna obligación (IVA, IRE o IRP-RSP)");
    }

    const related = d.docCode === 110 || d.docCode === 111;
    const relNumber = d.relatedNumber ?? "";
    const relTimbrado = d.relatedTimbrado ?? "";
    if (related && (!relNumber || !relTimbrado)) return fail("Nota de crédito/débito sin número y timbrado del comprobante asociado");
    if (relNumber && !NUMBER_RE.test(relNumber)) return fail("Número del comprobante asociado inválido (###-###-#######)");
    if (relTimbrado && !TIMBRADO_RE.test(relTimbrado)) return fail("Timbrado del comprobante asociado inválido (8 dígitos)");

    return {
      fields: [
        "1",
        String(idType),
        id,
        name,
        String(d.docCode),
        dateFormatted,
        timbrado,
        numberOptional ? "" : (d.number ?? ""),
        String(g10),
        String(g5),
        String(exe),
        String(d.total),
        d.condition === "credit" ? "2" : "1",
        yn(d.foreignCurrency),
        yn(d.imputaIva),
        yn(d.imputaIre),
        yn(d.imputaIrp),
        relNumber,
        relTimbrado,
      ],
    };
  }

  // ===================== TIPO 2: COMPRAS (20 columnas) =====================
  if (side === "compras") {
    if (!(idType in TABLA_3)) return fail(`Tipo de identificación ${idType} desconocido`);
    if (!SUPPLIER_ANY_ID.has(d.docCode) && idType !== 11) {
      return fail("En compras el proveedor debe identificarse con RUC (tipo 11)");
    }
    if (!id || id.length > 20) return fail("Identificación de la contraparte vacía o mayor a 20 caracteres");
    if (/\s/.test(id) || new RegExp(unsafeRe(delimiter).source).test(id)) return fail("Identificación inválida");
    if ((idType === 11 || idType === 12) && !/^\d+$/.test(id)) {
      return fail("RUC o cédula de la contraparte inválido (solo dígitos, RUC sin DV)");
    }
    if (!name && !NAME_OPTIONAL.compras.has(idType)) return fail("Falta el nombre o razón social de la contraparte");

    const isImport = d.docCode === IMPORT_DISPATCH;
    const timbrado = isImport ? "0" : (d.timbrado ?? "");
    if (!isImport && !TIMBRADO_RE.test(timbrado)) return fail("Timbrado inválido (8 dígitos)");
    const numberOptional = NUMBER_OPTIONAL.compras.has(d.docCode) && (!d.number || (isImport && !NUMBER_RE.test(d.number)));
    if (!numberOptional && !NUMBER_RE.test(d.number ?? "")) return fail("Número de comprobante inválido (###-###-#######)");

    const totalOnly = TOTAL_ONLY_COMPRAS.has(d.docCode);
    const g10 = d.gravado10 ?? 0;
    const g5 = d.gravado5 ?? 0;
    const exe = d.exento ?? 0;
    if (!totalOnly) {
      if (![g10, g5, exe].every(isMoney)) return fail("Montos inválidos (enteros no negativos)");
      if (d.total !== g10 + g5 + exe) return fail("El total no es igual a gravado 10 % + gravado 5 % + exento");
    }

    if (!d.imputaIva && !d.imputaIre && !d.imputaIrp) {
      return fail(
        d.noImputa
          ? "\"No imputa\" requiere imputar además a alguna obligación (IVA, IRE o IRP-RSP)"
          : "El comprobante no está imputado a ninguna obligación (IVA, IRE o IRP-RSP)"
      );
    }

    const related = d.docCode === 110 || d.docCode === 111;
    const relNumber = d.relatedNumber ?? "";
    const relTimbrado = d.relatedTimbrado ?? "";
    if (related && (!relNumber || !relTimbrado)) return fail("Nota de crédito/débito sin número y timbrado del comprobante asociado");
    if (relNumber && !NUMBER_RE.test(relNumber)) return fail("Número del comprobante asociado inválido (###-###-#######)");
    if (relTimbrado && !TIMBRADO_RE.test(relTimbrado)) return fail("Timbrado del comprobante asociado inválido (8 dígitos)");

    const amounts = totalOnly ? ["0", "0", "0"] : [String(g10), String(g5), String(exe)];

    return {
      fields: [
        "2",
        String(idType),
        id,
        name,
        String(d.docCode),
        dateFormatted,
        timbrado,
        numberOptional ? "" : (d.number ?? ""),
        ...amounts,
        String(d.total),
        d.condition === "credit" ? "2" : "1",
        yn(d.foreignCurrency),
        yn(d.imputaIva),
        yn(d.imputaIre),
        yn(d.imputaIrp),
        yn(d.noImputa),
        relNumber,
        relTimbrado,
      ],
    };
  }

  // ===================== TIPO 3: INGRESOS (15 columnas) =====================
  if (side === "ingresos") {
    if (d.docCode === 208 && idType !== 11) return fail("Para liquidación de salario el pagador debe ser RUC (tipo 11)");
    if (!name && !NAME_OPTIONAL.ingresos.has(idType)) return fail("Falta el nombre o razón social del pagador");

    const numberOptional = d.docCode === 208;
    const docNumber = d.number ? sanitizeField(d.number, 20, delimiter) : "";
    if (!numberOptional && !docNumber) return fail("Número del comprobante requerido");

    const mGravado = d.montoGravado ?? 0;
    const mNoGravado = d.montoNoGravado ?? 0;
    if (d.docCode !== 203 && d.total !== mGravado + mNoGravado) {
      return fail("El monto total del ingreso debe ser igual a gravado + no gravado/exonerado");
    }

    if (!d.imputaIre && !d.imputaIrp) {
      return fail("El comprobante de ingreso debe estar imputado al IRE o al IRP-RSP");
    }

    const especifica = d.docCode === 210 ? sanitizeField(d.especificarDoc ?? "OTROS INGRESOS", 50, delimiter) : "";
    const relNumber = d.docCode === 203 ? (d.relatedNumber ?? "") : "";
    const relTimbrado = d.docCode === 203 ? (d.relatedTimbrado ?? "") : "";

    return {
      fields: [
        "3",
        String(d.docCode),
        dateFormatted,
        numberOptional ? "" : docNumber,
        String(idType),
        id,
        name,
        String(mGravado),
        String(mNoGravado),
        String(d.total),
        yn(d.imputaIre),
        yn(d.imputaIrp),
        especifica,
        relNumber,
        relTimbrado,
      ],
    };
  }

  // ===================== TIPO 4: EGRESOS (18 columnas) =====================
  if (side === "egresos") {
    const isSpecial = d.docCode === 206 || d.docCode === 207 || d.docCode === 211;
    const numberOptional = d.docCode === 205 || d.docCode === 206 || d.docCode === 207 || d.docCode === 208;
    const docNumber = d.number ? sanitizeField(d.number, 20, delimiter) : "";
    if (!numberOptional && !docNumber) return fail("Número del comprobante/transacción requerido");

    if (d.docCode === 204 || d.docCode === 205) {
      if (idType !== 11) return fail("Para entidades públicas o billetaje el receptor debe ser RUC (tipo 11)");
    } else if (d.docCode === 202 && idType !== 17) {
      return fail("Para comprobante del exterior el receptor debe tener Identificación Tributaria (tipo 17)");
    }

    if (!isSpecial && !name && !NAME_OPTIONAL.egresos.has(idType)) {
      return fail("Falta el nombre o razón social del vendedor/empleado");
    }

    // Imputa al IVA: solo 'S' para 207 (Extracto TC/TD), para el resto 'N'
    const imputaIvaVal = d.docCode === 207 && d.imputaIva ? "S" : "N";

    const nroCuenta = (d.docCode === 207 || d.docCode === 211) ? sanitizeField(d.numeroCuentaTarjeta ?? "", 30, delimiter) : "";
    const banco = (d.docCode === 207 || d.docCode === 211) ? sanitizeField(d.bancoFinanciera ?? "", 250, delimiter) : "";
    const ips = d.docCode === 206 ? sanitizeField(d.nroPatronalIps ?? "", 30, delimiter) : "";
    const especifica = d.docCode === 209 ? sanitizeField(d.especificarDoc ?? "OTROS EGRESOS", 50, delimiter) : "";
    const relNumber = d.docCode === 201 ? (d.relatedNumber ?? "") : "";
    const relTimbrado = d.docCode === 201 ? (d.relatedTimbrado ?? "") : "";

    return {
      fields: [
        "4",
        String(d.docCode),
        dateFormatted,
        numberOptional ? "" : docNumber,
        isSpecial ? "" : String(idType),
        isSpecial ? "" : id,
        d.docCode === 206 ? "" : name,
        String(d.total),
        imputaIvaVal,
        yn(d.imputaIre),
        yn(d.imputaIrp),
        yn(d.noImputa),
        nroCuenta,
        banco,
        ips,
        especifica,
        relNumber,
        relTimbrado,
      ],
    };
  }

  return fail("Tipo de registro no soportado");
}

const SIDE_ORDER: Record<RegistroSide, number> = {
  ventas: 1,
  compras: 2,
  ingresos: 3,
  egresos: 4,
};

const order = (a: RegistroDoc, b: RegistroDoc) =>
  (SIDE_ORDER[a.side] - SIDE_ORDER[b.side])
  || a.issueDate.localeCompare(b.issueDate)
  || (a.number ?? "").localeCompare(b.number ?? "")
  || a.documentId.localeCompare(b.documentId);

/** Builds the 955/956 files for one period: ventas -> compras -> ingresos -> egresos, 5.000 rows per file. */
export function buildRegistro(input: {
  ruc: string;
  year: number;
  month?: number;
  docs: RegistroDoc[];
  delimiter?: string;
  format?: "csv" | "txt";
  obligation?: "955" | "956";
}): RegistroResult {
  const format = input.format ?? "csv";
  const delimiter = input.delimiter ?? (format === "txt" ? "\t" : DELIMITER);
  const isAnnual = input.obligation === "956" || !input.month;
  const mm = input.month ? String(input.month).padStart(2, "0") : "";
  const prefix = isAnnual ? `${input.year}-` : `${input.year}-${mm}-`;

  const inPeriod = input.docs.filter((d) => d.issueDate.startsWith(prefix) || (d.issueDate.length === 7 && d.issueDate.endsWith(String(input.year))));
  const errors: RegistroError[] = [];
  const rows: string[] = [];
  const counts = { ventas: 0, compras: 0, ingresos: 0, egresos: 0 };

  for (const d of inPeriod.filter((x) => !x.isElectronic).sort(order)) {
    const r = toRow(d, delimiter);
    if ("error" in r) {
      errors.push({ documentId: d.documentId, message: r.error });
    } else {
      rows.push(r.fields.join(delimiter));
      counts[d.side]++;
    }
  }

  const files: RegistroFile[] = [];
  const periodLabel = isAnnual ? `${input.year}` : `${mm}${input.year}`;

  for (let i = 0; i < rows.length; i += MAX_ROWS_PER_FILE) {
    const chunk = rows.slice(i, i + MAX_ROWS_PER_FILE);
    const seq = String(files.length + 1).padStart(4, "0");
    const name = `${input.ruc}_REG_${periodLabel}_V${seq}`;
    files.push({
      name,
      csv: chunk.map((r) => r + EOL).join(""),
      rows: chunk.length,
      format,
    });
  }

  return {
    files,
    errors,
    excluded: { electronic: inPeriod.filter((d) => d.isElectronic).length },
    counts,
  };
}

/** ZIP with one UTF-8 (no BOM) entry `<name>.<ext>`; Marangatu requires the zip and the contained file to share the root name. */
export function zipRegistro(file: { name: string; csv?: string; content?: string; format?: "csv" | "txt" }): Uint8Array {
  const ext = file.format ?? "csv";
  const body = file.content ?? file.csv ?? "";
  return zipSync({ [`${file.name}.${ext}`]: strToU8(body) });
}
