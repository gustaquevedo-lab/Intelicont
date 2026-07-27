import { eq, desc, asc, and } from "drizzle-orm";
import { getDb } from "./index";
import * as schema from "./schema";

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
  const db = getDb();
  return db.select().from(schema.entities).orderBy(asc(schema.entities.createdAt));
}

export async function getEntity(id: string): Promise<Entities | undefined> {
  const db = getDb();
  const rows = await db.select().from(schema.entities).where(eq(schema.entities.id, id));
  return rows[0];
}

// ─── Fiscal Periods ───────────────────────────────────────────────────────

export async function getFiscalPeriods(entityId: string): Promise<FiscalPeriod[]> {
  const db = getDb();
  return db.select().from(schema.fiscalPeriods)
    .where(eq(schema.fiscalPeriods.entityId, entityId))
    .orderBy(desc(schema.fiscalPeriods.year), desc(schema.fiscalPeriods.month));
}

export async function getOpenPeriod(entityId: string): Promise<FiscalPeriod | undefined> {
  const db = getDb();
  const rows = await db.select().from(schema.fiscalPeriods)
    .where(and(
      eq(schema.fiscalPeriods.entityId, entityId),
      eq(schema.fiscalPeriods.status, "open")
    ));
  return rows[0];
}

export async function getFiscalPeriodById(periodId: string): Promise<FiscalPeriod | undefined> {
  const db = getDb();
  const [row] = await db.select().from(schema.fiscalPeriods)
    .where(eq(schema.fiscalPeriods.id, periodId));
  return row;
}

// ─── Accounts ─────────────────────────────────────────────────────────────

export async function getAccountsByCoa(coaId: string): Promise<Account[]> {
  const db = getDb();
  return db.select().from(schema.accounts)
    .where(eq(schema.accounts.coaId, coaId))
    .orderBy(asc(schema.accounts.code));
}

export async function getAllAccounts(entityId: string): Promise<Account[]> {
  const db = getDb();
  const coas = await db.select().from(schema.chartOfAccounts)
    .where(eq(schema.chartOfAccounts.entityId, entityId));
  if (coas.length === 0) return [];
  return db.select().from(schema.accounts)
    .where(eq(schema.accounts.coaId, coas[0].id))
    .orderBy(asc(schema.accounts.code));
}

// ─── Journal Entries ──────────────────────────────────────────────────────

export async function getJournalEntries(entityId: string): Promise<JournalEntry[]> {
  const db = getDb();
  return db.select().from(schema.journalEntries)
    .where(eq(schema.journalEntries.entityId, entityId))
    .orderBy(desc(schema.journalEntries.date));
}

export async function getJournalEntryById(entryId: string): Promise<JournalEntry | undefined> {
  const db = getDb();
  const [row] = await db.select().from(schema.journalEntries)
    .where(eq(schema.journalEntries.id, entryId));
  return row;
}

export async function getJournalLines(entryId: string): Promise<JournalLine[]> {
  const db = getDb();
  return db.select().from(schema.journalLines)
    .where(eq(schema.journalLines.entryId, entryId));
}

// ─── Partners ─────────────────────────────────────────────────────────────

export async function getPartners(entityId: string): Promise<Partner[]> {
  const db = getDb();
  return db.select().from(schema.partners)
    .where(eq(schema.partners.entityId, entityId))
    .orderBy(asc(schema.partners.legalName));
}

export async function getPartner(id: string): Promise<Partner | undefined> {
  const db = getDb();
  const rows = await db.select().from(schema.partners).where(eq(schema.partners.id, id));
  return rows[0];
}

// ─── Tax Documents ────────────────────────────────────────────────────────

export async function getTaxDocuments(entityId: string): Promise<TaxDocument[]> {
  const db = getDb();
  return db.select().from(schema.taxDocuments)
    .where(eq(schema.taxDocuments.entityId, entityId))
    .orderBy(desc(schema.taxDocuments.issueDate));
}

export async function getTaxDocument(id: string): Promise<TaxDocument | undefined> {
  const db = getDb();
  const rows = await db.select().from(schema.taxDocuments).where(eq(schema.taxDocuments.id, id));
  return rows[0];
}

export async function getPendingTaxDocuments(entityId: string): Promise<TaxDocument[]> {
  const db = getDb();
  return db.select().from(schema.taxDocuments)
    .where(and(
      eq(schema.taxDocuments.entityId, entityId),
      eq(schema.taxDocuments.status, "pending")
    ))
    .orderBy(desc(schema.taxDocuments.issueDate));
}

export async function getTaxDocumentLines(documentId: string): Promise<TaxDocumentLine[]> {
  const db = getDb();
  return db.select().from(schema.taxDocumentLines)
    .where(eq(schema.taxDocumentLines.documentId, documentId));
}

