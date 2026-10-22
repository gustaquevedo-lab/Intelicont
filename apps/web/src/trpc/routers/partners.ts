import { router, publicProcedure, z } from "../trpc";
import { getPartners, getPartner } from "@ledger/db/repository";

export const partnersRouter = router({
  list: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      const partners = await getPartners(input.entityId);
      return partners.map((p) => ({
        id: p.id, entityId: p.entityId, kind: p.kind,
        ruc: p.ruc, legalName: p.legalName, tradeName: p.tradeName,
        contacts: p.contacts, defaultPaymentTerms: p.defaultPaymentTerms,
        retentionProfile: p.retentionProfile, country: p.country,
        dvRuc: p.dvRuc, createdAt: p.createdAt, updatedAt: p.updatedAt,
      }));
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const partner = await getPartner(input.id);
      if (!partner) throw new Error("Partner not found");
      return partner;
    }),
});
