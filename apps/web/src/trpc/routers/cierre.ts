import { router, protectedProcedure, z } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getEntity, validatePeriodChecklist, closeFiscalPeriod, reopenFiscalPeriod, generateClosingJournalEntry } from "@ledger/db/repository";
import { isMockMode } from "@ledger/db/index";

async function assertEntityAccessible(entityId: string) {
  if (isMockMode()) return;
  const entity = await getEntity(entityId);
  if (!entity) throw new TRPCError({ code: "FORBIDDEN", message: "Empresa no accesible" });
}

export const cierreRouter = router({
  validate: protectedProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        year: z.number().int().min(2000).max(2100),
        month: z.number().int().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      await assertEntityAccessible(input.entityId);
      return validatePeriodChecklist(input.entityId, input.year, input.month);
    }),

  closePeriod: protectedProcedure
    .input(
      z.object({
        periodId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ok = await closeFiscalPeriod(input.periodId, ctx.userId);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Período no encontrado" });
      return { success: true };
    }),

  reopenPeriod: protectedProcedure
    .input(
      z.object({
        periodId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      const ok = await reopenFiscalPeriod(input.periodId);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Período no encontrado" });
      return { success: true };
    }),

  generateClosingEntry: protectedProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        periodId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertEntityAccessible(input.entityId);
      const res = await generateClosingJournalEntry(input.entityId, input.periodId, ctx.userId);
      if (!res.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: res.message });
      }
      return res;
    }),
});
