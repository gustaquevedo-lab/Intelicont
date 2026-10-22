import { randomBytes } from "node:crypto";
import { join } from "node:path";
import postgres, { type Sql } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export type { Sql };

export type TestDb = {
  /** Connection as the DB/table owner (bypasses RLS; used for fixtures and owner-level assertions). */
  owner: Sql;
  /** Connection as the runtime role (NOSUPERUSER NOBYPASSRLS); subject to RLS. */
  app: Sql;
  /** Connection URLs for out-of-process clients (e.g. a web server under e2e). Contain credentials: never log. */
  ownerUrl: string;
  appUrl: string;
  /** Runs fn in a transaction as the app role with tenant scope + extra settings (set_config, local). */
  scoped<T>(entityIds: string[], fn: (tx: Sql) => Promise<T>, settings?: Record<string, string>): Promise<T>;
  /** Terminates connections and drops the temp database and role. */
  drop(): Promise<void>;
};

// __dirname, not import.meta: this file is also loaded by Playwright's CJS transform (e2e global setup);
// Vitest provides __dirname too.
const MIGRATIONS = join(__dirname, "migrations");

function withDb(adminUrl: string, db: string, user?: string, password?: string): string {
  const u = new URL(adminUrl);
  u.pathname = `/${db}`;
  if (user) u.username = user;
  if (password) u.password = password;
  return u.toString();
}

/**
 * Creates a throwaway database (owned by the TEST_ADMIN_URL role), applies the Drizzle
 * migrations as owner and creates a random non-bypass LOGIN role for the "app" connection.
 */
export async function createTestDb(): Promise<TestDb> {
  const adminUrl = process.env.TEST_ADMIN_URL;
  if (!adminUrl) throw new Error("TEST_ADMIN_URL is not set");

  const suffix = randomBytes(5).toString("hex");
  const dbName = `ic_test_${suffix}`;
  const role = `t_app_${suffix}`;
  const password = randomBytes(18).toString("hex");

  const admin = postgres(adminUrl, { max: 1, onnotice: () => {} });
  let owner: Sql | undefined;
  let app: Sql | undefined;
  let dbCreated = false;
  let roleCreated = false;

  const cleanup = async () => {
    await app?.end({ timeout: 2 }).catch(() => {});
    await owner?.end({ timeout: 2 }).catch(() => {});
    if (dbCreated) {
      await admin`select pg_terminate_backend(pid) from pg_stat_activity where datname = ${dbName} and pid <> pg_backend_pid()`;
      await admin.unsafe(`drop database if exists "${dbName}"`);
    }
    if (roleCreated) await admin.unsafe(`drop role if exists "${role}"`);
  };

  try {
    await admin.unsafe(`create database "${dbName}"`);
    dbCreated = true;
    await admin.unsafe(`create role "${role}" login password '${password}' nosuperuser nobypassrls nocreatedb nocreaterole`);
    roleCreated = true;

    owner = postgres(withDb(adminUrl, dbName), { max: 1, onnotice: () => {} });
    await migrate(drizzle(owner), { migrationsFolder: MIGRATIONS });
    await owner.unsafe(`grant connect on database "${dbName}" to "${role}"`);
    await owner.unsafe(`grant usage on schema public to "${role}"`);
    await owner.unsafe(`grant select, insert, update on all tables in schema public to "${role}"`);
    // Auth-layer tables the runtime role must also delete from (sign-out, expired tokens).
    await owner.unsafe(`grant delete on sessions, verifications to "${role}"`);
    await owner.unsafe(`grant usage, select on all sequences in schema public to "${role}"`);

    app = postgres(withDb(adminUrl, dbName, role, password), { max: 1, onnotice: () => {} });
    await app`select 1`;
  } catch (e) {
    await cleanup().catch(() => {});
    await admin.end({ timeout: 2 }).catch(() => {});
    throw e;
  }

  const appSql = app;
  return {
    owner,
    app: appSql,
    ownerUrl: withDb(adminUrl, dbName),
    appUrl: withDb(adminUrl, dbName, role, password),
    scoped: (entityIds, fn, settings = {}) =>
      appSql.begin(async (tx) => {
        await tx`select set_config('app.entity_ids', ${entityIds.join(",")}, true)`;
        for (const [k, v] of Object.entries(settings)) await tx`select set_config(${k}, ${v}, true)`;
        return fn(tx as unknown as Sql);
      }) as Promise<never>,
    drop: async () => {
      try {
        await cleanup();
      } finally {
        await admin.end({ timeout: 2 });
      }
    },
  };
}
