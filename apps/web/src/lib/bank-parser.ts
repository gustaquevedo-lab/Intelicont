/**
 * Bank Statement CSV Parser — Paraguay Banks
 *
 * Parses CSV exports from major Paraguayan banks and maps
 * them to the BankMovement format for auto-import.
 *
 * Supported banks: GNB, Itaú, Continental, Familiar, Regional
 */

export interface ParsedMovement {
  date: string;
  description: string;
  ref: string;
  amount: number;
  direction: "credit" | "debit";
  rawData: Record<string, string>;
}

export interface ParseResult {
  bank: string;
  success: boolean;
  movements: ParsedMovement[];
  errors: string[];
  accountInfo?: {
    accountNumber?: string;
    currency?: string;
    periodStart?: string;
    periodEnd?: string;
  };
}

type ColumnMap = {
  date: string[];
  description: string[];
  ref: string[];
  amount: string[];
  direction?: {
    credit: string[];
    debit: string[];
    column?: string;
  };
};

const BANK_TEMPLATES: Record<string, ColumnMap> = {
  gnb: {
    date: ["Fecha", "FECHA", "fecha", "Date"],
    description: ["Descripción", "DESCRIPCION", "Concepto", "CONCEPTO", "description"],
    ref: ["Referencia", "REFERENCIA", "Nro", "Comprobante", "reference"],
    amount: ["Importe", "IMPORTE", "Monto", "MONTO", "amount"],
    direction: {
      credit: ["Crédito", "CREDITO", "Ingreso", "INGRESO"],
      debit: ["Débito", "DEBITO", "Egreso", "EGRESO"],
    },
  },
  itau: {
    date: ["Fecha", "FECHA", "fecha"],
    description: ["Descripción", "DESCRIPCION", "Historial"],
    ref: ["Referencia", "REFERENCIA", "Documento"],
    amount: ["Importe", "IMPORTE", "Valor"],
    direction: {
      credit: ["Crédito", "CREDITO", "Entrada"],
      debit: ["Débito", "DEBITO", "Salida"],
    },
  },
  continental: {
    date: ["Fecha", "FECHA"],
    description: ["Descripción", "DESCRIPCION", "Detalle"],
    ref: ["Referencia", "REFERENCIA", "Nro. Operación"],
    amount: ["Importe", "IMPORTE", "Monto"],
    direction: {
      credit: ["Crédito", "CREDITO"],
      debit: ["Débito", "DEBITO"],
      column: "Tipo",
    },
  },
};

function detectBank(headers: string[]): string {
  const headerStr = headers.join(",").toLowerCase();
  if (headerStr.includes("gnb") || headerStr.includes("gnb")) return "gnb";
  if (headerStr.includes("itau") || headerStr.includes("itaú")) return "itau";
  if (headerStr.includes("continental")) return "continental";
  return "generic";
}

function findColumn(headers: string[], possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    const found = headers.find((h) => h.toLowerCase().trim() === name.toLowerCase().trim());
    if (found) return found;
  }
  return null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "," || char === ";") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(value: string): string {
  const cleaned = value.replace(/"/g, "").trim();
  // Try DD/MM/YYYY
  const ddmmyyyy = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, "0")}-${ddmmyyyy[1].padStart(2, "0")}`;
  // Try YYYY-MM-DD
  const yyyymmdd = cleaned.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (yyyymmdd) return `${yyyymmdd[1]}-${yyyymmdd[2].padStart(2, "0")}-${yyyymmdd[3].padStart(2, "0")}`;
  return cleaned;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/"/g, "").replace(/[^0-9,\-.]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseBankCSV(csvContent: string, bankHint?: string): ParseResult {
  const errors: string[] = [];
  const movements: ParsedMovement[] = [];

  if (!csvContent.trim()) {
    return { bank: bankHint || "unknown", success: false, movements: [], errors: ["CSV vacío"] };
  }

  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { bank: bankHint || "unknown", success: false, movements: [], errors: ["CSV debe tener al menos encabezado + 1 línea"] };
  }

  const headers = parseCSVLine(lines[0]);
  const bank = bankHint || detectBank(headers);
  const template = BANK_TEMPLATES[bank] || BANK_TEMPLATES.gnb;

  const dateCol = findColumn(headers, template.date);
  const descCol = findColumn(headers, template.description);
  const refCol = findColumn(headers, template.ref);
  const amountCol = findColumn(headers, template.amount);

  let creditCol: string | null = null;
  let debitCol: string | null = null;
  let directionColumn: string | null = null;

  if (template.direction?.column) {
    directionColumn = findColumn(headers, [template.direction.column]);
  } else if (template.direction) {
    creditCol = findColumn(headers, template.direction.credit);
    debitCol = findColumn(headers, template.direction.debit);
  }

  if (!dateCol) errors.push("No se encontró columna de fecha");
  if (!amountCol && !creditCol && !debitCol) errors.push("No se encontró columna de importe");

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    if (cells.length < headers.length / 2) continue; // Skip malformed lines

    const rawData: Record<string, string> = {};
    headers.forEach((h, idx) => { rawData[h] = cells[idx] || ""; });

    const date = dateCol ? parseDate(rawData[dateCol]) : "";
    const description = descCol ? (rawData[descCol] || "").replace(/"/g, "") : "";
    const ref = refCol ? (rawData[refCol] || "").replace(/"/g, "") : "";

    let amount = 0;
    let direction: "credit" | "debit" = "credit";

    if (creditCol && debitCol) {
      const creditAmount = parseAmount(rawData[creditCol] || "0");
      const debitAmount = parseAmount(rawData[debitCol] || "0");
      if (creditAmount > 0) {
        amount = creditAmount;
        direction = "credit";
      } else if (debitAmount > 0) {
        amount = debitAmount;
        direction = "debit";
      }
    } else if (directionColumn) {
      amount = amountCol ? parseAmount(rawData[amountCol!]) : 0;
      const dirValue = (rawData[directionColumn] || "").toLowerCase();
      direction = dirValue.includes("debito") || dirValue.includes("débito") || dirValue.includes("egreso")
        ? "debit" : "credit";
    } else if (amountCol) {
      amount = parseAmount(rawData[amountCol]);
      direction = amount >= 0 ? "credit" : "debit";
      amount = Math.abs(amount);
    }

    if (amount > 0 && date) {
      movements.push({ date, description, ref, amount, direction, rawData });
    }
  }

  return {
    bank,
    success: errors.length === 0,
    movements,
    errors,
    accountInfo: {
      currency: detectCurrency(headers, lines[1] || ""),
    },
  };
}

function detectCurrency(headers: string[], sampleLine: string): string {
  const content = (headers.join(" ") + " " + sampleLine).toLowerCase();
  if (content.includes("usd") || content.includes("dólar")) return "USD";
  if (content.includes("gs.") || content.includes("guaraní")) return "PYG";
  return "PYG";
}
