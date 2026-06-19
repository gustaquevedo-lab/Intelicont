/**
 * Tesaka — Retention Calculator for Paraguay (IVA, IRE, IRP)
 *
 * Implements SET retention rules for electronic invoices.
 * Retenciones de IVA, IRE e IRP según normativa paraguaya.
 */

import { IVA_RATES, IRE_RATES, IRP_RETENTION_RATES } from "./fiscal-py";

// ─── Types ─────────────────────────────────────────────────────────────────

export type RetentionType = "iva" | "ire" | "irp" | "inr";

export type RetentionModality =
  | "iva_partial_50"       // 50% of IVA (standard for professional services)
  | "iva_total_100"        // 100% of IVA (public sector)
  | "iva_none"             // No IVA retention
  | "ire_general"          // 30% of IRE General rate (30% × 30% = 9% of base)
  | "ire_simple"           // 30% of IRE Simple rate (30% × 10% = 3% of base)
  | "ire_none"             // No IRE retention
  | "irp_honorarios"       // IRP 10% on fees
  | "irp_alquileres"       // IRP 10% on rent
  | "irp_dividendos"       // IRP 6% on dividends
  | "irp_intereses"        // IRP 6% on interest
  | "inr_no_resident";     // Non-resident (custom rate)

export interface RetentionRule {
  modality: RetentionModality;
  retentionType: RetentionType;
  label: string;
  description: string;
  appliesTo: ("service" | "goods" | "both")[];
  docTypes: string[];
  rate: number;          // Effective rate (e.g., 0.05 for 5%)
  overBase: "iva" | "total" | "gravado" | "neto";
}

export interface RetentionResult {
  retentionType: RetentionType;
  modality: RetentionModality;
  base: number;
  rate: number;
  amount: number;
  label: string;
}

// ─── Retention Rules (Reglamento SET) ─────────────────────────────────────

export const RETENTION_RULES: RetentionRule[] = [
  // ── IVA Retentions ──
  {
    modality: "iva_partial_50",
    retentionType: "iva",
    label: "Ret. IVA Parcial 50%",
    description: "50% del IVA — Servicios profesionales, comisiones, unipersonales",
    appliesTo: ["service"],
    docTypes: ["invoice", "debit_note"],
    rate: 0.50,
    overBase: "iva",
  },
  {
    modality: "iva_total_100",
    retentionType: "iva",
    label: "Ret. IVA Total 100%",
    description: "100% del IVA — Sector público, entes centralizados",
    appliesTo: ["service", "goods"],
    docTypes: ["invoice", "debit_note"],
    rate: 1.0,
    overBase: "iva",
  },
  // ── IRE Retentions ──
  {
    modality: "ire_general",
    retentionType: "ire",
    label: "Ret. IRE General 30%",
    description: "30% del IRE (tasa 30%) = 9% sobre base — Profesionales, servicios",
    appliesTo: ["service"],
    docTypes: ["invoice", "debit_note"],
    rate: 0.30,
    overBase: "neto",
  },
  {
    modality: "ire_simple",
    retentionType: "ire",
    label: "Ret. IRE Simple 30%",
    description: "30% del IRE (tasa 10%) = 3% sobre base — Régimen Simple",
    appliesTo: ["service"],
    docTypes: ["invoice", "debit_note"],
    rate: 0.30,
    overBase: "neto",
  },
  // ── IRP Retentions ──
  {
    modality: "irp_honorarios",
    retentionType: "irp",
    label: "Ret. IRP Honorarios 10%",
    description: "IRP sobre honorarios profesionales — 10%",
    appliesTo: ["service"],
    docTypes: ["invoice", "debit_note"],
    rate: IRP_RETENTION_RATES.honorarios,
    overBase: "gravado",
  },
  {
    modality: "irp_alquileres",
    retentionType: "irp",
    label: "Ret. IRP Alquileres 10%",
    description: "IRP sobre alquileres — 10%",
    appliesTo: ["service"],
    docTypes: ["invoice", "debit_note"],
    rate: IRP_RETENTION_RATES.alquileres,
    overBase: "gravado",
  },
  {
    modality: "irp_dividendos",
    retentionType: "irp",
    label: "Ret. IRP Dividendos 6%",
    description: "IRP sobre dividendos/utilitiades — 6%",
    appliesTo: ["both"],
    docTypes: ["invoice", "debit_note"],
    rate: IRP_RETENTION_RATES.dividendos,
    overBase: "gravado",
  },
  {
    modality: "irp_intereses",
    retentionType: "irp",
    label: "Ret. IRP Intereses 6%",
    description: "IRP sobre intereses financieros — 6%",
    appliesTo: ["service"],
    docTypes: ["invoice", "debit_note"],
    rate: IRP_RETENTION_RATES.intereses,
    overBase: "gravado",
  },
];

