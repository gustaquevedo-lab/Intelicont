"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  FileText,
  BookOpen,
  Users,
  Settings,
  Calculator,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  { label: "Panel General", href: "/", icon: LayoutDashboard },
  { label: "Empresas", href: "/empresas", icon: Building2 },
  { label: "Asientos", href: "/asientos", icon: FileText },
  { label: "Libros", href: "/libros", icon: BookOpen },
  { label: "Clientes/Proveedores", href: "/terceros", icon: Users },
  { label: "Calendario Fiscal", href: "/calendario", icon: Calendar },
  { label: "Calculadora Impuestos", href: "/impuestos", icon: Calculator },
  { label: "Configuración", href: "/configuracion", icon: Settings },
];

export function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: { collapsed?: boolean; onToggle?: () => void; mobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-sm">IC</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-white font-semibold text-base leading-tight">Intelicont</h2>
              <p className="text-zinc-500 text-[10px] uppercase tracking-wider">SaaS Contable</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => onMobileClose?.()}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative",
                isActive
                  ? "bg-blue-600/10 text-blue-400 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
              )}
              <route.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300")} />
              {!collapsed && <span className="truncate">{route.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <div className={cn("flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800", collapsed && "justify-center px-2")}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
            <span className="text-white font-medium text-xs">CA</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Contador Admin</p>
              <p className="text-zinc-500 text-[10px] truncate">Estudio Contable</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-72 bg-zinc-950 border-r border-zinc-800 z-50 transform transition-transform duration-300 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="absolute top-4 right-4">
          <button onClick={onMobileClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 border-r border-zinc-800 bg-zinc-950 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-72"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
