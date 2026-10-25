import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendFiscalAlertEmail,
  getLastSentEmailForTest,
  resetEmailMockStore,
} from "../lib/email-service";

describe("Email Service Transaccional (Resend & Fallback)", () => {
  beforeEach(() => {
    resetEmailMockStore();
  });

  it("1. Envía email de bienvenida de forma simulada y almacena el registro", async () => {
    const res = await sendWelcomeEmail({
      to: "admin@estudio.com.py",
      name: "Lic. Carlos Benítez",
      entityName: "Estudio Contable Benítez & Asoc.",
      trialDays: 14,
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeDefined();

    const last = getLastSentEmailForTest();
    expect(last).toBeDefined();
    expect(last?.to).toBe("admin@estudio.com.py");
    expect(last?.subject).toContain("Bienvenido a InteliCont");
    expect(last?.body).toContain("14 días");
    expect(last?.body).toContain("Estudio Contable Benítez & Asoc.");
  });

  it("2. Envía email de recuperación de contraseña con token/URL de restablecimiento", async () => {
    const res = await sendPasswordResetEmail({
      to: "carlos@estudio.com.py",
      resetUrl: "https://app.intelicont.com.py/restablecer-password?token=tok-12345",
    });

    expect(res.success).toBe(true);
    const last = getLastSentEmailForTest();
    expect(last?.to).toBe("carlos@estudio.com.py");
    expect(last?.subject).toContain("Recuperación de Contraseña");
    expect(last?.body).toContain("token=tok-12345");
  });

  it("3. Envía alerta de vencimiento fiscal DNIT", async () => {
    const res = await sendFiscalAlertEmail({
      to: "carlos@estudio.com.py",
      entityName: "Importadora del Este S.A.",
      obligation: "Registro de Comprobantes (RG 90)",
      dueDate: "2026-05-15",
    });

    expect(res.success).toBe(true);
    const last = getLastSentEmailForTest();
    expect(last?.subject).toContain("Vencimiento Fiscal Próximo");
    expect(last?.body).toContain("RG 90");
    expect(last?.body).toContain("2026-05-15");
  });
});
