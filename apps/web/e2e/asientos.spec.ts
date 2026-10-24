import { test, expect, type Page } from "@playwright/test";
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

  const pickAccount = async (page: Page, line: number, query: string) => {
    const box = page.getByRole("combobox", { name: `Cuenta línea ${line}` });
    await box.click();
    await box.fill(query);
    await box.press("Enter");
  };

  test("a balanced manual entry can be posted and opened from the confirmation link", async ({ page }) => {
    await page.goto("/asientos/nuevo");
    const form = page.getByRole("form", { name: "Asiento manual" });
    await expect(form).toBeVisible();
    await form.getByLabel("Descripción", { exact: true }).fill("Aporte de capital E2E");
    await pickAccount(page, 1, "Caja Principal");
    await form.getByLabel("Debe línea 1").fill("1500000");
    await expect(form.getByLabel("Debe línea 1")).toHaveValue("1.500.000");
    await pickAccount(page, 2, "Capital Social");
    await form.getByLabel("Haber línea 2").fill("1500000");
    await expect(form.getByTestId("balance-chip")).toHaveText("Balanceado");

    const save = form.getByRole("button", { name: "Guardar y postear" });
    await save.click();
    const number = form.getByTestId("entry-number");
    await expect(number).toHaveText(/^JE-/, { timeout: 30_000 });
    await expect(save).toBeDisabled();
    await form.getByRole("link", { name: "Ver asiento" }).click();

    await expect(page.getByRole("heading", { name: /^Asiento JE-/ })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("estado")).toHaveText("Posteado");
    await expect(page.getByText("Caja Principal").first()).toBeVisible();
    await expect(page.getByText("Capital Social").first()).toBeVisible();
    await expect(page.getByText("1.500.000").first()).toBeVisible();
  });

  test("an unbalanced entry keeps the save button disabled and shows the difference", async ({ page }) => {
    await page.goto("/asientos/nuevo");
    const form = page.getByRole("form", { name: "Asiento manual" });
    await form.getByLabel("Descripción", { exact: true }).fill("Descuadrado");
    await pickAccount(page, 1, "Caja Principal");
    await form.getByLabel("Debe línea 1").fill("1000000");
    await pickAccount(page, 2, "Capital Social");
    await form.getByLabel("Haber línea 2").fill("400000");
    await expect(form.getByTestId("balance-chip")).toHaveText("Descuadrado por ₲ 600.000");
    await expect(form.getByTestId("difference")).toHaveText("₲ 600.000");
    await expect(form.getByRole("button", { name: "Guardar y postear" })).toBeDisabled();
    // Typing in the opposite column clears the other side of the line.
    await form.getByLabel("Haber línea 1").fill("5");
    await expect(form.getByLabel("Debe línea 1")).toHaveValue("");
  });

  test("keyboard: Ctrl+Enter adds a line", async ({ page }) => {
    await page.goto("/asientos/nuevo");
    const form = page.getByRole("form", { name: "Asiento manual" });
    await expect(form.getByLabel("Descripción línea 1")).toBeVisible();
    await expect(form.getByLabel("Descripción línea 3")).toHaveCount(0);
    await form.getByLabel("Descripción", { exact: true }).press("Control+Enter");
    await expect(form.getByLabel("Descripción línea 3")).toBeVisible();
    await expect(form.getByRole("combobox", { name: "Cuenta línea 3" })).toBeFocused();
    // Tab from the last cell of a filled last line adds another.
    await form.getByLabel("Debe línea 3").fill("10");
    await form.getByLabel("Descripción línea 3").press("Tab");
    await expect(form.getByLabel("Descripción línea 4")).toBeVisible();
  });

  test("keyboard-only user can reach the save button by Tab from a blank last line", async ({ page }) => {
    await page.goto("/asientos/nuevo");
    const form = page.getByRole("form", { name: "Asiento manual" });
    const last = form.getByLabel("Descripción línea 2");
    await last.focus();
    await page.keyboard.press("Tab");
    await expect(form.getByLabel("Descripción línea 3")).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BUTTON");
  });

  test("a pasted decimal amount is rejected, not multiplied", async ({ page }) => {
    await page.goto("/asientos/nuevo");
    const form = page.getByRole("form", { name: "Asiento manual" });
    const debe = form.getByLabel("Debe línea 1");
    await debe.fill("1.234,50");
    await expect(debe).toHaveValue("");
    await expect(form.getByText("Solo importes enteros en guaraníes")).toBeVisible();
    await debe.fill("1.234.567");
    await expect(debe).toHaveValue("1.234.567");
  });
});
