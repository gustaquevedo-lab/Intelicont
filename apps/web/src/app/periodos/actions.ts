"use server";

import { eq, and, desc, asc, sql, count as drizzleCount } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  entities, fiscalPeriods, journalEntries, journalLines,
  accounts, chartOfAccounts,
  type FiscalPeriod,
} from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

// ─── Entity list ──────────────────────────────────────────────────────────────

export async function loadEntidadesParaPeriodos(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
  try {
    const db   = getDb();
    const rows = await db
      .select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities).where(eq(entities.status, "active")).orderBy(entities.legalName);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

// ─── Period row ───────────────────────────────────────────────────────────────

export interface PeriodoRow {
  id:           string;
  entityId:     string;
  year:         number;
  month:        number;
  monthName:    string;
  status:       string;
  closedAt:     string | null;
  draftCount:   number;
  postedCount:  number;
}

export async function loadPeriodos(entityId: string): Promise<ActionResult<PeriodoRow[]>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };
  try {
    const db   = getDb();
    const rows = await db
      .select()
      .from(fiscalPeriods)
      .where(eq(fiscalPeriods.entityId, entityId))
      .orderBy(desc(fiscalPeriods.year), desc(fiscalPeriods.month));

    // Enrich with entry counts
    const result: PeriodoRow[] = await Promise.all(rows.map(async (p) => {
      const from = new Date(p.year, p.month - 1, 1);
      const to   = new Date(p.year, p.month, 1);
      const [drafts] = await db.select({ cnt: drizzleCount() }).from(journalEntries)
        .where(and(eq(journalEntries.entityId, entityId), eq(journalEntries.status, "draft"),
          sql`${journalEntries.date} >= ${from} AND ${journalEntries.date} < ${to}`));
      const [posted] = await db.select({ cnt: drizzleCount() }).from(journalEntries)
        .where(and(eq(journalEntries.entityId, entityId), eq(journalEntries.status, "posted"),
          sql`${journalEntries.date} >= ${from} AND ${journalEntries.date} < ${to}`));
      return {
        id:          p.id,
        entityId:    p.entityId,
        year:        p.year,
        month:       p.month,
        monthName:   MONTHS_ES[p.month - 1] ?? String(p.month),
        status:      p.status ?? "open",
        closedAt:    p.closedAt instanceof Date ? p.closedAt.toISOString() : p.closedAt ? String(p.closedAt) : null,
        draftCount:  Number(drafts?.cnt ?? 0),
        postedCount: Number(posted?.cnt ?? 0),
      };
    }));

    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar períodos" };
  }
}

// ─── Ensure period exists ─────────────────────────────────────────────────────

async function ensurePeriod(db: ReturnType<typeof getDb>, entityId: string, year: number, month: number): Promise<FiscalPeriod> {
  const [existing] = await db.select().from(fiscalPeriods)
    .where(and(eq(fiscalPeriods.entityId, entityId), eq(fiscalPeriods.year, year), eq(fiscalPeriods.month, month)));
  if (existing) return existing;
  const [created] = await db.insert(fiscalPeriods).values({ entityId, year, month, status: "open" }).returning();
  return created;
}

// ─── Open a new period ────────────────────────────────────────────────────────

