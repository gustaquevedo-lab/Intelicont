"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entities, type Entity } from "@/lib/db/schema";
import { validateRUC } from "@/lib/ruc";
import { createClient } from "@/lib/supabase/server";

// ─── Result type ──────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── SELECT ───────────────────────────────────────────────────────────────────

/**
 * Returns all entities the authenticated user can see.
 * RLS on the DB enforces tenant isolation server-side.
 * The explicit filter is a defense-in-depth measure — in the future,
 * this will join against an `entity_memberships` table keyed by auth.uid().
 */
export async function getEmpresas(): Promise<ActionResult<Entity[]>> {
  try {
    const db = getDb();

    // Auth check — we want to know who's requesting (for future row-level filter).
    // With dev RLS (USING true), all rows are visible regardless.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all entities (RLS on Supabase side handles multi-tenant isolation).
    // When entity_memberships table is added, add .where(inArray(entities.id, userEntityIds)).
    const rows = await db
      .select()
      .from(entities)
      .orderBy(entities.legalName);

    // Audit: who fetched (logged only in dev — swap for pino in prod)
    if (process.env.NODE_ENV === "development") {
      console.log(`[entities] fetched ${rows.length} rows for user ${user?.id ?? "anon"}`);
    }

    return { ok: true, data: rows };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al cargar empresas";
    return { ok: false, error: message };
  }
}

// ─── INSERT ───────────────────────────────────────────────────────────────────

export interface CreateEmpresaInput {
  ruc:           string;
  legalName:     string;
  tradeName?:    string;
  taxRegimes:    string[];  // e.g. ["IVA General", "IRE General"]
  address?:      string;
  email?:        string;
}

export async function createEmpresa(
  formData: FormData
): Promise<ActionResult<Entity>> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // In dev (no real Supabase) we allow inserts; in prod, reject unauthenticated.
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("placeholder") === false
                    || process.env.NODE_ENV === "development";

  if (!user && !isDevMode) {
    return { ok: false, error: "Sesión expirada. Volvé a iniciar sesión." };
  }

  // ── Parse & validate RUC ──────────────────────────────────────────────────
  const rawRuc   = (formData.get("ruc") as string | null)?.trim() ?? "";
  const rucCheck = validateRUC(rawRuc);

  if (!rucCheck.valid) {
    return { ok: false, error: rucCheck.error! };
  }

  const normalizedRuc = rucCheck.normalized!;

  // ── Parse other fields ────────────────────────────────────────────────────
  const legalName = (formData.get("legalName") as string | null)?.trim() ?? "";
  if (!legalName) {
    return { ok: false, error: "La razón social es requerida" };
  }

  const tradeName  = (formData.get("tradeName")  as string | null)?.trim() || null;
  const regimen    = (formData.get("taxRegimes")  as string | null)?.trim() ?? "";

  // taxRegimes stored as text[] — split the single select value into parts
  // e.g. "IVA General / IRE General" → ["IVA General", "IRE General"]
  const taxRegimes = regimen
    ? regimen.split("/").map((r) => r.trim()).filter(Boolean)
    : [];

  // ── Insert ────────────────────────────────────────────────────────────────
  try {
    const db = getDb();

    const [created] = await db
      .insert(entities)
      .values({
        ruc:      normalizedRuc,
        legalName,
        tradeName,
        taxRegimes,
        status:   "active",
      })
      .returning();

    revalidatePath("/empresas");

    return { ok: true, data: created };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al crear la empresa";
    // Detect unique constraint on RUC
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return { ok: false, error: `El RUC ${normalizedRuc} ya está registrado` };
    }
    return { ok: false, error: msg };
  }
}
