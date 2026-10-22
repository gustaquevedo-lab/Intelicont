/**
 * Retenciones Engine — Paraguay Tax Withholding Rules
 *
 * Automatically calculates IVA, IRE, IRP, INR retentions
 * when registering purchases based on partner profile and amounts.
 */

export type RetentionType = "iva" | "ire" | "irp" | "inr";

export interface RetentionRule {
  type: RetentionType;
  concept: string;
  rate: number;
  minimumAmount: number;
  appliesTo: {
    regimes?: string[];
    ivaConditions?: string[];
    partnerKinds?: string[];
  };
}

export interface RetentionCalculation {
  type: RetentionType;
  concept: string;
  base: number;
  rate: number;
  amount: number;
  certificateRequired: boolean;
}

// ─── Rules Engine ─────────────────────────────────────────────────────────

const RETENTION_RULES: RetentionRule[] = [
  // IVA
  {
    type: "iva",
    concept: "IVA — Servicios profesionales",
    rate: 0.30,
    minimumAmount: 50000,
    appliesTo: { ivaConditions: ["responsable"] },
  },
  {
    type: "iva",
    concept: "IVA — Alquileres",
    rate: 0.30,
    minimumAmount: 50000,
    appliesTo: { ivaConditions: ["responsable"] },
  },
  {
    type: "iva",
    concept: "IVA — Servicios en general",
    rate: 0.30,
    minimumAmount: 100000,
    appliesTo: { ivaConditions: ["responsable"] },
  },

  // IRE
  {
    type: "ire",
    concept: "IRE — Servicios profesionales",
    rate: 0.02,
    minimumAmount: 200000,
    appliesTo: { regimes: ["simple", "resimple"] },
  },
  {
    type: "ire",
    concept: "IRE — Alquileres",
    rate: 0.02,
    minimumAmount: 200000,
    appliesTo: { regimes: ["simple", "resimple"] },
  },
  {
    type: "ire",
    concept: "IRE — Honorarios",
    rate: 0.005,
    minimumAmount: 100000,
    appliesTo: {},
  },

  // IRP
  {
    type: "irp",
    concept: "IRP — Honorarios profesionales",
    rate: 0.10,
    minimumAmount: 200000,
    appliesTo: {},
  },
  {
    type: "irp",
    concept: "IRP — Alquileres",
    rate: 0.10,
    minimumAmount: 100000,
    appliesTo: {},
  },
  {
    type: "irp",
    concept: "IRP — Servicios en general",
    rate: 0.06,
    minimumAmount: 200000,
    appliesTo: {},
  },
  {
    type: "irp",
    concept: "IRP — Intereses",
    rate: 0.06,
    minimumAmount: 50000,
    appliesTo: {},
  },
  {
    type: "irp",
    concept: "IRP — Dividendos y utilidades",
    rate: 0.06,
    minimumAmount: 100000,
    appliesTo: {},
  },
];

// ─── Partner Profiles ─────────────────────────────────────────────────────

interface PartnerProfile {
  regime?: string;
  ivaCondition?: string;
  kind?: string;
  retentionConfig?: {
    iva?: boolean;
    ire?: boolean;
    irp?: boolean;
    rateIre?: number;
  };
}

// ─── Calculation ──────────────────────────────────────────────────────────

export function calculateRetentions(params: {
  gravado10: number;
  gravado5: number;
  exento: number;
  iva10: number;
  iva5: number;
  total: number;
  concept: string;
  partner?: PartnerProfile;
}): RetentionCalculation[] {
  const retentions: RetentionCalculation[] = [];
  const { gravado10, gravado5, exento, iva10, iva5, total, concept, partner } = params;

  // Base for calculations (gravado + IVA = total for most cases)
  const baseIVA = gravado10 + gravado5;
  const baseGravada = total; // Most retentions apply over total

  for (const rule of RETENTION_RULES) {
    // Check if rule applies to this partner
    if (partner) {
      if (rule.type === "iva" && partner.retentionConfig?.iva === false) continue;
      if (rule.type === "ire" && partner.retentionConfig?.ire === false) continue;
      if (rule.appliesTo.regimes && partner.regime && !rule.appliesTo.regimes.includes(partner.regime)) continue;
      if (rule.appliesTo.partnerKinds && partner.kind && !rule.appliesTo.partnerKinds.includes(partner.kind)) continue;
    }

    // Minimum amount check
    if (baseGravada < rule.minimumAmount) continue;

    // Calculate based on type
    let base: number;
    switch (rule.type) {
      case "iva":
        base = baseIVA > 0 ? baseIVA : baseGravada;
        break;
      case "ire":
        base = partner?.retentionConfig?.rateIre
          ? baseGravada * (1 - partner.retentionConfig.rateIre)
          : baseGravada;
        break;
      case "irp":
      case "inr":
      default:
        base = baseGravada;
        break;
    }

    const amount = Math.round(base * rule.rate);

    if (amount > 0) {
      retentions.push({
        type: rule.type,
        concept: rule.concept,
        base,
        rate: rule.rate,
        amount,
        certificateRequired: rule.type !== "iva",
      });
    }
  }

  return retentions;
}

/**
 * Returns the net payable amount after retentions.
 */
export function calculateNetPayable(total: number, retentions: RetentionCalculation[]): number {
  const totalRetentions = retentions.reduce((s, r) => s + r.amount, 0);
  return total - totalRetentions;
}

/**
 * Returns suggested journal entry lines for retentions.
 */
export function getRetentionJournalLines(
  retentions: RetentionCalculation[],
  supplierAccountCode: string,
  bankAccountCode: string
): Array<{ accountCode: string; accountName: string; debit: string; credit: string; description: string }> {
  const lines: Array<{ accountCode: string; accountName: string; debit: string; credit: string; description: string }> = [];

  for (const ret of retentions) {
    lines.push({
      accountCode: "2.1.05",
      accountName: "Retenciones a Pagar",
      debit: "",
      credit: ret.amount.toFixed(0),
      description: `Retención ${ret.type.toUpperCase()} — ${ret.concept}`,
    });
  }

  return lines;
}
