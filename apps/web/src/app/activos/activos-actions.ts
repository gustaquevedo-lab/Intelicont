"use server";

import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  fixedAssets, journalEntries, journalLines, accounts,
} from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FixedAssetRow {
  id: string;
  code: string;
  name: string;
  serialNumber: string | null;
  adquisitionDate: string;
  costValue: number;
  usefulLifeMonths: number;
  depreciatedValue: number;
  netBookValue: number;
  monthlyDepreciation: number;
  monthsElapsed: number;
  remainingMonths: number;
  percentDepreciated: number;
  glAccountId: string | null;
  depreciationAccountId: string | null;
  status: "active" | "fully_depreciated";
  taxDocumentId: string | null;
}

export interface CreateFixedAssetInput {
  entityId: string;
  code: string;
  name: string;
  serialNumber?: string;
  adquisitionDate: string; // YYYY-MM-DD
  costValue: number;
  usefulLifeMonths: number;
  glAccountId?: string;
  depreciationAccountId?: string;
  taxDocumentId?: string;
}

// ─── Calculate depreciation for a fixed asset ─────────────────────────────

function calculateDepreciation(row: {
  adquisitionDate: string;
  costValue: string | number;
  usefulLifeMonths: string | number;
  depreciatedValue: string | number;
}): {
  monthlyDepreciation: number;
  monthsElapsed: number;
  remainingMonths: number;
  netBookValue: number;
  percentDepreciated: number;
  status: "active" | "fully_depreciated";
} {
  const acqDate = new Date(row.adquisitionDate + "T12:00:00");
  const today   = new Date();
  const monthsElapsed = Math.max(0,
    (today.getFullYear() - acqDate.getFullYear()) * 12 +
    (today.getMonth()   - acqDate.getMonth())
  );

  const cost           = Number(row.costValue);
  const totalLife      = Number(row.usefulLifeMonths);
  const alreadyDepr    = Number(row.depreciatedValue);
  const monthlyDep     = totalLife > 0 ? cost / totalLife : 0;
  const remainingMonths = Math.max(0, totalLife - monthsElapsed);
  const netBookValue    = Math.max(0, cost - alreadyDepr);
  const pct             = cost > 0 ? (alreadyDepr / cost) * 100 : 0;

  return {
    monthlyDepreciation: Math.round(monthlyDep),
    monthsElapsed,
    remainingMonths,
    netBookValue:        Math.round(netBookValue),
    percentDepreciated:  Math.min(100, pct),
    status:              pct >= 100 ? "fully_depreciated" : "active",
  };
}

// ─── Load Fixed Assets ────────────────────────────────────────────────────

export async function loadFixedAssetsDetailed(
  entityId: string
): Promise<ActionResult<FixedAssetRow[]>> {
  if (!entityId) return { ok: false, error: "entityId requerido" };
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(fixedAssets)
      .where(eq(fixedAssets.entityId, entityId))
      .orderBy(fixedAssets.adquisitionDate);

    return {
      ok: true,
      data: rows.map((r) => {
        const calc = calculateDepreciation({
          adquisitionDate: r.adquisitionDate,
          costValue:       r.costValue,
          usefulLifeMonths: r.usefulLifeMonths,
          depreciatedValue: r.depreciatedValue ?? "0",
        });
        return {
          id:                   r.id,
          code:                 r.code,
          name:                 r.name,
          serialNumber:         r.serialNumber,
          adquisitionDate:      r.adquisitionDate,
          costValue:            Number(r.costValue),
          usefulLifeMonths:     r.usefulLifeMonths,
          depreciatedValue:     Number(r.depreciatedValue ?? 0),
          netBookValue:         calc.netBookValue,
          monthlyDepreciation:  calc.monthlyDepreciation,
          monthsElapsed:        calc.monthsElapsed,
          remainingMonths:      calc.remainingMonths,
          percentDepreciated:   calc.percentDepreciated,
          glAccountId:          r.glAccountId,
          depreciationAccountId: r.depreciationAccountId,
          status:               calc.status,
          taxDocumentId:        r.taxDocumentId,
        };
      }),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar activos" };
  }
}

// ─── Create Fixed Asset ───────────────────────────────────────────────────

