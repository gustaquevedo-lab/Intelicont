// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type AppRouter = typeof import("@/trpc").appRouter;
type Actions = typeof import("@/lib/actions");

// Server actions read the user from the Next request; here it comes from the test.
const session = vi.hoisted(() => ({ userId: "" }));
vi.mock("@/lib/session", () => ({ requireUser: async () => ({ userId: session.userId }) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

describe.skipIf(!process.env.TEST_ADMIN_URL)("idempotency keys (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let appRouter: AppRouter;
  let actions: Actions;
  let u1: string, u2: string, e1: string, p1: string, cash: string, sales: string;
  const prevUrl = process.env.DATABASE_URL;
  const caller = (userId: string, idempotencyKey?: string) => appRouter.createCaller({ userId, requestId: "t", idempotencyKey });
  const entry = (number: string, amount = 1000) => ({
    entityId: e1, periodId: p1, date: "2026-10-01", number,
    lineas: [
      { accountId: cash, debit: amount, credit: 0, currencyCode: "PYG" },
      { accountId: sales, debit: 0, credit: amount, currencyCode: "PYG" },
    ],
  });
  const entries = async (number: string) => Number((await t.owner`select count(*) n from journal_entries where number = ${number}`)[0].n);

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    u1 = await mkUser("u1@x.test");
    u2 = await mkUser("u2@x.test");
    e1 = (await t.owner`insert into entities (ruc, legal_name) values ('80011111-0', 'E1') returning id`)[0].id;
    await t.owner`insert into memberships (user_id, entity_id, role) values (${u1}, ${e1}, 'admin'), (${u2}, ${e1}, 'admin')`;
    const coa = (await t.owner`insert into chart_of_accounts (entity_id, kind, name) values (${e1}, 'fiscal_py', 'PC') returning id`)[0].id;
    [cash, sales] = (await t.owner`insert into accounts (coa_id, code, name, nature, allows_posting) values (${coa}, '1.1', 'Caja', 'asset', true), (${coa}, '4.1', 'Ventas', 'income', true) returning id, code`)
      .sort((x, y) => x.code.localeCompare(y.code)).map((r) => r.id as string);
    p1 = (await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, 2026, 10, 'open') returning id`)[0].id;
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    appRouter = (await import("@/trpc")).appRouter;
    actions = await import("@/lib/actions");
  }, 120_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("same key and same body returns the first response and creates one record", async () => {
    const key = crypto.randomUUID();
    const first = await caller(u1, key)["journal-entries"].create(entry("IDEM-1"));
    const second = await caller(u1, key)["journal-entries"].create(entry("IDEM-1"));
    expect(second).toEqual(first);
    expect(await entries("IDEM-1")).toBe(1);
    const [row] = await t.owner`select endpoint, response from idempotency_keys where user_id = ${u1} and key = ${key}`;
    expect(row).toMatchObject({ endpoint: "journal-entries.create", response: first });
  });

  it("same key with a different body is rejected with UNPROCESSABLE_CONTENT", async () => {
    const key = crypto.randomUUID();
    await caller(u1, key)["journal-entries"].create(entry("IDEM-2"));
    const err = await caller(u1, key)["journal-entries"].create(entry("IDEM-2", 2000)).catch((e) => e);
    expect(err).toMatchObject({ code: "UNPROCESSABLE_CONTENT", message: "Idempotency-Key reutilizada con otro cuerpo" });
    expect(await entries("IDEM-2")).toBe(1);
  });

  it("missing key is a BAD_REQUEST", async () => {
    await expect(caller(u1)["journal-entries"].create(entry("IDEM-3"))).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller(u1).partners.update({ id: crypto.randomUUID(), legalName: "X" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await entries("IDEM-3")).toBe(0);
  });

  it("malformed key is a BAD_REQUEST", async () => {
    await expect(caller(u1, "not-a-uuid")["journal-entries"].create(entry("IDEM-4"))).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await entries("IDEM-4")).toBe(0);
  });

  it("two concurrent calls with the same key create one record", async () => {
    const key = crypto.randomUUID();
    const [a, b] = await Promise.all([
      caller(u1, key)["journal-entries"].create(entry("IDEM-5")),
      caller(u1, key)["journal-entries"].create(entry("IDEM-5")),
    ]);
    expect(a).toEqual(b);
    expect(await entries("IDEM-5")).toBe(1);
  });

  it("a failed call does not consume the key", async () => {
    const key = crypto.randomUUID();
    const unbalanced = { ...entry("IDEM-6"), lineas: [entry("IDEM-6").lineas[0], { ...entry("IDEM-6").lineas[1], credit: 900 }] };
    await expect(caller(u1, key)["journal-entries"].create(unbalanced)).rejects.toBeDefined();
    expect((await t.owner`select count(*) n from idempotency_keys where key = ${key}`)[0].n).toBe("0");
    // The key row rolled back with the failure: the corrected request (different body) runs normally.
    const ok = await caller(u1, key)["journal-entries"].create(entry("IDEM-6"));
    expect(ok.success).toBe(true);
    expect(await entries("IDEM-6")).toBe(1);
  });

  it("keys are scoped per user", async () => {
    const key = crypto.randomUUID();
    const a = await caller(u1, key)["journal-entries"].create(entry("IDEM-7"));
    const b = await caller(u2, key)["journal-entries"].create(entry("IDEM-7"));
    expect(b.id).not.toBe(a.id);
    expect(await entries("IDEM-7")).toBe(2);
    // RLS: each user sees only its own key rows.
    const seen = await t.scoped([], (tx) => tx`select user_id from idempotency_keys where key = ${key}`, { "app.user_id": u2 });
    expect([...seen]).toEqual([{ user_id: u2 }]);
    await expect(t.scoped([], (tx) => tx`insert into idempotency_keys (user_id, endpoint, key, request_hash) values (${u1}, 'x', 'y', 'z')`, { "app.user_id": u2 }))
      .rejects.toThrow(/row-level security/);
  });

  it("server action createAsiento is idempotent", async () => {
    session.userId = u1;
    const key = crypto.randomUUID();
    const input = { entityId: e1, periodId: p1, date: "2026-10-01", descripcion: "IDEM-ACTION", lineas: entry("x").lineas.map((l) => ({ ...l, description: "" })) };
    const count = async () => Number((await t.owner`select count(*) n from journal_entries where description = 'IDEM-ACTION'`)[0].n);
    const [a, b] = await Promise.all([actions.createAsiento(input, key), actions.createAsiento(input, key)]);
    expect(a.success).toBe(true);
    expect(b).toEqual(a);
    expect(await count()).toBe(1);
    expect(await actions.createAsiento({ ...input, descripcion: "OTRO" }, key)).toMatchObject({ success: false, message: "Idempotency-Key reutilizada con otro cuerpo" });
    expect(await actions.createAsiento(input, "nope")).toMatchObject({ success: false });
    expect(await count()).toBe(1);
  });
});
