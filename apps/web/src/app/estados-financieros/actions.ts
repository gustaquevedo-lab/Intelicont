"use server";

import { eq, and, lte, sql, asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entities, chartOfAccounts, accounts, journalEntries, journalLines } from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Entity list ──────────────────────────────────────────────────────────────

export async function loadEntidadesParaEF(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
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

// ─── Account balance row ──────────────────────────────────────────────────────

export interface AccountBalance {
  id:           string;
  code:         string;
  name:         string;
  nature:       string;
  parentId:     string | null;
  totalDebit:   number;
  totalCredit:  number;
  /** Signed balance: positive = normal balance for this nature */
  balance:      number;
  children:     AccountBalance[];
  subtotal:     number; // sum of balance + all descendant balances
  level:        number;
}

// ─── Financial statements payload ────────────────────────────────────────────

export interface BalanceGeneral {
  entityName:   string;
  ruc:          string;
  asOfDate:     string;
  activo:       AccountBalance[];
  pasivo:       AccountBalance[];
  patrimonio:   AccountBalance[];
  totalActivo:  number;
  totalPasivo:  number;
  totalPatrimonio: number;
  resultadoEjercicio: number; // net income included in equity
  ecuacionVerified: boolean;
}

export interface EstadoResultados {
  entityName:   string;
  ruc:          string;
  fromDate:     string;
  toDate:       string;
  ingresos:     AccountBalance[];
  egresos:      AccountBalance[];
  totalIngresos: number;
  totalEgresos:  number;
  resultado:    number;  // positive = ganancia, negative = pérdida
}

// ─── Core query: balances per account ────────────────────────────────────────

async function queryAccountBalances(
  entityId: string,
  options: {
    fromDate?: Date;
    toDate:    Date;
    natures:   string[];
  }
): Promise<Map<string, { debit: number; credit: number }>> {
  const db = getDb();

  const conditions = [
    eq(journalEntries.entityId, entityId),
    eq(journalEntries.status, "posted"),
    lte(journalEntries.date, options.toDate),
  ];
  if (options.fromDate) {
    const { gte } = await import("drizzle-orm");
    conditions.push(gte(journalEntries.date, options.fromDate));
  }

  const rows = await db
    .select({
      accountId:  journalLines.accountId,
      totalDebit: sql<string>`SUM(${journalLines.debit}::numeric)`,
      totalCredit:sql<string>`SUM(${journalLines.credit}::numeric)`,
    })
    .from(journalLines)
    .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
    .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
    .where(and(...conditions))
    .groupBy(journalLines.accountId);

  const map = new Map<string, { debit: number; credit: number }>();
  rows.forEach((r) => {
    map.set(r.accountId, {
      debit:  parseFloat(r.totalDebit  ?? "0"),
      credit: parseFloat(r.totalCredit ?? "0"),
    });
  });
  return map;
}

// ─── Build account tree with balances ────────────────────────────────────────

function signedBalance(nature: string, debit: number, credit: number): number {
  // For each nature, positive means the account has a "normal" balance
  switch (nature) {
    case "asset":
    case "expense": return debit - credit;   // debit-normal
    case "liability":
    case "equity":
    case "income":  return credit - debit;   // credit-normal
    default:        return debit - credit;
  }
}

function buildTree(
  allAccounts: Array<{
    id: string; code: string; name: string;
    nature: string | null; parentId: string | null;
  }>,
  balances: Map<string, { debit: number; credit: number }>,
  natures:  string[],
  rootNature: string,
): AccountBalance[] {
  // Filter to relevant natures
  const relevant = allAccounts.filter((a) => natures.includes(a.nature ?? ""));

  const map = new Map<string, AccountBalance>();
  relevant.forEach((a) => {
    const bal = balances.get(a.id) ?? { debit: 0, credit: 0 };
    const balance = signedBalance(a.nature ?? "", bal.debit, bal.credit);
    map.set(a.id, {
      id:          a.id,
      code:        a.code,
      name:        a.name,
      nature:      a.nature ?? "",
      parentId:    a.parentId,
      totalDebit:  bal.debit,
      totalCredit: bal.credit,
      balance,
      children:    [],
      subtotal:    balance,
      level:       0,
    });
  });

  const roots: AccountBalance[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children by code
  function sortChildren(node: AccountBalance) {
    node.children.sort((a, b) => a.code.localeCompare(b.code));
    node.children.forEach(sortChildren);
  }
  roots.sort((a, b) => a.code.localeCompare(b.code));
  roots.forEach(sortChildren);

  // Compute subtotals bottom-up and assign levels
  function computeSubtotal(node: AccountBalance, level: number): number {
    node.level = level;
    let sum = node.balance;
    node.children.forEach((c) => { sum += computeSubtotal(c, level + 1); });
    node.subtotal = sum;
    return sum;
  }
  roots.forEach((r) => computeSubtotal(r, 0));

  return roots;
}

function sumTree(nodes: AccountBalance[]): number {
  return nodes.reduce((s, n) => s + n.subtotal, 0);
}

// ─── Balance General ──────────────────────────────────────────────────────────

export async function loadBalanceGeneral(
  entityId: string,
  asOfDate:  string,
): Promise<ActionResult<BalanceGeneral>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };
  if (!asOfDate) return { ok: false, error: "Ingresá una fecha de corte" };

  try {
    const db      = getDb();
    const endDate = new Date(asOfDate + "T23:59:59");

    // Get entity info
    const [entity] = await db
      .select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities).where(eq(entities.id, entityId));
    if (!entity) return { ok: false, error: "Empresa no encontrada" };

    // Get chart of accounts
    const [coa] = await db.select().from(chartOfAccounts)
      .where(eq(chartOfAccounts.entityId, entityId)).orderBy(chartOfAccounts.kind).limit(1);
    if (!coa) return { ok: false, error: "Esta empresa no tiene plan de cuentas" };

    const allAccounts = await db
      .select({ id: accounts.id, code: accounts.code, name: accounts.name, nature: accounts.nature, parentId: accounts.parentId })
      .from(accounts)
      .where(eq(accounts.coaId, coa.id))
      .orderBy(asc(accounts.code));

    // Get ALL balances up to date (balance sheet is cumulative)
    const balances = await queryAccountBalances(entityId, {
      toDate:  endDate,
      natures: ["asset", "liability", "equity", "income", "expense"],
    });

    // Net income from income/expense accounts (included in equity per accounting equation)
    const incomeTree  = buildTree(allAccounts, balances, ["income"],  "income");
    const expenseTree = buildTree(allAccounts, balances, ["expense"], "expense");
    const totalIncome  = sumTree(incomeTree);
    const totalExpense = sumTree(expenseTree);
    const resultadoEjercicio = totalIncome - totalExpense;

    // Build trees for balance sheet
    const activoTree    = buildTree(allAccounts, balances, ["asset"],     "asset");
    const pasivoTree    = buildTree(allAccounts, balances, ["liability"], "liability");
    const patrimonioTree= buildTree(allAccounts, balances, ["equity"],    "equity");

    const totalActivo     = sumTree(activoTree);
    const totalPasivo     = sumTree(pasivoTree);
    const totalPatrimonio = sumTree(patrimonioTree) + resultadoEjercicio;

    // Ecuación contable: Activo = Pasivo + Patrimonio (±1 rounding)
    const ecuacionVerified = Math.abs(totalActivo - (totalPasivo + totalPatrimonio)) < 1;

    return {
      ok: true,
      data: {
        entityName:   entity.legalName,
        ruc:          entity.ruc,
        asOfDate,
        activo:       activoTree,
        pasivo:       pasivoTree,
        patrimonio:   patrimonioTree,
        totalActivo,
        totalPasivo,
        totalPatrimonio,
        resultadoEjercicio,
        ecuacionVerified,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al generar Balance General" };
  }
}

// ─── Estado de Resultados ────────────────────────────────────────────────────

export async function loadEstadoResultados(
  entityId: string,
  fromDate:  string,
  toDate:    string,
): Promise<ActionResult<EstadoResultados>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };
  if (!fromDate || !toDate) return { ok: false, error: "Ingresá el período" };

  try {
    const db    = getDb();
    const from  = new Date(fromDate + "T00:00:00");
    const to    = new Date(toDate   + "T23:59:59");

    const [entity] = await db
      .select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities).where(eq(entities.id, entityId));
    if (!entity) return { ok: false, error: "Empresa no encontrada" };

    const [coa] = await db.select().from(chartOfAccounts)
      .where(eq(chartOfAccounts.entityId, entityId)).orderBy(chartOfAccounts.kind).limit(1);
    if (!coa) return { ok: false, error: "Esta empresa no tiene plan de cuentas" };

    const allAccounts = await db
      .select({ id: accounts.id, code: accounts.code, name: accounts.name, nature: accounts.nature, parentId: accounts.parentId })
      .from(accounts)
      .where(eq(accounts.coaId, coa.id))
      .orderBy(asc(accounts.code));

    const balances = await queryAccountBalances(entityId, {
      fromDate: from,
      toDate:   to,
      natures:  ["income", "expense"],
    });

    const ingresosTree = buildTree(allAccounts, balances, ["income"],  "income");
    const egresosTree  = buildTree(allAccounts, balances, ["expense"], "expense");

    const totalIngresos = sumTree(ingresosTree);
    const totalEgresos  = sumTree(egresosTree);

    return {
      ok: true,
      data: {
        entityName:    entity.legalName,
        ruc:           entity.ruc,
        fromDate,
        toDate,
        ingresos:      ingresosTree,
        egresos:       egresosTree,
        totalIngresos,
        totalEgresos,
        resultado:     totalIngresos - totalEgresos,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al generar Estado de Resultados" };
  }
}

