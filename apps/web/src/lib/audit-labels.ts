/** Spanish labels for known audit actions; unknown ones render as their raw code. */
export const ACTION_LABELS: Record<string, string> = {
  "journal_entry.posted": "Asiento posteado",
  "journal_entry.reversed": "Asiento revertido",
};
export const actionLabel = (a: string) => ACTION_LABELS[a] ?? a;

export const TARGET_LABELS: Record<string, string> = { journal_entry: "Asiento", tax_document: "Comprobante", partner: "Tercero", entity: "Empresa" };
export const targetLabel = (t: string) => TARGET_LABELS[t] ?? t;

export const formatDateTime = (d: Date | string | null) =>
  d ? new Date(d).toLocaleString("es-PY", { timeZone: "America/Asuncion", dateStyle: "short", timeStyle: "medium" }) : "";

export const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual", sales: "Ventas", purchase: "Compras", payment: "Pago", collection: "Cobro", bank: "Banco",
  depreciation: "Depreciación", fx_adjustment: "Dif. de cambio", payroll: "Sueldos", import: "Importación", sifen: "XML SIFEN",
};

/** `YYYY-MM-DD` of a calendar date that may arrive as a Date (UTC midnight) or a string. */
export const dayOf = (d: Date | string) => (typeof d === "string" ? d : d.toISOString()).slice(0, 10);
