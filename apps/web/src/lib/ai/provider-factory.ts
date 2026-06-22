/**
 * AI Provider Factory — InteliCont
 *
 * Reads provider configuration from global_settings (DB) and returns
 * the appropriate AIProvider instance. Falls back to RulesProvider.
 *
 * Supported providers:
 *   rules   — deterministic rule-based (free, always available)
 *   gemini  — Google Gemini Flash (free tier available)
 *   openai  — OpenAI GPT-4o-mini / GPT-4o (paid)
 *   claude  — Anthropic Claude (paid)
 *   ollama  — Local Ollama server (free if self-hosted)
 */

import type { AIProvider } from "./types";
import { RulesProvider }   from "./rules-provider";

export interface AIConfig {
  provider: string;
  model:    string;
  apiKey:   string;
  baseUrl:  string;
  enabled:  boolean;
}

// ─── Gemini Provider ──────────────────────────────────────────────────────────

class GeminiProvider implements AIProvider {
  readonly name: string;
  readonly model: string;
  private apiKey: string;

  constructor(apiKey: string, model = "gemini-2.0-flash") {
    this.name   = "gemini";
    this.model  = model;
    this.apiKey = apiKey;
  }

  async propose(input: import("./types").AIProviderInput): Promise<import("./types").JournalProposal> {
    const prompt = buildPrompt(input);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    return parseAIResponse(text, "gemini", this.model);
  }
}

// ─── OpenAI Provider ──────────────────────────────────────────────────────────

class OpenAIProvider implements AIProvider {
  readonly name: string;
  readonly model: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, model = "gpt-4o-mini", baseUrl = "https://api.openai.com/v1") {
    this.name    = "openai";
    this.model   = model;
    this.apiKey  = apiKey;
    this.baseUrl = baseUrl;
  }

  async propose(input: import("./types").AIProviderInput): Promise<import("./types").JournalProposal> {
    const prompt = buildPrompt(input);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model:           this.model,
        response_format: { type: "json_object" },
        temperature:     0.1,
        messages: [
          { role: "system", content: "Eres un asistente contable para Paraguay. Respondé solo en JSON." },
          { role: "user",   content: prompt },
        ],
      }),
    });

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content ?? "{}";
    return parseAIResponse(text, "openai", this.model);
  }
}

// ─── Claude Provider ──────────────────────────────────────────────────────────

class ClaudeProvider implements AIProvider {
  readonly name: string;
  readonly model: string;
  private apiKey: string;

  constructor(apiKey: string, model = "claude-haiku-4-5") {
    this.name   = "claude";
    this.model  = model;
    this.apiKey = apiKey;
  }

  async propose(input: import("./types").AIProviderInput): Promise<import("./types").JournalProposal> {
    const prompt = buildPrompt(input);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:  "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      this.model,
        max_tokens: 1024,
        messages:   [{ role: "user", content: prompt }],
        system:     "Sos un asistente contable para Paraguay. Respondé SOLO con JSON válido, sin markdown.",
      }),
    });

    if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
    const data = await res.json();
    const text = data?.content?.[0]?.text ?? "{}";
    return parseAIResponse(text, "claude", this.model);
  }
}

// ─── Ollama Provider ──────────────────────────────────────────────────────────

class OllamaProvider implements AIProvider {
  readonly name: string;
  readonly model: string;
  private baseUrl: string;

  constructor(model = "llama3.2", baseUrl = "http://localhost:11434") {
    this.name    = "ollama";
    this.model   = model;
    this.baseUrl = baseUrl;
  }

  async propose(input: import("./types").AIProviderInput): Promise<import("./types").JournalProposal> {
    const prompt = buildPrompt(input);

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ model: this.model, prompt, stream: false, format: "json" }),
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    const data = await res.json();
    return parseAIResponse(data?.response ?? "{}", "ollama", this.model);
  }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(input: import("./types").AIProviderInput): string {
  const acctList = input.accounts.slice(0, 50).map((a) =>
    `${a.code} - ${a.name} (${a.nature ?? "?"})`
  ).join("\n");

  return `Generá el asiento contable para este comprobante SIFEN. Respondé SOLO con JSON.

COMPROBANTE:
Tipo: ${input.docType}
Número: ${input.docNumber ?? "N/A"}
Emisor: ${input.issuerName} (RUC: ${input.issuerRuc})
${input.receiverRuc ? `Receptor: RUC ${input.receiverRuc}` : ""}
Perspectiva: ${input.perspective === "buyer" ? "COMPRADOR (registrar como compra/gasto)" : "VENDEDOR (registrar como venta/ingreso)"}
Total: ${input.currency} ${input.total.toLocaleString("es-PY")}
IVA 10%: ${input.currency} ${input.iva10.toLocaleString("es-PY")}
IVA 5%: ${input.currency} ${input.iva5.toLocaleString("es-PY")}
Exento: ${input.currency} ${input.ivaExento.toLocaleString("es-PY")}

CUENTAS DISPONIBLES (código - nombre - naturaleza):
${acctList}

Reglas:
- Doble partida: SUM(débitos) DEBE IGUALAR SUM(créditos)
- Para compras: DR Gasto/Compra + DR IVA Crédito Fiscal → CR Proveedores a Pagar
- Para ventas: DR Clientes a Cobrar → CR Ingresos + CR IVA Débito Fiscal
- Usá SOLO cuentas de la lista. Si no encontrás la exacta, elegí la más cercana.

Respondé con este JSON:
{
  "lines": [
    {"accountCode": "1.1.2.1", "accountName": "Clientes", "debit": 0, "credit": 0, "description": "..."}
  ],
  "confidence": 0.90,
  "reasoning": "Explicación breve en español"
}`;
}

// ─── Response parser ──────────────────────────────────────────────────────────

function parseAIResponse(
  text: string,
  provider: string,
  model: string | null
): import("./types").JournalProposal {
  try {
    const json = JSON.parse(text.trim().replace(/^```json\n?|```$/g, ""));
    return {
      lines:      json.lines ?? [],
      confidence: Number(json.confidence) || 0.7,
      reasoning:  json.reasoning ?? "Propuesta generada por IA",
      provider,
      model,
    };
  } catch {
    return {
      lines:      [],
      confidence: 0,
      reasoning:  "Error al parsear respuesta de IA",
      provider,
      model,
    };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createAIProvider(config: AIConfig): AIProvider {
  if (!config.enabled) return new RulesProvider();

  switch (config.provider) {
    case "gemini":
      if (!config.apiKey) return new RulesProvider();
      return new GeminiProvider(config.apiKey, config.model || "gemini-2.0-flash");

    case "openai":
      if (!config.apiKey) return new RulesProvider();
      return new OpenAIProvider(config.apiKey, config.model || "gpt-4o-mini", config.baseUrl || undefined);

    case "claude":
      if (!config.apiKey) return new RulesProvider();
      return new ClaudeProvider(config.apiKey, config.model || "claude-haiku-4-5");

    case "ollama":
      return new OllamaProvider(config.model || "llama3.2", config.baseUrl || "http://localhost:11434");

    default:
      return new RulesProvider();
  }
}
