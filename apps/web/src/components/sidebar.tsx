"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

const routes = [
  {
    label: "Panel General",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Empresas",
    href: "/empresas",
    icon: Building2,
  },
  {
    label: "Asientos",
    href: "/asientos",
    icon: FileText,
  },
  {
    label: "Libros",
    href: "/libros",
    icon: BookOpen,
  },
  {
    label: "Clientes/Proveedores",
    href: "/terceros",
    icon: Users,
  },
  {
    label: "Calendario Fiscal",
    href: "/calendario",
    icon: Calendar,
  },
  {
    label: "Calculadora Impuestos",
    href: "/impuestos",
    icon: Calculator,
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 border-r border-zinc-800 bg-zinc-950 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">IC</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg leading-tight">Intelicont</h2>
            <p className="text-zinc-500 text-xs">SaaS Contable AI-First</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                isActive
                  ? "bg-zinc-800 text-white font-medium shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              )}
            >
              <route.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              <span>{route.label}</span>
              {isActive && (
                <ChevronRight className="h-3 w-3 ml-auto text-zinc-500" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">CA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">Contador Admin</p>
            <p className="text-zinc-500 text-xs truncate">Estudio Contable PY</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
