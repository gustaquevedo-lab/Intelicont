import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

/** Identity comes only from the verified session (see api/trpc route), never from input. */
export type Context = {
  userId?: string;
  requestId: string;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export { z };
