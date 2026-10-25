import { randomUUID } from "node:crypto";

export interface EmailRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: Date;
  simulated: boolean;
}

// In-memory store for tests and development without API key
let sentEmailsStore: EmailRecord[] = [];

export function resetEmailMockStore(): void {
  sentEmailsStore = [];
}

export function getLastSentEmailForTest(): EmailRecord | undefined {
  return sentEmailsStore[sentEmailsStore.length - 1];
}

/**
 * Función interna genérica para despachar emails con Resend o fallback a logs.
 */
async function dispatchEmail(params: {
  to: string;
  subject: string;
  bodyText: string;
  html?: string;
}): Promise<{ success: boolean; id: string; simulated: boolean }> {
  const emailId = randomUUID();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "InteliCont <notificaciones@intelicont.com.py>";

  if (apiKey && process.env.NODE_ENV !== "test") {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [params.to],
          subject: params.subject,
          text: params.bodyText,
          html: params.html || `<div style="font-family: sans-serif; line-height: 1.6;">${params.bodyText.replace(/\n/g, "<br/>")}</div>`,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        return { success: true, id: data.id || emailId, simulated: false };
      }
    } catch (err) {
      console.error("[EmailService] Error enviando con Resend:", err);
    }
  }

  // Fallback a log en consola y mock store
  console.log(`\n================= EMAIL ENVIADO (SIMULADO) =================\nPara: ${params.to}\nAsunto: ${params.subject}\n\n${params.bodyText}\n============================================================\n`);

  const record: EmailRecord = {
    id: emailId,
    to: params.to,
    subject: params.subject,
    body: params.bodyText,
    sentAt: new Date(),
    simulated: true,
  };
  sentEmailsStore.push(record);

  return { success: true, id: emailId, simulated: true };
}

function getEmailLayout(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Branding -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); text-align: left;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">Inteli<span style="color: #60a5fa;">Cont</span></span>
                    <span style="display: block; font-size: 11px; color: #bfdbfe; font-weight: 500; margin-top: 2px;">Contabilidad Inteligente & Fiscalidad DNIT</span>
                  </td>
                  <td align="right">
                    <span style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #ffffff; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px;">
                      🇵🇾 Paraguay
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">InteliCont S.A.S. — Sistema Contable y Fiscal Paraguayo</p>
              <p style="margin: 0 0 6px 0;">Soporte WhatsApp: +595 994 516360 · Asunción, Paraguay</p>
              <p style="margin: 0; color: #94a3b8;">Si no reconocés este correo o necesitás ayuda, podés escribir a soporte@intelicont.com.py</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Envía el correo de bienvenida al registrarse en el período de prueba.
 */
export async function sendWelcomeEmail(input: {
  to: string;
  name?: string | null;
  entityName: string;
  trialDays?: number;
}): Promise<{ success: boolean; id: string; simulated: boolean }> {
  const days = input.trialDays ?? 14;
  const name = input.name || "Colega";
  const subject = `¡Bienvenido a InteliCont, ${input.entityName}! (Prueba de ${days} días activa)`;
  const bodyText = `Hola ${name},\n\nTe damos la bienvenida a InteliCont. Tu estudio/empresa "${input.entityName}" ha sido dada de alta exitosamente con un período de prueba gratuito de ${days} días.\n\nPodés ingresar en cualquier momento en:\nhttps://app.intelicont.com.py/login\n\n¿Qué podés hacer ahora?\n1. Importar tus comprobantes electrónicos SIFEN en formato XML.\n2. Cargar tu extracto bancario en CSV/Excel para conciliación automática.\n3. Consultar a tu Copilot Contable Inteligente con memoria RAG normativa.\n\nSi necesitás asistencia técnica o una demostración guiada, podés escribirnos por WhatsApp al +595 994 516360.\n\nAtentamente,\nEl equipo de InteliCont Paraguay`;

  const html = getEmailLayout(
    "Bienvenido a InteliCont",
    `<h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px;">¡Hola, ${name}! 👋</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
      Te damos la bienvenida oficial a <strong>InteliCont</strong>. La cuenta de tu estudio/empresa <strong>${input.entityName}</strong> ha sido activada con <strong>${days} días de prueba gratuita</strong> en el Plan Starter.
    </p>

    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
      <h3 style="margin-top: 0; font-size: 13px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
        🚀 ¿Por dónde empezar hoy?
      </h3>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e3a8a; line-height: 1.7;">
        <li><strong>Importación SIFEN:</strong> Subí tus XML de compras y ventas para contabilización automática.</li>
        <li><strong>Conciliación Bancaria:</strong> Importá extractos de Itaú, Continental o GNB en segundos.</li>
        <li><strong>Copilot Fiscal IA:</strong> Presioná <code>⌘J</code> en la app para consultar cualquier norma DNIT.</li>
      </ul>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="https://app.intelicont.com.py/login" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
        Ingresar al Panel de Control →
      </a>
    </div>

    <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin: 0;">
      ¿Preferís una demostración personalizada? Contactanos directamente por <a href="https://wa.me/595994516360" style="color: #2563eb; text-decoration: none; font-weight: 600;">WhatsApp al +595 994 516360</a>.
    </p>`
  );

  return dispatchEmail({
    to: input.to,
    subject,
    bodyText,
    html,
  });
}

