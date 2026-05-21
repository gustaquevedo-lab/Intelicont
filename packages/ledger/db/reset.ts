/**
 * Reset de base de datos — InteliCont
 * Elimina todos los datos en orden (respetando FK) y luego corre el seed.
 * ⚠ SOLO para desarrollo. Nunca en producción.
 * Run: pnpm db:reset
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ DATABASE_URL no está definida. Copiá .env.example a .env.local");
    process.exit(1);
  }

  const isProduction = dbUrl.includes("supabase.co") &&
    (process.env.NODE_ENV === "production" || process.env.ALLOW_RESET !== "true");

  if (isProduction) {
    console.error(
      "❌ Bloqueado: este script no puede correr en producción.\n" +
      "   Setea ALLOW_RESET=true si estás seguro de querer resetear."
    );
    process.exit(1);
  }

  console.log("⚠️  RESET de base de datos — todos los datos serán eliminados\n");

  const client = postgres(dbUrl, { max: 1, ssl: "require" });
  const db = drizzle(client, { schema });

  try {
    // Orden inverso de dependencias FK
    console.log("🗑️  Eliminando datos...");
    await db.delete(schema.journalLines);
    console.log("   ✓ journal_lines");
    await db.delete(schema.journalEntries);
    console.log("   ✓ journal_entries");
    await db.delete(schema.accounts);
    console.log("   ✓ accounts");
    await db.delete(schema.chartOfAccounts);
    console.log("   ✓ chart_of_accounts");
    await db.delete(schema.fiscalPeriods);
    console.log("   ✓ fiscal_periods");
    await db.delete(schema.entities);
    console.log("   ✓ entities");

    console.log("\n✅ Reset completado. Corriendo seed...\n");
  } finally {
    await client.end();
  }

  // Run seed after reset
  const { execSync } = await import("child_process");
  execSync("pnpm db:seed", { stdio: "inherit" });
}

main().catch((err) => {
  console.error("❌ Error en reset:", err);
  process.exit(1);
});
