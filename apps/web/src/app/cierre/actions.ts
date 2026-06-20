"use server";

import { eq, and, sql, count as drizzleCount } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  journalEntries, journalLines, accounts, fiscalPeriods,
  bankAccounts, bankMovements, reconciliations, type FiscalPeriod
} from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

export interface CierreValidations {
  draftEntriesCount: number;
  unbalancedEntriesCount: number;
  unreconciledBankCount: number;
  monthsClosedCount: number; // For annual verification
  bankBalances: Array<{
    bankName: string;
    accountNumber: string;
    ledgerBalance: number;
    statementBalance: number;
    difference: number;
  }>;
}

export async function verifyPeriodStatus(
  entityId: string,
  year: number,
  month?: number
): Promise<ActionResult<CierreValidations>> {
  if (!entityId) return { ok: false, error: "Selecciona una empresa" };

  try {
    const db = getDb();
    
    // 1. Date Range
    let from: Date;
    let to: Date;
    if (month) {
      from = new Date(year, month - 1, 1);
      to = new Date(year, month, 1);
    } else {
      from = new Date(year, 0, 1);
      to = new Date(year + 1, 0, 1);
    }

    // 2. Draft entries count
    const [drafts] = await db
      .select({ cnt: drizzleCount() })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.entityId, entityId),
          eq(journalEntries.status, "draft"),
          sql`${journalEntries.date} >= ${from} AND ${journalEntries.date} < ${to}`
        )
      );

    // 3. Unbalanced entries count
    // Subquery or custom raw check
    const unbalanced = await db.execute(sql`
      SELECT je.id
      FROM ${journalEntries} je
      JOIN ${journalLines} jl ON jl.entry_id = je.id
      WHERE je.entity_id = ${entityId}
        AND je.date >= ${from}
        AND je.date < ${to}
      GROUP BY je.id
      HAVING ABS(SUM(jl.debit::numeric) - SUM(jl.credit::numeric)) > 0.01
    `);
    const unbalancedEntriesCount = unbalanced.length;

    // 4. Unreconciled bank movements count
    // Count movements of bank accounts belonging to this entity with no matched reconciliation
    const [unreconciled] = await db
      .select({ cnt: drizzleCount() })
      .from(bankMovements)
      .innerJoin(bankAccounts, eq(bankMovements.bankAccountId, bankAccounts.id))
      .leftJoin(reconciliations, eq(reconciliations.bankMovementId, bankMovements.id))
      .where(
        and(
          eq(bankAccounts.entityId, entityId),
          sql`${bankMovements.date} >= ${from} AND ${bankMovements.date} < ${to}`,
          sql`(${reconciliations.id} IS NULL OR ${reconciliations.status} != 'matched')`
        )
      );

    // 5. Months closed count (For annual close checklist)
    const closedMonths = await db
      .select({ cnt: drizzleCount() })
      .from(fiscalPeriods)
      .where(
        and(
          eq(fiscalPeriods.entityId, entityId),
          eq(fiscalPeriods.year, year),
          eq(fiscalPeriods.status, "closed")
        )
      );
    const monthsClosedCount = Number(closedMonths[0]?.cnt ?? 0);

    // 6. Bank balance vs GL ledger balance comparison
    const bankAccts = await db
      .select({
        id: bankAccounts.id,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
        glAccountId: bankAccounts.glAccountId,
      })
      .from(bankAccounts)
      .where(eq(bankAccounts.entityId, entityId));

    const bankBalances = await Promise.all(
      bankAccts.map(async (acc) => {
        // Calculate ledger balance (sum of debits - credits for this glAccount)
        let ledgerBalance = 0;
        if (acc.glAccountId) {
          const [ledgerSum] = await db
            .select({
              balance: sql<string>`SUM(debit::numeric - credit::numeric)`,
            })
            .from(journalLines)
            .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
            .where(
              and(
                eq(journalLines.accountId, acc.glAccountId),
                eq(journalEntries.status, "posted"),
                sql`${journalEntries.date} < ${to}`
              )
            );
          ledgerBalance = Number(ledgerSum?.balance ?? 0);
        }

        // Calculate statement balance (sum of credits - debits of the bank statement movements)
        const [statementSum] = await db
          .select({
            balance: sql<string>`SUM(CASE WHEN direction = 'credit' THEN amount::numeric ELSE -amount::numeric END)`,
          })
          .from(bankMovements)
          .where(
            and(
              eq(bankMovements.bankAccountId, acc.id),
              sql`${bankMovements.date} < ${to}`
            )
          );
        const statementBalance = Number(statementSum?.balance ?? 0);

        return {
          bankName: acc.bankName,
          accountNumber: acc.accountNumber,
          ledgerBalance,
          statementBalance,
          difference: ledgerBalance - statementBalance,
        };
      })
    );

    return {
      ok: true,
      data: {
        draftEntriesCount: Number(drafts?.cnt ?? 0),
        unbalancedEntriesCount,
        unreconciledBankCount: Number(unreconciled?.cnt ?? 0),
        monthsClosedCount,
        bankBalances,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al verificar períodos" };
  }
}

