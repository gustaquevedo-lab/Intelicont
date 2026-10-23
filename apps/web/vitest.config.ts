import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    // TEST_DB_SLOW=1: latency profile for real-Postgres tests over a remote tunnel (many sequential
    // round trips per test). Otherwise vitest's defaults (5 s per test, 10 s per hook).
    ...(process.env.TEST_DB_SLOW === "1" && { testTimeout: 30_000, hookTimeout: 60_000 }),
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@intelicont/core", replacement: path.resolve(__dirname, "../../packages/core/src/index.ts") },
      { find: "@ledger/fiscal-py", replacement: path.resolve(__dirname, "../../packages/ledger/src/fiscal-py.ts") },
      { find: "@ledger/db/schema", replacement: path.resolve(__dirname, "../../packages/ledger/db/schema.ts") },
      { find: "@ledger/db/index", replacement: path.resolve(__dirname, "../../packages/ledger/db/index.ts") },
      { find: "@ledger", replacement: path.resolve(__dirname, "../../packages/ledger") },
    ],
  },
});
