import { test, expect, type Page } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv, approveFixtureInvoice } from "./helpers";

/** Crédito fiscal total (Gs.) shown for 2026-08. The e2e DB is shared with specs running in parallel, so only lower bounds are asserted. */
async function creditoFiscal(page: Page) {
  // Retry from a fresh load: parallel specs may write between the form's and the book's queries (transient mismatch).
  await expect(async () => {
    await page.goto("/fiscal/formulario-104");
    await expect(page.getByRole("heading", { name: "Liquidación" })).toBeVisible(); // hydrated, data loaded
    await page.getByLabel("Período").fill("2026-08");
    await expect(page.getByText("Agosto 2026")).toBeVisible();
    await expect(page.getByText("Cuadra con el Libro IVA")).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  const credito = page.locator("section").filter({ hasText: "Crédito fiscal (compras)" });
  const row = credito.locator("div").filter({ hasText: /^Total crédito fiscal/ }).last();
  const text = (await row.textContent()) ?? "";
  return Number(text.replace(/\D/g, "").replace(/^0+/, "") || 0);
}

test.describe("formulario 104", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("an approved fixture invoice includes 5.273 of crédito fiscal and the page matches the Libro IVA", async ({ page }) => {
    await approveFixtureInvoice(page);
    // At least the fixture's IVA (other specs may add more to the same month); the badge checks it equals the Libro IVA.
    expect(await creditoFiscal(page)).toBeGreaterThanOrEqual(5_273);
    const credito = page.locator("section").filter({ hasText: "Crédito fiscal (compras)" });
    await expect(credito.getByRole("link", { name: "Ver Libro IVA" })).toHaveAttribute("href", "/libros?tab=iva_compras&periodo=2026-08");
  });
});
