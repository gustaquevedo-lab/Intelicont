import { test, expect } from "@playwright/test";
import { USER_ENTITY_NAME, requireE2eEnv } from "./helpers";

// Runs logged in as the non-admin e2e user (storageState from global-setup).
test.describe("InteliCont E2E", () => {
  requireE2eEnv();

  test("tenant scope: the user sees only its own entity", async ({ page }) => {
    const res = await page.request.get("/api/trpc/entities.list");
    expect(res.status()).toBe(200);
    const names = (await res.json()).result.data.map((e: { legalName: string }) => e.legalName);
    expect(names).toEqual([USER_ENTITY_NAME]);
  });

  test("dashboard loads and shows KPIs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Nuevo Asiento" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Evolución de IVA" })).toBeVisible();
    await expect(page.getByText("Crédito Fiscal")).toBeVisible();
  });

  test("entity selector lists the user's real entity", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /RUC 80099997-3/ }).first().click();
    await expect(page.getByText("Cambiar Empresa")).toBeVisible();
    await expect(page.getByText(USER_ENTITY_NAME).first()).toBeVisible();
    await expect(page.getByText("TechAsu")).toHaveCount(0);
  });

  test("navigates to SIFEN page", async ({ page }) => {
    await page.goto("/sifen");
    await expect(page.locator("h1")).toContainText("SIFEN");
    await expect(page.getByRole("region", { name: "Comprobantes pendientes" })).toBeVisible();
  });

  test("SIFEN historial shows documents", async ({ page }) => {
    await page.goto("/sifen/historial");
    await expect(page.locator("h1")).toContainText("Bandeja SIFEN");
    await expect(page.locator("text=Pendiente").first()).toBeVisible();
  });

  test("asientos page shows entries", async ({ page }) => {
    await page.goto("/asientos");
    await expect(page.locator("h1")).toContainText("Asientos");
  });

  test("cuentas page loads chart of accounts", async ({ page }) => {
    await page.goto("/cuentas");
    await expect(page.locator("h1")).toContainText("Plan de Cuentas");
  });

  test("terceros page loads partners", async ({ page }) => {
    await page.goto("/terceros");
    await expect(page.locator("h1")).toContainText("Clientes y Proveedores");
  });

  test("libros page loads accounting books", async ({ page }) => {
    await page.goto("/libros");
    await expect(page.locator("h1")).toContainText("Libros Contables");
  });

  test("formulario 104 loads IVA declaration", async ({ page }) => {
    await page.goto("/fiscal/formulario-104");
    await expect(page.locator("h1")).toContainText("Formulario 104");
    await expect(page.getByRole("heading", { name: "Liquidación" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Débito fiscal (ventas)" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Crédito fiscal (compras)" })).toBeVisible();
  });

  test("hechauka page loads electronic book", async ({ page }) => {
    await page.goto("/fiscal/hechauka");
    await expect(page.locator("h1")).toContainText("Hechauka");
    await expect(page.getByRole("heading", { name: "Compras", exact: true })).toBeVisible();
  });

  test("calendario page shows fiscal calendar", async ({ page }) => {
    await page.goto("/calendario");
    await expect(page.locator("h1")).toContainText("Calendario");
  });

  test("impuestos calculator loads", async ({ page }) => {
    await page.goto("/impuestos");
    await expect(page.locator("h1")).toContainText("Calculadora");
  });

  test("banco page loads bank reconciliation", async ({ page }) => {
    await page.goto("/banco");
    await expect(page.locator("h1")).toContainText("Conciliación");
  });

  test("reportes page loads fiscal reports", async ({ page }) => {
    await page.goto("/reportes");
    await expect(page.locator("h1")).toContainText("Reportes");
  });

  test("configuracion page loads settings", async ({ page }) => {
    await page.goto("/configuracion");
    await expect(page.locator("h1")).toContainText("Configuración");
  });

  test("command palette opens with Cmd+K", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Nuevo Asiento" })).toBeVisible();
    await page.keyboard.press("Meta+k");
    await expect(page.getByPlaceholder("¿Qué necesitás hacer hoy?...")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("theme toggle cycles themes", async ({ page }) => {
    await page.goto("/");
    const themeBtn = page.locator("button[title='Cambiar tema']");
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await expect(page.locator("text=Claro")).toBeVisible({ timeout: 2000 });
      await page.locator("text=Oscuro").click();
      await expect(page.locator("html")).toHaveClass(/dark/);
    }
  });
});
