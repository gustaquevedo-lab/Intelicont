import { describe, it, expect, beforeEach } from "vitest";
import {
  createTenantAtomic,
  createUserWithLimits,
  cambiarPasswordUsuario,
  impersonateTenant,
  getSystemVitals,
  getSuperadminStats,
  resetSuperadminMockStore,
} from "../lib/superadmin-service";

describe("PILAR 3: SuperAdmin Operations & Credentials Management", () => {
  beforeEach(() => {
    resetSuperadminMockStore();
  });

  it("crea atómicamente un tenant y su admin con contraseña temporal y debeCambiarPassword=true", async () => {
    const input = {
      ruc: "80012345-6",
      legalName: "Auditoría & Consultoría Guaraní S.A.",
      tradeName: "Consultora Guaraní",
      adminEmail: "director@guarani.com.py",
      adminName: "Lic. Carlos Benítez",
      plan: "pro",
      featuresOverride: { max_usuarios: 8 },
    };

    const result = await createTenantAtomic(input);

    expect(result.entity.id).toBeDefined();
    expect(result.entity.ruc).toBe("80012345-6");
    expect(result.entity.plan).toBe("pro");

    expect(result.user.id).toBeDefined();
    expect(result.user.email).toBe("director@guarani.com.py");
    expect(result.user.debeCambiarPassword).toBe(true);

    // Contraseña temporal legible y segura
    expect(result.passwordTemporal).toBeDefined();
    expect(result.passwordTemporal.length).toBeGreaterThanOrEqual(10);
    expect(result.passwordTemporal).toMatch(/[A-Za-z0-9]/);
  });

  it("verifica límites de usuarios por plan al crear un usuario en el tenant", async () => {
    // 1. Crear tenant en plan starter (límite: 2 usuarios)
    const { entity } = await createTenantAtomic({
      ruc: "80099999-1",
      legalName: "Pequeño Estudio SRL",
      adminEmail: "socio1@estudio.py",
      adminName: "Socio 1",
      plan: "starter",
    });

    // 2. Segundo usuario (debe permitirse, 2 de 2)
    const user2 = await createUserWithLimits({
      entityId: entity.id,
      email: "asistente@estudio.py",
      name: "Asistente Contable",
    });
    expect(user2.success).toBe(true);
    expect(user2.user?.debeCambiarPassword).toBe(true);

    // 3. Tercer usuario (debe bloquearse por exceder cuota de 2)
    const user3 = await createUserWithLimits({
      entityId: entity.id,
      email: "extra@estudio.py",
      name: "Tercer Usuario",
    });
    expect(user3.success).toBe(false);
    expect(user3.error).toContain("Límite de usuarios alcanzado (2)");
  });

  it("permite cambiar contraseña y limpia debeCambiarPassword a false", async () => {
    const { user, passwordTemporal } = await createTenantAtomic({
      ruc: "80055555-2",
      legalName: "Holding Financiero S.A.",
      adminEmail: "cfo@holding.py",
      adminName: "CFO Holding",
      plan: "inhouse",
    });

    expect(user.debeCambiarPassword).toBe(true);

    const changeRes = await cambiarPasswordUsuario({
      userId: user.id,
      passwordActual: passwordTemporal,
      passwordNueva: "NuevaContrasenaSegura2026!",
    });

    expect(changeRes.success).toBe(true);
    expect(changeRes.user?.debeCambiarPassword).toBe(false);
  });

  it("genera token de impersonación transparente de tenant en 1-click", async () => {
    const { entity, user } = await createTenantAtomic({
      ruc: "80077777-3",
      legalName: "Impersonate Test Corp",
      adminEmail: "target@corp.py",
      adminName: "Target User",
      plan: "pro",
    });

    const imp = await impersonateTenant({
      entityId: entity.id,
      superAdminEmail: "superadmin@intelicont.com.py",
    });

    expect(imp.success).toBe(true);
    expect(imp.token).toBeDefined();
    expect(imp.impersonatedBy).toBe("superadmin@intelicont.com.py");
    expect(imp.targetEntity.id).toBe(entity.id);
    expect(imp.targetUser.email).toBe(user.email);
  });

  it("recupera métricas de salud (System Vitals) con latencia y estado", async () => {
    const vitals = await getSystemVitals();

    expect(vitals.database).toBeDefined();
    expect(vitals.database.status).toMatch(/healthy|degraded|down/);
    expect(typeof vitals.database.latencyMs).toBe("number");

    expect(vitals.ai).toBeDefined();
    expect(vitals.ai.status).toMatch(/healthy|degraded|down/);

    expect(vitals.cacheFiscal).toBeDefined();
    expect(vitals.storage).toBeDefined();
    expect(vitals.timestamp).toBeDefined();
  });

  it("obtiene estadísticas consolidadas para la consola SuperAdmin", async () => {
    await createTenantAtomic({
      ruc: "80011111-1",
      legalName: "Empresa 1",
      adminEmail: "admin1@e1.py",
      plan: "pro",
    });

    await createTenantAtomic({
      ruc: "80022222-2",
      legalName: "Empresa 2",
      adminEmail: "admin2@e2.py",
      plan: "starter",
    });

    const stats = await getSuperadminStats();

    expect(stats.totalTenants).toBeGreaterThanOrEqual(2);
    expect(stats.activeTenants).toBeGreaterThanOrEqual(2);
    expect(stats.totalUsers).toBeGreaterThanOrEqual(2);
    expect(stats.planDistribution.pro).toBeGreaterThanOrEqual(1);
    expect(stats.planDistribution.starter).toBeGreaterThanOrEqual(1);
    expect(typeof stats.pendingErrorsCount).toBe("number");
  });
});
