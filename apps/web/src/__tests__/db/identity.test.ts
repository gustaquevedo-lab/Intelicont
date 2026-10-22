// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

describe.skipIf(!process.env.TEST_ADMIN_URL)("identity: memberships + create_entity (real Postgres)", () => {
  let t: TestDb;
  let uA: string, uB: string, eB: string;
  const asUser = (u: string) => ({ "app.user_id": u });

  beforeAll(async () => {
    t = await createTestDb();
    const M = t.owner;
    uA = (await M`insert into users (name, email) values ('A','a@x.test') returning id`)[0].id;
    uB = (await M`insert into users (name, email) values ('B','b@x.test') returning id`)[0].id;
    eB = (await M`insert into entities (ruc, legal_name) values ('80099999-9','Empresa B') returning id`)[0].id;
    await M`insert into memberships (user_id, entity_id, role) values (${uB}, ${eB}, 'admin')`;
  }, 120_000);

  afterAll(async () => {
    await t?.drop();
  });

  it("user A cannot see memberships of user B", async () => {
    const rows = await t.scoped([], (tx) => tx`select user_id from memberships`, asUser(uA));
    expect(rows).toHaveLength(0);
    const own = await t.scoped([], (tx) => tx`select user_id from memberships`, asUser(uB));
    expect(own).toHaveLength(1);
    await expect(
      t.scoped([], (tx) => tx`insert into memberships (user_id, entity_id, role) values (${uB}, ${eB}, 'client')`, asUser(uA)),
    ).rejects.toThrow();
  });

  it("create_entity creates the entity and an admin membership for app.user_id", async () => {
    const id = await t.scoped(
      [],
      async (tx) =>
        (await tx`select create_entity('80012345-1', 'Nueva SA', 'Nueva', ${["IRE_GENERAL"]}::text[], 'PYG') as id`)[0].id as string,
      asUser(uA),
    );
    const [e] = await t.owner`select ruc, legal_name, trade_name, tax_regimes, base_currency from entities where id = ${id}`;
    expect(e).toMatchObject({ ruc: "80012345-1", legal_name: "Nueva SA", trade_name: "Nueva", base_currency: "PYG" });
    expect(e.tax_regimes).toEqual(["IRE_GENERAL"]);
    const m = await t.owner`select user_id, role from memberships where entity_id = ${id}`;
    expect(m).toEqual([expect.objectContaining({ user_id: uA, role: "admin" })]);
  });

  it("create_entity without app.user_id fails", async () => {
    await expect(
      t.scoped([], (tx) => tx`select create_entity('80000002-3', 'Sin Usuario', null, null, 'PYG')`),
    ).rejects.toThrow(/app\.user_id/);
  });

  it("entity created by create_entity is visible in the same transaction", async () => {
    const seen = await t.scoped(
      [],
      async (tx) => {
        const id = (await tx`select create_entity('80000003-1', 'Visible SA', null, null, 'PYG') as id`)[0].id as string;
        return (await tx`select id from entities where id = ${id}`).length;
      },
      asUser(uA),
    );
    expect(seen).toBe(1);
  });

  it("runtime role cannot insert into entities directly", async () => {
    await expect(
      t.scoped([], (tx) => tx`insert into entities (ruc, legal_name) values ('80000004-9', 'Directa')`, asUser(uA)),
    ).rejects.toThrow(/row-level security/);
  });
});
