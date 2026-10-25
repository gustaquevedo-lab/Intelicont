import { describe, it, expect, beforeEach } from "vitest";
import {
  createCopilotConversation,
  listCopilotConversaciones,
  getCopilotMessages,
  deleteCopilotConversation,
  buildAccountingRAGContext,
  enviarMensajeCopilot,
  resetCopilotMockStore,
} from "../lib/copilot-service";

describe("Copilot Contable RAG & Memoria Persistente", () => {
  const ENTITY_A = "11111111-1111-1111-1111-111111111111";
  const ENTITY_B = "22222222-2222-2222-2222-222222222222";
  const USER_ID = "usr-tester";

  beforeEach(() => {
    resetCopilotMockStore();
  });

  it("1. Crea conversaciones aisladas por entidad y persiste mensajes", async () => {
    const conv = await createCopilotConversation({
      entityId: ENTITY_A,
      userId: USER_ID,
      titulo: "Consulta IVA Mayo 2026",
    });

    expect(conv.id).toBeDefined();
    expect(conv.entityId).toBe(ENTITY_A);
    expect(conv.titulo).toBe("Consulta IVA Mayo 2026");

    const listA = await listCopilotConversaciones(ENTITY_A);
    expect(listA).toHaveLength(1);
    expect(listA[0].id).toBe(conv.id);

    // Entidad B no debe ver la conversación de A
    const listB = await listCopilotConversaciones(ENTITY_B);
    expect(listB).toHaveLength(0);
  });

  it("2. Garantiza aislamiento estricto: la entidad B no puede leer mensajes de la entidad A", async () => {
    const convA = await createCopilotConversation({
      entityId: ENTITY_A,
      userId: USER_ID,
      titulo: "Conversación Confidencial",
    });

    await enviarMensajeCopilot({
      entityId: ENTITY_A,
      conversacionId: convA.id,
      mensaje: "¿Cuál es nuestro saldo de IVA crédito?",
    });

    const msgsA = await getCopilotMessages(convA.id, ENTITY_A);
    expect(msgsA.length).toBeGreaterThanOrEqual(2); // user + assistant

    // Si la entidad B intenta leer la conversación de A
    const msgsB = await getCopilotMessages(convA.id, ENTITY_B);
    expect(msgsB).toHaveLength(0);
  });

  it("3. Genera el contexto RAG contable enriquecido con datos del contribuyente", async () => {
    const context = await buildAccountingRAGContext(ENTITY_A);

    expect(context).toBeDefined();
    expect(context.entityId).toBe(ENTITY_A);
    expect(context.systemPrompt).toContain("contador paraguayo");
    expect(context.systemPrompt).toContain("Ley 6380");
    expect(context.systemPrompt).toContain("RG 90");
  });

  it("4. Envía mensaje, genera respuesta contable y preserva historial multi-turn", async () => {
    const res1 = await enviarMensajeCopilot({
      entityId: ENTITY_A,
      mensaje: "¿Cuáles son las cuentas del activo corriente disponibles?",
    });

    expect(res1.conversacionId).toBeDefined();
    expect(res1.reply).toBeDefined();
    expect(typeof res1.reply).toBe("string");
    expect(res1.reply.length).toBeGreaterThan(10);

    // Segundo turno en la misma conversación
    const res2 = await enviarMensajeCopilot({
      entityId: ENTITY_A,
      conversacionId: res1.conversacionId,
      mensaje: "Y cómo imputo un gasto de combustible con IVA 50%?",
    });

    expect(res2.conversacionId).toBe(res1.conversacionId);
    expect(res2.reply).toContain("50%");

    const allMsgs = await getCopilotMessages(res1.conversacionId, ENTITY_A);
    expect(allMsgs).toHaveLength(4); // 2 user + 2 assistant
    expect(allMsgs[0].rol).toBe("user");
    expect(allMsgs[1].rol).toBe("assistant");
    expect(allMsgs[2].rol).toBe("user");
    expect(allMsgs[3].rol).toBe("assistant");
  });

  it("5. Permite eliminar una conversación y purga sus mensajes en cascada", async () => {
    const conv = await createCopilotConversation({
      entityId: ENTITY_A,
      titulo: "Para eliminar",
    });

    await enviarMensajeCopilot({
      entityId: ENTITY_A,
      conversacionId: conv.id,
      mensaje: "Hola",
    });

    const deleted = await deleteCopilotConversation(conv.id, ENTITY_A);
    expect(deleted).toBe(true);

    const list = await listCopilotConversaciones(ENTITY_A);
    expect(list).toHaveLength(0);

    const msgs = await getCopilotMessages(conv.id, ENTITY_A);
    expect(msgs).toHaveLength(0);
  });
});
