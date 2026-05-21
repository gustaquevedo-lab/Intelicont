"use client";

import { useState } from "react";
import {
  Building2, Plus, AlertTriangle, TrendingUp, Clock,
  Search, Sparkles, ArrowUpRight, ArrowDownRight,
  CalendarClock, ChevronRight, BarChart3, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { DashboardStats, DashboardEntity } from "@/app/dashboard-actions";

// ─── Palette for entity avatars (deterministic by index) ──────────────────────
const GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-amber-500 to-orange-600",
  "from-secondary to-secondary-dark",
  "from-cyan-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-indigo-700",
  "from-emerald-500 to-green-700",
];

// Static upcoming obligations (placeholder — no obligations table yet)
const MOCK_OBLIGACIONES = [
  { id: 1, empresa: "Importadora del Este",   tipo: "IVA 104",    fecha: "2026-06-12", estado: "Pendiente",    urgencia: "high"     },
  { id: 2, empresa: "Consultora del Paraguay", tipo: "IRE 501v2", fecha: "2026-06-15", estado: "En proceso",   urgencia: "medium"   },
  { id: 3, empresa: "Distribuidora Central",   tipo: "Hechauka",  fecha: "2026-06-10", estado: "Vence pronto", urgencia: "critical" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  stats:    DashboardStats;
  empresas: DashboardEntity[];
  dbError?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardClient({ stats, empresas, dbError }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = empresas.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ruc.includes(searchTerm)
  );

  const statCards = [
    {
      title:     "Empresas Activas",
      value:     String(stats.activeEntities),
      change:    `${stats.activeEntities} en el sistema`,
      trend:     "up" as const,
      icon:      Building2,
      accent:    "stat-card-blue",
      iconColor: "text-primary bg-primary-100",
    },
    {
      title:     "Asientos Borradores",
      value:     String(stats.draftsTotal),
      change:    stats.draftsTotal > 0 ? "Requieren atención" : "Todo al día",
      trend:     stats.draftsTotal > 0 ? "warn" as const : "up" as const,
      icon:      AlertTriangle,
      accent:    "stat-card-amber",
      iconColor: "text-amber-600 bg-amber-100",
    },
    {
      title:     "Asientos Este Mes",
      value:     String(stats.postedThisMonth),
      change:    "Posteados en el período",
      trend:     "up" as const,
      icon:      TrendingUp,
      accent:    "stat-card-green",
      iconColor: "text-secondary bg-secondary-100",
    },
    {
      title:     "Total Asientos",
      value:     stats.totalEntries.toLocaleString("es-PY"),
      change:    "En libro diario",
      trend:     "up" as const,
      icon:      FileText,
      accent:    "stat-card-purple",
      iconColor: "text-violet-600 bg-violet-100",
    },
  ];

  return (
    <div className="page-container">

      {/* ── DB Error ─────────────────────────────────────────────────────────── */}
      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Error de base de datos: {dbError}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Panel General</h1>
          <p className="section-subtitle">
            Resumen de tu estudio contable · {new Date().toLocaleDateString("es-PY", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Sugerencias IA
          </button>
          <Link href="/empresas" className="btn-secondary text-sm">
            <Plus className="h-4 w-4" />
            Nueva Empresa
          </Link>
        </div>
      </div>

      {/* ── KPI Stats ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="card overflow-hidden group">
            <div className={cn("absolute inset-0 opacity-60 rounded-2xl", stat.accent)} style={{ position: "absolute" }} />
            <div className="relative p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{stat.title}</span>
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", stat.iconColor)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">{stat.value}</p>
              <div className="flex items-center gap-1">
                {stat.trend === "up"   && <ArrowUpRight  className="h-3.5 w-3.5 text-secondary shrink-0" />}
                {stat.trend === "warn" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                <span className={cn(
                  "text-xs font-medium",
                  stat.trend === "warn" ? "text-amber-600" : "text-secondary-dark"
                )}>
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Obligaciones (placeholder) ──────────────────────────────────── */}
        <div className="lg:col-span-1 card-flat overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">Obligaciones Próximas</h2>
            </div>
            <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5">
              Ver todas <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {MOCK_OBLIGACIONES.map((ob) => {
              const colors = ({
                critical: { dot: "bg-red-500 animate-pulse", text: "text-red-600",   bg: "bg-red-50 dark:bg-red-900/10" },
                high:     { dot: "bg-amber-500",             text: "text-amber-600", bg: "" },
                medium:   { dot: "bg-primary",               text: "text-primary",   bg: "" },
              } as Record<string, { dot: string; text: string; bg: string }>)[ob.urgencia] ?? { dot: "bg-gray-400", text: "text-gray-500", bg: "" };

              return (
                <div key={ob.id} className={cn("flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/20 transition-colors cursor-pointer", colors.bg)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", colors.dot)} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{ob.tipo}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{ob.empresa}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-gray-700 dark:text-gray-300 text-xs font-mono">{ob.fecha}</p>
                    <p className={cn("text-xs font-semibold", colors.text)}>{ob.estado}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bar chart placeholder */}
          <div className="px-5 py-4 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-500">Vencimientos próximos 30 días</span>
            </div>
            <div className="flex items-end gap-1 h-8">
              {[3,5,2,7,4,6,3,8,5,4,9,6,3,5,2].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${(v / 9) * 100}%`,
                    background: v > 6 ? "#ef4444" : v > 4 ? "#f59e0b" : "#104c91",
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Empresas ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 card-flat overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                Empresas del Estudio
              </h2>
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {filtered.map((empresa, idx) => (
              <div key={empresa.id} className="flex items-center justify-between px-5 py-3.5 table-row-hover gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm bg-gradient-to-br",
                    GRADIENTS[idx % GRADIENTS.length]
                  )}>
                    {empresa.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{empresa.name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      RUC: {empresa.ruc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold",
                    empresa.status === "active"   ? "badge-green"  :
                    empresa.status === "inactive" ? "badge-gray"   :
                                                    "badge-yellow"
                  )}>
                    {empresa.status === "active" ? "Activa" : empresa.status === "inactive" ? "Inactiva" : empresa.status}
                  </span>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Sin resultados</p>
              </div>
            )}
          </div>

          {/* Footer link */}
          <div className="px-5 py-3 border-t border-gray-100 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/20">
            <Link
              href="/empresas"
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              Ver todas las empresas <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Quick link to asientos ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/asientos",     label: "Asientos Contables",   icon: FileText,    desc: "Libro diario, crear y postear" },
          { href: "/libros",       label: "Libro Mayor",          icon: TrendingUp,  desc: "Consultar saldos y movimientos" },
          { href: "/calendario",   label: "Calendario Fiscal",    icon: CalendarClock, desc: "Vencimientos DNIT" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group"
          >
            <div className="h-10 w-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-colors">
              <link.icon className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{link.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
