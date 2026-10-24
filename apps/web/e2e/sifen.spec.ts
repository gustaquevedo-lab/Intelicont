import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv } from "./helpers";

const FIXTURE = path.resolve(__dirname, "../src/__fixtures__/sifen/fac_024-004-0049994.xml");

test.describe("sifen ingest", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("uploading the fixture XML saves it; uploading it again reports a duplicate", async ({ page }) => {
    for (const expected of ["Guardado", "Duplicado (ya existía)"]) {
      await page.goto("/sifen");
      await expect(page.getByRole("button", { name: /RUC 1234567-9/ }).first()).toBeVisible();
      await page.locator('input[type="file"]').setInputFiles(FIXTURE);
      const results = page.getByRole("list", { name: "Resultado de la carga" });
      await expect(results).toContainText(expected);
      await expect(results).toContainText("fac_024-004-0049994.xml");
    }
  });
});

/** DNIT mod-11 check digit (same as fiscal-py's mod11Dv; inlined to keep the spec dependency-free). */
const mod11Dv = (digits: string) => {
  let sum = 0;
  for (let i = digits.length - 1, w = 2; i >= 0; i--, w = w === 11 ? 2 : w + 1) sum += Number(digits[i]) * w;
  const r = sum % 11;
  return r > 1 ? 11 - r : 0;
};

test.describe("sifen AI suggestion", () => {
  requireE2eEnv();
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("suggest an entry for an uploaded XML, approve it and see the entry number", async ({ page }) => {
    // Own CDC, so this test does not collide with the ingest test above.
    const xml = readFileSync(FIXTURE, "utf-8");
    const cdc = /Id="(\d{44})"/.exec(xml)![1];
    const body = cdc.slice(0, 34) + String(Date.now() % 1e9).padStart(9, "0");
    const myCdc = body + mod11Dv(body);

    await page.goto("/sifen");
    await expect(page.getByRole("button", { name: /RUC 1234567-9/ }).first()).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({ name: "ai.xml", mimeType: "text/xml", buffer: Buffer.from(xml.replace(cdc, myCdc)) });
    await expect(page.getByRole("list", { name: "Resultado de la carga" })).toContainText("Guardado");

    const card = page.getByRole("article").filter({ hasText: `CDC ${myCdc}` });
    await card.getByRole("button", { name: "Sugerir asiento" }).click();
    const proposal = card.getByLabel("Asiento propuesto");
    await expect(proposal).toContainText("Reglas");
    await expect(proposal).toContainText(/Confianza \d+%/);
    await expect(proposal).toContainText("según reglas contables PY");
    await expect(card.getByLabel("Cuenta de la línea 2")).toHaveValue(/.+/);

    await card.getByRole("button", { name: "Aprobar y postear" }).click();
    const posted = page.getByRole("list", { name: "Asientos publicados" });
    await expect(posted).toContainText("Asiento AS-024-004-0049994 publicado");
    await expect(posted.getByRole("link", { name: /Ver asientos/ })).toHaveAttribute("href", "/asientos");
    await expect(page.getByRole("article").filter({ hasText: `CDC ${myCdc}` })).toHaveCount(0);
  });
});
