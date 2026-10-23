/**
 * Fiscal calendar for the slice: monthly obligations of IVA_GRAL entities, due by RUC termination.
 * Pure module (string dates, UTC arithmetic only): no process-timezone dependence.
 */

export type CalendarObligation = "104" | "955";
export type CalendarLevel = "overdue" | "1" | "3" | "7";

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

/** Last digit of the RUC body (digits before the DV); accepts `NNNNNNNN-D` or just the body. */
function rucBodyLastDigit(ruc: string): number {
  const body = ruc.split("-")[0].replace(/\D/g, "");
  if (!body) throw new Error(`RUC inválido: ${ruc}`);
  return Number(body[body.length - 1]);
}

/**
 * Due date (YYYY-MM-DD) of a monthly obligation for the period `periodYear`/`periodMonth` (1..12):
 * the month after the period, day 10 + last digit of the RUC body, moved forward to Monday when it
 * lands on a weekend.
 */
// shortcut: unverified formula, no Paraguayan holidays — replace with the DNIT annual calendar
export function dueDateFor(periodYear: number, periodMonth: number, ruc: string): string {
  // Date.UTC month is 0-based, so passing the 1-based period month yields the following month (and rolls the year).
  const t = Date.UTC(periodYear, periodMonth, 10 + rucBodyLastDigit(ruc));
  const dow = new Date(t).getUTCDay();
  const shift = dow === 6 ? 2 : dow === 0 ? 1 : 0;
  return new Date(t + shift * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Obligations for `months` consecutive periods starting at `fromYear`/`fromMonth` (1..12). 104 (Formulario IVA)
 * and 955 (Registro de Comprobantes) share one due date (assumption: the Registro is confirmed before the IVA is filed).
 */
export function buildCalendar(input: {
  ruc: string;
  regimes: string[];
  fromYear: number;
  fromMonth: number;
  months: number;
}): { obligation: CalendarObligation; period: string; dueDate: string }[] {
  if (!input.regimes.includes("IVA_GRAL")) return [];
  const out: { obligation: CalendarObligation; period: string; dueDate: string }[] = [];
  for (let i = 0; i < input.months; i++) {
    const idx = input.fromYear * 12 + (input.fromMonth - 1) + i;
    const year = Math.floor(idx / 12);
    const month = (idx % 12) + 1;
    const period = `${year}-${pad(month)}`;
    const dueDate = dueDateFor(year, month, input.ruc);
    out.push({ obligation: "104", period, dueDate }, { obligation: "955", period, dueDate });
  }
  return out;
}

/** Calendar days from `today` to `dueDate` (both YYYY-MM-DD); negative when past. */
export function daysLeft(dueDate: string, today: string): number {
  return Math.round((Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS);
}

/** Notice level for the 7/3/1-day warnings; null when further than 7 days away. */
export function levelFor(days: number): CalendarLevel | null {
  if (days < 0) return "overdue";
  if (days <= 1) return "1";
  if (days <= 3) return "3";
  if (days <= 7) return "7";
  return null;
}

/** Today's calendar date in Paraguay (YYYY-MM-DD). shortcut: zone hardcoded; same rule as usecases todayInAsuncion (which returns a Date and drags the DB schema in). */
export function todayInAsuncionISO(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
}

/** The month before `today`'s: the period whose obligations fall due this month. */
export function previousPeriod(today: string): { year: number; month: number } {
  const [y, m] = today.split("-").map(Number);
  return m === 1 ? { year: y - 1, month: 12 } : { year: y, month: m - 1 };
}
