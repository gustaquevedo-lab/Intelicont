/**
 * Server-side AI provider selection for journal suggestions (spec D5). The core lives in
 * `@intelicont/ledger/ai`; this module only reads the environment:
 * - `AI_PROVIDER=rules` disables the local model entirely;
 * - otherwise rules first and Ollama (`OLLAMA_URL`, `OLLAMA_MODEL`) only when the rules are unsure.
 * Callers must not hold a DB transaction while awaiting `suggestForDocument`.
 */
import type { SifenDocument } from "@intelicont/ledger/sifen";
import {
  OllamaProvider,
  RuleBasedProvider,
  suggestWithFallback,
  type AccountRef,
  type AIProvider,
  type Direction,
  type Suggestion,
} from "@intelicont/ledger/ai";

export * from "@intelicont/ledger/ai";

export const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
export const DEFAULT_OLLAMA_MODEL = "qwen2.5:7b";

let testProvider: AIProvider | null = null;

/** Test-only override (not reachable from HTTP). Throws outside NODE_ENV=test. */
export function setAiProviderForTests(provider: AIProvider | null): void {
  if (process.env.NODE_ENV !== "test") throw new Error("setAiProviderForTests is only available in tests");
  testProvider = provider;
}

export function suggestForDocument(doc: SifenDocument, accounts: AccountRef[], direction: Direction): Promise<Suggestion> {
  if (testProvider) return testProvider.suggestEntry(doc, accounts, direction);
  const rules = new RuleBasedProvider();
  const ollama = process.env.AI_PROVIDER === "rules"
    ? undefined
    : new OllamaProvider({
        url: process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL,
        model: process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
      });
  return suggestWithFallback(doc, accounts, { rules, ollama, direction });
}
