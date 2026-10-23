import { router, protectedProcedure, z } from "../trpc";
import { getFiscalPeriods, getOpenPeriod } from "@ledger/db/repository";
import { getLibroIva } from "@ledger/db/reports";
import { buildForm104 } from "@intelicont/ledger/form104";
import { assertVisible } from "./reports";
import { getVencimientoIVA, getVencimientoHechauka } from "@intelicont/ledger/fiscal-py";

export const fiscalRouter = router({
  periods: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      return getFiscalPeriods(input.entityId);
    }),

  currentPeriod: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      return getOpenPeriod(input.entityId);
    }),

  /** Form 104 summary; built from the same getLibroIva as reports.libroIva so both always agree. */
  form104: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      year: z.number().int().min(2000).max(2100),
      month: z.number().int().min(1).max(12),
    }))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
      const [ventas, compras] = await Promise.all([
        getLibroIva(input.entityId, input.year, input.month, "ventas"),
        getLibroIva(input.entityId, input.year, input.month, "compras"),
      ]);
      return { period: { year: input.year, month: input.month }, ...buildForm104(ventas.totals, compras.totals) };
    }),

  vencimientoIva: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number(), ruc: z.string() }))
    .query(async ({ input }) => {
      const date = getVencimientoIVA(input.year, input.month, input.ruc);
      return { date: date.toISOString(), label: date.toLocaleDateString("es-PY") };
    }),

  vencimientoHechauka: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ input }) => {
      const date = getVencimientoHechauka(input.year, input.month);
      return { date: date.toISOString(), label: date.toLocaleDateString("es-PY") };
    }),
});
