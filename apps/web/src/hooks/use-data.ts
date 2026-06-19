"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmpresas,
  getFiscalPeriods,
  getOpenPeriod,
  getCuentas,
  getAsientos,
  getAsientoLines,
  createAsiento,
  reverseAsiento,
  adjustAsiento,
  closeFiscalPeriod,
  reopenFiscalPeriod,
  getAccountBalanceReport,
  getSumasSaldosReport,
  getMayorReport,
  getDiarioReport,
  getPartners,
  getTaxDocuments,
  getPendingTaxDocuments,
  getRetentions,
  getBankMovements,
  getReconciliations,
  getAuditEvents,
  getAiDecisions,
  getBankAccounts,
  createBankAccount,
  uploadBankCsv,
  matchBankToGL,
  confirmReconciliation,
  rejectReconciliation,
  deleteReconciliation,
  getGlTransactionsForEntity,
  createEntryFromBankMovement,
  uploadBankStatementFile,
} from "@/lib/actions";

export function useEmpresas() {
  return useQuery({
    queryKey: ["empresas"],
    queryFn: getEmpresas,
  });
}

export function useFiscalPeriods(entityId: string | null) {
  return useQuery({
    queryKey: ["fiscalPeriods", entityId],
    queryFn: () => getFiscalPeriods(entityId!),
    enabled: !!entityId,
  });
}

export function useOpenPeriod(entityId: string | null) {
  return useQuery({
    queryKey: ["openPeriod", entityId],
    queryFn: () => getOpenPeriod(entityId!),
    enabled: !!entityId,
  });
}

export function useCuentas(entityId: string | null) {
  return useQuery({
    queryKey: ["cuentas", entityId],
    queryFn: () => getCuentas(entityId!),
    enabled: !!entityId,
  });
}

export function useAsientos(entityId: string | null) {
  return useQuery({
    queryKey: ["asientos", entityId],
    queryFn: () => getAsientos(entityId!),
    enabled: !!entityId,
  });
}

export function useAsientoLines(entryId: string | null) {
  return useQuery({
    queryKey: ["asientoLines", entryId],
    queryFn: () => getAsientoLines(entryId!),
    enabled: !!entryId,
  });
}

export function usePartners(entityId: string | null) {
  return useQuery({
    queryKey: ["partners", entityId],
    queryFn: () => getPartners(entityId!),
    enabled: !!entityId,
  });
}

export function useTaxDocuments(entityId: string | null) {
  return useQuery({
    queryKey: ["taxDocuments", entityId],
    queryFn: () => getTaxDocuments(entityId!),
    enabled: !!entityId,
  });
}

export function usePendingTaxDocuments(entityId: string | null) {
  return useQuery({
    queryKey: ["pendingTaxDocuments", entityId],
    queryFn: () => getPendingTaxDocuments(entityId!),
    enabled: !!entityId,
  });
}

export function useRetentions(documentId: string | null) {
  return useQuery({
    queryKey: ["retentions", documentId],
    queryFn: () => getRetentions(documentId!),
    enabled: !!documentId,
  });
}

export function useBankMovements(bankAccountId: string | null) {
  return useQuery({
    queryKey: ["bankMovements", bankAccountId],
    queryFn: () => getBankMovements(bankAccountId!),
    enabled: !!bankAccountId,
  });
}

export function useReconciliations(bankAccountId: string | null) {
  return useQuery({
    queryKey: ["reconciliations", bankAccountId],
    queryFn: () => getReconciliations(bankAccountId!),
    enabled: !!bankAccountId,
  });
}

export function useAuditEvents(entityId: string | null, limit = 50) {
  return useQuery({
    queryKey: ["auditEvents", entityId, limit],
    queryFn: () => getAuditEvents(entityId!, limit),
    enabled: !!entityId,
  });
}

export function useAiDecisions(entityId: string | null) {
  return useQuery({
    queryKey: ["aiDecisions", entityId],
    queryFn: () => getAiDecisions(entityId!),
    enabled: !!entityId,
  });
}

