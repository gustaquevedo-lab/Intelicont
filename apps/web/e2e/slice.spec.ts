import { inflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv } from "./helpers";

const FIXTURE = path.resolve(__dirname, "../src/__fixtures__/sifen/fac_024-004-0049994.xml");

/** DNIT mod-11 check digit (same as fiscal-py's mod11Dv; inlined for spec independence). */
const mod11Dv = (digits: string) => {
  let sum = 0;
  for (let i = digits.length - 1, w = 2; i >= 0; i--, w = w === 11 ? 2 : w + 1) sum += Number(digits[i]) * w;
  const r = sum % 11;
  return r > 1 ? 11 - r : 0;
};

/** Name and content of the single entry in a ZIP created by fflate zipSync. */
function readSingleZipEntry(zip: Buffer) {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  expect(zip.readUInt16LE(eocd + 10)).toBe(1);
  const method = zip.readUInt16LE(8);
  const size = zip.readUInt32LE(18);
  const nameLen = zip.readUInt16LE(26);
  const extraLen = zip.readUInt16LE(28);
  const raw = zip.subarray(30 + nameLen + extraLen, 30 + nameLen + extraLen + size);
  return {
    name: zip.subarray(30, 30 + nameLen).toString("utf-8"),
    content: (method === 8 ? inflateRawSync(raw) : raw).toString("utf-8"),
  };
}

test.describe("vertical slice e2e", () => {
  requireE2eEnv();
  // Uses SIFEN user (RUC 1234567-9, default chart of accounts, open 2026-08, and manual purchase in 2026-06).
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("runs all 8 steps of §2: login/scope -> CoA -> SIFEN upload -> AI approve -> Libro IVA -> Form 104 -> Registro 955 ZIP -> reversal & audit", async ({ page }) => {
    // ─── Step 1: Session & Entity Scope ───
    await page.goto("/empresas");
    await expect(page.getByRole("button", { name: /RUC 1234567-9/ }).first()).toBeVisible();

    // ─── Step 2: Chart of Accounts & Seed Verification ───
    await page.goto("/cuentas");
    await expect(page.getByText("ACTIVO").first()).toBeVisible();

    // ─── Step 3: Upload received SIFEN XML with valid CDC ───
    const xml = readFileSync(FIXTURE, "utf-8");
    const originalCdc = /Id="(\d{44})"/.exec(xml)![1];
    const uniqueBody = originalCdc.slice(0, 34) + String((Date.now() * 1000 + Math.floor(Math.random() * 1000)) % 1e9).padStart(9, "0");
    const testCdc = uniqueBody + mod11Dv(uniqueBody);

    await page.goto("/sifen");
    await expect(page.getByRole("button", { name: /RUC 1234567-9/ }).first()).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: "slice-fixture.xml",
      mimeType: "text/xml",
      buffer: Buffer.from(xml.replace(originalCdc, testCdc)),
    });
    const results = page.getByRole("list", { name: "Resultado de la carga" });
    await expect(results).toContainText("Guardado");

    // ─── Step 4: AI suggestion (rule-based fallback in test) & Human approval ───
    const card = page.getByRole("article").filter({ hasText: `CDC ${testCdc}` });
    await card.getByRole("button", { name: "Sugerir asiento" }).click();
    const proposal = card.getByLabel("Asiento propuesto");
    await expect(proposal).toContainText("Reglas");
    await expect(card.getByLabel("Cuenta de la línea 2")).toHaveValue(/.+/);

    await card.getByRole("button", { name: "Aprobar y postear" }).click();
    const postedList = page.getByRole("list", { name: "Asientos publicados" });
    await expect(postedList).toContainText("Asiento AS-024-004-0049994 publicado");

    // ─── Step 5: Libro IVA Compras & Drill-Down to Posted Entry ───
    await page.goto("/libros");
    await expect(page.getByText(/TOTALES \(\d+ registros\)/)).toBeVisible();
    await page.getByLabel("Período").fill("2026-08");
    await expect(page.getByText("Libro IVA, Diario, Mayor y Sumas y Saldos — 2026-08")).toBeVisible();

    const ivaTable = page.getByRole("table", { name: "Libro IVA Compras" });
    const ivaRow = ivaTable.getByRole("row").filter({ hasText: `CDC ${testCdc}` });
    await expect(ivaRow).toContainText("024-004-0049994");
    await expect(ivaRow).toContainText("₲ 58.000");
    await expect(ivaRow).toContainText("₲ 5.273");

    // Drill down to the journal entry
    const entryLink = ivaRow.getByRole("link", { name: "024-004-0049994" });
    await entryLink.click();
    await expect(page.getByRole("heading", { name: /^Asiento / })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("estado")).toHaveText("Posteado");
    await expect(page.getByRole("region", { name: "Rastro de auditoría" })).toContainText("Asiento posteado");

    // ─── Step 6: Formulario 104 Matches Libro IVA ───
    await page.goto("/fiscal/formulario-104");
    await expect(page.getByRole("heading", { name: "Liquidación" })).toBeVisible();
    await page.getByLabel("Período").fill("2026-08");
    await expect(page.getByText("Agosto 2026")).toBeVisible();
    await expect(page.getByText("Cuadra con el Libro IVA")).toBeVisible({ timeout: 30_000 });

    // ─── Step 7: Download Registro de Comprobantes 955 ZIP ───
    await page.goto("/fiscal/registro-comprobantes");
    await expect(page.getByText("Los comprobantes electrónicos SIFEN no se incluyen")).toBeVisible();
    await expect(async () => {
      await page.getByLabel("Período").fill("2026-06");
      await expect(page.getByText("Junio 2026")).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });

    const filesRegion = page.getByRole("region", { name: "Archivos" });
    await expect(filesRegion).toContainText("1234567_REG_062026_V0001.zip");
    const downloadLink = filesRegion.getByRole("link", { name: "Descargar .zip" });

    const [download] = await Promise.all([page.waitForEvent("download"), downloadLink.click()]);
    expect(download.suggestedFilename()).toBe("1234567_REG_062026_V0001.zip");
    const zipBuffer = readFileSync((await download.path())!);
    const zipEntry = readSingleZipEntry(zipBuffer);
    expect(zipEntry.name).toBe("1234567_REG_062026_V0001.csv");
    // Verify non-electronic purchase exists in the file (e-Kuatia excluded)
    expect(zipEntry.content).toContain("Proveedor Agente E2E");

    // ─── Step 8: Reverse Journal Entry & Verify Audit Events ───
    await page.goto("/asientos");
    const entryListRow = page.getByRole("row").filter({ hasText: "AS-024-004-0049994" });
    await entryListRow.getByRole("link").click();

    await page.getByRole("button", { name: "Revertir" }).click();
    const dialog = page.getByRole("dialog", { name: "Revertir asiento" });
    await dialog.getByLabel("Motivo").fill("Reversión de prueba en vertical slice E2E");
    await dialog.getByRole("button", { name: "Confirmar reversión" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByTestId("estado")).toHaveText("Reversado");

    await page.goto("/auditoria");
    const auditTable = page.getByRole("table", { name: "Eventos de auditoría" });
    await expect(auditTable).toContainText("Asiento posteado", { timeout: 45_000 });
    await expect(auditTable).toContainText("Asiento revertido");
    await expect(auditTable).toContainText("Reversión de prueba en vertical slice E2E");
  });
});
