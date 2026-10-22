import { test, type Page } from "@playwright/test";

export const E2E_PORT = 3210;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const STORAGE_STATE = "e2e/.auth/user.json";
export const STORAGE_STATE_CREATOR = "e2e/.auth/creator.json";
/** User whose only entity has the SIFEN fixture's receiver RUC (1234567-9). */
export const STORAGE_STATE_SIFEN = "e2e/.auth/sifen.json";
export const SIFEN_EMAIL = "sifen@e2e.test";
/** Starts with no entities; flagged 2FA-enabled in the DB (creating an entity makes it admin, which the TOTP policy would block). */
export const CREATOR_EMAIL = "creador@e2e.test";
export const USER_EMAIL = "usuario@e2e.test";
export const ADMIN_EMAIL = "admin@e2e.test";
/** The only entity the non-admin user is a member of (the admin's "Empresa E2E" must stay invisible to it). */
export const USER_ENTITY_NAME = "Empresa Usuario E2E";

/** Skips the calling spec when globalSetup could not prepare a DB (no TEST_ADMIN_URL). */
export function requireE2eEnv() {
  test.skip(!process.env.E2E_READY, "TEST_ADMIN_URL not set (apps/web/.env.test.local)");
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}
