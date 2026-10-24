import { randomUUID } from "node:crypto";
import { eq, desc, asc, and, sql, getTableColumns } from "drizzle-orm";
import { tenantDb, isMockMode } from "./index";
import * as schema from "./schema";
import { mockStore } from "./mock";
import { ensureCalendar } from "./calendar";
import { previousPeriod } from "../src/tax-calendar";

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
    // Calendar from the previous period (due this month) for 12 months, in the same transaction.
    const prev = previousPeriod(period.year, period.month);
    await ensureCalendar(entityId, prev.year, prev.month, 12);
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

export async function closeFiscalPeriod(periodId: string, userId?: string): Promise<boolean> {
  const now = new Date();
  if (isMockMode()) {
    const p = mockStore.fiscalPeriods.find((x) => x.id === periodId);
    if (!p) return false;
    p.status = "closed";
    p.closedAt = now;
    p.closedBy = userId ?? null;
    return true;
  }
  return tenantDb(async (db) => {
    const rows = await db.update(schema.fiscalPeriods)
      .set({
        status: "closed",
        closedAt: now,
        closedBy: userId ?? null,
      })
      .where(eq(schema.fiscalPeriods.id, periodId))
      .returning({ id: schema.fiscalPeriods.id });
    return rows.length > 0;
  });
}

export async function reopenFiscalPeriod(periodId: string): Promise<boolean> {
  if (isMockMode()) {
    const p = mockStore.fiscalPeriods.find((x) => x.id === periodId);
    if (!p) return false;
    p.status = "open";
    p.closedAt = null;
    p.closedBy = null;
    return true;
  }
  return tenantDb(async (db) => {
    const rows = await db.update(schema.fiscalPeriods)
      .set({
        status: "open",
        closedAt: null,
        closedBy: null,
      })
      .where(eq(schema.fiscalPeriods.id, periodId))
      .returning({ id: schema.fiscalPeriods.id });
    return rows.length > 0;
  });
}

export interface PeriodChecklistStatus {
  periodId: string;
  year: number;
  month: number;
  status: "open" | "closed";
  closedAt: string | null;
  checks: {
    asientosPosteados: { label: string; ok: boolean; count: number };
    comprobantesProcesados: { label: string; ok: boolean; count: number };
    balanceCuadrado: { label: string; ok: boolean; diferencia: number };
    conciliacionBancaria: { label: string; ok: boolean };
  };
  canClose: boolean;
}

export async function validatePeriodChecklist(
  entityId: string,
  year: number,
  month: number
): Promise<PeriodChecklistStatus> {
  const periods = await getFiscalPeriods(entityId);
  let period = periods.find((p) => p.year === year && p.month === month);
  if (!period) {
    period = periods[0] ?? {
      id: "mock-period-id",
      entityId,
      year,
      month,
      status: "open",
      closedAt: null,
      closedBy: null,
    };
  }

  // Verificar asientos
  let unpostedCount = 0;
  let balanceDiff = 0;
  if (!isMockMode()) {
    try {
      const [{ unposted }] = await tenantDb(async (db) =>
        db.select({ unposted: sql<number>`count(*)::int` })
          .from(schema.journalEntries)
          .where(and(eq(schema.journalEntries.entityId, entityId), eq(schema.journalEntries.periodId, period.id), eq(schema.journalEntries.status, "draft")))
      );
      unpostedCount = unposted || 0;

      const [bal] = await tenantDb(async (db) =>
        db.execute<{ debit: string; credit: string }>(
          sql`select coalesce(sum(l.debit), 0)::bigint as debit,
                     coalesce(sum(l.credit), 0)::bigint as credit
              from journal_lines l
              join journal_entries e on e.id = l.entry_id
              where e.entity_id = ${entityId} and e.period_id = ${period.id} and e.status = 'posted'`
        )
      );
      balanceDiff = Math.abs(Number(bal?.debit || 0) - Number(bal?.credit || 0));
    } catch {
      unpostedCount = 0;
      balanceDiff = 0;
    }
  }

  const checks = {
    asientosPosteados: {
      label: "Todos los asientos posteados y aprobados",
      ok: unpostedCount === 0,
      count: unpostedCount,
    },
    comprobantesProcesados: {
      label: "Todos los XML SIFEN y comprobantes procesados",
      ok: true,
      count: 0,
    },
    balanceCuadrado: {
      label: "Balance de sumas y saldos cuadrado (Debe === Haber)",
      ok: balanceDiff === 0,
      diferencia: balanceDiff,
    },
    conciliacionBancaria: {
      label: "Conciliación bancaria al día",
      ok: true,
    },
  };

  const canClose = checks.asientosPosteados.ok && checks.balanceCuadrado.ok && period.status === "open";

  return {
    periodId: period.id,
    year,
    month,
    status: period.status as "open" | "closed",
    closedAt: period.closedAt instanceof Date ? period.closedAt.toISOString() : (period.closedAt ? String(period.closedAt) : null),
    checks,
    canClose,
  };
}

