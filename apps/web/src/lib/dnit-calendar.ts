/**
 * DNIT Tax Calendar — Paraguay
 *
 * Computes due dates for each tax obligation based on:
 *  - The last digit of the RUC (determines day-of-month offset)
 *  - The type of obligation (monthly, annual, etc.)
 *  - Weekend shifting: if the due date falls on Sat/Sun, move to next Monday
 *
 * Sources: Resolución 22/21 DNIT and Calendario DNIT 2026
 */

export type ObligacionTipo =
  | "IVA 104"
  | "IRE General 500"
  | "IRE Simple 501"
  | "ReSimple 151"
  | "Hechauka"
  | "IRP 902"
  | "Aguinaldo";

export interface ObligacionCalendar {
  tipo:      ObligacionTipo;
  empresa:   string;
  entityId:  string;
  ruc:       string;
  dueDate:   Date;
  regime:    string;
}

// ─── RUC last-digit → day offset (1-indexed day of month) ────────────────────
// DNIT uses a rolling 10-day window. Digit 0 gets the last slot.
const RUC_DAY_OFFSET: Record<number, number> = {
  1: 7,
  2: 8,
  3: 9,
  4: 10,
  5: 11,
  6: 12,
  7: 13,
  8: 14,
  9: 15,
  0: 16,
};

/** Get the last digit of the numeric part of a RUC (before the dash) */
export function rucLastDigit(ruc: string): number {
  const numPart = ruc.split("-")[0].replace(/\D/g, "");
  return Number(numPart.slice(-1)) || 0;
}

/** Shift a date forward past weekends (Sat→Mon, Sun→Mon) */
function skipWeekend(d: Date): Date {
  const day = d.getDay(); // 0=Sun, 6=Sat
  if (day === 6) d.setDate(d.getDate() + 2);
  if (day === 0) d.setDate(d.getDate() + 1);
  return d;
}

/** Build a Date for a given year/month/day, skipping weekends */
function dueDate(year: number, month: number, day: number): Date {
  return skipWeekend(new Date(year, month - 1, day));
}

// ─── Obligation generators ────────────────────────────────────────────────────

/**
 * IVA 104 — due every month, day determined by RUC last digit.
 * Returns one entry per month for the given year range.
 */
function ivaObligaciones(
  entity: { id: string; ruc: string; legalName: string; taxRegimes: string[] | null },
  year: number,
  months: number[]
): ObligacionCalendar[] {
  const digit = rucLastDigit(entity.ruc);
  const day   = RUC_DAY_OFFSET[digit] ?? 16;

  return months.map((month) => ({
    tipo:     "IVA 104",
    empresa:  entity.legalName,
    entityId: entity.id,
    ruc:      entity.ruc,
    dueDate:  dueDate(year, month + 1, day), // month+1: report filed month after
    regime:   entity.taxRegimes?.join(" / ") ?? "",
  }));
}

/**
 * Hechauka — monthly electronic book, same day logic as IVA 104 but submitted
 * to DNIT's Hechauka system.
 */
function hechaukaObligaciones(
  entity: { id: string; ruc: string; legalName: string; taxRegimes: string[] | null },
  year: number,
  months: number[]
): ObligacionCalendar[] {
  const digit = rucLastDigit(entity.ruc);
  const day   = RUC_DAY_OFFSET[digit] ?? 16;

  return months.map((month) => ({
    tipo:     "Hechauka",
    empresa:  entity.legalName,
    entityId: entity.id,
    ruc:      entity.ruc,
    dueDate:  dueDate(year, month + 1, day + 5), // Hechauka 5 days after IVA
    regime:   entity.taxRegimes?.join(" / ") ?? "",
  }));
}

/**
 * IRE General 500 — annual, due in April of the following year.
 * Day based on RUC digit.
 */
function ireGeneralObligaciones(
  entity: { id: string; ruc: string; legalName: string; taxRegimes: string[] | null },
  year: number
): ObligacionCalendar[] {
  const digit = rucLastDigit(entity.ruc);
  const day   = (digit === 0 ? 10 : digit) + 15; // April 16–25
  return [{
    tipo:     "IRE General 500",
    empresa:  entity.legalName,
    entityId: entity.id,
    ruc:      entity.ruc,
    dueDate:  dueDate(year + 1, 4, Math.min(day, 25)),
    regime:   entity.taxRegimes?.join(" / ") ?? "",
  }];
}

