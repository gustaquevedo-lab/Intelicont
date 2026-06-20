"use client";

import { useState, useEffect } from "react";
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
  FileCode,
  CreditCard,
  BarChart3,
  Hash,
  X,
  LogOut,
  Menu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

const navGroups = [
  {
    title: "Gestión Principal",
    items: [
      { path: "/", icon: LayoutDashboard, label: "Panel General" },
      { path: "/sifen", icon: FileCode, label: "Carga SIFEN", highlight: true },
      { path: "/sifen/historial", icon: FileCode, label: "Historial SIFEN" },
      { path: "/empresas", icon: Building2, label: "Empresas" },
    ],
  },
  {
    title: "Contabilidad",
    items: [
      { path: "/asientos", icon: FileText, label: "Asientos Contables" },
      { path: "/cuentas", icon: Hash, label: "Plan de Cuentas" },
      { path: "/libros", icon: BookOpen, label: "Libros" },
      { path: "/terceros", icon: Users, label: "Clientes / Proveedores" },
    ],
  },
  {
    title: "Finanzas y Fiscal",
    items: [
      { path: "/banco", icon: CreditCard, label: "Conciliación Bancaria" },
      { path: "/calendario", icon: Calendar, label: "Calendario Fiscal" },
      { path: "/impuestos", icon: Calculator, label: "Impuestos" },
      { path: "/reportes", icon: BarChart3, label: "Reportes" },
    ],
  },
  {
    title: "Configuración",
    items: [
      { path: "/configuracion", icon: Settings, label: "Mi Estudio" },
    ],
  },
];

export function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <Logo size={collapsed ? "sm" : "md"} showSlogan={!collapsed} hideText={collapsed} dark={true} />
        <button
          onClick={onMobileClose}
          className="lg:hidden p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {!collapsed && (
              <h3 className="px-4 text-[10px] font-black text-blue-300/40 uppercase tracking-[0.2em] mb-4">
                {group.title}
              </h3>
            )}
            <div className="space-y-1.5">
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => onMobileClose?.()}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-[13px] font-bold",
                      isActive
                        ? "bg-white text-primary shadow-xl shadow-black/20 scale-[1.02]"
                        : "text-blue-100/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="shrink-0">
                      <Icon size={18} />
                    </div>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {!collapsed && item.highlight && (
                      <span className="ml-auto text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-secondary-light border border-white/10 font-black uppercase tracking-widest">
                        IA
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-white/5 space-y-4">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white font-black text-sm overflow-hidden shrink-0 shadow-inner">
              IC
            </div>
            <div className="text-sm flex-1 min-w-0">
              <p className="font-black text-white leading-tight truncate uppercase tracking-tighter">
                Contador
              </p>
              <p className="text-[10px] font-bold text-blue-200/50 truncate uppercase tracking-widest mt-0.5">
                Administrador
              </p>
            </div>
          </div>
        )}
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-blue-200/50 hover:text-white hover:bg-white/10 transition-all border border-white/5">
          <LogOut size={14} />
          {!collapsed && "Cerrar Sesión"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col sidebar-gradient text-white shadow-2xl transition-all duration-300 ease-in-out relative",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[150] w-64 sidebar-gradient text-white flex flex-col shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
