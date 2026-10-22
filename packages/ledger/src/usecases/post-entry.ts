import { assertMoney, err, ok, type Result } from "@intelicont/core";
import { eq } from "drizzle-orm";
import { audited } from "../../db/audit";
import { dbErrorMessage, tenantDb, type Db } from "../../db/index";
import * as schema from "../../db/schema";

export type JournalEntry = typeof schema.journalEntries.$inferSelect;

export interface PostEntryInput {
  entityId: string;
  periodId: string;
  date: Date;
  number: string;
  source?: typeof schema.journalEntries.$inferInsert["source"];
  sourceRef?: string | null;
  description?: string | null;
  lines: {
    accountId: string;
    debit: number;
    credit: number;
    currencyCode: string;
    description?: string | null;
  }[];
}

/**
 * Draft -> lines -> post. The DB enforces balance, period and immutability. Callers must run it
 * inside a SAVEPOINT (`db.transaction`, see `postEntry`/`reverseEntry`): a trigger failure then
 * rolls back only the savepoint, leaving no draft/lines and a usable outer transaction.
 * `reversalOf` is only set by `reverseEntry`.
 */
export async function insertPostedEntry(tx: Db, input: PostEntryInput & { reversalOf?: string }): Promise<JournalEntry> {
  const [draft] = await tx.insert(schema.journalEntries).values({
    entityId: input.entityId,
    periodId: input.periodId,
    date: input.date,
    number: input.number,
    source: input.source ?? "manual",
    sourceRef: input.sourceRef ?? null,
    description: input.description ?? null,
    reversalOf: input.reversalOf ?? null,
    status: "draft",
  }).returning();

  await tx.insert(schema.journalLines).values(
    input.lines.map((l) => ({
      entryId: draft.id,
      accountId: l.accountId,
      debit: l.debit,
      credit: l.credit,
      currencyCode: l.currencyCode,
      description: l.description ?? null,
    })),
  );

  const [posted] = await tx.update(schema.journalEntries)
    .set({ status: "posted", postedAt: new Date() })
    .where(eq(schema.journalEntries.id, draft.id))
    .returning();
  return posted;
}

/** Posts a balanced entry and audits it (`journal_entry.posted`). DB rule violations come back as `err`. */
export async function postEntry(input: PostEntryInput): Promise<Result<JournalEntry, string>> {
  let totalDebit = 0;
  try {
    for (const l of input.lines) {
      totalDebit += assertMoney(l.debit);
      assertMoney(l.credit);
    }
  } catch {
    return err("Importe inválido: debe ser un entero en guaraníes");
  }
  return tenantDb(async (db) => {
    try {
      // Entry + audit event share one savepoint: both persist or neither does (also if the audit fails).
      const entry = await db.transaction((tx) => audited(
        tx,
        {
          entityId: input.entityId,
          action: "journal_entry.posted",
          targetType: "journal_entry",
          targetId: (e: JournalEntry) => e.id,
          after: { number: input.number, lines: input.lines.length, totalDebit },
        },
        () => insertPostedEntry(tx, input),
      ));
      return ok(entry);
    } catch (e) {
      return err(dbErrorMessage(e));
    }
  });
}
