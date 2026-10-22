import { AsyncLocalStorage } from "node:async_hooks";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

let _db: PostgresJsDatabase<typeof schema> | null = null;
let _usingMock = false;
let _connectionError: string | null = null;

export function isMockMode(): boolean {
  return _usingMock;
}

export function getConnectionError(): string | null {
  return _connectionError;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (_usingMock) return getMockDbInstance();
  if (_db) return _db;

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || dbUrl.includes("password") || dbUrl === "postgresql://user:password@localhost:5432/intelicont") {
    const reason = !dbUrl ? "DATABASE_URL is not configured" : "DATABASE_URL appears to be a placeholder";
    console.warn(`[InteliCont DB] ${reason} — running in MOCK MODE.`);
    _usingMock = true;
    return getMockDbInstance();
  }

  try {
    const sql = postgres(dbUrl, { max: 10 });
    _db = drizzle(sql, { schema });
    _usingMock = false;
    console.log("[InteliCont DB] Connected to real database.");
    return _db;
  } catch (err: any) {
    _connectionError = err.message || String(err);
    console.error("[InteliCont DB] Failed to connect:", _connectionError);
    _usingMock = true;
    return getMockDbInstance();
  }
}

function getMockDbInstance(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    const sql = postgres("postgresql://mock:mock@localhost:5432/mock");
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// ─── Tenant scope (RLS) ───────────────────────────────────────────────────

export type Db = PostgresJsDatabase<typeof schema>;

type TenantScope = { db: Db; userId: string };
const tenantTx = new AsyncLocalStorage<TenantScope>();

/**
 * Entry point for request-scoped DB work (tRPC middleware, server actions). Opens ONE
 * transaction, sets `app.user_id`, reads the user's memberships under that setting (RLS)
 * and sets `app.entity_ids` to those entities, then runs `fn`. A user with no memberships
 * reads every tenant table as empty (fail closed). A nested call for the same user reuses
 * the outer transaction; a nested call for another user throws.
 * In mock mode (no DATABASE_URL) `fn` runs without a tenant context: only the repository's
 * mock branches work there, `tenantDb` throws.
 */
export async function withTenant<T>(userId: string, fn: (db: Db) => Promise<T>): Promise<T> {
  if (!userId) throw new Error("No tenant context");
  const existing = tenantTx.getStore();
  if (existing) {
    if (existing.userId !== userId) throw new Error("Nested tenant context for another user");
    return fn(existing.db);
  }

  const base = getDb();
  if (_usingMock) return fn(base);

  return base.transaction(async (tx) => {
    const db = tx as unknown as Db;
    await db.execute(sql`select set_config('app.user_id', ${userId}, true)`);
    const rows = await db.execute<{ entity_id: string }>(
      sql`select entity_id from memberships where user_id = ${userId}`,
    );
    const entityIds = rows.map((r) => r.entity_id).join(",");
    await db.execute(sql`select set_config('app.entity_ids', ${entityIds}, true)`);
    return tenantTx.run({ db, userId }, () => fn(db));
  });
}

/**
 * Internal accessor for repository/use-case code: the transaction of the enclosing
 * `withTenant`. Throws when there is none — never falls back to an unscoped connection.
 */
export async function tenantDb<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const scope = tenantTx.getStore();
  if (!scope) throw new Error("No tenant context");
  return fn(scope.db);
}

/** Postgres error text from a Drizzle/postgres-js failure (trigger messages included). */
export function dbErrorMessage(err: unknown): string {
  const e = err as { cause?: { message?: string }; message?: string };
  return e?.cause?.message ?? e?.message ?? String(err);
}