export async function openPeriod(entityId: string, year: number, month: number): Promise<ActionResult<PeriodoRow>> {
  if (!entityId) return { ok: false, error: "Empresa requerida" };
  try {
    const db = getDb();
    const [existing] = await db.select().from(fiscalPeriods)
      .where(and(eq(fiscalPeriods.entityId, entityId), eq(fiscalPeriods.year, year), eq(fiscalPeriods.month, month)));
    if (existing && existing.status === "closed") {
      return { ok: false, error: "El período ya está cerrado. Usá Reapertura si es necesario." };
    }
    if (existing) return { ok: false, error: "El período ya existe" };

    const [created] = await db.insert(fiscalPeriods)
      .values({ entityId, year, month, status: "open" }).returning();

    revalidatePath("/periodos");
    return {
      ok: true,
      data: {
        id: created.id, entityId: created.entityId, year: created.year,
        month: created.month, monthName: MONTHS_ES[created.month - 1] ?? "",
        status: "open", closedAt: null, draftCount: 0, postedCount: 0,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

// ─── Close a period ───────────────────────────────────────────────────────────

export interface CloseResult {
  periodId:        string;
  closingEntryId:  string | null;
  closingNumber:   string | null;
  draftBlocked:    number;
  resultadoNeto:   number;
}

export async function closePeriod(
  entityId: string,
  year:     number,
  month:    number,
  generateClosingEntry: boolean,
): Promise<ActionResult<CloseResult>> {
  if (!entityId) return { ok: false, error: "Empresa requerida" };

  try {
    const db   = getDb();
    const from = new Date(year, month - 1, 1);
    const to   = new Date(year, month, 1);

    // Get or create the period
    const period = await ensurePeriod(db, entityId, year, month);

    if (period.status === "closed") {
      return { ok: false, error: "El período ya está cerrado" };
    }

    // Check for unposted drafts in the period
    const [draftsRow] = await db.select({ cnt: drizzleCount() })
      .from(journalEntries)
      .where(and(
        eq(journalEntries.entityId, entityId),
        eq(journalEntries.status, "draft"),
        sql`${journalEntries.date} >= ${from} AND ${journalEntries.date} < ${to}`,
      ));
    const draftCount = Number(draftsRow?.cnt ?? 0);

    // Get chart of accounts
    const [coa] = await db.select().from(chartOfAccounts)
      .where(eq(chartOfAccounts.entityId, entityId)).orderBy(chartOfAccounts.kind).limit(1);

    let closingEntryId: string | null   = null;
    let closingNumber:  string | null   = null;
    let resultadoNeto   = 0;

    const result = await db.transaction(async (tx) => {
      // If closing entry requested — generate asiento de cierre
      if (generateClosingEntry && coa) {
        // Get income/expense account balances for the period
        const balances = await tx
          .select({
            accountId:   journalLines.accountId,
            nature:      accounts.nature,
            totalDebit:  sql<string>`SUM(${journalLines.debit}::numeric)`,
            totalCredit: sql<string>`SUM(${journalLines.credit}::numeric)`,
          })
          .from(journalLines)
          .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
          .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
          .where(and(
            eq(journalEntries.entityId, entityId),
            eq(journalEntries.status, "posted"),
            sql`${journalEntries.date} >= ${from} AND ${journalEntries.date} < ${to}`,
            sql`${accounts.nature} IN ('income', 'expense')`,
          ))
          .groupBy(journalLines.accountId, accounts.nature);

        if (balances.length > 0) {
          // Find the "Resultado del Ejercicio" equity account
          // Typically code starts with 3.xx or 4.xx depending on chart
          // We'll use the first equity account we can find with "resultado" in the name
          const [resultadoAcct] = await tx.select()
            .from(accounts)
            .where(and(
              eq(accounts.coaId, coa.id),
              sql`LOWER(${accounts.name}) LIKE '%resultado%'`,
              sql`${accounts.nature} = 'equity'`,
              eq(accounts.allowsPosting, true),
            )).limit(1);

          // Also try "utilidad" or general equity posting account
          const [equityAcct] = resultadoAcct
            ? [resultadoAcct]
            : await tx.select().from(accounts)
                .where(and(
                  eq(accounts.coaId, coa.id),
                  sql`${accounts.nature} = 'equity'`,
                  eq(accounts.allowsPosting, true),
                )).orderBy(asc(accounts.code)).limit(1);

          const lines: Array<{ accountId: string; debit: string; credit: string; description: string }> = [];

          for (const b of balances) {
            const debit  = parseFloat(b.totalDebit  ?? "0");
            const credit = parseFloat(b.totalCredit ?? "0");

            if (b.nature === "income") {
              // Close income: DR Income / CR Resultado
              const balance = credit - debit;
              if (Math.abs(balance) > 0.01) {
                lines.push({ accountId: b.accountId, debit: String(balance), credit: "0", description: "Cierre ingresos" });
                resultadoNeto += balance;
              }
            } else if (b.nature === "expense") {
              // Close expense: CR Expense / DR Resultado
              const balance = debit - credit;
              if (Math.abs(balance) > 0.01) {
                lines.push({ accountId: b.accountId, debit: "0", credit: String(balance), description: "Cierre egresos" });
                resultadoNeto -= balance;
              }
            }
          }

          if (lines.length > 0 && equityAcct) {
            // Balancing line to equity/resultado account
            if (resultadoNeto > 0) {
              lines.push({ accountId: equityAcct.id, debit: "0", credit: String(Math.abs(resultadoNeto)), description: "Resultado del ejercicio" });
            } else if (resultadoNeto < 0) {
              lines.push({ accountId: equityAcct.id, debit: String(Math.abs(resultadoNeto)), credit: "0", description: "Pérdida del ejercicio" });
            }

            // Sequence number
            const [{ cnt }] = await tx.select({ cnt: drizzleCount() })
              .from(journalEntries).where(eq(journalEntries.entityId, entityId));
            const seq    = (Number(cnt) || 0) + 1;
            const number = `CIE-${String(seq).padStart(5, "0")}-${year}`;

            const [entry] = await tx.insert(journalEntries).values({
              entityId,
              periodId:    period.id,
              date:        new Date(year, month - 1, 31 <= new Date(year, month, 0).getDate() ? 31 : new Date(year, month, 0).getDate()),
              number,
              source:      "manual", // 'closing' is not in the journalSourceEnum list, using 'manual' as the source
              description: `Asiento de cierre ${MONTHS_ES[month - 1]} ${year}`,
              status:      "posted",
              postedAt:    new Date(),
            }).returning();

            await tx.insert(journalLines).values(
              lines.map((l) => ({
                entryId:     entry.id,
                accountId:   l.accountId,
                debit:       l.debit,
                credit:      l.credit,
                currencyCode:"PYG",
                description: l.description,
              }))
            );

            closingEntryId = entry.id;
            closingNumber  = number;
          }
        }
      }

      // Mark period as closed
      await tx.update(fiscalPeriods)
        .set({ status: "closed", closedAt: new Date() })
        .where(eq(fiscalPeriods.id, period.id));

      return period.id;
    });

    revalidatePath("/periodos");
    revalidatePath("/asientos");

    return {
      ok: true,
      data: {
        periodId:       result,
        closingEntryId,
        closingNumber,
        draftBlocked:   draftCount,
        resultadoNeto,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cerrar período" };
  }
}

// ─── Reopen a period ──────────────────────────────────────────────────────────

export async function reopenPeriod(periodId: string): Promise<ActionResult<void>> {
  try {
    const db = getDb();
    await db.update(fiscalPeriods)
      .set({ status: "reopened", closedAt: null })
      .where(eq(fiscalPeriods.id, periodId));
    revalidatePath("/periodos");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al reabrir período" };
  }
}
