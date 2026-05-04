"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  Sparkles,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    { id: 1, title: "Vencimiento IVA 104", desc: "Importadora del Este — Vence mañana", time: "Hace 2h", unread: true, icon: Calendar },
    { id: 2, title: "Sugerencia IA lista", desc: "3 asientos pendientes de revisión", time: "Hace 4h", unread: true, icon: Sparkles },
    { id: 3, title: "Retención procesada", desc: "Frigocentral — RET IVA #445", time: "Hace 6h", unread: false, icon: TrendingUp },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-zinc-400" />
          </button>

          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar empresas, asientos, formularios..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-500 font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Quick AI button */}
          <button className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-600/20 transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-xs">Asistente IA</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5 text-zinc-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                <div className="p-3 border-b border-zinc-800">
                  <h3 className="text-white text-sm font-medium">Notificaciones</h3>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer",
                        notif.unread && "bg-blue-500/5"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          notif.unread ? "bg-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-400"
                        )}>
                          <notif.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{notif.title}</p>
                          <p className="text-zinc-500 text-xs truncate">{notif.desc}</p>
                          <p className="text-zinc-600 text-[10px] mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-zinc-800">
                  <button className="w-full py-1.5 text-zinc-400 text-xs hover:text-white transition-colors">
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-medium text-[10px]">CA</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                <div className="p-3 border-b border-zinc-800">
                  <p className="text-white text-sm font-medium">Contador Admin</p>
                  <p className="text-zinc-500 text-xs">admin@estudiocontable.com.py</p>
                </div>
                <div className="p-1">
                  {["Mi Perfil", "Configuración", "Ayuda"].map((item) => (
                    <button
                      key={item}
                      className="w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="p-1 border-t border-zinc-800">
                  <button className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
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
