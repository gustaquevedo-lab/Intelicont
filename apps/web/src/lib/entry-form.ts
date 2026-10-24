import { formatGs } from "./gs";

export interface EntryFormLine { accountId: string; debit: number; credit: number; description: string }
export interface EntryFormState {
  entityId: string;
  period: { id: string; year: number; month: number } | null;
  /** YYYY-MM-DD */
  date: string;
  description: string;
  lines: EntryFormLine[];
}

/** Fully blank lines (no account, no amounts) are ignored, so extra rows added with Ctrl+Enter do no harm. */
const isBlank = (l: EntryFormLine) => !l.accountId && l.debit === 0 && l.credit === 0;

/** Client-side mirror of the rules the DB enforces; the server stays the authority. */
export function validateEntryForm(s: EntryFormState): { ok: boolean; errors: string[]; totals: { debit: number; credit: number; diff: number } } {
  const errors: string[] = [];
  const lines = s.lines.filter((l) => !isBlank(l));
  const debit = lines.reduce((t, l) => t + l.debit, 0);
  const credit = lines.reduce((t, l) => t + l.credit, 0);
  const totals = { debit, credit, diff: debit - credit };

  if (!s.entityId) errors.push("Seleccioná una empresa.");
  if (!s.period) errors.push("Elegí un período abierto.");
  const desc = s.description.trim();
  if (!desc) errors.push("La descripción es obligatoria.");
  else if (desc.length > 500) errors.push("La descripción admite hasta 500 caracteres.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) errors.push("Ingresá la fecha del asiento.");
  else if (s.period && s.date.slice(0, 7) !== `${s.period.year}-${String(s.period.month).padStart(2, "0")}`) errors.push("La fecha no corresponde al período.");

  lines.forEach((l, i) => {
    const n = i + 1;
    if (!l.accountId) errors.push(`Línea ${n}: elegí una cuenta.`);
    if (l.debit > 0 && l.credit > 0) errors.push(`Línea ${n}: el importe va en el Debe o en el Haber, no en ambos.`);
    else if (l.debit === 0 && l.credit === 0) errors.push(`Línea ${n}: ingresá un importe.`);
  });
  if (lines.filter((l) => l.accountId && (l.debit > 0) !== (l.credit > 0)).length < 2) errors.push("El asiento necesita al menos dos líneas con cuenta e importe.");
  if (totals.diff !== 0) errors.push(`El asiento no está balanceado: diferencia de ${formatGs(Math.abs(totals.diff))}.`);

  return { ok: errors.length === 0, errors, totals };
}
