"use server";

import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  taxDocuments, partners, entities,
} from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RG90Row {
  id:           string;
  tipo:         "emitido" | "recibido";
  docType:      string;
  numero:       string;
  timbrado:     string;
  ruc:          string;
  nombre:       string;
  fecha:        string;
  gravado10:    number;
  gravado5:     number;
  exento:       number;
  iva10:        number;
  iva5:         number;
  total:        number;
  cdc:          string | null;
}

export interface RG90Resumen {
  comprasGravado10: number;
  comprasGravado5:  number;
  comprasExento:    number;
  comprasIva10:     number;
  comprasIva5:      number;
  comprasTotal:     number;
  ventasGravado10:  number;
  ventasGravado5:   number;
  ventasExento:     number;
  ventasIva10:      number;
  ventasIva5:       number;
  ventasTotal:      number;
  saldoIva:         number; // IVA Débito - IVA Crédito
}

// ─── Load RG90 rows ──────────────────────────────────────────────────────────

export async function loadRG90Data(
  entityId:  string,
  fromDate:  string,  // YYYY-MM-DD
  toDate:    string,  // YYYY-MM-DD
  direction: "received" | "issued" | "all" = "all"
): Promise<ActionResult<{ rows: RG90Row[]; resumen: RG90Resumen }>> {
  if (!entityId) return { ok: false, error: "entityId requerido" };
  if (!fromDate || !toDate) return { ok: false, error: "Período requerido" };

  try {
    const db   = getDb();
    const from = new Date(fromDate + "T00:00:00");
    const to   = new Date(toDate   + "T23:59:59");

    // Fetch entity RUC for header display
    const [entity] = await db
      .select({ ruc: entities.ruc, legalName: entities.legalName })
      .from(entities)
      .where(eq(entities.id, entityId))
      .limit(1);
    if (!entity) return { ok: false, error: "Empresa no encontrada" };

    const conditions: any[] = [
      eq(taxDocuments.entityId, entityId),
      eq(taxDocuments.status, "posted"),
      gte(taxDocuments.issueDate, fromDate),
      lte(taxDocuments.issueDate, toDate),
    ];
    if (direction === "received") conditions.push(eq(taxDocuments.direction, "received"));
    if (direction === "issued")   conditions.push(eq(taxDocuments.direction, "issued"));

    const rows = await db
      .select({
        id:           taxDocuments.id,
        direction:    taxDocuments.direction,
        docType:      taxDocuments.docType,
        docNumber:    taxDocuments.number,
        timbrado:     taxDocuments.timbrado,
        issueDate:    taxDocuments.issueDate,
        gravado10:    taxDocuments.gravado10,
        gravado5:     taxDocuments.gravado5,
        exento:       taxDocuments.exento,
        iva10:        taxDocuments.iva10,
        iva5:         taxDocuments.iva5,
        total:        taxDocuments.total,
        cdc:          taxDocuments.cdc,
        partnerLegal: partners.legalName,
        partnerRuc:   partners.ruc,
      })
      .from(taxDocuments)
      .leftJoin(partners, eq(taxDocuments.partnerId, partners.id))
      .where(and(...conditions))
      .orderBy(taxDocuments.issueDate);

    const result: RG90Row[] = rows.map((r) => {
      const isReceived = r.direction === "received";
      const ruc    = r.partnerRuc   ?? "";
      const nombre = r.partnerLegal ?? "General";

      return {
        id:        r.id,
        tipo:      isReceived ? "recibido" : "emitido",
        docType:   r.docType ?? "factura",
        numero:    r.docNumber ?? "",
        timbrado:  r.timbrado ?? "",
        ruc,
        nombre,
        fecha:     r.issueDate ? new Date(r.issueDate).toISOString().slice(0, 10) : "",
        gravado10: Number(r.gravado10 ?? 0),
        gravado5:  Number(r.gravado5  ?? 0),
        exento:    Number(r.exento    ?? 0),
        iva10:     Number(r.iva10     ?? 0),
        iva5:      Number(r.iva5      ?? 0),
        total:     Number(r.total     ?? 0),
        cdc:       r.cdc,
      };
    });

    // Calculate resumen
    const compras = result.filter((r) => r.tipo === "recibido");
    const ventas  = result.filter((r) => r.tipo === "emitido");

    const sum = (arr: RG90Row[], key: keyof RG90Row) =>
      arr.reduce((s, r) => s + (Number(r[key]) || 0), 0);

    const comprasIva10 = sum(compras, "iva10");
    const comprasIva5  = sum(compras, "iva5");
    const ventasIva10  = sum(ventas,  "iva10");
    const ventasIva5   = sum(ventas,  "iva5");

    const resumen: RG90Resumen = {
      comprasGravado10: sum(compras, "gravado10"),
      comprasGravado5:  sum(compras, "gravado5"),
      comprasExento:    sum(compras, "exento"),
      comprasIva10,
      comprasIva5,
      comprasTotal:     sum(compras, "total"),
      ventasGravado10:  sum(ventas,  "gravado10"),
      ventasGravado5:   sum(ventas,  "gravado5"),
      ventasExento:     sum(ventas,  "exento"),
      ventasIva10,
      ventasIva5,
      ventasTotal:      sum(ventas,  "total"),
      saldoIva:         (ventasIva10 + ventasIva5) - (comprasIva10 + comprasIva5),
    };

    return { ok: true, data: { rows: result, resumen } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar datos RG90" };
  }
}

// ─── Generate CSV content for DNIT / Marangatú ──────────────────────────────
// Format based on RG 90/2021 requirements

export async function generateRG90Csv(rows: RG90Row[], tipo: "compras" | "ventas"): Promise<string> {
  const filtered = rows.filter((r) => tipo === "compras" ? r.tipo === "recibido" : r.tipo === "emitido");

  const header = tipo === "compras"
    ? "TIPO_REGISTRO;FECHA;TIMBRADO;NUMERO;RUC_PROVEEDOR;NOMBRE_PROVEEDOR;GRAVADO_10;GRAVADO_5;EXENTO;IVA_10;IVA_5;TOTAL;CDC"
    : "TIPO_REGISTRO;FECHA;TIMBRADO;NUMERO;RUC_CLIENTE;NOMBRE_CLIENTE;GRAVADO_10;GRAVADO_5;EXENTO;IVA_10;IVA_5;TOTAL;CDC";

  const lines = filtered.map((r) => [
    tipo === "compras" ? "C" : "V",
    r.fecha.replace(/-/g, ""),     // YYYYMMDD
    r.timbrado,
    r.numero.replace(/-/g, ""),    // Strip dashes
    r.ruc,
    `"${r.nombre}"`,
    Math.round(r.gravado10),
    Math.round(r.gravado5),
    Math.round(r.exento),
    Math.round(r.iva10),
    Math.round(r.iva5),
    Math.round(r.total),
    r.cdc ?? "",
  ].join(";"));

  return [header, ...lines].join("\n");
}

// ─── Load entity list ────────────────────────────────────────────────────────

export async function loadEntidadesParaRG90(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
  try {
    const db = getDb();
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
