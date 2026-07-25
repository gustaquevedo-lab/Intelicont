import { test, expect } from "@playwright/test";

test.describe("InteliCont ESFL Rendición CGR E2E Test", () => {
  test("navigates to ESFL rendicion CGR page and validates traceability matrix", async ({ page }) => {
    await page.goto("/esfl/rendicion");
    await expect(page.locator("h1")).toContainText("Rendición de Cuentas");
    await expect(page.locator("text=Formulario de Rendición de Fondos Públicos PGN")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Total Ejecutado PGN")).toBeVisible();
    await expect(page.locator("text=Matriz de Trazabilidad")).toBeVisible();
    await expect(page.locator("text=OG 210")).toBeVisible();
    await expect(page.locator("text=OG 340")).toBeVisible();
  });
});
