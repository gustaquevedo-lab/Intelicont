import { router, protectedProcedure, z } from "../trpc";
import { TRPCError } from "@trpc/server";
import { getEntity } from "@ledger/db/repository";
import { isMockMode } from "@ledger/db/index";
import { ejecutarAgenteContable } from "@/lib/agent/agent-service";
import { buscarNormativas } from "@/lib/agent/rag-service";
import { calcularVencimientosRuc } from "@/lib/agent/tools";

async function assertEntityAccessible(entityId: string) {
  if (isMockMode()) return;
  const entity = await getEntity(entityId);
  if (!entity) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Empresa no accesible o no autorizada.",
    });
  }
}

export const agentRouter = router({
  chat: protectedProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(4000),
          })
        ).min(1),
        contextPath: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertEntityAccessible(input.entityId);

      try {
        const result = await ejecutarAgenteContable({
          entityId: input.entityId,
          userId: ctx.userId,
          messages: input.messages,
          contextPath: input.contextPath,
        });

        return {
          reply: result.reply,
          toolsExecuted: result.toolsExecuted.map((t) => ({
            toolName: t.toolName,
            success: t.success,
            output: t.output,
          })),
          model: result.model,
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: errorMsg,
        });
      }
    }),

  normativas: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(10).optional().default(3),
        categoria: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return buscarNormativas(input.query, input.limit, input.categoria);
    }),

  vencimientos: protectedProcedure
    .input(z.object({ entityId: z.string().uuid() }))
    .query(async ({ input }) => {
      await assertEntityAccessible(input.entityId);
      const entity = await getEntity(input.entityId);
      if (!entity) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa no encontrada" });
      const dueDates = calcularVencimientosRuc(entity.ruc);
      return {
        ruc: entity.ruc,
        legalName: entity.legalName,
        ...dueDates,
      };
    }),
});
