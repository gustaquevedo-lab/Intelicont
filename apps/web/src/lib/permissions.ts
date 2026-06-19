import { getDb } from "@ledger/db/index";
import * as schema from "@ledger/db/schema";
import { eq, and } from "drizzle-orm";

export type Permission =
  | "read"
  | "write"
  | "admin"
  | "audit"
  | "close"
  | "approve"
  | "invite"
  | "remove";

export type MembershipRole = "admin" | "accountant" | "assistant" | "auditor" | "client";

const ROLE_PERMISSIONS: Record<MembershipRole, Permission[]> = {
  admin: ["read", "write", "admin", "audit", "close", "approve", "invite", "remove"],
  accountant: ["read", "write", "audit", "close", "approve"],
  assistant: ["read", "write"],
  auditor: ["read", "audit"],
  client: ["read"],
};

export async function getUserMembership(userId: string, entityId: string) {
  const db = getDb();
  const [membership] = await db
    .select()
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.userId, userId),
        eq(schema.memberships.entityId, entityId)
      )
    );
  return membership;
}

export async function checkPermission(
  userId: string,
  entityId: string,
  permission: Permission
): Promise<{ allowed: boolean; role?: MembershipRole }> {
  const membership = await getUserMembership(userId, entityId);

  if (!membership) {
    return { allowed: false };
  }

  const rolePermissions = ROLE_PERMISSIONS[membership.role as MembershipRole] || [];
  const allowed = rolePermissions.includes(permission);

  return { allowed, role: membership.role as MembershipRole };
}

export async function requirePermission(
  userId: string,
  entityId: string,
  permission: Permission
): Promise<void> {
  const { allowed, role } = await checkPermission(userId, entityId, permission);

  if (!allowed) {
    throw new Error(
      `Permission denied: ${permission} required. User role: ${role || "none"}`
    );
  }
}

export function getRolePermissions(role: MembershipRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// ─── SoD (Segregation of Duties) ─────────────────────────────────────────

export async function checkSoD_createApprove(
  creatorId: string,
  approverId: string,
  entityId: string
): Promise<void> {
  if (creatorId === approverId) {
    throw new Error(
      "SoD violation: El usuario que creó el documento no puede aprobarlo. Requiere una segunda persona."
    );
  }

  await requirePermission(approverId, entityId, "approve");
}

export async function checkSoD_closeReopen(
  closerId: string,
  reopenerId: string,
  entityId: string
): Promise<void> {
  if (closerId === reopenerId) {
    throw new Error(
      "SoD violation: El usuario que cerró el período no puede reabrirlo solo. Requiere una segunda persona."
    );
  }

  await requirePermission(reopenerId, entityId, "close");
}