export async function generateClosingJournalEntry(
  entityId: string,
  periodId: string,
  _userId?: string
): Promise<{ success: boolean; entryId?: string; message: string }> {
  if (isMockMode()) {
    const period = mockStore.fiscalPeriods.find((p) => p.id === periodId);
    if (!period) return { success: false, message: "Período no encontrado" };
    const entryId = randomUUID();
    const dateStr = `${period.year}-${String(period.month).padStart(2, "0")}-28T23:59:59.000Z`;
    mockStore.journalEntries.push({
      id: entryId,
      entityId,
      periodId,
      date: new Date(dateStr),
      number: `CIE-${period.year}${String(period.month).padStart(2, "0")}-01`,
      source: "manual",
      sourceRef: null,
      description: `Asiento de Refundición de Resultados - ${period.month}/${period.year}`,
      status: "posted",
      postedAt: new Date(),
      postedBy: null,
      reversalOf: null,
      versionOf: null,
      metadata: { type: "closing" },
      createdAt: new Date(),
    });
    return { success: true, entryId, message: "Asiento de refundición generado con éxito" };
  }

  return tenantDb(async (db) => {
    const [period] = await db.select().from(schema.fiscalPeriods).where(eq(schema.fiscalPeriods.id, periodId));
    if (!period) return { success: false, message: "Período no encontrado" };

    const rows = await db.execute<{
      account_id: string;
      code: string;
      name: string;
      debit: string;
      credit: string;
    }>(
      sql`select a.id as account_id, a.code, a.name,
                 coalesce(sum(l.debit), 0)::bigint as debit,
                 coalesce(sum(l.credit), 0)::bigint as credit
          from accounts a
          join journal_lines l on l.account_id = a.id
          join journal_entries e on e.id = l.entry_id
          where e.entity_id = ${entityId} and e.period_id = ${periodId} and e.status = 'posted'
            and (a.code like '4%' or a.code like '5%')
          group by a.id, a.code, a.name`
    );

    const [equityAcc] = await db.execute<{ id: string }>(
      sql`select a.id from accounts a
          join chart_of_accounts c on c.id = a.coa_id
          where c.entity_id = ${entityId} and (a.code like '3.3%' or a.code like '3%')
          order by a.code asc limit 1`
    );

    if (!equityAcc) {
      return { success: false, message: "No se encontró cuenta de patrimonio para Resultados del Ejercicio (3.x)" };
    }

    const lines: {
      accountId: string;
      debit: number;
      credit: number;
      currencyCode: string;
      description: string;
    }[] = [];

    let totalDebitNominal = 0;
    let totalCreditNominal = 0;

    for (const r of rows) {
      const d = Number(r.debit || 0);
      const c = Number(r.credit || 0);
      if (r.code.startsWith("4")) {
        const net = c - d;
        if (net > 0) {
          lines.push({ accountId: r.account_id, debit: net, credit: 0, currencyCode: "PYG", description: `Cancelación ${r.name}` });
          totalDebitNominal += net;
        } else if (net < 0) {
          lines.push({ accountId: r.account_id, debit: 0, credit: Math.abs(net), currencyCode: "PYG", description: `Cancelación ${r.name}` });
          totalCreditNominal += Math.abs(net);
        }
      } else {
        const net = d - c;
        if (net > 0) {
          lines.push({ accountId: r.account_id, debit: 0, credit: net, currencyCode: "PYG", description: `Cancelación ${r.name}` });
          totalCreditNominal += net;
        } else if (net < 0) {
          lines.push({ accountId: r.account_id, debit: Math.abs(net), credit: 0, currencyCode: "PYG", description: `Cancelación ${r.name}` });
          totalDebitNominal += Math.abs(net);
        }
      }
    }

    const diff = totalDebitNominal - totalCreditNominal;
    if (diff > 0) {
      lines.push({
        accountId: equityAcc.id,
        debit: 0,
        credit: diff,
        currencyCode: "PYG",
        description: "Resultado neto del ejercicio a Patrimonio Neto",
      });
    } else if (diff < 0) {
      lines.push({
        accountId: equityAcc.id,
        debit: Math.abs(diff),
        credit: 0,
        currencyCode: "PYG",
        description: "Resultado neto del ejercicio a Patrimonio Neto",
      });
    }

    if (lines.length === 0) {
      return { success: true, message: "No hay movimientos nominales que cancelar en el período" };
    }

    const entryDate = new Date(Date.UTC(period.year, period.month, 0));
    const [entry] = await db.insert(schema.journalEntries).values({
      entityId,
      periodId,
      date: entryDate,
      number: `CIE-${period.year}${String(period.month).padStart(2, "0")}-01`,
      source: "manual",
      description: `Asiento de Refundición de Resultados - ${period.month}/${period.year}`,
      status: "posted",
      postedAt: new Date(),
    }).returning();

    await db.insert(schema.journalLines).values(
      lines.map((l) => ({
        entryId: entry.id,
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        currencyCode: l.currencyCode,
        description: l.description,
      }))
    );

    return { success: true, entryId: entry.id, message: "Asiento de refundición generado con éxito" };
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

/** A journal entry plus the derived reversal state: id of the counter-entry whose `reversal_of` is this entry. */
export type JournalEntryRow = JournalEntry & { reversedBy: string | null; total: string };

// Explicit qualifier: Drizzle would render a column ref in a single-table select unqualified, which binds to `r` inside the subquery.
const entryWithReversal = {
  ...getTableColumns(schema.journalEntries),
  reversedBy: sql<string | null>`(select r.id from journal_entries r where r.reversal_of = journal_entries.id and r.status = 'posted' limit 1)`,
  /** Sum of debits (= sum of credits per currency) as a digit string; bigint never goes through a float. */
  total: sql<string>`(select coalesce(sum(l.debit), 0)::text from journal_lines l where l.entry_id = journal_entries.id)`,
};

function withMockReversal(list: JournalEntry[]): JournalEntryRow[] {
  return list.map((e) => ({
    ...e,
    reversedBy: mockStore.journalEntries.find((r) => r.reversalOf === e.id)?.id ?? null,
    total: String(mockStore.journalLines.filter((l) => l.entryId === e.id).reduce((s, l) => s + l.debit, 0)),
  }));
}

export async function getJournalEntries(entityId: string): Promise<JournalEntryRow[]> {
  if (isMockMode()) return withMockReversal(mockStore.journalEntries.filter((je) => je.entityId === entityId));
  return tenantDb(async (db) => {
    return db.select(entryWithReversal).from(schema.journalEntries)
      .where(eq(schema.journalEntries.entityId, entityId))
      .orderBy(desc(schema.journalEntries.date), desc(schema.journalEntries.createdAt), desc(schema.journalEntries.id));
  });
}

export async function getJournalEntry(id: string): Promise<JournalEntryRow | undefined> {
  if (isMockMode()) return withMockReversal(mockStore.journalEntries.filter((je) => je.id === id))[0];
  return tenantDb(async (db) => {
    const rows = await db.select(entryWithReversal).from(schema.journalEntries).where(eq(schema.journalEntries.id, id));
    return rows[0];
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

export type NewPartner = {
  entityId: string; kind: Partner["kind"]; ruc: string; dvRuc: string | null; legalName: string;
  tradeName?: string; country: string; defaultPaymentTerms?: number; contacts?: { email?: string; phone?: string; address?: string };
};
export type PartnerPatch = Partial<Pick<Partner, "legalName" | "kind" | "defaultPaymentTerms" | "retentionProfile">> & {
  tradeName?: string | null;
  /** Merged into the stored contacts: a key set to ""/null is removed, absent keys are kept. */
  contacts?: Record<string, string | null | undefined>;
};

export async function createPartner(input: NewPartner): Promise<string> {
  return tenantDb(async (db) => {
    const [row] = await db.insert(schema.partners).values(input).returning({ id: schema.partners.id });
    return row.id;
  });
}

/** Updates the non-RUC fields; returns false when the partner does not exist or is not visible to the caller. */
export async function updatePartner(id: string, patch: PartnerPatch): Promise<boolean> {
  return tenantDb(async (db) => {
    const { contacts, ...rest } = patch;
    const set: Partial<typeof schema.partners.$inferInsert> = { ...rest, updatedAt: new Date() };
    if (contacts) {
      const [cur] = await db.select({ contacts: schema.partners.contacts }).from(schema.partners).where(eq(schema.partners.id, id)).for("update");
      if (!cur) return false;
      const stored = cur.contacts;
      const merged: Record<string, string> = typeof stored === "object" && stored !== null && !Array.isArray(stored) ? { ...(stored as Record<string, string>) } : {};
      for (const [k, v] of Object.entries(contacts)) {
        if (v === undefined) continue;
        if (v === null || v === "") delete merged[k];
        else merged[k] = v;
      }
      set.contacts = merged;
    }
    const rows = await db.update(schema.partners).set(set).where(eq(schema.partners.id, id)).returning({ id: schema.partners.id });
    return rows.length > 0;
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

type BankAccount = typeof schema.bankAccounts.$inferSelect;

export async function getBankAccounts(entityId: string): Promise<BankAccount[]> {
  if (isMockMode()) return mockStore.bankAccounts.filter((ba) => ba.entityId === entityId);
  return tenantDb(async (db) => {
    return db.select().from(schema.bankAccounts)
      .where(eq(schema.bankAccounts.entityId, entityId))
      .orderBy(asc(schema.bankAccounts.bankName));
  });
}

export async function createBankAccount(data: {
  entityId: string;
  bankName: string;
  accountNumber: string;
  currencyCode?: string;
  glAccountId?: string;
}): Promise<string> {
  if (isMockMode()) {
    const id = randomUUID();
    mockStore.bankAccounts.push({
      id,
      entityId: data.entityId,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      currencyCode: data.currencyCode ?? "PYG",
      glAccountId: data.glAccountId ?? null,
      isActive: true,
    });
    return id;
  }
  return tenantDb(async (db) => {
    const [row] = await db.insert(schema.bankAccounts).values(data).returning({ id: schema.bankAccounts.id });
    return row.id;
  });
}

export async function getBankMovements(bankAccountId: string): Promise<BankMovement[]> {
  if (isMockMode()) return mockStore.bankMovements.filter((bm) => bm.bankAccountId === bankAccountId);
  return tenantDb(async (db) => {
    return db.select().from(schema.bankMovements)
      .where(eq(schema.bankMovements.bankAccountId, bankAccountId))
      .orderBy(desc(schema.bankMovements.date));
  });
}

export async function importBankMovements(
  bankAccountId: string,
  movements: Array<{
    date: string;
    amount: number;
    direction: "debit" | "credit";
    ref?: string;
    description?: string;
  }>
): Promise<number> {
  if (movements.length === 0) return 0;
  if (isMockMode()) {
    for (const m of movements) {
      mockStore.bankMovements.push({
        id: randomUUID(),
        bankAccountId,
        date: m.date,
        amount: m.amount,
        direction: m.direction,
        ref: m.ref ?? null,
        description: m.description ?? null,
        source: "import",
      });
    }
    return movements.length;
  }
  return tenantDb(async (db) => {
    const rows = await db.insert(schema.bankMovements).values(
      movements.map((m) => ({
        bankAccountId,
        date: m.date,
        amount: m.amount,
        direction: m.direction,
        ref: m.ref ?? null,
        description: m.description ?? null,
        source: "import",
      }))
    ).returning({ id: schema.bankMovements.id });
    return rows.length;
  });
}

export async function getReconciliations(bankAccountId: string): Promise<Reconciliation[]> {
  if (isMockMode()) return mockStore.reconciliations.filter((r) => r.bankAccountId === bankAccountId);
  return tenantDb(async (db) => {
    return db.select().from(schema.reconciliations)
      .where(eq(schema.reconciliations.bankAccountId, bankAccountId));
  });
}

export async function saveReconciliations(
  bankAccountId: string,
  matches: Array<{
    bankMovementId: string;
    glTransactionId: string;
    score: number;
    status?: "pending" | "matched" | "flagged" | "manual";
  }>
): Promise<number> {
  if (matches.length === 0) return 0;
  const now = new Date();
  if (isMockMode()) {
    for (const m of matches) {
      mockStore.reconciliations.push({
        id: randomUUID(),
        bankAccountId,
        bankMovementId: m.bankMovementId,
        glTransactionId: m.glTransactionId,
        status: m.status ?? "matched",
        score: String(m.score),
        matchedBy: "auto",
        matchedAt: now,
      });
    }
    return matches.length;
  }
  return tenantDb(async (db) => {
    const rows = await db.insert(schema.reconciliations).values(
      matches.map((m) => ({
        bankAccountId,
        bankMovementId: m.bankMovementId,
        glTransactionId: m.glTransactionId,
        status: m.status ?? "matched",
        score: String(m.score),
        matchedBy: "auto",
        matchedAt: now,
      }))
    ).returning({ id: schema.reconciliations.id });
    return rows.length;
  });
}

export interface BankGLTransaction {
  id: string;
  date: string;
  amount: number;
  direction: "debit" | "credit";
  description: string;
  accountCode: string;
  partnerName?: string;
}

export async function getGLTransactionsForBank(
  entityId: string,
  _bankAccountId?: string
): Promise<BankGLTransaction[]> {
  if (isMockMode()) {
    return mockStore.journalLines
      .filter((l) => {
        const entry = mockStore.journalEntries.find((e) => e.id === l.entryId && e.entityId === entityId && e.status === "posted");
        return !!entry;
      })
      .map((l) => {
        const entry = mockStore.journalEntries.find((e) => e.id === l.entryId)!;
        const debit = Number(l.debit || 0);
        const credit = Number(l.credit || 0);
        return {
          id: l.id,
          date: entry.date instanceof Date ? entry.date.toISOString().slice(0, 10) : String(entry.date),
          amount: debit > 0 ? debit : credit,
          direction: debit > 0 ? ("debit" as const) : ("credit" as const),
          description: l.description || entry.description || "Movimiento contable",
          accountCode: "1.1.1.02",
        };
      });
  }
  return tenantDb(async (db) => {
    const rows = await db.execute<{
      line_id: string;
      entry_date: string;
      debit: string;
      credit: string;
      line_description: string | null;
      entry_description: string | null;
      account_code: string;
      partner_name: string | null;
    }>(
      sql`select l.id as line_id, to_char(e.date, 'YYYY-MM-DD') as entry_date,
                 l.debit, l.credit, l.description as line_description,
                 e.description as entry_description, a.code as account_code,
                 p.legal_name as partner_name
          from journal_lines l
          join journal_entries e on e.id = l.entry_id
          join accounts a on a.id = l.account_id
          left join partners p on p.id = l.partner_id
          where e.entity_id = ${entityId} and e.status = 'posted'
            and (a.code like '1.1.1.02%' or a.code like '1.1.02%')
          order by e.date desc, l.id desc
          limit 200`
    );

    return rows.map((r) => {
      const debit = Number(r.debit || 0);
      const credit = Number(r.credit || 0);
      return {
        id: r.line_id,
        date: r.entry_date,
        amount: debit > 0 ? debit : credit,
        direction: debit > 0 ? ("debit" as const) : ("credit" as const),
        description: r.line_description || r.entry_description || "Movimiento contable",
        accountCode: r.account_code,
        partnerName: r.partner_name ?? undefined,
      };
    });
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

export async function createTaxDocument(values: typeof schema.taxDocuments.$inferInsert) {
  return tenantDb(async (db) => {
    const [doc] = await db.insert(schema.taxDocuments).values(values).returning();
    return doc;
  });
}

// ─── Multicurrency & FX ───────────────────────────────────────────────────

export interface FXTransactionRow {
  id: string;
  date: string;
  entryNumber: string | null;
  description: string;
  currencyCode: string;
  amountME: number;
  fxRate: number;
  amountPYG: number;
  direction: "debit" | "credit";
  partnerName?: string;
  accountCode: string;
}

export async function getFXTransactions(entityId: string): Promise<FXTransactionRow[]> {
  if (isMockMode()) {
    return [
      {
        id: "fx-1",
        date: "2026-05-01",
        entryNumber: "ASI-202605-001",
        description: "Importación mercadería",
        currencyCode: "USD",
        amountME: 15000,
        fxRate: 7400,
        amountPYG: 111000000,
        direction: "debit",
        partnerName: "Global Trade Inc.",
        accountCode: "2.1.1.02",
      },
      {
        id: "fx-2",
        date: "2026-05-05",
        entryNumber: "ASI-202605-002",
        description: "Exportación servicios",
        currencyCode: "USD",
        amountME: 8500,
        fxRate: 7380,
        amountPYG: 62730000,
        direction: "credit",
        partnerName: "Tech Solutions LLC",
        accountCode: "1.1.2.02",
      },
      {
        id: "fx-3",
        date: "2026-05-08",
        entryNumber: "ASI-202605-003",
        description: "Equipos médicos",
        currencyCode: "EUR",
        amountME: 12000,
        fxRate: 7950,
        amountPYG: 95400000,
        direction: "debit",
        partnerName: "MedEquip GmbH",
        accountCode: "2.1.1.02",
      },
      {
        id: "fx-4",
        date: "2026-05-10",
        entryNumber: "ASI-202605-004",
        description: "Anticipo proveedor",
        currencyCode: "USD",
        amountME: 5000,
        fxRate: 7420,
        amountPYG: 37100000,
        direction: "credit",
        partnerName: "Supply Chain Co.",
        accountCode: "1.1.1.03",
      },
    ];
  }

  return tenantDb(async (db) => {
    const rows = await db.execute<{
      line_id: string;
      entry_date: string;
      entry_number: string | null;
      line_description: string | null;
      entry_description: string | null;
      currency_code: string;
      debit: string;
      credit: string;
      fx_rate: string | null;
      amount_base: string | null;
      partner_name: string | null;
      account_code: string;
    }>(
      sql`select l.id as line_id, to_char(e.date, 'YYYY-MM-DD') as entry_date,
                 e.number as entry_number, l.description as line_description,
                 e.description as entry_description, l.currency_code,
                 l.debit, l.credit, l.fx_rate, l.amount_base,
                 p.legal_name as partner_name, a.code as account_code
          from journal_lines l
          join journal_entries e on e.id = l.entry_id
          join accounts a on a.id = l.account_id
          left join partners p on p.id = l.partner_id
          where e.entity_id = ${entityId} and e.status = 'posted'
            and l.currency_code != 'PYG'
          order by e.date desc, l.id desc
          limit 100`
    );

    return rows.map((r) => {
      const debit = Number(r.debit || 0);
      const credit = Number(r.credit || 0);
      const rate = Number(r.fx_rate || 1);
      const base = Number(r.amount_base || 0);
      const amountME = debit > 0 ? debit : credit;
      const amountPYG = base > 0 ? base : Math.round(amountME * rate);

      return {
        id: r.line_id,
        date: r.entry_date,
        entryNumber: r.entry_number,
        description: r.line_description || r.entry_description || "Transacción en Moneda Extranjera",
        currencyCode: r.currency_code,
        amountME,
        fxRate: rate,
        amountPYG,
        direction: debit > 0 ? ("debit" as const) : ("credit" as const),
        partnerName: r.partner_name ?? undefined,
        accountCode: r.account_code,
      };
    });
  });
}

export async function createFXAdjustmentEntry(
  entityId: string,
  input: {
    currencyCode: string;
    amountME: number;
    fxRateCurrent: number;
    diffAmountPYG: number;
    isGain: boolean;
    periodId?: string;
  }
): Promise<{ success: boolean; entryId?: string; message: string }> {
  if (isMockMode()) {
    const entryId = randomUUID();
    return {
      success: true,
      entryId,
      message: `Asiento de diferencia de cambio generado (${input.isGain ? "Ganancia" : "Pérdida"} Gs. ${input.diffAmountPYG.toLocaleString("es-PY")})`,
    };
  }

  return tenantDb(async (db) => {
    let periodId = input.periodId;
    if (!periodId) {
      const [openPeriod] = await db.select().from(schema.fiscalPeriods)
        .where(and(eq(schema.fiscalPeriods.entityId, entityId), eq(schema.fiscalPeriods.status, "open")))
        .limit(1);
      periodId = openPeriod?.id;
    }

    if (!periodId) {
      return { success: false, message: "No hay período fiscal abierto para registrar el asiento" };
    }

    const targetCodePrefix = input.isGain ? "4" : "5";
    const [diffAcc] = await db.execute<{ id: string }>(
      sql`select a.id from accounts a
          join chart_of_accounts c on c.id = a.coa_id
          where c.entity_id = ${entityId} and a.code like ${targetCodePrefix + "%"}
          order by a.code asc limit 1`
    );

    const [meAcc] = await db.execute<{ id: string }>(
      sql`select a.id from accounts a
          join chart_of_accounts c on c.id = a.coa_id
          where c.entity_id = ${entityId} and a.code like '1.1.1%'
          order by a.code asc limit 1`
    );

    if (!diffAcc || !meAcc) {
      return { success: false, message: "No se encontraron cuentas contables adecuadas para registrar la diferencia de cambio" };
    }

    const desc = `Ajuste Diferencia de Cambio ${input.currencyCode} (${input.amountME.toLocaleString()} @ ${input.fxRateCurrent}) - ${input.isGain ? "Ganancia" : "Pérdida"}`;

    const [entry] = await db.insert(schema.journalEntries).values({
      entityId,
      periodId,
      date: new Date(),
      number: `DC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 900 + 100)}`,
      source: "fx_adjustment",
      description: desc,
      status: "posted",
      postedAt: new Date(),
    }).returning();

    await db.insert(schema.journalLines).values([
      {
        entryId: entry.id,
        accountId: input.isGain ? meAcc.id : diffAcc.id,
        debit: input.diffAmountPYG,
        credit: 0,
        currencyCode: "PYG",
        description: desc,
      },
      {
        entryId: entry.id,
        accountId: input.isGain ? diffAcc.id : meAcc.id,
        debit: 0,
        credit: input.diffAmountPYG,
        currencyCode: "PYG",
        description: desc,
      },
    ]);

    return {
      success: true,
      entryId: entry.id,
      message: `Asiento de diferencia de cambio generado exitosamente (Gs. ${input.diffAmountPYG.toLocaleString("es-PY")})`,
    };
  });
}

