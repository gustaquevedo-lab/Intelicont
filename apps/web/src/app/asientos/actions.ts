"use server";

import { eq, and, ilike, or, sql, desc, asc, count as drizzleCount } from "drizzle-orm";
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

// ─── List journal entries with totals ────────────────────────────────────────

export interface AsientoRow {
  id:          string;
  number:      string;
  date:        string;
  description: string;
  status:      string;
  source:      string;
  entityId:    string;
  entityName:  string;
  totalDebit:  number;
  lineCount:   number;
}

export async function loadAsientos(filters?: {
  entityId?: string;
  status?:   string;
  search?:   string;
}): Promise<ActionResult<AsientoRow[]>> {
  try {
    const db = getDb();

    const conditions = [];
    if (filters?.entityId) conditions.push(eq(journalEntries.entityId, filters.entityId));
    if (filters?.status && filters.status !== "todos") {
      conditions.push(eq(journalEntries.status, filters.status as "draft" | "posted" | "reversed"));
    }
    if (filters?.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(or(
        ilike(journalEntries.description, q),
        ilike(journalEntries.number, q),
      ));
    }

    const rows = await db
      .select({
        id:          journalEntries.id,
        number:      journalEntries.number,
        date:        journalEntries.date,
        description: journalEntries.description,
        status:      journalEntries.status,
        source:      journalEntries.source,
        entityId:    journalEntries.entityId,
        entityName:  entities.legalName,
        totalDebit:  sql<number>`COALESCE(SUM(${journalLines.debit}::numeric), 0)`,
        lineCount:   sql<number>`COUNT(${journalLines.id})::int`,
      })
      .from(journalEntries)
      .innerJoin(entities,      eq(journalEntries.entityId, entities.id))
      .leftJoin(journalLines,   eq(journalLines.entryId, journalEntries.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .groupBy(journalEntries.id, entities.legalName)
      .orderBy(desc(journalEntries.date), desc(journalEntries.createdAt))
      .limit(200);

    return {
      ok: true,
      data: rows.map((r) => ({
        id:          r.id,
        number:      r.number ?? "",
        date:        r.date instanceof Date
                       ? r.date.toISOString().split("T")[0]
                       : String(r.date),
        description: r.description ?? "",
        status:      r.status ?? "draft",
        source:      r.source ?? "manual",
        entityId:    r.entityId,
        entityName:  r.entityName,
        totalDebit:  Number(r.totalDebit),
        lineCount:   Number(r.lineCount),
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar asientos" };
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

// ─── Load single entry with lines ────────────────────────────────────────────

export interface AsientoLine {
  id:          string;
  accountId:   string;
  accountCode: string;
  accountName: string;
  debit:       number;
  credit:      number;
  currency:    string;
  description: string | null;
}

export interface AsientoDetail {
  id:          string;
  number:      string;
  date:        string;
  description: string;
  status:      string;
  source:      string;
  entityId:    string;
  entityName:  string;
  postedAt:    string | null;
  reversalOf:  string | null;
  versionOf:   string | null;
  createdAt:   string;
  totalDebit:  number;
  totalCredit: number;
  lineas:      AsientoLine[];
}

export async function loadAsientoDetail(id: string): Promise<ActionResult<AsientoDetail>> {
  if (!id) return { ok: false, error: "ID requerido" };
  try {
    const db = getDb();

    const [row] = await db
      .select({
        id:          journalEntries.id,
        number:      journalEntries.number,
        date:        journalEntries.date,
        description: journalEntries.description,
        status:      journalEntries.status,
        source:      journalEntries.source,
        entityId:    journalEntries.entityId,
        entityName:  entities.legalName,
        postedAt:    journalEntries.postedAt,
        reversalOf:  journalEntries.reversalOf,
        versionOf:   journalEntries.versionOf,
        createdAt:   journalEntries.createdAt,
      })
      .from(journalEntries)
      .innerJoin(entities, eq(journalEntries.entityId, entities.id))
      .where(eq(journalEntries.id, id));

    if (!row) return { ok: false, error: "Asiento no encontrado" };

    const lines = await db
      .select({
        id:          journalLines.id,
        accountId:   journalLines.accountId,
        accountCode: accounts.code,
        accountName: accounts.name,
        debit:       journalLines.debit,
        credit:      journalLines.credit,
        currency:    journalLines.currencyCode,
        description: journalLines.description,
      })
      .from(journalLines)
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .where(eq(journalLines.entryId, id))
      .orderBy(asc(journalLines.id));

    const lineas: AsientoLine[] = lines.map((l) => ({
      id:          l.id,
      accountId:   l.accountId,
      accountCode: l.accountCode,
      accountName: l.accountName,
      debit:       Number(l.debit),
      credit:      Number(l.credit),
      currency:    l.currency,
      description: l.description,
    }));

    const totalDebit  = lineas.reduce((s, l) => s + l.debit,  0);
    const totalCredit = lineas.reduce((s, l) => s + l.credit, 0);

    return {
      ok: true,
      data: {
        id:          row.id,
        number:      row.number ?? "",
        date:        row.date instanceof Date ? row.date.toISOString().split("T")[0] : String(row.date).slice(0, 10),
        description: row.description ?? "",
        status:      row.status ?? "draft",
        source:      row.source ?? "manual",
        entityId:    row.entityId,
        entityName:  row.entityName,
        postedAt:    row.postedAt instanceof Date ? row.postedAt.toISOString() : row.postedAt ? String(row.postedAt) : null,
        reversalOf:  row.reversalOf,
        versionOf:   row.versionOf,
        createdAt:   row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        totalDebit,
        totalCredit,
        lineas,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar asiento" };
  }
}

// ─── Reverse a POSTED entry (contra-asiento) ──────────────────────────────────

export async function reverseJournalEntry(
  entryId:     string,
  description: string,
): Promise<ActionResult<{ id: string; number: string }>> {
  if (!entryId) return { ok: false, error: "ID requerido" };

  try {
    const db = getDb();

    const [original] = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.id, entryId));

    if (!original)                     return { ok: false, error: "Asiento no encontrado" };
    if (original.status !== "posted")  return { ok: false, error: "Solo se pueden revertir asientos posteados" };
    if (original.reversalOf)           return { ok: false, error: "Este asiento ya es una reversión" };

    const originalLines = await db
      .select()
      .from(journalLines)
      .where(eq(journalLines.entryId, entryId));

    if (originalLines.length === 0) return { ok: false, error: "El asiento no tiene líneas" };

    const result = await db.transaction(async (tx) => {
      const year = new Date().getFullYear();
      const [{ cnt }] = await tx
        .select({ cnt: drizzleCount() })
        .from(journalEntries)
        .where(eq(journalEntries.entityId, original.entityId));

      const seq    = (Number(cnt) || 0) + 1;
      const number = `REV-${String(seq).padStart(5, "0")}-${year}`;

      const [reversal] = await tx
        .insert(journalEntries)
        .values({
          entityId:    original.entityId,
          periodId:    original.periodId ?? undefined,
          date:        new Date(),
          number,
          source:      "manual" as const,
          description: description.trim() || `Reversión de ${original.number ?? entryId}`,
          status:      "posted" as const,
          postedAt:    new Date(),
          reversalOf:  entryId,
        })
        .returning();

      // Swap debit ↔ credit on each line
      await tx.insert(journalLines).values(
        originalLines.map((l) => ({
          entryId:     reversal.id,
          accountId:   l.accountId,
          debit:       l.credit,   // swapped
          credit:      l.debit,    // swapped
          currencyCode: l.currencyCode,
          fxRate:      l.fxRate ?? "1",
          description: l.description,
        }))
      );

      // Mark original as reversed
      await tx
        .update(journalEntries)
        .set({ status: "reversed" })
        .where(eq(journalEntries.id, entryId));

      return { id: reversal.id, number };
    });

    revalidatePath("/asientos");
    revalidatePath(`/asientos/${entryId}`);
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al revertir asiento" };
  }
}
