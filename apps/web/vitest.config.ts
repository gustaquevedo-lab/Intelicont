import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "@ledger/fiscal-py", replacement: path.resolve(__dirname, "../../packages/ledger/src/fiscal-py.ts") },
      { find: "@ledger/db/schema", replacement: path.resolve(__dirname, "../../packages/ledger/db/schema.ts") },
      { find: "@ledger/db/index", replacement: path.resolve(__dirname, "../../packages/ledger/db/index.ts") },
      { find: "@ledger", replacement: path.resolve(__dirname, "../../packages/ledger") },
    ],
  },
});
