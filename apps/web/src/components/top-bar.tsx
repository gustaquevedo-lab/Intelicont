"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, Bell, Menu, ChevronDown, Sparkles,
  Calendar, TrendingUp, CheckCircle, X,
  Sun, Moon, Monitor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type ThemeMode } from "@/components/theme-provider";

// ─── Theme Toggle ─────────────────────────────────────────────────────────────

const MODES: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
  { key: "light",  icon: Sun,     label: "Claro"   },
  { key: "dark",   icon: Moon,    label: "Oscuro"  },
  { key: "system", icon: Monitor, label: "Sistema" },
];

function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const current           = MODES.find((m) => m.key === mode) ?? MODES[2];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger pill */}
      <button
        onClick={() => setOpen(!open)}
        title={`Tema: ${current.label}`}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200",
          "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-600",
          "text-gray-600 dark:text-gray-300 hover:border-primary/40 hover:text-primary dark:hover:text-primary-300",
          open && "border-primary/50 text-primary dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20"
        )}
      >
        <current.icon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {/* Dropdown — three-option pill selector */}
      {open && (
        <div className="absolute right-0 top-11 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-card-hover p-1.5 min-w-[160px]">
            {/* Header */}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1 pb-2">
              Apariencia
            </p>

            {/* Options */}
            <div className="space-y-0.5">
              {MODES.map(({ key, icon: Icon, label }) => {
                const active = mode === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setMode(key); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-primary text-white shadow-primary"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-primary-300"
                    )}
                  >
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      active
                        ? "bg-white/20"
                        : key === "light"  ? "bg-amber-50  text-amber-500 dark:bg-amber-900/20"
                        : key === "dark"   ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                           : "bg-primary-50 text-primary dark:bg-primary-900/20 dark:text-primary-300"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="leading-tight font-semibold">{label}</p>
                      <p className={cn(
                        "text-[10px] leading-tight",
                        active ? "text-white/70" : "text-gray-400 dark:text-gray-500"
                      )}>
                        {key === "light"  ? "Siempre claro"
                        : key === "dark"  ? "Siempre oscuro"
                                          : "Según el SO"}
                      </p>
                    </div>
                    {active && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-white/80" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Brand footer */}
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 px-2 pb-1">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center font-medium">
                <span className="text-primary font-bold">Inteli</span>
                <span className="text-secondary font-light">Cont</span>
                {" "}· Ecosistema Inteli*
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

const notifications = [
  { id: 1, title: "Vencimiento IVA 104",  desc: "Importadora del Este — Vence mañana", time: "Hace 2h", unread: true,  icon: Calendar,    color: "text-amber-500 bg-amber-50 dark:bg-amber-900/20"    },
  { id: 2, title: "Sugerencia IA lista",  desc: "3 asientos pendientes de revisión",   time: "Hace 4h", unread: true,  icon: Sparkles,    color: "text-violet-500 bg-violet-50 dark:bg-violet-900/20" },
  { id: 3, title: "Retención procesada",  desc: "Frigocentral — RET IVA #445",         time: "Hace 6h", unread: false, icon: CheckCircle, color: "text-secondary bg-secondary-50 dark:bg-secondary-900/20" },
];

// ─── TopBar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?:  () => void;
  onMenuToggle:      () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const [showNotif, setShowNotif] = useState(false);
  const [showUser,  setShowUser]  = useState(false);
  const unread = notifications.filter((n) => n.unread).length;

  const closeAll = () => { setShowNotif(false); setShowUser(false); };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 shadow-topbar shrink-0">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 gap-4">

        {/* Left: hamburger + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empresas, asientos, formularios..."
              className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px] text-gray-500 dark:text-gray-400 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">

          {/* AI Assistant */}
          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300 border border-violet-200/60 dark:border-violet-700/30 transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Asistente IA</span>
          </button>

          {/* ── Theme Toggle ── */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotif(!showNotif); setShowUser(false); }}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Bell className="h-5 w-5 text-gray-500 dark:text-gray-300" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold leading-none">
                  {unread}
                </span>
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-card-hover overflow-hidden animate-fade-in z-50">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notificaciones</h3>
                  <button onClick={closeAll}><X className="h-4 w-4 text-gray-400 hover:text-gray-600" /></button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className={cn(
                      "flex gap-3 p-3.5 border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer",
                      n.unread && "bg-primary-50/40 dark:bg-primary-900/10"
                    )}>
                      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", n.color)}>
                        <n.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-900 dark:text-white text-sm font-semibold truncate">{n.title}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{n.desc}</p>
                        <p className="text-gray-400 text-[10px] mt-0.5">{n.time}</p>
                      </div>
                      {n.unread && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-gray-100 dark:border-slate-700">
                  <button className="w-full py-2 text-primary dark:text-primary-300 text-xs font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors">
                    Ver todas las notificaciones →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="relative">
            <button
              onClick={() => { setShowUser(!showUser); setShowNotif(false); }}
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary to-primary-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                CA
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
            </button>

            {showUser && (
              <div className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-card-hover overflow-hidden animate-fade-in z-50">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
                  <p className="text-gray-900 dark:text-white text-sm font-bold">Contador Admin</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">admin@estudio.com.py</p>
                </div>
                <div className="p-1.5">
                  {["Mi Perfil", "Configuración", "Ayuda y Soporte"].map((item) => (
                    <button key={item} className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors font-medium">
                      {item}
                    </button>
                  ))}
                </div>
                <div className="p-1.5 border-t border-gray-100 dark:border-slate-700">
                  <button className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
