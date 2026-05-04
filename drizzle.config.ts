import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/ledger/db/schema.ts",
  out: "./packages/ledger/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
