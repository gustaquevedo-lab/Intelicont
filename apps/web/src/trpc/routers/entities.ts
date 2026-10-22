import { router, protectedProcedure, z } from "../trpc";
import { getEntities, getEntity } from "@ledger/db/repository";

export const entitiesRouter = router({
  list: protectedProcedure.query(async () => {
    const entities = await getEntities();
    return entities.map((e) => ({
      id: e.id,
      ruc: e.ruc,
      legalName: e.legalName,
      tradeName: e.tradeName,
      taxRegimes: e.taxRegimes,
      baseCurrency: e.baseCurrency,
      status: e.status,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const entity = await getEntity(input.id);
      if (!entity) throw new Error("Entity not found");
      return entity;
    }),
});