/**
 * IRE Simple 501 — annual, due in March of the following year.
 */
function ireSimpleObligaciones(
  entity: { id: string; ruc: string; legalName: string; taxRegimes: string[] | null },
  year: number
): ObligacionCalendar[] {
  const digit = rucLastDigit(entity.ruc);
  const day   = (digit === 0 ? 10 : digit) + 10; // March 11–20
  return [{
    tipo:     "IRE Simple 501",
    empresa:  entity.legalName,
    entityId: entity.id,
    ruc:      entity.ruc,
    dueDate:  dueDate(year + 1, 3, Math.min(day, 25)),
    regime:   entity.taxRegimes?.join(" / ") ?? "",
  }];
}

/**
 * ReSimple 151 — quarterly/annual, due in February of the following year.
 */
function reSimpleObligaciones(
  entity: { id: string; ruc: string; legalName: string; taxRegimes: string[] | null },
  year: number
): ObligacionCalendar[] {
  return [{
    tipo:     "ReSimple 151",
    empresa:  entity.legalName,
    entityId: entity.id,
    ruc:      entity.ruc,
    dueDate:  dueDate(year + 1, 2, 28),
    regime:   entity.taxRegimes?.join(" / ") ?? "",
  }];
}

// ─── Main calculator ──────────────────────────────────────────────────────────

export interface CalendarEntity {
  id:         string;
  ruc:        string;
  legalName:  string;
  status:     string;
  taxRegimes: string[] | null;
}

export function computeObligaciones(
  entities: CalendarEntity[],
  year: number,
  monthsAhead = 3
): ObligacionCalendar[] {
  const results: ObligacionCalendar[] = [];
  const now       = new Date();
  const startMonth = now.getMonth() + 1; // 1-indexed current month
  const months    = Array.from({ length: monthsAhead }, (_, i) => {
    const m = startMonth - 1 + i; // 0-indexed for IVA logic (period month)
    return m > 11 ? m - 12 : m;   // wrap December
  });

  for (const entity of entities) {
    if (entity.status !== "active") continue;
    const regimes = entity.taxRegimes ?? [];

    const hasIVA      = regimes.some((r) => r.toLowerCase().includes("iva"));
    const hasIREGen   = regimes.some((r) => r.toLowerCase().includes("ire general"));
    const hasIRESim   = regimes.some((r) => r.toLowerCase().includes("ire simple"));
    const isReSimple  = regimes.some((r) => r.toLowerCase().includes("resimple"));

    if (hasIVA) {
      results.push(...ivaObligaciones(entity, year, months));
      results.push(...hechaukaObligaciones(entity, year, months));
    }
    if (hasIREGen)  results.push(...ireGeneralObligaciones(entity, year));
    if (hasIRESim)  results.push(...ireSimpleObligaciones(entity, year));
    if (isReSimple) results.push(...reSimpleObligaciones(entity, year));
  }

  // Sort by due date ascending
  return results.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

// ─── Urgency helpers ──────────────────────────────────────────────────────────

export type Urgency = "overdue" | "critical" | "high" | "medium" | "low";

export function getUrgency(dueDate: Date, today = new Date()): Urgency {
  const diffDays = Math.ceil((dueDate.getTime() - today.setHours(0,0,0,0)) / 86_400_000);
  if (diffDays < 0)  return "overdue";
  if (diffDays <= 2) return "critical";
  if (diffDays <= 5) return "high";
  if (diffDays <= 10)return "medium";
  return "low";
}

export const URGENCY_STYLES: Record<Urgency, { dot: string; text: string; badge: string; bg: string }> = {
  overdue:  { dot: "bg-red-600",    text: "text-red-700",    badge: "bg-red-100 text-red-700 border-red-200",      bg: "bg-red-50 dark:bg-red-900/10"     },
  critical: { dot: "bg-red-500 animate-pulse", text: "text-red-600", badge: "bg-red-100 text-red-700 border-red-200", bg: "bg-red-50/50" },
  high:     { dot: "bg-amber-500",  text: "text-amber-600",  badge: "bg-amber-100 text-amber-700 border-amber-200", bg: ""                                 },
  medium:   { dot: "bg-yellow-400", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700 border-yellow-200", bg: ""                               },
  low:      { dot: "bg-gray-300",   text: "text-gray-500",   badge: "bg-gray-100 text-gray-600 border-gray-200",    bg: ""                                 },
};
