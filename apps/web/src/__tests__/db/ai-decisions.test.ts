// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { mod11Dv } from "@intelicont/ledger/fiscal-py";
import type { AIProvider } from "@intelicont/ledger/ai";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type AppRouter = typeof import("@/trpc").appRouter;
type AiModule = typeof import("@/lib/ai-provider");

const FIXTURE = readFileSync(path.resolve(__dirname, "../../__fixtures__/sifen/fac_024-004-0049994.xml"), "utf-8");
const FIXTURE_CDC = "01800140664024004004999422026080911264669314";
const variant = (seed: number, xml = FIXTURE) => {
  const body = FIXTURE_CDC.slice(0, 34) + String(seed).padStart(9, "0");
  return xml.replace(FIXTURE_CDC, body + mod11Dv(body));
};

// Several round trips per test; the dev tunnel adds latency.
describe.skipIf(!process.env.TEST_ADMIN_URL)("AI journal suggestions and approval (real Postgres)", { timeout: 30_000 }, () => {
  let t: TestDb;
  let db: DbModule;
  let appRouter: AppRouter;
  let ai: AiModule;
  let user: string, outsider: string, noTotpAdmin: string, e1: string;
  let seed = 100;
  const prevUrl = process.env.DATABASE_URL;
  const prevProvider = process.env.AI_PROVIDER;
  const caller = (userId?: string) => appRouter.createCaller({ userId, requestId: "t", idempotencyKey: crypto.randomUUID() });
  const docs = (u: string) => caller(u)["tax-documents"];

  /** Ingests a fresh copy of the fixture (own CDC) into e1 and returns its id. */
  const ingest = async (xml = FIXTURE) => {
    const r = await docs(user).ingestXml({ entityId: e1, direction: "received", xml: variant(seed++, xml) });
    return r.documentId;
  };

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string, totp = true) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, ${totp}) returning id`)[0].id as string;
    user = await mkUser("u@x.test");
    outsider = await mkUser("o@x.test");
    noTotpAdmin = await mkUser("nototp@x.test", false);
    process.env.DATABASE_URL = t.appUrl;
    process.env.AI_PROVIDER = "rules";
    vi.resetModules();
    db = await import("@ledger/db/index");
    appRouter = (await import("@/trpc")).appRouter;
    ai = await import("@/lib/ai-provider");
    // The fixture's receiver RUC; chart of accounts + current period from entities.create.
    e1 = (await caller(user).entities.create({ ruc: "1234567-9", legalName: "Cliente de Prueba", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    const e2 = (await caller(outsider).entities.create({ ruc: "80014066-4", legalName: "Otra", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    await t.owner`insert into memberships (user_id, entity_id, role) values (${noTotpAdmin}, ${e2}, 'admin')`;
    // The fixture is dated 2026-08-09.
    await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, 2026, 8, 'open')`;
  }, 120_000);

  afterEach(() => ai.setAiProviderForTests(null));

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    process.env.AI_PROVIDER = prevProvider;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("suggestEntry stores an ai_decisions row with confidence, rationale and sources", async () => {
    const documentId = await ingest();
    const { decisionId, suggestion } = await docs(user).suggestEntry({ documentId });
    expect(suggestion.provider).toBe("rules");
    expect(suggestion.confidence).toBeGreaterThanOrEqual(0.9);
    expect(suggestion.lines.map((l) => [l.accountCode, l.debit, l.credit])).toEqual([
      ["1.1.03.001", 52727, 0],
      ["1.1.04", 5273, 0],
      ["1.1.01.001", 0, 58000],
    ]);
    const [row] = await t.owner`select * from ai_decisions where id = ${decisionId}`;
    expect(row).toMatchObject({ entity_id: e1, kind: "journal_suggestion", accepted: false, accepted_by: null, confidence: Math.round(suggestion.confidence * 100) });
    expect(row.input).toMatchObject({ documentId, provider: "rules" });
    expect(row.output.rationale).toBe(suggestion.rationale);
    expect(row.output.sources).toEqual(expect.arrayContaining(["IVA 10%: 5.273", "Regla: compra gravada al contado"]));
    const ev = await t.owner`select actor_id from audit_events where action = 'ai_decision.created' and target_id = ${decisionId}`;
    expect(ev).toEqual([{ actor_id: user }]);
  });

  it("suggestEntry returns the pending decision instead of creating another", async () => {
    const documentId = await ingest();
    const a = await docs(user).suggestEntry({ documentId });
    const b = await docs(user).suggestEntry({ documentId });
    expect(b.decisionId).toBe(a.decisionId);
    const count = async () => Number((await t.owner`select count(*)::int as n from ai_decisions where input->>'documentId' = ${documentId}`)[0].n);
    expect(await count()).toBe(1);
    const c = await docs(user).suggestEntry({ documentId, refresh: true });
    expect(c.decisionId).not.toBe(a.decisionId);
    expect(await count()).toBe(2);
  });

  it("suggestEntry does not hold a transaction during the provider call", async () => {
    const documentId = await ingest();
    const role = decodeURIComponent(new URL(t.appUrl).username);
    let openTx: readonly unknown[] | undefined;
    const rules = new (await import("@intelicont/ledger/ai")).RuleBasedProvider();
    const slow: AIProvider = {
      suggestEntry: async (doc, accounts, direction) => {
        // "Calling Ollama": no backend of the runtime role may be inside a transaction now. Asked from
        // the app connection (same role): pg_stat_activity hides state/xact_start of other roles.
        openTx = await t.app`select pid, state from pg_stat_activity
          where usename = ${role} and pid <> pg_backend_pid() and (xact_start is not null or state like 'idle in transaction%')`;
        expect(await t.app`select state from pg_stat_activity where usename = ${role} and pid <> pg_backend_pid() and state is not null`).not.toEqual([]);
        return rules.suggestEntry(doc, accounts, direction);
      },
    };
    ai.setAiProviderForTests(slow);
    await docs(user).suggestEntry({ documentId });
    expect(openTx).toEqual([]);
  });

  it("approveEntry posts the entry, links the document and marks the decision accepted", async () => {
    const documentId = await ingest();
    const { decisionId } = await docs(user).suggestEntry({ documentId });
    const r = await docs(user).approveEntry({ documentId, decisionId });
    expect(r).toMatchObject({ journalEntryId: expect.any(String), number: "AS-024-004-0049994" });
    const [entry] = await t.owner`select * from journal_entries where id = ${r.journalEntryId}`;
    expect(entry).toMatchObject({ entity_id: e1, status: "posted", source: "sifen", source_ref: expect.stringMatching(/^0180/) });
    const lines = await t.owner`select debit, credit, tax_document_id from journal_lines where entry_id = ${r.journalEntryId} order by debit desc`;
    expect(lines.map((l) => [l.debit, l.credit])).toEqual([["52727", "0"], ["5273", "0"], ["0", "58000"]]);
    expect(lines.every((l) => l.tax_document_id === documentId)).toBe(true);
    const [doc] = await t.owner`select journal_entry_id, status, processed_at from tax_documents where id = ${documentId}`;
    expect(doc).toMatchObject({ journal_entry_id: r.journalEntryId, status: "posted" });
    expect(doc.processed_at).toBeTruthy();
    const [dec] = await t.owner`select accepted, accepted_by from ai_decisions where id = ${decisionId}`;
    expect(dec).toEqual({ accepted: true, accepted_by: user });
    const ev = await t.owner`select before, after from audit_events where action = 'ai_decision.accepted' and target_id = ${decisionId}`;
    expect(ev).toHaveLength(1);
    expect(ev[0].before.lines).toHaveLength(3);
  });

  it("approveEntry twice returns an error", async () => {
    const documentId = await ingest();
    const { decisionId } = await docs(user).suggestEntry({ documentId });
    await docs(user).approveEntry({ documentId, decisionId });
    const e = await docs(user).approveEntry({ documentId, decisionId }).catch((x) => x);
    expect(e).toMatchObject({ code: "CONFLICT", message: "El comprobante ya fue contabilizado" });
    const n = await t.owner`select count(*)::int as n from journal_lines where tax_document_id = ${documentId}`;
    expect(n[0].n).toBe(3);
    // And no new suggestion for a posted document.
    await expect(docs(user).suggestEntry({ documentId })).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("approveEntry with edited unbalanced lines fails and leaves the document unposted and the decision pending", async () => {
    const documentId = await ingest();
    const { decisionId, suggestion } = await docs(user).suggestEntry({ documentId });
    const lines = suggestion.lines.map((l, i) => ({ accountId: l.accountId, debit: i === 0 ? l.debit + 1 : l.debit, credit: l.credit, description: l.description }));
    await expect(docs(user).approveEntry({ documentId, decisionId, lines })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const [doc] = await t.owner`select journal_entry_id, status from tax_documents where id = ${documentId}`;
    expect(doc).toEqual({ journal_entry_id: null, status: "pending" });
    const [dec] = await t.owner`select accepted, accepted_by from ai_decisions where id = ${decisionId}`;
    expect(dec).toEqual({ accepted: false, accepted_by: null });
    expect(await t.owner`select 1 from audit_events where action = 'ai_decision.accepted' and target_id = ${decisionId}`).toHaveLength(0);
    // An edited, balanced choice of accounts is accepted and audited as edited.
    const caja = suggestion.lines[2].accountId;
    const edited = suggestion.lines.map((l) => ({ ...l, accountId: l.credit > 0 ? caja : l.accountId }));
    const r = await caller(user)["tax-documents"].approveEntry({ documentId, decisionId, lines: edited.map(({ accountCode: _c, ...l }) => l) });
    expect(r.journalEntryId).toBeTruthy();
  });

  it("approveEntry without an open period for the issue month fails", async () => {
    const documentId = await ingest(FIXTURE.replaceAll("2026-08-09T", "2026-05-09T"));
    const { decisionId } = await docs(user).suggestEntry({ documentId });
    const e = await docs(user).approveEntry({ documentId, decisionId }).catch((x) => x);
    expect(e).toMatchObject({ code: "BAD_REQUEST", message: "No hay período abierto para 05/2026" });
    const [doc] = await t.owner`select journal_entry_id, status from tax_documents where id = ${documentId}`;
    expect(doc).toEqual({ journal_entry_id: null, status: "pending" });
  });

  it("rejectSuggestion leaves the document unposted and audits ai_decision.rejected", async () => {
    const documentId = await ingest();
    const { decisionId } = await docs(user).suggestEntry({ documentId });
    await expect(docs(user).rejectSuggestion({ decisionId, reason: "no" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await docs(user).rejectSuggestion({ decisionId, reason: "Cuenta de gasto incorrecta" });
    const [dec] = await t.owner`select accepted from ai_decisions where id = ${decisionId}`;
    expect(dec.accepted).toBe(false);
    const ev = await t.owner`select reason, actor_id from audit_events where action = 'ai_decision.rejected' and target_id = ${decisionId}`;
    expect(ev).toEqual([{ reason: "Cuenta de gasto incorrecta", actor_id: user }]);
    const [doc] = await t.owner`select journal_entry_id, status from tax_documents where id = ${documentId}`;
    expect(doc).toEqual({ journal_entry_id: null, status: "pending" });
    // A rejected suggestion cannot be approved, and the next suggestEntry makes a new one.
    await expect(docs(user).approveEntry({ documentId, decisionId })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const next = await docs(user).suggestEntry({ documentId });
    expect(next.decisionId).not.toBe(decisionId);
  });

  it("authedProcedure rejects unauthenticated calls and admins without 2FA", async () => {
    const documentId = await ingest();
    await expect(caller(undefined)["tax-documents"].suggestEntry({ documentId })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(docs(noTotpAdmin).suggestEntry({ documentId })).rejects.toMatchObject({ code: "FORBIDDEN", message: "2FA requerido" });
  });

  it("a user of another entity cannot suggest or approve for this document", async () => {
    const documentId = await ingest();
    await expect(docs(outsider).suggestEntry({ documentId })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const { decisionId } = await docs(user).suggestEntry({ documentId });
    await expect(docs(outsider).approveEntry({ documentId, decisionId })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(docs(outsider).rejectSuggestion({ decisionId, reason: "intento ajeno" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const [doc] = await t.owner`select journal_entry_id from tax_documents where id = ${documentId}`;
    expect(doc.journal_entry_id).toBeNull();
  });
});
