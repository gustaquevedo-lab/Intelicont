import { test, expect } from "@playwright/test";

test.describe("InteliCont E2E", () => {
  test("dashboard loads and shows KPIs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Panel");
    await expect(page.locator("text=IVA Saldo")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Facturación Mayo")).toBeVisible();
    await expect(page.locator("text=Cargar XML")).toBeVisible();
  });

  test("entity selector switches companies", async ({ page }) => {
    await page.goto("/");
    const entityBtn = page.locator("button:has-text('RUC 800')").first();
    if (await entityBtn.isVisible()) {
      await entityBtn.click();
      const selector = page.locator("text=Cambiar Empresa");
      await expect(selector).toBeVisible({ timeout: 3000 });
      await page.locator("text=TechAsu").first().click();
      await expect(page.locator("h1")).toContainText("TechAsu", { timeout: 5000 });
    }
  });

  test("navigates to SIFEN page", async ({ page }) => {
    await page.goto("/sifen");
    await expect(page.locator("h1")).toContainText("SIFEN");
    await expect(page.locator("text=Cargar XML")).toBeVisible({ timeout: 5000 });
  });

  test("SIFEN historial shows documents", async ({ page }) => {
    await page.goto("/sifen/historial");
    await expect(page.locator("h1")).toContainText("Bandeja SIFEN");
    await expect(page.locator("text=Pendiente")).first().toBeVisible({ timeout: 5000 });
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
    await expect(page.locator("h1")).toContainText("Terceros");
  });

  test("libros page loads accounting books", async ({ page }) => {
    await page.goto("/libros");
    await expect(page.locator("h1")).toContainText("Libros Contables");
  });

  test("formulario 104 loads IVA declaration", async ({ page }) => {
    await page.goto("/fiscal/formulario-104");
    await expect(page.locator("h1")).toContainText("Formulario 104");
    await expect(page.locator("text=Resultado del Período")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Ventas")).toBeVisible();
    await expect(page.locator("text=Compras")).toBeVisible();
  });

  test("hechauka page loads electronic book", async ({ page }) => {
    await page.goto("/fiscal/hechauka");
    await expect(page.locator("h1")).toContainText("Hechauka");
    await expect(page.locator("text=Compras")).toBeVisible({ timeout: 5000 });
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

  test("login page shows auth form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Iniciar Sesión")).toBeVisible({ timeout: 5000 });
    await page.fill('input[type="email"]', "admin@intelicont.com");
    await page.click('button:has-text("Enviar Enlace")');
    await expect(page.locator("text=Verificar Código")).toBeVisible({ timeout: 5000 });
  });

  test("command palette opens with Cmd+K", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Meta+k");
    await expect(page.locator('[role="dialog"], .command-palette')).toBeVisible({ timeout: 3000 });
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
