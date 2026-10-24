/**
 * Servicio de Ejecución del Agente Contable Inteligente de InteliCont.
 * Orquesta el bucle de razonamiento + Tool Calling con Ollama qwen2.5-coder:1.5b.
 * Garantiza límites estrictos de seguridad y aislamiento por entidad (Tenant Boundary).
 */

import { DEFAULT_OLLAMA_MODEL, DEFAULT_OLLAMA_URL } from "@/lib/ai-provider";
import {
  ESQUEMA_HERRAMIENTAS_CONTABLES,
  ejecutarHerramientaContable,
  type ToolExecutionResult,
} from "./tools";
import { getEntity } from "@ledger/db/repository";
import { tenantDb, isMockMode } from "@ledger/db/index";
import * as schema from "@ledger/db/schema";

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
}

export interface AgentRunOptions {
  entityId: string;
  userId?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  contextPath?: string;
  ollamaUrl?: string;
  model?: string;
}

export interface AgentRunResult {
  reply: string;
  toolsExecuted: ToolExecutionResult[];
  entityId: string;
  model: string;
}

interface OllamaToolCall {
  id?: string;
  function: {
    name: string;
    arguments: Record<string, unknown> | string;
  };
}

interface OllamaMessageResponse {
  role: string;
  content: string;
  tool_calls?: OllamaToolCall[];
}

interface OllamaChatResponse {
  message?: OllamaMessageResponse;
}

/** Extrae tool calls ya sea del campo nativo tool_calls o parseando JSON en content */
function extraerToolCalls(msg: OllamaMessageResponse | undefined): Array<{ name: string; args: Record<string, unknown> }> {
  if (!msg) return [];
  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];

  // 1. Tool calls nativos
  if (Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
    for (const tc of msg.tool_calls) {
      if (tc.function?.name) {
        let args: Record<string, unknown> = {};
        if (typeof tc.function.arguments === "object" && tc.function.arguments !== null) {
          args = tc.function.arguments;
        } else if (typeof tc.function.arguments === "string") {
          try {
            args = JSON.parse(tc.function.arguments);
          } catch {
            args = {};
          }
        }
        calls.push({ name: tc.function.name, args });
      }
    }
    return calls;
  }

  // 2. Extracción defensiva si el modelo imprimió JSON en `content`
  const content = (msg.content || "").trim();
  if (content.startsWith("{") && content.includes('"name"')) {
    try {
      const parsed = JSON.parse(content) as { name?: string; arguments?: Record<string, unknown> };
      if (parsed.name && typeof parsed.name === "string") {
        const args = parsed.arguments || {};
        // Desanidar si vienen como {"codigo": {"value": "..."}}
        const cleanArgs: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(args)) {
          if (v && typeof v === "object" && "value" in (v as Record<string, unknown>)) {
            cleanArgs[k] = (v as Record<string, unknown>).value;
          } else {
            cleanArgs[k] = v;
          }
        }
        calls.push({ name: parsed.name, args: cleanArgs });
      }
    } catch {
      // Ignorar si no es JSON válido
    }
  }

  return calls;
}

/**
 * Ejecuta el Agente Contable con RAG y Tools en el perímetro del tenant.
 */
