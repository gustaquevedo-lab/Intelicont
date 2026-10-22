// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";
import { mod11Dv } from "@intelicont/ledger/fiscal-py";

type DbModule = typeof import("@ledger/db/index");
type AppRouter = typeof import("@/trpc").appRouter;

const ruc = (body: string) => `${body}-${mod11Dv(body)}`;

describe.skipIf(!process.env.TEST_ADMIN_URL)("partners (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let appRouter: AppRouter;
  let admin: string, outsider: string, e1: string, e2: string;
  const prevUrl = process.env.DATABASE_URL;
  const caller = (userId: string) => appRouter.createCaller({ userId, requestId: "t" });
  const base = (entityId: string, r: string) => ({ entityId, kind: "supplier" as const, ruc: r, legalName: "Proveedor S.A." });

  beforeAll(async () => {
    t = await createTestDb();
    const user = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    admin = await user("admin@x.test");
    outsider = await user("outsider@x.test");
    e1 = (await t.owner`insert into entities (ruc, legal_name) values ('80011111-0', 'E1') returning id`)[0].id;
    e2 = (await t.owner`insert into entities (ruc, legal_name) values ('80011112-8', 'E2') returning id`)[0].id;
    await t.owner`insert into memberships (user_id, entity_id, role) values (${admin}, ${e1}, 'admin'), (${admin}, ${e2}, 'admin'), (${outsider}, ${e2}, 'admin')`;
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    appRouter = (await import("@/trpc")).appRouter;
  }, 120_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("RUC with invalid check digit is rejected", async () => {
    const err = await caller(admin).partners.create(base(e1, "80014066-3")).catch((e) => e);
    expect(err).toMatchObject({ code: "BAD_REQUEST" });
    expect(String(err.message)).toMatch(/Dígito verificador inválido/);
  });

  it("valid RUC is stored without DV and dv_ruc separately", async () => {
    const { id } = await caller(admin).partners.create(base(e1, "80014066-4"));
    const [row] = await t.owner`select ruc, dv_ruc, country from partners where id = ${id}`;
    expect(row).toMatchObject({ ruc: "80014066", dv_ruc: "4", country: "PRY" });
    const listed = (await caller(admin).partners.list({ entityId: e1 })).find((p) => p.id === id);
    expect(listed).toMatchObject({ ruc: "80014066", dvRuc: "4", rucDisplay: "80014066-4" });
  });

  it("bare cédula is accepted and stored without DV", async () => {
    const { id } = await caller(admin).partners.create({ ...base(e1, "1234567"), kind: "customer" });
    const [row] = await t.owner`select ruc, dv_ruc from partners where id = ${id}`;
    expect(row).toMatchObject({ ruc: "1234567", dv_ruc: null });
    const listed = (await caller(admin).partners.list({ entityId: e1 })).find((p) => p.id === id);
    expect(listed?.rucDisplay).toBe("1234567");
  });

  it("foreign partner skips RUC validation", async () => {
    const { id } = await caller(admin).partners.create({ ...base(e1, "XX-99/abc"), country: "ARG" });
    const [row] = await t.owner`select ruc, dv_ruc, country from partners where id = ${id}`;
    expect(row).toMatchObject({ ruc: "XX-99/abc", dv_ruc: null, country: "ARG" });
  });

  it("duplicate RUC in the same entity is rejected with CONFLICT", async () => {
    await caller(admin).partners.create(base(e1, ruc("80014067")));
    const err = await caller(admin).partners.create(base(e1, ruc("80014067"))).catch((e) => e);
    expect(err).toMatchObject({ code: "CONFLICT" });
    expect(String(err.message)).not.toMatch(/duplicate key|insert into/i);
  });

  it("the same RUC in another entity is allowed", async () => {
    await caller(admin).partners.create(base(e1, ruc("80014068")));
    await expect(caller(admin).partners.create(base(e2, ruc("80014068")))).resolves.toHaveProperty("id");
  });

  it("a user of another entity cannot list or create partners in this entity", async () => {
    await caller(admin).partners.create(base(e1, ruc("80014069")));
    expect(await caller(outsider).partners.list({ entityId: e1 })).toEqual([]);
    const err = await caller(outsider).partners.create(base(e1, ruc("80014070"))).catch((e) => e);
    expect(err).toMatchObject({ code: "FORBIDDEN" });
    expect(String(err.message)).not.toMatch(/row-level|insert into/i);
    const n = await t.owner`select count(*)::int as n from partners where ruc = '80014070'`;
    expect(n[0].n).toBe(0);
  });

  it("update changes names but rejects RUC changes", async () => {
    const { id } = await caller(admin).partners.create(base(e1, ruc("80014071")));
    await caller(admin).partners.update({ id, legalName: "Nuevo Nombre", tradeName: "NN", kind: "both", defaultPaymentTerms: 45, contacts: { email: "a@b.py" } });
    const [row] = await t.owner`select ruc, legal_name, trade_name, kind, default_payment_terms, contacts from partners where id = ${id}`;
    expect(row).toMatchObject({ ruc: "80014071", legal_name: "Nuevo Nombre", trade_name: "NN", kind: "both", default_payment_terms: 45, contacts: { email: "a@b.py" } });
    await expect(caller(admin).partners.update({ id, ruc: "80014072" } as never)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const [after] = await t.owner`select ruc from partners where id = ${id}`;
    expect(after.ruc).toBe("80014071");
    // another entity's user cannot update it
    await expect(caller(outsider).partners.update({ id, legalName: "Hack" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("update can clear the trade name", async () => {
    const { id } = await caller(admin).partners.create({ ...base(e1, ruc("80014075")), tradeName: "Marca" });
    await caller(admin).partners.update({ id, tradeName: "" });
    const [row] = await t.owner`select trade_name, legal_name from partners where id = ${id}`;
    expect(row).toMatchObject({ trade_name: null, legal_name: "Proveedor S.A." });
    await expect(caller(admin).partners.update({ id, legalName: "" })).rejects.toBeDefined();
  });

  it("contacts update merges instead of replacing", async () => {
    const { id } = await caller(admin).partners.create({ ...base(e1, ruc("80014076")), contacts: { email: "a@b.py", phone: "0981", address: "Asu" } });
    await caller(admin).partners.update({ id, contacts: { email: "c@d.py" } });
    const get = async () => (await t.owner`select contacts from partners where id = ${id}`)[0].contacts;
    expect(await get()).toEqual({ email: "c@d.py", phone: "0981", address: "Asu" });
    await caller(admin).partners.update({ id, contacts: { phone: "" } });
    expect(await get()).toEqual({ email: "c@d.py", address: "Asu" });
  });

  it("concurrent contacts updates do not lose keys", async () => {
    for (let i = 0; i < 8; i++) {
      const { id } = await caller(admin).partners.create(base(e1, ruc(`8002${String(i).padStart(4, "0")}`)));
      await Promise.all([
        caller(admin).partners.update({ id, contacts: { email: `e${i}@b.py` } }),
        caller(admin).partners.update({ id, contacts: { phone: `098${i}` } }),
      ]);
      const [row] = await t.owner`select contacts from partners where id = ${id}`;
      expect(row.contacts).toEqual({ email: `e${i}@b.py`, phone: `098${i}` });
    }
  });

  it("malformed ids are BAD_REQUEST", async () => {
    await expect(caller(admin).partners.update({ id: "nope", legalName: "X" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller(admin).partners.create(base("nope", ruc("80014077")))).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller(admin).partners.create({ ...base(e1, ruc("80014077")), country: "py" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("non-RUC unique violation is not reported as duplicate", async () => {
    const { isPartnerRucUniqueViolation } = await import("@/trpc/routers/partners");
    const pk = await db
      .withTenant(admin, async (tx) => {
        const q = (await import("drizzle-orm")).sql;
        await tx.execute(q`insert into partners (id, entity_id, kind, ruc, legal_name) values ('00000000-0000-0000-0000-0000000000a1', ${e1}, 'customer', '7000001', 'A')`);
        await tx.execute(q`insert into partners (id, entity_id, kind, ruc, legal_name) values ('00000000-0000-0000-0000-0000000000a1', ${e1}, 'customer', '7000002', 'B')`);
      })
      .catch((e) => e);
    const raw = (pk as { cause?: { code?: string; constraint_name?: string }; code?: string; constraint_name?: string });
    expect(raw.cause?.code ?? raw.code).toBe("23505");
    expect(raw.cause?.constraint_name ?? raw.constraint_name).toBe("partners_pkey");
    expect(isPartnerRucUniqueViolation(pk)).toBe(false);
    const dup = await caller(admin).partners.create(base(e1, ruc("80014073"))).then(() => caller(admin).partners.create(base(e1, ruc("80014073")))).catch((e) => e);
    expect(dup).toMatchObject({ code: "CONFLICT" });
  });

  it("input limits: overlong names and out-of-range terms are rejected", async () => {
    await expect(caller(admin).partners.create({ ...base(e1, ruc("80014074")), legalName: "x".repeat(201) })).rejects.toBeDefined();
    await expect(caller(admin).partners.create({ ...base(e1, ruc("80014074")), defaultPaymentTerms: 366 })).rejects.toBeDefined();
  });
});