export async function getTaxDocumentsByPartner(partnerId: string): Promise<TaxDocument[]> {
  const db = getDb();
  return db.select().from(schema.taxDocuments)
    .where(eq(schema.taxDocuments.partnerId, partnerId))
    .orderBy(desc(schema.taxDocuments.issueDate));
}

// ─── Retentions ───────────────────────────────────────────────────────────

export async function getRetentions(documentId: string): Promise<Retention[]> {
  const db = getDb();
  return db.select().from(schema.retentions)
    .where(eq(schema.retentions.documentId, documentId));
}

// ─── Banking ──────────────────────────────────────────────────────────────

export async function getBankMovements(bankAccountId: string): Promise<BankMovement[]> {
  const db = getDb();
  return db.select().from(schema.bankMovements)
    .where(eq(schema.bankMovements.bankAccountId, bankAccountId))
    .orderBy(desc(schema.bankMovements.date));
}

export async function getReconciliations(bankAccountId: string): Promise<Reconciliation[]> {
  const db = getDb();
  return db.select().from(schema.reconciliations)
    .where(eq(schema.reconciliations.bankAccountId, bankAccountId));
}

export async function createBankAccount(data: {
  entityId: string;
  bankName: string;
  accountNumber: string;
  currencyCode?: string;
  glAccountId?: string;
}) {
  const db = getDb();
  const [row] = await db.insert(schema.bankAccounts).values({
    entityId: data.entityId,
    bankName: data.bankName,
    accountNumber: data.accountNumber,
    currencyCode: data.currencyCode || "PYG",
    glAccountId: data.glAccountId || null,
  }).returning();
  return row;
}

export async function getBankAccounts(entityId: string) {
  const db = getDb();
  return db.select().from(schema.bankAccounts)
    .where(eq(schema.bankAccounts.entityId, entityId));
}

export async function getBankAccountById(bankAccountId: string) {
  const db = getDb();
  const [row] = await db.select().from(schema.bankAccounts)
    .where(eq(schema.bankAccounts.id, bankAccountId));
  return row;
}

export async function getJournalEntriesWithLines(entityId: string) {
  const db = getDb();
  const entries = await db.select().from(schema.journalEntries)
    .where(and(
      eq(schema.journalEntries.entityId, entityId),
      eq(schema.journalEntries.status, "posted")
    ))
    .orderBy(desc(schema.journalEntries.date));

  const result: Array<{
    entry: typeof schema.journalEntries.$inferSelect;
    lines: (typeof schema.journalLines.$inferSelect & { accountCode?: string; accountName?: string })[];
  }> = [];

  for (const entry of entries) {
    const lines = await db.select({
      line: schema.journalLines,
      accountCode: schema.accounts.code,
      accountName: schema.accounts.name,
    }).from(schema.journalLines)
      .innerJoin(schema.accounts, eq(schema.journalLines.accountId, schema.accounts.id))
      .where(eq(schema.journalLines.entryId, entry.id));

    result.push({
      entry,
      lines: lines.map((l) => ({
        ...l.line,
        accountCode: l.accountCode,
        accountName: l.accountName,
      })),
    });
  }

  return result;
}

export async function insertBankMovements(movements: {
  bankAccountId: string;
  date: string;
  amount: number;
  direction: "credit" | "debit";
  ref?: string;
  description?: string;
  source?: string;
}[]) {
  const db = getDb();
  if (movements.length === 0) return [];
  return db.insert(schema.bankMovements).values(
    movements.map((m) => ({
      bankAccountId: m.bankAccountId,
      date: m.date,
      amount: m.amount.toString(),
      direction: m.direction,
      ref: m.ref || null,
      description: m.description || null,
      source: m.source || "csv_import",
    }))
  ).returning();
}

export async function insertReconciliations(reconciliations: {
  bankAccountId: string;
  bankMovementId: string;
  glTransactionId?: string;
  status?: "pending" | "matched" | "flagged" | "manual";
  score?: number;
  matchedBy?: string;
}[]) {
  const db = getDb();
  if (reconciliations.length === 0) return [];
  return db.insert(schema.reconciliations).values(
    reconciliations.map((r) => ({
      bankAccountId: r.bankAccountId,
      bankMovementId: r.bankMovementId,
      glTransactionId: r.glTransactionId || null,
      status: r.status || "pending",
      score: r.score?.toString() || null,
      matchedBy: r.matchedBy || "auto",
      matchedAt: new Date(),
    }))
  ).returning();
}

export async function confirmReconciliation(reconciliationId: string) {
  const db = getDb();
  const [updated] = await db.update(schema.reconciliations)
    .set({ status: "matched", matchedAt: new Date() })
    .where(eq(schema.reconciliations.id, reconciliationId))
    .returning();
  return updated;
}

export async function rejectReconciliation(reconciliationId: string) {
  const db = getDb();
  const [updated] = await db.update(schema.reconciliations)
    .set({ status: "flagged" })
    .where(eq(schema.reconciliations.id, reconciliationId))
    .returning();
  return updated;
}