export async function ejecutarAgenteContable(opts: AgentRunOptions): Promise<AgentRunResult> {
  const entity = await getEntity(opts.entityId);
  if (!entity) {
    throw new Error("Empresa no encontrada o acceso denegado.");
  }

  const ollamaUrl = (opts.ollamaUrl || process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL).replace(/\/$/, "");
  const model = opts.model || process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;

  const regimesStr = Array.isArray(entity.taxRegimes) && entity.taxRegimes.length > 0
    ? entity.taxRegimes.join(", ")
    : "IVA General, IRE General";

  const screenContext = opts.contextPath
    ? `El contador se encuentra actualmente en la pantalla: ${opts.contextPath}`
    : "El contador está en el panel general de la empresa.";

  const systemPrompt = `Sos el AGENTE COPILOT CONTABLE Y TRIBUTARIO de InteliCont para la República del Paraguay.
Tenés dominio experto de:
- Ley 6380/2019 (Modernización Tributaria: IRE, IVA, IRP, IDU).
- Resolución General 90/2021 (Registro Electrónico de Comprobantes, Formulario 241 y 242).
- Decretos 3107/19 y 3181/19, Retenciones Tesakâ (30% IVA), y Ley 125/91.
- Plan de Cuentas PY estándar y Partida Doble estricta (Debe === Haber, montos enteros en Guaraníes).

PERÍMETRO Y SEGURIDAD MULTI-TENANT:
- Empresa Activa: ${entity.legalName} ${entity.tradeName ? `(${entity.tradeName})` : ""}
- RUC: ${entity.ruc}
- Obligaciones / Regímenes: ${regimesStr}
- Moneda Base: ${entity.baseCurrency}
- Contexto de Pantalla: ${screenContext}

REGLAS DE ACTUACIÓN:
1. Jamás inventes datos ni divulgues información de otras empresas o RUCs no relacionados.
2. Si la consulta involucra normativas o deducciones, usá la herramienta 'consultar_normativa_legal'.
3. Si el usuario pregunta por saldos o cuentas, usá 'consultar_saldo_cuenta'.
4. Si pregunta por facturas, compras o ventas, usá 'buscar_comprobantes'.
5. Si pregunta por vencimientos o plazos fiscales, usá 'consultar_vencimientos_fiscales'.
6. Si pide un asiento, usá 'proponer_asiento_contable' para asegurar que el débito y crédito cuadren.
7. Respondé de forma concisa, profesional y en tono de colega contador paraguayo (usando vos/tú amigable).`;

  const conversationPayload: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...opts.messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
  ];

  const toolsExecuted: ToolExecutionResult[] = [];
  let reply = "";
  const maxTurns = 3;

  for (let turn = 0; turn < maxTurns; turn++) {
    let res: Response;
    try {
      res = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: conversationPayload,
          tools: ESQUEMA_HERRAMIENTAS_CONTABLES,
          stream: false,
          options: {
            temperature: 0.1,
            num_thread: 4,
          },
        }),
        signal: AbortSignal.timeout(25_000),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`No se pudo conectar con el motor de IA local (${model}): ${msg}`);
    }

    if (!res.ok) {
      throw new Error(`El servicio de IA respondió con error HTTP ${res.status}`);
    }

    const data = (await res.json()) as OllamaChatResponse;
    const assistantMsg = data.message;
    if (!assistantMsg) break;

    const toolCalls = extraerToolCalls(assistantMsg);

    if (toolCalls.length === 0) {
      // Respuesta final de texto sin tools pendientes
      reply = assistantMsg.content || "";
      break;
    }

    // Ejecutar cada herramienta solicitada
    for (const tc of toolCalls) {
      const result = await ejecutarHerramientaContable(tc.name, tc.args, opts.entityId);
      toolsExecuted.push(result);

      // Añadir la llamada del asistente y el resultado de la herramienta al payload
      conversationPayload.push({
        role: "assistant",
        content: `Ejecutando herramienta: ${tc.name}(${JSON.stringify(tc.args)})`,
      });
      conversationPayload.push({
        role: "user",
        content: `Resultado de la herramienta ${tc.name}: ${JSON.stringify(result.output)}`,
      });
    }
  }

  // Si tras ejecutar herramientas quedó vacío, pedir síntesis final
  if (!reply && toolsExecuted.length > 0) {
    try {
      const summaryRes = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            ...conversationPayload,
            {
              role: "user",
              content:
                "Con base en los resultados de las herramientas ejecutadas, redactá tu respuesta final clara y resumida para el contador.",
            },
          ],
          stream: false,
          options: { temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (summaryRes.ok) {
        const sumData = (await summaryRes.json()) as OllamaChatResponse;
        reply = sumData.message?.content || "";
      }
    } catch {
      reply = "Se ejecutaron las consultas contables correctamente.";
    }
  }

  // Registrar auditoría de la decisión en PostgreSQL si no es mock mode
  if (!isMockMode()) {
    try {
      await tenantDb(async (db) => {
        await db.insert(schema.aiDecisions).values({
          entityId: opts.entityId,
          kind: "agent_chat_query",
          input: {
            lastUserMessage: opts.messages[opts.messages.length - 1]?.content,
            contextPath: opts.contextPath,
          },
          output: {
            reply: reply.slice(0, 1000),
            toolsExecuted: toolsExecuted.map((t) => t.toolName),
          },
          confidence: 90,
          accepted: true,
        });
      });
    } catch {
      // Registro no bloqueante
    }
  }

  return {
    reply: reply.trim(),
    toolsExecuted,
    entityId: opts.entityId,
    model,
  };
}
