// Domain primitives for Ledger in Intelicont
export type CurrencyCode = string; // e.g., 'PYG', 'USD'

export type MoneyAmount = number; // integer in the currency's minor unit (PYG exponent 0); DB bigint

export interface JournalLine {
  id?: string;
  entryId: string;
  accountId: string;
  debit: MoneyAmount;
  credit: MoneyAmount;
  currencyCode: CurrencyCode;
  fxRate?: string;
  amountBase?: number;
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

// Invariant: for each entry, sum of debits equals sum of credits (exact integer equality)
export function isBalanced(entry: JournalEntry): boolean {
  const totalDebit = entry.lines.reduce((acc, l) => acc + l.debit, 0);
  const totalCredit = entry.lines.reduce((acc, l) => acc + l.credit, 0);
  return totalDebit === totalCredit;
}

// Very small helper to assert balance and throw helpful error in development
export function assertBalanced(entry: JournalEntry): void {
  if (!isBalanced(entry)) {
    throw new Error(`Journal entry ${entry.id} is unbalanced: debit != credit`);
  }
}
