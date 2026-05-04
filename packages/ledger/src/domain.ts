// Domain primitives for Ledger in Intelicont
export type CurrencyCode = string; // e.g., 'PYG', 'USD'

export type MoneyAmount = string; // use string to avoid JS precision issues in UI; backend stores numeric(20,4)

export interface JournalLine {
  id?: string;
  entryId: string;
  accountId: string;
  debit: MoneyAmount; // numeric(20,4) as string
  credit: MoneyAmount; // numeric(20,4) as string
  currencyCode: CurrencyCode;
  fxRate?: string;
  amountBase?: string;
  costCenterId?: string;
  partnerId?: string;
  taxDocumentId?: string;
  description?: string;
}

export interface JournalEntry {
  id: string;
  entityId: string;
  periodId?: string;
  date: string; // ISO timestamp
  number?: string;
  source?: string;
  sourceRef?: string;
  description?: string;
  status: 'draft' | 'posted' | 'reversed';
  postedAt?: string;
  postedBy?: string;
  reversalOf?: string;
  versionOf?: string;
  metadata?: any;
  lines: JournalLine[];
}

// Invariant: for each entry, sum of debits equals sum of credits per currency/base
export function isBalanced(entry: JournalEntry): boolean {
  const totalDebit = entry.lines.reduce((acc, l) => acc + (parseFloatSafe(l.debit) || 0), 0);
  const totalCredit = entry.lines.reduce((acc, l) => acc + (parseFloatSafe(l.credit) || 0), 0);
  // We compare as numeric values; may consider per currency if multi-currency is used
  return approxEq(totalDebit, totalCredit);
}

function parseFloatSafe(v?: string): number {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function approxEq(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) < eps;
}

// Very small helper to assert balance and throw helpful error in development
export function assertBalanced(entry: JournalEntry): void {
  if (!isBalanced(entry)) {
    throw new Error(`Journal entry ${entry.id} is unbalanced: debit != credit`);
  }
}
