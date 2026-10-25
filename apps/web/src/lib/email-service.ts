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
  const subject = `¡Bienvenido a InteliCont, ${input.entityName}! (Prueba de ${days} días activa)`;
  const bodyText = `Hola ${input.name || "Colega"},

Te damos la bienvenida a InteliCont. Tu estudio/empresa "${input.entityName}" ha sido dada de alta exitosamente con un período de prueba gratuito de ${days} días.

Podés ingresar en cualquier momento en:
https://app.intelicont.com.py/login

¿Qué podés hacer ahora?
1. Importar tus comprobantes electrónicos SIFEN en formato XML.
2. Cargar tu extracto bancario en CSV/Excel para conciliación automática.
3. Consultar a tu Copilot Contable Inteligente con memoria RAG normativa.

Si necesitás asistencia técnica o una demostración guiada, podés escribirnos por WhatsApp al +595 994 516360.

Atentamente,
El equipo de InteliCont Paraguay`;

  return dispatchEmail({
    to: input.to,
    subject,
    bodyText,
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
  const bodyText = `Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta en InteliCont.

Para definir una nueva contraseña, hacé clic en el siguiente enlace seguro (válido por 1 hora):
${input.resetUrl}

Si no solicitaste este cambio, podés ignorar este correo de forma segura.

Atentamente,
Seguridad InteliCont`;

  return dispatchEmail({
    to: input.to,
    subject,
    bodyText,
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
  const bodyText = `Estimado/a,

Te recordamos que la obligación tributaria "${input.obligation}" para el contribuyente "${input.entityName}" tiene fecha límite de presentación el ${input.dueDate}.

Te recomendamos verificar en InteliCont que todos los comprobantes del período estén registrados y balanceados:
https://app.intelicont.com.py/calendario

Atentamente,
Alertas Fiscales InteliCont`;

  return dispatchEmail({
    to: input.to,
    subject,
    bodyText,
  });
}
