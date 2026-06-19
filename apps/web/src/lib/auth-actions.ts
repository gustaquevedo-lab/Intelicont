"use server";

import { createServerSupabaseClient, setEntityContext } from "@/lib/supabase/server";
import { getDb } from "@ledger/db/index";
import { memberships, entities, auditEvents } from "@ledger/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function signInWithMagicLink(email: string): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3456"}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al enviar magic link" };
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}

export async function getCurrentUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}

export async function getUserMemberships(userId: string): Promise<{ success: boolean; data: MembershipWithEntity[]; error?: string }> {
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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado" };

    await requirePermission(user.id, input.entityId, "invite");

    const db = getDb();

    // Check if membership already exists
    const existing = await db
      .select()
      .from(memberships)
      .where(and(
        eq(memberships.entityId, input.entityId),
        eq(memberships.userId, input.email)
      ));

    if (existing.length > 0) {
      return { success: false, error: "El usuario ya tiene una membresía en esta entidad" };
    }

    // Create membership
    await db.insert(memberships).values({
      userId: input.email,
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
      targetId: input.email,
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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado" };

    await requirePermission(user.id, input.entityId, "remove");

    const db = getDb();

    // Get membership before deletion for audit
    const membership = await db
      .select()
      .from(memberships)
      .where(and(
        eq(memberships.entityId, input.entityId),
        eq(memberships.userId, input.userId)
      ));

    if (membership.length === 0) {
      return { success: false, error: "Membresía no encontrada" };
    }

    // Delete membership
    await db
      .delete(memberships)
      .where(and(
        eq(memberships.entityId, input.entityId),
        eq(memberships.userId, input.userId)
      ));

    // Audit event
    await db.insert(auditEvents).values({
      entityId: input.entityId,
      actorId: user.id,
      action: "user.remove",
      targetType: "membership",
      targetId: input.userId,
      before: { email: input.userId, role: membership[0].role },
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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Usuario no autenticado" };

    await requirePermission(user.id, input.entityId, "admin");

    const db = getDb();

    // Get current entity for audit
    const [entity] = await db
      .select()
      .from(entities)
      .where(eq(entities.id, input.entityId));

    if (!entity) return { success: false, error: "Entidad no encontrada" };

    // Update entity settings
    await db
      .update(entities)
      .set({ taxRegimes: input.settings.taxRegimes as string[] })
      .where(eq(entities.id, input.entityId));

    // Audit event
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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const db = getDb();

    await db.insert(auditEvents).values({
      entityId: input.entityId,
      actorId: user.id,
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
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const db = getDb();

    await db.insert(auditEvents).values({
      entityId: input.entityId,
      actorId: user.id,
      action: "access.report",
      targetType: "report",
      targetId: input.reportType,
      after: { reportType: input.reportType },
    });
  } catch {
    // Silent fail for audit logging
  }
}
