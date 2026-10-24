import { test, expect } from "@playwright/test";
import { STORAGE_STATE_SIFEN, requireE2eEnv } from "./helpers";

test.describe("manual document", () => {
  requireE2eEnv();
  // The SIFEN user's entity has the default chart, an open 08/2026 and a supplier with an IVA 30 % profile.
  test.use({ storageState: STORAGE_STATE_SIFEN });

  test("a purchase from a supplier with an IVA 30 % profile previews the retention and posts", async ({ page }) => {
    await page.goto("/documentos/nuevo");
    const form = page.getByRole("form", { name: "Comprobante manual" });
    await expect(form).toBeVisible();
    await form.getByLabel("Tercero").selectOption({ label: "Proveedor Agente E2E (80005427-0)" });
    await form.getByLabel("Timbrado", { exact: true }).fill("12345678");
    await form.getByLabel("Número", { exact: true }).fill("0010010000042");
    await expect(form.getByLabel("Número", { exact: true })).toHaveValue("001-001-0000042");
    await form.getByLabel("Fecha").fill("2026-08-15");
    await form.getByLabel("Gravado 10 % (IVA incluido)").fill("11000000");
    await expect(form.getByLabel("Total", { exact: true })).toHaveText("₲ 11.000.000");

    const preview = page.getByRole("region", { name: "Vista previa" });
    await expect(preview).toContainText("Retención de IVA 30 % sobre ₲ 1.000.000");
    await expect(preview).toContainText("₲ 300.000");
    await expect(preview.getByLabel("Neto")).toHaveText("₲ 10.700.000");

    const save = form.getByRole("button", { name: "Guardar y contabilizar" });
    await save.click();
    await expect(form.getByRole("status")).toContainText("Comprobante guardado y asiento contabilizado");
    await expect(save).toBeDisabled();
  });
});
