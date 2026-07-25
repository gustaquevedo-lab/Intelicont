"use client";

import { useState, useEffect } from "react";
import {
  User, Settings, Bell, Shield, Palette, LogOut,
  Mail, Building2, BadgeCheck, ChevronRight, Save,
  Cpu, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff,
  ExternalLink, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import { useTheme, type Theme } from "@/lib/theme-context";
import { loadAISettings, saveAISettings } from "@/app/comprobantes/actions";

type SettingsTab = "profile" | "notifications" | "security" | "appearance" | "ai";

export default function ProfilePage() {
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as SettingsTab;
      if (tab && ["profile", "ai", "notifications", "security", "appearance"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "profile", label: "Perfil", icon: User },
    { id: "ai", label: "Inteligencia Artificial", icon: Cpu },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "security", label: "Seguridad", icon: Shield },
    { id: "appearance", label: "Apariencia", icon: Palette },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Gestioná tu cuenta y preferencias</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-1.5 space-y-0.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors no-tap-highlight",
                    activeTab === tab.id
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* User card */}
          <div className="mt-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <span className="text-white font-medium text-sm">
                  {(user?.name || user?.email || "U").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.name || "Usuario"}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <a
              href="/auth/signout"
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors no-tap-highlight"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar Sesión
            </a>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileTab user={user} entity={selectedEntity} />}
          {activeTab === "ai" && <AITab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "appearance" && <AppearanceTab theme={theme} setTheme={setTheme} />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user, entity }: { user: any; entity: any }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-base font-medium text-gray-900 dark:text-white mb-4">Información Personal</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nombre" value={user?.name || ""} />
          <FormField label="Email" value={user?.email || ""} type="email" />
          <FormField label="Rol" value={entity?.role || ""} disabled />
          <FormField label="Teléfono" value="+595 21 123 456" />
        </div>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      <div>
        <h2 className="text-base font-medium text-gray-900 dark:text-white mb-4">Empresa Actual</h2>
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
          <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {entity?.tradeName || entity?.legalName || "Sin empresa"}
            </p>
            <p className="text-xs text-gray-400 font-mono">RUC: {entity?.ruc || "—"}</p>
          </div>
          <BadgeCheck className="h-5 w-5 text-green-500 ml-auto" />
        </div>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors no-tap-highlight">
          <Save className="h-4 w-4" />
          Guardar Cambios
        </button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
      <h2 className="text-base font-medium text-gray-900 dark:text-white">Preferencias de Notificación</h2>
      {[
        { label: "Vencimientos fiscales", desc: "Alertas de IVA, IRE, IRP próximos a vencer", enabled: true },
        { label: "Sugerencias IA", desc: "Cuando la IA genera sugerencias de asientos", enabled: true },
        { label: "Documentos SIFEN", desc: "Nuevos XML procesados o con errores", enabled: true },
        { label: "Conciliaciones bancarias", desc: "Cuando se detectan diferencias", enabled: false },
        { label: "Resumen semanal", desc: "Email con resumen de actividad del estudio", enabled: true },
      ].map((item) => (
        <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
          <div>
            <p className="text-sm text-gray-900 dark:text-white">{item.label}</p>
            <p className="text-[10px] text-gray-400">{item.desc}</p>
          </div>
          <Toggle enabled={item.enabled} />
        </div>
      ))}
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
      <h2 className="text-base font-medium text-gray-900 dark:text-white">Seguridad</h2>
      <div className="space-y-3">
        <SecurityItem icon={Shield} label="Autenticación 2FA" desc="Activar verificación en dos pasos" action="Configurar" />
        <SecurityItem icon={Mail} label="Email de recuperación" desc="admin@intelicont.com" action="Cambiar" />
        <SecurityItem icon={Shield} label="Sesiones activas" desc="1 dispositivo conectado" action="Ver todas" />
      </div>
    </div>
  );
}

function SecurityItem({ icon: Icon, label, desc, action }: { icon: any; label: string; desc: string; action: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-gray-400" />
        <div>
          <p className="text-sm text-gray-900 dark:text-white">{label}</p>
          <p className="text-[10px] text-gray-400">{desc}</p>
        </div>
      </div>
      <button className="text-xs text-blue-500 hover:text-blue-400 font-medium no-tap-highlight">
        {action} <ChevronRight className="h-3 w-3 inline" />
      </button>
    </div>
  );
}

