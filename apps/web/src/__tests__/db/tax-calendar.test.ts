// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mod11Dv } from "@intelicont/ledger/fiscal-py";
import { dueDateFor, previousPeriod, todayInAsuncionISO } from "@intelicont/ledger/tax-calendar";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type CalendarModule = typeof import("@ledger/db/calendar");
type AppRouter = typeof import("@/trpc").appRouter;

describe.skipIf(!process.env.TEST_ADMIN_URL)("tax calendar (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let cal: CalendarModule;
  let appRouter: AppRouter;
  let user: string, outsider: string, e1: string, e2: string, e3: string;
  const prevUrl = process.env.DATABASE_URL;
  const caller = (userId = user) => appRouter.createCaller({ userId, requestId: "t", idempotencyKey: crypto.randomUUID() });
  const rucOf = (body: string) => `${body}-${mod11Dv(body)}`;
  const count = async (entityId: string) =>
    Number((await t.owner`select count(*)::int as n from tax_calendar where entity_id = ${entityId}`)[0].n);

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    user = await mkUser("u@x.test");
    outsider = await mkUser("o@x.test");
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    cal = await import("@ledger/db/calendar");
    appRouter = (await import("@/trpc")).appRouter;
    e1 = (await caller().entities.create({ ruc: "1234567-9", legalName: "Con IVA", taxRegimes: ["IVA_GRAL", "IRE_GRAL"], baseCurrency: "PYG" })).id;
    e2 = (await caller(outsider).entities.create({ ruc: "80014066-4", legalName: "Otra", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    e3 = (await caller().entities.create({ ruc: rucOf("80000001"), legalName: "Sin IVA", taxRegimes: ["IRE_SIMPLE"], baseCurrency: "PYG" })).id;
  }, 180_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("entities.create generates 12 months of calendar for an IVA_GRAL entity", async () => {
    const rows = await t.owner`select obligation, period, due_date::text as due_date, source from tax_calendar where entity_id = ${e1} order by period, obligation`;
    expect(rows).toHaveLength(24);
    const today = todayInAsuncionISO();
    const first = previousPeriod(Number(today.slice(0, 4)), Number(today.slice(5, 7)));
    expect(rows[0].period).toBe(`${first.year}-${String(first.month).padStart(2, "0")}`);
    expect(new Set(rows.map((r) => r.period)).size).toBe(12);
    expect(new Set(rows.map((r) => r.obligation))).toEqual(new Set(["104", "955"]));
    expect(rows.every((r) => r.source === "rule")).toBe(true);
    // 104 and 955 share the due date, which is the rule's date for the period (RUC body 1234567 -> day 17, Monday if weekend).
    expect(rows[0].due_date).toBe(rows[1].due_date);
    const [y, m] = rows[0].period.split("-").map(Number);
    expect(rows[0].due_date).toBe(dueDateFor(y, m, "1234567-9"));
  });

  it("an entity without IVA_GRAL gets no 104 or 955", async () => {
    expect(await count(e3)).toBe(0);
    await db.withTenant(user, async () => { await cal.ensureCalendar(e3, 2026, 1, 12); });
    expect(await count(e3)).toBe(0);
  });

  it("calendar rows are isolated by entity", async () => {
    expect(await count(e2)).toBe(24);
    // The outsider's scope sees only its own rows; the user's scope cannot see or write the outsider's.
    const seen = await t.scoped([e2], (tx) => tx`select distinct entity_id from tax_calendar`);
    expect(seen.map((r) => r.entity_id)).toEqual([e2]);
    await expect(
      t.scoped([e1], (tx) => tx`insert into tax_calendar (entity_id, obligation, period, due_date) values (${e2}, '104', '2031-01', '2031-02-10')`),
    ).rejects.toThrow();
    await expect(
      t.scoped([e1], (tx) => tx`insert into tax_calendar (entity_id, obligation, period, due_date) values (${e1}, 'XXX', '2031-01', '2031-02-10')`),
    ).rejects.toThrow();
    const mine = await db.withTenant(user, () => cal.getCalendarMonth(e2, 2026, 11));
    expect(mine).toEqual([]);
  });

  it("getUpcoming returns level 7, 3, 1 and overdue for a fixed today", async () => {
    // Far-future fake periods so the generated rows (around the real today) fall outside the window.
    const rows: [string, string][] = [["2030-01", "2030-02-27"], ["2030-02", "2030-03-02"], ["2030-03", "2030-03-04"], ["2030-04", "2030-03-08"], ["2030-05", "2030-03-20"]];
    for (const [period, due] of rows) await t.owner`insert into tax_calendar (entity_id, obligation, period, due_date) values (${e1}, '104', ${period}, ${due}::date)`;
    const items = await db.withTenant(user, () => cal.getUpcoming(e1, 30, "2030-03-01"));
    expect(items.map((i) => [i.period, i.daysLeft, i.level])).toEqual([
      ["2030-01", -2, "overdue"],
      ["2030-02", 1, "1"],
      ["2030-03", 3, "3"],
      ["2030-04", 7, "7"],
      ["2030-05", 19, null], // inside the window but beyond the 7-day notices
    ]);
    const week = await db.withTenant(user, () => cal.getUpcoming(e1, 7, "2030-03-01"));
    expect(week.map((i) => i.level)).toEqual(["overdue", "1", "3", "7"]);
  });

  it("an obligation overdue by 40 days is still returned as overdue", async () => {
    await t.owner`insert into tax_calendar (entity_id, obligation, period, due_date) values (${e1}, '955', '2029-12', '2030-01-20')`;
    const items = await db.withTenant(user, () => cal.getUpcoming(e1, 7, "2030-03-01"));
    expect(items[0]).toMatchObject({ obligation: "955", period: "2029-12", daysLeft: -40, level: "overdue" });
  });

  it("getUpcoming drops rows overdue by more than 12 months", async () => {
    await t.owner`insert into tax_calendar (entity_id, obligation, period, due_date) values (${e1}, '955', '2028-10', '2028-11-10'), (${e1}, '955', '2029-03', '2029-04-10')`;
    const items = await db.withTenant(user, () => cal.getUpcoming(e1, 7, "2030-03-01"));
    const periods = items.map((i) => i.period);
    expect(periods).toContain("2029-03"); // 325 days overdue: kept
    expect(periods).not.toContain("2028-10"); // 475 days overdue: dropped
  });

  it("upcoming lazily ensures missing months", async () => {
    await t.owner`delete from tax_calendar where entity_id = ${e1} and period like '20%' and period not like '2030-%' and period not like '2029-%' and period not like '2028-%'`;
    const before = await count(e1);
    const r = await caller().fiscal.upcoming({ entityId: e1, days: 60 });
    expect(r.today).toBe(todayInAsuncionISO());
    expect(await count(e1)).toBe(before + 12); // previous 3 + current + next 2 = 6 periods x (104, 955)
    const month = await caller().fiscal.calendarMonth({ entityId: e1, year: 2031, month: 3 });
    expect(month.items.map((i) => i.period)).toEqual(["2031-02", "2031-02"]); // viewed month's period is ensured too
    expect(month.items.map((i) => i.obligation)).toEqual(["104", "955"]);
  });

  it("ensureCalendar is idempotent", async () => {
    const before = await count(e1);
    const first = await db.withTenant(user, () => cal.ensureCalendar(e1, 2040, 1, 6));
    expect(first.inserted).toBe(12);
    expect(await count(e1)).toBe(before + 12);
    const again = await db.withTenant(user, () => cal.ensureCalendar(e1, 2040, 1, 6));
    expect(again.inserted).toBe(0);
    expect(await count(e1)).toBe(before + 12);
  });

  it("ensureCalendar skips an entity with a malformed RUC instead of failing", async () => {
    const [{ id }] = await t.owner`insert into entities (ruc, legal_name, tax_regimes) values ('SIN-RUC', 'RUC roto', array['IVA_GRAL']) returning id`;
    await t.owner`insert into memberships (user_id, entity_id, role) values (${user}, ${id}, 'accountant')`;
    const r = await db.withTenant(user, () => cal.ensureCalendar(id, 2026, 1, 12));
    expect(r).toEqual({ skipped: "ruc", inserted: 0 });
    expect(await count(id)).toBe(0);
    await expect(caller().fiscal.upcoming({ entityId: id, days: 7 })).resolves.toMatchObject({ items: [] });
  });

  it("upcoming and calendarMonth reject an entity the user cannot see", async () => {
    await expect(caller(outsider).fiscal.upcoming({ entityId: e1, days: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller(outsider).fiscal.calendarMonth({ entityId: e1, year: 2026, month: 11 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller().fiscal.upcoming({ entityId: e2, days: 7 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
