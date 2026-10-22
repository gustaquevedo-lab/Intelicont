import { randomUUID } from "node:crypto";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import { tenantDb, isMockMode } from "./index";
import * as schema from "./schema";
import { mockStore } from "./mock";

type Entities = typeof schema.entities.$inferSelect;
type FiscalPeriod = typeof schema.fiscalPeriods.$inferSelect;
type Account = typeof schema.accounts.$inferSelect;
type JournalEntry = typeof schema.journalEntries.$inferSelect;
type JournalLine = typeof schema.journalLines.$inferSelect;
type Partner = typeof schema.partners.$inferSelect;
type TaxDocument = typeof schema.taxDocuments.$inferSelect;
type TaxDocumentLine = typeof schema.taxDocumentLines.$inferSelect;
type Retention = typeof schema.retentions.$inferSelect;
type BankMovement = typeof schema.bankMovements.$inferSelect;
type Reconciliation = typeof schema.reconciliations.$inferSelect;
type AuditEvent = typeof schema.auditEvents.$inferSelect;
type AiDecision = typeof schema.aiDecisions.$inferSelect;

// ─── Entities ─────────────────────────────────────────────────────────────

export async function getEntities(): Promise<Entities[]> {
  if (isMockMode()) return mockStore.entities;
  return tenantDb(async (db) => {
    return db.select().from(schema.entities).orderBy(asc(schema.entities.createdAt));
  });
}

export async function getEntity(id: string): Promise<Entities | undefined> {
  if (isMockMode()) return mockStore.entities.find((e) => e.id === id);
  return tenantDb(async (db) => {
    const rows = await db.select().from(schema.entities).where(eq(schema.entities.id, id));
    return rows[0];
  });
}

export type NewEntity = { ruc: string; legalName: string; tradeName?: string; taxRegimes: string[]; baseCurrency: string };
export type SeedAccount = { code: string; name: string; nature: Account["nature"]; parentCode: string | null; allowsPosting: boolean };

/**
 * Creates an entity (via the `create_entity` SQL function: entity + admin membership for the
 * caller), its fiscal_py chart of accounts with `seed` accounts (parent codes resolved to
 * parent_id) and the first open fiscal period. Runs in the enclosing `withTenant` transaction.
 */
export async function createEntityWithChart(
  input: NewEntity,
  seed: SeedAccount[],
  period: { year: number; month: number },
): Promise<string> {
  return tenantDb(async (db) => {
    const regimes = input.taxRegimes.length
      ? sql`array[${sql.join(input.taxRegimes.map((r) => sql`${r}`), sql`, `)}]::text[]`
      : sql`'{}'::text[]`;
    const rows = await db.execute<{ id: string }>(
      sql`select create_entity(${input.ruc}, ${input.legalName}, ${input.tradeName ?? null}, ${regimes}, ${input.baseCurrency}) as id`,
    );
    const entityId = rows[0].id;
    const [coa] = await db.insert(schema.chartOfAccounts)
      .values({ entityId, kind: "fiscal_py", name: "Plan de Cuentas PY" })
      .returning({ id: schema.chartOfAccounts.id });
    const idByCode = new Map(seed.map((a) => [a.code, randomUUID()]));
    await db.insert(schema.accounts).values(
      seed.map((a) => ({
        id: idByCode.get(a.code)!,
        coaId: coa.id,
        code: a.code,
        name: a.name,
        nature: a.nature,
        parentId: a.parentCode ? idByCode.get(a.parentCode) ?? null : null,
        allowsPosting: a.allowsPosting,
      })),
    );
    await db.insert(schema.fiscalPeriods).values({ entityId, year: period.year, month: period.month, status: "open" });
    return entityId;
  });
}

// ─── Fiscal Periods ───────────────────────────────────────────────────────

export async function getFiscalPeriods(entityId: string): Promise<FiscalPeriod[]> {
  if (isMockMode()) return mockStore.fiscalPeriods.filter((p) => p.entityId === entityId);
  return tenantDb(async (db) => {
    return db.select().from(schema.fiscalPeriods)
      .where(eq(schema.fiscalPeriods.entityId, entityId))
      .orderBy(desc(schema.fiscalPeriods.year), desc(schema.fiscalPeriods.month));
  });
}

