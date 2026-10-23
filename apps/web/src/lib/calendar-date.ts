/**
 * A plain calendar date `YYYY-MM-DD` that exists (no time, no offset). Journal entry dates are stored as
 * UTC midnight of the Asunción calendar date (`new Date("YYYY-MM-DD")`), so a timestamp input would shift them.
 */
export const CALENDAR_DATE_ERROR = "Fecha inválida (AAAA-MM-DD)";

export function isCalendarDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
