// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseSifenDE, type SifenDocument } from "@intelicont/ledger/sifen";
import {
  OllamaProvider,
  RuleBasedProvider,
  suggestWithFallback,
  type AccountRef,
  type AIProvider,
  type Suggestion,
} from "@intelicont/ledger/ai";

const FIXTURE = readFileSync(path.resolve(__dirname, "../__fixtures__/sifen/fac_024-004-0049994.xml"), "utf-8");
const parsed = parseSifenDE(FIXTURE);
if (!parsed.ok) throw new Error(parsed.error);
const DOC: SifenDocument = parsed.value;

const acc = (code: string, name: string, nature: string, allowsPosting = true): AccountRef => ({
  id: `id-${code}`, code, name, nature, allowsPosting,
});
const ACCOUNTS: AccountRef[] = [
  acc("1.1.01", "Caja", "asset"),
  acc("1.1.05", "Cuentas a Cobrar Clientes", "asset"),
  acc("1.1.06", "IVA Crédito Fiscal", "asset"),
  acc("1.2", "Activo No Corriente", "asset", false),
  acc("1.2.01", "Mercaderías", "asset"),
  acc("2.1.01", "Cuentas a Pagar Proveedores", "liability"),
  acc("2.1.02", "IVA Débito Fiscal", "liability"),
  acc("4.1.01", "Ventas de Mercaderías", "income"),
  acc("5.1.10", "Otros Gastos", "expense"),
];

const lowConfidenceRules: AIProvider = {
  suggestEntry: async () => ({
    lines: [
      { accountId: "id-1.2.01", accountCode: "1.2.01", debit: 58000, credit: 0, description: "x" },
      { accountId: "id-1.1.01", accountCode: "1.1.01", debit: 0, credit: 58000, description: "y" },
    ],
    confidence: 0.5,
    rationale: "Reglas con dudas",
    sources: [],
    provider: "rules",
  }),
};

const chatResponse = (content: unknown, status = 200) =>
  new Response(JSON.stringify({ message: { role: "assistant", content: typeof content === "string" ? content : JSON.stringify(content) } }), {
    status,
    headers: { "content-type": "application/json" },
  });

const GOOD = {
  lines: [
    { accountCode: "5.1.10", debit: 52727, credit: 0, description: "Gasto de comida" },
    { accountCode: "1.1.06", debit: 5273, credit: 0, description: "IVA 10%" },
    { accountCode: "1.1.01", debit: 0, credit: 58000, description: "Pago contado" },
  ],
  confidence: 0.82,
  rationale: "Consumo en restaurante pagado al contado",
};

const ollamaWith = (fetchImpl: typeof fetch, timeoutMs = 1000) =>
  new OllamaProvider({ url: "http://ollama.test", model: "qwen2.5:3b", timeoutMs, fetchImpl });

