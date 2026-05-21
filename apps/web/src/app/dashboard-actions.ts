"use server";

import { eq, sql, and, gte, lt, count } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entities, journalEntries } from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export interface DashboardStats {
  activeEntities:  number;
  totalEntries:    number;
  postedThisMonth: number;
  draftsTotal:     number;
}

export async function loadDashboardStats(): Promise<ActionResult<DashboardStats>> {
  try {
    const db  = getDb();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [
      [activeEntities],
      [totalEntries],
      [postedThisMonth],
      [draftsTotal],
    ] = await Promise.all([
      db.select({ v: count() }).from(entities).where(eq(entities.status, "active")),
      db.select({ v: count() }).from(journalEntries),
      db.select({ v: count() }).from(journalEntries).where(
        and(
          eq(journalEntries.status, "posted"),
          gte(journalEntries.date, monthStart),
          lt(journalEntries.date, monthEnd),
        )
      ),
      db.select({ v: count() }).from(journalEntries).where(
        eq(journalEntries.status, "draft")
      ),
    ]);

    return {
      ok: true,
      data: {
        activeEntities:  activeEntities?.v  ?? 0,
        totalEntries:    totalEntries?.v    ?? 0,
        postedThisMonth: postedThisMonth?.v ?? 0,
        draftsTotal:     draftsTotal?.v     ?? 0,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar estadísticas" };
  }
}

// ─── Entity list for dashboard widget ─────────────────────────────────────────

export interface DashboardEntity {
  id:       string;
  ruc:      string;
  name:     string;
  status:   string;
  initials: string;
}

export async function loadDashboardEntities(): Promise<ActionResult<DashboardEntity[]>> {
  try {
    const db   = getDb();
    const rows = await db
      .select({
        id:     entities.id,
        ruc:    entities.ruc,
        name:   entities.legalName,
        status: entities.status,
      })
      .from(entities)
      .orderBy(entities.legalName)
      .limit(50);

    return {
      ok: true,
      data: rows.map((r) => ({
        id:       r.id,
        ruc:      r.ruc,
        name:     r.name,
        status:   r.status ?? "active",
        initials: r.name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((w: string) => w[0].toUpperCase())
          .join(""),
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar empresas" };
  }
}
