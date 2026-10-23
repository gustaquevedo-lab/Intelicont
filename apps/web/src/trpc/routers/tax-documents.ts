import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import type { SifenDocument } from "@intelicont/ledger/sifen";
import { router, protectedProcedure, authedProcedure, z } from "../trpc";
import { idempotentProcedure } from "../idempotent";
import { ingestDocument, postEntry } from "@ledger/src/usecases";
import { getTaxDocuments, getTaxDocument, getPendingTaxDocuments, getTaxDocumentLines } from "@ledger/db/repository";
import { tenantDb, withTenant, type Db } from "@ledger/db/index";
import { audited } from "@ledger/db/audit";
import * as schema from "@ledger/db/schema";
import { suggestForDocument, type AccountRef, type Suggestion } from "@/lib/ai-provider";

const KIND = "journal_suggestion";
type SuggestResult = { decisionId: string; suggestion: Suggestion };
const DOC_LABEL: Record<string, string> = {
  invoice: "Factura", credit_note: "Nota de crédito", debit_note: "Nota de débito", self_invoice: "Autofactura", remito: "Remito",
};

/** Under RLS: a document of an entity the user cannot see is simply not found. */
async function loadDocument(db: Db, id: string, lock = false) {
  const q = db.select().from(schema.taxDocuments).where(eq(schema.taxDocuments.id, id));
  const [doc] = await (lock ? q.for("update") : q);
  if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Comprobante no encontrado" });
  return doc;
}

/**
 * A rejection is recorded only as an `ai_decision.rejected` audit event (the decision row stays
 * `accepted=false`, append-only). Column refs are written qualified on purpose: Drizzle renders
 * them unqualified, which would bind to audit_events inside the subquery.
 */
const notRejected = sql`not exists (select 1 from audit_events e
  where e.action = 'ai_decision.rejected' and e.target_id = "ai_decisions"."id")`;

/** The latest pending (not accepted, not rejected) suggestion for a document. */
async function findPending(db: Db, entityId: string, documentId: string): Promise<SuggestResult | undefined> {
  const [pending] = await db.select().from(schema.aiDecisions)
    .where(and(
      eq(schema.aiDecisions.entityId, entityId),
      eq(schema.aiDecisions.kind, KIND),
      eq(schema.aiDecisions.accepted, false),
      sql`${schema.aiDecisions.input}->>'documentId' = ${documentId}`,
      notRejected,
    ))
    .orderBy(desc(schema.aiDecisions.createdAt))
    .limit(1);
  return pending && { decisionId: pending.id, suggestion: pending.output as Suggestion };
}

async function isRejected(db: Db, decisionId: string) {
  const rows = await db.select({ id: schema.auditEvents.id }).from(schema.auditEvents)
    .where(and(eq(schema.auditEvents.action, "ai_decision.rejected"), eq(schema.auditEvents.targetId, decisionId)));
  return rows.length > 0;
}

async function loadDecision(db: Db, decisionId: string) {
  const [decision] = await db.select().from(schema.aiDecisions)
    .where(and(eq(schema.aiDecisions.id, decisionId), eq(schema.aiDecisions.kind, KIND)));
  if (!decision) throw new TRPCError({ code: "NOT_FOUND", message: "Sugerencia no encontrada" });
  return decision;
}

const money = z.number().int().nonnegative().refine(Number.isSafeInteger);

/**
 * One in-flight provider call per document in this process: concurrent callers (double click, two
 * tabs) share the same promise and therefore the same decision. Each caller still runs phase 1
 * (visibility under RLS) before joining.
 */
const inFlight = new Map<string, Promise<SuggestResult>>();
const REFRESH_COOLDOWN_MS = 30_000;

