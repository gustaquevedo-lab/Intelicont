import { router, protectedProcedure, z } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getJournalEntries, getJournalEntry, getJournalLines, type JournalEntryRow } from "@ledger/db/repository";
import { postEntry, reverseEntry } from "@ledger/src/usecases";
import { isMockMode } from "@ledger/db/index";

/** `reversed` is derived (D10): the DB row stays `posted`, a counter-entry points at it. */
const uiStatus = (e: JournalEntryRow) => (e.reversedBy ? ("reversed" as const) : e.status);

export const journalEntriesRouter = router({
  list: protectedProcedure
    .input(z.object({ entityId: z.string(), limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const entries = await getJournalEntries(input.entityId);
      return entries.slice(0, input.limit).map((e) => ({
        id: e.id,
        entityId: e.entityId,
        periodId: e.periodId,
        date: e.date,
        number: e.number,
        source: e.source,
        sourceRef: e.sourceRef,
        description: e.description,
        status: uiStatus(e),
        reversedBy: e.reversedBy,
        postedAt: e.postedAt,
        reversalOf: e.reversalOf,
        versionOf: e.versionOf,
        metadata: e.metadata,
        createdAt: e.createdAt,
      }));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const entry = await getJournalEntry(input.id);
      if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Asiento no encontrado" });
      const lines = await getJournalLines(input.id);
      return { ...entry, status: uiStatus(entry), lines };
    }),

  getLines: protectedProcedure
    .input(z.object({ entryId: z.string() }))
    .query(async ({ input }) => {
      const lines = await getJournalLines(input.entryId);
      return lines.map((l) => ({
        id: l.id,
        entryId: l.entryId,
        accountId: l.accountId,
        debit: l.debit,
        credit: l.credit,
        currencyCode: l.currencyCode,
        description: l.description,
        partnerId: l.partnerId,
        costCenterId: l.costCenterId,
        taxDocumentId: l.taxDocumentId,
      }));
    }),

  create: protectedProcedure
    .input(z.object({
      entityId: z.string(),
      periodId: z.string(),
      date: z.string(),
      number: z.string().optional(),
      source: z.string().optional(),
      description: z.string().optional(),
      lineas: z.array(z.object({
        accountId: z.string(),
        debit: z.number().int().nonnegative().refine(Number.isSafeInteger),
        credit: z.number().int().nonnegative().refine(Number.isSafeInteger),
        currencyCode: z.string().default("PYG"),
        description: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const totalDebit = input.lineas.reduce((s, l) => s + l.debit, 0);
      const totalCredit = input.lineas.reduce((s, l) => s + l.credit, 0);
      if (totalDebit !== totalCredit) {
        throw new Error("El asiento no esta balanceado");
      }

      if (isMockMode()) {
        return { success: true, id: "mock-je-" + Math.random().toString(36).slice(2, 10) };
      }

      const res = await postEntry({
        entityId: input.entityId,
        periodId: input.periodId,
        date: new Date(input.date),
        number: input.number || `JE-${Date.now().toString(36).slice(-6).toUpperCase()}`,
        source: input.source as any,
        description: input.description,
        lines: input.lineas,
      });
      if (!res.ok) throw new TRPCError({ code: "BAD_REQUEST", message: res.error });

      return { success: true, id: res.value.id };
    }),

  reverse: protectedProcedure
    .input(z.object({ entryId: z.string().uuid(), reason: z.string().trim().min(3, "El motivo es obligatorio") }))
    .mutation(async ({ input }) => {
      if (isMockMode()) return { success: true, id: "mock-rev-" + Math.random().toString(36).slice(2, 10) };
      const res = await reverseEntry(input.entryId, input.reason);
      if (!res.ok) {
        const code = res.error === "Asiento no encontrado" ? "NOT_FOUND" : res.error === "El asiento ya fue revertido" ? "CONFLICT" : "BAD_REQUEST";
        throw new TRPCError({ code, message: res.error });
      }
      return { success: true, id: res.value.id };
    }),
});
