"use server";

import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  entities, chartOfAccounts, accounts,
  journalEntries, journalLines,
} from "@/lib/db/schema";

// ─── Shared result type ───────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Entity list (for selector) ───────────────────────────────────────────────

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

// ─── Account list (for selector) ─────────────────────────────────────────────

export interface AccountOption {
  id:     string;
  code:   string;
  name:   string;
  nature: string | null;
}

export async function loadCuentasParaLibro(
  entityId: string
): Promise<ActionResult<AccountOption[]>> {
  if (!entityId) return { ok: true, data: [] };
  try {
    const db = getDb();

    const [coa] = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.entityId, entityId))
      .orderBy(chartOfAccounts.kind)
      .limit(1);

    if (!coa) return { ok: true, data: [] };

    const rows = await db
      .select({ id: accounts.id, code: accounts.code, name: accounts.name, nature: accounts.nature })
      .from(accounts)
      .where(eq(accounts.coaId, coa.id))
      .orderBy(accounts.code);

    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar cuentas" };
  }
}

// ─── Libro Mayor query ────────────────────────────────────────────────────────

export interface LibroMayorLine {
  id:          string;
  fecha:       string;   // ISO date string
  numero:      string;
  descripcion: string;
  debit:       number;
  credit:      number;
  saldo:       number;   // running balance at this line
  entryId:     string;
  entryStatus: string;
}

export interface LibroMayorResult {
  account:      AccountOption;
  saldoInicial: number;         // opening balance (0 for the filtered period)
  lines:        LibroMayorLine[];
  totalDebit:   number;
  totalCredit:  number;
  saldoFinal:   number;
}

export async function getLibroMayor(
  entityId:  string,
  accountId: string,
  dateFrom:  string,   // "YYYY-MM-DD"
  dateTo:    string,   // "YYYY-MM-DD"
): Promise<ActionResult<LibroMayorResult>> {
  if (!entityId)  return { ok: false, error: "Seleccioná una empresa" };
  if (!accountId) return { ok: false, error: "Seleccioná una cuenta" };
  if (!dateFrom)  return { ok: false, error: "Ingresá fecha desde" };
  if (!dateTo)    return { ok: false, error: "Ingresá fecha hasta" };

  try {
    const db = getDb();

    // Load the account metadata
    const [account] = await db
      .select({ id: accounts.id, code: accounts.code, name: accounts.name, nature: accounts.nature })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    if (!account) return { ok: false, error: "Cuenta no encontrada" };

    // Parse dates — include entire last day
    const from = new Date(`${dateFrom}T00:00:00`);
    const to   = new Date(`${dateTo}T23:59:59.999`);

    // JOIN: journal_lines → journal_entries, filter by entity + account + date range
    // Only include POSTED entries (draft entries are not part of the ledger)
    const rows = await db
      .select({
        lineId:      journalLines.id,
        debit:       journalLines.debit,
        credit:      journalLines.credit,
        lineDesc:    journalLines.description,
        entryId:     journalEntries.id,
        entryDate:   journalEntries.date,
        entryNumber: journalEntries.number,
        entryDesc:   journalEntries.description,
        entryStatus: journalEntries.status,
      })
      .from(journalLines)
      .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
      .where(
        and(
          eq(journalLines.accountId, accountId),
          eq(journalEntries.entityId, entityId),
          eq(journalEntries.status, "posted"),
          gte(journalEntries.date, from),
          lte(journalEntries.date, to),
        )
      )
      .orderBy(asc(journalEntries.date), asc(journalEntries.number));

    // Calculate running balance
    // For asset/expense accounts: positive balance = debit - credit
    // For liability/equity/income accounts: positive balance = credit - debit
    const isDebitNature =
      account.nature === "asset" || account.nature === "expense";

    let running = 0;
    const lines: LibroMayorLine[] = rows.map((r) => {
      const d = parseFloat(r.debit  ?? "0");
      const c = parseFloat(r.credit ?? "0");

      if (isDebitNature) {
        running += d - c;
      } else {
        running += c - d;
      }

      return {
        id:          r.lineId,
        fecha:       r.entryDate instanceof Date
                       ? r.entryDate.toISOString().split("T")[0]
                       : String(r.entryDate),
        numero:      r.entryNumber ?? "",
        descripcion: r.lineDesc ?? r.entryDesc ?? "",
        debit:       d,
        credit:      c,
        saldo:       running,
        entryId:     r.entryId,
        entryStatus: r.entryStatus ?? "posted",
      };
    });

    const totalDebit  = lines.reduce((s, l) => s + l.debit,  0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    const saldoFinal  = lines.length > 0 ? lines[lines.length - 1].saldo : 0;

    return {
      ok: true,
      data: {
        account,
        saldoInicial: 0,
        lines,
        totalDebit,
        totalCredit,
        saldoFinal,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar libro mayor" };
  }
}
