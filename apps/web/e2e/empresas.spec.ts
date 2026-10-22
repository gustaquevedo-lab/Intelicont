import { test, expect } from "@playwright/test";
import { mod11Dv } from "@intelicont/ledger/fiscal-py";
import { STORAGE_STATE_CREATOR, requireE2eEnv } from "./helpers";

test.describe("empresas", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE_CREATOR });

  test("creating a company lists it, selects it and seeds its chart of accounts", async ({ page }) => {
    const body = "80077701";
    await page.goto("/empresas");
    await page.getByRole("button", { name: /Nueva Empresa/ }).click();

    // invalid DV is rejected with the validator's message
    await page.getByLabel("RUC").fill(`${body}-${(mod11Dv(body) + 1) % 10}`);
    await page.getByLabel("Razón Social").fill("Empresa Creada E2E S.A.");
    await page.getByRole("button", { name: "Crear Empresa" }).click();
    await expect(page.getByText(/Dígito verificador inválido/)).toBeVisible();

    await page.getByLabel("RUC").fill(`${body}-${mod11Dv(body)}`);
    await page.getByRole("button", { name: "Crear Empresa" }).click();

    await expect(page.getByText("Empresa Creada E2E S.A.").first()).toBeVisible();
    await expect(page.getByRole("button", { name: new RegExp(`RUC ${body}`) })).toBeVisible();

    await page.goto("/cuentas");
    await expect(page.getByText("ACTIVO").first()).toBeVisible();
  });
});
