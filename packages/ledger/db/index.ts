import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Para desarrollo y scripts Node.js (seed, migrations).
// En Next.js App Router (Server Components / Server Actions) este cliente funciona bien.
// Para Edge Runtime en el futuro: usar @supabase/supabase-js o el pooler de Supabase.
const client = postgres(process.env.DATABASE_URL!, {
  max: 1,        // una conexión en scripts/seed
  ssl: "require", // Supabase siempre requiere SSL
});

export const db = drizzle(client, { schema });
export { client };
