"use server";

import { sendPasswordResetEmail } from "@/lib/email-service";
import { getDb, isMockMode } from "@ledger/db";
import { users } from "@ledger/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

export async function solicitarRecuperacionAction(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail) {
    return { success: false, error: "Ingresá un correo válido" };
  }

  try {
    const token = randomBytes(24).toString("hex");
    const baseUrl = process.env.BETTER_AUTH_URL || "https://app.intelicont.com.py";
    const resetUrl = `${baseUrl}/login?token=${token}&email=${encodeURIComponent(cleanEmail)}`;

    if (!isMockMode() && process.env.NODE_ENV !== "test") {
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.email, cleanEmail));
      if (user) {
        await sendPasswordResetEmail({
          to: cleanEmail,
          resetUrl,
        });
      }
    } else {
      // En test/mock, siempre despacha para verificar
      await sendPasswordResetEmail({
        to: cleanEmail,
        resetUrl,
      });
    }

    return {
      success: true,
      message: "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.",
    };
  } catch (err) {
    return {
      success: false,
      error: "Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.",
    };
  }
}
