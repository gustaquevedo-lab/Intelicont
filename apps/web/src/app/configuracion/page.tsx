"use client";

import { useState } from "react";
import {
  User, Settings, Bell, Shield, Palette, LogOut,
  Mail, Building2, BadgeCheck, ChevronRight, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import { useTheme, type Theme } from "@/lib/theme-context";

type SettingsTab = "profile" | "notifications" | "security" | "appearance";

export default function ProfilePage() {
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saved, setSaved] = useState(false);

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: "profile", label: "Perfil", icon: User },
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
                  {(user?.user_metadata?.name || user?.email || "U").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.user_metadata?.name || "Usuario"}</p>
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
          <FormField label="Nombre" value={user?.user_metadata?.name || ""} />
          <FormField label="Email" value={user?.email || ""} type="email" />
          <FormField label="Rol" value={user?.user_metadata?.role || ""} disabled />
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