// ─── Determines which retentions apply ────────────────────────────────────

export interface RetentionContext {
  docType: string;
  isService: boolean;           // true for professional services, commissions
  isPublicSector: boolean;      // true for government entities
  partnerRegime?: string;       // "general" | "simple" | "resimple"
  iva10: number;
  iva5: number;
  gravado10: number;
  gravado5: number;
  exento: number;
  total: number;
}

export function determineApplicableRetentions(
  ctx: RetentionContext
): RetentionResult[] {
  const results: RetentionResult[] = [];
  const isCreditNote = ctx.docType === "credit_note";

  // Determine IVA retention modality
  let ivaModality: RetentionModality = "iva_none";
  if (ctx.isPublicSector) {
    ivaModality = "iva_total_100";
  } else if (ctx.isService && !isCreditNote) {
    ivaModality = "iva_partial_50";
  }

  if (ivaModality !== "iva_none") {
    const rule = RETENTION_RULES.find((r) => r.modality === ivaModality)!;
    const totalIva = ctx.iva10 + ctx.iva5;
    const amount = round(totalIva * rule.rate);

    if (amount > 0) {
      results.push({
        retentionType: "iva",
        modality: ivaModality,
        base: totalIva,
        rate: rule.rate,
        amount,
        label: rule.label,
      });
    }
  }

  // Determine IRE retention modality (only for services, not goods)
  let ireModality: RetentionModality = "ire_none";
  if (ctx.isService && !isCreditNote) {
    if (ctx.partnerRegime === "simple") {
      ireModality = "ire_simple";
    } else {
      ireModality = "ire_general";
    }
  }

  if (ireModality !== "ire_none") {
    const rule = RETENTION_RULES.find((r) => r.modality === ireModality)!;
    const base = ctx.gravado10 + ctx.gravado5;
    let iretRate: number;

    if (ireModality === "ire_simple") {
      iretRate = IRE_RATES.simple;
    } else {
      iretRate = IRE_RATES.general;
    }

    const effectiveRate = rule.rate * iretRate;
    const amountIre = round(base * effectiveRate);

    if (amountIre > 0) {
      results.push({
        retentionType: "ire",
        modality: ireModality,
        base,
        rate: effectiveRate,
        amount: amountIre,
        label: rule.label,
      });
    }
  }

  return results;
}

// ─── Certificate Number Generation ────────────────────────────────────────

let certCounter = 0;

export function generateCertificateNumber(
  entityRuc: string,
  year: number,
  month: number
): string {
  certCounter = (certCounter + 1) % 9999;
  const seq = String(certCounter + 1).padStart(4, "0");
  const rucBody = entityRuc.replace(/[^0-9]/g, "").slice(-3);
  return `CR-${rucBody}-${year}${String(month).padStart(2, "0")}-${seq}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ─── Summary ──────────────────────────────────────────────────────────────

export interface RetentionSummary {
  totalIvaRetained: number;
  totalIreRetained: number;
  totalIrpRetained: number;
  totalRetained: number;
  retentions: RetentionResult[];
}

export function summarizeRetentions(
  results: RetentionResult[]
): RetentionSummary {
  let totalIvaRetained = 0;
  let totalIreRetained = 0;
  let totalIrpRetained = 0;

  for (const r of results) {
    if (r.retentionType === "iva") totalIvaRetained += r.amount;
    else if (r.retentionType === "ire") totalIreRetained += r.amount;
    else if (r.retentionType === "irp") totalIrpRetained += r.amount;
  }

  return {
    totalIvaRetained: round(totalIvaRetained),
    totalIreRetained: round(totalIreRetained),
    totalIrpRetained: round(totalIrpRetained),
    totalRetained: round(totalIvaRetained + totalIreRetained + totalIrpRetained),
    retentions: results,
  };
}
