import { sql } from "drizzle-orm";
import { tenantDb, isMockMode } from "./index";
import type { RegistroDoc } from "../src/registro-comprobantes";

export type RegistroSourceDoc = RegistroDoc & { entryId: string | null };

/**
 * Every tax document of the issue-date month (same convention as the Libro IVA), electronic ones
 * included and flagged so the builder can count what it leaves out. RUCs are bodies without DV:
 * `partners.ruc` is stored without DV (Task 10), `entities.ruc` is `NNNNNNNN-D`.
 * Missing Registro data (no doc code, id type or partner) is passed as 0 / "" so the builder reports it.
 * `entryId` (the posted journal entry, if any) is for drill-down from the error list.
 */
export async function getRegistroDocs(entityId: string, year: number, month: number): Promise<{ docs: RegistroSourceDoc[]; entityRuc: string }> {
  if (isMockMode()) return { docs: [], entityRuc: "" };
  return tenantDb(async (db) => {
    const [entity] = await db.execute(sql`select ruc from entities where id = ${entityId}`);
    const rows = await db.execute(sql`select td.id, td.direction::text as direction, td.doc_code, td.counterparty_id_type,
        p.ruc as counterparty_id, p.legal_name, to_char(td.issue_date, 'YYYY-MM-DD') as issue_date, td.timbrado, td.number,
        td.gravado_10, td.gravado_5, td.exento, td.total, td.condition::text as condition, td.foreign_currency,
        td.imputa_iva, td.imputa_ire, td.imputa_irp, td.no_imputa, td.related_number, td.related_timbrado, td.is_electronic,
        td.journal_entry_id
      from tax_documents td left join partners p on p.id = td.partner_id
      where td.entity_id = ${entityId}
        and td.issue_date >= make_date(${year}::int, ${month}::int, 1)
        and td.issue_date < make_date(${year}::int, ${month}::int, 1) + interval '1 month'
      order by td.issue_date, td.number, td.id`);
    const docs = rows.map((raw): RegistroSourceDoc => {
      const r = raw as Record<string, unknown>;
      return {
        documentId: r.id as string,
        side: r.direction === "issued" ? "ventas" : "compras",
        docCode: Number(r.doc_code ?? 0),
        counterpartyIdType: Number(r.counterparty_id_type ?? 0),
        counterpartyId: (r.counterparty_id as string | null) ?? "",
        counterpartyName: (r.legal_name as string | null) ?? "",
        issueDate: r.issue_date as string,
        timbrado: (r.timbrado as string | null) ?? "",
        number: r.number as string,
        gravado10: Number(r.gravado_10 ?? 0),
        gravado5: Number(r.gravado_5 ?? 0),
        exento: Number(r.exento ?? 0),
        total: Number(r.total),
        condition: r.condition === "cash" ? "cash" : "credit",
        foreignCurrency: !!r.foreign_currency,
        imputaIva: !!r.imputa_iva,
        imputaIre: !!r.imputa_ire,
        imputaIrp: !!r.imputa_irp,
        noImputa: !!r.no_imputa,
        relatedNumber: r.related_number as string | null,
        relatedTimbrado: r.related_timbrado as string | null,
        isElectronic: !!r.is_electronic,
        entryId: r.journal_entry_id as string | null,
      };
    });
    return { docs, entityRuc: String(entity?.ruc ?? "").split("-")[0] };
  });
}
