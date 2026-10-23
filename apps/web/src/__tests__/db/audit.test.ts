// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type UseCases = typeof import("@ledger/src/usecases");
type AppRouter = typeof import("@/trpc").appRouter;

describe.skipIf(!process.env.TEST_ADMIN_URL)("audit.list and journal-entries.get detail (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let uc: UseCases;
  let appRouter: AppRouter;
  let user: string, outsider: string, e1: string, e2: string, p1: string, p2: string;
  const acc: Record<string, string> = {};
  const acc2: Record<string, string> = {};
  const prevUrl = process.env.DATABASE_URL;
  const caller = (userId = user) => appRouter.createCaller({ userId, requestId: "t", idempotencyKey: crypto.randomUUID() });
  const lines = (a: Record<string, string>, amount: number) => [
    { accountId: a["1.1.01.001"], debit: amount, credit: 0, currencyCode: "PYG" },
    { accountId: a["3.1"], debit: 0, credit: amount, currencyCode: "PYG" },
  ];
  const post = async (userId: string, entityId: string, periodId: string, a: Record<string, string>, number: string, amount = 1000) => {
    const res = await db.withTenant(userId, () => uc.postEntry({ entityId, periodId, date: new Date("2026-10-01"), number, lines: lines(a, amount) }));
    if (!res.ok) throw new Error(res.error);
    return res.value.id;
  };

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (name: string, email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${name}, ${email}, true) returning id`)[0].id as string;
    user = await mkUser("Ana Contadora", "ana@x.test");
    outsider = await mkUser("Otro", "o@x.test");
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    uc = await import("@ledger/src/usecases");
    appRouter = (await import("@/trpc")).appRouter;
    e1 = (await caller().entities.create({ ruc: "1234567-9", legalName: "E1", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    e2 = (await caller(outsider).entities.create({ ruc: "80014066-4", legalName: "E2", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    for (const [e, a] of [[e1, acc], [e2, acc2]] as const) {
      await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e}, 2026, 10, 'open') on conflict do nothing`;
      for (const r of await t.owner`select a.id, a.code from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${e}`) a[r.code] = r.id;
    }
    p1 = (await t.owner`select id from fiscal_periods where entity_id = ${e1} and year = 2026 and month = 10`)[0].id;
    p2 = (await t.owner`select id from fiscal_periods where entity_id = ${e2} and year = 2026 and month = 10`)[0].id;
  }, 180_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("audit.list returns the entity events newest first with the actor", async () => {
    const a = await post(user, e1, p1, acc, "AU-1");
    const b = await post(user, e1, p1, acc, "AU-2");
    const { events } = await caller().audit.list({ entityId: e1 });
    const posted = events.filter((e) => e.action === "journal_entry.posted");
    expect(posted.map((e) => e.targetId)).toEqual([b, a]);
    expect(posted[0]).toMatchObject({ targetType: "journal_entry", actor: { id: user, name: "Ana Contadora", email: "ana@x.test" } });
    const times = events.map((e) => new Date(e.createdAt!).getTime());
    expect(times).toEqual([...times].sort((x, y) => y - x));
  });

  it("audit.list filters by targetId and action", async () => {
    const a = await post(user, e1, p1, acc, "AU-3");
    const b = await post(user, e1, p1, acc, "AU-4");
    await caller()["journal-entries"].reverse({ entryId: a, reason: "error de carga" });
    const byTarget = await caller().audit.list({ entityId: e1, targetId: a });
    expect(byTarget.events.every((e) => e.targetId === a)).toBe(true);
    expect(byTarget.events.map((e) => e.action)).toContain("journal_entry.posted");
    const byAction = await caller().audit.list({ entityId: e1, action: "journal_entry.reversed" });
    expect(byAction.events.length).toBeGreaterThan(0);
    expect(byAction.events.every((e) => e.action === "journal_entry.reversed")).toBe(true);
    expect(byAction.events[0].reason).toBe("error de carga");
    const none = await caller().audit.list({ entityId: e1, targetId: b, action: "journal_entry.reversed" });
    expect(none.events).toEqual([]);
  });

  it("audit.list does not show other entities' events", async () => {
    const other = await post(outsider, e2, p2, acc2, "OT-1");
    const { events } = await caller().audit.list({ entityId: e1 });
    expect(events.some((e) => e.targetId === other)).toBe(false);
    const mine = await caller(outsider).audit.list({ entityId: e2 });
    expect(mine.events.map((e) => e.targetId)).toContain(other);
  });

  it("audit.list rejects an entity the user cannot see", async () => {
    await expect(caller(outsider).audit.list({ entityId: e1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("journal-entries.get returns lines with account code and name and the linked document", async () => {
    const id = await post(user, e1, p1, acc, "AU-5", 5000);
    const doc = (await t.owner`insert into tax_documents (entity_id, direction, doc_type, number, issue_date, total, journal_entry_id, cdc)
      values (${e1}, 'received', 'invoice', '001-001-0000001', '2026-10-01', 5000, ${id}, ${"1".repeat(44)}) returning id`)[0].id as string;
    const got = await caller()["journal-entries"].get({ id });
    expect(got.lines).toHaveLength(2);
    expect(got.lines.map((l) => [l.accountCode, l.accountName]).sort()).toEqual(
      [["1.1.01.001", expect.any(String)], ["3.1", expect.any(String)]],
    );
    expect(got.lines.every((l) => l.accountName.length > 0)).toBe(true);
    expect(got.document).toEqual({ id: doc, number: "001-001-0000001", cdc: "1".repeat(44) });
    const plain = await caller()["journal-entries"].get({ id: await post(user, e1, p1, acc, "AU-6") });
    expect(plain.document).toBeNull();
  });

  it("a reversed entry shows reversedBy and the reversal shows reversalOf", async () => {
    const orig = await post(user, e1, p1, acc, "AU-7");
    const { id: rev } = await caller()["journal-entries"].reverse({ entryId: orig, reason: "duplicado" });
    const o = await caller()["journal-entries"].get({ id: orig });
    const r = await caller()["journal-entries"].get({ id: rev });
    expect(o).toMatchObject({ status: "reversed", reversedBy: rev, reversalOf: null });
    expect(r).toMatchObject({ reversalOf: orig, reversedBy: null });
  });
});
