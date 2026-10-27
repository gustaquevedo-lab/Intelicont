"use server";

import { revalidatePath } from "next/cache";
import { getDb, isMockMode, withSuperadmin } from "@ledger/db";
import { entities, users } from "@ledger/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  createTenantAtomic,
  createUserWithLimits,
  cambiarPasswordUsuario,
  impersonateTenant,
  getSystemVitals,
  getSuperadminStats,
} from "@/lib/superadmin-service";
import { getErroresPlataforma, resolverErrorPlataforma } from "@/lib/error-tracker";
import { requireSuperadmin } from "@/lib/superadmin-guard";

export async function getSuperadminStatsAction() {
  await requireSuperadmin();
  return getSuperadminStats();
}

export async function getSystemVitalsAction() {
  await requireSuperadmin();
  return getSystemVitals();
}

export async function getSuperadminTenantsAction() {
  await requireSuperadmin();
  try {
    if (isMockMode()) {
      return [
        {
          id: "00000000-0000-0000-0000-000000000001",
          ruc: "80012345-6",
          legalName: "Importadora del Este S.A.",
          tradeName: "Este Importaciones",
          entityType: "JURIDICA",
          plan: "pro",
          featuresOverrideJson: null,
          features: { sifenSync: true, aiTripleImputation: true, cgrReports: true, bankApi: true, multiUser: true },
          mrr: 385000,
          status: "active",
          tenantType: "STUDIO" as const,
          contactEmail: "admin@este.com.py",
          contactPhone: "0981-111-222",
          createdAt: new Date(),
        },
      ];
    }
    return withSuperadmin(async (db) => {
      const rows = await db.select().from(entities).orderBy(desc(entities.createdAt));
      return rows.map((e) => ({
        id: e.id,
        ruc: e.ruc,
        legalName: e.legalName,
        tradeName: e.tradeName,
        entityType: "JURIDICA",
        plan: e.plan || "starter",
        featuresOverrideJson: e.featuresOverrideJson,
        features: { sifenSync: true, aiTripleImputation: true, cgrReports: true, bankApi: true, multiUser: true },
        mrr: e.plan === "enterprise" ? 650000 : e.plan === "inhouse" ? 440000 : e.plan === "pro" ? 385000 : 180000,
        status: e.status || "active",
        tenantType: "STUDIO" as const,
        contactEmail: null,
        contactPhone: null,
        createdAt: e.createdAt,
      }));
    });
  } catch {
    return [];
  }
}

export async function getSuperadminUsersAction() {
  await requireSuperadmin();
  try {
    if (isMockMode()) {
      return [
        {
          id: "usr-1",
          email: "admin@intelicont.com.py",
          name: "SuperAdmin InteliCont",
          debeCambiarPassword: false,
          emailVerified: true,
          createdAt: new Date(),
        },
      ];
    }
    const db = getDb();
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      debeCambiarPassword: u.debeCambiarPassword ?? false,
      emailVerified: u.emailVerified ?? true,
      createdAt: u.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function createTenantAtomicAction(data: {
  ruc: string;
  legalName: string;
  tradeName?: string;
  adminEmail: string;
  adminName?: string;
  plan?: string;
  featuresOverride?: Record<string, any>;
}) {
  await requireSuperadmin();
  try {
    const res = await createTenantAtomic(data);
    revalidatePath("/superadmin");
    return { success: true, ...res };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al crear firma" };
  }
}

export async function createUserInTenantAction(data: {
  entityId: string;
  email: string;
  name?: string;
  role?: string;
}) {
  await requireSuperadmin();
  try {
    const res = await createUserWithLimits(data);
    revalidatePath("/superadmin");
    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al crear usuario" };
  }
}

export async function updateTenantCommercialsAction(
  entityId: string,
  data: {
    plan?: string;
    featuresOverrideJson?: string | null;
    status?: "active" | "inactive" | "closed";
  }
) {
  await requireSuperadmin();
  try {
    if (!isMockMode()) {
      await withSuperadmin(async (db) => {
        await db
          .update(entities)
          .set({
            ...(data.plan && { plan: data.plan }),
            ...(data.featuresOverrideJson !== undefined && { featuresOverrideJson: data.featuresOverrideJson }),
            ...(data.status && { status: data.status }),
            updatedAt: new Date(),
          })
          .where(eq(entities.id, entityId));
      });
    }
    revalidatePath("/superadmin");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al actualizar" };
  }
}

export async function impersonateTenantAction(entityId: string, superAdminEmail: string = "superadmin@intelicont.com.py") {
  await requireSuperadmin();
  return impersonateTenant({ entityId, superAdminEmail });
}

export async function getErroresPlataformaAction(options?: { resuelto?: boolean }) {
  await requireSuperadmin();
  return getErroresPlataforma(options);
}

export async function resolverErrorAction(errorId: string, notas?: string) {
  await requireSuperadmin();
  const res = await resolverErrorPlataforma(errorId, notas);
  revalidatePath("/superadmin");
  return { success: !!res, data: res };
}

export async function resetUserPasswordAction(userId: string, newPass: string) {
  await requireSuperadmin();
  const res = await cambiarPasswordUsuario({
    userId,
    passwordActual: "",
    passwordNueva: newPass,
  });
  revalidatePath("/superadmin");
  return res;
}

export async function getPaymentOrdersAction(filter?: { status?: string }) {
  await requireSuperadmin();
  const { listPaymentOrders } = await import("@/lib/subscription-service");
  return listPaymentOrders(filter);
}

export async function approvePaymentOrderAction(orderId: string, approvedBy: string = "superadmin@intelicont.com.py") {
  await requireSuperadmin();
  const { approvePaymentOrder } = await import("@/lib/subscription-service");
  const res = await approvePaymentOrder(orderId, approvedBy);
  revalidatePath("/superadmin");
  revalidatePath("/suscripcion");
  return { success: true, order: res };
}

export async function rejectPaymentOrderAction(orderId: string, reason: string) {
  await requireSuperadmin();
  const { rejectPaymentOrder } = await import("@/lib/subscription-service");
  const res = await rejectPaymentOrder(orderId, reason);
  revalidatePath("/superadmin");
  revalidatePath("/suscripcion");
  return { success: true, order: res };
}
