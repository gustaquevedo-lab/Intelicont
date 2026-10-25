import { router, protectedProcedure, z } from "../trpc";
import {
  listCopilotConversaciones,
  getCopilotMessages,
  enviarMensajeCopilot,
  deleteCopilotConversation,
} from "@/lib/copilot-service";

export const copilotRouter = router({
  listConversations: protectedProcedure
    .input(z.object({ entityId: z.string().uuid() }))
    .query(async ({ input }) => {
      return listCopilotConversaciones(input.entityId);
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversacionId: z.string().uuid(),
        entityId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      return getCopilotMessages(input.conversacionId, input.entityId);
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        conversacionId: z.string().uuid().optional(),
        mensaje: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId || null;
      return enviarMensajeCopilot({
        entityId: input.entityId,
        conversacionId: input.conversacionId,
        userId,
        mensaje: input.mensaje,
      });
    }),

  deleteConversation: protectedProcedure
    .input(
      z.object({
        conversacionId: z.string().uuid(),
        entityId: z.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      return deleteCopilotConversation(input.conversacionId, input.entityId);
    }),
});
