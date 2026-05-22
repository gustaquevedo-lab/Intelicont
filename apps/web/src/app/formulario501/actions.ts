"use server";

import { eq, and, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  entities, journalEntries, journalLines, accounts, chartOfAccounts,
} from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Entity list ──────────────────────────────────────────────────────────────

export async function loadEntidadesParaIRE(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
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

// ─── IRE 501 calculation ──────────────────────────────────────────────────────

export interface LineaIRE {
  codigo:    string;
  concepto:  string;
  monto:     number;
  esSeccion: boolean;
}

export interface Formulario501 {
  entityName:         string;
  ruc:                string;
  ejercicio:          number;
  // Ingresos
  ingresosBrutos:     number;
  // Deducciones
  costosYGastos:      number;
  gastoPersonal:      number;      // Gastos de personal: 50% deducible
  depreciacion:       number;
  otrasDeduciones:    number;
  totalDeducciones:   number;
  // Base imponible
  rentaNeta:          number;
  // IRE
  regimen:            "general" | "simple" | "resimple";
  tasaIRE:            number;
  ireCalculado:       number;
  // Retenciones acumuladas (from retenciones table)
  retencionesAcum:    number;
  ireSaldo:           number;
  lineas:             LineaIRE[];
  generatedAt:        string;
}

export async function calcularIRE501(
  entityId: string,
  ejercicio: number,
  regimen: "general" | "simple" | "resimple",
): Promise<ActionResult<Formulario501>> {
  if (!entityId) return { ok: false, error: "Empresa requerida" };

  try {
    const db    = getDb();
    const from  = new Date(ejercicio, 0, 1);
    const to    = new Date(ejercicio + 1, 0, 1);

    // ─── Entity info ──────────────────────────────────────────────────────────
    const [entity] = await db.select().from(entities).where(eq(entities.id, entityId));
    if (!entity) return { ok: false, error: "Empresa no encontrada" };

    // ─── COA ─────────────────────────────────────────────────────────────────
    const [coa] = await db.select().from(chartOfAccounts)
      .where(eq(chartOfAccounts.entityId, entityId)).limit(1);

    // ─── Account balances for the year ───────────────────────────────────────
    const balances = await db
      .select({
        accountId:   journalLines.accountId,
        nature:      accounts.nature,
        name:        accounts.name,
        code:        accounts.code,
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
      .groupBy(journalLines.accountId, accounts.nature, accounts.name, accounts.code);

    // ─── Aggregate by nature ──────────────────────────────────────────────────
    let ingresosBrutos = 0;
    let costosYGastos  = 0;

    for (const b of balances) {
      const debit  = parseFloat(b.totalDebit  ?? "0");
      const credit = parseFloat(b.totalCredit ?? "0");

      if (b.nature === "income") {
        ingresosBrutos += (credit - debit);     // credit-normal
      } else if (b.nature === "expense") {
        costosYGastos  += (debit - credit);     // debit-normal
      }
    }

    // ─── IRE rates by regime ──────────────────────────────────────────────────
    // Paraguay IRE 2024: General 10%, Simplificado 7%, Resimple 3.5%
    const tasas: Record<string, number> = {
      general:  0.10,
      simple:   0.07,
      resimple: 0.035,
    };
    const tasa = tasas[regimen] ?? 0.10;

    // ─── Deductions (simplified approximation) ────────────────────────────────
    // In practice IRE has specific deductions per Art. 15-22 Ley 6380
    // We provide a working calculation based on the Chart of Accounts
    const gastoPersonal   = 0;     // Would come from payroll integration (future Sueldok)
    const depreciacion    = 0;     // Would come from fixed assets module (future)
    const otrasDeduciones = 0;

    const totalDeducciones = costosYGastos + gastoPersonal + depreciacion + otrasDeduciones;
    const rentaNeta        = Math.max(0, ingresosBrutos - totalDeducciones);
    const ireCalculado     = Math.round(rentaNeta * tasa);

    // ─── Retenciones acumuladas ───────────────────────────────────────────────
    // Load from retenciones table (IRE types only, for the year)
    let retencionesAcum = 0;
    try {
      const { retenciones } = await import("@/lib/db/schema");
      const retRows = await db
        .select({ total: sql<string>`SUM(${retenciones.montoRetencion}::numeric)` })
        .from(retenciones)
        .where(and(
          eq(retenciones.entityId, entityId),
          eq(retenciones.periodoYear, ejercicio),
          sql`${retenciones.tipoRetencion} LIKE 'ire%'`,
        ));
      retencionesAcum = parseFloat(retRows[0]?.total ?? "0");
    } catch { /* No retenciones table yet */ }

    const ireSaldo = Math.max(0, ireCalculado - retencionesAcum);

    // ─── Build lineas ─────────────────────────────────────────────────────────
    const lineas: LineaIRE[] = [
      { codigo: "A", concepto: "INGRESOS GRAVADOS", monto: 0, esSeccion: true },
      { codigo: "1", concepto: "Ingresos brutos del ejercicio", monto: ingresosBrutos, esSeccion: false },
      { codigo: "B", concepto: "DEDUCCIONES ADMITIDAS", monto: 0, esSeccion: true },
      { codigo: "2", concepto: "Costos y gastos deducibles", monto: costosYGastos, esSeccion: false },
      { codigo: "3", concepto: "Gastos de personal (50% deducible)", monto: gastoPersonal, esSeccion: false },
      { codigo: "4", concepto: "Depreciaciones y amortizaciones", monto: depreciacion, esSeccion: false },
      { codigo: "5", concepto: "Otras deducciones admitidas", monto: otrasDeduciones, esSeccion: false },
      { codigo: "6", concepto: "TOTAL DEDUCCIONES (2+3+4+5)", monto: totalDeducciones, esSeccion: false },
      { codigo: "C", concepto: "RENTA NETA IMPONIBLE (1-6)", monto: rentaNeta, esSeccion: true },
      { codigo: "7", concepto: `IRE ${regimen.toUpperCase()} — Tasa ${(tasa * 100).toFixed(1)}%`, monto: ireCalculado, esSeccion: false },
      { codigo: "8", concepto: "Retenciones acumuladas del ejercicio", monto: retencionesAcum, esSeccion: false },
      { codigo: "9", concepto: "SALDO A PAGAR / FAVOR", monto: ireSaldo, esSeccion: true },
    ];

    return {
      ok: true,
      data: {
        entityName:       entity.legalName,
        ruc:              entity.ruc,
        ejercicio,
        ingresosBrutos,
        costosYGastos,
        gastoPersonal,
        depreciacion,
        otrasDeduciones,
        totalDeducciones,
        rentaNeta,
        regimen,
        tasaIRE:          tasa,
        ireCalculado,
        retencionesAcum,
        ireSaldo,
        lineas,
        generatedAt:      new Date().toISOString(),
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al calcular IRE" };
  }
}
