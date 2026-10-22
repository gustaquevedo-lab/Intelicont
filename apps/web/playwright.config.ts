import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, STORAGE_STATE } from "./e2e/helpers";

// The web server is started by e2e/global-setup.ts (it needs the throwaway DB's URL first).
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: E2E_BASE_URL,
    storageState: STORAGE_STATE,
    navigationTimeout: 60_000,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
