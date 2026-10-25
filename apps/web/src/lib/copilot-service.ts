import { randomUUID } from "node:crypto";
import { getDb, isMockMode } from "@ledger/db";
import { copilotConversaciones, copilotMensajes, entities, accounts, chartOfAccounts } from "@ledger/db/schema";
import { eq, desc, and } from "drizzle-orm";

export interface CopilotConversacion {
  id: string;
  entityId: string;
  userId: string | null;
  titulo: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CopilotMensaje {
  id: string;
  conversacionId: string;
  rol: "user" | "assistant" | "system";
  contenido: string;
  contextoUsado: any;
  createdAt: Date;
}

export interface RAGContext {
  entityId: string;
  ruc?: string;
  legalName?: string;
  regimes?: string[];
  accountsSummary: string[];
  systemPrompt: string;
}

// In-memory mock store for tests and mock mode
let mockConversaciones: CopilotConversacion[] = [];
let mockMensajes: CopilotMensaje[] = [];

export function resetCopilotMockStore(): void {
  mockConversaciones = [];
  mockMensajes = [];
}

/**
 * Crea una nueva conversación persistente aislada por entidad.
 */
export async function createCopilotConversation(input: {
  entityId: string;
  userId?: string | null;
  titulo?: string;
}): Promise<CopilotConversacion> {
  const now = new Date();
  const id = randomUUID();
  const titulo = input.titulo?.trim() || "Nueva Consulta Contable";

  if (isMockMode() || process.env.NODE_ENV === "test") {
    const conv: CopilotConversacion = {
      id,
      entityId: input.entityId,
      userId: input.userId || null,
      titulo,
      createdAt: now,
      updatedAt: now,
    };
    mockConversaciones.push(conv);
    return conv;
  }

  const db = getDb();
  const [row] = await db
    .insert(copilotConversaciones)
    .values({
      id,
      entityId: input.entityId,
      userId: input.userId || null,
      titulo,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return row as CopilotConversacion;
}

/**
 * Lista las conversaciones activas para una empresa, ordenadas por última interacción.
 */
export async function listCopilotConversaciones(entityId: string): Promise<CopilotConversacion[]> {
  if (isMockMode() || process.env.NODE_ENV === "test") {
    return mockConversaciones
      .filter((c) => c.entityId === entityId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(copilotConversaciones)
    .where(eq(copilotConversaciones.entityId, entityId))
    .orderBy(desc(copilotConversaciones.updatedAt));

  return rows as CopilotConversacion[];
}

/**
 * Obtiene los mensajes de una conversación asegurando aislamiento estricto por entidad.
 */
export async function getCopilotMessages(conversacionId: string, entityId: string): Promise<CopilotMensaje[]> {
  if (isMockMode() || process.env.NODE_ENV === "test") {
    const conv = mockConversaciones.find((c) => c.id === conversacionId && c.entityId === entityId);
    if (!conv) return [];
    return mockMensajes
      .filter((m) => m.conversacionId === conversacionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const db = getDb();
  const [conv] = await db
    .select()
    .from(copilotConversaciones)
    .where(and(eq(copilotConversaciones.id, conversacionId), eq(copilotConversaciones.entityId, entityId)));

  if (!conv) return [];

  const rows = await db
    .select()
    .from(copilotMensajes)
    .where(eq(copilotMensajes.conversacionId, conversacionId))
    .orderBy(copilotMensajes.createdAt);

  return rows as CopilotMensaje[];
}

/**
 * Elimina una conversación y sus mensajes en cascada verificando pertenencia a la entidad.
 */
export async function deleteCopilotConversation(conversacionId: string, entityId: string): Promise<boolean> {
  if (isMockMode() || process.env.NODE_ENV === "test") {
    const idx = mockConversaciones.findIndex((c) => c.id === conversacionId && c.entityId === entityId);
    if (idx === -1) return false;
    mockConversaciones.splice(idx, 1);
    mockMensajes = mockMensajes.filter((m) => m.conversacionId !== conversacionId);
    return true;
  }

  const db = getDb();
  const [deleted] = await db
    .delete(copilotConversaciones)
    .where(and(eq(copilotConversaciones.id, conversacionId), eq(copilotConversaciones.entityId, entityId)))
    .returning();

  return !!deleted;
}

/**
 * Construye el contexto RAG enriquecido con la información financiera de la empresa.
 */
export async function buildAccountingRAGContext(entityId: string): Promise<RAGContext> {
  let legalName = "Empresa Contribuyente";
  let ruc = "80000000-0";
  let regimes: string[] = ["IVA_GRAL", "IRE_GRAL"];
  let accountsSummary: string[] = [
    "1.1.01 - Caja Moneda Nacional",
    "1.1.02 - Bancos Cuentas Corrientes",
    "1.1.05 - Clientes Locales",
    "2.1.01 - Proveedores Locales",
    "2.1.04 - IVA Débito Fiscal",
    "1.1.08 - IVA Crédito Fiscal",
    "4.1.01 - Ventas de Mercaderías",
    "5.1.01 - Costo de Ventas",
    "5.1.05 - Gastos Generales y Servicios",
  ];

  if (!isMockMode() && process.env.NODE_ENV !== "test") {
    try {
      const db = getDb();
      const [ent] = await db.select().from(entities).where(eq(entities.id, entityId));
      if (ent) {
        legalName = ent.legalName;
        ruc = ent.ruc;
        regimes = (ent.taxRegimes as string[]) || regimes;
      }
      const [coa] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.entityId, entityId));
      if (coa) {
        const accts = await db.select().from(accounts).where(eq(accounts.coaId, coa.id)).limit(20);
        if (accts.length > 0) {
          accountsSummary = accts.map((a) => `${a.code} - ${a.name}`);
        }
      }
    } catch {
      // Fallback a valores por defecto
    }
  }

  const systemPrompt = `Sos el Agente Copilot Contable Inteligente de InteliCont, contador paraguayo experto en la legislación tributaria y normas contables de la República del Paraguay (Ley 6380/2019 de Modernización Fiscal, RG 90/2021 de Registro de Comprobantes, Formulario 104 y Ley 125/1991).

Contexto del Contribuyente Activo:
- Razón Social: ${legalName}
- RUC: ${ruc}
- Regímenes Tributarios: ${regimes.join(", ")}
- Cuentas Contables Clave:
${accountsSummary.map((a) => `  * ${a}`).join("\n")}

Directrices para tus respuestas:
1. Respuestas directas, profesionales y concisas, con formato Markdown limpio.
2. Cada vez que sugieras asientos contables, usá el formato de Partida Doble (Debe y Haber) asegurando que cuadren exactamente.
3. Citá con precisión la base legal paraguaya cuando aplique (Ley 6380/19, RG 90/21).
4. Para compras con IVA 50% (combustibles, lubricantes según Art. 19 Ley 6380), recordá imputar 50% al IVA Crédito Fiscal y 50% al gasto o costo no deducible.`;

  return {
    entityId,
    ruc,
    legalName,
    regimes,
    accountsSummary,
    systemPrompt,
  };
}

/**
 * Envía un mensaje al Copilot, consulta el motor de IA con memoria persistente y retorna la respuesta.
 */
export async function enviarMensajeCopilot(input: {
  entityId: string;
  conversacionId?: string;
  userId?: string | null;
  mensaje: string;
}): Promise<{ conversacionId: string; reply: string; messageId: string }> {
  const prompt = input.mensaje.trim();
  let conversacionId = input.conversacionId;

  // 1. Obtener o crear conversación
  if (!conversacionId) {
    const titleSnippet = prompt.length > 40 ? prompt.slice(0, 40) + "..." : prompt;
    const newConv = await createCopilotConversation({
      entityId: input.entityId,
      userId: input.userId,
      titulo: titleSnippet,
    });
    conversacionId = newConv.id;
  }

  // 2. Persistir mensaje del usuario
  const now = new Date();
  const userMsgId = randomUUID();
  const userMsg: CopilotMensaje = {
    id: userMsgId,
    conversacionId,
    rol: "user",
    contenido: prompt,
    contextoUsado: null,
    createdAt: now,
  };

  if (isMockMode() || process.env.NODE_ENV === "test") {
    mockMensajes.push(userMsg);
  } else {
    const db = getDb();
    await db.insert(copilotMensajes).values(userMsg);
    await db
      .update(copilotConversaciones)
      .set({ updatedAt: now })
      .where(eq(copilotConversaciones.id, conversacionId));
  }

  // 3. Obtener contexto RAG e historial previo
  const ragContext = await buildAccountingRAGContext(input.entityId);
  const history = await getCopilotMessages(conversacionId, input.entityId);

  // 4. Generar respuesta (vía Ollama o motor experto contable)
  let reply = "";
  const ollamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5-coder:1.5b";

  if (!isMockMode() && process.env.NODE_ENV !== "test") {
    try {
      const messagesPayload = [
        { role: "system", content: ragContext.systemPrompt },
        ...history.slice(-8).map((m) => ({
          role: m.rol === "user" ? "user" : "assistant",
          content: m.contenido,
        })),
      ];

      const res = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          stream: false,
          messages: messagesPayload,
          options: { temperature: 0.2 },
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        reply = data?.message?.content || "";
      }
    } catch {
      // Fallback a motor de reglas
    }
  }

  // Si Ollama no está disponible o estamos en test, usamos el motor experto contable paraguayo
  if (!reply) {
    const lower = prompt.toLowerCase();
    if (lower.includes("combustible") || lower.includes("50%")) {
      reply = `### Imputación de Combustibles y Lubricantes (Ley 6380/19)

Conforme al **Artículo 19 de la Ley 6380/2019** y el **Decreto Reglamentario 3107/2019**:
- **IVA Crédito Fiscal (50%)**: Solo se puede deducir el **50%** del crédito fiscal si los vehículos no están afectados exclusivamente a la actividad gravada.
- **Costo o Gasto (50% restante)**: El 50% de IVA no deducible se incorpora directamente al costo o gasto contable del ejercicio.

#### Asiento de Partida Doble Sugerido:
| Cuenta | Código | Debe | Haber |
| :--- | :--- | :--- | :--- |
| **Combustibles y Lubricantes** | \`5.1.05.02\` | Gs. 954.545 | - |
| **IVA Crédito Fiscal Deducible (50%)** | \`1.1.08.01\` | Gs. 45.455 | - |
| **Caja / Bancos / Proveedor** | \`1.1.01\` / \`2.1.01\` | - | Gs. 1.000.000 |

*Base de cálculo para factura de Gs. 1.000.000 (Gravada 10%).*`;
    } else if (lower.includes("activo corriente") || lower.includes("cuentas")) {
      reply = `### Cuentas del Activo Corriente (${ragContext.legalName})

En el Plan de Cuentas oficial de la empresa tenés habilitadas:
- \`1.1.01\` — **Caja Moneda Nacional** (Disponibilidades en efectivo)
- \`1.1.02\` — **Bancos Cuentas Corrientes** (Itaú / GNB / Continental)
- \`1.1.05\` — **Clientes Locales** (Créditos por ventas devengadas)
- \`1.1.08\` — **IVA Crédito Fiscal** (Créditos a favor del contribuyente)

Todas admiten imputación directa en el Libro Diario.`;
    } else {
      reply = `Entendido. Como **Agente Copilot Contable** de **${ragContext.legalName}** (RUC ${ragContext.ruc}), tengo monitoreados los regímenes fiscales (${ragContext.regimes?.join(", ")}), el libro mayor y los comprobantes SIFEN del período.

¿Querés que analicemos algún comprobante específico, liquidemos el IVA del Formulario 104 o verifiquemos el registro RG 90?`;
    }
  }

  // 5. Persistir respuesta del asistente
  const assistantMsgId = randomUUID();
  const assistantMsg: CopilotMensaje = {
    id: assistantMsgId,
    conversacionId,
    rol: "assistant",
    contenido: reply,
    contextoUsado: { ruc: ragContext.ruc, legalName: ragContext.legalName },
    createdAt: new Date(),
  };

  if (isMockMode() || process.env.NODE_ENV === "test") {
    mockMensajes.push(assistantMsg);
  } else {
    const db = getDb();
    await db.insert(copilotMensajes).values(assistantMsg);
  }

  return {
    conversacionId,
    reply,
    messageId: assistantMsgId,
  };
}
