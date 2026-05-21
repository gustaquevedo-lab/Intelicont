import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

// Lazy singleton — prevents multiple connections during Next.js hot reload
let _db: DbInstance | null = null;

export function getDb(): DbInstance {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;

  if (!url || url.includes("placeholder")) {
    throw new Error(
      "DATABASE_URL no configurada. Agregá la variable en apps/web/.env.local"
    );
  }

  const client = postgres(url, {
    max: 5,
    ssl: "require",
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // required for Supabase connection pooler (PgBouncer)
  });

  _db = drizzle(client, { schema });
  return _db;
}
