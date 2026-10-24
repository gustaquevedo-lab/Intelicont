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
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Trash2,
  Search,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { usePathname } from "next/navigation";
import { api } from "@/trpc/client";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolsExecuted?: Array<{ toolName: string; success: boolean }>;
  timestamp: string;
}

const QUICK_PROMPTS = [
  {
    icon: Calendar,
    label: "Vencimientos del mes",
    text: "¿Cuáles son las fechas de vencimiento de IVA y RG 90 para esta empresa según la terminación de su RUC?",
  },
  {
    icon: BookOpen,
    label: "Gastos no deducibles IRE",
    text: "¿Qué gastos NO son deducibles en el IRE según el Art. 16 de la Ley 6380/2019?",
  },
  {
    icon: Search,
    label: "Consultar saldos",
    text: "Consultá el saldo contable actual de las cuentas de Caja y Bancos de la empresa.",
  },
  {
    icon: HelpCircle,
    label: "Desglose RG 90",
    text: "¿Cómo se debe registrar y desglosar el IVA 10% y 5% según la RG 90/2021?",
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = api.agent.chat.useMutation();

  // Enfocar input al abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Scroll automático hacia el último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMutation.isPending]);

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

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || !selectedEntity || chatMutation.isPending) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");

    try {
      const res = await chatMutation.mutateAsync({
        entityId: selectedEntity.id,
        contextPath: pathname,
        messages: newHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: res.reply || "Se procesó la solicitud.",
        toolsExecuted: res.toolsExecuted,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Error al conectar con el motor de IA local.";
      const errorAssistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: `⚠️ ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorAssistantMsg]);
    }
  };

  const getToolLabel = (name: string) => {
    switch (name) {
      case "consultar_normativa_legal":
        return "RAG Normativo (Ley 6380 / RG 90)";
      case "consultar_saldo_cuenta":
        return "Mayor Contable (Saldos)";
      case "buscar_comprobantes":
        return "Comprobantes Tributarios";
      case "consultar_vencimientos_fiscales":
        return "Calendario Perpetuo DNIT";
      case "proponer_asiento_contable":
        return "Validación Partida Doble";
      default:
        return name;
    }
  };

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
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    Copilot Contable AI
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-mono font-medium">
                    1.5B Local
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  RAG Legal Paraguay • Multi-tenant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title="Limpiar conversación"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Cerrar panel (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Context chips: active entity and active route */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            {selectedEntity ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 font-medium truncate max-w-[240px]">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{selectedEntity.tradeName || selectedEntity.legalName}</span>
                <span className="opacity-70 font-mono">({selectedEntity.ruc})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                <AlertCircle className="h-3 w-3" />
                Sin empresa activa
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono text-[10px]">
              📍 {pathname}
            </span>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center px-4 py-8">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 shadow-inner">
                <Bot className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                ¿En qué puedo ayudarte hoy?
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
                Tengo acceso a la normativa paraguaya (Ley 6380, RG 90) y a las cuentas y comprobantes de esta empresa.
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
                  m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className="flex items-center gap-1.5 px-1 text-[10px] text-gray-400">
                  {m.role === "user" ? (
                    <>
                      <span>Vos</span>
                      <User className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 text-purple-500" />
                      <span className="font-semibold text-purple-600 dark:text-purple-400">Copilot</span>
                    </>
                  )}
                  <span>• {m.timestamp}</span>
                </div>

                {/* Tool badges if executed */}
                {m.toolsExecuted && m.toolsExecuted.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {m.toolsExecuted.map((t, tidx) => (
                      <span
                        key={tidx}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                          t.success
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40"
                            : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40"
                        )}
                      >
                        {t.success ? (
                          <CheckCircle2 className="h-2.5 w-2.5" />
                        ) : (
                          <AlertCircle className="h-2.5 w-2.5" />
                        )}
                        {getToolLabel(t.toolName)}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  className={cn(
                    "p-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-xs",
                    m.role === "user"
                      ? "bg-primary text-white rounded-br-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-xs border border-gray-200/60 dark:border-gray-700/60"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}

          {chatMutation.isPending && (
            <div className="mr-auto flex flex-col gap-1 max-w-[85%] animate-pulse">
              <div className="flex items-center gap-1.5 px-1 text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                <Bot className="h-3 w-3" />
                <span>Copilot pensando y consultando herramientas...</span>
              </div>
              <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 rounded-bl-xs border border-gray-200/60 dark:border-gray-700/60 flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />
                <span>Analizando normativa y base contable de la empresa...</span>
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
                  ? `Preguntá a la IA sobre ${selectedEntity.tradeName || selectedEntity.legalName}...`
                  : "Seleccioná una empresa para chatear..."
              }
              disabled={!selectedEntity || chatMutation.isPending}
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:text-white placeholder-gray-400 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || !selectedEntity || chatMutation.isPending}
              className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:hover:bg-purple-600 shadow-md shadow-purple-600/20 cursor-pointer"
              title="Enviar mensaje"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="mt-1.5 text-[10px] text-center text-gray-400">
            InteliCont Copilot 1.5B • Verificá siempre con un profesional contable matriculado.
          </p>
        </div>
      </aside>
    </>
  );
}
