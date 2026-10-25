// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  calculateAssetDepreciation,
  generateDepreciationEntryLines,
  CATEGORY_USEFUL_LIFE_MONTHS,
} from "@intelicont/ledger/fixed-assets";

describe("Fixed Assets Engine (RG 77/2020 IRE)", () => {
  it("has official categories with correct statutory life spans", () => {
    expect(CATEGORY_USEFUL_LIFE_MONTHS.buildings.months).toBe(480); // 40 años
    expect(CATEGORY_USEFUL_LIFE_MONTHS.vehicles.months).toBe(60); // 5 años
    expect(CATEGORY_USEFUL_LIFE_MONTHS.computers.months).toBe(48); // 4 años
    expect(CATEGORY_USEFUL_LIFE_MONTHS.furniture.months).toBe(120); // 10 años
  });

  it("calculates linear monthly depreciation and net book value correctly", () => {
    // Toyota Hilux comprada el 2024-01-01 por 150.000.000 Gs, 5 años (60 meses), residual 15.000.000 Gs
    const res = calculateAssetDepreciation({
      initialCost: 150_000_000,
      residualValue: 15_000_000,
      purchaseDate: "2024-01-01",
      usefulLifeMonths: 60,
      asOfDate: "2025-01-01", // 12 meses después
    });

    expect(res.revaluedCost).toBe(150_000_000);
    expect(res.depreciableBase).toBe(135_000_000);
    expect(res.monthlyDepreciation).toBe(2_250_000); // 135M / 60
    expect(res.monthsElapsed).toBe(12);
    expect(res.effectiveMonths).toBe(12);
    expect(res.accumulatedDepreciation).toBe(27_000_000); // 2.25M * 12
    expect(res.netBookValue).toBe(123_000_000); // 150M - 27M
    expect(res.isFullyDepreciated).toBe(false);
  });

  it("applies BCP revaluation coefficient when provided", () => {
    const res = calculateAssetDepreciation({
      initialCost: 100_000_000,
      residualValue: 0,
      purchaseDate: "2024-01-01",
      usefulLifeMonths: 100,
      asOfDate: "2024-06-01", // 5 meses
      revaluationCoefficient: 1.05, // 5% de revalúo oficial
    });

    expect(res.revaluedCost).toBe(105_000_000);
    expect(res.monthlyDepreciation).toBe(1_050_000); // 105M / 100
    expect(res.accumulatedDepreciation).toBe(5_250_000); // 1.05M * 5
    expect(res.netBookValue).toBe(99_750_000);
  });

  it("caps accumulated depreciation at depreciable base and does not exceed residual value", () => {
    // Activo adquirido hace 70 meses con vida útil de 60 meses
    const res = calculateAssetDepreciation({
      initialCost: 60_000_000,
      residualValue: 6_000_000,
      purchaseDate: "2018-01-01",
      usefulLifeMonths: 60,
      asOfDate: "2024-01-01", // 72 meses después
    });

    expect(res.depreciableBase).toBe(54_000_000);
    expect(res.effectiveMonths).toBe(60);
    expect(res.accumulatedDepreciation).toBe(54_000_000);
    expect(res.netBookValue).toBe(6_000_000); // Nunca baja del residual
    expect(res.isFullyDepreciated).toBe(true);
  });

  it("generates balanced double-entry lines for journal entry", () => {
    const lines = generateDepreciationEntryLines({
      assetName: "Notebooks Dell",
      assetCode: "AF-002",
      amount: 625_000,
      depreciationAccountId: "acc-gasto-id",
      accumulatedAccountId: "acc-dep-acum-id",
      periodLabel: "05/2026",
    });

    expect(lines).toHaveLength(2);
    expect(lines[0].debit).toBe(625_000);
    expect(lines[0].credit).toBe(0);
    expect(lines[0].accountId).toBe("acc-gasto-id");

    expect(lines[1].debit).toBe(0);
    expect(lines[1].credit).toBe(625_000);
    expect(lines[1].accountId).toBe("acc-dep-acum-id");

    // Doble partida balanceada
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDebit).toBe(totalCredit);
  });
});
