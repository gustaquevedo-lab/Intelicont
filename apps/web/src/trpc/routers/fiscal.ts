import { router, publicProcedure, z } from "../trpc";
import { getFiscalPeriods, getOpenPeriod } from "@ledger/db/repository";
import { getVencimientoIVA, getVencimientoHechauka } from "@intelicont/ledger/fiscal-py";

export const fiscalRouter = router({
  periods: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      return getFiscalPeriods(input.entityId);
    }),

  currentPeriod: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      return getOpenPeriod(input.entityId);
    }),

  vencimientoIva: publicProcedure
    .input(z.object({ year: z.number(), month: z.number(), ruc: z.string() }))
    .query(async ({ input }) => {
      const date = getVencimientoIVA(input.year, input.month, input.ruc);
      return { date: date.toISOString(), label: date.toLocaleDateString("es-PY") };
    }),

  vencimientoHechauka: publicProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const date = getVencimientoHechauka(input.year, input.month);
      return { date: date.toISOString(), label: date.toLocaleDateString("es-PY") };
    }),
});
