import { test, expect } from "@playwright/test";
import { mod11Dv } from "@intelicont/ledger/fiscal-py";
import { STORAGE_STATE, requireE2eEnv } from "./helpers";

test.describe("terceros", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE });

  test("creating a partner with a valid RUC lists it; an invalid DV shows the validation message", async ({ page }) => {
    const body = "80077702";
    await page.goto("/terceros");
    await page.getByRole("button", { name: /Nuevo tercero/ }).click();

    await page.getByLabel("RUC").fill(`${body}-${(mod11Dv(body) + 1) % 10}`);
    await expect(page.getByText(/Dígito verificador inválido/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Crear tercero" })).toBeDisabled();

    await page.getByLabel("RUC").fill(`${body}-${mod11Dv(body)}`);
    await page.getByLabel(/Razón social/).fill("Proveedor E2E S.A.");
    await page.getByRole("button", { name: "Crear tercero" }).click();

    const row = page.getByRole("row", { name: /Proveedor E2E S\.A\./ });
    await expect(row).toBeVisible();
    await expect(row).toContainText(`${body}-${mod11Dv(body)}`);
  });
});
