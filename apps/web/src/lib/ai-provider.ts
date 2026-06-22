/**
 * AI Provider abstraction for InteliCont.
 *
 * Supports multiple backends: rule-based (free), Anthropic Claude (paid),
 * and Google Gemini (default/free tier).
 */

import type { SifenInvoice } from "./sifen-parser";
import { suggestJournalEntry as ruleBasedSuggest } from "./sifen-parser";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProviderType = "rule-based" | "anthropic" | "gemini" | "custom";

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
  suggestJournalEntry: (invoice: SifenInvoice, apiKey?: string) => Promise<JournalSuggestion>;
  isAvailable: (apiKey?: string) => boolean;
}

// ─── Rule-based provider ───────────────────────────────────────────────────

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

// ─── Anthropic Claude Provider ─────────────────────────────────────────────

function parseAnthropicResponse(response: Anthropic.Messages.Message, invoice: SifenInvoice): JournalSuggestion {
  try {
    const textContent = response.content[0].type === "text" ? response.content[0].text : "";
    return parseJsonSuggestion(textContent, invoice, "anthropic");
  } catch (error) {
    console.error("[AI] Error parsing Anthropic response, falling back to rule-based:", error);
    return fallbackSuggestion(invoice, "anthropic");
  }
}

const anthropicProvider: AIProvider = {
  name: "anthropic",
  isAvailable: (apiKey) => !!apiKey || !!process.env.ANTHROPIC_API_KEY,
  suggestJournalEntry: async (invoice, apiKey) => {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("Missing Anthropic API Key for this tenant.");
    }
    const anthropic = new Anthropic({ apiKey: key });
    
    const msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      system: getSystemPrompt(),
      messages: [{
        role: "user",
        content: `Genera el asiento contable paraguayo en formato JSON para el siguiente comprobante SIFEN: ${JSON.stringify(invoice)}`
      }],
    });
    
    return parseAnthropicResponse(msg, invoice);
  },
};

// ─── Google Gemini Provider ────────────────────────────────────────────────

const geminiProvider: AIProvider = {
  name: "gemini",
  isAvailable: (apiKey) => !!apiKey || !!process.env.GEMINI_API_KEY || !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  suggestJournalEntry: async (invoice, apiKey) => {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    // If no key is set anywhere, we treat Gemini Free Tier as running on a fallback key or mock it
    if (!key) {
      console.warn("[AI] Gemini API Key not configured. Using rule-based fallback for free tier emulation.");
      return {
        ...ruleBasedSuggest(invoice),
        rationale: "Generado por Gemini Free Tier (Reglas locales de contingencia).",
        provider: "gemini",
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: getSystemPrompt(),
      });

      const response = await model.generateContent(
        `Genera el asiento contable paraguayo en formato JSON para el siguiente comprobante SIFEN: ${JSON.stringify(invoice)}`
      );

      const text = response.response.text();
      return parseJsonSuggestion(text, invoice, "gemini");
    } catch (error) {
      console.error("[AI] Error calling Gemini API, falling back to rule-based:", error);
      return fallbackSuggestion(invoice, "gemini");
    }
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function getSystemPrompt(): string {
  return `Eres un experto contador paraguayo para el software contable InteliCont.
Tu tarea es analizar un comprobante electrónico (XML SIFEN parseado) y sugerir un asiento de doble partida completamente balanceado de acuerdo con las normativas de la DNIT y el plan de cuentas de Paraguay.

Reglas del Plan de Cuentas Referencial:
- 1.1.06: IVA Crédito Fiscal (para compras grabadas 10%)
- 1.1.07: IVA Crédito Fiscal 5% (para compras grabadas 5%)
- 1.2.01: Mercaderías (para inventarios/activos)
- 2.1.01: Cuentas a Pagar Proveedores (para pasivos comerciales)
- 1.1.02: Banco (para pagos al contado)
- 1.1.05: Cuentas a Cobrar Clientes (para ventas a crédito)
- 4.1.01: Ventas de Mercaderías (para ingresos gravados)
- 2.1.02: IVA Débito Fiscal (para ventas 10%)
- 2.1.03: IVA Débito Fiscal 5% (para ventas 5%)
- 5.1.10: Otros Gastos (para compras exentas o gastos directos)

Debes retornar obligatoriamente un formato JSON válido que siga este esquema exacto:
{
  "lines": [
    { "accountCode": "1.2.01", "accountName": "Mercaderías", "debit": "1000000", "credit": "", "description": "Detalle del asiento" }
  ],
  "confidence": 0.95,
  "rationale": "Breve explicación en español de por qué se imputaron estas cuentas."
}
Asegúrate de que la suma de debito sea igual a la de credito.`;
}

function parseJsonSuggestion(text: string, invoice: SifenInvoice, provider: AIProviderType): JournalSuggestion {
  const cleanJsonText = text.substring(
    text.indexOf("{"),
    text.lastIndexOf("}") + 1
  );
  const parsed = JSON.parse(cleanJsonText);
  
  const lines = parsed.lines.map((line: any) => ({
    accountCode: line.accountCode,
    accountName: line.accountName,
    debit: line.debit?.toString() || "",
    credit: line.credit?.toString() || "",
    description: line.description || `Mapeado por IA para ${invoice.numero}`,
  }));

  const totalDebit = lines.reduce((sum: number, l: any) => sum + parseFloat(l.debit || "0"), 0);
  const totalCredit = lines.reduce((sum: number, l: any) => sum + parseFloat(l.credit || "0"), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return {
    lines,
    totalDebit,
    totalCredit,
    balanced,
    confidence: parsed.confidence || (balanced ? 0.95 : 0.7),
    rationale: parsed.rationale || "Generado exitosamente por la Inteligencia Artificial.",
    provider,
  };
}

function fallbackSuggestion(invoice: SifenInvoice, provider: AIProviderType): JournalSuggestion {
  const ruleBasedResult = ruleBasedSuggest(invoice);
  return {
    ...ruleBasedResult,
    rationale: "Fallo el servicio de IA. Generado por reglas contables de contingencia local.",
    provider,
  };
}

// ─── Provider Registry & API Interface ─────────────────────────────────────

const providers: Map<AIProviderType, AIProvider> = new Map();
providers.set("rule-based", ruleBasedProvider);
providers.set("anthropic", anthropicProvider);
providers.set("gemini", geminiProvider);

export function registerProvider(provider: AIProvider): void {
  providers.set(provider.name, provider);
}

export function getProvider(type?: AIProviderType): AIProvider {
  const selected = type || "gemini"; // Default to Gemini
  const provider = providers.get(selected);
  if (provider && provider.isAvailable()) {
    return provider;
  }
  
  // Fallbacks
  if (selected === "gemini") {
    return geminiProvider;
  }
  
  console.warn(`[AI] Provider "${selected}" not available, falling back to Gemini`);
  return geminiProvider;
}

export async function getJournalSuggestion(
  invoice: SifenInvoice,
  entityConfig?: { aiProvider?: string; aiApiKey?: string | null }
): Promise<JournalSuggestion> {
  const providerType = (entityConfig?.aiProvider as AIProviderType) || "gemini";
  const provider = getProvider(providerType);
  return provider.suggestJournalEntry(invoice, entityConfig?.aiApiKey || undefined);
}

export function listProviders(): { name: AIProviderType; available: boolean }[] {
  return Array.from(providers.entries()).map(([name, p]) => ({
    name,
    available: p.isAvailable(),
  }));
}
