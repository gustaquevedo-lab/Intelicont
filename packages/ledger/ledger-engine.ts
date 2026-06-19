import { eq, and, gte, lte, sql, asc, desc, isNull } from "drizzle-orm";
import { getDb } from "./db/index";
import * as schema from "./db/schema";

// ─── Result Type ────────────────────────────────────────────────────────────

export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

// ─── Error Types ───────────────────────────────────────────────────────────

export type LedgerErrorCode =
  | "UNBALANCED_ENTRY"
  | "PERIOD_NOT_FOUND"
  | "PERIOD_CLOSED"
  | "PERIOD_ALREADY_CLOSED"
  | "PERIOD_NOT_CLOSED"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_NO_POSTING"
  | "ENTRY_NOT_FOUND"
  | "ENTRY_NOT_POSTED"
  | "ALREADY_REVERSED"
  | "FUTURE_DATE"
  | "ZERO_LINES"
  | "INVALID_LINE"
  | "NEGATIVE_AMOUNT"
  | "INVALID_NUMBER"
  | "NOT_AUTHORIZED";

export interface LedgerError {
  code: LedgerErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

function ledgerError(
  code: LedgerErrorCode,
  message: string,
  details?: Record<string, unknown>
): LedgerError {
  return { code, message, details };
}

// ─── Decimal Arithmetic (string-based, matching DB numeric(20,4)) ──────────

const EPSILON = 0.0001;

function toNumber(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function fmt(n: number): string {
  return n.toFixed(4);
}

function add(a: string, b: string): string {
  return fmt(toNumber(a) + toNumber(b));
}

function sub(a: string, b: string): string {
  return fmt(toNumber(a) - toNumber(b));
}

function mul(a: string, b: string): string {
  return fmt(toNumber(a) * toNumber(b));
}

function isZero(s: string): boolean {
  return Math.abs(toNumber(s)) <= EPSILON;
}

function isGt(a: string, b: string): boolean {
  return toNumber(a) > toNumber(b);
}

function isApproxEqual(a: string, b: string): boolean {
  return Math.abs(toNumber(a) - toNumber(b)) <= EPSILON;
}

function maxStr(a: string, b: string): string {
  return isGt(a, b) ? a : b;
}

// ─── Input Types ───────────────────────────────────────────────────────────

export interface PostEntryInput {
  entityId: string;
  periodId: string;
  date: Date;
  number?: string;
  source?: string;
  sourceRef?: string;
  description: string;
  lines: PostLineInput[];
  postedBy: string;
}

export interface PostLineInput {
  accountId: string;
  debit: string;
  credit: string;
  currencyCode?: string;
  fxRate?: string;
  costCenterId?: string;
  partnerId?: string;
  taxDocumentId?: string;
  description?: string;
}

export interface ReverseEntryInput {
  entryId: string;
  reason: string;
  reversedBy: string;
  date?: Date;
}

export interface AdjustEntryInput {
  entryId: string;
  date: Date;
  description: string;
  lines: PostLineInput[];
  adjustedBy: string;
}

export interface ClosePeriodInput {
  periodId: string;
  entityId: string;
  closedBy: string;
}

export interface ReopenPeriodInput {
  periodId: string;
  entityId: string;
  reopenedBy: string;
  reason: string;
}

// ─── Output Types ──────────────────────────────────────────────────────────

export interface PostedEntryResult {
  id: string;
  number: string;
  date: Date;
  description: string;
  status: "posted";
  linesCount: number;
  totalDebit: string;
  totalCredit: string;
}

export interface AccountBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  nature: string;
  totalDebit: string;
  totalCredit: string;
  balance: string;
}

export interface MayorEntryRow {
  date: Date;
  entryId: string;
  number: string;
  description: string;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface DiarioEntryRow {
  date: Date;
  entryId: string;
  number: string;
  description: string;
  source: string;
  lines: {
    accountCode: string;
    accountName: string;
    debit: string;
    credit: string;
  }[];
}

export interface ClosedPeriodResult {
  id: string;
  year: number;
  month: number;
  status: "closed";
  closedAt: Date;
  closedBy: string;
}

// ─── Internal helpers ───────────────────────────────────────────────────────

async function getPeriod(
  periodId: string,
  entityId: string
): Promise<Result<typeof schema.fiscalPeriods.$inferSelect, LedgerError>> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.fiscalPeriods)
    .where(
      and(
        eq(schema.fiscalPeriods.id, periodId),
        eq(schema.fiscalPeriods.entityId, entityId)
      )
    );
  if (rows.length === 0) {
    return {
      success: false,
      error: ledgerError("PERIOD_NOT_FOUND", `Período no encontrado: ${periodId}`),
    };
  }
  return { success: true, data: rows[0] };
}

