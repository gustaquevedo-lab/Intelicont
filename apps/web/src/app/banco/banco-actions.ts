"use server";

import { eq, and, desc, asc, isNull, count as drizzleCount } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  bankAccounts, bankMovements,
  reconciliations, journalEntries, journalLines,
  accounts, entities, fiscalPeriods,
} from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Types ─────────────────────────────────────────────────────────────────

export interface BankAccountRow {
  id: string;
  bankName: string;
  accountNumber: string;
  currencyCode: string;
  glAccountId: string | null;
}

export interface BankMovementRow {
  id: string;
  date: string;
  description: string;
  ref: string;
  amount: number;
  direction: "credit" | "debit";
  source: string;
  reconciliationStatus: "pending" | "matched" | "flagged" | "manual" | null;
  reconciliationScore: number | null;
  journalEntryId: string | null;
  journalEntryNumber: string | null;
}

export interface JournalLineRow {
  id: string;
  entryId: string;
  entryNumber: string;
  date: string;
  description: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  reconciliationStatus: "pending" | "matched" | "flagged" | "manual" | null;
}

export interface AiMatchSuggestion {
  bankMovementId: string;
  journalLineId: string;
  score: number;        // 0–100
  reason: string;
}

// ─── Load Bank Accounts ───────────────────────────────────────────────────

