import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres:IFqjkoEjmYZrijmgDcQDAdvZiQidTtcT@tokaido.proxy.rlwy.net:45280/railway";

async function run() {
  console.log("Connecting directly to Railway PostgreSQL database...");
  const sql = postgres(dbUrl, { prepare: false });

  try {
    const migrationsDir = path.join(__dirname, "../packages/ledger/db/migrations");
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    console.log("Found migration files to apply:", files);

    await sql`CREATE TABLE IF NOT EXISTS _migrations (name text primary key, applied_at timestamp default now())`;

    for (const file of files) {
      const alreadyApplied = await sql`SELECT name FROM _migrations WHERE name = ${file}`;
      if (alreadyApplied.length > 0) {
        console.log(`Migration ${file} is already applied. Skipping.`);
        continue;
      }

      console.log(`Applying migration ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const query = fs.readFileSync(filePath, "utf-8");
      
      await sql.unsafe(query);
      await sql`INSERT INTO _migrations (name) VALUES (${file})`;
      console.log(`Successfully applied ${file}.`);
    }

    console.log("\n🚀 All migrations applied successfully to Railway PostgreSQL!");
    process.exit(0);
  } catch (error: any) {
    console.error("Migration execution failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

run();
