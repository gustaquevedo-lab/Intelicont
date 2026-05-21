"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entities } from "@/lib/db/schema";
import { computeObligaciones, type ObligacionCalendar, type CalendarEntity } from "@/lib/dnit-calendar";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

export interface CalendarioData {
  obligaciones: Array<{
    tipo:      string;
    empresa:   string;
    entityId:  string;
    ruc:       string;
    dueDate:   string;   // ISO date string (serialisable)
    regime:    string;
  }>;
  entities: Array<{ id: string; ruc: string; legalName: string }>;
}

export async function loadCalendario(
  year?: number,
  monthsAhead = 4
): Promise<ActionResult<CalendarioData>> {
  try {
    const db   = getDb();
    const targetYear = year ?? new Date().getFullYear();

    const rows = await db
      .select({
        id:         entities.id,
        ruc:        entities.ruc,
        legalName:  entities.legalName,
        status:     entities.status,
        taxRegimes: entities.taxRegimes,
      })
      .from(entities)
      .where(eq(entities.status, "active"))
      .orderBy(entities.legalName);

    const calEntities: CalendarEntity[] = rows.map((r) => ({
      id:         r.id,
      ruc:        r.ruc,
      legalName:  r.legalName,
      status:     r.status ?? "active",
      taxRegimes: r.taxRegimes ?? null,
    }));

    const obligaciones: ObligacionCalendar[] = computeObligaciones(
      calEntities,
      targetYear,
      monthsAhead
    );

    return {
      ok: true,
      data: {
        obligaciones: obligaciones.map((o) => ({
          tipo:     o.tipo,
          empresa:  o.empresa,
          entityId: o.entityId,
          ruc:      o.ruc,
          dueDate:  o.dueDate.toISOString().split("T")[0],
          regime:   o.regime,
        })),
        entities: rows.map((r) => ({ id: r.id, ruc: r.ruc, legalName: r.legalName })),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar calendario" };
  }
}