// ─── Flujo de Caja (Método Indirecto) ──────────────────────────────────────────

export interface FlujoCaja {
  entityName:              string;
  ruc:                     string;
  fromDate:                string;
  toDate:                  string;
  resultadoEjercicio:      number;
  depreciaciones:          number;
  cambioClientes:          number;
  cambioInventario:        number;
  cambioProveedores:       number;
  cambioOtrosPasivos:      number;
  totalOperativo:          number;
  inversionActivos:        number;
  totalInversion:          number;
  financiamientoPrestamos: number;
  totalFinanciamiento:     number;
  variacionNeta:           number;
  efectivoInicio:          number;
  efectivoFin:             number;
}

export async function loadFlujoCaja(
  entityId: string,
  fromDate:  string,
  toDate:    string,
): Promise<ActionResult<FlujoCaja>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };
  if (!fromDate || !toDate) return { ok: false, error: "Ingresá el período" };

  try {
    const db = getDb();
    const startPeriod = new Date(fromDate + "T00:00:00");
    const endPeriod = new Date(toDate + "T23:59:59");
    const beforeStart = new Date(startPeriod.getTime() - 1000); // 1 second before start

    // Get entity info
    const [entity] = await db
      .select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities)
      .where(eq(entities.id, entityId));
    if (!entity) return { ok: false, error: "Empresa no encontrada" };

    // Get CoA
    const [coa] = await db.select().from(chartOfAccounts)
      .where(eq(chartOfAccounts.entityId, entityId)).orderBy(chartOfAccounts.kind).limit(1);
    if (!coa) return { ok: false, error: "Esta empresa no tiene plan de cuentas" };

    const allAccounts = await db
      .select({ id: accounts.id, code: accounts.code, name: accounts.name, nature: accounts.nature })
      .from(accounts)
      .where(eq(accounts.coaId, coa.id));

    // Get balances at start and end
    const balancesStart = await queryAccountBalances(entityId, {
      toDate: beforeStart,
      natures: ["asset", "liability", "equity", "income", "expense"],
    });

    const balancesEnd = await queryAccountBalances(entityId, {
      toDate: endPeriod,
      natures: ["asset", "liability", "equity", "income", "expense"],
    });

    // Net income of this period
    const eerr = await loadEstadoResultados(entityId, fromDate, toDate);
    const resultadoEjercicio = eerr.ok ? eerr.data.resultado : 0;

    // Categorize accounts and calculate changes
    let depreciaciones = 0;
    let cambioClientes = 0;
    let cambioInventario = 0;
    let cambioProveedores = 0;
    let cambioOtrosPasivos = 0;
    let inversionActivos = 0;
    let financiamientoPrestamos = 0;
    let efectivoInicio = 0;
    let efectivoFin = 0;

    allAccounts.forEach((acc) => {
      const startVal = balancesStart.get(acc.id) ?? { debit: 0, credit: 0 };
      const endVal = balancesEnd.get(acc.id) ?? { debit: 0, credit: 0 };

      const balStart = signedBalance(acc.nature ?? "", startVal.debit, startVal.credit);
      const balEnd = signedBalance(acc.nature ?? "", endVal.debit, endVal.credit);
      const delta = balEnd - balStart; // positive = increase in normal balance

      const code = acc.code.toLowerCase();
      const name = acc.name.toLowerCase();

      // Check if cash/bank account (Available Cash)
      // Usually starts with 1.1.1 or 1.01.01 or similar, or contains "caja" or "banco"
      const isCash = code.startsWith("1.1.1") || code.startsWith("1.01.01") || code.startsWith("1.1.01") || name.includes("caja") || name.includes("banco");

      if (isCash) {
        efectivoInicio += balStart;
        efectivoFin += balEnd;
      } else if (acc.nature === "expense" && (name.includes("depreciac") || name.includes("amortizac"))) {
        // Depreciation is a non-cash expense. We get the period debit - credit of this account.
        const periodDebit = endVal.debit - startVal.debit;
        const periodCredit = endVal.credit - startVal.credit;
        depreciaciones += (periodDebit - periodCredit);
      } else if (acc.nature === "asset") {
        if (code.startsWith("1.1.2") || name.includes("cliente") || name.includes("deudor")) {
          // Accounts Receivable (increase is cash outflow -> minus delta)
          cambioClientes -= delta;
        } else if (code.startsWith("1.1.3") || name.includes("mercader") || name.includes("inventario")) {
          // Inventories (increase is cash outflow -> minus delta)
          cambioInventario -= delta;
        } else if (code.startsWith("1.2") || name.includes("propiedad") || name.includes("activo fijo") || name.includes("maquinaria") || name.includes("vehiculo") || name.includes("mueble")) {
          // Fixed Assets (increase is outflow -> minus delta)
          inversionActivos -= delta;
        }
      } else if (acc.nature === "liability") {
        if (code.startsWith("2.1.1") || name.includes("proveedor") || name.includes("acreedor")) {
          // Accounts Payable (increase is cash inflow -> plus delta)
          cambioProveedores += delta;
        } else if (code.startsWith("2.1.2") || name.includes("prestam") || name.includes("financ")) {
          financiamientoPrestamos += delta;
        } else {
          cambioOtrosPasivos += delta;
        }
      } else if (acc.nature === "equity") {
        // Equity changes (like capital increase is inflow)
        if (!name.includes("resultado")) {
          financiamientoPrestamos += delta;
        }
      }
    });

    const totalOperativo = resultadoEjercicio + depreciaciones + cambioClientes + cambioInventario + cambioProveedores + cambioOtrosPasivos;
    const totalInversion = inversionActivos;
    const totalFinanciamiento = financiamientoPrestamos;
    const variacionNeta = totalOperativo + totalInversion + totalFinanciamiento;

    return {
      ok: true,
      data: {
        entityName: entity.legalName,
        ruc: entity.ruc,
        fromDate,
        toDate,
        resultadoEjercicio,
        depreciaciones,
        cambioClientes,
        cambioInventario,
        cambioProveedores,
        cambioOtrosPasivos,
        totalOperativo,
        inversionActivos,
        totalInversion,
        financiamientoPrestamos,
        totalFinanciamiento,
        variacionNeta,
        efectivoInicio,
        efectivoFin: efectivoInicio + variacionNeta, // force balance consistency
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al generar Flujo de Caja" };
  }
}

