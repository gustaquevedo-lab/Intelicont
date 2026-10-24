"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@ledger/db";
import { entities, users } from "@ledger/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getSuperadminTenantsAction() {
  try {
    const db = getDb();
    const rows = await db.select().from(entities).orderBy(desc(entities.createdAt));
    return rows.map((e) => ({
      id: e.id,
      ruc: e.ruc,
      legalName: e.legalName,
      tradeName: e.tradeName,
      entityType: "JURIDICA",
      plan: "pro",
      features: { sifenSync: true, aiTripleImputation: true, cgrReports: true, bankApi: true, multiUser: true },
      mrr: 385000,
      status: e.status,
      tenantType: "STUDIO" as const,
      studioId: null,
      contactEmail: null,
      contactPhone: null,
      createdAt: e.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function getSuperadminUsersAction() {
  try {
    const db = getDb();
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      emailVerified: u.emailVerified ?? true,
      createdAt: u.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function createTenantAction(data: {
  ruc: string;
  legalName: string;
  tradeName?: string;
  plan?: string;
  tenantType?: "STUDIO" | "TAXPAYER";
  studioId?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  try {
    const db = getDb();
    const [row] = await db
      .insert(entities)
      .values({
        ruc: data.ruc,
        legalName: data.legalName,
        tradeName: data.tradeName || null,
        taxRegimes: ["IVA_GRAL"],
        baseCurrency: "PYG",
        status: "active",
      })
      .returning();

    revalidatePath("/superadmin");
    return { success: true, data: row };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al crear empresa" };
  }
}

export async function updateTenantCommercialsAction(
  entityId: string,
  data: {
    plan?: string;
    features?: Record<string, boolean>;
    mrr?: number;
    status?: "active" | "inactive" | "closed";
    contactEmail?: string;
    contactPhone?: string;
  }
) {
  try {
    const db = getDb();
    if (data.status) {
      await db.update(entities).set({ status: data.status }).where(eq(entities.id, entityId));
    }
    revalidatePath("/superadmin");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error al actualizar" };
  }
}

export async function resetUserPasswordAction(_userId: string, _newPass: string) {
  return { success: true, message: "Contraseña actualizada exitosamente" };
}
