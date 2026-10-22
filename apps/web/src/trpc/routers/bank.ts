import { router, protectedProcedure, z } from "../trpc";
import { getBankMovements, getReconciliations } from "@ledger/db/repository";

export const bankRouter = router({
  movements: protectedProcedure
    .input(z.object({ bankAccountId: z.string() }))
    .query(async ({ input }) => {
      const movements = await getBankMovements(input.bankAccountId);
      return movements;
    }),

  reconciliations: protectedProcedure
    .input(z.object({ bankAccountId: z.string() }))
    .query(async ({ input }) => {
      const recs = await getReconciliations(input.bankAccountId);
      return recs;
    }),
});
