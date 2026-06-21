"use server";

import { eq, and, ilike, or, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { partners, entities } from "@/lib/db/schema";
import { validateRUC } from "@/lib/ruc";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── List terceros ────────────────────────────────────────────────────────────

export interface TerceroRow {
  id: string;
  entityId: string;
  entityName: string;
  ruc: string;
  name: string;
  kind: "cliente" | "proveedor" | "ambos";
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export async function loadTerceros(filters?: {
  entityId?: string;
  kind?:     string;
  search?:   string;
}): Promise<ActionResult<TerceroRow[]>> {
  try {
    const db         = getDb();
    const conditions = [];

    if (filters?.entityId) {
      conditions.push(eq(partners.entityId, filters.entityId));
    }
    if (filters?.kind && filters.kind !== "todos") {
      const dbKind = filters.kind === "cliente" ? "customer" : filters.kind === "proveedor" ? "supplier" : "both";
      conditions.push(eq(partners.kind, dbKind));
    }
    if (filters?.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(or(
        ilike(partners.legalName, q),
        ilike(partners.ruc,  q),
      ));
    }

    const rows = await db
      .select({
        id:        partners.id,
        entityId:  partners.entityId,
        entityName: entities.legalName,
        ruc:       partners.ruc,
        legalName: partners.legalName,
        tradeName: partners.tradeName,
        kind:      partners.kind,
        contacts:  partners.contacts,
        createdAt: partners.createdAt,
        updatedAt: partners.updatedAt,
      })
      .from(partners)
      .innerJoin(entities, eq(partners.entityId, entities.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(partners.createdAt))
      .limit(300);

    const mapped: TerceroRow[] = rows.map((r) => {
      const contacts = (r.contacts as any) || {};
      return {
        id: r.id,
        entityId: r.entityId,
        entityName: r.entityName,
        ruc: r.ruc,
        name: r.legalName || r.tradeName || "",
        kind: r.kind === "customer" ? "cliente" : r.kind === "supplier" ? "proveedor" : "ambos",
        email: contacts.email || null,
        phone: contacts.phone || null,
        address: contacts.address || null,
        notes: contacts.notes || null,
        isActive: contacts.isActive !== false,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return { ok: true, data: mapped };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar terceros" };
  }
}

// ─── Create tercero ───────────────────────────────────────────────────────────

export async function createTercero(formData: FormData): Promise<ActionResult<any>> {
  const entityId = (formData.get("entityId") as string | null)?.trim() ?? "";
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name)  return { ok: false, error: "El nombre es requerido" };

  const rawRuc = (formData.get("ruc") as string | null)?.trim() ?? "";
  let   ruc: string | null = null;

  if (rawRuc) {
    const check = validateRUC(rawRuc);
    if (!check.valid) return { ok: false, error: check.error! };
    ruc = check.normalized!;
  } else {
    return { ok: false, error: "El RUC es requerido" };
  }

  const kind    = (formData.get("kind")    as "cliente" | "proveedor" | "ambos" | null) ?? "ambos";
  const email   = (formData.get("email")   as string | null)?.trim() || null;
  const phone   = (formData.get("phone")   as string | null)?.trim() || null;
  const address = (formData.get("address") as string | null)?.trim() || null;
  const notes   = (formData.get("notes")   as string | null)?.trim() || null;

  const contacts = { email, phone, address, notes, isActive: true };
  const kindMapped = kind === "cliente" ? "customer" : kind === "proveedor" ? "supplier" : "both";

  try {
    const db = getDb();
    const [created] = await db
      .insert(partners)
      .values({
        entityId,
        ruc,
        legalName: name,
        kind: kindMapped,
        contacts,
      })
      .returning();

    revalidatePath("/terceros");
    
    // Map back to TerceroRow structure
    return {
      ok: true,
      data: {
        id: created.id,
        entityId: created.entityId,
        ruc: created.ruc,
        name: created.legalName,
        kind: kind,
        email,
        phone,
        address,
        notes,
        isActive: true,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      }
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear tercero" };
  }
}

// ─── Update tercero ───────────────────────────────────────────────────────────

export async function updateTercero(id: string, formData: FormData): Promise<ActionResult<any>> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) return { ok: false, error: "El nombre es requerido" };

  const rawRuc = (formData.get("ruc") as string | null)?.trim() ?? "";
  let   ruc: string | null = null;
  if (rawRuc) {
    const check = validateRUC(rawRuc);
    if (!check.valid) return { ok: false, error: check.error! };
    ruc = check.normalized!;
  } else {
    return { ok: false, error: "El RUC es requerido" };
  }

  const kind    = (formData.get("kind")    as "cliente" | "proveedor" | "ambos" | null) ?? "ambos";
  const email   = (formData.get("email")   as string | null)?.trim() || null;
  const phone   = (formData.get("phone")   as string | null)?.trim() || null;
  const address = (formData.get("address") as string | null)?.trim() || null;
  const notes   = (formData.get("notes")   as string | null)?.trim() || null;

  const kindMapped = kind === "cliente" ? "customer" : kind === "proveedor" ? "supplier" : "both";

  try {
    const db = getDb();
    const [existing] = await db.select({ contacts: partners.contacts }).from(partners).where(eq(partners.id, id)).limit(1);
    const existingContacts = (existing?.contacts as any) || {};
    const contacts = { 
      email, 
      phone, 
      address, 
      notes, 
      isActive: existingContacts.isActive !== false 
    };

    const [updated] = await db
      .update(partners)
      .set({
        ruc,
        legalName: name,
        kind: kindMapped,
        contacts,
      })
      .where(eq(partners.id, id))
      .returning();

    if (!updated) return { ok: false, error: "Tercero no encontrado" };
    revalidatePath("/terceros");

    return {
      ok: true,
      data: {
        id: updated.id,
        entityId: updated.entityId,
        ruc: updated.ruc,
        name: updated.legalName,
        kind: kind,
        email,
        phone,
        address,
        notes,
        isActive: contacts.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      }
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al actualizar tercero" };
  }
}

// ─── Toggle active ────────────────────────────────────────────────────────────

export async function toggleTerceroActive(id: string, isActive: boolean): Promise<ActionResult<void>> {
  try {
    const db = getDb();
    const [existing] = await db.select({ contacts: partners.contacts }).from(partners).where(eq(partners.id, id)).limit(1);
    const contacts = (existing?.contacts as any) || {};
    contacts.isActive = isActive;
    
    await db.update(partners).set({ contacts }).where(eq(partners.id, id));
    revalidatePath("/terceros");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al actualizar estado" };
  }
}

// ─── Load entities (for selector) ────────────────────────────────────────────

export async function loadEntidadesParaTerceros(): Promise<ActionResult<Array<{ id: string; legalName: string }>>> {
  try {
    const db   = getDb();
    const rows = await db
      .select({ id: entities.id, legalName: entities.legalName })
      .from(entities)
      .where(eq(entities.status, "active"))
      .orderBy(entities.legalName);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar empresas" };
  }
}