export async function deleteReconciliation(reconciliationId: string) {
  const db = getDb();
  await db.delete(schema.reconciliations)
    .where(eq(schema.reconciliations.id, reconciliationId));
}

export async function getGlTransactionsForEntity(entityId: string) {
  const db = getDb();
  const entries = await db.select().from(schema.journalEntries)
    .where(and(
      eq(schema.journalEntries.entityId, entityId),
      eq(schema.journalEntries.status, "posted")
    ))
    .orderBy(desc(schema.journalEntries.date));

  const result: Array<{
    id: string;
    date: string;
    amount: number;
    direction: "credit" | "debit";
    description: string;
    partnerName?: string;
    accountCode?: string;
  }> = [];

  for (const entry of entries) {
    const lines = await db.select({
      debit: schema.journalLines.debit,
      credit: schema.journalLines.credit,
      accountCode: schema.accounts.code,
    }).from(schema.journalLines)
      .innerJoin(schema.accounts, eq(schema.journalLines.accountId, schema.accounts.id))
      .where(eq(schema.journalLines.entryId, entry.id));

    const entryDate = entry.date instanceof Date
      ? entry.date.toISOString().split("T")[0]
      : String(entry.date).split("T")[0];

    const totalDebit = lines.reduce((s, l) => s + parseFloat(l.debit || "0"), 0);
    const totalCredit = lines.reduce((s, l) => s + parseFloat(l.credit || "0"), 0);

    result.push({
      id: entry.id,
      date: entryDate,
      amount: totalDebit > 0 ? totalDebit : totalCredit,
      direction: totalDebit > 0 ? "debit" : "credit",
      description: entry.description || entry.number || "",
      accountCode: lines[0]?.accountCode,
    });
  }

  return result;
}

export async function createBankStatement(data: {
  bankAccountId: string;
  periodStart: string;
  periodEnd: string;
  fileRef?: string;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const [row] = await db.insert(schema.bankStatements).values({
    bankAccountId: data.bankAccountId,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    fileRef: data.fileRef || null,
    parsedAt: new Date(),
    metadata: data.metadata || null,
  }).returning();
  return row;
}

// ─── Audit ────────────────────────────────────────────────────────────────

export async function getAuditEvents(entityId: string, limit = 50): Promise<AuditEvent[]> {
  const db = getDb();
  return db.select().from(schema.auditEvents)
    .where(eq(schema.auditEvents.entityId, entityId))
    .orderBy(desc(schema.auditEvents.createdAt))
    .limit(limit);
}

// ─── AI Decisions ─────────────────────────────────────────────────────────

export async function getAiDecisions(entityId: string): Promise<AiDecision[]> {
  const db = getDb();
  return db.select().from(schema.aiDecisions)
    .where(eq(schema.aiDecisions.entityId, entityId))
    .orderBy(desc(schema.aiDecisions.createdAt));
}

// ─── SaaS Superadmin Operations ───────────────────────────────────────────

export async function createEntity(data: {
  ruc: string;
  legalName: string;
  tradeName?: string;
  entityType?: "COMMERCIAL" | "NON_PROFIT_NGO" | "NON_PROFIT_PUBLIC" | "ASSOCIATION";
  taxRegimes?: string[];
  plan?: string;
  mrr?: number;
}) {
  const db = getDb();
  const [row] = await db.insert(schema.entities).values({
    ruc: data.ruc,
    legalName: data.legalName,
    tradeName: data.tradeName || null,
    entityType: data.entityType || "COMMERCIAL",
    taxRegimes: data.taxRegimes || ["IVA_GRAL"],
    plan: data.plan || "starter",
    mrr: data.mrr || 180000,
    status: "active",
  }).returning();
  return row;
}

export async function updateEntityCommercials(
  entityId: string,
  data: {
    plan?: string;
    features?: Record<string, boolean>;
    mrr?: number;
    status?: "active" | "inactive" | "closed";
  }
) {
  const db = getDb();
  const [row] = await db.update(schema.entities)
    .set({
      ...(data.plan !== undefined && { plan: data.plan }),
      ...(data.features !== undefined && { features: data.features }),
      ...(data.mrr !== undefined && { mrr: data.mrr }),
      ...(data.status !== undefined && { status: data.status }),
      updatedAt: new Date(),
    })
    .where(eq(schema.entities.id, entityId))
    .returning();
  return row;
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  const db = getDb();
  const [row] = await db.update(schema.users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId))
    .returning();
  return row;
}

export async function getUsersList() {
  const db = getDb();
  return db.select({
    id: schema.users.id,
    email: schema.users.email,
    name: schema.users.name,
    emailVerified: schema.users.emailVerified,
    createdAt: schema.users.createdAt,
  }).from(schema.users).orderBy(desc(schema.users.createdAt));
}

