import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv, approveFixtureInvoice } from "./helpers";

test.describe("asientos", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("an entry opened from Libro IVA can be reversed with a reason and leaves an audit trail", async ({ page }) => {
    const myCdc = await approveFixtureInvoice(page);

    await page.goto("/libros");
    await expect(page.getByText(/TOTALES \(\d+ registros\)/)).toBeVisible();
    await page.getByLabel("Período").fill("2026-08");
    const row = page.getByRole("table", { name: "Libro IVA Compras" }).getByRole("row").filter({ hasText: `CDC ${myCdc}` });
    await row.getByRole("link", { name: "024-004-0049994" }).click();

    // First hit of a dev-compiled route can be slow under parallel load.
    await expect(page.getByRole("heading", { name: /^Asiento / })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("estado")).toHaveText("Posteado");
    await expect(page.getByRole("region", { name: "Rastro de auditoría" })).toContainText("Asiento posteado");

    await page.getByRole("button", { name: "Revertir" }).click();
    const dialog = page.getByRole("dialog", { name: "Revertir asiento" });
    const confirm = dialog.getByRole("button", { name: "Confirmar reversión" });
    await expect(confirm).toBeDisabled();
    await dialog.getByLabel("Motivo").fill("Duplicado por error de carga");
    await confirm.click();

    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("estado")).toHaveText("Reversado");
    await expect(page.getByRole("button", { name: "Revertir" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Ver asiento de reversión" })).toBeVisible();
    const trail = page.getByRole("region", { name: "Rastro de auditoría" });
    await expect(trail).toContainText("Asiento posteado");
    await expect(trail).toContainText("Asiento revertido");
    await expect(trail).toContainText("Duplicado por error de carga");

    await page.goto("/auditoria");
    const events = page.getByRole("table", { name: "Eventos de auditoría" });
    await expect(events).toContainText("Asiento posteado", { timeout: 45_000 });
    await expect(events).toContainText("Asiento revertido");
    await page.getByLabel("Filtrar por acción").selectOption("journal_entry.reversed");
    await expect(events.getByRole("row", { name: /Asiento posteado/ })).toHaveCount(0);
    await events.getByRole("button", { name: /Ver detalle de Asiento revertido/ }).first().click();
    await expect(page.getByLabel("Después").first()).toBeVisible();
  });
});