/**
 * Envía el enlace seguro para recuperación de contraseña.
 */
export async function sendPasswordResetEmail(input: {
  to: string;
  resetUrl: string;
}): Promise<{ success: boolean; id: string; simulated: boolean }> {
  const subject = "Recuperación de Contraseña — InteliCont";
  const bodyText = `Hola,\n\nRecibimos una solicitud para restablecer la contraseña de tu cuenta en InteliCont.\n\nPara definir una nueva contraseña, hacé clic en el siguiente enlace seguro (válido por 1 hora):\n${input.resetUrl}\n\nSi no solicitaste este cambio, podés ignorar este correo de forma segura.\n\nAtentamente,\nSeguridad InteliCont`;

  const html = getEmailLayout(
    "Recuperación de Contraseña",
    `<h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Restablecer Contraseña 🔒</h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      Recibimos una solicitud para restablecer el acceso a tu cuenta de InteliCont. Hacé clic en el siguiente botón seguro para crear una nueva contraseña:
    </p>

    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${input.resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
        Crear Nueva Contraseña →
      </a>
    </div>

    <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
      <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.4;">
        Este enlace es de uso único y tiene una validez de <strong>1 hora</strong> por motivos de seguridad. Si el botón no funciona, copiá este link en tu navegador:<br/>
        <span style="color: #2563eb; word-break: break-all;">${input.resetUrl}</span>
      </p>
    </div>

    <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin: 0;">
      Si vos no solicitaste este cambio, no es necesario hacer nada. Tu contraseña actual sigue siendo segura.
    </p>`
  );

  return dispatchEmail({
    to: input.to,
    subject,
    bodyText,
    html,
  });
}

/**
 * Envía una alerta de vencimiento fiscal del calendario DNIT.
 */
export async function sendFiscalAlertEmail(input: {
  to: string;
  entityName: string;
  obligation: string;
  dueDate: string;
}): Promise<{ success: boolean; id: string; simulated: boolean }> {
  const subject = `⚠️ Vencimiento Fiscal Próximo: ${input.obligation} (${input.entityName})`;
  const bodyText = `Estimado/a,\n\nTe recordamos que la obligación tributaria "${input.obligation}" para el contribuyente "${input.entityName}" tiene fecha límite de presentación el ${input.dueDate}.\n\nTe recomendamos verificar en InteliCont que todos los comprobantes del período estén registrados y balanceados:\nhttps://app.intelicont.com.py/calendario\n\nAtentamente,\nAlertas Fiscales InteliCont`;

  const html = getEmailLayout(
    "Alerta de Vencimiento Fiscal",
    `<div style="display: inline-block; background-color: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px;">
      ⚠️ VENCIMIENTO TRIBUTARIO DNIT
    </div>
    <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
      Próximo Vencimiento: ${input.obligation}
    </h2>
    <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
      Te recordamos que la obligación <strong>${input.obligation}</strong> para el contribuyente <strong>${input.entityName}</strong> vence indefectiblemente el <strong>${input.dueDate}</strong>.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <table style="width: 100%; font-size: 13px;">
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Contribuyente:</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right;">${input.entityName}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Obligación:</td>
          <td style="font-weight: 700; color: #0f172a; text-align: right;">${input.obligation}</td>
        </tr>
        <tr>
          <td style="color: #64748b; padding: 4px 0;">Fecha Límite:</td>
          <td style="font-weight: 800; color: #dc2626; text-align: right;">${input.dueDate}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
      <a href="https://app.intelicont.com.py/calendario" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px;">
        Revisar en Calendario Fiscal →
      </a>
    </div>`
  );

  return dispatchEmail({
    to: input.to,
    subject,
    bodyText,
    html,
  });
}

