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

type TenantResolver = () => string[] | Promise<string[]>;

// Dev-only default until auth provides real membership: DEV_ENTITY_IDS=uuid,uuid
let resolveEntityIds: TenantResolver = () =>
  process.env.NODE_ENV === "production"
    ? []
    : (process.env.DEV_ENTITY_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);

export function setTenantResolver(resolver: TenantResolver): void {
  resolveEntityIds = resolver;
}

const tenantTx = new AsyncLocalStorage<Db>();

/**
 * Runs `fn` in a transaction whose RLS scope is the caller's entities
 * (`app.entity_ids`). Nested calls reuse the outer transaction. With no
 * entities in scope every tenant table reads as empty (fail closed).
 */
export async function withTenant<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  const existing = tenantTx.getStore();
  if (existing) return fn(existing);

  const base = getDb();
  if (_usingMock) return fn(base);

  const entityIds = await resolveEntityIds();
  return base.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.entity_ids', ${entityIds.join(",")}, true)`);
    return tenantTx.run(tx as unknown as Db, () => fn(tx as unknown as Db));
  });
}

/** Postgres error text from a Drizzle/postgres-js failure (trigger messages included). */
export function dbErrorMessage(err: unknown): string {
  const e = err as { cause?: { message?: string }; message?: string };
  return e?.cause?.message ?? e?.message ?? String(err);
}
