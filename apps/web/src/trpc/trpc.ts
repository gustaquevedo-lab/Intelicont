import { initTRPC } from "@trpc/server";
import { z } from "zod";

export type Context = {
  entityId?: string;
  userId?: string;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.entityId) {
    // In mock mode, allow without entityId
  }
  return next();
});

export { z };
