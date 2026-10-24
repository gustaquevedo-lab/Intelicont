import { inflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv } from "./helpers";

/** Name and content of the single entry of a ZIP written with sizes in the local header (fflate zipSync). */
function readSingleEntry(zip: Buffer) {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  expect(zip.readUInt16LE(eocd + 10)).toBe(1);
  const method = zip.readUInt16LE(8), size = zip.readUInt32LE(18), nameLen = zip.readUInt16LE(26), extraLen = zip.readUInt16LE(28);
  const raw = zip.subarray(30 + nameLen + extraLen, 30 + nameLen + extraLen + size);
  return { name: zip.subarray(30, 30 + nameLen).toString("utf-8"), content: (method === 8 ? inflateRawSync(raw) : raw).toString("utf-8") };
}

test.describe("registro de comprobantes", () => {
  requireE2eEnv();
  // global-setup seeds one non-electronic purchase in 06/2026 for the SIFEN user's entity (RUC 1234567-9).
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("downloads the month's .zip with the manual purchase row", async ({ page }) => {
    await page.goto("/fiscal/registro-comprobantes");
    await expect(page.getByText("Los comprobantes electrónicos SIFEN no se incluyen")).toBeVisible(); // hydrated
    await expect(async () => {
      await page.getByLabel("Período").fill("2026-06");
      await expect(page.getByText("Junio 2026")).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });

    const files = page.getByRole("region", { name: "Archivos" });
    await expect(files).toContainText("1234567_REG_062026_V0001.zip");
    await expect(page.getByLabel("Compras", { exact: true })).toHaveText("1");

    const link = files.getByRole("link", { name: "Descargar .zip" });
    const href = (await link.getAttribute("href"))!;
    expect(href).toMatch(/^\/api\/registro\/[0-9a-f-]{36}\/062026\?part=1$/);
    const [download] = await Promise.all([page.waitForEvent("download"), link.click()]);
    expect(download.suggestedFilename()).toBe("1234567_REG_062026_V0001.zip");
    const entry = readSingleEntry(readFileSync((await download.path())!));
    expect(entry.name).toBe("1234567_REG_062026_V0001.csv");
    expect(entry.content).toBe("2;11;80005427;Proveedor Agente E2E;109;10/06/2026;12345678;001-001-0000099;1100000;0;0;1100000;1;N;S;N;N;N;;\n");

    // Out-of-range part and an empty month: 404; an entity the user cannot see: 403.
    expect((await page.request.get(href.replace("part=1", "part=2"))).status()).toBe(404);
    expect((await page.request.get(href.replace("062026", "012020"))).status()).toBe(404);
    expect((await page.request.get(href.replace(/registro\/[0-9a-f-]{36}/, `registro/${crypto.randomUUID()}`))).status()).toBe(403);
  });
});
