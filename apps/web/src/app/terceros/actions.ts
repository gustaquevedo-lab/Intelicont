"use server";

import { eq, and, ilike, or, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { terceros, entities, type Tercero } from "@/lib/db/schema";
import { validateRUC } from "@/lib/ruc";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── List terceros ────────────────────────────────────────────────────────────

export interface TerceroRow extends Tercero {
  entityName: string;
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
      conditions.push(eq(terceros.entityId, filters.entityId));
    }
    if (filters?.kind && filters.kind !== "todos") {
      conditions.push(eq(terceros.kind, filters.kind as "cliente" | "proveedor" | "ambos"));
    }
    if (filters?.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(or(
        ilike(terceros.name, q),
        ilike(terceros.ruc,  q),
        ilike(terceros.email ?? "", q),
      ));
    }

    const rows = await db
      .select({
        id:        terceros.id,
        entityId:  terceros.entityId,
        entityName: entities.legalName,
        ruc:       terceros.ruc,
        name:      terceros.name,
        kind:      terceros.kind,
        email:     terceros.email,
        phone:     terceros.phone,
        address:   terceros.address,
        notes:     terceros.notes,
        isActive:  terceros.isActive,
        createdAt: terceros.createdAt,
        updatedAt: terceros.updatedAt,
      })
      .from(terceros)
      .innerJoin(entities, eq(terceros.entityId, entities.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(terceros.createdAt))
      .limit(300);

    return { ok: true, data: rows as TerceroRow[] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar terceros" };
  }
}

// ─── Create tercero ───────────────────────────────────────────────────────────

export async function createTercero(formData: FormData): Promise<ActionResult<Tercero>> {
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
  }

  const kind    = (formData.get("kind")    as "cliente" | "proveedor" | "ambos" | null) ?? "ambos";
  const email   = (formData.get("email")   as string | null)?.trim() || null;
  const phone   = (formData.get("phone")   as string | null)?.trim() || null;
  const address = (formData.get("address") as string | null)?.trim() || null;
  const notes   = (formData.get("notes")   as string | null)?.trim() || null;

  try {
    const db = getDb();
    const [created] = await db
      .insert(terceros)
      .values({ entityId, ruc, name, kind, email, phone, address, notes })
      .returning();

    revalidatePath("/terceros");
    return { ok: true, data: created };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear tercero" };
  }
}

// ─── Update tercero ───────────────────────────────────────────────────────────

export async function updateTercero(id: string, formData: FormData): Promise<ActionResult<Tercero>> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) return { ok: false, error: "El nombre es requerido" };

  const rawRuc = (formData.get("ruc") as string | null)?.trim() ?? "";
  let   ruc: string | null = null;
  if (rawRuc) {
    const check = validateRUC(rawRuc);
    if (!check.valid) return { ok: false, error: check.error! };
    ruc = check.normalized!;
  }

  const kind    = (formData.get("kind")    as "cliente" | "proveedor" | "ambos" | null) ?? "ambos";
  const email   = (formData.get("email")   as string | null)?.trim() || null;
  const phone   = (formData.get("phone")   as string | null)?.trim() || null;
  const address = (formData.get("address") as string | null)?.trim() || null;
  const notes   = (formData.get("notes")   as string | null)?.trim() || null;

  try {
    const db = getDb();
    const [updated] = await db
      .update(terceros)
      .set({ ruc, name, kind, email, phone, address, notes })
      .where(eq(terceros.id, id))
      .returning();

    if (!updated) return { ok: false, error: "Tercero no encontrado" };
    revalidatePath("/terceros");
    return { ok: true, data: updated };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al actualizar tercero" };
  }
}

// ─── Toggle active ────────────────────────────────────────────────────────────

export async function toggleTerceroActive(id: string, isActive: boolean): Promise<ActionResult<void>> {
  try {
    const db = getDb();
    await db.update(terceros).set({ isActive }).where(eq(terceros.id, id));
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
