import { router, protectedProcedure, z } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getEntity, getFXTransactions, createFXAdjustmentEntry } from "@ledger/db/repository";
import { isMockMode } from "@ledger/db/index";
import { getExchangeRates, calcularDiferenciaCambio } from "@/lib/fx/dolarpy-service";

async function assertEntityAccessible(entityId: string) {
  if (isMockMode()) return;
  const entity = await getEntity(entityId);
  if (!entity) throw new TRPCError({ code: "FORBIDDEN", message: "Empresa no accesible" });
}

export const multimonedaRouter = router({
  tasas: protectedProcedure.query(async () => {
    return getExchangeRates();
  }),

  transacciones: protectedProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      await assertEntityAccessible(input.entityId);
      return getFXTransactions(input.entityId);
    }),

  calcularDiferencia: protectedProcedure
    .input(
      z.object({
        moneda: z.string(),
        montoME: z.number().positive(),
        tasaOrigen: z.number().positive(),
        tasaCierre: z.number().positive(),
        esActivo: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      return calcularDiferenciaCambio(input);
    }),

  generarAjuste: protectedProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        currencyCode: z.string().min(3).max(3),
        amountME: z.number().positive(),
        fxRateCurrent: z.number().positive(),
        diffAmountPYG: z.number().positive(),
        isGain: z.boolean(),
        periodId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await assertEntityAccessible(input.entityId);
      const res = await createFXAdjustmentEntry(input.entityId, input);
      if (!res.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: res.message });
      }
      return res;
    }),
});
