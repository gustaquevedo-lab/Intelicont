import { z } from "zod";
import type { SifenDocument } from "../sifen";
import { DOC_LABELS, docEvidence, type AccountRef, type AIProvider, type Direction, type Suggestion } from "./provider";

/** A user-facing (Spanish) reason why the local model's answer was not used. */
export class OllamaRejected extends Error {}

const answerSchema = z.object({
  lines: z.array(z.object({
    accountCode: z.string(),
    debit: z.number(),
    credit: z.number(),
    description: z.string().default(""),
  })),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
});

/**
 * Chat messages for the local model. Only business facts: the receiver's name/RUC and any contact
 * data are never included (they may belong to a natural person); the issuer is a business.
 */
export function buildOllamaMessages(doc: SifenDocument, accounts: AccountRef[], direction: Direction = "received") {
  const postable = accounts.filter((a) => a.allowsPosting);
  const summary = [
    `Tipo: ${DOC_LABELS[doc.docType]} ${direction === "issued" ? "emitida (venta)" : "recibida (compra)"}`,
    `Emisor: ${direction === "issued" ? "la propia empresa" : doc.issuer.name}`,
    `Condición: ${doc.condition === "cash" ? "contado" : "crédito"}; moneda ${doc.currency || "PYG"}`,
    `Gravado 10% (IVA incluido): ${doc.gravado10}; IVA 10%: ${doc.iva10}`,
    `Gravado 5% (IVA incluido): ${doc.gravado5}; IVA 5%: ${doc.iva5}`,
    `Exento: ${doc.exento}; Total: ${doc.total}`,
    "Ítems:",
    ...doc.lines.map((l) => `- ${l.description} | IVA ${l.ivaRate}% | ${l.amount}`),
  ].join("\n");
  const chart = postable.map((a) => `${a.code} — ${a.name} — ${a.nature}`).join("\n");
  return [
    {
      role: "system",
      content:
        "Sos un contador paraguayo. Proponé el asiento de partida doble para el comprobante. " +
        "Usá SOLO códigos de la lista de cuentas imputables. Montos enteros en guaraníes, sin decimales; " +
        "la base neta es gravado menos IVA. La suma del debe debe ser igual a la del haber. " +
        'Respondé SOLO JSON: {"lines":[{"accountCode":"...","debit":0,"credit":0,"description":"..."}],"confidence":0.0,"rationale":"..."}',
    },
    { role: "user", content: `Comprobante:\n${summary}\n\nCuentas imputables (código — nombre — naturaleza):\n${chart}` },
  ];
}

/** Local LLM through Ollama's chat API. Throws on any failure; `suggestWithFallback` handles it. */
export class OllamaProvider implements AIProvider {
  private readonly fetchImpl: typeof fetch;
  constructor(private readonly opts: { url: string; model: string; timeoutMs?: number; fetchImpl?: typeof fetch }) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async suggestEntry(doc: SifenDocument, accounts: AccountRef[], direction: Direction = "received"): Promise<Suggestion> {
    const res = await this.fetchImpl(`${this.opts.url.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.opts.model,
        stream: false,
        format: "json",
        options: { temperature: 0 },
        messages: buildOllamaMessages(doc, accounts, direction),
      }),
      signal: AbortSignal.timeout(this.opts.timeoutMs ?? 20_000),
    });
    if (!res.ok) throw new OllamaRejected(`IA local no disponible: HTTP ${res.status}`);
    const body = (await res.json()) as { message?: { content?: unknown } };

    let raw: unknown;
    try {
      raw = JSON.parse(String(body?.message?.content ?? ""));
    } catch {
      throw new OllamaRejected("IA local descartada: la respuesta no es JSON válido");
    }
    const parsed = answerSchema.safeParse(raw);
    if (!parsed.success) throw new OllamaRejected("IA local descartada: la respuesta no tiene el formato esperado");
    const answer = parsed.data;

    const byCode = new Map(accounts.filter((a) => a.allowsPosting).map((a) => [a.code, a]));
    if (answer.lines.length < 2) throw new OllamaRejected("IA local descartada: el asiento necesita al menos dos líneas");
    let debit = 0;
    let credit = 0;
    const lines = answer.lines.map((l) => {
      const account = byCode.get(l.accountCode.trim());
      if (!account) throw new OllamaRejected(`IA local descartada: cuenta desconocida o no imputable ${l.accountCode}`);
      for (const v of [l.debit, l.credit]) {
        if (!Number.isSafeInteger(v) || v < 0) throw new OllamaRejected("IA local descartada: importe inválido (debe ser entero no negativo)");
      }
      if ((l.debit > 0) === (l.credit > 0)) throw new OllamaRejected("IA local descartada: cada línea debe tener debe o haber");
      debit += l.debit;
      credit += l.credit;
      return { accountId: account.id, accountCode: account.code, debit: l.debit, credit: l.credit, description: l.description };
    });
    if (debit !== credit) throw new OllamaRejected("IA local descartada: asiento desbalanceado");

    return {
      lines,
      confidence: answer.confidence,
      rationale: answer.rationale,
      sources: [...docEvidence(doc), `Modelo local: ${this.opts.model}`],
      provider: "ollama",
    };
  }
}

function reasonOf(e: unknown): string {
  if (e instanceof OllamaRejected) return e.message;
  if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) return "IA local no disponible: tiempo agotado";
  return "IA local no disponible: error de red";
}

/**
 * Rules first; the local model only when the rules are unsure (confidence < 0.8). Any model
 * failure returns the rules suggestion with `fallbackReason`: this never throws because of Ollama.
 * The caller must NOT hold a DB transaction while awaiting this.
 */
export async function suggestWithFallback(
  doc: SifenDocument,
  accounts: AccountRef[],
  opts: { rules: AIProvider; ollama?: AIProvider; direction?: Direction },
): Promise<Suggestion> {
  const rules = await opts.rules.suggestEntry(doc, accounts, opts.direction);
  if (rules.confidence >= 0.8 || !opts.ollama) return rules;
  try {
    return await opts.ollama.suggestEntry(doc, accounts, opts.direction);
  } catch (e) {
    const fallbackReason = reasonOf(e);
    return { ...rules, rationale: `${rules.rationale} (${fallbackReason})`, fallbackReason };
  }
}
