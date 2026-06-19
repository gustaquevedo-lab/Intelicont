import { router, publicProcedure, z } from "../trpc";
import { getBankMovements, getReconciliations } from "@ledger/db/repository";

export const bankRouter = router({
  movements: publicProcedure
    .input(z.object({ bankAccountId: z.string() }))
    .query(async ({ input }) => {
      const movements = await getBankMovements(input.bankAccountId);
      return movements;
    }),

  reconciliations: publicProcedure
    .input(z.object({ bankAccountId: z.string() }))
    .query(async ({ input }) => {
      const recs = await getReconciliations(input.bankAccountId);
      return recs;
    }),
});
