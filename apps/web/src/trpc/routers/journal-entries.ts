import { router, protectedProcedure, z } from "../trpc";
import { idempotentProcedure } from "../idempotent";
import { TRPCError } from "@trpc/server";
import { getFiscalPeriods, getJournalEntries, getJournalEntry, getJournalLines, type JournalEntryRow } from "@ledger/db/repository";
import { postEntry, reverseEntry } from "@ledger/src/usecases";
import { isMockMode, tenantDb } from "@ledger/db/index";
import * as schema from "@ledger/db/schema";
import { and, asc, desc, eq, getTableColumns, gte, lt, sql } from "drizzle-orm";
import { isCalendarDate, CALENDAR_DATE_ERROR } from "@/lib/calendar-date";

/** `reversed` is derived (D10): the DB row stays `posted`, a counter-entry points at it. */
const uiStatus = (e: JournalEntryRow) => (e.reversedBy ? ("reversed" as const) : e.status);

export const journalEntriesRouter = router({
  list: protectedProcedure
    .input(z.object({ entityId: z.string(), limit: z.number().int().min(1).max(500).optional().default(50), offset: z.number().int().min(0).optional().default(0) }))
    .query(async ({ input }) => {
      const entries = await getJournalEntries(input.entityId);
      return entries.slice(input.offset, input.offset + input.limit).map((e) => ({
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
        total: Number(e.total),
        postedAt: e.postedAt,
        reversalOf: e.reversalOf,
        versionOf: e.versionOf,
        metadata: e.metadata,
        createdAt: e.createdAt,
      }));
    }),

  /** Entries of the entity; with `year`+`month` only those dated in that calendar month (dates are stored as UTC midnight of the Asunción day). */
  count: protectedProcedure
    .input(z.object({ entityId: z.string().uuid(), year: z.number().int().min(2000).max(2100).optional(), month: z.number().int().min(1).max(12).optional() }))
    .query(async ({ input }) => {
      const monthly = input.year !== undefined && input.month !== undefined;
      const from = monthly ? new Date(Date.UTC(input.year!, input.month! - 1, 1)) : null;
      const to = monthly ? new Date(Date.UTC(input.year!, input.month!, 1)) : null;
      if (isMockMode()) {
        const rows = await getJournalEntries(input.entityId);
        return { total: from && to ? rows.filter((r) => r.date >= from && r.date < to).length : rows.length };
      }
      const j = schema.journalEntries;
      const [{ total }] = await tenantDb((db) =>
        db.select({ total: sql<number>`count(*)::int` }).from(j)
          .where(from && to ? and(eq(j.entityId, input.entityId), gte(j.date, from), lt(j.date, to)) : eq(j.entityId, input.entityId)));
      return { total };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const entry = await getJournalEntry(input.id);
      if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Asiento no encontrado" });
      if (isMockMode()) return { ...entry, status: uiStatus(entry), lines: (await getJournalLines(input.id)).map((l) => ({ ...l, accountCode: "", accountName: "" })), document: null };
      const { lines, document } = await tenantDb(async (db) => {
        const lines = await db.select({ ...getTableColumns(schema.journalLines), accountCode: schema.accounts.code, accountName: schema.accounts.name })
          .from(schema.journalLines)
          .innerJoin(schema.accounts, eq(schema.accounts.id, schema.journalLines.accountId))
          .where(eq(schema.journalLines.entryId, input.id))
          .orderBy(desc(schema.journalLines.debit), asc(schema.accounts.code));
        const [document = null] = await db.select({ id: schema.taxDocuments.id, number: schema.taxDocuments.number, cdc: schema.taxDocuments.cdc, issueDate: schema.taxDocuments.issueDate, direction: schema.taxDocuments.direction })
          .from(schema.taxDocuments).where(eq(schema.taxDocuments.journalEntryId, input.id)).limit(1);
        return { lines, document };
      });
      return { ...entry, status: uiStatus(entry), lines, document };
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

  create: idempotentProcedure
    .input(z.object({
      entityId: z.string(),
      periodId: z.string(),
      date: z.string().refine(isCalendarDate, CALENDAR_DATE_ERROR),
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

      // Checked here, not in postEntry: reversals are dated today whatever the period of the original.
      const period = (await getFiscalPeriods(input.entityId)).find((p) => p.id === input.periodId);
      if (!period) throw new TRPCError({ code: "BAD_REQUEST", message: "Período no encontrado" });
      if (input.date.slice(0, 7) !== `${period.year}-${String(period.month).padStart(2, "0")}`) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La fecha no corresponde al período" });
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

  reverse: idempotentProcedure
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
