import { describe, it, expect } from "vitest";
import {
  getFirmaLimits,
  validarLimiteUsuarios,
  validarLimiteClientes,
  PLANES_BASE,
} from "../lib/plans";

describe("PILAR 4: Control de Cuotas y Feature Flags por Tenant", () => {
  it("obtiene límites por defecto del plan base", () => {
    const starterLimits = getFirmaLimits("starter");
    expect(starterLimits.planId).toBe("starter");
    expect(starterLimits.maxUsuarios).toBe(2);
    expect(starterLimits.maxClientes).toBe(10);
    expect(starterLimits.tieneIa).toBe(false);

    const proLimits = getFirmaLimits("pro");
    expect(proLimits.maxUsuarios).toBe(5);
    expect(proLimits.maxClientes).toBe(50);
    expect(proLimits.tieneIa).toBe(true);
  });

  it("combina cuotas del plan base con overrides en JSON (snake_case y camelCase)", () => {
    const overrideJson = JSON.stringify({
      max_clientes: 80,
      tiene_ia: true,
      custom_module: true,
    });

    const limits = getFirmaLimits("starter", overrideJson);

    // Debe conservar valores base no sobreescritos
    expect(limits.maxUsuarios).toBe(2);
    // Debe aplicar los overrides
    expect(limits.maxClientes).toBe(80);
    expect(limits.tieneIa).toBe(true);
    expect(limits.features.custom_module).toBe(true);
  });

  it("bloquea creación de usuarios si excede el límite del plan", () => {
    const limits = getFirmaLimits("starter"); // maxUsuarios = 2

    const check1 = validarLimiteUsuarios(1, limits);
    expect(check1.allowed).toBe(true);

    const check2 = validarLimiteUsuarios(2, limits);
    expect(check2.allowed).toBe(false);
    expect(check2.reason).toContain("Límite de usuarios alcanzado (2)");
  });

  it("permite creación de usuarios si el override amplió el límite", () => {
    const overrideJson = JSON.stringify({ max_usuarios: 10 });
    const limits = getFirmaLimits("starter", overrideJson);

    const check = validarLimiteUsuarios(5, limits);
    expect(check.allowed).toBe(true);
  });

  it("bloquea creación de clientes si excede el límite del plan", () => {
    const limits = getFirmaLimits("starter"); // maxClientes = 10

    const checkOk = validarLimiteClientes(9, limits);
    expect(checkOk.allowed).toBe(true);

    const checkFail = validarLimiteClientes(10, limits);
    expect(checkFail.allowed).toBe(false);
    expect(checkFail.reason).toContain("Límite de clientes alcanzado (10)");
  });
});
