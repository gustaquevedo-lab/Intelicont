// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type RepoModule = typeof import("@ledger/db/repository");
type AppRouter = typeof import("@/trpc").appRouter;

describe.skipIf(!process.env.TEST_ADMIN_URL)("tenant scope from session memberships (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let repo: RepoModule;
  let appRouter: AppRouter;
  let e1: string, e2: string, e3: string;
  let uOne: string, uNone: string, uBoth: string, uAdmin: string, uAdmin2fa: string;
  const prevUrl = process.env.DATABASE_URL;

  const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();

  beforeAll(async () => {
    t = await createTestDb();
    const M = t.owner;
    const user = async (email: string, twoFa = false) =>
      (await M`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, ${twoFa}) returning id`)[0].id as string;
    const entity = async (ruc: string, name: string) =>
      (await M`insert into entities (ruc, legal_name) values (${ruc}, ${name}) returning id`)[0].id as string;
    const member = (u: string, e: string, role: string) =>
      M`insert into memberships (user_id, entity_id, role) values (${u}, ${e}, ${role})`;

    e1 = await entity("80000011-1", "Empresa 1");
    e2 = await entity("80000022-2", "Empresa 2");
    e3 = await entity("80000033-3", "Empresa 3");
    uOne = await user("one@x.test");
    uNone = await user("none@x.test");
    uBoth = await user("both@x.test");
    uAdmin = await user("admin@x.test");
    uAdmin2fa = await user("admin2fa@x.test", true);
    await member(uOne, e1, "accountant");
    await member(uBoth, e1, "assistant");
    await member(uBoth, e2, "accountant");
    await member(uAdmin, e3, "admin");
    await member(uAdmin2fa, e3, "admin");

    // Point the app modules at the harness runtime role (subject to RLS).
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    repo = await import("@ledger/db/repository");
    appRouter = (await import("@/trpc")).appRouter;
  }, 120_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    // The module pool runs as the runtime role; the harness admin cannot terminate its backends.
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("user with membership in E1 sees only E1", async () => {
    expect(ids(await db.withTenant(uOne, () => repo.getEntities()))).toEqual([e1]);
  });

  it("user without memberships sees nothing", async () => {
    expect(await db.withTenant(uNone, () => repo.getEntities())).toEqual([]);
  });

  it("user in two entities sees both", async () => {
    expect(ids(await db.withTenant(uBoth, () => repo.getEntities()))).toEqual([e1, e2].sort());
  });

  it("tenantDb without a tenant context throws", async () => {
    await expect(db.tenantDb(async () => 1)).rejects.toThrow("No tenant context");
    await expect(repo.getEntities()).rejects.toThrow("No tenant context");
  });

  it("app.user_id is set inside withTenant", async () => {
    const rows = await db.withTenant(uOne, (tx) => tx.execute(sql`select app_user_id()::text as v`));
    expect(rows[0].v).toBe(uOne);
  });

  it("withTenant for unknown user sees nothing", async () => {
    expect(await db.withTenant(randomUUID(), () => repo.getEntities())).toEqual([]);
  });

  it("admin without 2FA is rejected with FORBIDDEN on a tRPC call", async () => {
    const caller = appRouter.createCaller({ userId: uAdmin, requestId: "t" });
    await expect(caller.entities.list()).rejects.toMatchObject({ code: "FORBIDDEN", message: "2FA requerido" });
  });

  it("admin with 2FA passes", async () => {
    const caller = appRouter.createCaller({ userId: uAdmin2fa, requestId: "t" });
    expect(ids(await caller.entities.list())).toEqual([e3]);
  });

  it("unauthenticated tRPC call is UNAUTHORIZED", async () => {
    const caller = appRouter.createCaller({ requestId: "t" });
    await expect(caller.entities.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