// ─── Ledger Reports ───────────────────────────────────────────────────────

export function useAccountBalance(
  entityId: string | null,
  accountId: string | null,
  date: string | null
) {
  return useQuery({
    queryKey: ["accountBalance", entityId, accountId, date],
    queryFn: () => getAccountBalanceReport(entityId!, accountId!, date!),
    enabled: !!entityId && !!accountId && !!date,
  });
}

export function useSumasSaldos(entityId: string | null, periodId: string | null) {
  return useQuery({
    queryKey: ["sumasSaldos", entityId, periodId],
    queryFn: () => getSumasSaldosReport(entityId!, periodId!),
    enabled: !!entityId && !!periodId,
  });
}

export function useMayorReport(
  entityId: string | null,
  accountId: string | null,
  periodId: string | null
) {
  return useQuery({
    queryKey: ["mayor", entityId, accountId, periodId],
    queryFn: () => getMayorReport(entityId!, accountId!, periodId!),
    enabled: !!entityId && !!accountId && !!periodId,
  });
}

export function useDiarioReport(entityId: string | null, periodId: string | null) {
  return useQuery({
    queryKey: ["diario", entityId, periodId],
    queryFn: () => getDiarioReport(entityId!, periodId!),
    enabled: !!entityId && !!periodId,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────

export function useCreateAsiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAsiento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asientos"] });
      queryClient.invalidateQueries({ queryKey: ["sumasSaldos"] });
      queryClient.invalidateQueries({ queryKey: ["accountBalance"] });
    },
  });
}

export function useReverseAsiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reverseAsiento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asientos"] });
      queryClient.invalidateQueries({ queryKey: ["sumasSaldos"] });
    },
  });
}

export function useAdjustAsiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adjustAsiento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asientos"] });
      queryClient.invalidateQueries({ queryKey: ["sumasSaldos"] });
    },
  });
}

export function useCloseFiscalPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeFiscalPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscalPeriods"] });
      queryClient.invalidateQueries({ queryKey: ["openPeriod"] });
    },
  });
}

export function useReopenFiscalPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reopenFiscalPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscalPeriods"] });
      queryClient.invalidateQueries({ queryKey: ["openPeriod"] });
    },
  });
}

// ─── SIFEN Operations ─────────────────────────────────────────────────────

import {
  uploadSifenXml,
  approveTaxDocument,
  rejectTaxDocument,
  batchApproveTaxDocuments,
  batchRejectTaxDocuments,
  getHechaukaCompras,
  getHechaukaVentas,
  generateHechaukaCsvAction,
  getForm104,
  getForm500,
  getForm120,
  calculateDocumentRetentions,
  saveRetentions,
  getRg90Entries,
  getRg90SummaryAction,
  getTaxCalculatorData,
} from "@/lib/actions";

export function useUploadSifenXml() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadSifenXml,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingTaxDocuments"] });
    },
  });
}

export function useApproveTaxDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveTaxDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingTaxDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["asientos"] });
    },
  });
}

export function useRejectTaxDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectTaxDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingTaxDocuments"] });
    },
  });
}

export function useBatchApproveTaxDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: batchApproveTaxDocuments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingTaxDocuments"] });
    },
  });
}

export function useBatchRejectTaxDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: batchRejectTaxDocuments,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taxDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["pendingTaxDocuments"] });
    },
  });
}

export function useHechaukaCompras(entityId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ["hechaukaCompras", entityId, year, month],
    queryFn: () => getHechaukaCompras(entityId!, year, month),
    enabled: !!entityId,
  });
}

export function useHechaukaVentas(entityId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ["hechaukaVentas", entityId, year, month],
    queryFn: () => getHechaukaVentas(entityId!, year, month),
    enabled: !!entityId,
  });
}

export function useForm104(entityId: string | null, periodId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ["form104", entityId, periodId, year, month],
    queryFn: () => getForm104(entityId!, periodId!, year, month),
    enabled: !!entityId && !!periodId,
  });
}