function AppearanceTab({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const themes = [
    { value: "light", label: "Claro", desc: "Fondo blanco, texto oscuro" },
    { value: "dark", label: "Oscuro", desc: "Fondo oscuro, texto claro" },
    { value: "system", label: "Sistema", desc: "Sigue la preferencia del SO" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
      <h2 className="text-base font-medium text-gray-900 dark:text-white">Apariencia</h2>
      <div className="space-y-2">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTheme(t.value as Theme)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors no-tap-highlight",
              theme === t.value
                ? "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20"
                : "bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <div className={cn(
              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
              theme === t.value ? "border-blue-500" : "border-gray-300 dark:border-gray-600"
            )}>
              {theme === t.value && <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</p>
              <p className="text-[10px] text-gray-400">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FormField({ label, value, type = "text", disabled = false }: { label: string; value: string; type?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        defaultValue={value}
        disabled={disabled}
        className={cn(
          "w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
    </div>
  );
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div className={cn(
      "relative h-5 w-9 rounded-full transition-colors cursor-pointer shrink-0",
      enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
    )}>
      <div className={cn(
        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
        enabled ? "left-[18px]" : "left-[2px]"
      )} />
    </div>
  );
}

const PROVIDERS = [
  {
    id:    "rules",
    label: "Reglas (gratis)",
    desc:  "Motor determinístico basado en el plan de cuentas DNIT. Sin API key. Siempre disponible.",
    color: "text-emerald-600 dark:text-emerald-400",
    free:  true,
    link:  null,
  },
  {
    id:    "gemini",
    label: "Google Gemini",
    desc:  "Gemini 1.5 Flash tiene capa gratuita generosa. Ideal para empezar.",
    color: "text-blue-600 dark:text-blue-400",
    free:  true,
    link:  "https://aistudio.google.com/app/apikey",
  },
  {
    id:    "openai",
    label: "OpenAI",
    desc:  "GPT-4o-mini es muy económico (~$0.15/1M tokens). Buena calidad.",
    color: "text-gray-700 dark:text-gray-300",
    free:  false,
    link:  "https://platform.openai.com/api-keys",
  },
  {
    id:    "ollama",
    label: "Ollama (local)",
    desc:  "Servidor Ollama local con modelos como Llama 3.2. Completamente gratis si tenés el hardware.",
    color: "text-amber-600 dark:text-amber-400",
    free:  true,
    link:  "https://ollama.ai",
  },
  {
    id:    "claude",
    label: "Claude (Anthropic)",
    desc:  "Claude Haiku es el más preciso para contabilidad, con razonamiento estructurado.",
    color: "text-violet-600 dark:text-violet-400",
    free:  false,
    link:  "https://console.anthropic.com/settings/keys",
  },
];

const DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  claude: "claude-haiku-4-5",
  ollama: "llama3.2",
  rules:  "",
};

const PROVIDER_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recomendado - Gratis)" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Avanzado)" },
  ],
  openai: [
    { value: "gpt-4o-mini", label: "GPT-4o-mini (Económico/Recomendado)" },
    { value: "gpt-4o", label: "GPT-4o (Avanzado)" },
  ],
  claude: [
    { value: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku (Recomendado)" },
    { value: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet (Avanzado)" },
  ],
  ollama: [
    { value: "llama3.2", label: "Llama 3.2" },
    { value: "deepseek-r1:1.5b", label: "DeepSeek R1 1.5B" },
    { value: "deepseek-r1:8b", label: "DeepSeek R1 8B" },
    { value: "mistral", label: "Mistral" },
  ],
};

function AITab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadAISettings().then((res) => {
      if (res.ok) {
        setSettings(res.data);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6 flex justify-center items-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const provider = settings["ai.provider"] ?? "rules";
  const info = PROVIDERS.find((p) => p.id === provider);

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleProviderChange(p: string) {
    setSettings((prev) => ({
      ...prev,
      "ai.provider": p,
      "ai.model": DEFAULT_MODELS[p] ?? "",
    }));
    setSaved(false);
  }

  async function handleSave() {
    setSaveError(null);
    setIsPending(true);
    try {
      const result = await saveAISettings(settings);
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setSaveError(result.error);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-base font-medium text-gray-900 dark:text-white mb-1">Configuración de Inteligencia Artificial</h2>
        <p className="text-xs text-gray-400">Gestioná el motor de IA para las sugerencias de asientos contables</p>
      </div>

      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
          La IA propone asientos contables automáticamente al ingresar un XML SIFEN. El contador siempre aprueba antes de postear.
          Podés cambiar el proveedor en cualquier momento sin perder datos.
        </p>
      </div>

      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Activar propuestas IA</p>
          <p className="text-[10px] text-gray-400">Deshabilitar usa solo el motor de reglas estático</p>
        </div>
        <button
          onClick={() => set("ai.enabled", settings["ai.enabled"] === "false" ? "true" : "false")}
          className="no-tap-highlight"
        >
          <Toggle enabled={settings["ai.enabled"] !== "false"} />
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Proveedor de IA</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleProviderChange(p.id)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all no-tap-highlight",
                provider === p.id
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10"
                  : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
              )}
            >
              <div className={cn(
                "h-3 w-3 rounded-full mt-0.5 shrink-0 border-2 transition-colors",
                provider === p.id ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
              )} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-semibold", p.color)}>{p.label}</span>
                  {p.free && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">GRATIS</span>}
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{p.desc}</p>
                {p.link && (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-1 font-medium">
                    Obtener API Key <ExternalLink className="h-2 w-2" />
                  </a>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {provider !== "rules" && (
        <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          {provider !== "ollama" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={settings["ai.api_key"] ?? ""}
                  onChange={(e) => set("ai.api_key", e.target.value)}
                  placeholder={`Pegá tu API key de ${info?.label ?? ""}`}
                  className="w-full px-3 py-2 pr-10 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                ⚠️ La clave se almacena en la base de datos de manera local/segura.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Modelo
              </label>
              {PROVIDER_MODELS[provider] ? (
                <select
                  value={settings["ai.model"] ?? DEFAULT_MODELS[provider] ?? ""}
                  onChange={(e) => set("ai.model", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
                >
                  {PROVIDER_MODELS[provider].map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={settings["ai.model"] ?? DEFAULT_MODELS[provider] ?? ""}
                  onChange={(e) => set("ai.model", e.target.value)}
                  placeholder={DEFAULT_MODELS[provider] ?? "nombre-del-modelo"}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
                />
              )}
            </div>

            {(provider === "ollama" || provider === "openai") && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  URL Base {provider === "ollama" ? "(servidor Ollama)" : "(override)"}
                </label>
                <input
                  type="text"
                  value={settings["ai.base_url"] ?? ""}
                  onChange={(e) => set("ai.base_url", e.target.value)}
                  placeholder={provider === "ollama" ? "http://localhost:11434" : "https://api.openai.com/v1"}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {saveError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {saveError}
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Configuración de IA guardada correctamente
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors no-tap-highlight disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Guardando…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Guardar Configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
}