export async function processAnnualClosing(
  entityId: string,
  year: number
): Promise<ActionResult<{ refundEntryNumber: string; patrimonialEntryNumber: string }>> {
  if (!entityId) return { ok: false, error: "Empresa requerida" };

  try {
    const db = getDb();
    
    // Ensure all 12 periods are closed
    const closedMonths = await db
      .select({ cnt: drizzleCount() })
      .from(fiscalPeriods)
      .where(
        and(
          eq(fiscalPeriods.entityId, entityId),
          eq(fiscalPeriods.year, year),
          eq(fiscalPeriods.status, "closed")
        )
      );

    const count = Number(closedMonths[0]?.cnt ?? 0);
    if (count < 12) {
      return { ok: false, error: "Todos los 12 periodos mensuales del año deben estar cerrados antes de proceder." };
    }

    // Call database transaction for closing entries
    const result = await db.transaction(async (tx) => {
      // 1. Get Income and Expense account balances for the entire year
      const from = new Date(year, 0, 1);
      const to = new Date(year + 1, 0, 1);

      const balances = await tx
        .select({
          accountId: journalLines.accountId,
          nature: accounts.nature,
          code: accounts.code,
          name: accounts.name,
          totalDebit: sql<string>`SUM(${journalLines.debit}::numeric)`,
          totalCredit: sql<string>`SUM(${journalLines.credit}::numeric)`,
        })
        .from(journalLines)
        .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
        .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
        .where(
          and(
            eq(journalEntries.entityId, entityId),
            eq(journalEntries.status, "posted"),
            sql`${journalEntries.date} >= ${from} AND ${journalEntries.date} < ${to}`,
            sql`${accounts.nature} IN ('income', 'expense')`
          )
        )
        .groupBy(journalLines.accountId, accounts.nature, accounts.code, accounts.name);

      // Find standard equity account for result trasladation
      const [equityAcct] = await tx
        .select()
        .from(accounts)
        .where(
          and(
            sql`LOWER(${accounts.name}) LIKE '%resultado%' OR LOWER(${accounts.name}) LIKE '%utilidad%'`,
            eq(accounts.nature, "equity"),
            eq(accounts.allowsPosting, true)
          )
        )
        .limit(1);

      if (!equityAcct) {
        throw new Error("No se encontró una cuenta de patrimonio neto/patrimonial para imputar el resultado del ejercicio.");
      }

      // Generate Refund of Results Asiento
      let resultadoNeto = 0;
      const refundLines = [];

      for (const b of balances) {
        const debit = parseFloat(b.totalDebit ?? "0");
        const credit = parseFloat(b.totalCredit ?? "0");

        if (b.nature === "income") {
          const balance = credit - debit;
          if (Math.abs(balance) > 0.01) {
            refundLines.push({
              accountId: b.accountId,
              debit: String(balance),
              credit: "0",
              description: `Refundición de ingresos: ${b.name}`,
            });
            resultadoNeto += balance;
          }
        } else if (b.nature === "expense") {
          const balance = debit - credit;
          if (Math.abs(balance) > 0.01) {
            refundLines.push({
              accountId: b.accountId,
              debit: "0",
              credit: String(balance),
              description: `Refundición de egresos: ${b.name}`,
            });
            resultadoNeto -= balance;
          }
        }
      }

      if (refundLines.length === 0) {
        throw new Error("No hay saldos de pérdidas y ganancias para refundir.");
      }

      // Add balance line
      if (resultadoNeto > 0) {
        refundLines.push({
          accountId: equityAcct.id,
          debit: "0",
          credit: String(Math.abs(resultadoNeto)),
          description: "Resultado del ejercicio: Utilidad neta",
        });
      } else if (resultadoNeto < 0) {
        refundLines.push({
          accountId: equityAcct.id,
          debit: String(Math.abs(resultadoNeto)),
          credit: "0",
          description: "Resultado del ejercicio: Pérdida neta",
        });
      }

      const [{ cnt }] = await tx
        .select({ cnt: drizzleCount() })
        .from(journalEntries)
        .where(eq(journalEntries.entityId, entityId));
      
      const seq1 = (Number(cnt) || 0) + 1;
      const refundNumber = `REF-${String(seq1).padStart(5, "0")}-${year}`;

      const [refundEntry] = await tx.insert(journalEntries).values({
        entityId,
        date: new Date(year, 11, 31),
        number: refundNumber,
        source: "manual",
        description: `Asiento de refundición de pérdidas y ganancias - Cierre Ejercicio ${year}`,
        status: "posted",
        postedAt: new Date(),
      }).returning();

      await tx.insert(journalLines).values(
        refundLines.map((l) => ({
          entryId: refundEntry.id,
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
          currencyCode: "PYG",
          description: l.description,
        }))
      );

      // 2. Generate Closure of Patrimonial Accounts (Assets, Liabilities, Equity)
      const patBalances = await tx
        .select({
          accountId: journalLines.accountId,
          nature: accounts.nature,
          code: accounts.code,
          name: accounts.name,
          totalDebit: sql<string>`SUM(${journalLines.debit}::numeric)`,
          totalCredit: sql<string>`SUM(${journalLines.credit}::numeric)`,
        })
        .from(journalLines)
        .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
        .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
        .where(
          and(
            eq(journalEntries.entityId, entityId),
            eq(journalEntries.status, "posted"),
            sql`${journalEntries.date} >= ${from} AND ${journalEntries.date} < ${to}`,
            sql`${accounts.nature} IN ('asset', 'liability', 'equity')`
          )
        )
        .groupBy(journalLines.accountId, accounts.nature, accounts.code, accounts.name);

      const patLines = [];
      for (const b of patBalances) {
        const debit = parseFloat(b.totalDebit ?? "0");
        const credit = parseFloat(b.totalCredit ?? "0");
        const balance = debit - credit;

        if (Math.abs(balance) > 0.01) {
          if (balance > 0) {
            // Asset or debit balance: Credit it to close
            patLines.push({
              accountId: b.accountId,
              debit: "0",
              credit: String(balance),
              description: `Cierre patrimonial: ${b.name}`,
            });
          } else {
            // Liability/Equity or credit balance: Debit it to close
            patLines.push({
              accountId: b.accountId,
              debit: String(Math.abs(balance)),
              credit: "0",
              description: `Cierre patrimonial: ${b.name}`,
            });
          }
        }
      }

      const seq2 = seq1 + 1;
      const patNumber = `PAT-${String(seq2).padStart(5, "0")}-${year}`;

      const [patEntry] = await tx.insert(journalEntries).values({
        entityId,
        date: new Date(year, 11, 31),
        number: patNumber,
        source: "manual",
        description: `Asiento de cierre patrimonial de cuentas - Cierre Ejercicio ${year}`,
        status: "posted",
        postedAt: new Date(),
      }).returning();

      if (patLines.length > 0) {
        await tx.insert(journalLines).values(
          patLines.map((l) => ({
            entryId: patEntry.id,
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            currencyCode: "PYG",
            description: l.description,
          }))
        );
      }

      return {
        refundEntryNumber: refundNumber,
        patrimonialEntryNumber: patNumber,
      };
    });

    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al procesar cierre anual" };
  }
}
