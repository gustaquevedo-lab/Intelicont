import { sql } from "drizzle-orm";
import type { Db } from "./index";
import * as schema from "./schema";

type Of<T, V> = V | ((result: T) => V);

export type AuditInput<T> = {
  entityId: string;
  action: string;
  targetType: string;
  /** Value, or a function of the work's result when the id only exists after `fn` ran. */
  targetId?: Of<T, string | undefined>;
  before?: unknown;
  /** Value, or a function of the work's result (a function is always called, never stored). */
  after?: Of<T, unknown>;
  reason?: string;
};

/**
 * Runs `fn`, then appends the audit row in the SAME transaction (`db` must be the tenant
 * transaction), with `actor_id` taken from `app.user_id`. If `fn` throws nothing is audited and
 * the error propagates; if there is no actor the work is aborted (never audit anonymously), so
 * the caller's transaction rolls back.
 */
export async function audited<T>(db: Db, ev: AuditInput<T>, fn: () => Promise<T>): Promise<T> {
  const result = await fn();
  const rows = await db.execute<{ actor: string | null }>(sql`select nullif(current_setting('app.user_id', true), '') as actor`);
  const actorId = rows[0]?.actor;
  if (!actorId) throw new Error("Audit requires an authenticated actor (app.user_id)");
  const resolve = <V>(v: Of<T, V>): V => (typeof v === "function" ? (v as (r: T) => V)(result) : v);
  await db.insert(schema.auditEvents).values({
    entityId: ev.entityId,
    actorId,
    action: ev.action,
    targetType: ev.targetType,
    targetId: resolve(ev.targetId) ?? null,
    before: ev.before ?? null,
    after: resolve(ev.after) ?? null,
    reason: ev.reason ?? null,
  });
  return result;
}
