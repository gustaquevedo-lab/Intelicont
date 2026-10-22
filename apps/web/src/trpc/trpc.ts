import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { withTenant } from "@ledger/db/index";
import { loadGuardUser, needs2FA } from "@/lib/auth-guard";

/** Identity comes only from the verified session (see api/trpc route), never from input. */
export type Context = {
  userId?: string;
  requestId: string;
  /** `Idempotency-Key` request header; required by `idempotentProcedure` (see ./idempotent.ts). */
  idempotencyKey?: string;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
/**
 * Every authenticated procedure runs inside `withTenant(ctx.userId)`: one transaction scoped to
 * the user's memberships, so routers cannot forget the tenant scope (repository code uses
 * `tenantDb`). Admins without TOTP are rejected here too, not only by the page guard.
 * A failed procedure rethrows so the transaction rolls back instead of committing.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const userId = ctx.userId;
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return withTenant(userId, async (db) => {
    if (needs2FA(await loadGuardUser(db, userId))) {
      throw new TRPCError({ code: "FORBIDDEN", message: "2FA requerido" });
    }
    const result = await next({ ctx: { ...ctx, userId } });
    if (!result.ok) throw result.error;
    return result;
  });
});

export { z };
