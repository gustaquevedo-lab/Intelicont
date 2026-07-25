/**
 * auth.ts — Native Railway PostgreSQL Authentication Logic
 *
 * Handles:
 * - Magic Link (OTP via email) generation & verification
 * - Email + Password sign-in
 * - User creation on first magic link
 * - Password reset flow
 *
 * No Supabase dependency. Works with Railway PostgreSQL + Nodemailer.
 */

"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "@ledger/db/index";
import { users, sessions } from "@ledger/db/schema";
import { eq } from "drizzle-orm";
import { createSession, destroySession } from "./session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────

export type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
};

// ─── Email Sender ──────────────────────────────────────────────────────────

async function sendMagicLinkEmail(email: string, magicUrl: string): Promise<void> {
  // If no SMTP config, log to console (dev mode) or use Resend/Brevo
  const smtpHost = process.env.SMTP_HOST;
  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    // Use Resend API (recommended for production)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "InteliCont <no-reply@intelicont.com.py>",
        to: [email],
        subject: "Tu enlace de acceso a InteliCont",
        html: buildMagicLinkEmail(email, magicUrl),
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Email send failed: ${err}`);
    }
    return;
  }

  if (smtpHost) {
    // Use Nodemailer with SMTP
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "InteliCont <no-reply@intelicont.com.py>",
      to: email,
      subject: "Tu enlace de acceso a InteliCont",
      html: buildMagicLinkEmail(email, magicUrl),
    });
    return;
  }

  // Dev mode: log to console
  console.log("\n========================================");
  console.log("🔗 MAGIC LINK (DEV MODE — no email sent)");
  console.log(`📧 To: ${email}`);
  console.log(`🔗 URL: ${magicUrl}`);
  console.log("========================================\n");
}

function buildMagicLinkEmail(email: string, magicUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', sans-serif; background: #f8fafc; padding: 40px 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 24px; font-weight: 900; color: #1e293b; margin: 0;">InteliCont</h1>
      <p style="color: #64748b; font-size: 13px; margin: 4px 0 0;">Sistema Contable AI-First · Paraguay</p>
    </div>
    <p style="color: #1e293b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
      Hola, recibiste este enlace para acceder a tu cuenta en InteliCont.<br>
      <strong>Hacé clic en el botón de abajo</strong> para iniciar sesión:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${magicUrl}" 
         style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; font-weight: 700; font-size: 15px; border-radius: 10px; text-decoration: none;">
        🔐 Acceder a InteliCont
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 24px 0 0; line-height: 1.5;">
      Este enlace es válido por <strong>1 hora</strong> y solo puede usarse una vez.<br>
      Si no solicitaste este acceso, podés ignorar este email con tranquilidad.
    </p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="color: #cbd5e1; font-size: 10px; text-align: center; margin: 0;">
      IntelliHouse Soluciones E.A.S. · RUC 80144114-5 · Asunción, Paraguay
    </p>
  </div>
</body>
</html>`;
}

// ─── Magic Link: Send ──────────────────────────────────────────────────────

export async function sendMagicLink(email: string): Promise<AuthResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const db = getDb();

    // Find or create user
    let [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!user) {
      // Auto-create user on first login (invite-gated via memberships)
      [user] = await db
        .insert(users)
        .values({ email: normalizedEmail, emailVerified: false })
        .returning();
    }

    // Generate a cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store hashed token
    await db
      .update(users)
      .set({
        magicToken: hashedToken,
        magicTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Build magic URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicUrl = `${appUrl}/auth/verify?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendMagicLinkEmail(normalizedEmail, magicUrl);

    return {
      success: true,
      message: `Enlace enviado a ${normalizedEmail}. Revisá tu bandeja de entrada — expira en 1 hora.`,
    };
  } catch (err: any) {
    console.error("[sendMagicLink] Error:", err);
    return { success: false, error: err.message || "Error al enviar el enlace mágico." };
  }
}

// ─── Magic Link: Verify ────────────────────────────────────────────────────

export async function verifyMagicLink(
  rawToken: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (!user) {
      return { success: false, error: "Token inválido o expirado." };
    }

    if (
      user.magicToken !== hashedToken ||
      !user.magicTokenExpiresAt ||
      user.magicTokenExpiresAt < new Date()
    ) {
      return { success: false, error: "El enlace ya expiró o fue utilizado. Solicitá uno nuevo." };
    }

    // Consume the token (one-time use)
    await db
      .update(users)
      .set({
        magicToken: null,
        magicTokenExpiresAt: null,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Create session
    await createSession(user.id);

    return { success: true };
  } catch (err: any) {
    console.error("[verifyMagicLink] Error:", err);
    return { success: false, error: "Error al verificar el enlace." };
  }
}

// ─── Password Sign-In ──────────────────────────────────────────────────────

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const db = getDb();

    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    if (!user || !user.passwordHash) {
      // Don't reveal if user exists — generic message
      return { success: false, error: "Email o contraseña incorrectos." };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return { success: false, error: "Email o contraseña incorrectos." };
    }

    await createSession(user.id);
    return { success: true };
  } catch (err: any) {
    console.error("[signInWithPassword] Error:", err);
    return { success: false, error: err.message || "Error al iniciar sesión." };
  }
}

// ─── Sign Out ──────────────────────────────────────────────────────────────

export async function signOut(): Promise<void> {
  await destroySession();
  revalidatePath("/");
  redirect("/login");
}

// ─── Password Setup (Admin use) ────────────────────────────────────────────

export async function setUserPassword(userId: string, password: string): Promise<AuthResult> {
  try {
    if (password.length < 8) {
      return { success: false, error: "La contraseña debe tener al menos 8 caracteres." };
    }
    const hash = await bcrypt.hash(password, 12);
    const db = getDb();
    await db
      .update(users)
      .set({ passwordHash: hash, updatedAt: new Date() })
      .where(eq(users.id, userId));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Password Reset ────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail));

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, message: "Si existe una cuenta con ese email, recibirás instrucciones." };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(users)
      .set({ resetToken: hashedToken, resetTokenExpiresAt: expiresAt, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`;

    console.log("[DEV] Password reset URL:", resetUrl);
    // TODO: Send email with resetUrl

    return { success: true, message: "Si existe una cuenta con ese email, recibirás instrucciones." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
