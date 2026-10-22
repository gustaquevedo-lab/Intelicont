"use client";

import { api } from "@/trpc/client";

// ─── Entities ──────────────────────────────────────────────────────────

export function useEntities() {
  return api.entities.list.useQuery();
}

export function useEntity(id: string) {
  return api.entities.get.useQuery({ id }, { enabled: !!id });
}

// ─── Accounts ──────────────────────────────────────────────────────────

export function useAccounts(entityId: string) {
  return api.accounts.list.useQuery({ entityId }, { enabled: !!entityId });
}

export function useAccountTree(entityId: string) {
  return api.accounts.tree.useQuery({ entityId }, { enabled: !!entityId });
}

// ─── Journal Entries ───────────────────────────────────────────────────

export function useJournalEntries(entityId: string, limit = 50) {
  return api["journal-entries"].list.useQuery({ entityId, limit }, { enabled: !!entityId });
}

export function useJournalEntry(id: string) {
  return api["journal-entries"].get.useQuery({ id }, { enabled: !!id });
}

export function useJournalEntryLines(entryId: string) {
  return api["journal-entries"].getLines.useQuery({ entryId }, { enabled: !!entryId });
}

export function useCreateJournalEntry() {
  const utils = api.useUtils();
  return api["journal-entries"].create.useMutation({
    onSuccess: () => {
      utils["journal-entries"].list.invalidate();
    },
  });
}

// ─── Tax Documents ────────────────────────────────────────────────────

export function useTaxDocuments(entityId: string) {
  return api["tax-documents"].list.useQuery({ entityId }, { enabled: !!entityId });
}

export function usePendingTaxDocuments(entityId: string) {
  return api["tax-documents"].pending.useQuery({ entityId }, { enabled: !!entityId });
}

export function useTaxDocument(id: string) {
  return api["tax-documents"].get.useQuery({ id }, { enabled: !!id });
}

export function useTaxDocumentLines(documentId: string) {
  return api["tax-documents"].getLines.useQuery({ documentId }, { enabled: !!documentId });
}

// ─── Partners ──────────────────────────────────────────────────────────

export function usePartners(entityId: string) {
  return api.partners.list.useQuery({ entityId }, { enabled: !!entityId });
}

export function usePartner(id: string) {
  return api.partners.get.useQuery({ id }, { enabled: !!id });
}

// ─── Bank ──────────────────────────────────────────────────────────────

export function useBankMovements(bankAccountId: string) {
  return api.bank.movements.useQuery({ bankAccountId }, { enabled: !!bankAccountId });
}

export function useReconciliations(bankAccountId: string) {
  return api.bank.reconciliations.useQuery({ bankAccountId }, { enabled: !!bankAccountId });
}

// ─── Fiscal ────────────────────────────────────────────────────────────

export function useFiscalPeriods(entityId: string) {
  return api.fiscal.periods.useQuery({ entityId }, { enabled: !!entityId });
}

export function useCurrentPeriod(entityId: string) {
  return api.fiscal.currentPeriod.useQuery({ entityId }, { enabled: !!entityId });
}

export function useVencimientoIva(year: number, month: number, ruc: string) {
  return api.fiscal.vencimientoIva.useQuery({ year, month, ruc }, { enabled: !!ruc });
}

// ─── Reports ───────────────────────────────────────────────────────────

export function useIvaSummary(entityId: string, year: number, month: number) {
  return api.reports.ivaSummary.useQuery({ entityId, year, month }, { enabled: !!entityId });
}

export function useFiscalResume(entityId: string) {
  return api.reports.fiscalResume.useQuery({ entityId }, { enabled: !!entityId });
}

export function useTrialBalance(entityId: string) {
  return api.reports.trialBalance.useQuery({ entityId }, { enabled: !!entityId });
}
