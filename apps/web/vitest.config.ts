import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const critical = { lines: 90, statements: 90, functions: 90, branches: 85 };

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    // TEST_DB_SLOW=1: latency profile for real-Postgres tests over a remote tunnel (many sequential
    // round trips per test). Otherwise vitest's defaults (5 s per test, 10 s per hook).
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov"],
      // The measured code lives outside the vitest root (packages/ledger), hence allowExternal + absolute globs.
      allowExternal: true,
      include: [
        path.resolve(__dirname, "../../packages/ledger/src/**/*.ts"),
        path.resolve(__dirname, "../../packages/ledger/db/{audit,calendar,idempotency,registro,reports}.ts"),
      ],
      // index.ts = barrels; domain.ts = type-only (no runtime code to measure).
      exclude: [path.resolve(__dirname, "../../packages/ledger/src/**/index.ts"), path.resolve(__dirname, "../../packages/ledger/src/domain.ts")],
      // Needs the DB suite (TEST_ADMIN_URL): the use cases are only exercised by src/__tests__/db.
      // The critical fiscal/ledger modules carry their own gate (aggregated per glob) so a
      // well-covered file cannot mask them.
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85,
        "../../packages/ledger/src/fiscal-py.ts": critical,
        "../../packages/ledger/src/retentions.ts": critical,
        "../../packages/ledger/src/usecases/**": critical,
      },
    },
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
