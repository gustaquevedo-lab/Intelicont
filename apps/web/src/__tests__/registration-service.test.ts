import { describe, it, expect, beforeEach } from "vitest";
import {
  registerSelfServiceTenant,
  resetRegistrationMockStore,
} from "../lib/registration-service";

describe("Auto-Registro de Tenants (Self-Service Onboarding)", () => {
  beforeEach(() => {
    resetRegistrationMockStore();
  });

  it("1. Registra un nuevo tenant y administrador con plan starter (14 días gratis)", async () => {
    const res = await registerSelfServiceTenant({
      ruc: "80012345-0",
      legalName: "Estudio Contable Guaraní S.A.",
      adminEmail: "contacto@estudioguarani.com.py",
      password: "PasswordSeguro2026!",
      adminName: "Lic. Marcos Benítez",
    });

    expect(res.success).toBe(true);
    expect(res.entity).toBeDefined();
    expect(res.entity.ruc).toBe("80012345-0");
    expect(res.entity.plan).toBe("starter");
    expect(res.user).toBeDefined();
    expect(res.user.email).toBe("contacto@estudioguarani.com.py");
    expect(res.user.debeCambiarPassword).toBe(false);
  });

  it("2. Rechaza registro con RUC inválido", async () => {
    const res = await registerSelfServiceTenant({
      ruc: "123", // RUC inválido
      legalName: "Empresa Falsa",
      adminEmail: "test@falsa.com.py",
      password: "PasswordSeguro2026!",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("RUC");
  });

  it("3. Rechaza contraseña menor a 8 caracteres", async () => {
    const res = await registerSelfServiceTenant({
      ruc: "80012345-0",
      legalName: "Empresa Corta",
      adminEmail: "test@corta.com.py",
      password: "123",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("contraseña");
  });

  it("4. Impide el registro duplicado de una misma empresa por RUC", async () => {
    await registerSelfServiceTenant({
      ruc: "80099999-9",
      legalName: "Firma Original",
      adminEmail: "admin@original.com.py",
      password: "PasswordSeguro2026!",
    });

    const dup = await registerSelfServiceTenant({
      ruc: "80099999-9",
      legalName: "Firma Duplicada",
      adminEmail: "otro@original.com.py",
      password: "PasswordSeguro2026!",
    });

    expect(dup.success).toBe(false);
    expect(dup.error).toContain("ya se encuentra registrado");
  });

  it("5. Impide el registro si el email del administrador ya existe", async () => {
    await registerSelfServiceTenant({
      ruc: "80011111-1",
      legalName: "Firma Uno",
      adminEmail: "admin@duplicado.com.py",
      password: "PasswordSeguro2026!",
    });

    const dup = await registerSelfServiceTenant({
      ruc: "80022222-2",
      legalName: "Firma Dos",
      adminEmail: "admin@duplicado.com.py",
      password: "PasswordSeguro2026!",
    });

    expect(dup.success).toBe(false);
    expect(dup.error).toContain("correo electrónico ya está registrado");
  });
});
