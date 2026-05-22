"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Building2, FileText, BookOpen,
  Users, Settings, Calculator, Calendar,
  ChevronLeft, ChevronRight, X, LogOut, Receipt,
  BookMarked, Cpu, ClipboardList, Layers,
  BarChart3, CalendarDays, Stamp, HandCoins, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface RouteGroup {
  key:   string;
  label: string;
}

const GROUPS: RouteGroup[] = [
  { key: "inicio",   label: "Inicio"        },
  { key: "maestros", label: "Maestros"      },
  { key: "contable", label: "Contabilidad"  },
  { key: "estados",  label: "Est. Financieros" },
  { key: "fiscal",   label: "Fiscal"        },
  { key: "config",   label: "Configuración" },
];

const routes = [
  // ── Inicio ──────────────────────────────────────────────────────
  { label: "Panel General",          href: "/",               icon: LayoutDashboard, group: "inicio"   },
  // ── Maestros ─────────────────────────────────────────────────────
  { label: "Empresas",               href: "/empresas",       icon: Building2,       group: "maestros" },
  { label: "Clientes/Proveedores",   href: "/terceros",       icon: Users,           group: "maestros" },
  { label: "Timbrados DNIT",         href: "/timbrados",      icon: Stamp,           group: "maestros" },
  // ── Contabilidad ─────────────────────────────────────────────────
  { label: "Comprobantes SIFEN",     href: "/comprobantes",   icon: Receipt,         group: "contable" },
  { label: "Asientos",               href: "/asientos",       icon: FileText,        group: "contable" },
  { label: "Plan de Cuentas",        href: "/cuentas",        icon: Layers,          group: "contable" },
  { label: "Libro Mayor",            href: "/libros",         icon: BookOpen,        group: "contable" },
  { label: "Libro IVA",              href: "/libro-iva",      icon: BookMarked,      group: "contable" },
  { label: "Períodos Fiscales",      href: "/periodos",       icon: CalendarDays,    group: "contable" },
  // ── Estados Financieros ──────────────────────────────────────────
  { label: "Estados Financieros",    href: "/estados-financieros", icon: BarChart3,  group: "estados"  },
  // ── Fiscal ───────────────────────────────────────────────────────
  { label: "Formulario 104 IVA",     href: "/formulario104",  icon: ClipboardList,   group: "fiscal"   },
  { label: "Tesaka (Retenciones)",   href: "/tesaka",         icon: HandCoins,       group: "fiscal"   },
  { label: "Formulario 501 IRE",     href: "/formulario501",  icon: TrendingUp,      group: "fiscal"   },
  { label: "Calendario Fiscal",      href: "/calendario",     icon: Calendar,        group: "fiscal"   },
  { label: "Calculadora",            href: "/impuestos",      icon: Calculator,      group: "fiscal"   },
  // ── Config ───────────────────────────────────────────────────────
  { label: "Config. IA",             href: "/configuracion",  icon: Cpu,             group: "config"   },
  { label: "Configuración",          href: "/configuracion",  icon: Settings,        group: "config"   },
].filter((r, i, arr) => arr.findIndex((x) => x.href === r.href) === i); // dedupe

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const content = (
    <div className="flex flex-col h-full">

      {/* Logo area */}
      <div className={cn(
        "flex items-center border-b border-white/10 shrink-0",
        collapsed ? "justify-center p-4" : "justify-between px-5 py-4"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            {/* T-account isotipo */}
            <svg width="32" height="32" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="sbg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#1a6eff"/>
                  <stop offset="100%" stopColor="#104c91"/>
                </linearGradient>
              </defs>
              <rect width="44" height="44" rx="12" fill="url(#sbg)"/>
              <rect x="8"  y="13" width="28" height="3"   rx="1.5" fill="white"/>
              <rect x="20" y="13" width="3"  height="19"  rx="1.5" fill="white"/>
              <rect x="10" y="21" width="7"  height="2.5" rx="1.25" fill="rgba(255,255,255,0.75)"/>
              <rect x="10" y="26" width="5"  height="2.5" rx="1.25" fill="rgba(255,255,255,0.45)"/>
              <path d="M25.5 22.5 L28.5 26 L34.5 19" stroke="#00d46a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="38" cy="6" r="4" fill="#00a651"/>
            </svg>
            <div>
              <span className="text-white font-black text-lg leading-none">Inteli</span><span className="text-secondary-300 font-light text-lg leading-none">Cont</span>
            </div>
          </div>
        )}
        {collapsed && (
          <svg width="28" height="28" viewBox="0 0 44 44" fill="none">
            <rect width="44" height="44" rx="12" fill="rgba(255,255,255,0.15)"/>
            <rect x="8"  y="13" width="28" height="3"   rx="1.5" fill="white"/>
            <rect x="20" y="13" width="3"  height="19"  rx="1.5" fill="white"/>
            <rect x="10" y="21" width="7"  height="2.5" rx="1.25" fill="rgba(255,255,255,0.75)"/>
            <path d="M25.5 22.5 L28.5 26 L34.5 19" stroke="#00d46a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}

        {/* Collapse toggle — desktop only, shown when not collapsed */}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors hidden lg:flex"
            title="Colapsar sidebar"
          >
            <ChevronLeft className="h-4 w-4 text-white/60" />
          </button>
        )}

        {/* Mobile close */}
        <button onClick={onMobileClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors lg:hidden">
          <X className="h-4 w-4 text-white/60" />
        </button>
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-3 p-2 rounded-lg hover:bg-white/10 transition-colors hidden lg:flex"
          title="Expandir sidebar"
        >
          <ChevronRight className="h-4 w-4 text-white/60" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 mt-1">
        {GROUPS.map((group) => {
          const groupRoutes = routes.filter((r) => r.group === group.key);
          if (groupRoutes.length === 0) return null;
          return (
            <div key={group.key} className="mb-2">
              {/* Group label */}
              {!collapsed && (
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/30 select-none">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="my-1 border-t border-white/10" />}
              <div className="space-y-0.5">
                {groupRoutes.map((route) => {
                  const isActive = pathname === route.href || (route.href !== "/" && pathname.startsWith(route.href));
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => onMobileClose?.()}
                      title={collapsed ? route.label : undefined}
                      className={cn(
                        "nav-item",
                        isActive && "nav-item-active",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && !collapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-secondary rounded-r-full" />
                      )}
                      <route.icon className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-white/50"
                      )} />
                      {!collapsed && <span className="truncate">{route.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-white/10" />

      {/* User avatar */}
      <div className={cn(
        "p-3",
        collapsed && "flex justify-center"
      )}>
        <div className={cn(
          "flex items-center gap-3 p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors cursor-pointer",
          collapsed && "justify-center w-11 h-11 p-0"
        )}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary to-primary-300 flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm">
            CA
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">Contador Admin</p>
              <p className="text-white/50 text-[11px] truncate">Estudio Contable</p>
            </div>
          )}
        </div>
      </div>

      {/* Logout button */}
      <div className={cn("px-3 pb-4", collapsed && "flex justify-center")}>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm font-medium",
            collapsed && "justify-center w-11 h-11 p-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 w-72 sidebar-gradient shadow-sidebar z-50 transform transition-transform duration-300 lg:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {content}
      </div>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 sidebar-gradient shadow-sidebar transition-all duration-300 shrink-0",
        collapsed ? "w-[72px]" : "w-64"
      )}>
        {content}
      </aside>
    </>
  );
}
