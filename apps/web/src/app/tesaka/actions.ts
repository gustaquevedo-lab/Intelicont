"use server";

import { eq, and, desc, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { entities, retenciones } from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Entity list ──────────────────────────────────────────────────────────────

export async function loadEntidadesParaTesaka(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
  try {
    const db = getDb();
    const rows = await db
      .select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities).where(eq(entities.status, "active")).orderBy(entities.legalName);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

// ─── Retencion row ────────────────────────────────────────────────────────────

export interface RetencionRow {
  id:              string;
  entityId:        string;
  periodoYear:     number;
  periodoMonth:    number;
  periodoLabel:    string;
  fecha:           string;
  terceroRuc:      string;
  terceroNombre:   string;
  docTipo:         string;
  docNumero:       string | null;
  montoBase:       number;
  tipoRetencion:   string;
  tipoLabel:       string;
  tasa:            number;
  montoRetencion:  number;
  comprobanteRet:  string | null;
  status:          string;
  taxDocumentId:   string | null;
}

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const TIPO_LABELS: Record<string, string> = {
  iva_10:         "IVA 10%",
  iva_5:          "IVA 5%",
  ire_honorarios: "IRE Honorarios",
  ire_pagos:      "IRE Pagos al Estado",
  irc:            "IRC / No Residentes",
};

function toRetencionRow(r: {
  id: string; entityId: string;
  periodoYear: number; periodoMonth: number;
  fecha: Date | string | null;
  terceroRuc: string; terceroNombre: string;
  docTipo: string | null; docNumero: string | null;
  montoBase: string; tipoRetencion: string;
  tasa: string; montoRetencion: string;
  comprobanteRet: string | null; status: string | null;
  taxDocumentId: string | null;
}): RetencionRow {
  const fecha = r.fecha instanceof Date ? r.fecha : new Date(String(r.fecha));
  return {
    id:             r.id,
    entityId:       r.entityId,
    periodoYear:    r.periodoYear,
    periodoMonth:   r.periodoMonth,
    periodoLabel:   `${MONTHS_ES[(r.periodoMonth ?? 1) - 1]} ${r.periodoYear}`,
    fecha:          fecha.toISOString().split("T")[0],
    terceroRuc:     r.terceroRuc,
    terceroNombre:  r.terceroNombre,
    docTipo:        r.docTipo ?? "factura",
    docNumero:      r.docNumero,
    montoBase:      parseFloat(r.montoBase),
    tipoRetencion:  r.tipoRetencion,
    tipoLabel:      TIPO_LABELS[r.tipoRetencion] ?? r.tipoRetencion,
    tasa:           parseFloat(r.tasa),
    montoRetencion: parseFloat(r.montoRetencion),
    comprobanteRet: r.comprobanteRet,
    status:         r.status ?? "borrador",
    taxDocumentId:  r.taxDocumentId,
  };
}

// ─── Load retenciones ─────────────────────────────────────────────────────────

export async function loadRetenciones(
  entityId: string,
  year:     number,
  month:    number,
): Promise<ActionResult<RetencionRow[]>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };
  try {
    const db   = getDb();
    const rows = await db
      .select()
      .from(retenciones)
      .where(and(
        eq(retenciones.entityId,      entityId),
        eq(retenciones.periodoYear,   year),
        eq(retenciones.periodoMonth,  month),
      ))
      .orderBy(asc(retenciones.fecha), asc(retenciones.terceroNombre));

    return { ok: true, data: rows.map(toRetencionRow) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar retenciones" };
  }
}

// ─── Summary by period ────────────────────────────────────────────────────────

export interface ResumenPeriodo {
  periodoYear:     number;
  periodoMonth:    number;
  periodoLabel:    string;
  totalBase:       number;
  totalRetencion:  number;
  count:           number;
  declarado:       boolean;
}

export async function loadResumenPeriodos(entityId: string): Promise<ActionResult<ResumenPeriodo[]>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };
  try {
    const db = getDb();
    const rows = await db
      .select({
        periodoYear:    retenciones.periodoYear,
        periodoMonth:   retenciones.periodoMonth,
        totalBase:      sql<string>`SUM(${retenciones.montoBase}::numeric)`,
        totalRetencion: sql<string>`SUM(${retenciones.montoRetencion}::numeric)`,
        count:          sql<string>`COUNT(*)`,
        declarado:      sql<boolean>`BOOL_AND(${retenciones.status} = 'declarado')`,
      })
      .from(retenciones)
      .where(eq(retenciones.entityId, entityId))
      .groupBy(retenciones.periodoYear, retenciones.periodoMonth)
      .orderBy(desc(retenciones.periodoYear), desc(retenciones.periodoMonth));

    return {
      ok: true,
      data: rows.map((r) => ({
        periodoYear:    r.periodoYear,
        periodoMonth:   r.periodoMonth,
        periodoLabel:   `${MONTHS_ES[(r.periodoMonth ?? 1) - 1]} ${r.periodoYear}`,
        totalBase:      parseFloat(r.totalBase ?? "0"),
        totalRetencion: parseFloat(r.totalRetencion ?? "0"),
        count:          parseInt(String(r.count) ?? "0", 10),
        declarado:      r.declarado ?? false,
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar períodos" };
  }
}

// ─── Create retencion ─────────────────────────────────────────────────────────

export interface RetencionInput {
  entityId:       string;
  periodoYear:    number;
  periodoMonth:   number;
  fecha:          string;
  terceroRuc:     string;
  terceroNombre:  string;
  docTipo:        string;
  docNumero:      string;
  montoBase:      number;
  tipoRetencion:  string;
  comprobanteRet: string;
}

// Tasas oficiales Paraguay
const TASAS: Record<string, number> = {
  iva_10:         0.30,   // 30% del IVA facturado (10% de la base)
  iva_5:          0.30,   // 30% del IVA facturado (5% de la base)
  ire_honorarios: 0.08,   // 8% honorarios profesionales
  ire_pagos:      0.025,  // 2.5% pagos al Estado
  irc:            0.15,   // 15% renta no residentes
};

export async function createRetencion(input: RetencionInput): Promise<ActionResult<RetencionRow>> {
  if (!input.entityId)     return { ok: false, error: "Empresa requerida" };
  if (!input.terceroRuc)   return { ok: false, error: "RUC del tercero requerido" };
  if (!input.tipoRetencion) return { ok: false, error: "Tipo de retención requerido" };
  if (!input.montoBase || input.montoBase <= 0) return { ok: false, error: "Monto base debe ser mayor a 0" };

  const tasa            = TASAS[input.tipoRetencion] ?? 0;
  const montoRetencion  = Math.round(input.montoBase * tasa * 100) / 100;

  try {
    const db  = getDb();
    const [row] = await db.insert(retenciones).values({
      entityId:       input.entityId,
      periodoYear:    input.periodoYear,
      periodoMonth:   input.periodoMonth,
      fecha:          new Date(input.fecha),
      terceroRuc:     input.terceroRuc.trim(),
      terceroNombre:  input.terceroNombre.trim(),
      docTipo:        input.docTipo || "factura",
      docNumero:      input.docNumero || null,
      montoBase:      String(input.montoBase),
      tipoRetencion:  input.tipoRetencion,
      tasa:           String(tasa),
      montoRetencion: String(montoRetencion),
      comprobanteRet: input.comprobanteRet || null,
      status:         "borrador",
    }).returning();

    revalidatePath("/tesaka");
    return { ok: true, data: toRetencionRow(row as Parameters<typeof toRetencionRow>[0]) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar retención" };
  }
}

// ─── Delete retencion ─────────────────────────────────────────────────────────

export async function deleteRetencion(id: string): Promise<ActionResult<void>> {
  try {
    const db = getDb();
    await db.delete(retenciones).where(eq(retenciones.id, id));
    revalidatePath("/tesaka");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al eliminar" };
  }
}

// ─── Mark period as declared ──────────────────────────────────────────────────

export async function marcarDeclarado(
  entityId: string,
  year:     number,
  month:    number,
): Promise<ActionResult<void>> {
  try {
    const db = getDb();
    await db.update(retenciones)
      .set({ status: "declarado", updatedAt: new Date() })
      .where(and(
        eq(retenciones.entityId,     entityId),
        eq(retenciones.periodoYear,  year),
        eq(retenciones.periodoMonth, month),
        eq(retenciones.status,       "borrador"),
      ));
    revalidatePath("/tesaka");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al marcar declarado" };
  }
}

// ─── Export to CSV (Formulario 120 DNIT) ─────────────────────────────────────

export async function exportCsvTesaka(
  entityId: string,
  year:     number,
  month:    number,
): Promise<ActionResult<string>> {
  const result = await loadRetenciones(entityId, year, month);
  if (!result.ok) return result;

  const rows = result.data;
  if (rows.length === 0) return { ok: false, error: "No hay retenciones para exportar" };

  const header = [
    "RUC Tercero","Nombre Tercero","Tipo Documento","Nro Documento",
    "Fecha","Monto Base","Tipo Retención","Tasa","Monto Retencion","Comprobante Ret.",
  ].join(";");

  const lines = rows.map((r) =>
    [
      r.terceroRuc, `"${r.terceroNombre}"`, r.docTipo, r.docNumero ?? "",
      r.fecha, r.montoBase.toFixed(0), r.tipoLabel,
      (r.tasa * 100).toFixed(2) + "%", r.montoRetencion.toFixed(0),
      r.comprobanteRet ?? "",
    ].join(";")
  );

  return { ok: true, data: [header, ...lines].join("\n") };
}
