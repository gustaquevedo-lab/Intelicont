import { and, asc, eq, gte, lt, lte } from "drizzle-orm";
import { tenantDb } from "./index";
import * as schema from "./schema";
import { buildCalendar, daysLeft, levelFor, type CalendarLevel } from "../src/tax-calendar";

const t = schema.taxCalendar;
const pad = (n: number) => String(n).padStart(2, "0");
const addDays = (date: string, n: number) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
/**
 * There is no "filed" (presentado) state yet, so OVERDUE MEANS NOT FILED and stays visible; only rows
 * overdue by more than 12 months are dropped. shortcut: replace with a filed state per row.
 */
const OVERDUE_WINDOW_DAYS = 365;

export type CalendarItem = { obligation: string; period: string; dueDate: string };
export type UpcomingItem = CalendarItem & { daysLeft: number; level: CalendarLevel | null };

/**
 * Inserts the missing calendar rows of `months` consecutive periods from `fromYear`/`fromMonth` (1..12) for
 * the entity's RUC and regimes. Idempotent (`ON CONFLICT DO NOTHING`); a no-op for an entity the caller cannot see.
 */
export async function ensureCalendar(entityId: string, fromYear: number, fromMonth: number, months: number): Promise<{ skipped?: "ruc"; inserted: number }> {
  return tenantDb(async (db) => {
    const [entity] = await db.select({ ruc: schema.entities.ruc, regimes: schema.entities.taxRegimes })
      .from(schema.entities).where(eq(schema.entities.id, entityId));
    if (!entity) return { inserted: 0 };
    let rows;
    try {
      rows = buildCalendar({ ruc: entity.ruc, regimes: entity.regimes ?? [], fromYear, fromMonth, months });
    } catch {
      return { skipped: "ruc" as const, inserted: 0 }; // malformed RUC: no calendar, but never fail the caller
    }
    if (!rows.length) return { inserted: 0 };
    const res = await db.insert(t).values(rows.map((r) => ({ entityId, ...r })))
      .onConflictDoNothing({ target: [t.entityId, t.obligation, t.period] }).returning({ id: t.id });
    return { inserted: res.length };
  });
}

/** Rows due within `days` of `today` (YYYY-MM-DD) or overdue (up to 12 months back; overdue = not filed), by due date. `level` is null beyond 7 days. */
export async function getUpcoming(entityId: string, days: number, today: string): Promise<UpcomingItem[]> {
  return tenantDb(async (db) => {
    const rows = await db.select({ obligation: t.obligation, period: t.period, dueDate: t.dueDate }).from(t)
      .where(and(eq(t.entityId, entityId), gte(t.dueDate, addDays(today, -OVERDUE_WINDOW_DAYS)), lte(t.dueDate, addDays(today, days))))
      .orderBy(asc(t.dueDate), asc(t.obligation));
    return rows.map((r) => {
      const left = daysLeft(r.dueDate, today);
      return { ...r, daysLeft: left, level: levelFor(left) };
    });
  });
}

/** Rows whose due date falls in the calendar month `year`/`month` (1..12). */
export async function getCalendarMonth(entityId: string, year: number, month: number): Promise<CalendarItem[]> {
  const from = `${year}-${pad(month)}-01`;
  const to = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`;
  return tenantDb(async (db) =>
    db.select({ obligation: t.obligation, period: t.period, dueDate: t.dueDate }).from(t)
      .where(and(eq(t.entityId, entityId), gte(t.dueDate, from), lt(t.dueDate, to)))
      .orderBy(asc(t.dueDate), asc(t.obligation)));
}
