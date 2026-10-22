import { router, publicProcedure, z } from "../trpc";
import { getTaxDocuments, getTaxDocument, getPendingTaxDocuments, getTaxDocumentLines } from "@ledger/db/repository";

export const taxDocumentsRouter = router({
  list: publicProcedure
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
      }));
    }),

  pending: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      const docs = await getPendingTaxDocuments(input.entityId);
      return docs;
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const doc = await getTaxDocument(input.id);
      if (!doc) throw new Error("Tax document not found");
      return doc;
    }),

  getLines: publicProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input }) => {
      return getTaxDocumentLines(input.documentId);
    }),
});
