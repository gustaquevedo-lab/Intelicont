import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, z } from "../trpc";
import { idempotentProcedure } from "../idempotent";
import { ingestDocument } from "@ledger/src/usecases";
import { getTaxDocuments, getTaxDocument, getPendingTaxDocuments, getTaxDocumentLines } from "@ledger/db/repository";

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
});
