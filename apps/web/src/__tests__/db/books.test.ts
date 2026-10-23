// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mod11Dv } from "@intelicont/ledger/fiscal-py";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type AppRouter = typeof import("@/trpc").appRouter;

const FIXTURE = readFileSync(path.resolve(__dirname, "../../__fixtures__/sifen/fac_024-004-0049994.xml"), "utf-8");
const FIXTURE_CDC = "01800140664024004004999422026080911264669314";
const variant = (seed: number) => {
  const body = FIXTURE_CDC.slice(0, 34) + String(seed).padStart(9, "0");
  return FIXTURE.replace(FIXTURE_CDC, body + mod11Dv(body));
};
const VIEWS = ["v_diario", "v_mayor", "v_libro_iva"] as const;
const AUG = { from: "2026-08-01", to: "2026-08-31" };

describe.skipIf(!process.env.TEST_ADMIN_URL)("books: diario, mayor, sumas y saldos, libro IVA (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let appRouter: AppRouter;
  let user: string, outsider: string, both: string, e1: string, e2: string;
  let docA: string, entryA: string, julyEntry: string, draftEntry: string, supplier: string;
  const acc: Record<string, string> = {};
  let seed = 500;
  const prevUrl = process.env.DATABASE_URL;
  const prevProvider = process.env.AI_PROVIDER;
  const caller = (userId = user) => appRouter.createCaller({ userId, requestId: "t", idempotencyKey: crypto.randomUUID() });
  const reports = (userId = user) => caller(userId).reports;

  const ingestAndApprove = async (approve = true) => {
    const docs = caller()["tax-documents"];
    const { documentId } = await docs.ingestXml({ entityId: e1, direction: "received", xml: variant(seed++) });
    if (!approve) return { documentId, entryId: null as string | null };
    const { decisionId } = await docs.suggestEntry({ documentId });
    const r = await docs.approveEntry({ documentId, decisionId });
    return { documentId, entryId: r.journalEntryId as string };
  };
  const periodId = async (entityId: string, year: number, month: number) =>
    (await t.owner`select id from fiscal_periods where entity_id = ${entityId} and year = ${year} and month = ${month}`)[0].id as string;

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    user = await mkUser("u@x.test");
    outsider = await mkUser("o@x.test");
    both = await mkUser("b@x.test");
    process.env.DATABASE_URL = t.appUrl;
    process.env.AI_PROVIDER = "rules";
    vi.resetModules();
    db = await import("@ledger/db/index");
    appRouter = (await import("@/trpc")).appRouter;
    // The fixture's receiver RUC; chart of accounts + current period from entities.create.
    e1 = (await caller().entities.create({ ruc: "1234567-9", legalName: "Cliente de Prueba", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    e2 = (await caller(outsider).entities.create({ ruc: "80014066-4", legalName: "Otra", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    await t.owner`insert into memberships (user_id, entity_id, role) values (${both}, ${e1}, 'accountant'), (${both}, ${e2}, 'accountant')`;
    for (const m of [5, 7, 8, 9]) await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, 2026, ${m}, 'open') on conflict do nothing`;
    for (const r of await t.owner`select a.id, a.code from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${e1}`) acc[r.code] = r.id;

    // July: capital contribution 1.000.000 (opening balance for August).
    julyEntry = (await caller()["journal-entries"].create({
      entityId: e1, periodId: await periodId(e1, 2026, 7), date: "2026-07-10", number: "AP-001", description: "Aporte de capital",
      lineas: [
        { accountId: acc["1.1.01.001"], debit: 1_000_000, credit: 0, currencyCode: "PYG" },
        { accountId: acc["3.1"], debit: 0, credit: 1_000_000, currencyCode: "PYG" },
      ],
    })).id;
    // August: the fixture invoice (58.000, IVA 5.273), posted through the rules provider.
    ({ documentId: docA, entryId: entryA } = (await ingestAndApprove()) as { documentId: string; entryId: string });
    // August: a draft entry (never in the books).
    draftEntry = (await t.owner`insert into journal_entries (entity_id, period_id, date, number, status, description)
      values (${e1}, ${await periodId(e1, 2026, 8)}, '2026-08-20', 'BORR-1', 'draft', 'Borrador') returning id`)[0].id;
    await t.owner`insert into journal_lines (entry_id, account_id, debit, credit, currency_code) values
      (${draftEntry}, ${acc["1.1.01.001"]}, 777, 0, 'PYG'), (${draftEntry}, ${acc["3.1"]}, 0, 777, 'PYG')`;
    supplier = (await caller().partners.create({ entityId: e1, kind: "supplier", ruc: "80005427-0", legalName: "Proveedor Sin Perfil" })).id;

    // e2 data in every view (an entry and an IVA document), for the isolation test.
    const e2Accounts = await t.owner`select a.id, a.code from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${e2} and a.code in ('1.1.01.001', '3.1')`;
    const e2Acc = Object.fromEntries(e2Accounts.map((r) => [r.code, r.id]));
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" });
    const [y, m] = today.split("-").map(Number);
    await caller(outsider)["journal-entries"].create({
      entityId: e2, periodId: await periodId(e2, y, m), date: today, number: "E2-1",
      lineas: [
        { accountId: e2Acc["1.1.01.001"], debit: 5_000, credit: 0, currencyCode: "PYG" },
        { accountId: e2Acc["3.1"], debit: 0, credit: 5_000, currencyCode: "PYG" },
      ],
    });
    await t.owner`insert into tax_documents (entity_id, direction, doc_type, number, issue_date, total, gravado_10, iva_10, imputa_iva, doc_code)
      values (${e2}, 'issued', 'invoice', '001-001-0000009', '2026-08-15', 11000, 11000, 1000, true, 109)`;
  }, 180_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    process.env.AI_PROVIDER = prevProvider;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("libroIva compras of the fixture month has the ingested invoice with 58000 gross and 5273 IVA", async () => {
    const r = await reports().libroIva({ entityId: e1, year: 2026, month: 8, side: "compras" });
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0]).toMatchObject({
      documentId: docA, entryId: entryA, date: "2026-08-09", number: "024-004-0049994", docCode: 109,
      counterpartyRuc: "80014066-4", total: 58_000, iva10: 5_273, iva5: 0, sign: 1, isElectronic: true, totalOnly: false,
    });
    expect(r.rows[0].cdc).toMatch(/^0180014066/);
    expect(r.totals).toMatchObject({ total: 58_000, iva10: 5_273, iva5: 0 });
    expect((await reports().libroIva({ entityId: e1, year: 2026, month: 8, side: "ventas" })).rows).toEqual([]);
  });

  it("libroIva totals apply the sign of credit notes", async () => {
    const base = {
      entityId: e1, direction: "received" as const, partnerId: supplier, timbrado: "12345678", issueDate: "2026-09-15",
      condition: "credit" as const, gravado5: 0, exento: 0, imputaIva: true, imputaIre: false, imputaIrp: false,
      expenseAccountId: acc["5.1.04"], concept: "Servicios",
    };
    await caller()["tax-documents"].createManual({ ...base, docCode: 109, number: "001-001-0000001", gravado10: 11_000_000, total: 11_000_000 });
    await caller()["tax-documents"].createManual({
      ...base, docCode: 110, number: "001-001-0000002", gravado10: 1_100_000, total: 1_100_000,
      relatedNumber: "001-001-0000001", relatedTimbrado: "12345678",
    });
    const r = await reports().libroIva({ entityId: e1, year: 2026, month: 9, side: "compras" });
    expect(r.rows.map((x) => [x.docCode, x.sign, x.total, x.iva10])).toEqual([[109, 1, 11_000_000, 1_000_000], [110, -1, 1_100_000, 100_000]]);
    expect(r.totals).toEqual({ gravado10: 9_900_000, gravado5: 0, exento: 0, iva10: 900_000, iva5: 0, total: 9_900_000 });
  });

  it("libroIva only shows documents that impute IVA", async () => {
    const { documentId } = await caller()["tax-documents"].createManual({
      entityId: e1, direction: "received", docCode: 109, partnerId: supplier, timbrado: "12345678", number: "001-001-0000003",
      issueDate: "2026-09-20", condition: "credit", gravado10: 0, gravado5: 0, exento: 500_000, total: 500_000,
      imputaIva: false, imputaIre: true, imputaIrp: false, expenseAccountId: acc["5.1.04"], concept: "Sin IVA",
    });
    const r = await reports().libroIva({ entityId: e1, year: 2026, month: 9, side: "compras" });
    expect(r.rows.map((x) => x.documentId)).not.toContain(documentId);
    expect(r.rows).toHaveLength(2);
  });

  it("diario lists only posted lines of the range with correct totals", async () => {
    const r = await reports().diario({ entityId: e1, ...AUG });
    expect(new Set(r.rows.map((x) => x.entryId))).toEqual(new Set([entryA]));
    expect(r.rows.map((x) => [x.accountCode, x.debit, x.credit]).sort()).toEqual([
      ["1.1.01.001", 0, 58_000], ["1.1.03.001", 52_727, 0], ["1.1.04", 5_273, 0],
    ]);
    expect(r.rows.every((x) => x.date === "2026-08-09" && x.taxDocumentId === docA)).toBe(true);
    expect(r.rows.map((x) => x.entryId)).not.toContain(draftEntry);
    expect(r.rows.map((x) => x.entryId)).not.toContain(julyEntry);
    expect(r.totals).toEqual({ debit: 58_000, credit: 58_000, entries: 1, lines: 3 });
    // Totals cover the whole range, not only the page.
    const page = await reports().diario({ entityId: e1, ...AUG, limit: 1, offset: 1 });
    expect(page.rows).toHaveLength(1);
    expect(page.totals).toEqual(r.totals);
  });

  it("mayor carries the opening balance and a running balance", async () => {
    const r = await reports().mayor({ entityId: e1, accountId: acc["1.1.01.001"], ...AUG });
    expect(r.account).toMatchObject({ code: "1.1.01.001", nature: "asset" });
    expect(r.opening).toBe(1_000_000);
    expect(r.rows.map((x) => [x.entryId, x.debit, x.credit, x.balance])).toEqual([[entryA, 0, 58_000, 942_000]]);
    expect(r.closing).toBe(942_000);
    const july = await reports().mayor({ entityId: e1, accountId: acc["1.1.01.001"], from: "2026-07-01", to: "2026-07-31" });
    expect(july).toMatchObject({ opening: 0, closing: 1_000_000 });
    expect(july.rows.map((x) => [x.entryId, x.balance])).toEqual([[julyEntry, 1_000_000]]);
  });

  it("sumasSaldos balances: total debit equals total credit", async () => {
    const r = await reports().sumasSaldos({ entityId: e1, ...AUG });
    expect(r.totals.debit).toBe(58_000);
    expect(r.totals.debit).toBe(r.totals.credit);
    expect(r.totals.opening).toBe(0);
    expect(r.totals.saldoDeudor).toBe(r.totals.saldoAcreedor);
    expect(r.rows.reduce((s, x) => s + x.debit, 0)).toBe(r.rows.reduce((s, x) => s + x.credit, 0));
  });

  it("sumasSaldos closing balances split by nature", async () => {
    const r = await reports().sumasSaldos({ entityId: e1, ...AUG });
    const by = Object.fromEntries(r.rows.map((x) => [x.code, x]));
    expect(by["1.1.01.001"]).toMatchObject({ nature: "asset", opening: 1_000_000, debit: 0, credit: 58_000, closing: 942_000, saldoDeudor: 942_000, saldoAcreedor: 0 });
    expect(by["3.1"]).toMatchObject({ nature: "equity", opening: -1_000_000, debit: 0, credit: 0, saldoDeudor: 0, saldoAcreedor: 1_000_000 });
    expect(by["1.1.03.001"]).toMatchObject({ nature: "asset", saldoDeudor: 52_727, saldoAcreedor: 0 });
    expect(by["1.1.04"]).toMatchObject({ saldoDeudor: 5_273 });
    expect(r.rows.map((x) => x.code)).toEqual(["1.1.01.001", "1.1.03.001", "1.1.04", "3.1"]);
  });

  it("libroIva exposes entry_id after approval and null before", async () => {
    const docs = caller()["tax-documents"];
    const { documentId } = await ingestAndApprove(false);
    const row = async () => (await reports().libroIva({ entityId: e1, year: 2026, month: 8, side: "compras" })).rows.find((x) => x.documentId === documentId);
    expect(await row()).toMatchObject({ entryId: null });
    const { decisionId } = await docs.suggestEntry({ documentId });
    const { journalEntryId } = await docs.approveEntry({ documentId, decisionId });
    expect(await row()).toMatchObject({ entryId: journalEntryId });
  });

  it("reversed entries still appear in diario with their reversal", async () => {
    const { id: reversalId } = await caller()["journal-entries"].reverse({ entryId: julyEntry, reason: "Error de carga" });
    const [{ d }] = await t.owner`select to_char(date at time zone 'UTC', 'YYYY-MM-DD') as d from journal_entries where id = ${reversalId}`;
    const r = await reports().diario({ entityId: e1, from: "2026-07-01", to: d });
    expect(r.rows.filter((x) => x.entryId === julyEntry)).toHaveLength(2);
    const rev = r.rows.filter((x) => x.entryId === reversalId);
    expect(rev.map((x) => [x.accountCode, x.debit, x.credit, x.reversalOf]).sort()).toEqual([
      ["1.1.01.001", 0, 1_000_000, julyEntry], ["3.1", 1_000_000, 0, julyEntry],
    ]);
    expect(r.totals.debit).toBe(r.totals.credit);
  });

  it("views are invisible across entities (security_invoker)", async () => {
    const opts = await t.owner`select relname, reloptions from pg_class where relname in ${t.owner(VIEWS as unknown as string[])} order by relname`;
    expect(opts.map((o) => [o.relname, o.reloptions])).toEqual([...VIEWS].sort().map((v) => [v, ["security_invoker=true"]]));
    for (const v of VIEWS) {
      const ownerSees = await t.owner.unsafe(`select count(*)::int as n from ${v} where entity_id = $1`, [e1]);
      expect(ownerSees[0].n).toBeGreaterThan(0);
      // Runtime role scoped to e2 only (the outsider): nothing of e1, filtered or not.
      await t.scoped([e2], async (tx) => {
        expect((await tx.unsafe(`select count(*)::int as n from ${v} where entity_id = $1`, [e1]))[0].n).toBe(0);
        const ids = await tx.unsafe(`select distinct entity_id from ${v}`);
        expect(ids.map((r) => r.entity_id)).toEqual([e2]);
      });
      // A member of both sees both unfiltered, and only e1 when filtering by it.
      await t.scoped([e1, e2], async (tx) => {
        const ids = (await tx.unsafe(`select distinct entity_id from ${v}`)).map((r) => r.entity_id).sort();
        expect(ids).toEqual([e1, e2].sort());
        expect((await tx.unsafe(`select distinct entity_id from ${v} where entity_id = $1`, [e1])).map((r) => r.entity_id)).toEqual([e1]);
      });
    }
    // Through the procedures: the user in both entities gets only the requested entity's rows.
    const iva = await reports(both).libroIva({ entityId: e2, year: 2026, month: 8, side: "ventas" });
    expect(iva.rows.map((x) => x.number)).toEqual(["001-001-0000009"]);
    const d = await reports(both).diario({ entityId: e1, ...AUG });
    expect(new Set(d.rows.map((x) => x.entryId)).has(entryA)).toBe(true);
    const e1Entries = new Set((await t.owner`select id from journal_entries where entity_id = ${e1}`).map((r) => r.id));
    expect(d.rows.every((x) => e1Entries.has(x.entryId))).toBe(true);
  });

  it("journal entry date must be a plain calendar date", async () => {
    const make = async (date: string, number: string) => caller()["journal-entries"].create({
      entityId: e1, periodId: await periodId(e1, 2026, 5), date, number,
      lineas: [
        { accountId: acc["1.1.01.001"], debit: 10, credit: 0, currencyCode: "PYG" },
        { accountId: acc["3.1"], debit: 0, credit: 10, currencyCode: "PYG" },
      ],
    });
    for (const bad of ["2026-05-01T23:30:00-04:00", "2026-13-40", "2026-02-30"]) {
      await expect(make(bad, `BAD-${bad}`)).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringContaining("Fecha inválida (AAAA-MM-DD)") });
    }
    const ok = await make("2026-05-01", "OK-DATE");
    const [row] = await t.owner`select to_char(date at time zone 'UTC', 'YYYY-MM-DD HH24:MI') as d from journal_entries where id = ${ok.id}`;
    expect(row.d).toBe("2026-05-01 00:00");
  });

  it("reports reject an entityId the user cannot see", async () => {
    const r = reports(outsider);
    // Lazy: each call starts only when its `.rejects` is attached (no unhandled rejection).
    const calls = [
      () => r.diario({ entityId: e1, ...AUG }),
      () => r.mayor({ entityId: e1, accountId: acc["1.1.01.001"], ...AUG }),
      () => r.sumasSaldos({ entityId: e1, ...AUG }),
      () => r.libroIva({ entityId: e1, year: 2026, month: 8, side: "compras" }),
    ];
    for (const c of calls) await expect(c()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(reports().mayor({ entityId: e1, accountId: crypto.randomUUID(), ...AUG })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
