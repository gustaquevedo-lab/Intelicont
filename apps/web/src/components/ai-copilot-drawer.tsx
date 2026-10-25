"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Building2,
  BookOpen,
  Calendar,
  Trash2,
  Search,
  Plus,
  MessageSquare,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { usePathname } from "next/navigation";
import { api } from "@/trpc/client";
import { cn } from "@/lib/utils";

const QUICK_PROMPTS = [
  {
    icon: Calendar,
    label: "Vencimientos del mes",
    text: "¿Cuáles son las fechas de vencimiento de IVA y RG 90 para esta empresa según la terminación de su RUC?",
  },
  {
    icon: BookOpen,
    label: "Combustible IVA 50%",
    text: "¿Cómo imputo un gasto de combustible con IVA 50% según la Ley 6380/2019?",
  },
  {
    icon: Search,
    label: "Cuentas del Activo",
    text: "Revisá las cuentas del activo corriente disponibles en el plan de cuentas.",
  },
  {
    icon: BookOpen,
    label: "Gastos no deducibles IRE",
    text: "¿Qué gastos NO son deducibles en el IRE según el Art. 16 de la Ley 6380/2019?",
  },
];

export function AiCopilotDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { selectedEntity } = useAuthStore();
  const pathname = usePathname();
  const [activeConversacionId, setActiveConversacionId] = useState<string | null>(null);
  const [showThreadSelector, setShowThreadSelector] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const entityId = selectedEntity?.id || "00000000-0000-0000-0000-000000000001";
  const entityName = selectedEntity ? (selectedEntity.tradeName || selectedEntity.legalName) : "Empresa Activa";
  const entityRuc = selectedEntity?.ruc || "80000000-0";

  const utils = api.useUtils();

  // Queries persistentes
  const { data: conversaciones = [] } = api.copilot.listConversations.useQuery(
    { entityId },
    { enabled: open && !!entityId }
  );

  const { data: messages = [], isLoading: loadingMessages } = api.copilot.getMessages.useQuery(
    { conversacionId: activeConversacionId!, entityId },
    { enabled: open && !!activeConversacionId }
  );

  // Auto-seleccionar la última conversación persistida al abrir
  useEffect(() => {
    if (open && !activeConversacionId && conversaciones.length > 0) {
      setActiveConversacionId(conversaciones[0].id);
    }
  }, [open, conversaciones, activeConversacionId]);

  // Reset al cambiar de empresa
  useEffect(() => {
    setActiveConversacionId(null);
  }, [entityId]);

  // Enfocar input al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Scroll automático
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Mutación de envío con memoria persistente
  const sendMessageMutation = api.copilot.sendMessage.useMutation({
    onSuccess: (res) => {
      setInput("");
      if (!activeConversacionId || activeConversacionId !== res.conversacionId) {
        setActiveConversacionId(res.conversacionId);
      }
      utils.copilot.getMessages.invalidate({ conversacionId: res.conversacionId, entityId });
      utils.copilot.listConversations.invalidate({ entityId });
    },
  });

  const deleteConvMutation = api.copilot.deleteConversation.useMutation({
    onSuccess: () => {
      setActiveConversacionId(null);
      utils.copilot.listConversations.invalidate({ entityId });
    },
  });

  const handleSend = (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || !selectedEntity || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      entityId,
      conversacionId: activeConversacionId || undefined,
      mensaje: prompt,
    });
  };

  const handleNewConversation = () => {
    setActiveConversacionId(null);
    setShowThreadSelector(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const activeThread = conversaciones.find((c) => c.id === activeConversacionId);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[150] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-[160] flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Copilot Contable AI"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    Copilot Contable InteliCont
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    Memoria RAG
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[280px]">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{entityName}</span>
                  <span className="opacity-40">·</span>
                  <span className="font-mono text-[11px]">{entityRuc}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleNewConversation}
                className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-lg transition-colors"
                title="Nueva Consulta (+)"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Cerrar panel (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Selector de Hilos de Conversación */}
          <div className="relative mt-2.5">
            <button
              onClick={() => setShowThreadSelector(!showThreadSelector)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 shadow-xs hover:border-gray-300 transition"
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                <span className="truncate font-medium">
                  {activeThread ? activeThread.titulo : "Nueva Consulta Activa"}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            </button>

            {showThreadSelector && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto p-1.5 space-y-1">
                <button
                  onClick={handleNewConversation}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Iniciar Nueva Consulta</span>
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700/60 my-1" />
                {conversaciones.length === 0 ? (
                  <div className="p-3 text-center text-xs text-gray-400">Sin conversaciones previas</div>
                ) : (
                  conversaciones.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer",
                        conv.id === activeConversacionId
                          ? "bg-purple-50 dark:bg-purple-950/40 font-semibold text-purple-700 dark:text-purple-300"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
                      )}
                      onClick={() => {
                        setActiveConversacionId(conv.id);
                        setShowThreadSelector(false);
                      }}
                    >
                      <span className="truncate mr-2">{conv.titulo}</span>
                      {conv.id === activeConversacionId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConvMutation.mutate({ conversacionId: conv.id, entityId });
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Eliminar este hilo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeConversacionId && messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center px-4 py-8">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 shadow-inner">
                <Bot className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                ¿En qué puedo ayudarte hoy?
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                Tengo memoria persistente de tus consultas y acceso en tiempo real a las cuentas y comprobantes de <strong>{entityName}</strong>.
              </p>

              {/* Quick suggestions */}
              <div className="w-full space-y-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-left px-1">
                  Consultas frecuentes:
                </p>
                {QUICK_PROMPTS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q.text)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-600/50 bg-gray-50/60 dark:bg-gray-800/40 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 text-left transition-all text-xs text-gray-700 dark:text-gray-300"
                  >
                    <q.icon className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="truncate">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-1 max-w-[88%]",
                  m.rol === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-center gap-1.5 px-1 text-[10px] text-gray-400">
                  {m.rol === "user" ? (
                    <>
                      <span>Vos</span>
                      <User className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 text-purple-500" />
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Copilot RAG</span>
                    </>
                  )}
                  <span>• {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                <div
                  className={cn(
                    "p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-xs",
                    m.rol === "user"
                      ? "bg-purple-600 text-white rounded-br-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-xs border border-gray-200/60 dark:border-gray-700/60"
                  )}
                >
                  {m.contenido}
                </div>
              </div>
            ))
          )}

          {sendMessageMutation.isPending && (
            <div className="mr-auto flex flex-col gap-1 max-w-[85%] animate-pulse">
              <div className="flex items-center gap-1.5 px-1 text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                <Bot className="h-3 w-3" />
                <span>Copilot analizando libro mayor y normativas tributarias...</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-xs border border-gray-200/60 dark:border-gray-700/60 flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                <span>Consultando normativas paraguayas y cuentas de la empresa...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedEntity
                  ? `Preguntá sobre ${selectedEntity.tradeName || selectedEntity.legalName}...`
                  : "Seleccioná una empresa para chatear..."
              }
              disabled={!selectedEntity || sendMessageMutation.isPending}
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:text-white placeholder-gray-400 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || !selectedEntity || sendMessageMutation.isPending}
              className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:hover:bg-purple-600 shadow-md shadow-purple-600/20 cursor-pointer"
              title="Enviar consulta (Enter)"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400 px-1">
            <span>Enter para enviar</span>
            <span>Memoria persistente por empresa</span>
          </div>
        </div>
      </aside>
    </>
  );
}
