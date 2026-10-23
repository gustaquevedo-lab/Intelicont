import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv } from "./helpers";

const FIXTURE = path.resolve(__dirname, "../src/__fixtures__/sifen/fac_024-004-0049994.xml");

/** DNIT mod-11 check digit (same as fiscal-py's mod11Dv; inlined to keep the spec dependency-free). */
const mod11Dv = (digits: string) => {
  let sum = 0;
  for (let i = digits.length - 1, w = 2; i >= 0; i--, w = w === 11 ? 2 : w + 1) sum += Number(digits[i]) * w;
  const r = sum % 11;
  return r > 1 ? 11 - r : 0;
};

test.describe("libros", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("an approved fixture invoice appears in Libro IVA compras with a drill-down to its entry", async ({ page }) => {
    // Own CDC, so other specs ingesting the same fixture do not collide.
    const xml = readFileSync(FIXTURE, "utf-8");
    const cdc = /Id="(\d{44})"/.exec(xml)![1];
    const body = cdc.slice(0, 34) + String((Date.now() + 7) % 1e9).padStart(9, "0");
    const myCdc = body + mod11Dv(body);

    await page.goto("/sifen");
    await expect(page.getByRole("button", { name: /RUC 1234567-9/ }).first()).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "libros.xml", mimeType: "text/xml", buffer: Buffer.from(xml.replace(cdc, myCdc)) });
    await expect(page.getByRole("list", { name: "Resultado de la carga" })).toContainText("Guardado");
    const card = page.getByRole("article").filter({ hasText: `CDC ${myCdc}` });
    await card.getByRole("button", { name: "Sugerir asiento" }).click();
    await expect(card.getByLabel("Asiento propuesto")).toContainText("Reglas");
    await card.getByRole("button", { name: "Aprobar y postear" }).click();
    await expect(page.getByRole("list", { name: "Asientos publicados" })).toContainText("publicado");

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
