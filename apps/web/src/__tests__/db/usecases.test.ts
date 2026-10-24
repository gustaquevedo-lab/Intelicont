// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
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
  let p1Day: string; // YYYY-MM-01 of p1 (the current month)
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
    const nowYm = (await t.owner`select extract(year from (now() at time zone 'America/Asuncion'))::int as "year", extract(month from (now() at time zone 'America/Asuncion'))::int as "month"`)[0];
    p1 = (await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, ${nowYm.year}, ${nowYm.month}, 'open') returning id`)[0].id;
    p1Day = `${nowYm.year}-${String(nowYm.month).padStart(2, "0")}-01`;
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
    // Same withTenant tx: a follow-up query only works if the failure was contained in a savepoint.
    const { res, followUp } = await as(user, async () => {
      const res = await uc.postEntry({ entityId: e1, periodId: p1, date: new Date("2026-10-01"), number: "BAD-1", lines: [lines(1000)[0], { ...lines(1000)[1], credit: 900 }] });
      const followUp = await db.tenantDb((tx) => tx.execute(sql`select count(*)::int n from journal_entries where number = 'BAD-1'`));
      return { res, followUp };
    });
    expect(followUp[0].n).toBe(0);
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
      expect(res).toEqual({ ok: false, error: "No hay período abierto para la fecha de hoy" });
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
    expect(Object.keys(uc.MUTATING_USECASES).sort()).toEqual(["createManual", "ingestDocument", "postEntry", "reverseEntry"]);
    const runners: Record<string, () => Promise<{ ok: boolean }>> = {
      // Exempt cash sale: Dr Caja / Cr Ventas (the only accounts of this chart).
      createManual: () => as(user, () => uc.createManual({
        entityId: e1, direction: "issued", docCode: 109, partner: { ruc: "80014066-4", legalName: "Cliente" },
        timbrado: "12345678", number: "001-001-0000001", issueDate: p1Day, condition: "cash",
        gravado10: 0, gravado5: 0, exento: 1000, total: 1000, imputaIva: true, imputaIre: false, imputaIrp: false,
      })),
      ingestDocument: () => as(user, () => uc.ingestDocument(e1, "received",
        readFileSync(path.resolve(__dirname, "../../__fixtures__/sifen/fac_024-004-0049994.xml"), "utf-8"))),
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

  it("reverseEntry books into the open period that contains today when several are open", async () => {
    const orig = await post("MULTI", 80);
    if (!orig.ok) throw new Error(orig.error);
    const older = (await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, 2020, 1, 'open') returning id`)[0].id;
    try {
      const res = await as(user, () => uc.reverseEntry(orig.value.id, "multi"));
      expect(res.ok).toBe(true);
      if (res.ok) expect(res.value.periodId).toBe(p1);
    } finally {
      await t.owner`update fiscal_periods set status = 'closed' where id = ${older}`;
    }
  });

  it("reverseEntry preserves fx, base amount, partner and tax-document links", async () => {
    const partner = (await t.owner`insert into partners (entity_id, kind, ruc, legal_name) values (${e1}, 'customer', '80099999', 'Cliente') returning id`)[0].id;
    const doc = (await t.owner`insert into tax_documents (entity_id, direction, doc_type, number, issue_date, total) values (${e1}, 'issued', 'invoice', '001-001-0000001', '2026-10-01', 1000) returning id`)[0].id;
    const cc = (await t.owner`insert into cost_centers (entity_id, code, name) values (${e1}, 'CC1', 'Centro') returning id`)[0].id;
    const res = await post("FX-1", 100, {
      lines: [
        { accountId: cash, debit: 100, credit: 0, currencyCode: "USD", fxRate: 7300, amountBase: 730000, partnerId: partner, taxDocumentId: doc, costCenterId: cc, description: "usd" },
        { accountId: sales, debit: 0, credit: 100, currencyCode: "USD", fxRate: 7300, amountBase: 730000 },
      ],
    });
    if (!res.ok) throw new Error(res.error);
    const rev = await as(user, () => uc.reverseEntry(res.value.id, "fx"));
    if (!rev.ok) throw new Error(rev.error);
    const get = (id: string) => t.owner`select account_id, debit, credit, currency_code, fx_rate, amount_base, cost_center_id, partner_id, tax_document_id, description from journal_lines where entry_id = ${id} order by account_id`;
    const [a, b] = [await get(res.value.id), await get(rev.value.id)];
    expect(b).toHaveLength(a.length);
    a.forEach((l, i) => {
      expect(b[i]).toEqual({ ...l, debit: l.credit, credit: l.debit });
    });
    expect(a.find((l) => l.account_id === cash)).toMatchObject({ currency_code: "USD", amount_base: "730000", partner_id: partner, tax_document_id: doc, cost_center_id: cc });
    expect(Number(a[0].fx_rate)).toBe(7300);
  });

  it("a draft entry cannot be reversed", async () => {
    const [draft] = await t.owner`insert into journal_entries (entity_id, period_id, date, number, source, status)
      values (${e1}, ${p1}, '2026-10-01', 'DRAFT-1', 'manual', 'draft') returning id`;
    expect(await as(user, () => uc.reverseEntry(draft.id, "borrador"))).toEqual({ ok: false, error: "Sólo se pueden revertir asientos posteados" });
  });

  it("reversing an entry that has no number falls back to its id", async () => {
    const [e] = await t.owner`insert into journal_entries (entity_id, period_id, date, source, status)
      values (${e1}, ${p1}, '2026-10-01', 'manual', 'draft') returning id`;
    await t.owner`insert into journal_lines (entry_id, account_id, debit, credit, currency_code)
      values (${e.id}, ${cash}, 80, 0, 'PYG'), (${e.id}, ${sales}, 0, 80, 'PYG')`;
    await t.owner`update journal_entries set status = 'posted' where id = ${e.id}`;
    const res = await as(user, () => uc.reverseEntry(e.id, "sin numero"));
    if (!res.ok) throw new Error(res.error);
    expect(res.value.number).toBe(`REV-${e.id}`);
  });

  it("a reversal entry cannot be reversed", async () => {
    const orig = await post("REV-OF-REV", 90);
    if (!orig.ok) throw new Error(orig.error);
    const rev = await as(user, () => uc.reverseEntry(orig.value.id, "primera"));
    if (!rev.ok) throw new Error(rev.error);
    expect(await as(user, () => uc.reverseEntry(rev.value.id, "otra"))).toEqual({ ok: false, error: "No se puede revertir un contra-asiento" });
  });

  describe("line references must belong to the entry entity", () => {
    let e3: string;
    const refs = async (entityId: string, tag: string) => ({
      partner: (await t.owner`insert into partners (entity_id, kind, ruc, legal_name) values (${entityId}, 'customer', ${"9" + tag}, 'P') returning id`)[0].id as string,
      doc: (await t.owner`insert into tax_documents (entity_id, direction, doc_type, number, issue_date, total) values (${entityId}, 'issued', 'invoice', ${"D" + tag}, '2026-10-01', 1) returning id`)[0].id as string,
      cc: (await t.owner`insert into cost_centers (entity_id, code, name) values (${entityId}, ${"C" + tag}, 'CC') returning id`)[0].id as string,
    });
    const withRef = (number: string, extra: Record<string, string>) =>
      post(number, 100, { lines: [{ ...lines(100)[0], ...extra }, lines(100)[1]] });
    const noResidue = async (number: string) => {
      expect(await count(t.owner`select count(*) n from journal_entries where number = ${number}`)).toBe(0);
      expect(await count(t.owner`select count(*) n from journal_lines l join accounts a on a.id = l.account_id where a.id = ${cash} and l.description = ${number}`)).toBe(0);
    };

    beforeAll(async () => {
      e3 = (await t.owner`insert into entities (ruc, legal_name) values ('80011113-6', 'E3') returning id`)[0].id;
      await t.owner`insert into memberships (user_id, entity_id, role) values (${user}, ${e3}, 'admin')`;
    });

    it("postEntry rejects a partner of another entity on a line", async () => {
      const mine3 = await refs(e3, "31"); // the SAME user also belongs to e3: equality check, not just RLS
      const foreign = await refs(e2, "21"); // entity the user cannot see
      const own = await refs(e1, "11");
      for (const [n, id] of [["REF-P3", mine3.partner], ["REF-P2", foreign.partner], ["REF-PBAD", "not-a-uuid"]] as const) {
        expect(await withRef(n, { partnerId: id }), n).toEqual({ ok: false, error: "Referencia inválida" });
        await noResidue(n);
      }
      expect((await withRef("REF-POK", { partnerId: own.partner })).ok).toBe(true);
    });

    it("postEntry rejects a tax document or cost center of another entity", async () => {
      const mine3 = await refs(e3, "32");
      const foreign = await refs(e2, "22");
      for (const [n, extra] of [
        ["REF-D3", { taxDocumentId: mine3.doc }], ["REF-D2", { taxDocumentId: foreign.doc }],
        ["REF-C3", { costCenterId: mine3.cc }], ["REF-C2", { costCenterId: foreign.cc }],
      ] as const) {
        expect(await withRef(n, extra), n).toEqual({ ok: false, error: "Referencia inválida" });
        await noResidue(n);
      }
    });
  });

  it("an account of another entity is rejected without leaving residue", async () => {
    const res = await post("XENT", 100, { lines: [{ accountId: cashE2, debit: 100, credit: 0, currencyCode: "PYG" }, lines(100)[1]] });
    expect(res.ok).toBe(false);
    expect(await count(t.owner`select count(*) n from journal_entries where number = 'XENT'`)).toBe(0);
    void p2;
  });
});
