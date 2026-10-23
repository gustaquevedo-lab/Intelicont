import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, z } from "../trpc";
import { getEntity } from "@ledger/db/repository";
import { getDiario, getMayor, getSumasSaldos, getLibroIva } from "@ledger/db/reports";
import { isMockMode } from "@ledger/db/index";
import { isCalendarDate, CALENDAR_DATE_ERROR } from "@/lib/calendar-date";

const day = z.string().refine(isCalendarDate, CALENDAR_DATE_ERROR);
const range = { entityId: z.string().uuid(), from: day, to: day };

/** RLS already hides other tenants; this turns "invisible entity" into an explicit FORBIDDEN (no empty-looking book). */
export async function assertVisible(entityId: string) {
  if (isMockMode()) return;
  if (!(await getEntity(entityId))) throw new TRPCError({ code: "FORBIDDEN", message: "Empresa no accesible" });
}

export const reportsRouter = router({
  diario: protectedProcedure
    .input(z.object({ ...range, limit: z.number().int().min(1).max(2000).default(500), offset: z.number().int().min(0).default(0) }))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
      return getDiario(input.entityId, input.from, input.to, input.limit, input.offset);
    }),

  mayor: protectedProcedure
    .input(z.object({ ...range, accountId: z.string().uuid() }))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
      const r = await getMayor(input.entityId, input.accountId, input.from, input.to);
      if (!r.account && !isMockMode()) throw new TRPCError({ code: "NOT_FOUND", message: "Cuenta no encontrada" });
      return r;
    }),

  sumasSaldos: protectedProcedure
    .input(z.object(range))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
      return getSumasSaldos(input.entityId, input.from, input.to);
    }),

  libroIva: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      year: z.number().int().min(2000).max(2100),
      month: z.number().int().min(1).max(12),
      side: z.enum(["compras", "ventas"]),
    }))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
      return getLibroIva(input.entityId, input.year, input.month, input.side);
    }),
});