export async function createFixedAsset(
  input: CreateFixedAssetInput
): Promise<ActionResult<{ id: string }>> {
  const { entityId, code, name, adquisitionDate, costValue, usefulLifeMonths } = input;
  if (!entityId || !code || !name) return { ok: false, error: "Faltan campos obligatorios" };
  try {
    const db = getDb();

    // Check duplicate code
    const [existing] = await db
      .select({ id: fixedAssets.id })
      .from(fixedAssets)
      .where(and(eq(fixedAssets.entityId, entityId), eq(fixedAssets.code, code)))
      .limit(1);
    if (existing) return { ok: false, error: `Ya existe un activo con código ${code}` };

    const [row] = await db.insert(fixedAssets).values({
      entityId,
      code,
      name,
      serialNumber:         input.serialNumber || null,
      adquisitionDate,
      costValue:            String(costValue),
      usefulLifeMonths,
      depreciatedValue:     "0",
      glAccountId:          input.glAccountId          || null,
      depreciationAccountId: input.depreciationAccountId || null,
      taxDocumentId:        input.taxDocumentId         || null,
    }).returning();

    revalidatePath("/activos");
    return { ok: true, data: { id: row.id } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear activo" };
  }
}

// ─── Generate Monthly Depreciation Journal Entry ──────────────────────────
// For a single asset: Debit depreciationExpenseAccount / Credit accumulatedDepreciationAccount

export async function generateDepreciationEntry(
  entityId: string,
  assetId: string,
  periodMonth: string // YYYY-MM
): Promise<ActionResult<{ entryId: string; entryNumber: string; amount: number }>> {
  if (!entityId || !assetId) return { ok: false, error: "Faltan parámetros" };
  try {
    const db = getDb();

    // Load asset
    const [asset] = await db.select().from(fixedAssets).where(eq(fixedAssets.id, assetId)).limit(1);
    if (!asset) return { ok: false, error: "Activo no encontrado" };

    const calc = calculateDepreciation({
      adquisitionDate:  asset.adquisitionDate,
      costValue:        asset.costValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      depreciatedValue: asset.depreciatedValue ?? "0",
    });

    if (calc.status === "fully_depreciated") {
      return { ok: false, error: "Este activo ya está completamente depreciado" };
    }

    const amount = calc.monthlyDepreciation;
    if (amount <= 0) return { ok: false, error: "Depreciación calculada es 0" };

    // Resolve accounts:
    // Debit: depreciación gasto (5.1.xx) — or default 5.1.07
    // Credit: depreciación acumulada (1.2.xx) — or default 1.2.09
    const debitAccId  = asset.depreciationAccountId;
    const creditAccId = asset.glAccountId;

    if (!debitAccId || !creditAccId) {
      return { ok: false, error: "El activo no tiene cuentas contables asignadas. Editalo primero." };
    }

    // Generate entry number
    const year = new Date().getFullYear();
    const [{ cnt }] = await db
      .select({ cnt: journalEntries.id })
      .from(journalEntries)
      .where(eq(journalEntries.entityId, entityId))
      .orderBy(desc(journalEntries.createdAt))
      .limit(1)
      .catch(() => [{ cnt: "0" }]);

    const seq = parseInt(String(cnt).slice(-5) || "0", 10) + 1;
    const entryNumber = `DEP-${String(seq).padStart(4, "0")}-${periodMonth}`;
    const entryDate   = new Date(`${periodMonth}-01T12:00:00`);

    const [entry] = await db.insert(journalEntries).values({
      entityId,
      date:        entryDate,
      number:      entryNumber,
      source:      "depreciation",
      description: `Depreciación mensual — ${asset.name} (${asset.code}) · ${periodMonth}`,
      status:      "posted",
      postedAt:    new Date(),
    }).returning();

    // Debit expense, Credit accumulated
    await db.insert(journalLines).values([
      {
        entryId:      entry.id,
        accountId:    debitAccId,
        debit:        String(amount),
        credit:       "0",
        currencyCode: "PYG",
        description:  `Depreciación ${asset.name}`,
      },
      {
        entryId:      entry.id,
        accountId:    creditAccId,
        debit:        "0",
        credit:       String(amount),
        currencyCode: "PYG",
        description:  `Dep. Acum. ${asset.name}`,
      },
    ]);

    // Accumulate depreciation on the asset
    const newDeprValue = Number(asset.depreciatedValue ?? 0) + amount;
    await db.update(fixedAssets)
      .set({ depreciatedValue: String(newDeprValue), updatedAt: new Date() })
      .where(eq(fixedAssets.id, assetId));

    revalidatePath("/activos");
    revalidatePath("/asientos");
    return { ok: true, data: { entryId: entry.id, entryNumber, amount } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al generar asiento" };
  }
}

// ─── Generate bulk depreciation for all active assets ─────────────────────

export async function generateBulkDepreciation(
  entityId: string,
  periodMonth: string
): Promise<ActionResult<{ processed: number; totalAmount: number; errors: string[] }>> {
  if (!entityId) return { ok: false, error: "entityId requerido" };
  try {
    const db = getDb();
    const assets = await db.select().from(fixedAssets).where(eq(fixedAssets.entityId, entityId));

    let processed = 0;
    let totalAmount = 0;
    const errors: string[] = [];

    for (const asset of assets) {
      const res = await generateDepreciationEntry(entityId, asset.id, periodMonth);
      if (res.ok) {
        processed++;
        totalAmount += res.data.amount;
      } else {
        if (!res.error.includes("completamente depreciado")) {
          errors.push(`${asset.code}: ${res.error}`);
        }
      }
    }

    return { ok: true, data: { processed, totalAmount, errors } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al generar depreciaciones" };
  }
}

// ─── Load accounts for selector (asset/depreciation accounts) ─────────────

export async function loadGlAccounts(entityId: string): Promise<ActionResult<Array<{ id: string; code: string; name: string; nature: string }>>> {
  try {
    const db = getDb();
    const { chartOfAccounts } = await import("@/lib/db/schema");
    const rows = await db
      .select({ id: accounts.id, code: accounts.code, name: accounts.name, nature: accounts.nature })
      .from(accounts)
      .innerJoin(chartOfAccounts, eq(accounts.coaId, chartOfAccounts.id))
      .where(and(eq(chartOfAccounts.entityId, entityId), eq(accounts.allowsPosting, true)))
      .orderBy(accounts.code);
    return { ok: true, data: rows.map((r) => ({ id: r.id, code: r.code, name: r.name, nature: r.nature ?? "" })) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar cuentas" };
  }
}
