// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type RepoModule = typeof import("@ledger/db/repository");
type UseCases = typeof import("@ledger/src/usecases");
type AuditModule = typeof import("@ledger/db/audit");

describe.skipIf(!process.env.TEST_ADMIN_URL)("post/reverse use cases and audit (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let repo: RepoModule;
  let uc: UseCases;
  let audit: AuditModule;
  let user: string, outsider: string, e1: string, e2: string, cash: string, sales: string, p1: string, p2: string, cashE2: string;
  const prevUrl = process.env.DATABASE_URL;
  const as = <T>(userId: string, fn: () => Promise<T>) => db.withTenant(userId, fn);
  const lines = (amount: number) => [
    { accountId: cash, debit: amount, credit: 0, currencyCode: "PYG" },
    { accountId: sales, debit: 0, credit: amount, currencyCode: "PYG" },
  ];
  const post = (number: string, amount = 1000, over: Record<string, unknown> = {}) =>
    as(user, () => uc.postEntry({ entityId: e1, periodId: p1, date: new Date("2026-10-01"), number, lines: lines(amount), ...over }));
  const count = async (q: Promise<{ n: string }[]>) => Number((await q)[0].n);

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    user = await mkUser("u@x.test");
    outsider = await mkUser("o@x.test");
    e1 = (await t.owner`insert into entities (ruc, legal_name) values ('80011111-0', 'E1') returning id`)[0].id;
    e2 = (await t.owner`insert into entities (ruc, legal_name) values ('80011112-8', 'E2') returning id`)[0].id;
    await t.owner`insert into memberships (user_id, entity_id, role) values (${user}, ${e1}, 'admin'), (${outsider}, ${e2}, 'admin')`;
    const accts = async (entityId: string) => {
      const coa = (await t.owner`insert into chart_of_accounts (entity_id, kind, name) values (${entityId}, 'fiscal_py', 'PC') returning id`)[0].id;
      const a = (await t.owner`insert into accounts (coa_id, code, name, nature, allows_posting) values (${coa}, '1.1', 'Caja', 'asset', true), (${coa}, '4.1', 'Ventas', 'income', true) returning id, code`);
      return a.sort((x, y) => x.code.localeCompare(y.code)).map((r) => r.id as string);
    };
    [cash, sales] = await accts(e1);
    [cashE2] = await accts(e2);
    p1 = (await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, 2026, 10, 'open') returning id`)[0].id;
    p2 = (await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e2}, 2026, 10, 'open') returning id`)[0].id;
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    repo = await import("@ledger/db/repository");
    uc = await import("@ledger/src/usecases");
    audit = await import("@ledger/db/audit");
  }, 120_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("postEntry unbalanced returns Err with the trigger message and leaves no draft", async () => {
    const res = await post("BAD-1", 1000, { lines: [lines(1000)[0], { ...lines(1000)[1], credit: 900 }] });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/not balanced/);
    expect(await count(t.owner`select count(*) n from journal_entries where number = 'BAD-1'`)).toBe(0);
    expect(await count(t.owner`select count(*) n from audit_events where entity_id = ${e1}`)).toBe(0);
  });

  it("postEntry success leaves one journal_entry.posted audit event with actor_id", async () => {
    const res = await post("OK-1", 2500);
    expect(res.ok).toBe(true);
    const id = res.ok ? res.value.id : "";
    const rows = await t.owner`select * from audit_events where action = 'journal_entry.posted' and target_id = ${id}`;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ entity_id: e1, actor_id: user, target_type: "journal_entry" });
    expect(rows[0].after).toEqual({ number: "OK-1", lines: 2, totalDebit: 2500 });
  });

  it("postEntry rejects non-integer money before touching the DB", async () => {
    const res = await post("FLOAT-1", 10.5);
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/Importe inválido/) });
  });

  it("reverseEntry creates inverse lines linked by reversal_of and posts", async () => {
    const orig = await post("REV-SRC", 700);
    if (!orig.ok) throw new Error(orig.error);
    const res = await as(user, () => uc.reverseEntry(orig.value.id, "Error de carga"));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value).toMatchObject({ reversalOf: orig.value.id, status: "posted", number: "REV-REV-SRC", periodId: p1 });
    const rl = await t.owner`select account_id, debit, credit from journal_lines where entry_id = ${res.value.id}`;
    expect(rl.find((l) => l.account_id === cash)).toMatchObject({ debit: "0", credit: "700" });
    expect(rl.find((l) => l.account_id === sales)).toMatchObject({ debit: "700", credit: "0" });
    const ev = await t.owner`select * from audit_events where action = 'journal_entry.reversed' and target_id = ${res.value.id}`;
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ actor_id: user, reason: "Error de carga", before: { id: orig.value.id, number: "REV-SRC" }, after: { id: res.value.id } });
  });

  it("reverseEntry twice returns Err", async () => {
    const orig = await post("TWICE", 300);
    if (!orig.ok) throw new Error(orig.error);
    expect((await as(user, () => uc.reverseEntry(orig.value.id, "primera"))).ok).toBe(true);
    const again = await as(user, () => uc.reverseEntry(orig.value.id, "segunda"));
    expect(again).toEqual({ ok: false, error: "El asiento ya fue revertido" });
    expect(await count(t.owner`select count(*) n from journal_entries where reversal_of = ${orig.value.id}`)).toBe(1);
  });

  it("reverseEntry without an open period returns Err", async () => {
    const orig = await post("NOPERIOD", 400);
    if (!orig.ok) throw new Error(orig.error);
    await t.owner`update fiscal_periods set status = 'closed' where id = ${p1}`;
    try {
      const res = await as(user, () => uc.reverseEntry(orig.value.id, "cierre"));
      expect(res).toEqual({ ok: false, error: "No hay período abierto" });
    } finally {
      await t.owner`update fiscal_periods set status = 'open' where id = ${p1}`;
    }
  });

  it("reverse of an entry from another entity is not found", async () => {
    const orig = await post("FOREIGN", 100);
    if (!orig.ok) throw new Error(orig.error);
    const res = await as(outsider, () => uc.reverseEntry(orig.value.id, "intruso"));
    expect(res).toEqual({ ok: false, error: "Asiento no encontrado" });
    expect(await as(outsider, () => uc.reverseEntry("not-a-uuid", "x"))).toEqual({ ok: false, error: "Asiento no encontrado" });
    expect(await count(t.owner`select count(*) n from journal_entries where reversal_of = ${orig.value.id}`)).toBe(0);
  });

  it("reversed state is derived from the reversal entry", async () => {
    const orig = await post("DERIVED", 150);
    if (!orig.ok) throw new Error(orig.error);
    const before = await as(user, () => repo.getJournalEntry(orig.value.id));
    expect(before).toMatchObject({ status: "posted", reversedBy: null });
    const rev = await as(user, () => uc.reverseEntry(orig.value.id, "motivo"));
    if (!rev.ok) throw new Error(rev.error);
    const after = await as(user, () => repo.getJournalEntries(e1));
    expect(after.find((e) => e.id === orig.value.id)).toMatchObject({ status: "posted", reversedBy: rev.value.id });
    expect(after.find((e) => e.id === rev.value.id)?.reversedBy).toBeNull();
  });

  it("audited does not write an event when the work fails", async () => {
    const n0 = await count(t.owner`select count(*) n from audit_events`);
    await as(user, () => db.tenantDb(async (tx) => {
      await expect(audit.audited(tx, { entityId: e1, action: "x.failed", targetType: "x" }, async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    }));
    expect(await count(t.owner`select count(*) n from audit_events`)).toBe(n0);
    // No actor: refuses to audit and aborts the work's transaction.
    await expect(db.getDb().transaction((tx) => audit.audited(tx as never, { entityId: e1, action: "x.anon", targetType: "x" }, async () => 1))).rejects.toThrow(/actor/);
  });

  it("every mutating use case emits an audit event", async () => {
    expect(Object.keys(uc.MUTATING_USECASES).sort()).toEqual(["postEntry", "reverseEntry"]);
    const runners: Record<string, () => Promise<{ ok: boolean }>> = {
      postEntry: () => post("COVER-P", 50),
      reverseEntry: async () => {
        const o = await post("COVER-R", 60);
        if (!o.ok) return o;
        return as(user, () => uc.reverseEntry(o.value.id, "cobertura"));
      },
    };
    for (const name of Object.keys(uc.MUTATING_USECASES)) {
      const n0 = await count(t.owner`select count(*) n from audit_events`);
      expect((await runners[name]()).ok, name).toBe(true);
      expect(await count(t.owner`select count(*) n from audit_events`), name).toBeGreaterThan(n0);
    }
  });

  it("an account of another entity is rejected without leaving residue", async () => {
    const res = await post("XENT", 100, { lines: [{ accountId: cashE2, debit: 100, credit: 0, currencyCode: "PYG" }, lines(100)[1]] });
    expect(res.ok).toBe(false);
    expect(await count(t.owner`select count(*) n from journal_entries where number = 'XENT'`)).toBe(0);
    void p2;
  });
});