function requireOpenPeriod(
  period: typeof schema.fiscalPeriods.$inferSelect
): Result<void, LedgerError> {
  if (period.status !== "open") {
    return {
      success: false,
      error: ledgerError(
        "PERIOD_CLOSED",
        `El período ${period.year}/${String(period.month).padStart(2, "0")} está "${period.status}". Solo se puede postear en períodos abiertos.`
      ),
    };
  }
  return { success: true, data: undefined };
}

async function getAccount(
  accountId: string
): Promise<Result<typeof schema.accounts.$inferSelect, LedgerError>> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.id, accountId));
  if (rows.length === 0) {
    return {
      success: false,
      error: ledgerError("ACCOUNT_NOT_FOUND", `Cuenta no encontrada: ${accountId}`),
    };
  }
  return { success: true, data: rows[0] };
}

function requirePostingAllowed(
  account: typeof schema.accounts.$inferSelect
): Result<void, LedgerError> {
  if (!account.allowsPosting) {
    return {
      success: false,
      error: ledgerError(
        "ACCOUNT_NO_POSTING",
        `La cuenta ${account.code} - ${account.name} no permite posteo directo`
      ),
    };
  }
  return { success: true, data: undefined };
}

function validateLines(lines: PostLineInput[]): Result<void, LedgerError> {
  if (lines.length === 0) {
    return {
      success: false,
      error: ledgerError("ZERO_LINES", "El asiento debe tener al menos una línea"),
    };
  }

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const d = toNumber(l.debit || "0");
    const c = toNumber(l.credit || "0");

    if (d < 0 || c < 0) {
      return {
        success: false,
        error: ledgerError(
          "NEGATIVE_AMOUNT",
          `Línea ${i + 1}: los montos deben ser positivos (débito: ${l.debit}, crédito: ${l.credit})`
        ),
      };
    }

    const debitZero = isZero(l.debit || "0");
    const creditZero = isZero(l.credit || "0");

    if (debitZero && creditZero) {
      return {
        success: false,
        error: ledgerError(
          "INVALID_LINE",
          `Línea ${i + 1}: debe tener débito o crédito mayor a 0`
        ),
      };
    }

    if (!debitZero && !creditZero) {
      return {
        success: false,
        error: ledgerError(
          "INVALID_LINE",
          `Línea ${i + 1}: no puede tener débito y crédito simultáneamente`
        ),
      };
    }
  }

  return { success: true, data: undefined };
}

function validateBalance(lines: PostLineInput[]): Result<void, LedgerError> {
  let totalDebit = "0";
  let totalCredit = "0";
  for (const l of lines) {
    totalDebit = add(totalDebit, l.debit || "0");
    totalCredit = add(totalCredit, l.credit || "0");
  }
  if (!isApproxEqual(totalDebit, totalCredit)) {
    return {
      success: false,
      error: ledgerError(
        "UNBALANCED_ENTRY",
        `El asiento no está balanceado: débito ${totalDebit} ≠ crédito ${totalCredit}`
      ),
    };
  }
  return { success: true, data: undefined };
}

