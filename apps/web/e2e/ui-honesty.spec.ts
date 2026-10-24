import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv, approveFixtureInvoice, USER_ENTITY_NAME } from "./helpers";

const digits = (s: string | null) => Number((s ?? "").replace(/\D/g, "") || 0);

test.describe("preview modules", () => {
  requireE2eEnv();

  test("preview items are hidden by default and appear after enabling the setting", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("aside").first();
    await expect(nav.getByRole("link", { name: "Panel General" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Conciliación Bancaria/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Impuestos/ })).toHaveCount(0);

    await page.goto("/configuracion");
    // Retry until hydrated: the tab and the checkbox only react after hydration.
    await expect(async () => {
      await page.getByRole("button", { name: "Módulos" }).click();
      await page.getByLabel(/Mostrar módulos en vista previa/).check({ timeout: 1_000 });
    }).toPass({ timeout: 20_000 });

    await expect(nav.getByRole("link", { name: /Conciliación Bancaria/ })).toBeVisible();
    await expect(nav.getByRole("link", { name: /Conciliación Bancaria/ })).toContainText("Vista previa");
    // The choice persists across navigation (localStorage).
    await page.goto("/");
    await expect(nav.getByRole("link", { name: /Impuestos/ })).toBeVisible();
  });

  test("a preview page shows the Vista previa banner", async ({ page }) => {
    await page.goto("/banco");
    await expect(page.getByTestId("preview-banner")).toContainText("Vista previa — datos de ejemplo, no reflejan tu contabilidad");
    await page.goto("/reportes/eeff");
    await expect(page.getByTestId("preview-banner")).toBeVisible();
    // The real manual-document page lives under /documentos and must not carry it.
    await page.goto("/documentos/nuevo");
    await expect(page.getByRole("form", { name: "Comprobante manual" })).toBeVisible();
    await expect(page.getByTestId("preview-banner")).toHaveCount(0);
  });

  test("Ctrl+E opens the entity switcher and Enter selects", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: /RUC 80099997-3/ }).first();
    await expect(trigger).toBeVisible();
    const dialog = page.getByRole("dialog", { name: "Cambiar empresa" });
    await expect(async () => {
      await page.keyboard.press("Control+e");
      await expect(dialog).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 20_000 });
    await expect(dialog.getByRole("option", { selected: true })).toContainText(USER_ENTITY_NAME);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeVisible();

    // Not while typing in a field.
    await page.goto("/asientos");
    const search = page.getByLabel("Buscar asiento");
    await search.click();
    await page.keyboard.press("Control+e");
    await expect(dialog).toBeHidden();
  });
});

test.describe("dashboard and forms with real data", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("the dashboard shows real figures for the fixture month (IVA crédito, comprobantes)", async ({ page }) => {
    await approveFixtureInvoice(page);
    await page.goto("/");
    await expect(async () => {
      await page.getByLabel("Período").fill("2026-08");
      await expect(page.getByTestId("iva-credito")).toContainText("₲", { timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    // Other specs add to the same month, so only lower bounds.
    expect(digits(await page.getByTestId("iva-credito").textContent())).toBeGreaterThanOrEqual(5_273);
    const asientos = page.getByRole("link", { name: "Asientos del mes" }).getByTestId("kpi-value");
    await expect(async () => expect(digits(await asientos.textContent())).toBeGreaterThanOrEqual(1)).toPass();
    const pendientes = page.getByRole("link", { name: "Comprobantes pendientes" }).getByTestId("kpi-value");
    await expect(pendientes).toHaveText(/^\d+$/);
    // No fake charts or sample activity.
    await expect(page.getByText("Evolución de IVA")).toHaveCount(0);
    await expect(page.getByText("JE-001-2026")).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Actividad reciente" })).toContainText("Asiento posteado");
  });

  test("a second click on Guardar y contabilizar does not create a second entry", async ({ page }) => {
    await page.goto("/documentos/nuevo");
    const form = page.getByRole("form", { name: "Comprobante manual" });
    await expect(form).toBeVisible();
    await form.getByLabel("Tercero").selectOption({ label: "Proveedor Agente E2E (80005427-0)" });
    await form.getByLabel("Timbrado", { exact: true }).fill("12345678");
    await form.getByLabel("Número", { exact: true }).fill("0010010000043");
    await form.getByLabel("Fecha").fill("2026-08-16");
    await form.getByLabel("Gravado 10 % (IVA incluido)").fill("1100000");
    const save = form.getByRole("button", { name: "Guardar y contabilizar" });
    await expect(save).toBeEnabled();
    await save.dblclick();
    await expect(form.getByRole("status")).toContainText("Comprobante guardado y asiento contabilizado");
    await expect(save).toBeDisabled();
    await expect(form.getByRole("alert")).toHaveCount(0);

    await page.goto("/libros");
    await expect(page.getByText(/TOTALES \(\d+ registros\)/)).toBeVisible();
    await page.getByLabel("Período").fill("2026-08");
    const rows = page.getByRole("table", { name: "Libro IVA Compras" }).getByRole("row").filter({ hasText: "001-001-0000043" });
    await expect(rows).toHaveCount(1);
  });
});
