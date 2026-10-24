import { describe, it, expect } from "vitest";
import { similitudCoseno, buscarNormativas } from "../lib/agent/rag-service";
import { ejecutarHerramientaContable } from "../lib/agent/tools";

describe("Agent RAG Legal Service", () => {
  it("calculates cosine similarity correctly", () => {
    // Identical vectors
    expect(similitudCoseno([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0, 5);
    // Orthogonal vectors
    expect(similitudCoseno([1, 0], [0, 1])).toBeCloseTo(0.0, 5);
    // Partial similarity
    expect(similitudCoseno([1, 1], [1, 0])).toBeCloseTo(Math.sqrt(0.5), 4);
    // Empty / mismatch vectors
    expect(similitudCoseno([], [1])).toBe(0.0);
  });

  it("finds Ley 6380 Art. 16 for non-deductible expenses query", async () => {
    const results = await buscarNormativas("gastos no deducibles donaciones multas Art 16", 3);
    expect(results.length).toBeGreaterThan(0);
    const top = results[0];
    expect(top.articulo).toContain("16");
    expect(top.titulo).toContain("Gastos No Deducibles");
    expect(top.fuente).toBe("Ley 6380/2019");
  });

  it("finds IVA rates and RG 90 when queried", async () => {
    const ivaResults = await buscarNormativas("tasas alicuotas IVA 10% 5% desglose", 2);
    expect(ivaResults.some((r) => r.articulo.includes("86"))).toBe(true);

    const rg90Results = await buscarNormativas("RG 90 talon presentacion formulario 241", 2);
    expect(rg90Results.some((r) => r.fuente.includes("RG 90"))).toBe(true);
  });

  it("finds perpetual fiscal calendar by RUC termination", async () => {
    const calResults = await buscarNormativas("vencimientos segun terminacion RUC", 2);
    expect(calResults.some((r) => r.fuente.includes("Calendario"))).toBe(true);
  });
});

describe("Agent Multi-Tenant Accounting Tools", () => {
  const dummyEntityId = "00000000-0000-0000-0000-000000000001";

  it("executes consultar_normativa_legal tool securely", async () => {
    const res = await ejecutarHerramientaContable(
      "consultar_normativa_legal",
      { query: "credito fiscal IVA adquisiciones" },
      dummyEntityId
    );
    expect(res.success).toBe(true);
    expect(Array.isArray(res.output)).toBe(true);
    const items = res.output as Array<{ articulo: string; fuente: string }>;
    expect(items.length).toBeGreaterThan(0);
  });

  it("proposes balanced double-entry with 10% IVA breakdown", async () => {
    const res = await ejecutarHerramientaContable(
      "proponer_asiento_contable",
      {
        descripcion: "Compra de útiles de oficina con factura contado",
        cuenta_debe: "5.2.1.01",
        cuenta_haber: "1.1.1.01",
        monto: 1100000,
        incluye_iva_10: true,
      },
      dummyEntityId
    );

    expect(res.success).toBe(true);
    const out = res.output as {
      totalDebe: number;
      totalHaber: number;
      balanceado: boolean;
      lineas: Array<{ codigo: string; debe: number; haber: number }>;
    };

    expect(out.balanceado).toBe(true);
    expect(out.totalDebe).toBe(1100000);
    expect(out.totalHaber).toBe(1100000);

    // Debe incluir desglose de IVA (100.000) y Base Neta (1.000.000)
    const lineaIva = out.lineas.find((l) => l.codigo === "1.1.3.01");
    expect(lineaIva).toBeDefined();
    expect(lineaIva?.debe).toBe(100000); // 1.100.000 / 11 = 100.000
    const lineaGasto = out.lineas.find((l) => l.codigo === "5.2.1.01");
    expect(lineaGasto?.debe).toBe(1000000); // 1.100.000 - 100.000 = 1.000.000
  });

  it("rejects invalid amounts in proponer_asiento_contable", async () => {
    const res = await ejecutarHerramientaContable(
      "proponer_asiento_contable",
      {
        descripcion: "Monto inválido",
        cuenta_debe: "5.2.1.01",
        cuenta_haber: "1.1.1.01",
        monto: -500,
      },
      dummyEntityId
    );
    expect(res.success).toBe(false);
  });
});
