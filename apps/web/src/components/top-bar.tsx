"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  Sparkles,
  Calendar,
  TrendingUp,
  Sun,
  Moon,
  Monitor,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Building2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, Theme } from "@/lib/theme-context";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import { useNotificationStore } from "@/lib/notification-store";
import { Logo } from "./logo";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function TopBar({ onMenuToggle, onCommandPalette }: { onMenuToggle: () => void; onCommandPalette: () => void }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user } = useUser();
  const { entities: availableEntities, selectedEntity, selectEntity } = useEntity(user?.id);
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentThemeIcon = themeOptions.find((t) => t.value === theme)?.icon || Moon;
  const ThemeIcon = currentThemeIcon;

  return (
    <>
      <header className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 sm:px-8 py-3 sm:py-5 sticky top-0 z-[80]">
        <div className="flex justify-between items-center gap-4">
          {/* Left: Menu + Page title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
            <Logo size="sm" className="lg:hidden" />

            {/* Desktop search */}
            <button
              onClick={onCommandPalette}
              className="relative w-full max-w-md hidden sm:flex items-center cursor-text"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <div className="w-full pl-10 pr-16 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-400 dark:text-gray-500 text-left">
                Buscar empresas, asientos, formularios...
              </div>
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-[10px] text-gray-500 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Mobile search button */}
            <button
              onClick={onCommandPalette}
              className="sm:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Search className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Center: Entity Switcher */}
          {selectedEntity && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowEntityPicker(!showEntityPicker)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors no-tap-highlight"
              >
                <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-black text-gray-900 dark:text-white leading-tight truncate max-w-[140px] uppercase tracking-tight">
                    {selectedEntity.tradeName || selectedEntity.legalName}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-tight">
                    RUC {selectedEntity.ruc}
                  </p>
                </div>
                <ChevronDown className="h-3 w-3 text-gray-400 shrink-0" />
              </button>

              {showEntityPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowEntityPicker(false)} />
                  <div className="absolute left-1/2 -translate-x-1/2 top-10 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
                        Cambiar Empresa
                      </p>
                    </div>
                    <div className="p-1 max-h-60 overflow-y-auto">
                      {availableEntities.map((entity) => (
                        <button
                          key={entity.id}
                          onClick={() => {
                            selectEntity(entity.id);
                            setShowEntityPicker(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors no-tap-highlight",
                            selectedEntity?.id === entity.id
                              ? "bg-blue-50 dark:bg-blue-500/10"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            selectedEntity?.id === entity.id
                              ? "bg-blue-100 dark:bg-blue-500/20"
                              : "bg-gray-100 dark:bg-gray-800"
                          )}>
                            <Building2 className={cn(
                              "h-4 w-4",
                              selectedEntity?.id === entity.id
                                 ? "text-primary shadow-lg shadow-primary/20"
                                : "text-gray-400"
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "text-sm font-black truncate uppercase tracking-tight",
                              selectedEntity?.id === entity.id
                                ? "text-primary"
                                : "text-gray-900 dark:text-white"
                            )}>
                              {entity.tradeName || entity.legalName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold">
                              RUC {entity.ruc}
                            </p>
                          </div>
                          {selectedEntity?.id === entity.id && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Quick AI button */}
            <button className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-600/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-600/20 transition-colors">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs">IA</span>
            </button>

            {/* Theme toggle */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Cambiar tema"
              >
                <ThemeIcon className="h-4.5 w-4.5 text-gray-500 dark:text-gray-400" />
              </button>

              {showThemeMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                  <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden z-50">
                    <div className="p-2 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">Tema</p>
                    </div>
                    <div className="p-1">
                      {themeOptions.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setTheme(opt.value);
                              setShowThemeMenu(false);
                            }}
                            className={cn(
                              "flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors",
                              theme === opt.value
                                ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{opt.label}</span>
                            {theme === opt.value && (
                              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-10 w-80 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                      <h3 className="text-gray-900 dark:text-white text-sm font-medium">Notificaciones</h3>
                      <span className="text-xs text-blue-500 dark:text-blue-400">{unreadCount} nuevas</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={cn(
                            "p-3 border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer",
                            !n.read && "bg-blue-50 dark:bg-blue-500/5"
                          )}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                              n.urgency === "critical" && "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
                              n.urgency === "warning" && "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
                              n.urgency === "info" && "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                            )}>
                              {n.type === "iva" && <Calendar className="h-4 w-4" />}
                              {n.type === "sifen" && <Sparkles className="h-4 w-4" />}
                              {n.type === "ire" && <TrendingUp className="h-4 w-4" />}
                              {n.type !== "iva" && n.type !== "sifen" && n.type !== "ire" && <Calendar className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{n.title}</p>
                                <span className={cn("text-[10px] shrink-0", n.urgency === "critical" ? "text-red-500 font-medium" : "text-gray-400")}>
                                  {n.daysLeft}d
                                </span>
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{n.entityName} — {n.description}</p>
                              {n.action && (
                                <a href={n.action.href} className="inline-block mt-1 text-[10px] text-blue-500 hover:text-blue-400 font-medium">
                                  {n.action.label} →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                      <button
                        onClick={() => { markAllRead(); setShowNotifications(false); }}
                        className="w-full py-1.5 text-gray-500 dark:text-gray-400 text-xs hover:text-gray-900 dark:hover:text-white transition-colors">
                        Marcar todo como leído
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-white font-black text-[10px] uppercase">{(user?.user_metadata?.name || user?.email || "IC").substring(0, 2).toUpperCase()}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-10 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-gray-900 dark:text-white text-sm font-medium">{user?.user_metadata?.name || "Usuario"}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{user?.email || ""}</p>
                    </div>
                    <div className="p-1">
                      {[
                        { icon: User, label: "Mi Perfil" },
                        { icon: Settings, label: "Configuración" },
                        { icon: HelpCircle, label: "Ayuda" },
                      ].map((item) => (
                        <button
                          key={item.label}
                          className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <div className="p-1 border-t border-gray-200 dark:border-gray-800">
          <a
            href="/auth/signout"
            onClick={() => setShowUserMenu(false)}
            className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </a>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
