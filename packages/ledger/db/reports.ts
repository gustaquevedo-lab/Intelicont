import { sql } from "drizzle-orm";
import { tenantDb, isMockMode } from "./index";

/**
 * Books (D11): SQL over the `v_diario` / `v_mayor` / `v_libro_iva` views (security_invoker, so the
 * caller's RLS applies) with drill-down ids. Dates are `YYYY-MM-DD` (Asunción calendar dates).
 * Money is integer guaraníes; Postgres sums come back as strings and are converted with `n()`.
 */
const n = (v: unknown) => Number(v ?? 0);

export type DiarioRow = {
  entryId: string; lineId: string; entryNumber: string | null; date: string; source: string; entryDescription: string | null;
  accountId: string; accountCode: string; accountName: string; debit: number; credit: number; currencyCode: string;
  lineDescription: string | null; partnerId: string | null; taxDocumentId: string | null; reversalOf: string | null;
};

const diarioCols = sql`entry_id, line_id, entry_number, to_char(entry_date, 'YYYY-MM-DD') as date, source::text as source,
  entry_description, account_id, account_code, account_name, debit, credit, currency_code, line_description,
  partner_id, tax_document_id, reversal_of`;

const toDiario = (r: Record<string, unknown>): DiarioRow => ({
  entryId: r.entry_id as string, lineId: r.line_id as string, entryNumber: r.entry_number as string | null,
  date: r.date as string, source: r.source as string, entryDescription: r.entry_description as string | null,
  accountId: r.account_id as string, accountCode: r.account_code as string, accountName: r.account_name as string,
  debit: n(r.debit), credit: n(r.credit), currencyCode: r.currency_code as string,
  lineDescription: r.line_description as string | null, partnerId: r.partner_id as string | null,
  taxDocumentId: r.tax_document_id as string | null, reversalOf: r.reversal_of as string | null,
});

export async function getDiario(entityId: string, from: string, to: string, limit: number, offset: number) {
  if (isMockMode()) return { rows: [] as DiarioRow[], totals: { debit: 0, credit: 0, entries: 0, lines: 0 } };
  return tenantDb(async (db) => {
    const range = sql`entity_id = ${entityId} and entry_date between ${from}::date and ${to}::date`;
    const rows = await db.execute(sql`select ${diarioCols} from v_diario where ${range}
      order by entry_date, entry_number, entry_id, line_id limit ${limit} offset ${offset}`);
    const [t] = await db.execute(sql`select coalesce(sum(debit), 0) as debit, coalesce(sum(credit), 0) as credit,
      count(distinct entry_id) as entries, count(*) as lines from v_diario where ${range}`);
    return {
      rows: rows.map((r) => toDiario(r as Record<string, unknown>)),
      totals: { debit: n(t.debit), credit: n(t.credit), entries: n(t.entries), lines: n(t.lines) },
    };
  });
}

export type MayorRow = DiarioRow & { balance: number };

export async function getMayor(entityId: string, accountId: string, from: string, to: string) {
  const empty = { account: null as null | { id: string; code: string; name: string; nature: string }, opening: 0, rows: [] as MayorRow[], debit: 0, credit: 0, closing: 0 };
  if (isMockMode()) return empty;
  return tenantDb(async (db) => {
    const [account] = await db.execute(sql`select a.id, a.code, a.name, a.nature::text as nature from accounts a
      join chart_of_accounts c on c.id = a.coa_id where a.id = ${accountId} and c.entity_id = ${entityId}`);
    if (!account) return empty;
    const [o] = await db.execute(sql`select coalesce(sum(debit - credit), 0) as opening from v_diario
      where entity_id = ${entityId} and account_id = ${accountId} and entry_date < ${from}::date`);
    const rows = await db.execute(sql`select ${diarioCols}, balance from v_mayor
      where entity_id = ${entityId} and account_id = ${accountId} and entry_date between ${from}::date and ${to}::date
      order by entry_date, entry_number, line_id`);
    const list = rows.map((r) => ({ ...toDiario(r as Record<string, unknown>), balance: n((r as Record<string, unknown>).balance) }));
    const debit = list.reduce((s, r) => s + r.debit, 0);
    const credit = list.reduce((s, r) => s + r.credit, 0);
    const opening = n(o.opening);
    return {
      account: account as { id: string; code: string; name: string; nature: string },
      opening, rows: list, debit, credit, closing: opening + debit - credit,
    };
  });
}