async function generateEntryNumber(
  periodId: string,
  entityId: string,
  source: string
): Promise<string> {
  const db = getDb();
  // Find the last number for this period and source
  const lastEntry = await db
    .select({ number: schema.journalEntries.number })
    .from(schema.journalEntries)
    .where(
      and(
        eq(schema.journalEntries.entityId, entityId),
        eq(schema.journalEntries.periodId, periodId)
      )
    )
    .orderBy(desc(schema.journalEntries.number))
    .limit(1);

  const prefix = source.toUpperCase().slice(0, 3) || "MAN";
  if (lastEntry.length === 0) {
    return `${prefix}-0001`;
  }

  const lastNum = lastEntry[0].number || "";
  const parts = lastNum.split("-");
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  const nextSeq = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}-${String(nextSeq).padStart(4, "0")}`;
}

async function recordAuditEvent(params: {
  entityId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
}): Promise<void> {
  const db = getDb();
  await db.insert(schema.auditEvents).values({
    entityId: params.entityId,
    actorId: params.actorId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    before: params.before || null,
    after: params.after || null,
    reason: params.reason || null,
  });
}

function computeAmountBase(
  debit: string,
  credit: string,
  fxRate: string
): string {
  return isZero(debit) ? mul(credit, fxRate) : mul(debit, fxRate);
}

// ─── 3.2: postEntry ────────────────────────────────────────────────────────

export async function postEntry(
  input: PostEntryInput
): Promise<Result<PostedEntryResult, LedgerError>> {
  // 1. Validate period exists and is open
  const periodResult = await getPeriod(input.periodId, input.entityId);
  if (!periodResult.success) return periodResult;
  const openResult = requireOpenPeriod(periodResult.data);
  if (!openResult.success) return openResult;

  // 2. Validate date is not in the future
  if (input.date > new Date()) {
    return {
      success: false,
      error: ledgerError("FUTURE_DATE", "La fecha del asiento no puede ser futura"),
    };
  }

  // 3. Validate lines structure
  const linesResult = validateLines(input.lines);
  if (!linesResult.success) return linesResult;

  // 4. Validate balance: débito = crédito
  const balanceResult = validateBalance(input.lines);
  if (!balanceResult.success) return balanceResult;

  // 5. Validate all accounts exist and allow posting
  for (let i = 0; i < input.lines.length; i++) {
    const accountResult = await getAccount(input.lines[i].accountId);
    if (!accountResult.success) return accountResult;
    const postingResult = requirePostingAllowed(accountResult.data);
    if (!postingResult.success) return postingResult;
  }

  // 6. Generate entry number
  const source = input.source || "manual";
  const number =
    input.number || (await generateEntryNumber(input.periodId, input.entityId, source));

  // 7. Insert journal entry
  const db = getDb();
  const [entry] = await db
    .insert(schema.journalEntries)
    .values({
      entityId: input.entityId,
      periodId: input.periodId,
      date: input.date,
      number,
      source: source as any,
      sourceRef: input.sourceRef,
      description: input.description,
      status: "posted",
      postedAt: new Date(),
      postedBy: input.postedBy,
    })
    .returning();

  // 8. Insert journal lines
  const lineValues = input.lines.map((l) => {
    const fxRate = l.fxRate || "1";
    const debit = l.debit || "0";
    const credit = l.credit || "0";
    return {
      entryId: entry.id,
      accountId: l.accountId,
      debit,
      credit,
      currencyCode: l.currencyCode || "PYG",
      fxRate,
      amountBase: computeAmountBase(debit, credit, fxRate),
      costCenterId: l.costCenterId || null,
      partnerId: l.partnerId || null,
      taxDocumentId: l.taxDocumentId || null,
      description: l.description || null,
    };
  });

  await db.insert(schema.journalLines).values(lineValues);

  // 9. Audit event
  await recordAuditEvent({
    entityId: input.entityId,
    actorId: input.postedBy,
    action: "journal.post",
    targetType: "journal_entry",
    targetId: entry.id,
    after: {
      number,
      date: input.date.toISOString(),
      description: input.description,
      totalLines: input.lines.length,
      source,
    },
  });

  let totalDebit = "0";
  let totalCredit = "0";
  for (const l of input.lines) {
    totalDebit = add(totalDebit, l.debit || "0");
    totalCredit = add(totalCredit, l.credit || "0");
  }

  return {
    success: true,
    data: {
      id: entry.id,
      number,
      date: input.date,
      description: input.description,
      status: "posted",
      linesCount: input.lines.length,
      totalDebit,
      totalCredit,
    },
  };
}

// ─── 3.3: reverseEntry ─────────────────────────────────────────────────────

export async function reverseEntry(
  input: ReverseEntryInput
): Promise<Result<PostedEntryResult, LedgerError>> {
  const db = getDb();

  // 1. Find original entry
  const entries = await db
    .select()
    .from(schema.journalEntries)
    .where(eq(schema.journalEntries.id, input.entryId));

  if (entries.length === 0) {
    return {
      success: false,
      error: ledgerError("ENTRY_NOT_FOUND", `Asiento no encontrado: ${input.entryId}`),
    };
  }

  const original = entries[0];

  // 2. Must be posted
  if (original.status !== "posted") {
    return {
      success: false,
      error: ledgerError(
        "ENTRY_NOT_POSTED",
        `Solo se pueden revertir asientos posteados (estado actual: ${original.status})`
      ),
    };
  }

  // 3. Must not already be reversed
  if (original.reversalOf) {
    return {
      success: false,
      error: ledgerError(
        "ALREADY_REVERSED",
        `El asiento ${original.number} ya es una reversión de otro asiento`
      ),
    };
  }

  // 4. Check period is open
  if (original.periodId) {
    const periodResult = await getPeriod(original.periodId, original.entityId);
    if (!periodResult.success) return periodResult;
    const openResult = requireOpenPeriod(periodResult.data);
    if (!openResult.success) return openResult;
  }

  // 5. Get original lines
  const originalLines = await db
    .select()
    .from(schema.journalLines)
    .where(eq(schema.journalLines.entryId, input.entryId));

  // 6. Create reversal lines (swap debit ↔ credit)
  const reversalLines: PostLineInput[] = originalLines.map((l) => ({
    accountId: l.accountId,
    debit: l.credit, // original credit becomes debit
    credit: l.debit, // original debit becomes credit
    currencyCode: l.currencyCode,
    fxRate: l.fxRate || "1",
    costCenterId: l.costCenterId || undefined,
    partnerId: l.partnerId || undefined,
    taxDocumentId: l.taxDocumentId || undefined,
    description: l.description || undefined,
  }));

  // 7. Post reversal using postEntry
  const reversalDate = input.date || new Date();
  const result = await postEntry({
    entityId: original.entityId,
    periodId: original.periodId!,
    date: reversalDate,
    source: "manual",
    description: `REV: ${original.description || original.number}`,
    lines: reversalLines,
    postedBy: input.reversedBy,
  });

  if (!result.success) return result;

  // 8. Update reversalOf on the reversal entry and set original status
  await db
    .update(schema.journalEntries)
    .set({ reversalOf: input.entryId })
    .where(eq(schema.journalEntries.id, result.data.id));

  // 9. Audit event for reversal
  await recordAuditEvent({
    entityId: original.entityId,
    actorId: input.reversedBy,
    action: "journal.reverse",
    targetType: "journal_entry",
    targetId: original.id,
    after: {
      reversalEntryId: result.data.id,
      reason: input.reason,
    },
    reason: input.reason,
  });

  return result;
}

// ─── 3.4: adjustEntry ──────────────────────────────────────────────────────

export async function adjustEntry(
  input: AdjustEntryInput
): Promise<Result<PostedEntryResult, LedgerError>> {
  const db = getDb();

  // 1. Find original entry
  const entries = await db
    .select()
    .from(schema.journalEntries)
    .where(eq(schema.journalEntries.id, input.entryId));

  if (entries.length === 0) {
    return {
      success: false,
      error: ledgerError("ENTRY_NOT_FOUND", `Asiento no encontrado: ${input.entryId}`),
    };
  }

  const original = entries[0];

  // 2. Must be posted
  if (original.status !== "posted") {
    return {
      success: false,
      error: ledgerError(
        "ENTRY_NOT_POSTED",
        `Solo se pueden ajustar asientos posteados (estado actual: ${original.status})`
      ),
    };
  }

  // 3. Check period is open
  if (original.periodId) {
    const periodResult = await getPeriod(original.periodId, original.entityId);
    if (!periodResult.success) return periodResult;
    const openResult = requireOpenPeriod(periodResult.data);
    if (!openResult.success) return openResult;
  }

  // 4. Validate lines and balance
  const linesResult = validateLines(input.lines);
  if (!linesResult.success) return linesResult;

  const balanceResult = validateBalance(input.lines);
  if (!balanceResult.success) return balanceResult;

  // 5. Post adjustment entry with versionOf pointing to original
  const result = await postEntry({
    entityId: original.entityId,
    periodId: original.periodId!,
    date: input.date,
    source: "manual",
    description: input.description,
    lines: input.lines,
    postedBy: input.adjustedBy,
  });

  if (!result.success) return result;

  // 6. Set versionOf on the adjustment entry
  await db
    .update(schema.journalEntries)
    .set({ versionOf: input.entryId })
    .where(eq(schema.journalEntries.id, result.data.id));

  // 7. Audit event
  await recordAuditEvent({
    entityId: original.entityId,
    actorId: input.adjustedBy,
    action: "journal.adjust",
    targetType: "journal_entry",
    targetId: original.id,
    after: {
      adjustmentEntryId: result.data.id,
      description: input.description,
      linesCount: input.lines.length,
    },
  });

  return result;
}

// ─── 3.5: closePeriod ──────────────────────────────────────────────────────

export async function closePeriod(
  input: ClosePeriodInput
): Promise<Result<ClosedPeriodResult, LedgerError>> {
  const db = getDb();

  // 1. Find period
  const periodResult = await getPeriod(input.periodId, input.entityId);
  if (!periodResult.success) return periodResult;

  const period = periodResult.data;

  // 2. Must be open
  if (period.status !== "open") {
    return {
      success: false,
      error: ledgerError(
        "PERIOD_ALREADY_CLOSED",
        `El período ${period.year}/${String(period.month).padStart(2, "0")} ya está "${period.status}"`
      ),
    };
  }

  // 3. Verify no draft entries
  const drafts = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.journalEntries)
    .where(
      and(
        eq(schema.journalEntries.entityId, input.entityId),
        eq(schema.journalEntries.periodId, input.periodId),
        eq(schema.journalEntries.status, "draft")
      )
    );

  if (drafts[0].count > 0) {
    return {
      success: false,
      error: ledgerError(
        "PERIOD_CLOSED",
        `No se puede cerrar el período: hay ${drafts[0].count} asientos en borrador`
      ),
    };
  }

  // 4. Close the period
  const now = new Date();
  await db
    .update(schema.fiscalPeriods)
    .set({
      status: "closed",
      closedAt: now,
      closedBy: input.closedBy,
    })
    .where(eq(schema.fiscalPeriods.id, input.periodId));

  // 5. Audit event
  await recordAuditEvent({
    entityId: input.entityId,
    actorId: input.closedBy,
    action: "period.close",
    targetType: "fiscal_period",
    targetId: input.periodId,
    before: {
      status: period.status,
      closedAt: period.closedAt,
      closedBy: period.closedBy,
    },
    after: {
      status: "closed",
      closedAt: now.toISOString(),
      closedBy: input.closedBy,
    },
  });

  return {
    success: true,
    data: {
      id: period.id,
      year: period.year,
      month: period.month,
      status: "closed",
      closedAt: now,
      closedBy: input.closedBy,
    },
  };
}

// ─── 3.5: reopenPeriod ─────────────────────────────────────────────────────

export async function reopenPeriod(
  input: ReopenPeriodInput
): Promise<Result<ClosedPeriodResult, LedgerError>> {
  const db = getDb();

  // 1. Find period
  const periodResult = await getPeriod(input.periodId, input.entityId);
  if (!periodResult.success) return periodResult;

  const period = periodResult.data;

  // 2. Must be closed
  if (period.status !== "closed") {
    return {
      success: false,
      error: ledgerError(
        "PERIOD_NOT_CLOSED",
        `El período ${period.year}/${String(period.month).padStart(2, "0")} no está cerrado (estado: ${period.status})`
      ),
    };
  }

  // 3. Reopen the period
  const now = new Date();
  await db
    .update(schema.fiscalPeriods)
    .set({
      status: "reopened",
      closedAt: null,
      closedBy: null,
    })
    .where(eq(schema.fiscalPeriods.id, input.periodId));

  // 4. Audit event (mandatory reason for reopening)
  await recordAuditEvent({
    entityId: input.entityId,
    actorId: input.reopenedBy,
    action: "period.reopen",
    targetType: "fiscal_period",
    targetId: input.periodId,
    before: {
      status: period.status,
      closedAt: period.closedAt,
      closedBy: period.closedBy,
    },
    after: {
      status: "reopened",
      reopenedAt: now.toISOString(),
      reopenedBy: input.reopenedBy,
    },
    reason: input.reason,
  });

  return {
    success: true,
    data: {
      id: period.id,
      year: period.year,
      month: period.month,
      status: "closed",
      closedAt: now,
      closedBy: input.reopenedBy,
    },
  };
}

// ─── 3.6: getAccountBalance ────────────────────────────────────────────────

export async function getAccountBalance(params: {
  entityId: string;
  accountId: string;
  upToDate: Date;
}): Promise<Result<AccountBalanceRow, LedgerError>> {
  const db = getDb();

  // 1. Verify account exists
  const accountResult = await getAccount(params.accountId);
  if (!accountResult.success) return accountResult;
  const account = accountResult.data;

  // 2. Sum all posted journal lines for this account up to the given date
  const result = await db
    .select({
      totalDebit: sql<string>`COALESCE(SUM(jl.debit::numeric), 0)`,
      totalCredit: sql<string>`COALESCE(SUM(jl.credit::numeric), 0)`,
    })
    .from(schema.journalLines)
    .innerJoin(
      schema.journalEntries,
      eq(schema.journalLines.entryId, schema.journalEntries.id)
    )
    .where(
      and(
        eq(schema.journalLines.accountId, params.accountId),
        eq(schema.journalEntries.entityId, params.entityId),
        eq(schema.journalEntries.status, "posted"),
        lte(schema.journalEntries.date, params.upToDate)
      )
    );

  const totalDebit = result[0]?.totalDebit || "0";
  const totalCredit = result[0]?.totalCredit || "0";

  // 3. Compute balance based on nature
  let balance: string;
  switch (account.nature) {
    case "asset":
    case "expense":
      // Deudor: balance = debits - credits
      balance = sub(totalDebit, totalCredit);
      break;
    case "liability":
    case "equity":
    case "income":
      // Acreedor: balance = credits - debits
      balance = sub(totalCredit, totalDebit);
      break;
    default:
      balance = "0.0000";
  }

  return {
    success: true,
    data: {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      nature: account.nature || "",
      totalDebit,
      totalCredit,
      balance,
    },
  };
}

// ─── 3.7: getSumasSaldos (Trial Balance) ───────────────────────────────────

export async function getSumasSaldos(params: {
  entityId: string;
  periodId: string;
}): Promise<AccountBalanceRow[]> {
  const db = getDb();

  const periodResult = await getPeriod(params.periodId, params.entityId);
  if (!periodResult.success) return [];
  const period = periodResult.data;

  // Get all accounts for this entity
  const coas = await db
    .select()
    .from(schema.chartOfAccounts)
    .where(eq(schema.chartOfAccounts.entityId, params.entityId));

  if (coas.length === 0) return [];

  const allAccounts = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.coaId, coas[0].id))
    .orderBy(asc(schema.accounts.code));

  // Get period date range
  const periodStart = new Date(period.year, period.month - 1, 1);
  const periodEnd = new Date(period.year, period.month, 0, 23, 59, 59);

  const rows: AccountBalanceRow[] = [];

  for (const account of allAccounts) {
    const result = await db
      .select({
        totalDebit: sql<string>`COALESCE(SUM(jl.debit::numeric), 0)`,
        totalCredit: sql<string>`COALESCE(SUM(jl.credit::numeric), 0)`,
      })
      .from(schema.journalLines)
      .innerJoin(
        schema.journalEntries,
        eq(schema.journalLines.entryId, schema.journalEntries.id)
      )
      .where(
        and(
          eq(schema.journalLines.accountId, account.id),
          eq(schema.journalEntries.entityId, params.entityId),
          eq(schema.journalEntries.status, "posted"),
          gte(schema.journalEntries.date, periodStart),
          lte(schema.journalEntries.date, periodEnd)
        )
      );

    const totalDebit = result[0]?.totalDebit || "0";
    const totalCredit = result[0]?.totalCredit || "0";

    let balance: string;
    switch (account.nature) {
      case "asset":
      case "expense":
        balance = sub(totalDebit, totalCredit);
        break;
      default:
        balance = sub(totalCredit, totalDebit);
    }

    if (!isZero(totalDebit) || !isZero(totalCredit)) {
      rows.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        nature: account.nature || "",
        totalDebit,
        totalCredit,
        balance,
      });
    }
  }

  return rows;
}

// ─── 3.7: getMayor (Ledger per Account) ────────────────────────────────────

export async function getMayor(params: {
  entityId: string;
  accountId: string;
  periodId: string;
}): Promise<MayorEntryRow[]> {
  const db = getDb();

  const periodResult = await getPeriod(params.periodId, params.entityId);
  if (!periodResult.success) return [];
  const period = periodResult.data;

  const periodStart = new Date(period.year, period.month - 1, 1);
  const periodEnd = new Date(period.year, period.month, 0, 23, 59, 59);

  // Get account info
  const accountResult = await getAccount(params.accountId);
  if (!accountResult.success) return [];
  const account = accountResult.data;

  // Get initial balance before period start
  const initialResult = await db
    .select({
      totalDebit: sql<string>`COALESCE(SUM(jl.debit::numeric), 0)`,
      totalCredit: sql<string>`COALESCE(SUM(jl.credit::numeric), 0)`,
    })
    .from(schema.journalLines)
    .innerJoin(
      schema.journalEntries,
      eq(schema.journalLines.entryId, schema.journalEntries.id)
    )
    .where(
      and(
        eq(schema.journalLines.accountId, params.accountId),
        eq(schema.journalEntries.entityId, params.entityId),
        eq(schema.journalEntries.status, "posted"),
        lte(schema.journalEntries.date, periodStart)
      )
    );

  let runningBalance: string;
  const initDebit = initialResult[0]?.totalDebit || "0";
  const initCredit = initialResult[0]?.totalCredit || "0";

  switch (account.nature) {
    case "asset":
    case "expense":
      runningBalance = sub(initDebit, initCredit);
      break;
    default:
      runningBalance = sub(initCredit, initDebit);
  }

  // Get period movements
  const lines = await db
    .select({
      date: schema.journalEntries.date,
      entryId: schema.journalEntries.id,
      number: schema.journalEntries.number,
      description: schema.journalEntries.description,
      debit: schema.journalLines.debit,
      credit: schema.journalLines.credit,
    })
    .from(schema.journalLines)
    .innerJoin(
      schema.journalEntries,
      eq(schema.journalLines.entryId, schema.journalEntries.id)
    )
    .where(
      and(
        eq(schema.journalLines.accountId, params.accountId),
        eq(schema.journalEntries.entityId, params.entityId),
        eq(schema.journalEntries.status, "posted"),
        gte(schema.journalEntries.date, periodStart),
        lte(schema.journalEntries.date, periodEnd)
      )
    )
    .orderBy(asc(schema.journalEntries.date), asc(schema.journalEntries.number));

  const rows: MayorEntryRow[] = [];

  for (const line of lines) {
    const debit = line.debit || "0";
    const credit = line.credit || "0";

    // Update running balance based on nature
    switch (account.nature) {
      case "asset":
      case "expense":
        runningBalance = add(runningBalance, debit);
        runningBalance = sub(runningBalance, credit);
        break;
      default:
        runningBalance = add(runningBalance, credit);
        runningBalance = sub(runningBalance, debit);
    }

    rows.push({
      date: line.date,
      entryId: line.entryId,
      number: line.number || "",
      description: line.description || "",
      debit,
      credit,
      runningBalance: maxStr(runningBalance, "0.0000"),
    });
  }

  return rows;
}

// ─── 3.7: getDiario (Journal for Period) ───────────────────────────────────

export async function getDiario(params: {
  entityId: string;
  periodId: string;
}): Promise<DiarioEntryRow[]> {
  const db = getDb();

  const periodResult = await getPeriod(params.periodId, params.entityId);
  if (!periodResult.success) return [];
  const period = periodResult.data;

  const periodStart = new Date(period.year, period.month - 1, 1);
  const periodEnd = new Date(period.year, period.month, 0, 23, 59, 59);

  // Get all posted entries in period
  const entries = await db
    .select()
    .from(schema.journalEntries)
    .where(
      and(
        eq(schema.journalEntries.entityId, params.entityId),
        eq(schema.journalEntries.status, "posted"),
        gte(schema.journalEntries.date, periodStart),
        lte(schema.journalEntries.date, periodEnd)
      )
    )
    .orderBy(asc(schema.journalEntries.date), asc(schema.journalEntries.number));

  if (entries.length === 0) return [];

  // Get all lines for these entries
  const entryIds = entries.map((e) => e.id);
  const lines = await db
    .select()
    .from(schema.journalLines)
    .where(sql`${schema.journalLines.entryId} = ANY(${entryIds}::uuid[])`);

  // Get accounts for display
  const accountIds = [...new Set(lines.map((l) => l.accountId))];
  const accounts = await db
    .select()
    .from(schema.accounts)
    .where(sql`${schema.accounts.id} = ANY(${accountIds}::uuid[])`);

  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const rows: DiarioEntryRow[] = entries.map((entry) => {
    const entryLines = lines
      .filter((l) => l.entryId === entry.id)
      .map((l) => {
        const acc = accountMap.get(l.accountId);
        return {
          accountCode: acc?.code || "",
          accountName: acc?.name || "",
          debit: l.debit || "0",
          credit: l.credit || "0",
        };
      });

    return {
      date: entry.date,
      entryId: entry.id,
      number: entry.number || "",
      description: entry.description || "",
      source: entry.source || "manual",
      lines: entryLines,
    };
  });

  return rows;
}