describe("AI suggestions", () => {
  it("rules with confidence >= 0.8 do not call Ollama", async () => {
    const fetchImpl = vi.fn();
    const s = await suggestWithFallback(DOC, ACCOUNTS, { rules: new RuleBasedProvider(), ollama: ollamaWith(fetchImpl as unknown as typeof fetch) });
    expect(s.provider).toBe("rules");
    expect(s.confidence).toBeGreaterThanOrEqual(0.8);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("low confidence calls Ollama chat with format json and validates with zod", async () => {
    const fetchImpl = vi.fn(async () => chatResponse(GOOD));
    const s = await suggestWithFallback(DOC, ACCOUNTS, { rules: lowConfidenceRules, ollama: ollamaWith(fetchImpl as unknown as typeof fetch) });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://ollama.test/api/chat");
    const body = JSON.parse(String(init.body));
    expect(body).toMatchObject({ model: "qwen2.5:3b", stream: false, format: "json" });
    expect(body.messages.length).toBeGreaterThan(0);
    expect(s.provider).toBe("ollama");
    expect(s.fallbackReason).toBeUndefined();
    expect(s.confidence).toBe(0.82);
    expect(s.lines).toEqual([
      { accountId: "id-5.1.10", accountCode: "5.1.10", debit: 52727, credit: 0, description: "Gasto de comida" },
      { accountId: "id-1.1.06", accountCode: "1.1.06", debit: 5273, credit: 0, description: "IVA 10%" },
      { accountId: "id-1.1.01", accountCode: "1.1.01", debit: 0, credit: 58000, description: "Pago contado" },
    ]);

    // A response that does not match the schema is rejected (zod), and rules are used.
    const bad = vi.fn(async () => chatResponse({ lines: [{ accountCode: 1, debit: "x" }], confidence: "high" }));
    const s2 = await suggestWithFallback(DOC, ACCOUNTS, { rules: lowConfidenceRules, ollama: ollamaWith(bad as unknown as typeof fetch) });
    expect(s2.provider).toBe("rules");
    expect(s2.fallbackReason).toMatch(/IA local descartada/);
  });

  it("Ollama timeout falls back to rules and says so", async () => {
    const hanging = (_url: string, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () => reject(init.signal!.reason));
      });
    const s = await suggestWithFallback(DOC, ACCOUNTS, { rules: lowConfidenceRules, ollama: ollamaWith(hanging as typeof fetch, 30) });
    expect(s.provider).toBe("rules");
    expect(s.fallbackReason).toBe("IA local no disponible: tiempo agotado");
    expect(s.rationale).toContain("tiempo agotado");
  });

  it("Ollama network error falls back to rules", async () => {
    const down = vi.fn(async () => { throw new TypeError("fetch failed"); });
    const s = await suggestWithFallback(DOC, ACCOUNTS, { rules: lowConfidenceRules, ollama: ollamaWith(down as unknown as typeof fetch) });
    expect(s.provider).toBe("rules");
    expect(s.fallbackReason).toBe("IA local no disponible: error de red");
  });

  it("Ollama invalid JSON falls back to rules", async () => {
    const garbage = vi.fn(async () => chatResponse("esto no es json {"));
    const s = await suggestWithFallback(DOC, ACCOUNTS, { rules: lowConfidenceRules, ollama: ollamaWith(garbage as unknown as typeof fetch) });
    expect(s.provider).toBe("rules");
    expect(s.fallbackReason).toMatch(/JSON/);
  });

  it("Ollama unbalanced suggestion is discarded and rules are used", async () => {
    const unbalanced = { ...GOOD, lines: [GOOD.lines[0], { ...GOOD.lines[2], credit: 50000 }] };
    const f = vi.fn(async () => chatResponse(unbalanced));
    const s = await suggestWithFallback(DOC, ACCOUNTS, { rules: lowConfidenceRules, ollama: ollamaWith(f as unknown as typeof fetch) });
    expect(s.provider).toBe("rules");
    expect(s.fallbackReason).toMatch(/desbalanceado/);
    // Non-integer amounts are rejected too.
    const decimals = { ...GOOD, lines: [{ ...GOOD.lines[0], debit: 52727.5 }, GOOD.lines[1], { ...GOOD.lines[2], credit: 58000.5 }] };
    const s2 = await suggestWithFallback(DOC, ACCOUNTS, { rules: lowConfidenceRules, ollama: ollamaWith(vi.fn(async () => chatResponse(decimals)) as unknown as typeof fetch) });
    expect(s2.provider).toBe("rules");
  });

  it("Ollama suggestion with unknown account code is discarded", async () => {
    for (const code of ["9.9.99", "1.2"]) { // unknown, and known but not postable
      const f = vi.fn(async () => chatResponse({ ...GOOD, lines: [{ ...GOOD.lines[0], accountCode: code }, GOOD.lines[1], GOOD.lines[2]] }));
      const s = await suggestWithFallback(DOC, ACCOUNTS, { rules: lowConfidenceRules, ollama: ollamaWith(f as unknown as typeof fetch) });
      expect(s.provider).toBe("rules");
      expect(s.fallbackReason).toContain(code);
    }
  });

  it("rules suggestion for the fixture invoice is balanced and uses the expected accounts", async () => {
    const s: Suggestion = await new RuleBasedProvider().suggestEntry(DOC, ACCOUNTS);
    expect(s.provider).toBe("rules");
    expect(s.lines.map(({ accountCode, debit, credit }) => ({ accountCode, debit, credit }))).toEqual([
      { accountCode: "1.2.01", debit: 52727, credit: 0 },
      { accountCode: "1.1.06", debit: 5273, credit: 0 },
      { accountCode: "1.1.01", debit: 0, credit: 58000 }, // cash purchase -> Caja
    ]);
    expect(s.lines.every((l) => l.accountId === `id-${l.accountCode}`)).toBe(true);
    const sum = (k: "debit" | "credit") => s.lines.reduce((a, l) => a + l[k], 0);
    expect(sum("debit")).toBe(sum("credit"));
    expect(s.confidence).toBeGreaterThanOrEqual(0.9);
    expect(s.sources).toEqual(expect.arrayContaining([`CDC ${DOC.cdc}`, "IVA 10%: 5.273", "Regla: compra gravada al contado"]));

    // A needed account missing from the chart lowers the confidence and says so.
    const noIva = await new RuleBasedProvider().suggestEntry(DOC, ACCOUNTS.filter((a) => a.code !== "1.1.06"));
    expect(noIva.confidence).toBeLessThan(0.8);
    expect(noIva.rationale).toMatch(/IVA Crédito Fiscal/);
    const sum2 = (k: "debit" | "credit") => noIva.lines.reduce((a, l) => a + l[k], 0);
    expect(sum2("debit")).toBe(sum2("credit"));

    // Credit purchase -> Proveedores; issued invoice -> Ventas / IVA Débito / Caja.
    const credit = await new RuleBasedProvider().suggestEntry({ ...DOC, condition: "credit" }, ACCOUNTS);
    expect(credit.lines.at(-1)).toMatchObject({ accountCode: "2.1.01", credit: 58000 });
    const sale = await new RuleBasedProvider().suggestEntry(DOC, ACCOUNTS, "issued");
    expect(sale.lines.map(({ accountCode, debit, credit }) => ({ accountCode, debit, credit }))).toEqual([
      { accountCode: "1.1.01", debit: 58000, credit: 0 },
      { accountCode: "4.1.01", debit: 0, credit: 52727 },
      { accountCode: "2.1.02", debit: 0, credit: 5273 },
    ]);
    // Credit note mirrors the purchase.
    const nc = await new RuleBasedProvider().suggestEntry({ ...DOC, docType: "credit_note" }, ACCOUNTS);
    expect(nc.lines.map(({ accountCode, debit, credit }) => ({ accountCode, debit, credit }))).toEqual([
      { accountCode: "1.2.01", debit: 0, credit: 52727 },
      { accountCode: "1.1.06", debit: 0, credit: 5273 },
      { accountCode: "1.1.01", debit: 58000, credit: 0 },
    ]);
  });

  it("the Ollama prompt never contains the receiver name or RUC", async () => {
    const f = vi.fn(async () => chatResponse(GOOD));
    await ollamaWith(f as unknown as typeof fetch).suggestEntry(DOC, ACCOUNTS);
    const body = String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body);
    expect(DOC.receiver.name).toBe("CLIENTE DE PRUEBA");
    expect(body).not.toContain(DOC.receiver.name);
    expect(body).not.toContain(DOC.receiver.ruc);
    expect(body).not.toMatch(/cliente@example\.com/);
    expect(body).toContain("SERVICIOS RAPIDOS DEL PARAGUAY");
    expect(body).toContain("1.1.06 — IVA Crédito Fiscal — asset");
    expect(body).not.toContain("Activo No Corriente"); // only postable accounts
  });
});
