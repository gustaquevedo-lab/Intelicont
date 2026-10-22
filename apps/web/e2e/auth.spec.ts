import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, USER_EMAIL, login, requireE2eEnv } from "./helpers";

test.describe("auth", () => {
  requireE2eEnv();
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated page request redirects to /login", async ({ page }) => {
    await page.goto("/asientos");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Iniciar Sesión" })).toBeVisible();
  });

  test("valid login reaches the dashboard", async ({ page }) => {
    await login(page, USER_EMAIL, process.env.E2E_USER_PASSWORD!);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("button", { name: "Nuevo Asiento" })).toBeVisible();
    // Top-bar initials come from the real session user ("Usuario E2E").
    await expect(page.getByRole("button", { name: "Us", exact: true })).toBeVisible();
  });

  test("wrong password shows an error", async ({ page }) => {
    await login(page, USER_EMAIL, "contraseña-incorrecta");
    await expect(page.getByText("Email o contraseña incorrectos")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("admin without 2FA is forced to enroll TOTP", async ({ page }) => {
    await login(page, ADMIN_EMAIL, process.env.E2E_ADMIN_PASSWORD!);
    await expect(page).toHaveURL(/\/seguridad\/2fa$/);
    await expect(page.getByRole("heading", { name: "Configurar verificación en dos pasos" })).toBeVisible();
    await page.goto("/asientos");
    await expect(page).toHaveURL(/\/seguridad\/2fa$/);
    // The API enforces the same policy.
    expect((await page.request.get("/api/trpc/entities.list")).status()).toBe(403);
  });

  test("unauthenticated tRPC call is 401 and other /api routes are not exempt", async ({ page }) => {
    expect((await page.request.get("/api/trpc/entities.list")).status()).toBe(401);
    const other = await page.request.get("/api/no-existe", { maxRedirects: 0 });
    expect(other.status()).toBe(307);
  });
});
