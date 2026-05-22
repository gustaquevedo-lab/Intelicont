"use server";

import { eq, and, desc, lte, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { entities, timbrados } from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

export async function loadEntidadesParaTimbrados(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
  try {
    const db = getDb();
    const rows = await db
      .select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities).where(eq(entities.status, "active")).orderBy(entities.legalName);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

// ─── Timbrado row ─────────────────────────────────────────────────────────────

export interface TimbradoRow {
  id:             string;
  entityId:       string;
  entityName:     string;
  numero:         string;
  tipo:           string;
  puntoEmision:   string | null;
  establecimiento:string | null;
  rangoDesde:     string | null;
  rangoHasta:     string | null;
  validoDesde:    string;
  validoHasta:    string;
  isActive:       boolean;
  notas:          string | null;
  daysLeft:       number;       // days until expiry (negative = expired)
  urgency:        "ok" | "warn" | "critical" | "expired";
}

function toUrgency(daysLeft: number): TimbradoRow["urgency"] {
  if (daysLeft < 0)   return "expired";
  if (daysLeft <= 15) return "critical";
  if (daysLeft <= 60) return "warn";
  return "ok";
}

export async function loadTimbrados(entityId?: string): Promise<ActionResult<TimbradoRow[]>> {
  try {
    const db  = getDb();
    const now = new Date();

    const conditions = entityId ? [eq(timbrados.entityId, entityId)] : [];

    const rows = await db
      .select({
        id:             timbrados.id,
        entityId:       timbrados.entityId,
        entityName:     entities.legalName,
        numero:         timbrados.numero,
        tipo:           timbrados.tipo,
        puntoEmision:   timbrados.puntoEmision,
        establecimiento:timbrados.establecimiento,
        rangoDesde:     timbrados.rangoDesde,
        rangoHasta:     timbrados.rangoHasta,
        validoDesde:    timbrados.validoDesde,
        validoHasta:    timbrados.validoHasta,
        isActive:       timbrados.isActive,
        notas:          timbrados.notas,
      })
      .from(timbrados)
      .innerJoin(entities, eq(timbrados.entityId, entities.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(timbrados.validoHasta));

    return {
      ok: true,
      data: rows.map((r) => {
        const hasta    = r.validoHasta instanceof Date ? r.validoHasta : new Date(String(r.validoHasta));
        const desde    = r.validoDesde instanceof Date ? r.validoDesde : new Date(String(r.validoDesde));
        const daysLeft = Math.floor((hasta.getTime() - now.getTime()) / 86_400_000);
        return {
          id:             r.id,
          entityId:       r.entityId,
          entityName:     r.entityName,
          numero:         r.numero,
          tipo:           r.tipo ?? "factura",
          puntoEmision:   r.puntoEmision,
          establecimiento:r.establecimiento,
          rangoDesde:     r.rangoDesde,
          rangoHasta:     r.rangoHasta,
          validoDesde:    desde.toISOString().split("T")[0],
          validoHasta:    hasta.toISOString().split("T")[0],
          isActive:       r.isActive ?? true,
          notas:          r.notas,
          daysLeft,
          urgency:        toUrgency(daysLeft),
        };
      }),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar timbrados" };
  }
}

// ─── Create timbrado ──────────────────────────────────────────────────────────

export interface TimbradoInput {
  entityId:       string;
  numero:         string;
  tipo:           string;
  puntoEmision:   string;
  establecimiento:string;
  rangoDesde:     string;
  rangoHasta:     string;
  validoDesde:    string;
  validoHasta:    string;
  notas:          string;
}

export async function createTimbrado(input: TimbradoInput): Promise<ActionResult<TimbradoRow>> {
  if (!input.entityId)   return { ok: false, error: "Empresa requerida" };
  if (!input.numero)     return { ok: false, error: "Número de timbrado requerido" };
  if (!input.validoDesde || !input.validoHasta) return { ok: false, error: "Fechas de vigencia requeridas" };

  const desde = new Date(input.validoDesde);
  const hasta = new Date(input.validoHasta);
  if (hasta <= desde) return { ok: false, error: "La fecha hasta debe ser posterior a la fecha desde" };

  try {
    const db = getDb();
    const [row] = await db.insert(timbrados).values({
      entityId:        input.entityId,
      numero:          input.numero.trim(),
      tipo:            input.tipo || "factura",
      puntoEmision:    input.puntoEmision || null,
      establecimiento: input.establecimiento || null,
      rangoDesde:      input.rangoDesde || null,
      rangoHasta:      input.rangoHasta || null,
      validoDesde:     desde,
      validoHasta:     hasta,
      isActive:        true,
      notas:           input.notas || null,
    }).returning();

    revalidatePath("/timbrados");

    const daysLeft = Math.floor((hasta.getTime() - Date.now()) / 86_400_000);
    // Get entity name
    const [entity] = await db.select({ legalName: entities.legalName })
      .from(entities).where(eq(entities.id, input.entityId));

    return {
      ok: true,
      data: {
        id: row.id, entityId: row.entityId,
        entityName:     entity?.legalName ?? "",
        numero:         row.numero,
        tipo:           row.tipo ?? "factura",
        puntoEmision:   row.puntoEmision,
        establecimiento:row.establecimiento,
        rangoDesde:     row.rangoDesde,
        rangoHasta:     row.rangoHasta,
        validoDesde:    input.validoDesde,
        validoHasta:    input.validoHasta,
        isActive:       true,
        notas:          row.notas,
        daysLeft,
        urgency:        toUrgency(daysLeft),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar timbrado" };
  }
}

// ─── Toggle active ────────────────────────────────────────────────────────────

export async function toggleTimbrado(id: string, isActive: boolean): Promise<ActionResult<void>> {
  try {
    const db = getDb();
    await db.update(timbrados).set({ isActive, updatedAt: new Date() }).where(eq(timbrados.id, id));
    revalidatePath("/timbrados");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

// ─── Validate timbrado for a CDC ─────────────────────────────────────────────
// Used by SIFEN ingest to check if the timbrado on the XML is registered

export async function validateTimbrado(
  entityId: string,
  numero:   string,
  date:     Date,
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const db = getDb();
    const [row] = await db.select().from(timbrados)
      .where(and(
        eq(timbrados.entityId, entityId),
        eq(timbrados.numero,   numero),
        eq(timbrados.isActive, true),
        lte(timbrados.validoDesde, date),
        gte(timbrados.validoHasta, date),
      ))
      .limit(1);

    if (!row) {
      return { valid: false, reason: `Timbrado ${numero} no registrado o vencido para esta empresa` };
    }
    return { valid: true };
  } catch {
    return { valid: true }; // Don't block ingest if validation fails
  }
}
