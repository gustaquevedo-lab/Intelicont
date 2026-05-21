/**
 * Seed de base de datos — InteliCont
 * 5 entidades paraguayas, plan de cuentas DNIT estándar, 20 asientos contables.
 * Driver: postgres.js (Supabase compatible)
 * Run: pnpm db:seed
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountNature = "asset" | "liability" | "equity" | "income" | "expense";

interface AccountDef {
  code: string;
  name: string;
  nature: AccountNature;
  allowsPosting: boolean;
  parentCode?: string;
  taxMappings?: Record<string, string>;
  eefLineId?: string;
}

// ─── Plan de cuentas estándar DNIT — Paraguay ─────────────────────────────────
// Basado en la estructura aprobada por DNIT/SET para libro Hechauka
// Compatible con NIIF para PYMEs (secciones adaptadas al contexto fiscal PY)

const PLAN_CUENTAS: AccountDef[] = [
  // ── 1. ACTIVOS ──────────────────────────────────────────────────────────────
  { code: "1",     name: "ACTIVOS",                               nature: "asset",   allowsPosting: false },
  { code: "1.1",   name: "ACTIVOS CORRIENTES",                    nature: "asset",   allowsPosting: false, parentCode: "1" },
  { code: "1.1.01", name: "Caja",                                 nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_01" },
  { code: "1.1.02", name: "Banco Continental Cta. Cte.",          nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_01" },
  { code: "1.1.03", name: "Banco GNB Cta. Cte.",                  nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_01" },
  { code: "1.1.04", name: "Inversiones Temporarias",              nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_02" },
  { code: "1.1.05", name: "Cuentas a Cobrar — Clientes",          nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_03" },
  { code: "1.1.06", name: "Cuentas a Cobrar — Otros",             nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_03" },
  { code: "1.1.07", name: "IVA Crédito Fiscal 10%",               nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_04", taxMappings: { iva_rate: "10", tipo: "credito" } },
  { code: "1.1.08", name: "IVA Crédito Fiscal 5%",                nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_04", taxMappings: { iva_rate: "5",  tipo: "credito" } },
  { code: "1.1.09", name: "Anticipo IRE",                         nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_05", taxMappings: { impuesto: "IRE", tipo: "anticipo" } },
  { code: "1.1.10", name: "Retenciones Sufridas IVA",             nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_05", taxMappings: { impuesto: "IVA", tipo: "retencion_sufrida" } },
  { code: "1.1.11", name: "Mercaderías",                          nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_06" },
  { code: "1.1.12", name: "Materiales y Suministros",             nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_06" },
  { code: "1.1.13", name: "Gastos Pagados por Adelantado",        nature: "asset",   allowsPosting: true,  parentCode: "1.1", eefLineId: "A_C_07" },
  { code: "1.2",   name: "ACTIVOS NO CORRIENTES",                 nature: "asset",   allowsPosting: false, parentCode: "1" },
  { code: "1.2.01", name: "Inmuebles",                            nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_01" },
  { code: "1.2.02", name: "Rodado",                               nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_02" },
  { code: "1.2.03", name: "Maquinaria y Equipos",                 nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_02" },
  { code: "1.2.04", name: "Mobiliario y Útiles",                  nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_02" },
  { code: "1.2.05", name: "Equipo de Computación",                nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_02" },
  { code: "1.2.06", name: "Dep. Acum. — Rodado",                  nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_03" },
  { code: "1.2.07", name: "Dep. Acum. — Maquinaria y Equipos",    nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_03" },
  { code: "1.2.08", name: "Dep. Acum. — Mobiliario y Útiles",     nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_03" },
  { code: "1.2.09", name: "Dep. Acum. — Equipo de Computación",   nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_03" },
  { code: "1.2.10", name: "Inversiones en Acciones",              nature: "asset",   allowsPosting: true,  parentCode: "1.2", eefLineId: "A_NC_04" },

  // ── 2. PASIVOS ──────────────────────────────────────────────────────────────
  { code: "2",     name: "PASIVOS",                               nature: "liability", allowsPosting: false },
  { code: "2.1",   name: "PASIVOS CORRIENTES",                    nature: "liability", allowsPosting: false, parentCode: "2" },
  { code: "2.1.01", name: "Cuentas a Pagar — Proveedores",        nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_01" },
  { code: "2.1.02", name: "Cuentas a Pagar — Otros",              nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_01" },
  { code: "2.1.03", name: "IVA Débito Fiscal 10%",                nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_02", taxMappings: { iva_rate: "10", tipo: "debito" } },
  { code: "2.1.04", name: "IVA Débito Fiscal 5%",                 nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_02", taxMappings: { iva_rate: "5",  tipo: "debito" } },
  { code: "2.1.05", name: "Retenciones IVA a Depositar (RG90)",   nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_03", taxMappings: { impuesto: "IVA", tipo: "retencion_agente" } },
  { code: "2.1.06", name: "Retenciones IRE a Depositar",          nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_03", taxMappings: { impuesto: "IRE", tipo: "retencion_agente" } },
  { code: "2.1.07", name: "IRE a Pagar",                          nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_04", taxMappings: { impuesto: "IRE" } },
  { code: "2.1.08", name: "IPS Patronal a Depositar (16,5%)",     nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_05", taxMappings: { impuesto: "IPS", tipo: "patronal" } },
  { code: "2.1.09", name: "IPS Personal a Depositar (9%)",        nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_05", taxMappings: { impuesto: "IPS", tipo: "personal" } },
  { code: "2.1.10", name: "Sueldos a Pagar",                      nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_06" },
  { code: "2.1.11", name: "Dividendos a Pagar",                   nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_07", taxMappings: { impuesto: "IDU" } },
  { code: "2.1.12", name: "Préstamos Bancarios — Corto Plazo",    nature: "liability", allowsPosting: true,  parentCode: "2.1", eefLineId: "P_C_08" },
  { code: "2.2",   name: "PASIVOS NO CORRIENTES",                 nature: "liability", allowsPosting: false, parentCode: "2" },
  { code: "2.2.01", name: "Préstamos Bancarios — Largo Plazo",    nature: "liability", allowsPosting: true,  parentCode: "2.2", eefLineId: "P_NC_01" },
  { code: "2.2.02", name: "Deudas Hipotecarias",                  nature: "liability", allowsPosting: true,  parentCode: "2.2", eefLineId: "P_NC_01" },
  { code: "2.2.03", name: "Provisión Indemnizaciones",            nature: "liability", allowsPosting: true,  parentCode: "2.2", eefLineId: "P_NC_02" },

  // ── 3. PATRIMONIO ───────────────────────────────────────────────────────────
  { code: "3",     name: "PATRIMONIO NETO",                       nature: "equity",  allowsPosting: false },
  { code: "3.1",   name: "CAPITAL Y RESERVAS",                    nature: "equity",  allowsPosting: false, parentCode: "3" },
  { code: "3.1.01", name: "Capital Social",                       nature: "equity",  allowsPosting: true,  parentCode: "3.1", eefLineId: "PN_01" },
  { code: "3.1.02", name: "Reserva Legal (5% IRE Gral)",          nature: "equity",  allowsPosting: true,  parentCode: "3.1", eefLineId: "PN_02" },
  { code: "3.1.03", name: "Reservas Voluntarias",                 nature: "equity",  allowsPosting: true,  parentCode: "3.1", eefLineId: "PN_02" },
  { code: "3.1.04", name: "Resultados Acumulados",                nature: "equity",  allowsPosting: true,  parentCode: "3.1", eefLineId: "PN_03" },
  { code: "3.1.05", name: "Resultado del Ejercicio",              nature: "equity",  allowsPosting: true,  parentCode: "3.1", eefLineId: "PN_04" },

  // ── 4. INGRESOS ─────────────────────────────────────────────────────────────
  { code: "4",     name: "INGRESOS",                              nature: "income",  allowsPosting: false },
  { code: "4.1",   name: "INGRESOS OPERATIVOS",                   nature: "income",  allowsPosting: false, parentCode: "4" },
  { code: "4.1.01", name: "Ventas de Mercaderías — IVA 10%",      nature: "income",  allowsPosting: true,  parentCode: "4.1", eefLineId: "I_OP_01", taxMappings: { iva_rate: "10", tipo: "venta" } },
  { code: "4.1.02", name: "Ventas de Mercaderías — IVA 5%",       nature: "income",  allowsPosting: true,  parentCode: "4.1", eefLineId: "I_OP_01", taxMappings: { iva_rate: "5",  tipo: "venta" } },
  { code: "4.1.03", name: "Ventas de Mercaderías — Exentas",      nature: "income",  allowsPosting: true,  parentCode: "4.1", eefLineId: "I_OP_01", taxMappings: { iva_rate: "0",  tipo: "venta" } },
  { code: "4.1.04", name: "Prestación de Servicios — IVA 10%",    nature: "income",  allowsPosting: true,  parentCode: "4.1", eefLineId: "I_OP_02", taxMappings: { iva_rate: "10", tipo: "servicio" } },
  { code: "4.1.05", name: "Prestación de Servicios — Exentos",    nature: "income",  allowsPosting: true,  parentCode: "4.1", eefLineId: "I_OP_02", taxMappings: { iva_rate: "0",  tipo: "servicio" } },
  { code: "4.2",   name: "INGRESOS NO OPERATIVOS",                nature: "income",  allowsPosting: false, parentCode: "4" },
  { code: "4.2.01", name: "Intereses Ganados",                    nature: "income",  allowsPosting: true,  parentCode: "4.2", eefLineId: "I_NOP_01" },
  { code: "4.2.02", name: "Alquileres Ganados",                   nature: "income",  allowsPosting: true,  parentCode: "4.2", eefLineId: "I_NOP_02" },
  { code: "4.2.03", name: "Diferencia de Cambio Ganada",          nature: "income",  allowsPosting: true,  parentCode: "4.2", eefLineId: "I_NOP_03" },
  { code: "4.2.04", name: "Otros Ingresos",                       nature: "income",  allowsPosting: true,  parentCode: "4.2", eefLineId: "I_NOP_04" },

  // ── 5. GASTOS ────────────────────────────────────────────────────────────────
  { code: "5",     name: "GASTOS",                                nature: "expense", allowsPosting: false },
  { code: "5.1",   name: "GASTOS OPERATIVOS",                     nature: "expense", allowsPosting: false, parentCode: "5" },
  { code: "5.1.01", name: "Costo de Ventas",                      nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_01" },
  { code: "5.1.02", name: "Sueldos y Salarios",                   nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_02" },
  { code: "5.1.03", name: "IPS Patronal (16,5%)",                 nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_02", taxMappings: { impuesto: "IPS", tipo: "patronal" } },
  { code: "5.1.04", name: "Honorarios Profesionales",             nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_03" },
  { code: "5.1.05", name: "Alquileres",                           nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_04" },
  { code: "5.1.06", name: "Servicios Públicos",                   nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_05" },
  { code: "5.1.07", name: "Comunicaciones y Telefonía",           nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_05" },
  { code: "5.1.08", name: "Publicidad y Marketing",               nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_06" },
  { code: "5.1.09", name: "Materiales y Útiles de Oficina",       nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_07" },
  { code: "5.1.10", name: "Mantenimiento y Reparaciones",         nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_08" },
  { code: "5.1.11", name: "Seguros",                              nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_09" },
  { code: "5.1.12", name: "Depreciaciones",                       nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_10" },
  { code: "5.1.13", name: "IRE del Ejercicio",                    nature: "expense", allowsPosting: true,  parentCode: "5.1", eefLineId: "G_OP_11", taxMappings: { impuesto: "IRE" } },
  { code: "5.2",   name: "GASTOS FINANCIEROS",                    nature: "expense", allowsPosting: false, parentCode: "5" },
  { code: "5.2.01", name: "Intereses Bancarios",                  nature: "expense", allowsPosting: true,  parentCode: "5.2", eefLineId: "G_FIN_01" },
  { code: "5.2.02", name: "Comisiones y Gastos Bancarios",        nature: "expense", allowsPosting: true,  parentCode: "5.2", eefLineId: "G_FIN_01" },
  { code: "5.2.03", name: "Diferencia de Cambio Perdida",         nature: "expense", allowsPosting: true,  parentCode: "5.2", eefLineId: "G_FIN_02" },
  { code: "5.3",   name: "OTROS GASTOS",                          nature: "expense", allowsPosting: false, parentCode: "5" },
  { code: "5.3.01", name: "Multas y Recargos DNIT",               nature: "expense", allowsPosting: true,  parentCode: "5.3", eefLineId: "G_OTR_01", taxMappings: { dnit: "multa" } },
  { code: "5.3.02", name: "Gastos Extraordinarios",               nature: "expense", allowsPosting: true,  parentCode: "5.3", eefLineId: "G_OTR_02" },
];

// ─── Entidades Paraguay ────────────────────────────────────────────────────────

const ENTITIES_DATA = [
  {
    ruc: "80012345-1",
    legalName: "Importadora del Este S.A.",
    tradeName: "ImportEste",
    taxRegimes: ["IVA_GRAL", "IRE_GRAL"],
    baseCurrency: "PYG",
    journal: "IMPE",
  },
  {
    ruc: "4512367-8",
    legalName: "Consultora Arroyo & Asociados S.R.L.",
    tradeName: "Arroyo Consultores",
    taxRegimes: ["IVA_GRAL", "IRE_SIMPLE"],
    baseCurrency: "PYG",
    journal: "CONS",
  },
  {
    ruc: "2398456-4",
    legalName: "Distribuidora Guaraní E.A.S.",
    tradeName: "Distribuidora Guaraní",
    taxRegimes: ["IVA_GRAL", "IRE_RESUMPLE"],
    baseCurrency: "PYG",
    journal: "DIST",
  },
  {
    ruc: "80098765-3",
    legalName: "Supermercado Don Juan S.A.",
    tradeName: "Super Don Juan",
    taxRegimes: ["IVA_GRAL", "IRE_GRAL"],
    baseCurrency: "PYG",
    journal: "SUPM",
  },
  {
    ruc: "5671234-9",
    legalName: "Ferretería Central S.R.L.",
    tradeName: "Ferretería Central",
    taxRegimes: ["IVA_GRAL", "IRE_SIMPLE"],
    baseCurrency: "PYG",
    journal: "FERR",
  },
];

// ─── Helper: insert plan de cuentas for a given coaId ─────────────────────────

async function insertCOA(
  db: ReturnType<typeof drizzle>,
  coaId: string
): Promise<Map<string, string>> {
  const codeToId = new Map<string, string>();

  // Insert in order so parents exist before children
  // Level 1 first, then 2, then 3 (determined by number of dots in code)
  const levels = [
    PLAN_CUENTAS.filter((a) => !a.code.includes(".")),
    PLAN_CUENTAS.filter((a) => a.code.split(".").length === 2),
    PLAN_CUENTAS.filter((a) => a.code.split(".").length === 3),
  ];

  for (const level of levels) {
    if (level.length === 0) continue;
    const inserted = await db
      .insert(schema.accounts)
      .values(
        level.map((acc) => ({
          coaId,
          code: acc.code,
          name: acc.name,
          nature: acc.nature,
          allowsPosting: acc.allowsPosting,
          parentId: acc.parentCode ? codeToId.get(acc.parentCode) ?? null : null,
          taxMappings: acc.taxMappings ?? null,
          eefLineId: acc.eefLineId ?? null,
        }))
      )
      .returning({ id: schema.accounts.id, code: schema.accounts.code });

    for (const row of inserted) {
      codeToId.set(row.code, row.id);
    }
  }

  return codeToId;
}

// ─── Helper: require account id by code (throws if missing) ───────────────────

function acc(map: Map<string, string>, code: string): string {
  const id = map.get(code);
  if (!id) throw new Error(`Account code not found in map: ${code}`);
  return id;
}

// ─── Journal entries por entidad ──────────────────────────────────────────────

type JournalLineDef = {
  accountCode: string;
  debit: string;
  credit: string;
  description: string;
};

type JournalEntryDef = {
  date: Date;
  numberSuffix: string;
  source: "manual" | "sales" | "purchase" | "payment" | "collection" | "bank" | "payroll";
  description: string;
  lines: JournalLineDef[];
};

function getJournalEntries(prefix: string): JournalEntryDef[] {
  return [
    // ── Asiento 1: Compra de mercadería con IVA 10% ────────────────────────
    {
      date: new Date("2026-05-05"),
      numberSuffix: "001",
      source: "purchase",
      description: "Compra mercadería gravada 10% — Fact. 001-001-0000345",
      lines: [
        { accountCode: "1.1.11", debit: "15000000.0000", credit: "0.0000",      description: "Mercaderías — costo neto" },
        { accountCode: "1.1.07", debit: "1500000.0000",  credit: "0.0000",      description: "IVA Crédito Fiscal 10%" },
        { accountCode: "2.1.01", debit: "0.0000",        credit: "16500000.0000", description: "Proveedor Distribuidora XYZ — a/c" },
      ],
    },
    // ── Asiento 2: Venta al contado IVA 10% ───────────────────────────────
    {
      date: new Date("2026-05-10"),
      numberSuffix: "002",
      source: "sales",
      description: "Venta mercadería gravada 10% — Timbrado 001-001-9990001",
      lines: [
        { accountCode: "1.1.01", debit: "22000000.0000", credit: "0.0000",      description: "Cobro en efectivo" },
        { accountCode: "4.1.01", debit: "0.0000",        credit: "20000000.0000", description: "Venta neta gravada 10%" },
        { accountCode: "2.1.03", debit: "0.0000",        credit: "2000000.0000",  description: "IVA Débito Fiscal 10%" },
      ],
    },
    // ── Asiento 3: Planilla de sueldos mayo 2026 ──────────────────────────
    {
      date: new Date("2026-05-30"),
      numberSuffix: "003",
      source: "payroll",
      description: "Planilla de sueldos y cargas sociales — Mayo 2026",
      lines: [
        { accountCode: "5.1.02", debit: "8000000.0000",  credit: "0.0000",      description: "Sueldos brutos" },
        { accountCode: "5.1.03", debit: "1320000.0000",  credit: "0.0000",      description: "IPS Patronal 16,5%" },
        { accountCode: "2.1.09", debit: "0.0000",        credit: "720000.0000",  description: "IPS Personal 9% — a depositar" },
        { accountCode: "2.1.08", debit: "0.0000",        credit: "1320000.0000", description: "IPS Patronal 16,5% — a depositar" },
        { accountCode: "2.1.10", debit: "0.0000",        credit: "7280000.0000", description: "Sueldo neto a pagar" },
      ],
    },
    // ── Asiento 4: Pago IVA mensual a DNIT ────────────────────────────────
    {
      date: new Date("2026-05-31"),
      numberSuffix: "004",
      source: "payment",
      description: "Pago IVA Mayo 2026 — Boleta DNIT / Marangatú",
      lines: [
        { accountCode: "2.1.03", debit: "2000000.0000",  credit: "0.0000",      description: "Cancelación IVA Débito 10%" },
        { accountCode: "1.1.07", debit: "0.0000",        credit: "1500000.0000", description: "Aplicación IVA Crédito 10%" },
        { accountCode: "1.1.02", debit: "0.0000",        credit: "500000.0000",  description: "Pago diferencia IVA — Banco Continental" },
      ],
    },
  ].map((e) => ({ ...e, numberSuffix: `${prefix}-${e.numberSuffix}` }));
}

// Entidad 2 (Consultora): honorarios + cobro + sueldo + anticipo IRE
function getConsultoraEntries(prefix: string): JournalEntryDef[] {
  return [
    {
      date: new Date("2026-05-03"),
      numberSuffix: `${prefix}-001`,
      source: "sales",
      description: "Emisión factura honorarios consultoría — Timbrado 001-001-0000112",
      lines: [
        { accountCode: "1.1.05", debit: "5500000.0000",  credit: "0.0000",      description: "Cuenta a cobrar — Cliente ABC S.A." },
        { accountCode: "4.1.04", debit: "0.0000",        credit: "5000000.0000", description: "Honorarios consultoría neto" },
        { accountCode: "2.1.03", debit: "0.0000",        credit: "500000.0000",  description: "IVA Débito Fiscal 10%" },
      ],
    },
    {
      date: new Date("2026-05-15"),
      numberSuffix: `${prefix}-002`,
      source: "collection",
      description: "Cobro factura honorarios — Transferencia Bancaria",
      lines: [
        { accountCode: "1.1.02", debit: "5500000.0000",  credit: "0.0000",      description: "Depósito banco Continental" },
        { accountCode: "1.1.05", debit: "0.0000",        credit: "5500000.0000", description: "Cancelación cuenta a cobrar" },
      ],
    },
    {
      date: new Date("2026-05-30"),
      numberSuffix: `${prefix}-003`,
      source: "payroll",
      description: "Planilla de sueldos Mayo 2026 — 2 empleados",
      lines: [
        { accountCode: "5.1.02", debit: "4000000.0000",  credit: "0.0000",      description: "Sueldos brutos — 2 empleados" },
        { accountCode: "5.1.03", debit: "660000.0000",   credit: "0.0000",      description: "IPS Patronal 16,5%" },
        { accountCode: "2.1.09", debit: "0.0000",        credit: "360000.0000",  description: "IPS Personal 9%" },
        { accountCode: "2.1.08", debit: "0.0000",        credit: "660000.0000",  description: "IPS Patronal 16,5%" },
        { accountCode: "2.1.10", debit: "0.0000",        credit: "3640000.0000", description: "Sueldo neto a pagar" },
      ],
    },
    {
      date: new Date("2026-05-31"),
      numberSuffix: `${prefix}-004`,
      source: "payment",
      description: "Pago anticipo IRE trimestral Mayo 2026",
      lines: [
        { accountCode: "1.1.09", debit: "800000.0000",   credit: "0.0000",      description: "Anticipo IRE — cuota mensual" },
        { accountCode: "1.1.02", debit: "0.0000",        credit: "800000.0000",  description: "Pago banco Continental — Marangatú" },
      ],
    },
  ];
}

// Entidad 3 (Distribuidora): IVA 5% (mercadería tipo canasta)
function getDistribuidoraEntries(prefix: string): JournalEntryDef[] {
  return [
    {
      date: new Date("2026-05-04"),
      numberSuffix: `${prefix}-001`,
      source: "purchase",
      description: "Compra mercadería IVA 5% — Fact. 001-002-0000891 (productos canasta familiar)",
      lines: [
        { accountCode: "1.1.11", debit: "20000000.0000", credit: "0.0000",       description: "Mercaderías — costo neto" },
        { accountCode: "1.1.08", debit: "1000000.0000",  credit: "0.0000",       description: "IVA Crédito Fiscal 5%" },
        { accountCode: "2.1.01", debit: "0.0000",        credit: "21000000.0000", description: "Proveedor — crédito 30 días" },
      ],
    },
    {
      date: new Date("2026-05-12"),
      numberSuffix: `${prefix}-002`,
      source: "sales",
      description: "Venta mercadería IVA 5% — Timbrado 001-001-0000678",
      lines: [
        { accountCode: "1.1.01", debit: "26250000.0000", credit: "0.0000",       description: "Cobro contado" },
        { accountCode: "4.1.02", debit: "0.0000",        credit: "25000000.0000", description: "Ventas netas IVA 5%" },
        { accountCode: "2.1.04", debit: "0.0000",        credit: "1250000.0000",  description: "IVA Débito Fiscal 5%" },
      ],
    },
    {
      date: new Date("2026-05-20"),
      numberSuffix: `${prefix}-003`,
      source: "payment",
      description: "Pago alquiler local comercial — Mayo 2026",
      lines: [
        { accountCode: "5.1.05", debit: "3500000.0000",  credit: "0.0000",       description: "Alquiler local comercial neto" },
        { accountCode: "1.1.07", debit: "350000.0000",   credit: "0.0000",       description: "IVA crédito alquiler 10%" },
        { accountCode: "1.1.02", debit: "0.0000",        credit: "3850000.0000",  description: "Pago banco" },
      ],
    },
    {
      date: new Date("2026-05-30"),
      numberSuffix: `${prefix}-004`,
      source: "payroll",
      description: "Planilla de sueldos Mayo 2026 — 3 empleados",
      lines: [
        { accountCode: "5.1.02", debit: "6000000.0000",  credit: "0.0000",       description: "Sueldos brutos" },
        { accountCode: "5.1.03", debit: "990000.0000",   credit: "0.0000",       description: "IPS Patronal 16,5%" },
        { accountCode: "2.1.09", debit: "0.0000",        credit: "540000.0000",  description: "IPS Personal 9%" },
        { accountCode: "2.1.08", debit: "0.0000",        credit: "990000.0000",  description: "IPS Patronal 16,5%" },
        { accountCode: "2.1.10", debit: "0.0000",        credit: "5460000.0000", description: "Sueldo neto a pagar" },
      ],
    },
  ];
}

// Entidad 4 (Supermercado): mayor volumen, venta mixta 10%/5%/exenta
function getSupermercadoEntries(prefix: string): JournalEntryDef[] {
  return [
    {
      date: new Date("2026-05-02"),
      numberSuffix: `${prefix}-001`,
      source: "purchase",
      description: "Compra mercadería mixta — Fact. proveedor 001-003-0001234",
      lines: [
        { accountCode: "1.1.11", debit: "80000000.0000", credit: "0.0000",        description: "Mercaderías varias (neto)" },
        { accountCode: "1.1.07", debit: "5000000.0000",  credit: "0.0000",        description: "IVA Crédito 10% (productos gravados)" },
        { accountCode: "1.1.08", debit: "2000000.0000",  credit: "0.0000",        description: "IVA Crédito 5% (canasta familiar)" },
        { accountCode: "2.1.01", debit: "0.0000",        credit: "87000000.0000", description: "Proveedor — pago 15 días" },
      ],
    },
    {
      date: new Date("2026-05-31"),
      numberSuffix: `${prefix}-002`,
      source: "sales",
      description: "Resumen ventas Mayo 2026 — POS + Cajas",
      lines: [
        { accountCode: "1.1.01", debit: "60000000.0000",  credit: "0.0000",        description: "Cobro efectivo" },
        { accountCode: "1.1.02", debit: "90000000.0000",  credit: "0.0000",        description: "POS bancario / transferencias" },
        { accountCode: "4.1.01", debit: "0.0000",         credit: "100000000.0000", description: "Ventas netas gravadas 10%" },
        { accountCode: "4.1.02", debit: "0.0000",         credit: "28000000.0000",  description: "Ventas netas gravadas 5%" },
        { accountCode: "4.1.03", debit: "0.0000",         credit: "9000000.0000",   description: "Ventas exentas" },
        { accountCode: "2.1.03", debit: "0.0000",         credit: "10000000.0000",  description: "IVA Débito 10%" },
        { accountCode: "2.1.04", debit: "0.0000",         credit: "1400000.0000",   description: "IVA Débito 5%" },
        { accountCode: "5.1.01", debit: "99400000.0000",  credit: "0.0000",         description: "Costo de ventas mayo" },
        { accountCode: "1.1.11", debit: "0.0000",         credit: "99400000.0000",  description: "Descarga inventario" },
      ],
    },
    {
      date: new Date("2026-05-30"),
      numberSuffix: `${prefix}-003`,
      source: "payroll",
      description: "Planilla sueldos + IPS Mayo 2026 — 15 empleados",
      lines: [
        { accountCode: "5.1.02", debit: "30000000.0000", credit: "0.0000",        description: "Sueldos brutos — 15 empleados" },
        { accountCode: "5.1.03", debit: "4950000.0000",  credit: "0.0000",        description: "IPS Patronal 16,5%" },
        { accountCode: "2.1.09", debit: "0.0000",        credit: "2700000.0000",  description: "IPS Personal 9%" },
        { accountCode: "2.1.08", debit: "0.0000",        credit: "4950000.0000",  description: "IPS Patronal 16,5%" },
        { accountCode: "2.1.10", debit: "0.0000",        credit: "27300000.0000", description: "Sueldo neto a pagar" },
      ],
    },
    {
      date: new Date("2026-05-31"),
      numberSuffix: `${prefix}-004`,
      source: "payment",
      description: "Liquidación IVA Mayo 2026 / Presentación Hechauka — DNIT",
      lines: [
        { accountCode: "2.1.03", debit: "10000000.0000", credit: "0.0000",       description: "Cancelación IVA Débito 10%" },
        { accountCode: "2.1.04", debit: "1400000.0000",  credit: "0.0000",       description: "Cancelación IVA Débito 5%" },
        { accountCode: "1.1.07", debit: "0.0000",        credit: "5000000.0000", description: "Aplicación IVA Crédito 10%" },
        { accountCode: "1.1.08", debit: "0.0000",        credit: "2000000.0000", description: "Aplicación IVA Crédito 5%" },
        { accountCode: "1.1.02", debit: "0.0000",        credit: "4400000.0000", description: "Pago DNIT — Banco Continental" },
      ],
    },
  ];
}

// Entidad 5 (Ferretería): con retención IVA (agente retenedor)
function getFerreteryEntries(prefix: string): JournalEntryDef[] {
  return [
    {
      date: new Date("2026-05-06"),
      numberSuffix: `${prefix}-001`,
      source: "purchase",
      description: "Compra mercadería ferrería — Fact. 001-001-0002456",
      lines: [
        { accountCode: "1.1.11", debit: "12000000.0000", credit: "0.0000",        description: "Herramientas y materiales — costo neto" },
        { accountCode: "1.1.07", debit: "1200000.0000",  credit: "0.0000",        description: "IVA Crédito Fiscal 10%" },
        { accountCode: "2.1.01", debit: "0.0000",        credit: "13200000.0000", description: "Proveedor Ace Hardware PY S.A." },
      ],
    },
    {
      date: new Date("2026-05-14"),
      numberSuffix: `${prefix}-002`,
      source: "sales",
      description: "Venta contado materiales de construcción — Timbrado 001-001-9990100",
      lines: [
        { accountCode: "1.1.01", debit: "19800000.0000", credit: "0.0000",        description: "Cobro contado" },
        { accountCode: "4.1.01", debit: "0.0000",        credit: "18000000.0000", description: "Venta neta gravada 10%" },
        { accountCode: "2.1.03", debit: "0.0000",        credit: "1800000.0000",  description: "IVA Débito Fiscal 10%" },
      ],
    },
    {
      date: new Date("2026-05-30"),
      numberSuffix: `${prefix}-003`,
      source: "payroll",
      description: "Planilla de sueldos Mayo 2026 — 4 empleados",
      lines: [
        { accountCode: "5.1.02", debit: "5000000.0000",  credit: "0.0000",       description: "Sueldos brutos" },
        { accountCode: "5.1.03", debit: "825000.0000",   credit: "0.0000",       description: "IPS Patronal 16,5%" },
        { accountCode: "2.1.09", debit: "0.0000",        credit: "450000.0000",  description: "IPS Personal 9%" },
        { accountCode: "2.1.08", debit: "0.0000",        credit: "825000.0000",  description: "IPS Patronal 16,5%" },
        { accountCode: "2.1.10", debit: "0.0000",        credit: "4550000.0000", description: "Sueldo neto a pagar" },
      ],
    },
    {
      date: new Date("2026-05-31"),
      numberSuffix: `${prefix}-004`,
      source: "payment",
      description: "Pago IVA + depósito retenciones IVA (agente RG90) — DNIT Mayo 2026",
      lines: [
        { accountCode: "2.1.03", debit: "1800000.0000",  credit: "0.0000",       description: "Cancelación IVA Débito 10%" },
        { accountCode: "2.1.05", debit: "300000.0000",   credit: "0.0000",       description: "Retenciones IVA RG90 — a depositar" },
        { accountCode: "1.1.07", debit: "0.0000",        credit: "1200000.0000", description: "Aplicación IVA Crédito 10%" },
        { accountCode: "1.1.02", debit: "0.0000",        credit: "900000.0000",  description: "Pago DNIT banco" },
      ],
    },
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error(
      "❌ DATABASE_URL no está definida.\n" +
      "   Copiá .env.example a .env.local y configurá la URL de Supabase."
    );
    process.exit(1);
  }

  console.log("🌱 Iniciando seed — InteliCont\n");

  const client = postgres(dbUrl, { max: 1, ssl: "require" });
  const db = drizzle(client, { schema });

  let totalEntries = 0;
  let totalLines = 0;

  try {
    for (let i = 0; i < ENTITIES_DATA.length; i++) {
      const entityData = ENTITIES_DATA[i];
      console.log(`─── Entidad ${i + 1}/5: ${entityData.legalName} ───────────────`);

      // 1. Entity
      const [entity] = await db
        .insert(schema.entities)
        .values({
          ruc:          entityData.ruc,
          legalName:    entityData.legalName,
          tradeName:    entityData.tradeName,
          taxRegimes:   entityData.taxRegimes,
          baseCurrency: entityData.baseCurrency,
          status:       "active",
        })
        .onConflictDoNothing()
        .returning();

      if (!entity) {
        console.log(`   ⚠  Entidad ya existe (RUC ${entityData.ruc}), saltando...`);
        continue;
      }
      console.log(`   ✓ Entidad: ${entity.legalName} (${entity.id})`);

      // 2. Chart of accounts
      const [coa] = await db
        .insert(schema.chartOfAccounts)
        .values({
          entityId: entity.id,
          kind:     "fiscal_py",
          name:     "Plan de Cuentas DNIT — Paraguay",
        })
        .returning();
      console.log(`   ✓ Plan de cuentas: ${coa.name}`);

      // 3. Accounts (hierarchical, 3 levels)
      const accountMap = await insertCOA(db, coa.id);
      console.log(`   ✓ Cuentas creadas: ${accountMap.size}`);

      // 4. Fiscal period May 2026
      const [period] = await db
        .insert(schema.fiscalPeriods)
        .values({
          entityId: entity.id,
          year:     2026,
          month:    5,
          status:   "open",
        })
        .returning();
      console.log(`   ✓ Período fiscal: ${period.year}/${String(period.month).padStart(2, "0")}`);

      // 5. Journal entries (4 per entity)
      const entryDefs: JournalEntryDef[] =
        i === 0 ? getJournalEntries(entityData.journal) :
        i === 1 ? getConsultoraEntries(entityData.journal) :
        i === 2 ? getDistribuidoraEntries(entityData.journal) :
        i === 3 ? getSupermercadoEntries(entityData.journal) :
                  getFerreteryEntries(entityData.journal);

      for (const def of entryDefs) {
        const [entry] = await db
          .insert(schema.journalEntries)
          .values({
            entityId:    entity.id,
            periodId:    period.id,
            date:        def.date,
            number:      def.numberSuffix,
            source:      def.source,
            description: def.description,
            status:      "posted",
            postedAt:    new Date(),
          })
          .returning();

        const lines = def.lines.map((l) => ({
          entryId:      entry.id,
          accountId:    acc(accountMap, l.accountCode),
          debit:        l.debit,
          credit:       l.credit,
          currencyCode: "PYG",
          description:  l.description,
        }));

        await db.insert(schema.journalLines).values(lines);

        // Verify double-entry balance
        const sumDebit  = lines.reduce((s, l) => s + parseFloat(l.debit),  0);
        const sumCredit = lines.reduce((s, l) => s + parseFloat(l.credit), 0);
        const balanced  = Math.abs(sumDebit - sumCredit) < 0.01;

        console.log(
          `   ${balanced ? "✓" : "✗"} Asiento ${entry.number}: ` +
          `Gs. ${sumDebit.toLocaleString("es-PY")} ` +
          `${balanced ? "✔ balanceado" : "⚠ DESBALANCEADO"}`
        );

        totalEntries++;
        totalLines += lines.length;
      }

      console.log();
    }

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ Seed completado exitosamente");
    console.log(`   Entidades:     ${ENTITIES_DATA.length}`);
    console.log(`   Cuentas/ent.:  ${PLAN_CUENTAS.length} (plan DNIT estándar PY)`);
    console.log(`   Asientos:      ${totalEntries}`);
    console.log(`   Líneas:        ${totalLines}`);
    console.log("═══════════════════════════════════════════════════════\n");
    console.log("👉 Verificá con: pnpm db:studio");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
