import { err, ok, type Result } from "@intelicont/core";
import { eq } from "drizzle-orm";
import { audited } from "../../db/audit";
import { dbErrorMessage, isUniqueViolation, tenantDb } from "../../db/index";
import { getOpenPeriod } from "../../db/repository";
import * as schema from "../../db/schema";
import { insertPostedEntry, type JournalEntry } from "./post-entry";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Today's calendar date in Paraguay as a UTC-midnight Date (same convention as dates typed in the UI). shortcut: zone hardcoded. */
export function todayInAsuncion(now = new Date()): Date {
  return new Date(now.toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }));
}

/**
 * Reverses a posted entry with a counter-entry (`reversal_of`, debit/credit swapped, posted in the
 * entity's currently open period, today's date). The original is never touched; "reversed" is
 * derived from the counter-entry's existence. Audited as `journal_entry.reversed`.
 */
export async function reverseEntry(entryId: string, reason: string): Promise<Result<JournalEntry, string>> {
  if (!UUID.test(entryId)) return err("Asiento no encontrado");
  return tenantDb(async (db) => {
    // RLS hides other tenants' entries, so "not mine" and "missing" are the same answer.
    const [orig] = await db.select().from(schema.journalEntries).where(eq(schema.journalEntries.id, entryId));
    if (!orig) return err("Asiento no encontrado");
    if (orig.status !== "posted") return err("Sólo se pueden revertir asientos posteados");
    const period = await getOpenPeriod(orig.entityId);
    if (!period) return err("No hay período abierto");
    const lines = await db.select().from(schema.journalLines).where(eq(schema.journalLines.entryId, orig.id));

    try {
      const rev = await db.transaction((tx) => audited(
        tx,
        {
          entityId: orig.entityId,
          action: "journal_entry.reversed",
          targetType: "journal_entry",
          targetId: (r: JournalEntry) => r.id,
          before: { id: orig.id, number: orig.number },
          after: (r: JournalEntry) => ({ id: r.id }),
          reason,
        },
        () => insertPostedEntry(tx, {
          entityId: orig.entityId,
          periodId: period.id,
          date: todayInAsuncion(),
          number: `REV-${orig.number ?? orig.id}`,
          source: "manual",
          description: `Reversión de ${orig.number ?? orig.id}: ${reason}`,
          reversalOf: orig.id,
          lines: lines.map((l) => ({
            accountId: l.accountId,
            debit: l.credit,
            credit: l.debit,
            currencyCode: l.currencyCode,
            description: l.description,
          })),
        }),
      ));
      return ok(rev);
    } catch (e) {
      if (isUniqueViolation(e, "journal_entries_reversal_of_uq")) return err("El asiento ya fue revertido");
      return err(dbErrorMessage(e));
    }
  });
}
