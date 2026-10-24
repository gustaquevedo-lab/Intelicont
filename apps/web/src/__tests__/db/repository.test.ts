// @vitest-environment node
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type RepoModule = typeof import("@ledger/db/repository");

describe.skipIf(!process.env.TEST_ADMIN_URL)("repository reads and writes (real Postgres, RLS-scoped)", () => {
  let t: TestDb;
  let db: DbModule;
  let repo: RepoModule;
  let user: string, outsider: string, e1: string, e2: string, coa: string, cash: string, sales: string, entry: string, partner: string, doc: string;
  const prevUrl = process.env.DATABASE_URL;
  const as = <T>(userId: string, fn: () => Promise<T>) => db.withTenant(userId, fn);

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    user = await mkUser("u@x.test");
    outsider = await mkUser("o@x.test");
    e1 = (await t.owner`insert into entities (ruc, legal_name) values ('80011111-0', 'E1') returning id`)[0].id;
    e2 = (await t.owner`insert into entities (ruc, legal_name) values ('80011112-8', 'E2') returning id`)[0].id;
    await t.owner`insert into memberships (user_id, entity_id, role) values (${user}, ${e1}, 'admin'), (${outsider}, ${e2}, 'admin')`;
    coa = (await t.owner`insert into chart_of_accounts (entity_id, kind, name) values (${e1}, 'fiscal_py', 'PC') returning id`)[0].id;
    const a = await t.owner`insert into accounts (coa_id, code, name, nature, allows_posting) values (${coa}, '1.1', 'Caja', 'asset', true), (${coa}, '4.1', 'Ventas', 'income', true) returning id, code`;
    cash = a.find((r) => r.code === "1.1")!.id;
    sales = a.find((r) => r.code === "4.1")!.id;
    await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, 2026, 9, 'closed'), (${e1}, 2026, 10, 'open')`;
    const p = (await t.owner`select id from fiscal_periods where entity_id = ${e1} and month = 10`)[0].id;
    entry = (await t.owner`insert into journal_entries (entity_id, period_id, date, number, source, status) values (${e1}, ${p}, '2026-10-01', 'R-1', 'manual', 'draft') returning id`)[0].id;
    await t.owner`insert into journal_lines (entry_id, account_id, debit, credit, currency_code) values (${entry}, ${cash}, 500, 0, 'PYG'), (${entry}, ${sales}, 0, 500, 'PYG')`;
    await t.owner`update journal_entries set status = 'posted' where id = ${entry}`;
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    repo = await import("@ledger/db/repository");
  }, 120_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("entities, periods and accounts are scoped to the caller", async () => {
    expect((await as(user, () => repo.getEntities())).map((e) => e.id)).toEqual([e1]);
    expect((await as(user, () => repo.getEntity(e1)))?.legalName).toBe("E1");
    expect(await as(user, () => repo.getEntity(e2))).toBeUndefined();
    const periods = await as(user, () => repo.getFiscalPeriods(e1));
    expect(periods.map((p) => p.month)).toEqual([10, 9]);
    expect((await as(user, () => repo.getOpenPeriod(e1)))?.month).toBe(10);
    expect((await as(user, () => repo.getAccountsByCoa(coa))).map((x) => x.code)).toEqual(["1.1", "4.1"]);
    expect((await as(user, () => repo.getAllAccounts(e1))).map((x) => x.code)).toEqual(["1.1", "4.1"]);
    expect(await as(user, () => repo.getAllAccounts(e2))).toEqual([]);
    expect(await as(outsider, () => repo.getAllAccounts(e1))).toEqual([]);
  });

  it("journal entries carry total and reversedBy; lines are readable", async () => {
    const list = await as(user, () => repo.getJournalEntries(e1));
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: entry, total: "500", reversedBy: null });
    expect((await as(user, () => repo.getJournalEntry(entry)))?.number).toBe("R-1");
    expect(await as(outsider, () => repo.getJournalEntry(entry))).toBeUndefined();
    expect(await as(user, () => repo.getJournalLines(entry))).toHaveLength(2);
  });

  it("partners: create, read, list ordered by name and update contacts by merge", async () => {
    partner = await as(user, () => repo.createPartner({ entityId: e1, kind: "supplier", ruc: "80014066", dvRuc: "4", legalName: "Zeta", country: "PRY", contacts: { email: "a@x.test", phone: "1" } }));
    await as(user, () => repo.createPartner({ entityId: e1, kind: "customer", ruc: "1234567", dvRuc: "9", legalName: "Alfa", country: "PRY" }));
    expect((await as(user, () => repo.getPartners(e1))).map((p) => p.legalName)).toEqual(["Alfa", "Zeta"]);
    expect((await as(user, () => repo.getPartner(partner)))?.ruc).toBe("80014066");
    expect(await as(outsider, () => repo.getPartner(partner))).toBeUndefined();
    // "" removes a key, undefined keeps it, a new key is added.
    expect(await as(user, () => repo.updatePartner(partner, { contacts: { email: "", phone: undefined, address: "Calle 1" } }))).toBe(true);
    expect((await as(user, () => repo.getPartner(partner)))?.contacts).toEqual({ phone: "1", address: "Calle 1" });
    // Without contacts the stored ones are untouched.
    expect(await as(user, () => repo.updatePartner(partner, { tradeName: "Z S.A." }))).toBe(true);
    expect((await as(user, () => repo.getPartner(partner)))?.contacts).toEqual({ phone: "1", address: "Calle 1" });
    // Missing/foreign partner: false, with and without contacts.
    expect(await as(user, () => repo.updatePartner(randomUUID(), { contacts: { a: "b" } }))).toBe(false);
    expect(await as(user, () => repo.updatePartner(randomUUID(), { tradeName: "x" }))).toBe(false);
    expect(await as(outsider, () => repo.updatePartner(partner, { tradeName: "x" }))).toBe(false);
  });

  it("tax documents, lines, retentions, banking, audit and AI reads", async () => {
    const created = await as(user, () => repo.createTaxDocument({
      entityId: e1, direction: "received", docType: "invoice", number: "001-001-0000001", timbrado: "12345678",
      issueDate: "2026-10-01", partnerId: partner, condition: "cash", status: "pending", total: 1100,
    }));
    doc = created.id;
    await t.owner`insert into tax_documents (entity_id, direction, doc_type, number, timbrado, issue_date, condition, status, total)
      values (${e1}, 'received', 'invoice', '001-001-0000002', '12345678', '2026-10-02', 'cash', 'posted', 10)`;
    expect(await as(user, () => repo.getTaxDocuments(e1))).toHaveLength(2);
    expect((await as(user, () => repo.getPendingTaxDocuments(e1))).map((d) => d.id)).toEqual([doc]);
    expect((await as(user, () => repo.getTaxDocument(doc)))?.number).toBe("001-001-0000001");
    expect((await as(user, () => repo.getTaxDocumentsByPartner(partner))).map((d) => d.id)).toEqual([doc]);
    expect(await as(user, () => repo.getTaxDocumentLines(doc))).toEqual([]);
    expect(await as(user, () => repo.getRetentions(doc))).toEqual([]);
    expect(await as(user, () => repo.getBankMovements(randomUUID()))).toEqual([]);
    expect(await as(user, () => repo.getReconciliations(randomUUID()))).toEqual([]);
    expect(await as(user, () => repo.getAiDecisions(e1))).toEqual([]);
    await t.owner`insert into audit_events (entity_id, actor_id, action, target_type) values (${e1}, ${user}, 'x.a', 'x'), (${e1}, ${user}, 'x.b', 'x')`;
    expect(await as(user, () => repo.getAuditEvents(e1))).toHaveLength(2);
    expect(await as(user, () => repo.getAuditEvents(e1, 1))).toHaveLength(1);
  });
});
