import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getExchangeRates, calcularDiferenciaCambio } from "../lib/fx/dolarpy-service";

describe("Paso 4: Multimoneda con Cotizaciones Oficiales", () => {
  let repo: typeof import("@ledger/db/repository");
  const prevUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    vi.resetModules();
    const db = await import("@ledger/db/index");
    db.getDb();
    repo = await import("@ledger/db/repository");
  });

  afterAll(() => {
    if (prevUrl) process.env.DATABASE_URL = prevUrl;
  });

  it("obtiene cotizaciones oficiales con tasas válidas para PY", async () => {
    const rates = await getExchangeRates();
    expect(rates.length).toBeGreaterThanOrEqual(4);

    const usd = rates.find((r) => r.moneda === "USD");
    expect(usd).toBeDefined();
    expect(usd?.compra).toBeGreaterThan(5000);
    expect(usd?.venta).toBeGreaterThan(5000);
    expect(usd?.simbolo).toBe("US$");

    const eur = rates.find((r) => r.moneda === "EUR");
    expect(eur).toBeDefined();
    expect(eur?.compra).toBeGreaterThan(8000);
  });

  it("calcula la diferencia de cambio para un activo (ganancia cuando sube cotización)", () => {
    const result = calcularDiferenciaCambio({
      moneda: "USD",
      montoME: 10000,
      tasaOrigen: 7400,
      tasaCierre: 7900,
      esActivo: true,
    });

    expect(result.montoOrigenPYG).toBe(74000000);
    expect(result.montoCierrePYG).toBe(79000000);
    expect(result.diferenciaPYG).toBe(5000000);
    expect(result.esGanancia).toBe(true);
    expect(result.descripcion).toContain("Ganancia de Cambio");
  });

  it("calcula la diferencia de cambio para un pasivo (pérdida cuando sube cotización)", () => {
    const result = calcularDiferenciaCambio({
      moneda: "USD",
      montoME: 10000,
      tasaOrigen: 7400,
      tasaCierre: 7900,
      esActivo: false,
    });

    expect(result.montoOrigenPYG).toBe(74000000);
    expect(result.montoCierrePYG).toBe(79000000);
    expect(result.diferenciaPYG).toBe(5000000);
    expect(result.esGanancia).toBe(false);
    expect(result.descripcion).toContain("Pérdida de Cambio");
  });

  it("obtiene transacciones en ME del mayor y genera asiento de ajuste", async () => {
    const entityId = "00000000-0000-0000-0000-000000000001";
    const txs = await repo.getFXTransactions(entityId);
    expect(txs.length).toBeGreaterThan(0);
    expect(txs[0].currencyCode).toBeDefined();
    expect(txs[0].fxRate).toBeGreaterThan(0);

    const ajuste = await repo.createFXAdjustmentEntry(entityId, {
      currencyCode: "USD",
      amountME: 10000,
      fxRateCurrent: 7980,
      diffAmountPYG: 500000,
      isGain: true,
    });

    expect(ajuste.success).toBe(true);
    expect(ajuste.entryId).toBeDefined();
    expect(ajuste.message).toContain("diferencia de cambio generado");
  });
});