export async function getOpenPeriod(entityId: string): Promise<FiscalPeriod | undefined> {
  if (isMockMode()) return mockStore.fiscalPeriods.find((p) => p.entityId === entityId && p.status === "open");
  return tenantDb(async (db) => {
    const rows = await db.select().from(schema.fiscalPeriods)
      .where(and(
        eq(schema.fiscalPeriods.entityId, entityId),
        eq(schema.fiscalPeriods.status, "open")
      ));
    return rows[0];
  });
}

// ─── Accounts ─────────────────────────────────────────────────────────────

export async function getAccountsByCoa(coaId: string): Promise<Account[]> {
  if (isMockMode()) return mockStore.accounts.filter((a) => a.coaId === coaId).sort((a, b) => a.code.localeCompare(b.code));
  return tenantDb(async (db) => {
    return db.select().from(schema.accounts)
      .where(eq(schema.accounts.coaId, coaId))
      .orderBy(asc(schema.accounts.code));
  });
}

export async function getAllAccounts(entityId: string): Promise<Account[]> {
  if (isMockMode()) {
    const coa = mockStore.chartOfAccounts.find((c) => c.entityId === entityId);
    if (!coa) return [];
    return getAccountsByCoa(coa.id);
  }
  return tenantDb(async (db) => {
    const coas = await db.select().from(schema.chartOfAccounts)
      .where(eq(schema.chartOfAccounts.entityId, entityId));
    if (coas.length === 0) return [];
    return db.select().from(schema.accounts)
      .where(eq(schema.accounts.coaId, coas[0].id))
      .orderBy(asc(schema.accounts.code));
  });
}

// ─── Journal Entries ──────────────────────────────────────────────────────

export async function getJournalEntries(entityId: string): Promise<JournalEntry[]> {
  if (isMockMode()) return mockStore.journalEntries.filter((je) => je.entityId === entityId);
  return tenantDb(async (db) => {
    return db.select().from(schema.journalEntries)
      .where(eq(schema.journalEntries.entityId, entityId))
      .orderBy(desc(schema.journalEntries.date));
  });
}

export async function getJournalLines(entryId: string): Promise<JournalLine[]> {
  if (isMockMode()) return mockStore.journalLines.filter((jl) => jl.entryId === entryId);
  return tenantDb(async (db) => {
    return db.select().from(schema.journalLines)
      .where(eq(schema.journalLines.entryId, entryId));
  });
}

// ─── Partners ─────────────────────────────────────────────────────────────

export async function getPartners(entityId: string): Promise<Partner[]> {
  if (isMockMode()) return mockStore.partners.filter((p) => p.entityId === entityId);
  return tenantDb(async (db) => {
    return db.select().from(schema.partners)
      .where(eq(schema.partners.entityId, entityId))
      .orderBy(asc(schema.partners.legalName));
  });
}

export async function getPartner(id: string): Promise<Partner | undefined> {
  if (isMockMode()) return mockStore.partners.find((p) => p.id === id);
  return tenantDb(async (db) => {
    const rows = await db.select().from(schema.partners).where(eq(schema.partners.id, id));
    return rows[0];
  });
}

// ─── Tax Documents ────────────────────────────────────────────────────────

export async function getTaxDocuments(entityId: string): Promise<TaxDocument[]> {
  if (isMockMode()) return mockStore.taxDocuments.filter((td) => td.entityId === entityId);
  return tenantDb(async (db) => {
    return db.select().from(schema.taxDocuments)
      .where(eq(schema.taxDocuments.entityId, entityId))
      .orderBy(desc(schema.taxDocuments.issueDate));
  });
}

export async function getTaxDocument(id: string): Promise<TaxDocument | undefined> {
  if (isMockMode()) return mockStore.taxDocuments.find((td) => td.id === id);
  return tenantDb(async (db) => {
    const rows = await db.select().from(schema.taxDocuments).where(eq(schema.taxDocuments.id, id));
    return rows[0];
  });
}

export async function getPendingTaxDocuments(entityId: string): Promise<TaxDocument[]> {
  if (isMockMode()) return mockStore.taxDocuments.filter((td) => td.entityId === entityId && td.status === "pending");
  return tenantDb(async (db) => {
    return db.select().from(schema.taxDocuments)
      .where(and(
        eq(schema.taxDocuments.entityId, entityId),
        eq(schema.taxDocuments.status, "pending")
      ))
      .orderBy(desc(schema.taxDocuments.issueDate));
  });
}

