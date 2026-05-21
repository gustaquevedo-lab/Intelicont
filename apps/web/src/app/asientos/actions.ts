"use server";

import { eq, and, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  entities, chartOfAccounts, accounts, fiscalPeriods,
  journalEntries, journalLines,
  type JournalEntry,
} from "@/lib/db/schema";

// ─── Result type ──────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Load entities (for empresa selector) ────────────────────────────────────

export interface EntityOption {
  id:        string;
  ruc:       string;
  legalName: string;
}

export async function loadEntidades(): Promise<ActionResult<EntityOption[]>> {
  try {
    const db = getDb();
    const rows = await db
      .select({ id: entities.id, ruc: entities.ruc, legalName: entities.legalName })
      .from(entities)
      .where(eq(entities.status, "active"))
      .orderBy(entities.legalName);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar empresas" };
  }
}

// ─── Load accounts for an entity (for autocomplete) ──────────────────────────

export interface AccountOption {
  id:           string;
  code:         string;
  name:         string;
  nature:       string | null;
  allowsPosting: boolean | null;
}

export async function loadCuentas(
  entityId: string,
  query = ""
): Promise<ActionResult<AccountOption[]>> {
  if (!entityId) return { ok: true, data: [] };

  try {
    const db = getDb();

    // Find the chart of accounts for this entity (fiscal_py kind first)
    const [coa] = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.entityId, entityId))
      .orderBy(chartOfAccounts.kind)   // fiscal_py sorts before others
      .limit(1);

    if (!coa) return { ok: true, data: [] };

    const whereQuery = query.trim()
      ? or(
          ilike(accounts.code, `%${query}%`),
          ilike(accounts.name, `%${query}%`)
        )
      : undefined;

    const rows = await db
      .select({
        id:           accounts.id,
        code:         accounts.code,
        name:         accounts.name,
        nature:       accounts.nature,
        allowsPosting: accounts.allowsPosting,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.coaId, coa.id),
          eq(accounts.allowsPosting, true),
          whereQuery
        )
      )
      .orderBy(accounts.code)
      .limit(100);

    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar cuentas" };
  }
}

// ─── Create journal entry (DRAFT) ────────────────────────────────────────────

export interface CreateLineaInput {
  accountId:    string;
  debit:        string;
  credit:       string;
  currencyCode: string;
  description:  string;
}

export interface CreateAsientoInput {
  entityId:    string;
  date:        string;
  description: string;
  lineas:      CreateLineaInput[];
}

export async function createAsiento(
  input: CreateAsientoInput
): Promise<ActionResult<{ id: string; number: string }>> {
  // ── Frontend-equivalent validations ───────────────────────────────────────
  if (!input.entityId) return { ok: false, error: "Seleccioná una empresa" };
  if (!input.description.trim()) return { ok: false, error: "La descripción es requerida" };
  if (!input.date) return { ok: false, error: "La fecha es requerida" };

  const lineasValidas = input.lineas.filter(
    (l) => l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0)
  );

  if (lineasValidas.length < 2) {
    return { ok: false, error: "Mínimo 2 líneas con cuenta y monto" };
  }

  // ── Double-entry balance check (defense in depth — DB trigger also validates on POST) ──
  const totalDebit  = lineasValidas.reduce((s, l) => s + (parseFloat(l.debit)  || 0), 0);
  const totalCredit = lineasValidas.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return {
      ok: false,
      error: `Doble partida no cumplida: débito ₲${totalDebit.toLocaleString("es-PY")} ≠ crédito ₲${totalCredit.toLocaleString("es-PY")}`,
    };
  }

  if (totalDebit === 0) {
    return { ok: false, error: "El total del asiento no puede ser cero" };
  }

  // ── Find or auto-resolve fiscal period ────────────────────────────────────
  const entryDate = new Date(input.date);
  const year  = entryDate.getFullYear();
  const month = entryDate.getMonth() + 1;

  try {
    const db = getDb();

    const result = await db.transaction(async (tx) => {
      // Resolve fiscal period
      let periodId: string | null = null;
      const [period] = await tx
        .select()
        .from(fiscalPeriods)
        .where(
          and(
            eq(fiscalPeriods.entityId, input.entityId),
            eq(fiscalPeriods.year, year),
            eq(fiscalPeriods.month, month)
          )
        )
        .limit(1);

      if (period) {
        if (period.status === "closed") {
          throw new Error(`El período ${month}/${year} está cerrado`);
        }
        periodId = period.id;
      }
      // If no period found, insert without periodId (will be linked later)

      // Generate correlative number
      const [countRow] = await tx
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(journalEntries)
        .where(eq(journalEntries.entityId, input.entityId));

      const seq    = (countRow?.count ?? 0) + 1;
      const number = `${String(seq).padStart(5, "0")}-${year}`;

      // INSERT journal entry as DRAFT
      const [entry] = await tx
        .insert(journalEntries)
        .values({
          entityId:    input.entityId,
          periodId,
          date:        entryDate,
          number,
          source:      "manual",
          description: input.description.trim(),
          status:      "draft",
        })
        .returning();

      // INSERT journal lines
      await tx.insert(journalLines).values(
        lineasValidas.map((l) => ({
          entryId:     entry.id,
          accountId:   l.accountId,
          debit:       l.debit  || "0",
          credit:      l.credit || "0",
          currencyCode: l.currencyCode || "PYG",
          description: l.description || null,
        }))
      );

      return { id: entry.id, number };
    });

    revalidatePath("/asientos");
    return { ok: true, data: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al guardar el asiento";
    return { ok: false, error: msg };
  }
}

// ─── Post a DRAFT entry (IMMUTABLE after this) ────────────────────────────────

export async function postearAsiento(
  id: string
): Promise<ActionResult<void>> {
  try {
    const db = getDb();

    // Fetch entry
    const [entry] = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, id));

    if (!entry) return { ok: false, error: "Asiento no encontrado" };

    if (entry.status === "posted") {
      return { ok: false, error: "Este asiento ya está posteado (inmutable)" };
    }
    if (entry.status === "reversed") {
      return { ok: false, error: "Este asiento fue revertido y no puede postearse" };
    }

    // Re-validate balance before posting
    const lines = await db
      .select()
      .from(journalLines)
      .where(eq(journalLines.entryId, id));

    const totalDebit  = lines.reduce((s, l) => s + parseFloat(l.debit), 0);
    const totalCredit = lines.reduce((s, l) => s + parseFloat(l.credit), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return { ok: false, error: "El asiento está desbalanceado. No se puede postear." };
    }

    // Update to POSTED — the DB trigger enforce_double_entry will also validate
    await db
      .update(journalEntries)
      .set({ status: "posted", postedAt: new Date() })
      .where(and(eq(journalEntries.id, id), eq(journalEntries.status, "draft")));

    revalidatePath("/asientos");
    return { ok: true, data: undefined };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al postear el asiento";
    // Surface DB trigger violations to the user
    if (msg.includes("Doble partida") || msg.includes("inmutables")) {
      return { ok: false, error: msg };
    }
    return { ok: false, error: msg };
  }
}
