"use client";

import { useCallback, useState } from "react";
import { api } from "@/trpc/client";

// ─── Idempotency ───────────────────────────────────────────────────────

/**
 * One Idempotency-Key per user action. The key exists before the submit (it is created with the
 * form), so a double click, a re-submit after a network error, or a retry all send the SAME key and
 * the server runs the action once. Call `renew()` after success to start a new action. A failed
 * request rolls the key back on the server, so keeping it after an error is safe.
 * Use `trpc` in `useMutation({ trpc })` (the provider sends it as the header), or `key` for server actions.
 */
export function useIdempotencyKey() {
  const [key, setKey] = useState(() => crypto.randomUUID());
  const renew = useCallback(() => setKey(crypto.randomUUID()), []);
  return { key, renew, trpc: { context: { idempotencyKey: key } } };
}

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