export async function getTaxDocumentLines(documentId: string): Promise<TaxDocumentLine[]> {
  if (isMockMode()) return mockStore.taxDocumentLines.filter((tdl) => tdl.documentId === documentId);
  return tenantDb(async (db) => {
    return db.select().from(schema.taxDocumentLines)
      .where(eq(schema.taxDocumentLines.documentId, documentId));
  });
}

export async function getTaxDocumentsByPartner(partnerId: string): Promise<TaxDocument[]> {
  if (isMockMode()) return mockStore.taxDocuments.filter((td) => td.partnerId === partnerId);
  return tenantDb(async (db) => {
    return db.select().from(schema.taxDocuments)
      .where(eq(schema.taxDocuments.partnerId, partnerId))
      .orderBy(desc(schema.taxDocuments.issueDate));
  });
}

// ─── Retentions ───────────────────────────────────────────────────────────

export async function getRetentions(documentId: string): Promise<Retention[]> {
  if (isMockMode()) return mockStore.retentions.filter((r) => r.documentId === documentId);
  return tenantDb(async (db) => {
    return db.select().from(schema.retentions)
      .where(eq(schema.retentions.documentId, documentId));
  });
}

// ─── Banking ──────────────────────────────────────────────────────────────

export async function getBankMovements(bankAccountId: string): Promise<BankMovement[]> {
  if (isMockMode()) return mockStore.bankMovements.filter((bm) => bm.bankAccountId === bankAccountId);
  return tenantDb(async (db) => {
    return db.select().from(schema.bankMovements)
      .where(eq(schema.bankMovements.bankAccountId, bankAccountId))
      .orderBy(desc(schema.bankMovements.date));
  });
}

export async function getReconciliations(bankAccountId: string): Promise<Reconciliation[]> {
  if (isMockMode()) return mockStore.reconciliations.filter((r) => r.bankAccountId === bankAccountId);
  return tenantDb(async (db) => {
    return db.select().from(schema.reconciliations)
      .where(eq(schema.reconciliations.bankAccountId, bankAccountId));
  });
}

// ─── Audit ────────────────────────────────────────────────────────────────

export async function getAuditEvents(entityId: string, limit = 50): Promise<AuditEvent[]> {
  if (isMockMode()) {
    return mockStore.auditEvents
      .filter((ae) => ae.entityId === entityId)
      .slice(0, limit);
  }
  return tenantDb(async (db) => {
    return db.select().from(schema.auditEvents)
      .where(eq(schema.auditEvents.entityId, entityId))
      .orderBy(desc(schema.auditEvents.createdAt))
      .limit(limit);
  });
}

// ─── AI Decisions ─────────────────────────────────────────────────────────

export async function getAiDecisions(entityId: string): Promise<AiDecision[]> {
  if (isMockMode()) return mockStore.aiDecisions.filter((ai) => ai.entityId === entityId);
  return tenantDb(async (db) => {
    return db.select().from(schema.aiDecisions)
      .where(eq(schema.aiDecisions.entityId, entityId))
      .orderBy(desc(schema.aiDecisions.createdAt));
  });
}


// ─── Writes ───────────────────────────────────────────────────────────────

export interface PostEntryInput {
  entityId: string;
  periodId: string;
  date: Date;
  number: string;
  source?: typeof schema.journalEntries.$inferInsert["source"];
  description?: string | null;
  lines: {
    accountId: string;
    debit: number;
    credit: number;
    currencyCode: string;
    description?: string | null;
  }[];
}

/** Draft -> lines -> post, atomically. The DB enforces balance, period and immutability. */
export async function createPostedEntry(input: PostEntryInput): Promise<JournalEntry> {
  return tenantDb(async (db) => {
    const [draft] = await db.insert(schema.journalEntries).values({
      entityId: input.entityId,
      periodId: input.periodId,
      date: input.date,
      number: input.number,
      source: input.source ?? "manual",
      description: input.description ?? null,
      status: "draft",
    }).returning();

    await db.insert(schema.journalLines).values(
      input.lines.map((l) => ({
        entryId: draft.id,
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        currencyCode: l.currencyCode,
        description: l.description ?? null,
      }))
    );

    const [posted] = await db.update(schema.journalEntries)
      .set({ status: "posted", postedAt: new Date() })
      .where(eq(schema.journalEntries.id, draft.id))
      .returning();
    return posted;
  });
}

export async function createTaxDocument(values: typeof schema.taxDocuments.$inferInsert) {
  return tenantDb(async (db) => {
    const [doc] = await db.insert(schema.taxDocuments).values(values).returning();
    return doc;
  });
}
