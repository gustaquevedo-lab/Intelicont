import { assertMoney, err, ok, type Result } from "@intelicont/core";
import { eq, inArray } from "drizzle-orm";
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
    /** Rate to base currency (amountBase is UNSIGNED, on the same side as the line). */
    fxRate?: string | number;
    amountBase?: number;
    costCenterId?: string | null;
    partnerId?: string | null;
    taxDocumentId?: string | null;
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
      ...(l.fxRate !== undefined && { fxRate: String(l.fxRate) }),
      ...(l.amountBase !== undefined && { amountBase: l.amountBase }),
      costCenterId: l.costCenterId ?? null,
      partnerId: l.partnerId ?? null,
      taxDocumentId: l.taxDocumentId ?? null,
    })),
  );

  const [posted] = await tx.update(schema.journalEntries)
    .set({ status: "posted", postedAt: new Date() })
    .where(eq(schema.journalEntries.id, draft.id))
    .returning();
  return posted;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when every partner / tax document / cost center referenced by the lines exists, is visible
 * (RLS) and belongs to `entityId`. FKs bypass RLS and the DB guard only checks accounts, and a user
 * can see several entities, so the entity equality is checked here.
 */
async function referencesBelongToEntity(db: Db, input: PostEntryInput): Promise<boolean> {
  const ids = (pick: (l: PostEntryInput["lines"][number]) => string | null | undefined) =>
    [...new Set(input.lines.map(pick).filter((v): v is string => v != null))];
  const checks = [
    { table: schema.partners, ids: ids((l) => l.partnerId) },
    { table: schema.taxDocuments, ids: ids((l) => l.taxDocumentId) },
    { table: schema.costCenters, ids: ids((l) => l.costCenterId) },
  ];
  for (const { table, ids } of checks) {
    if (ids.length === 0) continue;
    if (!ids.every((id) => UUID.test(id))) return false;
    const rows = await db.select({ id: table.id, entityId: table.entityId }).from(table).where(inArray(table.id, ids));
    if (rows.length !== ids.length || rows.some((r) => r.entityId !== input.entityId)) return false;
  }
  return true;
}

/** Posts a balanced entry and audits it (`journal_entry.posted`). DB rule violations come back as `err`. */
export async function postEntry(input: PostEntryInput): Promise<Result<JournalEntry, string>> {
  let totalDebit = 0;
  try {
    for (const l of input.lines) {
      totalDebit += assertMoney(l.debit);
      assertMoney(l.credit);
      if (l.amountBase !== undefined) assertMoney(l.amountBase);
    }
  } catch {
    return err("Importe inválido: debe ser un entero en la unidad mínima de la moneda");
  }
  return tenantDb(async (db) => {
    if (!(await referencesBelongToEntity(db, input))) return err("Referencia inválida");
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