export async function loadBankAccounts(
  entityId: string
): Promise<ActionResult<BankAccountRow[]>> {
  if (!entityId) return { ok: false, error: "entityId requerido" };
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(bankAccounts)
      .where(and(eq(bankAccounts.entityId, entityId), eq(bankAccounts.isActive, true)))
      .orderBy(bankAccounts.bankName);
    return {
      ok: true,
      data: rows.map((r) => ({
        id:            r.id,
        bankName:      r.bankName,
        accountNumber: r.accountNumber,
        currencyCode:  r.currencyCode ?? "PYG",
        glAccountId:   r.glAccountId,
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

// ─── Load Bank Movements ─────────────────────────────────────────────────

export async function loadBankMovements(
  bankAccountId: string,
  limit = 100
): Promise<ActionResult<BankMovementRow[]>> {
  if (!bankAccountId) return { ok: false, error: "bankAccountId requerido" };
  try {
    const db = getDb();
    const rows = await db
      .select({
        id:          bankMovements.id,
        date:        bankMovements.date,
        description: bankMovements.description,
        ref:         bankMovements.ref,
        amount:      bankMovements.amount,
        direction:   bankMovements.direction,
        source:      bankMovements.source,
        recStatus:   reconciliations.status,
        recScore:    reconciliations.score,
        jeId:        journalEntries.id,
        jeNumber:    journalEntries.number,
      })
      .from(bankMovements)
      .leftJoin(reconciliations, eq(reconciliations.bankMovementId, bankMovements.id))
      .leftJoin(journalEntries,  eq(journalEntries.id, reconciliations.glTransactionId))
      .where(eq(bankMovements.bankAccountId, bankAccountId))
      .orderBy(desc(bankMovements.date))
      .limit(limit);

    return {
      ok: true,
      data: rows.map((r) => ({
        id:                   r.id,
        date:                 r.date,
        description:          r.description ?? "",
        ref:                  r.ref ?? "",
        amount:               Number(r.amount),
        direction:            r.direction,
        source:               r.source ?? "manual",
        reconciliationStatus: r.recStatus ?? null,
        reconciliationScore:  r.recScore ? Number(r.recScore) : null,
        journalEntryId:       r.jeId ?? null,
        journalEntryNumber:   r.jeNumber ?? null,
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar movimientos" };
  }
}

// ─── Load Journal Lines (unmatched, for GL side) ─────────────────────────

export async function loadUnmatchedJournalLines(
  entityId: string,
  glAccountId: string,
  limit = 100
): Promise<ActionResult<JournalLineRow[]>> {
  if (!entityId || !glAccountId) return { ok: false, error: "Faltan parámetros" };
  try {
    const db = getDb();
    // Lines against the GL account tied to this bank account
    const rows = await db
      .select({
        lineId:      journalLines.id,
        entryId:     journalEntries.id,
        entryNumber: journalEntries.number,
        date:        journalEntries.date,
        desc:        journalEntries.description,
        accCode:     accounts.code,
        accName:     accounts.name,
        debit:       journalLines.debit,
        credit:      journalLines.credit,
      })
      .from(journalLines)
      .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
      .innerJoin(accounts,       eq(journalLines.accountId, accounts.id))
      .where(and(
        eq(journalEntries.entityId, entityId),
        eq(journalLines.accountId, glAccountId),
      ))
      .orderBy(desc(journalEntries.date))
      .limit(limit);

    // Get existing reconciliations for these lines
    const recRows = await db
      .select()
      .from(reconciliations)
      .where(eq(reconciliations.status, "matched"));
    const matchedEntryIds = new Set(recRows.map((r) => r.glTransactionId ?? ""));

    return {
      ok: true,
      data: rows
        .filter((r) => !matchedEntryIds.has(r.entryId ?? ""))
        .map((r) => ({
          id:                   r.lineId,
          entryId:              r.entryId,
          entryNumber:          r.entryNumber ?? "",
          date:                 r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
          description:          r.desc ?? "",
          accountCode:          r.accCode,
          accountName:          r.accName,
          debit:                Number(r.debit),
          credit:               Number(r.credit),
          reconciliationStatus: null,
        })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar asientos" };
  }
}

// ─── AI Matcher — Score-based matching ────────────────────────────────────
// Pure logic, no external API call. Uses amount, date proximity and keywords.

export async function runAiMatcher(
  bankMovements: BankMovementRow[],
  journalLines: JournalLineRow[]
): Promise<ActionResult<AiMatchSuggestion[]>> {
  try {
    const suggestions: AiMatchSuggestion[] = [];

    for (const bm of bankMovements) {
      if (bm.reconciliationStatus === "matched") continue;

      const bmAmount = bm.amount;
      const bmDate   = new Date(bm.date).getTime();
      const bmWords  = (bm.description + " " + bm.ref).toLowerCase().split(/\s+/);

      for (const jl of journalLines) {
        const jlAmount = bm.direction === "credit" ? jl.credit : jl.debit;
        if (jlAmount === 0) continue;

        let score = 0;
        const reasons: string[] = [];

        // 1. Amount match (0-50 pts)
        const amtDiff = Math.abs(bmAmount - jlAmount) / Math.max(bmAmount, jlAmount);
        if (amtDiff === 0) {
          score += 50;
          reasons.push("Monto exacto");
        } else if (amtDiff < 0.01) {
          score += 40;
          reasons.push("Monto ≈ exacto (<1%)");
        } else if (amtDiff < 0.05) {
          score += 25;
          reasons.push("Monto similar (<5%)");
        } else if (amtDiff < 0.15) {
          score += 10;
          reasons.push("Monto aproximado");
        }

        // 2. Date proximity (0-30 pts)
        const jlDate = new Date(jl.date).getTime();
        const daysDiff = Math.abs(bmDate - jlDate) / (1000 * 60 * 60 * 24);
        if (daysDiff === 0)      { score += 30; reasons.push("Misma fecha"); }
        else if (daysDiff <= 1)  { score += 25; reasons.push("1 día de diferencia"); }
        else if (daysDiff <= 3)  { score += 18; reasons.push("≤3 días"); }
        else if (daysDiff <= 7)  { score += 10; reasons.push("≤7 días"); }
        else if (daysDiff <= 15) { score += 5;  reasons.push("≤15 días"); }

        // 3. Keyword overlap (0-20 pts)
        const jlWords = (jl.description + " " + jl.entryNumber).toLowerCase().split(/\s+/);
        const overlap = bmWords.filter((w) => w.length > 3 && jlWords.includes(w)).length;
        if (overlap >= 3)      { score += 20; reasons.push(`${overlap} palabras en común`); }
        else if (overlap >= 2) { score += 12; reasons.push(`${overlap} palabras en común`); }
        else if (overlap >= 1) { score += 6;  reasons.push("1 palabra en común"); }

        if (score >= 30) {
          suggestions.push({
            bankMovementId: bm.id,
            journalLineId:  jl.id,
            score:          Math.min(100, score),
            reason:         reasons.join(" · "),
          });
        }
      }
    }

    // Sort by score desc, keep best match per bank movement
    suggestions.sort((a, b) => b.score - a.score);
    const seen = new Set<string>();
    const deduped = suggestions.filter((s) => {
      if (seen.has(s.bankMovementId)) return false;
      seen.add(s.bankMovementId);
      return true;
    });

    return { ok: true, data: deduped };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error en AI Matcher" };
  }
}

// ─── Import CSV Movements ─────────────────────────────────────────────────

export interface CsvMovementInput {
  date: string;        // YYYY-MM-DD
  description: string;
  ref: string;
  amount: number;
  direction: "credit" | "debit";
}

export async function importBankMovements(
  bankAccountId: string,
  movements: CsvMovementInput[]
): Promise<ActionResult<{ imported: number; skipped: number }>> {
  if (!bankAccountId || !movements.length) return { ok: false, error: "Parámetros inválidos" };
  try {
    const db = getDb();
    let imported = 0;
    let skipped  = 0;

    for (const m of movements) {
      // De-duplicate by ref + date
      if (m.ref) {
        const [existing] = await db
          .select({ id: bankMovements.id })
          .from(bankMovements)
          .where(and(
            eq(bankMovements.bankAccountId, bankAccountId),
            eq(bankMovements.ref, m.ref),
          ))
          .limit(1);
        if (existing) { skipped++; continue; }
      }

      await db.insert(bankMovements).values({
        bankAccountId,
        date:        m.date,
        description: m.description,
        ref:         m.ref || null,
        amount:      String(m.amount),
        direction:   m.direction,
        source:      "import",
      });
      imported++;
    }

    revalidatePath("/banco");
    return { ok: true, data: { imported, skipped } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al importar" };
  }
}

// ─── Add Manual Bank Movement ─────────────────────────────────────────────

export async function addManualBankMovement(
  bankAccountId: string,
  input: { date: string; description: string; ref?: string; amount: number; direction: "credit" | "debit" }
): Promise<ActionResult<{ id: string }>> {
  if (!bankAccountId) return { ok: false, error: "bankAccountId requerido" };
  try {
    const db = getDb();
    const [row] = await db.insert(bankMovements).values({
      bankAccountId,
      date:        input.date,
      description: input.description,
      ref:         input.ref || null,
      amount:      String(input.amount),
      direction:   input.direction,
      source:      "manual",
    }).returning();
    revalidatePath("/banco");
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al registrar movimiento" };
  }
}

// ─── Mark Reconciliation ─────────────────────────────────────────────────

export async function markReconciliation(
  bankMovementId: string,
  glTransactionId: string,
  status: "matched" | "manual" | "flagged",
  score = 100
): Promise<ActionResult<void>> {
  try {
    const db = getDb();

    // Upsert reconciliation
    const [existing] = await db
      .select()
      .from(reconciliations)
      .where(eq(reconciliations.bankMovementId, bankMovementId))
      .limit(1);

    if (existing) {
      await db.update(reconciliations)
        .set({ status, glTransactionId, score: String(score), matchedAt: new Date(), matchedBy: "manual" })
        .where(eq(reconciliations.id, existing.id));
    } else {
      await db.insert(reconciliations).values({
        bankAccountId: (await db.select({ id: bankMovements.bankAccountId }).from(bankMovements).where(eq(bankMovements.id, bankMovementId)).limit(1))[0]?.id ?? bankMovementId,
        bankMovementId,
        glTransactionId,
        status,
        score: String(score),
        matchedAt: new Date(),
        matchedBy: "manual",
      });
    }

    revalidatePath("/banco");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al conciliar" };
  }
}

// ─── Parse CSV text into movements ───────────────────────────────────────
// Supports format: fecha,descripcion,referencia,debito,credito
// or: fecha,descripcion,referencia,monto (positive=credit, negative=debit)

export async function parseCsvText(csvText: string): Promise<CsvMovementInput[]> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(/[,;]/);
  const hasDebitoCredito = header.includes("debito") || header.includes("débito");

  const result: CsvMovementInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,;]/);
    try {
      if (hasDebitoCredito) {
        const date  = cols[0]?.trim() ?? "";
        const desc  = cols[1]?.trim() ?? "";
        const ref   = cols[2]?.trim() ?? "";
        const debit = parseFloat((cols[3] ?? "0").replace(/[^0-9.-]/g, ""));
        const cred  = parseFloat((cols[4] ?? "0").replace(/[^0-9.-]/g, ""));
        if (debit > 0) result.push({ date, description: desc, ref, amount: debit, direction: "debit" });
        else if (cred > 0) result.push({ date, description: desc, ref, amount: cred, direction: "credit" });
      } else {
        const date   = cols[0]?.trim() ?? "";
        const desc   = cols[1]?.trim() ?? "";
        const ref    = cols[2]?.trim() ?? "";
        const amount = parseFloat((cols[3] ?? "0").replace(/[^0-9.-]/g, ""));
        result.push({
          date, description: desc, ref,
          amount: Math.abs(amount),
          direction: amount >= 0 ? "credit" : "debit",
        });
      }
    } catch { /* skip malformed line */ }
  }

  return result;
}