export type SumasSaldosRow = {
  accountId: string; code: string; name: string; nature: string;
  opening: number; debit: number; credit: number; closing: number; saldoDeudor: number; saldoAcreedor: number;
};

/** Per account with an opening balance or movements up to `to`: opening (before `from`), sums in range, closing. */
export async function getSumasSaldos(entityId: string, from: string, to: string) {
  const totals = { opening: 0, debit: 0, credit: 0, saldoDeudor: 0, saldoAcreedor: 0 };
  if (isMockMode()) return { rows: [] as SumasSaldosRow[], totals };
  return tenantDb(async (db) => {
    const res = await db.execute(sql`select d.account_id, d.account_code, d.account_name, a.nature::text as nature,
        coalesce(sum(d.debit - d.credit) filter (where d.entry_date < ${from}::date), 0) as opening,
        coalesce(sum(d.debit) filter (where d.entry_date >= ${from}::date), 0) as debit,
        coalesce(sum(d.credit) filter (where d.entry_date >= ${from}::date), 0) as credit
      from v_diario d join accounts a on a.id = d.account_id
      where d.entity_id = ${entityId} and d.entry_date <= ${to}::date
      group by d.account_id, d.account_code, d.account_name, a.nature
      order by d.account_code`);
    const rows: SumasSaldosRow[] = res.map((raw) => {
      const r = raw as Record<string, unknown>;
      const opening = n(r.opening), debit = n(r.debit), credit = n(r.credit);
      const closing = opening + debit - credit;
      return {
        accountId: r.account_id as string, code: r.account_code as string, name: r.account_name as string, nature: r.nature as string,
        opening, debit, credit, closing, saldoDeudor: closing > 0 ? closing : 0, saldoAcreedor: closing < 0 ? -closing : 0,
      };
    }).filter((r) => r.opening !== 0 || r.debit !== 0 || r.credit !== 0);
    for (const r of rows) {
      totals.opening += r.opening; totals.debit += r.debit; totals.credit += r.credit;
      totals.saldoDeudor += r.saldoDeudor; totals.saldoAcreedor += r.saldoAcreedor;
    }
    return { rows, totals };
  });
}

export type LibroIvaRow = {
  documentId: string; entryId: string | null; date: string; docCode: number | null; docType: string; number: string;
  timbrado: string | null; cdc: string | null; counterpartyRuc: string | null; counterparty: string | null;
  gravado10: number; gravado5: number; exento: number; iva10: number; iva5: number; total: number;
  sign: 1 | -1; isElectronic: boolean; totalOnly: boolean;
};

const AMOUNTS = ["gravado10", "gravado5", "exento", "iva10", "iva5", "total"] as const;

/** Libro IVA of one side and month; totals = Σ(amount × sign) (credit notes subtract). */
export async function getLibroIva(entityId: string, year: number, month: number, side: "compras" | "ventas") {
  const totals = { gravado10: 0, gravado5: 0, exento: 0, iva10: 0, iva5: 0, total: 0 };
  if (isMockMode()) return { rows: [] as LibroIvaRow[], totals };
  return tenantDb(async (db) => {
    const res = await db.execute(sql`select document_id, entry_id, to_char(issue_date, 'YYYY-MM-DD') as date, doc_code,
        doc_type::text as doc_type, number, timbrado, cdc, counterparty_ruc, counterparty_name,
        gravado10, gravado5, exento, iva10, iva5, total, sign, is_electronic, total_only
      from v_libro_iva where entity_id = ${entityId} and side = ${side} and year = ${year} and month = ${month}
      order by issue_date, number, document_id`);
    const rows: LibroIvaRow[] = res.map((raw) => {
      const r = raw as Record<string, unknown>;
      return {
        documentId: r.document_id as string, entryId: r.entry_id as string | null, date: r.date as string,
        docCode: r.doc_code as number | null, docType: r.doc_type as string, number: r.number as string,
        timbrado: r.timbrado as string | null, cdc: r.cdc as string | null,
        counterpartyRuc: r.counterparty_ruc as string | null, counterparty: r.counterparty_name as string | null,
        gravado10: n(r.gravado10), gravado5: n(r.gravado5), exento: n(r.exento), iva10: n(r.iva10), iva5: n(r.iva5), total: n(r.total),
        sign: n(r.sign) < 0 ? -1 : 1, isElectronic: !!r.is_electronic, totalOnly: !!r.total_only,
      };
    });
    for (const r of rows) for (const k of AMOUNTS) totals[k] += r[k] * r.sign;
    return { rows, totals };
  });
}
