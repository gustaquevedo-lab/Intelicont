import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

let _db: PostgresJsDatabase<typeof schema> | null = null;

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;

  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL is not configured. Set it in .env.local");
  }

  const sql = postgres(dbUrl, { prepare: false });
  _db = drizzle(sql, { schema });
  return _db;
}
