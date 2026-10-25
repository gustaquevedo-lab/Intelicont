/**
 * Fixed Assets Engine (Bienes de Uso) — Paraguay RG 77/2020 (IRE) & Ley 6380/19
 *
 * Implements linear depreciation, revaluation with BCP indices,
 * schedule generation, and double-entry GL journal entry creation.
 */

export type FixedAssetCategory =
  | "furniture"
  | "vehicles"
  | "machinery"
  | "computers"
  | "buildings"
  | "tools"
  | "installations"
  | "other";

/**
 * Tabla de vida útil y alícuotas anuales oficiales conforme al Art. 63 del Decreto N° 3182/2019
 * y la Resolución General DNIT (ex SET) N° 77/2020.
 */
export const CATEGORY_USEFUL_LIFE_MONTHS: Record<FixedAssetCategory, { months: number; annualRate: number; name: string }> = {
  buildings: { months: 480, annualRate: 0.025, name: "Edificaciones e Inmuebles (40 años - 2.5%)" },
  furniture: { months: 120, annualRate: 0.10, name: "Muebles y Útiles (10 años - 10%)" },
  machinery: { months: 120, annualRate: 0.10, name: "Maquinarias y Equipos (10 años - 10%)" },
  installations: { months: 120, annualRate: 0.10, name: "Instalaciones (10 años - 10%)" },
  vehicles: { months: 60, annualRate: 0.20, name: "Vehículos y Rodados (5 años - 20%)" },
  tools: { months: 60, annualRate: 0.20, name: "Herramientas de Trabajo (5 años - 20%)" },
  computers: { months: 48, annualRate: 0.25, name: "Equipos de Computación (4 años - 25%)" },
  other: { months: 60, annualRate: 0.20, name: "Otros Bienes de Uso (5 años - 20%)" },
};

export interface AssetCalculationInput {
  initialCost: number;
  residualValue?: number;
  purchaseDate: string; // YYYY-MM-DD
  usefulLifeMonths: number;
  asOfDate?: string; // YYYY-MM-DD (defaults to today)
  revaluationCoefficient?: number; // e.g. 1.035 from BCP (defaults to 1.0)
}

export interface AssetCalculationResult {
  revaluedCost: number;
  depreciableBase: number;
  monthlyDepreciation: number;
  annualDepreciation: number;
  monthsElapsed: number;
  effectiveMonths: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  isFullyDepreciated: boolean;
}

/**
 * Calculates depreciation and net fiscal value according to RG 77/2020.
 */
export function calculateAssetDepreciation(input: AssetCalculationInput): AssetCalculationResult {
  const coef = input.revaluationCoefficient && input.revaluationCoefficient > 0 ? input.revaluationCoefficient : 1.0;
  const revaluedCost = Math.round(input.initialCost * coef);
  const residual = Math.max(0, input.residualValue ?? 0);
  const depreciableBase = Math.max(0, revaluedCost - residual);

  const usefulMonths = Math.max(1, input.usefulLifeMonths);
  const monthlyDepreciation = Math.floor(depreciableBase / usefulMonths);
  const annualDepreciation = monthlyDepreciation * 12;

  const [pYear, pMonth] = input.purchaseDate.split("-").map(Number);
  let cYear: number;
  let cMonth: number;
  if (input.asOfDate) {
    [cYear, cMonth] = input.asOfDate.split("-").map(Number);
  } else {
    const now = new Date();
    cYear = now.getFullYear();
    cMonth = now.getMonth() + 1;
  }

  let monthsElapsed = (cYear - pYear) * 12 + (cMonth - pMonth);
  if (monthsElapsed < 0) monthsElapsed = 0;

  const effectiveMonths = Math.min(monthsElapsed, usefulMonths);
  const accumulatedDepreciation = Math.min(depreciableBase, monthlyDepreciation * effectiveMonths);
  const netBookValue = Math.max(residual, revaluedCost - accumulatedDepreciation);
  const isFullyDepreciated = effectiveMonths >= usefulMonths;

  return {
    revaluedCost,
    depreciableBase,
    monthlyDepreciation,
    annualDepreciation,
    monthsElapsed,
    effectiveMonths,
    accumulatedDepreciation,
    netBookValue,
    isFullyDepreciated,
  };
}

export interface DepreciationEntryLine {
  accountId: string;
  debit: number;
  credit: number;
  description: string;
}

/**
 * Generates balanced double-entry lines for a depreciation run.
 * Debe: Cuenta de Gasto por Depreciación (clase 5)
 * Haber: Cuenta de Depreciación Acumulada (cuenta regularizadora de activo, clase 1)
 */
export function generateDepreciationEntryLines(params: {
  assetName: string;
  assetCode: string;
  amount: number;
  depreciationAccountId: string;
  accumulatedAccountId: string;
  periodLabel: string;
}): DepreciationEntryLine[] {
  if (params.amount <= 0) return [];

  return [
    {
      accountId: params.depreciationAccountId,
      debit: params.amount,
      credit: 0,
      description: `Depreciación ${params.periodLabel} - ${params.assetCode} ${params.assetName}`,
    },
    {
      accountId: params.accumulatedAccountId,
      debit: 0,
      credit: params.amount,
      description: `Depreciación acumulada ${params.periodLabel} - ${params.assetCode} ${params.assetName}`,
    },
  ];
}
