"use server";

import { eq, and, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entities, chartOfAccounts, accounts } from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Entity list ──────────────────────────────────────────────────────────────

export async function loadEntidadesParaCuentas(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
  try {
    const db   = getDb();
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

// ─── Account tree node ────────────────────────────────────────────────────────

export interface AccountNode {
  id:           string;
  code:         string;
  name:         string;
  nature:       string | null;
  allowsPosting:boolean | null;
  parentId:     string | null;
  children:     AccountNode[];
  level:        number;
}

export async function loadPlanDeCuentas(entityId: string): Promise<ActionResult<AccountNode[]>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };

  try {
    const db = getDb();

    // Find the chart of accounts
    const [coa] = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.entityId, entityId))
      .orderBy(chartOfAccounts.kind)
      .limit(1);

    if (!coa) return { ok: false, error: "Esta empresa no tiene plan de cuentas" };

    const rows = await db
      .select({
        id:           accounts.id,
        code:         accounts.code,
        name:         accounts.name,
        nature:       accounts.nature,
        allowsPosting:accounts.allowsPosting,
        parentId:     accounts.parentId,
      })
      .from(accounts)
      .where(eq(accounts.coaId, coa.id))
      .orderBy(asc(accounts.code));

    // Build tree
    const map = new Map<string, AccountNode>();
    rows.forEach((r) => {
      map.set(r.id, {
        id:           r.id,
        code:         r.code,
        name:         r.name,
        nature:       r.nature,
        allowsPosting:r.allowsPosting,
        parentId:     r.parentId,
        children:     [],
        level:        0,
      });
    });

    const roots: AccountNode[] = [];
    map.forEach((node) => {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Assign levels
    function assignLevel(node: AccountNode, level: number) {
      node.level = level;
      node.children.forEach((c) => assignLevel(c, level + 1));
    }
    roots.forEach((r) => assignLevel(r, 0));

    return { ok: true, data: roots };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar cuentas" };
  }
}
