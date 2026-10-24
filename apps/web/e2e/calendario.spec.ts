import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv } from "./helpers";

test.describe("calendario fiscal", () => {
  requireE2eEnv();
  // global-setup creates the SIFEN user's entity (RUC 1234567-9) with the IVA_GRAL regime; its calendar is ensured on first read.
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("lists the Formulario 104 due date of the month and the unverified-rule note", async ({ page }) => {
    await page.goto("/calendario");
    await expect(page.getByText("Fechas calculadas con una regla no verificada")).toBeVisible();
    // The previous period falls due this month and the next ones in the following months: some month shows a 104.
    await expect(async () => {
      await page.goto("/calendario");
      await expect(page.getByRole("heading", { name: "Calendario Fiscal" })).toBeVisible(); // hydrated
      await expect(page.getByText("Formulario 104 — IVA mensual").first()).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByText("Registro de Comprobantes (955)").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Preparar/ }).first()).toHaveAttribute("href", /\/fiscal\/(formulario-104|registro-comprobantes)$/);
  });
});
