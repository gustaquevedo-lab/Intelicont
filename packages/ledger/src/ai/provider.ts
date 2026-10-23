import type { SifenDocument } from "../sifen";

/** A chart account of the entity, as offered to a provider. */
export type AccountRef = { id: string; code: string; name: string; nature: string; allowsPosting: boolean };

export type SuggestionLine = { accountId: string; accountCode: string; debit: number; credit: number; description: string };

/**
 * A proposed journal entry. Never posted by itself: a human approves it (CLAUDE.md rule 7).
 * Amounts are integers in the currency's minimal unit. A line whose account could not be found
 * has `accountId: ""` and must be completed by the user before approval.
 */
export type Suggestion = {
  lines: SuggestionLine[];
  confidence: number; // 0..1
  rationale: string;
  sources: string[];
  provider: "rules" | "ollama";
  /** Why the local model was not used (Spanish, shown to the user). */
  fallbackReason?: string;
};

/** "received" = purchase side (the entity is the receiver); "issued" = sale side. */
export type Direction = "received" | "issued";

export interface AIProvider {
  suggestEntry(doc: SifenDocument, accounts: AccountRef[], direction?: Direction): Promise<Suggestion>;
}

/** 58000 -> "58.000" (es-PY grouping, deterministic regardless of ICU). */
export const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const DOC_LABELS: Record<SifenDocument["docType"], string> = {
  invoice: "factura",
  credit_note: "nota de crédito",
  debit_note: "nota de débito",
  self_invoice: "autofactura",
  remito: "remito",
};

/** Human-readable evidence taken from the document. */
export function docEvidence(doc: SifenDocument): string[] {
  const out = [`CDC ${doc.cdc}`, `Comprobante ${doc.number} (${DOC_LABELS[doc.docType]})`];
  if (doc.gravado10) out.push(`Gravado 10%: ${fmt(doc.gravado10)}`);
  if (doc.iva10) out.push(`IVA 10%: ${fmt(doc.iva10)}`);
  if (doc.gravado5) out.push(`Gravado 5%: ${fmt(doc.gravado5)}`);
  if (doc.iva5) out.push(`IVA 5%: ${fmt(doc.iva5)}`);
  if (doc.exento) out.push(`Exento: ${fmt(doc.exento)}`);
  out.push(`Total: ${fmt(doc.total)}`);
  return out;
}
