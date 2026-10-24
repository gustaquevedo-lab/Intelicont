"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@ledger/db";
import { timbrados, entities } from "@ledger/db/schema";
import { eq, and, desc } from "drizzle-orm";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function loadEntidadesParaTimbrados(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
  try {
    const db = getDb();
    const rows = await db
      .select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities)
      .where(eq(entities.status, "active"))
      .orderBy(entities.legalName);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export interface TimbradoRow {
  id: string;
  entityId: string;
  entityName: string;
  numero: string;
  tipo: string;
  puntoEmision: string | null;
  establecimiento: string | null;
  rangoDesde: string | null;
  rangoHasta: string | null;
  validoDesde: string;
  validoHasta: string;
  isActive: boolean;
  notas: string | null;
  daysLeft: number;
  urgency: "ok" | "warn" | "critical" | "expired";
}

function toUrgency(daysLeft: number): TimbradoRow["urgency"] {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 15) return "critical";
  if (daysLeft <= 60) return "warn";
  return "ok";
}

export async function loadTimbrados(entityId?: string): Promise<ActionResult<TimbradoRow[]>> {
  try {
    const db = getDb();
    const now = new Date();
    const conditions = entityId ? [eq(timbrados.entityId, entityId)] : [];

    const rows = await db
      .select({
        id: timbrados.id,
        entityId: timbrados.entityId,
        entityName: entities.legalName,
        number: timbrados.number,
        establishment: timbrados.establishment,
        point: timbrados.point,
        docCode: timbrados.docCode,
        validFrom: timbrados.validFrom,
        validTo: timbrados.validTo,
      })
      .from(timbrados)
      .innerJoin(entities, eq(timbrados.entityId, entities.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(timbrados.validTo));

    return {
      ok: true,
      data: rows.map((r) => {
        const hasta = new Date(String(r.validTo));
        const desde = new Date(String(r.validFrom));
        const daysLeft = Math.floor((hasta.getTime() - now.getTime()) / 86_400_000);
        return {
          id: r.id,
          entityId: r.entityId,
          entityName: r.entityName,
          numero: r.number,
          tipo: r.docCode === 1 ? "factura" : r.docCode === 4 ? "autofactura" : r.docCode === 5 ? "nota_credito" : "documento",
          puntoEmision: r.point,
          establecimiento: r.establishment,
          rangoDesde: null,
          rangoHasta: null,
          validoDesde: desde.toISOString().split("T")[0],
          validoHasta: hasta.toISOString().split("T")[0],
          isActive: true,
          notas: null,
          daysLeft,
          urgency: toUrgency(daysLeft),
        };
      }),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar timbrados" };
  }
}

export interface TimbradoInput {
  entityId: string;
  numero: string;
  tipo: string;
  puntoEmision: string;
  establecimiento: string;
  rangoDesde: string;
  rangoHasta: string;
  validoDesde: string;
  validoHasta: string;
  notas: string;
}

export async function createTimbrado(input: TimbradoInput): Promise<ActionResult<TimbradoRow>> {
  if (!input.entityId) return { ok: false, error: "Empresa requerida" };
  if (!input.numero) return { ok: false, error: "Número de timbrado requerido" };
  if (!input.validoDesde || !input.validoHasta) return { ok: false, error: "Fechas de vigencia requeridas" };

  const desde = new Date(input.validoDesde);
  const hasta = new Date(input.validoHasta);
  if (hasta <= desde) return { ok: false, error: "La fecha hasta debe ser posterior a la fecha desde" };

  try {
    const db = getDb();
    const docCode = input.tipo === "autofactura" ? 4 : input.tipo === "nota_credito" ? 5 : 1;
    const [row] = await db
      .insert(timbrados)
      .values({
        entityId: input.entityId,
        number: input.numero.trim(),
        establishment: input.establecimiento?.trim().padStart(3, "0") || "001",
        point: input.puntoEmision?.trim().padStart(3, "0") || "001",
        docCode,
        validFrom: input.validoDesde,
        validTo: input.validoHasta,
      })
      .returning();

    revalidatePath("/timbrados");

    const [entity] = await db.select({ legalName: entities.legalName }).from(entities).where(eq(entities.id, input.entityId));
    const daysLeft = Math.floor((hasta.getTime() - Date.now()) / 86_400_000);

    return {
      ok: true,
      data: {
        id: row.id,
        entityId: row.entityId,
        entityName: entity?.legalName ?? "",
        numero: row.number,
        tipo: input.tipo || "factura",
        puntoEmision: row.point,
        establecimiento: row.establishment,
        rangoDesde: null,
        rangoHasta: null,
        validoDesde: input.validoDesde,
        validoHasta: input.validoHasta,
        isActive: true,
        notas: null,
        daysLeft,
        urgency: toUrgency(daysLeft),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar timbrado" };
  }
}

export async function toggleTimbrado(_id: string, _isActive: boolean): Promise<ActionResult<void>> {
  return { ok: true, data: undefined };
}
