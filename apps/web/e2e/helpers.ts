import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";

export const E2E_PORT = 3210;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const STORAGE_STATE = "e2e/.auth/user.json";
export const STORAGE_STATE_CREATOR = "e2e/.auth/creator.json";
/** User whose only entity has the SIFEN fixture's receiver RUC (1234567-9). */
export const STORAGE_STATE_SIFEN = "e2e/.auth/sifen.json";
/** User with two entities (entity switcher spec). */
export const STORAGE_STATE_MULTI = "e2e/.auth/multi.json";
export const MULTI_EMAIL = "multi@e2e.test";
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

const FIXTURE = path.resolve(__dirname, "../src/__fixtures__/sifen/fac_024-004-0049994.xml");

/** DNIT mod-11 check digit (same as fiscal-py's mod11Dv; inlined to keep the specs dependency-free). */
const mod11Dv = (digits: string) => {
  let sum = 0;
  for (let i = digits.length - 1, w = 2; i >= 0; i--, w = w === 11 ? 2 : w + 1) sum += Number(digits[i]) * w;
  const r = sum % 11;
  return r > 1 ? 11 - r : 0;
};

/** Ingests the SIFEN fixture under a fresh CDC, suggests (rules provider) and approves its entry. Returns the CDC. Needs STORAGE_STATE_SIFEN. */
export async function approveFixtureInvoice(page: Page): Promise<string> {
  const xml = readFileSync(FIXTURE, "utf-8");
  const cdc = /Id="(\d{44})"/.exec(xml)![1];
  const body = cdc.slice(0, 34) + String((Date.now() * 1000 + Math.floor(Math.random() * 1000)) % 1e9).padStart(9, "0");
  const myCdc = body + mod11Dv(body);

  await page.goto("/sifen");
  await expect(page.getByRole("button", { name: /RUC 1234567-9/ }).first()).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: "fixture.xml", mimeType: "text/xml", buffer: Buffer.from(xml.replace(cdc, myCdc)) });
  await expect(page.getByRole("list", { name: "Resultado de la carga" })).toContainText("Guardado");
  const card = page.getByRole("article").filter({ hasText: `CDC ${myCdc}` });
  await card.getByRole("button", { name: "Sugerir asiento" }).click();
  await expect(card.getByLabel("Asiento propuesto")).toContainText("Reglas");
  await card.getByRole("button", { name: "Aprobar y postear" }).click();
  await expect(page.getByRole("list", { name: "Asientos publicados" })).toContainText("publicado");
  return myCdc;
}
