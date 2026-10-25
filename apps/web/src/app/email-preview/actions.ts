"use server";

import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendFiscalAlertEmail,
  renderWelcomeEmailHtml,
  renderPasswordResetEmailHtml,
  renderFiscalAlertEmailHtml,
} from "@/lib/email-service";

export async function getEmailHtmlTemplatesAction() {
  const welcome = renderWelcomeEmailHtml({
    name: "Lic. Carlos Benítez",
    entityName: "Estudio Contable Benítez & Asociados",
    trialDays: 14,
  });

  const reset = renderPasswordResetEmailHtml({
    resetUrl: "https://app.intelicont.com.py/restablecer-password?token=tok-demo-seguridad-2026",
  });

  const alert = renderFiscalAlertEmailHtml({
    entityName: "Importadora del Este S.A.",
    obligation: "Registro de Comprobantes (RG 90)",
    dueDate: "15 de Noviembre de 2026",
  });

  return { welcome, reset, alert };
}

export async function sendLiveTestEmailAction(data: {
  to: string;
  template: "welcome" | "reset" | "alert";
}) {
  try {
    const to = data.to.trim().toLowerCase();
    if (!to || !to.includes("@")) {
      return { success: false, error: "Ingresá un correo electrónico válido" };
    }

    if (data.template === "welcome") {
      const res = await sendWelcomeEmail({
        to,
        name: "Lic. Carlos Benítez",
        entityName: "Estudio Contable Benítez & Asociados",
        trialDays: 14,
      });
      return res;
    }

    if (data.template === "reset") {
      const res = await sendPasswordResetEmail({
        to,
        resetUrl: "https://app.intelicont.com.py/restablecer-password?token=tok-demo-seguridad-2026",
      });
      return res;
    }

    if (data.template === "alert") {
      const res = await sendFiscalAlertEmail({
        to,
        entityName: "Importadora del Este S.A.",
        obligation: "Registro de Comprobantes (RG 90)",
        dueDate: "15 de Noviembre de 2026",
      });
      return res;
    }

    return { success: false, error: "Plantilla no válida" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al enviar correo de prueba",
    };
  }
}
