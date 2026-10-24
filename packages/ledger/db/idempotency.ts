import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { Db } from "./index";

/** Same Idempotency-Key reused with a different request body. */
export class IdempotencyConflictError extends Error {
  constructor() {
    super("Idempotency-Key reutilizada con otro cuerpo");
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isIdempotencyKey = (key: unknown): key is string => typeof key === "string" && UUID.test(key);

/** JSON with object keys sorted recursively, so the hash does not depend on key order. */
function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, (v as Record<string, unknown>)[k]]))
      : v,
  ) ?? "null";
}

export const requestHash = (endpoint: string, input: unknown) =>
  createHash("sha256").update(`${endpoint}\n${canonicalJson(input)}`).digest("hex");

/**
 * Runs `run` at most once per (userId, endpoint, key). Must be called inside the request's tenant
 * transaction (`db` = that tx) so the key row commits or rolls back together with the work:
 * - first call: claims the key (INSERT ... ON CONFLICT DO NOTHING), runs, stores the JSON result;
 * - a concurrent call blocks on the primary key until the first transaction ends, then sees its row;
 * - same key + same hash returns the stored response without running; another hash throws
 *   IdempotencyConflictError;
 * - if `run` throws, the caller's transaction rolls back and takes the key row with it, so a retry
 *   executes again.
 * The response is stored as JSON: Dates come back as strings on replay (results here are plain).
 */
export async function runIdempotent<T>(
  db: Db,
  o: { userId: string; endpoint: string; key: string; requestHash: string; run: () => Promise<T> },
): Promise<T> {
  const claimed = await db.execute(sql`
    insert into idempotency_keys (user_id, endpoint, key, request_hash)
    values (${o.userId}, ${o.endpoint}, ${o.key}, ${o.requestHash})
    on conflict do nothing returning 1`);

  if (claimed.length === 0) {
    const [row] = await db.execute<{ request_hash: string; response: T | null }>(sql`
      select request_hash, response from idempotency_keys
      where user_id = ${o.userId} and endpoint = ${o.endpoint} and key = ${o.key}`);
    if (row.request_hash !== o.requestHash) throw new IdempotencyConflictError();
    // A committed row always has a response (it is written in the same transaction as the claim);
    // null is unreachable, handled defensively by running and storing.
    if (row.response !== null) return row.response;
  }

  const result = await o.run();
  await db.execute(sql`
    update idempotency_keys set response = ${JSON.stringify(result ?? null)}::jsonb
    where user_id = ${o.userId} and endpoint = ${o.endpoint} and key = ${o.key}`);
  return result;
}
