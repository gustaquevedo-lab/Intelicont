// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

type RepoModule = typeof import("@ledger/db/repository");
type MockModule = typeof import("@ledger/db/mock");

/** Mock mode (no DATABASE_URL) is the dev fallback: getters read the in-memory store. */
describe("repository in mock mode", () => {
  let repo: RepoModule;
  let mock: MockModule["mockStore"];
  const prev = process.env.DATABASE_URL;

  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const db = await import("@ledger/db/index");
    db.getDb(); // flips the module into mock mode
    expect(db.isMockMode()).toBe(true);
    repo = await import("@ledger/db/repository");
    mock = (await import("@ledger/db/mock")).mockStore;
  });
  afterAll(() => {
    if (prev !== undefined) process.env.DATABASE_URL = prev;
    vi.restoreAllMocks();
  });

  it("reads entities, periods and accounts from the store", async () => {
    const e = mock.entities[0];
    expect(await repo.getEntities()).toBe(mock.entities);
    expect(await repo.getEntity(e.id)).toBe(e);
    expect(await repo.getEntity("nope")).toBeUndefined();
    expect((await repo.getFiscalPeriods(e.id)).every((p) => p.entityId === e.id)).toBe(true);
    expect((await repo.getOpenPeriod(e.id))?.status).toBe("open");
    const coa = mock.chartOfAccounts.find((c) => c.entityId === e.id)!;
    const accounts = await repo.getAccountsByCoa(coa.id);
    expect(accounts.map((a) => a.code)).toEqual([...accounts.map((a) => a.code)].sort((a, b) => a.localeCompare(b)));
    expect(await repo.getAllAccounts(e.id)).toEqual(accounts);
    expect(await repo.getAllAccounts("nope")).toEqual([]);
  });

  it("derives total and reversedBy for mock journal entries", async () => {
    const e = mock.entities[0];
    const entries = await repo.getJournalEntries(e.id);
    expect(entries.length).toBeGreaterThan(0);
    const first = entries[0];
    expect((await repo.getJournalEntry(first.id))?.id).toBe(first.id);
    expect(await repo.getJournalEntry("nope")).toBeUndefined();
    expect(await repo.getJournalLines(first.id)).toEqual(mock.journalLines.filter((l) => l.entryId === first.id));
    const expected = mock.journalLines.filter((l) => l.entryId === first.id).reduce((s, l) => s + l.debit, 0);
    expect(first.total).toBe(String(expected));
  });

  it("reads partners, documents, retentions, banking, audit and AI decisions", async () => {
    const e = mock.entities[0];
    expect((await repo.getPartners(e.id)).every((p) => p.entityId === e.id)).toBe(true);
    const p = mock.partners[0];
    expect((await repo.getPartner(p.id))?.id).toBe(p.id);
    expect(await repo.getPartner("nope")).toBeUndefined();
    expect((await repo.getTaxDocuments(e.id)).every((d) => d.entityId === e.id)).toBe(true);
    expect((await repo.getPendingTaxDocuments(e.id)).every((d) => d.status === "pending")).toBe(true);
    const d = mock.taxDocuments[0];
    expect((await repo.getTaxDocument(d.id))?.id).toBe(d.id);
    expect(await repo.getTaxDocument("nope")).toBeUndefined();
    expect((await repo.getTaxDocumentLines(d.id)).every((l) => l.documentId === d.id)).toBe(true);
    expect((await repo.getTaxDocumentsByPartner(p.id)).every((x) => x.partnerId === p.id)).toBe(true);
    expect(await repo.getRetentions(d.id)).toEqual(mock.retentions.filter((r) => r.documentId === d.id));
    expect(await repo.getBankMovements("nope")).toEqual([]);
    expect(await repo.getReconciliations("nope")).toEqual([]);
    expect((await repo.getAuditEvents(e.id, 1)).length).toBeLessThanOrEqual(1);
    expect((await repo.getAiDecisions(e.id)).every((a) => a.entityId === e.id)).toBe(true);
  });
});
