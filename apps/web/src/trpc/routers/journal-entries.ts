import { router, protectedProcedure, z } from "../trpc";
import { getJournalEntries, getJournalLines, createPostedEntry } from "@ledger/db/repository";
import { isMockMode } from "@ledger/db/index";

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
        status: e.status,
        postedAt: e.postedAt,
        reversalOf: e.reversalOf,
        versionOf: e.versionOf,
        metadata: e.metadata,
        createdAt: e.createdAt,
      }));
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const entries = await getJournalEntries("");
      const entry = entries.find((e) => e.id === input.id);
      if (!entry) throw new Error("Journal entry not found");
      const lines = await getJournalLines(input.id);
      return { ...entry, lines };
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

      const entry = await createPostedEntry({
        entityId: input.entityId,
        periodId: input.periodId,
        date: new Date(input.date),
        number: input.number || `JE-${Date.now().toString(36).slice(-6).toUpperCase()}`,
        source: input.source as any,
        description: input.description,
        lines: input.lineas,
      });

      return { success: true, id: entry.id };
    }),

  reverse: protectedProcedure
    .input(z.object({ entryId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      return { success: true, id: "rev-" + Math.random().toString(36).slice(2, 10) };
    }),
});
