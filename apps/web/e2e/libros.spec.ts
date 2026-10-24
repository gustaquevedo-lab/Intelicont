import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv, approveFixtureInvoice } from "./helpers";

test.describe("libros", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("an approved fixture invoice appears in Libro IVA compras with a drill-down to its entry", async ({ page }) => {
    const myCdc = await approveFixtureInvoice(page);

    await page.goto("/libros");
    // Fill only after hydration (the book's totals render from a query), or the controlled input resets.
    await expect(page.getByText(/TOTALES \(\d+ registros\)/)).toBeVisible();
    await page.getByLabel("Período").fill("2026-08");
    await expect(page.getByText("Libro IVA, Diario, Mayor y Sumas y Saldos — 2026-08")).toBeVisible();
    const table = page.getByRole("table", { name: "Libro IVA Compras" });
    const row = table.getByRole("row").filter({ hasText: `CDC ${myCdc}` });
    await expect(row).toContainText("024-004-0049994");
    await expect(row).toContainText("₲ 58.000");
    await expect(row).toContainText("₲ 5.273");
    await expect(row.getByRole("link", { name: "024-004-0049994" })).toHaveAttribute("href", /^\/asientos\/[0-9a-f-]{36}$/);
  });
});
