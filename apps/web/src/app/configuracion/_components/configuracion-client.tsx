"use client";

import { useState, useTransition } from "react";
import {
  Settings, Cpu, CheckCircle2, AlertCircle, Loader2,
  Eye, EyeOff, ExternalLink, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { saveAISettings } from "@/app/comprobantes/actions";

// ─── Provider info ────────────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id:    "rules",
    label: "Reglas (gratis)",
    desc:  "Motor determinístico basado en el plan de cuentas DNIT. Sin API key. Siempre disponible.",
    color: "text-secondary",
    free:  true,
    link:  null,
  },
  {
    id:    "gemini",
    label: "Google Gemini",
    desc:  "Gemini 1.5 Flash tiene capa gratuita generosa. Ideal para empezar.",
    color: "text-blue-600",
    free:  true,
    link:  "https://aistudio.google.com/app/apikey",
  },
  {
    id:    "openai",
    label: "OpenAI",
    desc:  "GPT-4o-mini es muy económico (~$0.15/1M tokens). Buena calidad.",
    color: "text-gray-700",
    free:  false,
    link:  "https://platform.openai.com/api-keys",
  },
  {
    id:    "ollama",
    label: "Ollama (local)",
    desc:  "Servidor Ollama local con modelos como Llama 3.2. Completamente gratis si tenés el hardware.",
    color: "text-amber-600",
    free:  true,
    link:  "https://ollama.ai",
  },
  {
    id:    "claude",
    label: "Claude (Anthropic)",
    desc:  "Claude Haiku es el más preciso para contabilidad, con razonamiento estructurado.",
    color: "text-violet-600",
    free:  false,
    link:  "https://console.anthropic.com/settings/keys",
  },
];

const DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-1.5-flash",
  openai: "gpt-4o-mini",
  claude: "claude-haiku-4-5",
  ollama: "llama3.2",
  rules:  "",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialSettings: Record<string, string>;
  dbError?:        string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ConfiguracionClient({ initialSettings, dbError }: Props) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [showKey,  setShowKey]  = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved,    setSaved]    = useState(false);
  const [saveError,setSaveError]= useState<string | null>(null);

  const provider = settings["ai.provider"] ?? "rules";
  const info     = PROVIDERS.find((p) => p.id === provider);

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleProviderChange(p: string) {
    setSettings((prev) => ({
      ...prev,
      "ai.provider": p,
      "ai.model":    DEFAULT_MODELS[p] ?? "",
    }));
    setSaved(false);
  }

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      const result = await saveAISettings(settings);
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaveError(result.error);
      }
    });
  }

  return (
    <div className="page-container max-w-3xl">

      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Error: {dbError}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="section-title text-2xl lg:text-3xl flex items-center gap-3">
          <Settings className="h-7 w-7" /> Configuración
        </h1>
        <p className="section-subtitle">Proveedor de IA y preferencias del sistema</p>
      </div>

      {/* AI Config section */}
      <div className="card p-5 lg:p-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-slate-700">
          <Cpu className="h-4 w-4 text-violet-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">Proveedor de Inteligencia Artificial</h2>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
            La IA propone asientos contables automáticamente al ingresar un XML SIFEN. El contador siempre aprueba antes de postear.
            Podés cambiar el proveedor en cualquier momento sin perder datos.
          </p>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Activar propuestas IA</p>
            <p className="text-xs text-gray-500 mt-0.5">Deshabilitar usa solo el motor de reglas</p>
          </div>
          <button
            onClick={() => set("ai.enabled", settings["ai.enabled"] === "false" ? "true" : "false")}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
              settings["ai.enabled"] !== "false" ? "bg-primary" : "bg-gray-200 dark:bg-slate-600"
            )}
          >
            <span className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
              settings["ai.enabled"] !== "false" ? "translate-x-6" : "translate-x-1"
            )} />
          </button>
        </div>

        {/* Provider selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Proveedor</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleProviderChange(p.id)}
                className={cn(
                  "flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
                  provider === p.id
                    ? "border-primary bg-primary-50 dark:bg-primary/10"
                    : "border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600"
                )}
              >
                <div className={cn(
                  "h-3 w-3 rounded-full mt-0.5 shrink-0 border-2 transition-colors",
                  provider === p.id ? "border-primary bg-primary" : "border-gray-300"
                )} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", p.color)}>{p.label}</span>
                    {p.free && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary-50 text-secondary border border-secondary-200">GRATIS</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{p.desc}</p>
                  {p.link && (
                    <a href={p.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1">
                      Obtener API Key <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* API Key + Model (hidden for rules and ollama) */}
        {provider !== "rules" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* API Key */}
            {provider !== "ollama" && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={settings["ai.api_key"] ?? ""}
                    onChange={(e) => set("ai.api_key", e.target.value)}
                    placeholder={`Pegá tu ${info?.label ?? ""} API key`}
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  ⚠️ La clave se guarda en la base de datos. En producción, usá variables de entorno.
                </p>
              </div>
            )}

            {/* Model */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Modelo
              </label>
              <input
                type="text"
                value={settings["ai.model"] ?? DEFAULT_MODELS[provider] ?? ""}
                onChange={(e) => set("ai.model", e.target.value)}
                placeholder={DEFAULT_MODELS[provider] ?? "nombre-del-modelo"}
                className="input-field"
              />
            </div>

            {/* Base URL (Ollama or custom) */}
            {(provider === "ollama" || provider === "openai") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  URL Base {provider === "ollama" ? "(servidor Ollama)" : "(override)"}
                </label>
                <input
                  type="text"
                  value={settings["ai.base_url"] ?? ""}
                  onChange={(e) => set("ai.base_url", e.target.value)}
                  placeholder={provider === "ollama" ? "http://localhost:11434" : "https://api.openai.com/v1"}
                  className="input-field"
                />
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        {saveError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {saveError}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary-50 border border-secondary-200 text-sm text-secondary-dark">
            <CheckCircle2 className="h-4 w-4 text-secondary" /> Configuración guardada correctamente
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-700">
          <button onClick={handleSave} disabled={isPending} className="btn-secondary">
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : "Guardar configuración"}
          </button>
        </div>
      </div>

      {/* Coming soon */}
      <div className="card-flat p-5 opacity-60">
        <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
          <Settings className="h-4 w-4" /> Próximamente
        </h2>
        <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside mt-2">
          <li>Gestión de usuarios y permisos por empresa</li>
          <li>Plan de cuentas personalizado</li>
          <li>Timbrados vigentes por empresa</li>
          <li>Notificaciones de vencimiento (email / WhatsApp)</li>
        </ul>
      </div>
    </div>
  );
}
