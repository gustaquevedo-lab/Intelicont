/**
 * Withholding engine (FISCAL_PY_RULES.md "Retenciones (motor configurable)").
 *
 * A retention applies ONLY when the supplier has an explicit profile for that tax: we do not know
 * whether the entity is a retention agent, so no profile means no retention. Rates come from the
 * profile (configurable per supplier), never from hardcoded tables.
 *
 * Stored in `partners.retention_profile` (jsonb):
 *   { iva?: { rate: 0.3 | 0.7 | 1, minimum?: number },
 *     ire?: { rate: number, minimum?: number },
 *     irp?: { rate: number, minimum?: number } }
 * `rate` is a fraction (0.3 = 30 %); `minimum` (default 0) is the document total from which the
 * retention applies. IRE/IRP official rates are NOT verified by us: those retentions are flagged
 * `unverified` ("tasa configurada por el usuario").
 *
 * Bases: IVA -> the IVA amount (iva10 + iva5); IRE/IRP -> the amount without IVA (total - IVA).
 */
import { assertMoney, err, ok, type Result } from "@intelicont/core";
import { z } from "zod";

export type RetentionType = "iva" | "ire" | "irp" | "inr";

const minimum = z.number().int().nonnegative().refine(Number.isSafeInteger).optional();
const fraction = z.number().gt(0).max(1);

export const retentionProfileSchema = z.object({
  iva: z.object({ rate: z.union([z.literal(0.3), z.literal(0.7), z.literal(1)]), minimum }).strict().optional(),
  ire: z.object({ rate: fraction, minimum }).strict().optional(),
  irp: z.object({ rate: fraction, minimum }).strict().optional(),
}).strict();

export type RetentionProfile = z.infer<typeof retentionProfileSchema>;

export interface RetentionCalculation {
  type: RetentionType;
  concept: string;
  base: number;
  /** Fraction (0.3 = 30 %). */
  rate: number;
  amount: number;
  certificateRequired: boolean;
  /** The rate was set by the user and is not checked against an official table. */
  unverified: boolean;
}

/** A stored profile (unknown jsonb). null/undefined -> no profile; anything malformed -> Err. */
export function parseRetentionProfile(raw: unknown): Result<RetentionProfile | null, string> {
  if (raw == null) return ok(null);
  const parsed = retentionProfileSchema.safeParse(raw);
  return parsed.success ? ok(parsed.data) : err("Perfil de retención inválido");
}

const CONCEPT: Record<"iva" | "ire" | "irp", string> = {
  iva: "Retención de IVA",
  ire: "Retención de IRE",
  irp: "Retención de IRP",
};

export function calculateRetentions(params: {
  gravado10: number;
  gravado5: number;
  exento: number;
  iva10: number;
  iva5: number;
  total: number;
  profile?: RetentionProfile | null;
}): RetentionCalculation[] {
  const { iva10, iva5, total, profile } = params;
  if (!profile) return [];
  const iva = assertMoney(iva10 + iva5);
  const net = assertMoney(total - iva);
  const out: RetentionCalculation[] = [];
  for (const type of ["iva", "ire", "irp"] as const) {
    const r = profile[type];
    if (!r || total < (r.minimum ?? 0)) continue;
    const base = type === "iva" ? iva : net;
    const amount = assertMoney(Math.round(base * r.rate));
    if (amount <= 0) continue;
    out.push({ type, concept: CONCEPT[type], base, rate: r.rate, amount, certificateRequired: true, unverified: type !== "iva" });
  }
  return out;
}

/** The amount actually owed to the supplier after the retentions. */
export function calculateNetPayable(total: number, retentions: RetentionCalculation[]): number {
  return assertMoney(total - retentions.reduce((s, r) => s + r.amount, 0));
}
