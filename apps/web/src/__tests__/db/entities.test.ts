// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";
import { mod11Dv } from "@intelicont/ledger/fiscal-py";
import { PY_CHART_OF_ACCOUNTS, flattenTree } from "@/lib/chart-of-accounts";

type DbModule = typeof import("@ledger/db/index");
type RepoModule = typeof import("@ledger/db/repository");
type AppRouter = typeof import("@/trpc").appRouter;

const ruc = (body: string) => `${body}-${mod11Dv(body)}`;

describe.skipIf(!process.env.TEST_ADMIN_URL)("entities.create, chart of accounts, periods (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let repo: RepoModule;
  let appRouter: AppRouter;
  let creator: string, other: string;
  const prevUrl = process.env.DATABASE_URL;
  const caller = (userId: string) => appRouter.createCaller({ userId, requestId: "t" });
  const input = (r: string) => ({
    ruc: r,
    legalName: "Empresa Nueva S.A.",
    tradeName: "Nueva",
    taxRegimes: ["IVA_GRAL", "IRE_GRAL"] as ("IVA_GRAL" | "IRE_GRAL")[],
    baseCurrency: "PYG" as "PYG" | "USD",
  });
  const seedCount = flattenTree(PY_CHART_OF_ACCOUNTS).length;

  beforeAll(async () => {
    t = await createTestDb();
    // 2FA enabled: the creator becomes admin of the new entity and the policy would block it otherwise.
    const user = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    creator = await user("creator@x.test");
    other = await user("other@x.test");
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    repo = await import("@ledger/db/repository");
    appRouter = (await import("@/trpc")).appRouter;
  }, 120_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("create with an invalid RUC check digit is rejected", async () => {
    await expect(caller(creator).entities.create(input("80014066-3"))).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await caller(creator).entities.list()).toEqual([]);
  });

  it("create with a valid RUC creates entity, chart of accounts, seed accounts and one open period", async () => {
    const { id } = await caller(creator).entities.create(input("80014066-4"));
    const [coas, accts, periods, members] = await Promise.all([
      t.owner`select kind, name from chart_of_accounts where entity_id = ${id}`,
      t.owner`select count(*)::int as n from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${id}`,
      t.owner`select year, month, status from fiscal_periods where entity_id = ${id}`,
      t.owner`select role from memberships where entity_id = ${id} and user_id = ${creator}`,
    ]);
    expect(coas).toHaveLength(1);
    expect(coas[0]).toMatchObject({ kind: "fiscal_py", name: "Plan de Cuentas PY" });
    expect(accts[0].n).toBe(seedCount);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }).split("-").map(Number);
    expect(periods).toHaveLength(1);
    expect(periods[0]).toMatchObject({ year: today[0], month: today[1], status: "open" });
    expect(members[0].role).toBe("admin");
  });

  it("created entity is listed afterwards and survives a new session", async () => {
    const r = ruc("80014067");
    const { id } = await caller(creator).entities.create(input(r));
    // A brand-new caller/transaction for the same user (what a reloaded page does).
    const list = await appRouter.createCaller({ userId: creator, requestId: "t2" }).entities.list();
    expect(list.map((e) => e.id)).toContain(id);
    expect(list.find((e) => e.id === id)).toMatchObject({ ruc: r, legalName: "Empresa Nueva S.A.", tradeName: "Nueva", baseCurrency: "PYG" });
  });

  it("duplicate RUC is rejected with CONFLICT", async () => {
    const r = ruc("80014068");
    await caller(creator).entities.create(input(r));
    const err = await caller(creator).entities.create(input(r)).catch((e) => e);
    expect(err).toMatchObject({ code: "CONFLICT" });
    expect(String(err.message)).not.toMatch(/duplicate key|insert into/i);
    // the failed attempt left no half-created entity behind
    const n = await t.owner`select count(*)::int as n from entities where ruc = ${r}`;
    expect(n[0].n).toBe(1);
  });

  it("user in another entity cannot see the created entity", async () => {
    const { id } = await caller(creator).entities.create(input(ruc("80014069")));
    expect((await caller(other).entities.list()).map((e) => e.id)).not.toContain(id);
    expect(await caller(other).accounts.list({ entityId: id })).toEqual([]);
  });

  it("accounts.tree returns the seeded tree with resolved parents", async () => {
    const { id } = await caller(creator).entities.create(input(ruc("80014070")));
    const flat = await caller(creator).accounts.list({ entityId: id });
    expect(flat).toHaveLength(seedCount);
    const byId = new Map(flat.map((a) => [a.id, a]));
    const byCode = new Map(flat.map((a) => [a.code, a]));
    for (const seed of flattenTree(PY_CHART_OF_ACCOUNTS)) {
      const row = byCode.get(seed.code)!;
      expect(row.nature).toBe(seed.nature);
      expect(row.allowsPosting).toBe(seed.allowsPosting);
      expect(row.parentId ? byId.get(row.parentId)?.code : null).toBe(seed.parentCode);
    }
    const tree = await caller(creator).accounts.tree({ entityId: id });
    expect(tree.map((n: { code: string }) => n.code)).toEqual(PY_CHART_OF_ACCOUNTS.map((n) => n.code));
    expect(tree[0].children.map((c: { code: string }) => c.code)).toContain("1.1");
  });

  // A seed with a repeated code yields two accounts rows with the same id -> unique violation (accounts_pkey)
  // AFTER create_entity, the chart and the first accounts insert already ran in the transaction.
  const badSeed = () => {
    const a = flattenTree(PY_CHART_OF_ACCOUNTS)[0];
    return [a, a];
  };
  const failingCreate = (r: string) =>
    db.withTenant(creator, () =>
      repo.createEntityWithChart({ ruc: r, legalName: "X", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" }, badSeed(), { year: 2026, month: 1 }),
    );

  it("a failure after create_entity rolls back entity, membership and chart", async () => {
    const r = ruc("80014072");
    await expect(failingCreate(r)).rejects.toBeDefined();
    const [e, m, c] = await Promise.all([
      t.owner`select count(*)::int as n from entities where ruc = ${r}`,
      t.owner`select count(*)::int as n from memberships m join entities e on e.id = m.entity_id where e.ruc = ${r}`,
      t.owner`select count(*)::int as n from chart_of_accounts c join entities e on e.id = c.entity_id where e.ruc = ${r}`,
    ]);
    expect([e[0].n, m[0].n, c[0].n]).toEqual([0, 0, 0]);
    // Without one surrounding transaction create_entity would have been committed on its own: n would be 1.
  });

  it("non-RUC unique violation is not reported as duplicate RUC", async () => {
    // Same failure through the router seam: the generic mapping must not say "RUC".
    const err = await failingCreate(ruc("80014073")).catch((e) => e);
    expect(err).toBeDefined();
    const { isRucUniqueViolation } = await import("@/trpc/routers/entities");
    expect(isRucUniqueViolation(err)).toBe(false);
    const dup = await caller(creator).entities.create(input(ruc("80014074"))).then(() => caller(creator).entities.create(input(ruc("80014074")))).catch((e) => e);
    expect(dup).toMatchObject({ code: "CONFLICT" });
  });

  it("input limits: unsupported currency and overlong names are rejected", async () => {
    await expect(caller(creator).entities.create({ ...input(ruc("80014075")), baseCurrency: "EUR" as "PYG" })).rejects.toBeDefined();
    await expect(caller(creator).entities.create({ ...input(ruc("80014075")), legalName: "x".repeat(201) })).rejects.toBeDefined();
  });

  it("nested withTenant for a different user throws", async () => {
    await expect(db.withTenant(creator, () => db.withTenant(other, async () => 1))).rejects.toThrow(
      "Nested tenant context for another user",
    );
  });

  it("concurrent withTenant calls for different users stay isolated", async () => {
    const mine = (u: string) => db.withTenant(u, (tx) => tx.execute(sql`select id::text from entities`).then((r) => r.map((x) => x.id as string).sort()));
    const { id: e1 } = await caller(other).entities.create(input(ruc("80014071")));
    const expectedCreator = (await caller(creator).entities.list()).map((e) => e.id).sort();
    for (let i = 0; i < 5; i++) {
      const [a, b] = await Promise.all([mine(creator), mine(other)]);
      expect(a).toEqual(expectedCreator);
      expect(b).toEqual([e1]);
    }
  });
});
