import { TRPCError } from "@trpc/server";
import { tenantDb } from "@ledger/db/index";
import { IdempotencyConflictError, isIdempotencyKey, requestHash, runIdempotent } from "@ledger/db/idempotency";
import { protectedProcedure } from "./trpc";

/**
 * Mutations (CLAUDE.md rule 8, spec D4): require an `Idempotency-Key` header (UUID) and run the
 * procedure at most once per (user, procedure path, key). Chained after `protectedProcedure`, so it
 * runs inside the request's tenant transaction: the key row commits or rolls back with the work.
 * The hash covers the raw (pre-validation) input.
 */
export const idempotentProcedure = protectedProcedure.use(async ({ ctx, path, getRawInput, next }) => {
  const key = ctx.idempotencyKey;
  if (!isIdempotencyKey(key)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Falta el encabezado Idempotency-Key (UUID)" });
  }
  const hash = requestHash(path, await getRawInput());
  let ran: Awaited<ReturnType<typeof next>> | undefined;
  try {
    const data = await tenantDb((db) =>
      runIdempotent(db, {
        userId: ctx.userId,
        endpoint: path,
        key,
        requestHash: hash,
        run: async () => {
          ran = await next();
          if (!ran.ok) throw ran.error; // rolls back the tenant tx, key row included
          return ran.data;
        },
      }),
    );
    // Replay: the procedure did not run, answer with the stored response.
    return ran ?? ({ ok: true, data, marker: undefined } as unknown as Awaited<ReturnType<typeof next>>);
  } catch (err) {
    if (err instanceof IdempotencyConflictError) throw new TRPCError({ code: "UNPROCESSABLE_CONTENT", message: err.message });
    throw err;
  }
});