export function useForm500(entityId: string | null, periodId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ["form500", entityId, periodId, year, month],
    queryFn: () => getForm500(entityId!, periodId!, year, month),
    enabled: !!entityId && !!periodId,
  });
}

export function useRetentionsForDocument(documentId: string | null) {
  return useQuery({
    queryKey: ["documentRetentions", documentId],
    queryFn: () => calculateDocumentRetentions({ entityId: "", documentId: documentId! }),
    enabled: !!documentId,
  });
}

export function useSaveRetentions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveRetentions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentRetentions"] });
      queryClient.invalidateQueries({ queryKey: ["taxDocuments"] });
    },
  });
}

export function useRg90Entries(entityId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ["rg90", entityId, year, month],
    queryFn: () => getRg90Entries(entityId!, year, month),
    enabled: !!entityId,
  });
}

export function useRg90Summary(entityId: string | null, year: number, month: number) {
  return useQuery({
    queryKey: ["rg90summary", entityId, year, month],
    queryFn: () => getRg90SummaryAction(entityId!, year, month),
    enabled: !!entityId,
  });
}

export function useTaxCalculatorData(entityId: string | null, periodId: string | null) {
  return useQuery({
    queryKey: ["taxCalculator", entityId, periodId],
    queryFn: () => getTaxCalculatorData(entityId!, periodId!),
    enabled: !!entityId && !!periodId,
  });
}

// ─── Banking Mutations ────────────────────────────────────────────────────

export function useBankAccounts(entityId: string | null) {
  return useQuery({
    queryKey: ["bankAccounts", entityId],
    queryFn: () => getBankAccounts(entityId!),
    enabled: !!entityId,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBankAccount,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bankAccounts", variables.entityId] });
    },
  });
}

export function useUploadBankCsv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, bankAccountId, csvContent, bankHint }: {
      entityId: string;
      bankAccountId: string;
      csvContent: string;
      bankHint?: string;
    }) => uploadBankCsv(entityId, bankAccountId, csvContent, bankHint),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bankMovements", variables.bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ["bankAccounts", variables.entityId] });
    },
  });
}

export function useMatchBankToGL() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, bankAccountId, tolerance }: {
      entityId: string;
      bankAccountId: string;
      tolerance?: number;
    }) => matchBankToGL(entityId, bankAccountId, tolerance),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations", variables.bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ["bankMovements", variables.bankAccountId] });
    },
  });
}

export function useGlTransactions(entityId: string | null) {
  return useQuery({
    queryKey: ["glTransactions", entityId],
    queryFn: () => getGlTransactionsForEntity(entityId!),
    enabled: !!entityId,
  });
}

export function useConfirmReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, reconciliationId }: { entityId: string; reconciliationId: string }) =>
      confirmReconciliation(entityId, reconciliationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
    },
  });
}

export function useRejectReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, reconciliationId }: { entityId: string; reconciliationId: string }) =>
      rejectReconciliation(entityId, reconciliationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
    },
  });
}

export function useDeleteReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, reconciliationId }: { entityId: string; reconciliationId: string }) =>
      deleteReconciliation(entityId, reconciliationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
    },
  });
}

export function useCreateEntryFromBankMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, bankMovementId, bankAccountId, glAccountId, description }: {
      entityId: string;
      bankMovementId: string;
      bankAccountId: string;
      glAccountId: string;
      description: string;
    }) => createEntryFromBankMovement(entityId, bankMovementId, bankAccountId, glAccountId, description),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bankMovements", variables.bankAccountId] });
      queryClient.invalidateQueries({ queryKey: ["asientos"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliations", variables.bankAccountId] });
    },
  });
}

export function useUploadBankStatementFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, bankAccountId, fileName, fileContent, periodStart, periodEnd }: {
      entityId: string;
      bankAccountId: string;
      fileName: string;
      fileContent: string;
      periodStart: string;
      periodEnd: string;
    }) => uploadBankStatementFile(entityId, bankAccountId, fileName, fileContent, periodStart, periodEnd),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bankAccounts", variables.entityId] });
    },
  });
}
