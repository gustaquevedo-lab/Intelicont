"use server";

import { eq, and, gte, lt, desc, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { taxDocuments, entities } from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Libro IVA row ────────────────────────────────────────────────────────────

export interface LibroIVARow {
  id:          string;
  issueDate:   string;
  docType:     string;
  docNumber:   string | null;
  issuerRuc:   string;
  issuerName:  string;
  receiverRuc: string | null;
  subtotal:    number;
  iva10:       number;
  iva5:        number;
  ivaExento:   number;
  total:       number;
  currency:    string;
  status:      string;
}

export interface LibroIVASummary {
  compras: LibroIVARow[];
  ventas:  LibroIVARow[];
  totals: {
    compraSubtotal: number;
    compraIVA10:    number;
    compraIVA5:     number;
    compraExento:   number;
    compraTotal:    number;
    ventaSubtotal:  number;
    ventaIVA10:     number;
    ventaIVA5:      number;
    ventaExento:    number;
    ventaTotal:     number;
    saldoIVA:       number;   // CF - DF (negative = pay DNIT, positive = credit)
  };
}

export async function loadLibroIVA(
  entityId: string,
  year:     number,
  month:    number,
): Promise<ActionResult<LibroIVASummary>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };

  try {
    const db   = getDb();
    const from = new Date(year, month - 1, 1);
    const to   = new Date(year, month,     1);

    const rows = await db
      .select({
        id:          taxDocuments.id,
        issueDate:   taxDocuments.issueDate,
        docType:     taxDocuments.docType,
        docNumber:   taxDocuments.docNumber,
        issuerRuc:   taxDocuments.issuerRuc,
        issuerName:  taxDocuments.issuerName,
        receiverRuc: taxDocuments.receiverRuc,
        subtotal:    taxDocuments.subtotal,
        iva10:       taxDocuments.iva10,
        iva5:        taxDocuments.iva5,
        ivaExento:   taxDocuments.ivaExento,
        total:       taxDocuments.total,
        currencyCode:taxDocuments.currencyCode,
        status:      taxDocuments.status,
      })
      .from(taxDocuments)
      .where(
        and(
          eq(taxDocuments.entityId, entityId),
          gte(taxDocuments.issueDate, from),
          lt(taxDocuments.issueDate, to),
          // Only posted/approved docs count in the book
          sql`${taxDocuments.status} IN ('posted', 'approved', 'proposed')`,
        )
      )
      .orderBy(taxDocuments.issueDate);

    function toRow(r: typeof rows[0]): LibroIVARow {
      return {
        id:          r.id,
        issueDate:   r.issueDate instanceof Date ? r.issueDate.toISOString().split("T")[0] : String(r.issueDate).slice(0, 10),
        docType:     r.docType ?? "factura",
        docNumber:   r.docNumber,
        issuerRuc:   r.issuerRuc,
        issuerName:  r.issuerName,
        receiverRuc: r.receiverRuc,
        subtotal:    Number(r.subtotal ?? 0),
        iva10:       Number(r.iva10    ?? 0),
        iva5:        Number(r.iva5     ?? 0),
        ivaExento:   Number(r.ivaExento?? 0),
        total:       Number(r.total),
        currency:    r.currencyCode ?? "PYG",
        status:      r.status ?? "proposed",
      };
    }

    // Compras = buyer perspective: issuer is someone else (we are receiver)
    // Ventas  = seller perspective: issuer is this entity
    // Simple heuristic: check entity RUC
    const [entityRow] = await db.select({ ruc: entities.ruc }).from(entities).where(eq(entities.id, entityId));
    const entityRuc   = entityRow?.ruc ?? "";

    const compras: LibroIVARow[] = [];
    const ventas:  LibroIVARow[] = [];

    for (const r of rows) {
      const row = toRow(r);
      // If issuer RUC matches entity → it's a sale; otherwise a purchase
      if (row.issuerRuc.replace(/\D/g, "") === entityRuc.replace(/\D/g, "")) {
        ventas.push(row);
      } else {
        compras.push(row);
      }
    }

    function sum(arr: LibroIVARow[], field: keyof LibroIVARow): number {
      return arr.reduce((s, r) => s + (Number(r[field]) || 0), 0);
    }

    const compraIVA10 = sum(compras, "iva10");
    const compraIVA5  = sum(compras, "iva5");
    const ventaIVA10  = sum(ventas,  "iva10");
    const ventaIVA5   = sum(ventas,  "iva5");

    // Saldo IVA: crédito fiscal (compras) - débito fiscal (ventas)
    // Negative = deuda con DNIT; Positive = saldo a favor
    const saldoIVA = (compraIVA10 + compraIVA5) - (ventaIVA10 + ventaIVA5);

    return {
      ok: true,
      data: {
        compras,
        ventas,
        totals: {
          compraSubtotal: sum(compras, "subtotal"),
          compraIVA10,
          compraIVA5,
          compraExento:   sum(compras, "ivaExento"),
          compraTotal:    sum(compras, "total"),
          ventaSubtotal:  sum(ventas,  "subtotal"),
          ventaIVA10,
          ventaIVA5,
          ventaExento:    sum(ventas,  "ivaExento"),
          ventaTotal:     sum(ventas,  "total"),
          saldoIVA,
        },
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar Libro IVA" };
  }
}

// ─── Entity list ──────────────────────────────────────────────────────────────

export async function loadEntidadesParaIVA(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
  try {
    const db   = getDb();
    const rows = await db
      .select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities)
      .where(eq(entities.status, "active"))
      .orderBy(entities.legalName);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

// ─── Generate Hechauka CSV ────────────────────────────────────────────────────
// Format: DNIT Hechauka v3 — Tab-separated
// Cols: fecha | tipo | numero | ruc_emisor | nombre_emisor | gravado10 | iva10 | gravado5 | iva5 | exento | total

export async function generateHechauka(
  entityRuc:  string,
  entityName: string,
  year:       number,
  month:      number,
  rows:       LibroIVARow[],
  type:       "compras" | "ventas"
): string {
  const TIPOS: Record<string, string> = {
    factura:       "1",
    nota_credito:  "5",
    nota_debito:   "6",
    autofactura:   "4",
    nota_remision: "7",
    retencion:     "11",
  };

  const header = [
    "Fecha",
    "Tipo Comprobante",
    "Número",
    "RUC Emisor",
    "Nombre Emisor",
    "Base Gravada 10%",
    "IVA 10%",
    "Base Gravada 5%",
    "IVA 5%",
    "Exento",
    "Total",
  ].join("\t");

  const lines = rows.map((r) => {
    const base10 = r.iva10 > 0 ? Math.round((r.iva10 / 0.1) * 0.9) : 0;
    const base5  = r.iva5  > 0 ? Math.round((r.iva5  / 0.05) * 0.95) : 0;
    return [
      r.issueDate.replace(/-/g, "/"),
      TIPOS[r.docType] ?? "1",
      r.docNumber ?? "",
      r.issuerRuc,
      r.issuerName.replace(/\t/g, " "),
      base10,
      Math.round(r.iva10),
      base5,
      Math.round(r.iva5),
      Math.round(r.ivaExento),
      Math.round(r.total),
    ].join("\t");
  });

  const mes  = String(month).padStart(2, "0");
  const title = `HECHAUKA - ${type.toUpperCase()} - ${entityName} (${entityRuc}) - ${mes}/${year}`;

  return [title, header, ...lines].join("\n");
}