export const taxDocumentsRouter = router({
  list: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      const docs = await getTaxDocuments(input.entityId);
      return docs.map((d) => ({
        id: d.id, entityId: d.entityId, direction: d.direction, docType: d.docType,
        number: d.number, timbrado: d.timbrado, cdc: d.cdc,
        issueDate: d.issueDate, partnerId: d.partnerId,
        currencyCode: d.currencyCode, condition: d.condition,
        status: d.status, sifenStatus: d.sifenStatus,
        gravado10: d.gravado10, gravado5: d.gravado5, exento: d.exento,
        iva10: d.iva10, iva5: d.iva5, total: d.total,
        journalEntryId: d.journalEntryId, metadata: d.metadata,
        uploadedAt: d.uploadedAt, processedAt: d.processedAt,
        docCode: d.docCode, isElectronic: d.isElectronic, counterpartyIdType: d.counterpartyIdType,
      }));
    }),

  pending: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      const docs = await getPendingTaxDocuments(input.entityId);
      return docs;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const doc = await getTaxDocument(input.id);
      if (!doc) throw new Error("Tax document not found");
      return doc;
    }),

  getLines: protectedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input }) => {
      return getTaxDocumentLines(input.documentId);
    }),

  /** Stores a SIFEN XML as a pending document. Warnings are returned, not persisted. */
  ingestXml: idempotentProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      direction: z.enum(["received", "issued"]).default("received"),
      xml: z.string().min(1).max(2_000_000),
    }))
    .mutation(async ({ input }) => {
      const res = await ingestDocument(input.entityId, input.direction, input.xml);
      if (!res.ok) throw new TRPCError({ code: "BAD_REQUEST", message: res.error });
      return res.value;
    }),

  /**
   * Proposes a journal entry for a pending document (never posts). Two phases around the provider
   * call so no transaction is open while the local model thinks: short read tx, provider call
   * with no tx, short write tx. Returns the pending suggestion if one exists (unless `refresh`).
   */
  suggestEntry: authedProcedure
    .input(z.object({ documentId: z.string().uuid(), refresh: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      // Phase 1: read.
      const loaded = await withTenant(userId, async (db) => {
        const doc = await loadDocument(db, input.documentId);
        if (doc.journalEntryId) throw new TRPCError({ code: "CONFLICT", message: "El comprobante ya fue contabilizado" });
        const sifen = (doc.metadata as { sifen?: SifenDocument } | null)?.sifen;
        if (!sifen) throw new TRPCError({ code: "BAD_REQUEST", message: "El comprobante no tiene datos para sugerir" });
        if (input.refresh) {
          const [latest] = await db.select({ createdAt: schema.aiDecisions.createdAt }).from(schema.aiDecisions)
            .where(and(eq(schema.aiDecisions.entityId, doc.entityId), eq(schema.aiDecisions.kind, KIND), sql`${schema.aiDecisions.input}->>'documentId' = ${doc.id}`))
            .orderBy(desc(schema.aiDecisions.createdAt))
            .limit(1);
          if (latest?.createdAt && Date.now() - latest.createdAt.getTime() < REFRESH_COOLDOWN_MS) {
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Esperá unos segundos antes de volver a sugerir" });
          }
        } else {
          const pending = await findPending(db, doc.entityId, doc.id);
          if (pending) return { pending };
        }
        const rows = await db.select({
          id: schema.accounts.id, code: schema.accounts.code, name: schema.accounts.name,
          nature: schema.accounts.nature, allowsPosting: schema.accounts.allowsPosting,
        })
          .from(schema.accounts)
          .innerJoin(schema.chartOfAccounts, eq(schema.accounts.coaId, schema.chartOfAccounts.id))
          .where(and(eq(schema.chartOfAccounts.entityId, doc.entityId), eq(schema.accounts.allowsPosting, true)))
          .orderBy(schema.accounts.code);
        const accounts: AccountRef[] = rows.map((a) => ({ ...a, nature: String(a.nature), allowsPosting: a.allowsPosting ?? false }));
        return { doc, sifen, accounts };
      });
      if ("pending" in loaded) return loaded.pending!;
      const { doc, sifen, accounts } = loaded;
      const running = inFlight.get(doc.id);
      if (running) return running;
      const run = (async (): Promise<SuggestResult> => {
        // Phase 2: provider call, outside any transaction (may take seconds; never throws for Ollama).
        const suggestion = await suggestForDocument(sifen, accounts, doc.direction);

        // Phase 3: write. The row lock serializes writers (also across processes): a suggestion
        // stored meanwhile by someone else is returned instead of inserting a second one.
        return withTenant(userId, async (db) => {
          const fresh = await loadDocument(db, doc.id, true);
          if (fresh.journalEntryId) throw new TRPCError({ code: "CONFLICT", message: "El comprobante ya fue contabilizado" });
          if (!input.refresh) {
            const pending = await findPending(db, doc.entityId, doc.id);
            if (pending) return pending;
          }
          const decisionId = await audited(
            db,
            {
              entityId: doc.entityId, action: "ai_decision.created", targetType: "ai_decision",
              targetId: (id: string) => id,
              after: { documentId: doc.id, provider: suggestion.provider, confidence: suggestion.confidence, fallbackReason: suggestion.fallbackReason },
            },
            async () => {
              const [row] = await db.insert(schema.aiDecisions).values({
                entityId: doc.entityId,
                kind: KIND,
                input: { documentId: doc.id, cdc: sifen.cdc, provider: suggestion.provider },
                output: suggestion,
                confidence: Math.round(suggestion.confidence * 100),
                accepted: false,
              }).returning({ id: schema.aiDecisions.id });
              return row.id;
            },
          );
          return { decisionId, suggestion };
        });
      })();
      inFlight.set(doc.id, run);
      try {
        return await run;
      } finally {
        inFlight.delete(doc.id);
      }
    }),

  /**
   * Human approval: posts the suggested (or human-edited) lines and links the document, all in the
   * request transaction (no I/O here), so a failed posting leaves the document and decision pending.
   */
  approveEntry: idempotentProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      decisionId: z.string().uuid(),
      lines: z.array(z.object({
        accountId: z.string().uuid(),
        debit: money,
        credit: money,
        description: z.string().max(500).default(""),
      })).min(2).optional(),
    }))
    .mutation(async ({ ctx, input }) => tenantDb(async (db) => {
      // Row lock: a concurrent approval (another tab, another key) waits here and then sees the link.
      const doc = await loadDocument(db, input.documentId, true);
      if (doc.journalEntryId) throw new TRPCError({ code: "CONFLICT", message: "El comprobante ya fue contabilizado" });
      const sifenType = (doc.metadata as { sifen?: SifenDocument } | null)?.sifen?.docType;
      if (doc.docType === "remito" || sifenType === "remito") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Un remito no genera asiento" });
      }
      const decision = await loadDecision(db, input.decisionId);
      if (decision.entityId !== doc.entityId || (decision.input as { documentId?: string } | null)?.documentId !== doc.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sugerencia no encontrada" });
      }
      if (await isRejected(db, decision.id)) throw new TRPCError({ code: "BAD_REQUEST", message: "La sugerencia fue rechazada" });
      const suggestion = decision.output as Suggestion;
      // A human may change accounts (and descriptions), never amounts.
      if (input.lines && (input.lines.length !== suggestion.lines.length
        || input.lines.some((l, i) => l.debit !== suggestion.lines[i].debit || l.credit !== suggestion.lines[i].credit))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Solo se pueden cambiar las cuentas" });
      }
      const chosen = input.lines ?? suggestion.lines;
      if (chosen.length < 2 || chosen.some((l) => !l.accountId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Elegí una cuenta para cada línea" });
      }
      const lines = chosen.map(({ accountId, debit, credit, description }) => ({ accountId: accountId!, debit, credit, description }));
      if (lines.reduce((s, l) => s + l.debit - l.credit, 0) !== 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "El asiento no está balanceado" });
      }

      const [year, month] = doc.issueDate.split("-").map(Number);
      const [period] = await db.select({ id: schema.fiscalPeriods.id }).from(schema.fiscalPeriods).where(and(
        eq(schema.fiscalPeriods.entityId, doc.entityId),
        eq(schema.fiscalPeriods.year, year),
        eq(schema.fiscalPeriods.month, month),
        eq(schema.fiscalPeriods.status, "open"),
      ));
      if (!period) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `No hay período abierto para ${String(month).padStart(2, "0")}/${year}` });
      }

      const issuer = (doc.metadata as { sifen?: SifenDocument } | null)?.sifen?.issuer.name;
      const res = await postEntry({
        entityId: doc.entityId,
        periodId: period.id,
        date: new Date(doc.issueDate),
        number: `AS-${doc.number}`,
        source: "sifen",
        sourceRef: doc.cdc ?? doc.number,
        description: `${DOC_LABEL[doc.docType] ?? "Comprobante"} ${doc.number}${issuer ? ` — ${issuer}` : ""}`,
        lines: lines.map((l) => ({ ...l, currencyCode: doc.currencyCode ?? "PYG", taxDocumentId: doc.id })),
      });
      if (!res.ok) throw new TRPCError({ code: "BAD_REQUEST", message: res.error });
      const entry = res.value;

      await audited(
        db,
        {
          entityId: doc.entityId, action: "ai_decision.accepted", targetType: "ai_decision", targetId: decision.id,
          before: { lines: suggestion.lines },
          after: { journalEntryId: entry.id, edited: !!input.lines, ...(input.lines && { lines: input.lines }) },
        },
        async () => {
          await db.update(schema.taxDocuments)
            .set({ journalEntryId: entry.id, status: "posted", processedAt: new Date() })
            .where(eq(schema.taxDocuments.id, doc.id));
          await db.update(schema.aiDecisions)
            .set({ accepted: true, acceptedBy: ctx.userId })
            .where(eq(schema.aiDecisions.id, decision.id));
        },
      );
      return { journalEntryId: entry.id, number: entry.number ?? `AS-${doc.number}` };
    })),

  /** The document stays pending; the decision stays `accepted=false`; the reason is audited. */
  rejectSuggestion: idempotentProcedure
    .input(z.object({ decisionId: z.string().uuid(), reason: z.string().trim().min(3, "El motivo es obligatorio").max(500) }))
    .mutation(async ({ input }) => tenantDb(async (db) => {
      const decision = await loadDecision(db, input.decisionId);
      if (decision.accepted) throw new TRPCError({ code: "BAD_REQUEST", message: "La sugerencia ya fue aprobada" });
      if (await isRejected(db, decision.id)) throw new TRPCError({ code: "CONFLICT", message: "La sugerencia ya fue rechazada" });
      await audited(
        db,
        {
          entityId: decision.entityId, action: "ai_decision.rejected", targetType: "ai_decision", targetId: decision.id,
          before: { documentId: (decision.input as { documentId?: string } | null)?.documentId }, reason: input.reason,
        },
        async () => undefined,
      );
      return { ok: true as const };
    })),
});
