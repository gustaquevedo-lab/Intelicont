import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { withTenant } from "@ledger/db/index";
import { loadGuardUser, needs2FA } from "@/lib/auth-guard";
import { logger } from "@/lib/logger";

/** Identity comes only from the verified session (see api/trpc route), never from input. */
export type Context = {
  userId?: string;
  requestId: string;
  /** `Idempotency-Key` request header; required by `idempotentProcedure` (see ./idempotent.ts). */
  idempotencyKey?: string;
};

const t = initTRPC.context<Context>().create();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WARN_CODES = new Set([
  "BAD_REQUEST", "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "UNPROCESSABLE_CONTENT", "TOO_MANY_REQUESTS",
]);

/**
 * One log line per call (requestId/userId/entityId/path/type/durationMs). Input VALUES are never
 * logged (they carry XML, RUCs, passwords): only `entityId`, when the raw input has a UUID one.
 * Attached at the base so it wraps every other middleware and never alters the result or the error.
 */
const logging = t.middleware(async ({ ctx, path, type, getRawInput, next }) => {
  const start = performance.now();
  const result = await next();
  let entityId: string | undefined;
  try {
    const raw = (await getRawInput()) as { entityId?: unknown } | null | undefined;
    if (raw && typeof raw === "object" && typeof raw.entityId === "string" && UUID.test(raw.entityId)) entityId = raw.entityId;
  } catch { /* no usable input */ }
  const line = { requestId: ctx.requestId, userId: ctx.userId, entityId, path, type, durationMs: Math.round(performance.now() - start) };
  if (result.ok) {
    logger.info({ ...line, ok: true }, "trpc");
  } else {
    const err = result.error;
    // Only unexpected errors (wrapped as INTERNAL_SERVER_ERROR) expose their cause; 4xx messages are ours.
    const cause = err.code === "INTERNAL_SERVER_ERROR" && err.cause instanceof Error ? err.cause : undefined;
    const origin = cause ?? err; // unexpected errors arrive wrapped in an INTERNAL_SERVER_ERROR TRPCError
    logger[WARN_CODES.has(err.code) ? "warn" : "error"](
      {
        ...line,
        ok: false,
        code: err.code,
        errorMessage: origin.message,
        ...(cause && { errName: cause.name }),
        ...(cause && process.env.NODE_ENV !== "production" && { stack: cause.stack }),
      },
      "trpc",
    );
  }
  return result;
});

const base = t.procedure.use(logging);

export const router = t.router;
export const publicProcedure = base;
/**
 * Every authenticated procedure runs inside `withTenant(ctx.userId)`: one transaction scoped to
 * the user's memberships, so routers cannot forget the tenant scope (repository code uses
 * `tenantDb`). Admins without TOTP are rejected here too, not only by the page guard.
 * A failed procedure rethrows so the transaction rolls back instead of committing.
 */
export const protectedProcedure = base.use(async ({ ctx, next }) => {
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

/**
 * Same identity + 2FA rule as `protectedProcedure`, but the guard runs in a SHORT `withTenant`
 * that ends before the handler, and there is NO ambient transaction. For procedures that call
 * slow external services (e.g. the local LLM): the handler opens its own short
 * `withTenant(ctx.userId, …)` blocks and must NEVER do I/O (HTTP, files, sleeps) inside one, so no
 * DB connection is held in a transaction while waiting.
 */
export const authedProcedure = base.use(async ({ ctx, next }) => {
  const userId = ctx.userId;
  if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  const guard = await withTenant(userId, (db) => loadGuardUser(db, userId));
  if (needs2FA(guard)) throw new TRPCError({ code: "FORBIDDEN", message: "2FA requerido" });
  return next({ ctx: { ...ctx, userId } });
});

export { z };
