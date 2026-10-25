"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  Sparkles,
  Calendar,
  Sun,
  Moon,
  Monitor,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Building2,
  Check,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, Theme } from "@/lib/theme-context";
import { useAuthStore, useCurrentUser } from "@/lib/auth-store";
import { useNotificationStore } from "@/lib/notification-store";
import { DEFAULT_SUPERADMIN_EMAILS } from "@/lib/superadmin-constants";
import { api } from "@/trpc/client";
import { OBLIGATION_HREF, OBLIGATION_NAME, noticeLabel } from "@/lib/fiscal-calendar";
import { Logo } from "./logo";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

export function TopBar({
  onMenuToggle,
  onCommandPalette,
  onAiToggle,
}: {
  onMenuToggle: () => void;
  onCommandPalette: () => void;
  onAiToggle?: () => void;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { selectedEntity, availableEntities, selectEntity } = useAuthStore();
  const { user, logout } = useCurrentUser();
  const readIds = useNotificationStore((s) => s.readIds);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  // Real fiscal notices (7/3/1 days and overdue) of the active entity; one per obligation/period/level.
  const upcoming = api.fiscal.upcoming.useQuery({ entityId: selectedEntity?.id ?? "", days: 7 }, { enabled: !!selectedEntity });
  const notifications = (upcoming.data?.items ?? [])
    .filter((i) => i.level)
    .map((i) => ({
      id: `${selectedEntity?.id}:${i.obligation}:${i.period}:${i.level}`,
      title: OBLIGATION_NAME[i.obligation] ?? i.obligation,
      description: `Período ${i.period} — ${noticeLabel(i.daysLeft)}`,
      daysLeft: i.daysLeft,
      level: i.level,
      href: OBLIGATION_HREF[i.obligation],
      read: readIds.includes(`${selectedEntity?.id}:${i.obligation}:${i.period}:${i.level}`),
    }));
  const superadminAccess = api.superadmin.checkAccess.useQuery(undefined, {
    enabled: !!user,
    retry: false,
    staleTime: 60_000,
  });
  const isSuperadmin =
    superadminAccess.data?.isSuperadmin ??
    Boolean(
      user?.email &&
      DEFAULT_SUPERADMIN_EMAILS.includes(user.email.toLowerCase().trim())
    );

  const unreadCount = notifications.filter((n) => !n.read).length;
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
                            selectEntity(entity);
                            setShowEntityPicker(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors no-tap-highlight",
                            selectedEntity.id === entity.id
                              ? "bg-blue-50 dark:bg-blue-500/10"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            selectedEntity.id === entity.id
                              ? "bg-blue-100 dark:bg-blue-500/20"
                              : "bg-gray-100 dark:bg-gray-800"
                          )}>
                            <Building2 className={cn(
                              "h-4 w-4",
                              selectedEntity.id === entity.id
                                 ? "text-primary shadow-lg shadow-primary/20"
                                : "text-gray-400"
                            )} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "text-sm font-black truncate uppercase tracking-tight",
                              selectedEntity.id === entity.id
                                ? "text-primary"
                                : "text-gray-900 dark:text-white"
                            )}>
                              {entity.tradeName || entity.legalName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold">
                              RUC {entity.ruc}
                            </p>
                          </div>
                          {selectedEntity.id === entity.id && (
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
          <div className="flex items-center gap-1.5">
            {/* Quick AI button */}
            <button
              onClick={onAiToggle}
              title="Abrir Copilot Contable (⌘J)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-600/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-600/20 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold">Copilot IA</span>
              <kbd className="hidden lg:inline-flex items-center px-1 py-0.2 bg-purple-200/50 dark:bg-purple-900/40 rounded text-[9px] font-mono text-purple-700 dark:text-purple-300">
                ⌘J
              </kbd>
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
                      {notifications.length === 0 && (
                        <p className="p-4 text-xs text-gray-400">Sin vencimientos en los próximos 7 días.</p>
                      )}
                      {notifications.map((n) => (
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
                              (n.level === "overdue" || n.level === "1") && "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
                              (n.level === "3" || n.level === "7") && "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                            )}>
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-gray-900 dark:text-white text-sm font-medium truncate">{n.title}</p>
                                <span className={cn("text-[10px] shrink-0", n.level === "overdue" || n.level === "1" ? "text-red-500 font-medium" : "text-gray-400")}>
                                  {n.level === "overdue" ? "vencido" : `${n.daysLeft}d`}
                                </span>
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{n.description}</p>
                              {n.href && (
                                <a href={n.href} className="inline-block mt-1 text-[10px] text-blue-500 hover:text-blue-400 font-medium">
                                  Preparar →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-gray-200 dark:border-gray-800">
                      <button
                        onClick={() => { markAllRead(notifications.map((n) => n.id)); setShowNotifications(false); }}
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
                  <span className="text-white font-black text-[10px] uppercase">{user?.name?.substring(0, 2) || "IC"}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 top-10 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl shadow-black/20 dark:shadow-black/50 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-gray-900 dark:text-white text-sm font-medium">{user?.name || "Usuario"}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{user?.email || ""}</p>
                    </div>
                    {isSuperadmin && (
                      <div className="p-1 border-b border-gray-200 dark:border-gray-800 bg-amber-500/5">
                        <Link
                          href="/superadmin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                        >
                          <Shield className="h-4 w-4 text-amber-500" />
                          Consola Superadmin
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-600 dark:text-amber-300 font-black">
                            ROOT
                          </span>
                        </Link>
                      </div>
                    )}
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
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          setShowUserMenu(false);
                          await logout();
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                      </button>
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
