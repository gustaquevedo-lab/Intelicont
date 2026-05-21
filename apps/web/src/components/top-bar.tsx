"use client";

import { useState } from "react";
import {
  Search, Bell, Menu, ChevronDown, Sparkles,
  Calendar, TrendingUp, CheckCircle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onMenuToggle: () => void;
}

const notifications = [
  { id: 1, title: "Vencimiento IVA 104", desc: "Importadora del Este — Vence mañana", time: "Hace 2h", unread: true,  icon: Calendar,     color: "text-amber-500 bg-amber-50" },
  { id: 2, title: "Sugerencia IA lista", desc: "3 asientos pendientes de revisión",   time: "Hace 4h", unread: true,  icon: Sparkles,     color: "text-violet-500 bg-violet-50" },
  { id: 3, title: "Retención procesada", desc: "Frigocentral — RET IVA #445",         time: "Hace 6h", unread: false, icon: CheckCircle,  color: "text-secondary bg-secondary-50" },
];

export function TopBar({ onMenuToggle, onToggleSidebar, sidebarCollapsed }: TopBarProps) {
  const [showNotif, setShowNotif]   = useState(false);
  const [showUser, setShowUser]     = useState(false);
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 shadow-topbar shrink-0">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6 gap-4">

        {/* Left: hamburger + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Search */}
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

          {/* AI Assistant button */}
          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300 border border-violet-200/60 dark:border-violet-700/30 transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs">Asistente IA</span>
          </button>

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
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Notificaciones</h3>
                  <button onClick={() => setShowNotif(false)}>
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex gap-3 p-3.5 border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer",
                        n.unread && "bg-primary-50/40 dark:bg-primary-900/10"
                      )}
                    >
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

          {/* User menu */}
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
