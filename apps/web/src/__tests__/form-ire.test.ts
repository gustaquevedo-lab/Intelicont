// @vitest-environment node
import { describe, expect, it } from "vitest";
import { calculateForm500, calculateForm501Simple } from "@intelicont/ledger/form-ire";

describe("Formularios IRE (Ley 6380/19)", () => {
  it("calculates Formulario 500 (IRE General) net income and 10% tax", () => {
    const res = calculateForm500({
      entityId: "ent-1",
      year: 2026,
      ingresosOperativos: 500_000_000,
      otrosIngresos: 20_000_000,
      costoVentas: 300_000_000,
      gastosAdministracion: 40_000_000,
      gastosPersonalIps: 60_000_000,
      depreciacionesBienesUso: 15_000_000,
      otrosGastosDeducibles: 5_000_000,
      gastosNoDeducibles: 10_000_000, // Ajuste fiscal positivo
      rentasExentas: 0,
      retencionesSufridas: 2_000_000,
      anticiposIngresados: 3_000_000,
    });

    expect(res.rubro1_TotalIngresos).toBe(520_000_000);
    expect(res.rubro2_TotalCostos).toBe(300_000_000);
    expect(res.rubro3_RentaBruta).toBe(220_000_000);
    expect(res.rubro3_TotalGastos).toBe(120_000_000); // 40M + 60M + 15M + 5M
    expect(res.rubro4_RentaNetaContable).toBe(100_000_000); // 220M - 120M
    expect(res.rubro4_RentaNetaImponible).toBe(110_000_000); // 100M + 10M no deducibles
    expect(res.rubro5_ImpuestoLiquidado).toBe(11_000_000); // 10% de 110M
    expect(res.rubro6_CreditosFiscales).toBe(5_000_000); // 2M retenciones + 3M anticipos
    expect(res.rubro6_SaldoAPagar).toBe(6_000_000); // 11M - 5M
    expect(res.rubro6_SaldoAFavor).toBe(0);
  });

  it("calculates Formulario 501 (IRE Simple) comparing real vs presumptive income", () => {
    // Caso 1: Renta real (20M) es menor que presunta (30M)
    const c1 = calculateForm501Simple({
      year: 2026,
      ingresosBrutos: 100_000_000,
      egresosReales: 80_000_000,
      retencionesSufridas: 500_000,
    });
    expect(c1.rentaReal).toBe(20_000_000);
    expect(c1.rentaPresunta).toBe(30_000_000); // 30% de 100M
    expect(c1.baseImponible).toBe(20_000_000); // Menor entre ambas
    expect(c1.impuestoLiquidado).toBe(2_000_000); // 10%
    expect(c1.saldoAPagar).toBe(1_500_000); // 2M - 500k

    // Caso 2: Renta presunta (15M) es menor que renta real (35M)
    const c2 = calculateForm501Simple({
      year: 2026,
      ingresosBrutos: 50_000_000,
      egresosReales: 15_000_000,
    });
    expect(c2.rentaReal).toBe(35_000_000);
    expect(c2.rentaPresunta).toBe(15_000_000); // 30% de 50M
    expect(c2.baseImponible).toBe(15_000_000); // Menor entre ambas
    expect(c2.impuestoLiquidado).toBe(1_500_000);
    expect(c2.saldoAPagar).toBe(1_500_000);
  });
});
