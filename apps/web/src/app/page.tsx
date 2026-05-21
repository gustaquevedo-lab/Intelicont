"use client";

import { useState } from "react";
import {
  Building2, Plus, AlertTriangle, TrendingUp, Clock,
  Search, Sparkles, ArrowUpRight, ArrowDownRight,
  CalendarClock, ChevronRight, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const mockEmpresas = [
  { id: 1, ruc: "80012345-1", nombre: "Importadora del Este S.A.", regimen: "IVA General / IRE General", estado: "Activa",     vencimientos: 2, initials: "IE", color: "from-blue-500 to-blue-700" },
  { id: 2, ruc: "80023456-2", nombre: "Tecnología Asunción SRL",   regimen: "IVA General / IRE Simple",  estado: "Activa",     vencimientos: 1, initials: "TA", color: "from-violet-500 to-violet-700" },
  { id: 3, ruc: "80034567-3", nombre: "Distribuciones Ñandutí SA", regimen: "IVA General / IRE General", estado: "Por vencer", vencimientos: 4, initials: "DN", color: "from-amber-500 to-orange-600" },
  { id: 4, ruc: "80045678-4", nombre: "Consultora Guaraní SRL",    regimen: "ReSimple",                  estado: "Activa",     vencimientos: 0, initials: "CG", color: "from-secondary to-secondary-dark" },
  { id: 5, ruc: "80056789-5", nombre: "Frigorífico Central SA",    regimen: "Exportador / IVA General",  estado: "Activa",     vencimientos: 3, initials: "FC", color: "from-cyan-500 to-teal-600" },
  { id: 6, ruc: "80067890-6", nombre: "Constructora Pilcomayo",    regimen: "IRE General",               estado: "Cerrada",    vencimientos: 0, initials: "CP", color: "from-gray-400 to-gray-500" },
];

const mockObligaciones = [
  { id: 1, empresa: "Importadora del Este", tipo: "IVA 104",   fecha: "2026-05-12", estado: "Pendiente",   urgencia: "high"   },
  { id: 2, empresa: "Tecnología Asunción",  tipo: "IRE 501v2", fecha: "2026-05-15", estado: "En proceso",  urgencia: "medium" },
  { id: 3, empresa: "Distribuciones Ñandutí", tipo: "Hechauka", fecha: "2026-05-10", estado: "Vence pronto", urgencia: "critical" },
];

const stats = [
  {
    title: "Empresas Activas",
    value: "15",
    change: "+2 este mes",
    trend: "up",
    icon: Building2,
    accent: "stat-card-blue",
    iconColor: "text-primary bg-primary-100",
  },
  {
    title: "Obligaciones Pendientes",
    value: "7",
    change: "3 vencen esta semana",
    trend: "warn",
    icon: AlertTriangle,
    accent: "stat-card-amber",
    iconColor: "text-amber-600 bg-amber-100",
  },
  {
    title: "Asientos Procesados",
    value: "1.240",
    change: "+18% vs mes anterior",
    trend: "up",
    icon: TrendingUp,
    accent: "stat-card-green",
    iconColor: "text-secondary bg-secondary-100",
  },
  {
    title: "Tiempo Cierre Prom.",
    value: "2.4h",
    change: "−35% vs mes anterior",
    trend: "down_good",
    icon: Clock,
    accent: "stat-card-purple",
    iconColor: "text-violet-600 bg-violet-100",
  },
];

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = mockEmpresas.filter(
    (e) =>
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ruc.includes(searchTerm)
  );

  return (
    <div className="page-container">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Panel General</h1>
          <p className="section-subtitle">Resumen de tu estudio contable · Mayo 2026</p>
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

      {/* ── KPI Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.title} className="card overflow-hidden group">
            <div className={cn("absolute inset-0 opacity-60 rounded-2xl", stat.accent)} style={{ position: 'absolute' }} />
            <div className="relative p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{stat.title}</span>
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", stat.iconColor)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white mb-2">{stat.value}</p>
              <div className="flex items-center gap-1">
                {stat.trend === "up"       && <ArrowUpRight   className="h-3.5 w-3.5 text-secondary shrink-0" />}
                {stat.trend === "warn"     && <AlertTriangle  className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                {stat.trend === "down_good"&& <ArrowDownRight className="h-3.5 w-3.5 text-secondary shrink-0" />}
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

      {/* ── Main grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Obligaciones */}
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
            {mockObligaciones.map((ob) => {
              const colors = {
                critical: { dot: "bg-red-500 animate-pulse", text: "text-red-600", bg: "bg-red-50 dark:bg-red-900/10" },
                high:     { dot: "bg-amber-500",             text: "text-amber-600", bg: "" },
                medium:   { dot: "bg-primary",               text: "text-primary",   bg: "" },
              }[ob.urgencia] ?? { dot: "bg-gray-400", text: "text-gray-500", bg: "" };

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

          {/* Mini chart placeholder */}
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
                    background: v > 6 ? '#ef4444' : v > 4 ? '#f59e0b' : '#104c91',
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Empresas */}
        <div className="lg:col-span-2 card-flat overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">Empresas del Estudio</h2>
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
            {filtered.map((empresa) => (
              <div
                key={empresa.id}
                className="flex items-center justify-between px-5 py-3.5 table-row-hover gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm bg-gradient-to-br",
                    empresa.color
                  )}>
                    {empresa.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{empresa.nombre}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      RUC: {empresa.ruc}
                      <span className="text-gray-300 dark:text-gray-600 mx-1.5">·</span>
                      <span className="hidden sm:inline">{empresa.regimen}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {empresa.vencimientos > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800/30">
                      <AlertTriangle className="h-3 w-3" />
                      {empresa.vencimientos}
                    </span>
                  )}
                  <span className={cn(
                    "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold",
                    empresa.estado === "Activa"     ? "badge-green"  :
                    empresa.estado === "Por vencer" ? "badge-yellow" :
                                                      "badge-gray"
                  )}>
                    {empresa.estado}
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
        </div>
      </div>
    </div>
  );
}
