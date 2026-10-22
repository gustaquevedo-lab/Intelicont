import path from "node:path";
import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv } from "./helpers";

const FIXTURE = path.resolve(__dirname, "../src/__fixtures__/sifen/fac_024-004-0049994.xml");

test.describe("sifen ingest", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("uploading the fixture XML saves it; uploading it again reports a duplicate", async ({ page }) => {
    for (const expected of ["Guardado", "Duplicado (ya existía)"]) {
      await page.goto("/sifen");
      await expect(page.getByRole("button", { name: /RUC 1234567-9/ }).first()).toBeVisible();
      await page.locator('input[type="file"]').setInputFiles(FIXTURE);
      const results = page.getByRole("list", { name: "Resultado de la carga" });
      await expect(results).toContainText(expected);
      await expect(results).toContainText("fac_024-004-0049994.xml");
    }
  });
});
