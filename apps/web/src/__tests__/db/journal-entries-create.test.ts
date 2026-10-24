// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type AppRouter = typeof import("@/trpc").appRouter;

describe.skipIf(!process.env.TEST_ADMIN_URL)("journal-entries.create: manual entries (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let appRouter: AppRouter;
  let user: string, entityId: string, periodId: string;
  const acc: Record<string, string> = {};
  const prevUrl = process.env.DATABASE_URL;
  const caller = () => appRouter.createCaller({ userId: user, requestId: "t", idempotencyKey: crypto.randomUUID() });
  const input = (date: string, amount = 1_500_000) => ({
    entityId, periodId, date, description: "Aporte de capital",
    lineas: [
      { accountId: acc["1.1.01.001"], debit: amount, credit: 0, currencyCode: "PYG" },
      { accountId: acc["3.1"], debit: 0, credit: amount, currencyCode: "PYG" },
    ],
  });

  beforeAll(async () => {
    t = await createTestDb();
    user = (await t.owner`insert into users (name, email, two_factor_enabled) values ('Ana', 'ana@x.test', true) returning id`)[0].id as string;
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    appRouter = (await import("@/trpc")).appRouter;
    entityId = (await caller().entities.create({ ruc: "1234567-9", legalName: "E1", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${entityId}, 2026, 10, 'open') on conflict do nothing`;
    periodId = (await t.owner`select id from fiscal_periods where entity_id = ${entityId} and year = 2026 and month = 10`)[0].id;
    for (const r of await t.owner`select a.id, a.code from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${entityId}`) acc[r.code] = r.id;
  }, 180_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("journal-entries.create rejects a date outside the period month", async () => {
    await expect(caller()["journal-entries"].create(input("2026-09-30"))).rejects.toMatchObject({ code: "BAD_REQUEST", message: "La fecha no corresponde al período" });
    await expect(caller()["journal-entries"].create(input("2027-10-15"))).rejects.toMatchObject({ message: "La fecha no corresponde al período" });
    expect((await t.owner`select count(*)::int as n from journal_entries where entity_id = ${entityId}`)[0].n).toBe(0);
  });

  it("a manual balanced entry posts and appears in the Libro Diario", async () => {
    const { id } = await caller()["journal-entries"].create(input("2026-10-15"));
    const got = await caller()["journal-entries"].get({ id });
    expect(got.status).toBe("posted");
    expect(got.lines).toHaveLength(2);
    const r = await caller().reports.diario({ entityId, from: "2026-10-01", to: "2026-10-31" });
    expect(new Set(r.rows.map((x) => x.entryId))).toEqual(new Set([id]));
    expect(r.totals).toMatchObject({ debit: 1_500_000, credit: 1_500_000, entries: 1, lines: 2 });
  });
});
