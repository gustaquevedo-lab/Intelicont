"use server";

/**
 * auth-actions.ts — Server Actions for Authentication & User Management
 *
 * Migrated from Supabase Auth to native Railway PostgreSQL Auth.
 * All user identity comes from `getSession()` backed by the `sessions` table.
 */

import { getDb } from "@ledger/db/index";
import { memberships, entities, auditEvents, users } from "@ledger/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, requireSession, destroySession } from "@/lib/session";
import { requirePermission } from "@/lib/permissions";

export type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type MembershipWithEntity = {
  membershipId: string;
  userId: string;
  entityId: string;
  role: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
};

// ─── Session / Current User ────────────────────────────────────────────────

/**
 * Returns the authenticated user from the native session cookie.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  try {
    const session = await getSession();
    if (!session) return null;
    return session.user;
  } catch {
    return null;
  }
}

/**
 * Server action sign-out: destroys session and redirects to /login.
 * Called from the UI sign-out button.
 */
export async function signOut(): Promise<void> {
  await destroySession();
  revalidatePath("/");
  redirect("/login");
}

// ─── User Memberships ──────────────────────────────────────────────────────

export async function getUserMemberships(
  userId: string
): Promise<{ success: boolean; data: MembershipWithEntity[]; error?: string }> {
  try {
    const db = getDb();
    const result = await db
      .select({
        membershipId: memberships.id,
        userId: memberships.userId,
        entityId: memberships.entityId,
        role: memberships.role,
        ruc: entities.ruc,
        legalName: entities.legalName,
        tradeName: entities.tradeName,
      })
      .from(memberships)
      .innerJoin(entities, eq(memberships.entityId, entities.id))
      .where(eq(memberships.userId, userId))
      .execute();

    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, data: [], error: err.message };
  }
}

// ─── User Management (with audit) ────────────────────────────────────────

export async function inviteUser(input: {
  entityId: string;
  email: string;
  role: "admin" | "accountant" | "assistant" | "auditor" | "client";
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const { user } = session;

    await requirePermission(user.id, input.entityId, "invite");

    const db = getDb();

    // Find or create user by email
    let [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email.trim().toLowerCase()));

    if (!targetUser) {
      [targetUser] = await db
        .insert(users)
        .values({ email: input.email.trim().toLowerCase(), emailVerified: false })
        .returning();
    }

    // Check if membership already exists
    const existing = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.entityId, input.entityId),
          eq(memberships.userId, targetUser.id)
        )
      );

    if (existing.length > 0) {
      return { success: false, error: "El usuario ya tiene una membresía en esta entidad" };
    }

    // Create membership
    await db.insert(memberships).values({
      userId: targetUser.id,
      entityId: input.entityId,
      role: input.role,
      invitedBy: user.id,
    });

    // Audit event
    await db.insert(auditEvents).values({
      entityId: input.entityId,
      actorId: user.id,
      action: "user.invite",
      targetType: "membership",
      targetId: targetUser.id,
      after: { email: input.email, role: input.role },
    });

    revalidatePath("/configuracion");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeUser(input: {
  entityId: string;
  userId: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const { user } = session;

    await requirePermission(user.id, input.entityId, "remove");

    const db = getDb();

    const membership = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.entityId, input.entityId),
          eq(memberships.userId, input.userId)
        )
      );

    if (membership.length === 0) {
      return { success: false, error: "Membresía no encontrada" };
    }

    await db
      .delete(memberships)
      .where(
        and(
          eq(memberships.entityId, input.entityId),
          eq(memberships.userId, input.userId)
        )
      );

    await db.insert(auditEvents).values({
      entityId: input.entityId,
      actorId: user.id,
      action: "user.remove",
      targetType: "membership",
      targetId: input.userId,
      before: { role: membership[0].role },
    });

    revalidatePath("/configuracion");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Settings Changes (with audit) ───────────────────────────────────────

export async function updateEntitySettings(input: {
  entityId: string;
  settings: Record<string, unknown>;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const { user } = session;

    await requirePermission(user.id, input.entityId, "admin");

    const db = getDb();

    const [entity] = await db
      .select()
      .from(entities)
      .where(eq(entities.id, input.entityId));

    if (!entity) return { success: false, error: "Entidad no encontrada" };

    await db
      .update(entities)
      .set({ taxRegimes: input.settings.taxRegimes as string[] })
      .where(eq(entities.id, input.entityId));

    await db.insert(auditEvents).values({
      entityId: input.entityId,
      actorId: user.id,
      action: "settings.change",
      targetType: "entity",
      targetId: input.entityId,
      before: { taxRegimes: entity.taxRegimes },
      after: input.settings,
    });

    revalidatePath("/configuracion");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Export/Report Access (with audit) ────────────────────────────────────

export async function logExportAccess(input: {
  entityId: string;
  reportType: string;
  format: string;
}): Promise<void> {
  try {
    const session = await getSession();
    if (!session) return;

    const db = getDb();
    await db.insert(auditEvents).values({
      entityId: input.entityId,
      actorId: session.user.id,
      action: "access.export",
      targetType: "report",
      targetId: input.reportType,
      after: { format: input.format, reportType: input.reportType },
    });
  } catch {
    // Silent fail for audit logging
  }
}

export async function logReportAccess(input: {
  entityId: string;
  reportType: string;
}): Promise<void> {
  try {
    const session = await getSession();
    if (!session) return;

    const db = getDb();
    await db.insert(auditEvents).values({
      entityId: input.entityId,
      actorId: session.user.id,
      action: "access.report",
      targetType: "report",
      targetId: input.reportType,
      after: { reportType: input.reportType },
    });
  } catch {
    // Silent fail for audit logging
  }
}
