/**
 * AI Provider abstraction for InteliCont.
 *
 * Supports multiple backends: rule-based (free), Anthropic Claude (paid),
 * and opencode (local). The provider is selected via AI_PROVIDER env var.
 */

import type { SifenInvoice } from "./sifen-parser";

export type AIProviderType = "rule-based" | "anthropic" | "opencode" | "custom";

export interface JournalSuggestion {
  lines: Array<{
    accountCode: string;
    accountName: string;
    debit: string;
    credit: string;
    description: string;
  }>;
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  confidence: number;
  rationale: string;
  provider: AIProviderType;
}

export interface AIProvider {
  name: AIProviderType;
  suggestJournalEntry: (invoice: SifenInvoice) => Promise<JournalSuggestion>;
  isAvailable: () => boolean;
}

// ─── Rule-based provider (free, always available) ──────────────────────────

import { suggestJournalEntry as ruleBasedSuggest } from "./sifen-parser";

const ruleBasedProvider: AIProvider = {
  name: "rule-based",
  isAvailable: () => true,
  suggestJournalEntry: async (invoice) => {
    const result = ruleBasedSuggest(invoice);
    return {
      ...result,
      rationale: result.rationale || "Generado por reglas contables PY.",
      provider: "rule-based",
    };
  },
};

// ─── Provider registry ─────────────────────────────────────────────────────

const providers: Map<AIProviderType, AIProvider> = new Map();
providers.set("rule-based", ruleBasedProvider);

export function registerProvider(provider: AIProvider): void {
  providers.set(provider.name, provider);
}

export function getProvider(type?: AIProviderType): AIProvider {
  const selected = type || (process.env.NEXT_PUBLIC_AI_PROVIDER as AIProviderType) || "rule-based";
  const provider = providers.get(selected);
  if (provider && provider.isAvailable()) {
    return provider;
  }
  // Fallback to rule-based
  console.warn(`[AI] Provider "${selected}" not available, falling back to rule-based`);
  return ruleBasedProvider;
}

export async function getJournalSuggestion(invoice: SifenInvoice): Promise<JournalSuggestion> {
  const provider = getProvider();
  return provider.suggestJournalEntry(invoice);
}

export function listProviders(): { name: AIProviderType; available: boolean }[] {
  return Array.from(providers.entries()).map(([name, p]) => ({
    name,
    available: p.isAvailable(),
  }));
}

// ─── Anthropic provider stub (uncomment when API key is available) ──────────
//
// import Anthropic from "@anthropic-ai/sdk";
//
// const anthropicProvider: AIProvider = {
//   name: "anthropic",
//   isAvailable: () => !!process.env.ANTHROPIC_API_KEY,
//   suggestJournalEntry: async (invoice) => {
//     const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
//     const msg = await anthropic.messages.create({
//       model: "claude-sonnet-4-20250514",
//       max_tokens: 1024,
//       messages: [{
//         role: "user",
//         content: `Genera asiento contable paraguayo para: ${JSON.stringify(invoice)}`
//       }],
//     });
//     return parseAnthropicResponse(msg);
//   },
// };
// registerProvider(anthropicProvider);
