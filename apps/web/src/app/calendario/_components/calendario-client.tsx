"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, Filter, AlertTriangle, CheckCircle2,
  Clock, ChevronDown, Building2, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUrgency, URGENCY_STYLES } from "@/lib/dnit-calendar";
import type { CalendarioData } from "../actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_ICONS: Record<string, string> = {
  "IVA 104":          "₲",
  "Hechauka":         "📋",
  "IRE General 500":  "📊",
  "IRE Simple 501":   "📄",
  "ReSimple 151":     "📝",
  "IRP 902":          "👤",
  "Aguinaldo":        "🎄",
};

function formatDate(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-PY", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
  });
}

function daysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(iso + "T12:00:00");
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function urgencyLabel(days: number): string {
  if (days < 0)   return `Vencida hace ${Math.abs(days)}d`;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `${days} días`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  data:    CalendarioData;
  dbError?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarioClient({ data, dbError }: Props) {
  const { obligaciones, entities } = data;

  const [filterEntity, setFilterEntity] = useState("todos");
  const [filterTipo,   setFilterTipo]   = useState("todos");
  const [filterView,   setFilterView]   = useState<"proximas" | "todas">("proximas");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = useMemo(() => {
    let list = obligaciones;
    if (filterEntity !== "todos") list = list.filter((o) => o.entityId === filterEntity);
    if (filterTipo   !== "todos") list = list.filter((o) => o.tipo     === filterTipo);
    if (filterView   === "proximas") {
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() + 30);
      list = list.filter((o) => new Date(o.dueDate + "T12:00:00") <= cutoff);
    }
    return list;
  }, [obligaciones, filterEntity, filterTipo, filterView]);

  // Stats
  const overdue  = obligaciones.filter((o) => daysUntil(o.dueDate) < 0).length;
  const thisWeek = obligaciones.filter((o) => { const d = daysUntil(o.dueDate); return d >= 0 && d <= 7; }).length;
  const thisMonth= obligaciones.filter((o) => { const d = daysUntil(o.dueDate); return d >= 0 && d <= 30; }).length;

  const tipoOptions = [...new Set(obligaciones.map((o) => o.tipo))].sort();

  // CSV export
  function handleExport() {
    const headers = ["Tipo", "Empresa", "RUC", "Vencimiento", "Días restantes"];
    const rows = filtered.map((o) => [
      o.tipo,
      `"${o.empresa.replace(/"/g, '""')}"`,
      o.ruc,
      o.dueDate,
      daysUntil(o.dueDate),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `calendario-fiscal-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="page-container">

      {/* DB Error */}
      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Error de base de datos: {dbError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Calendario Fiscal</h1>
          <p className="section-subtitle">Vencimientos DNIT · {new Date().getFullYear()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-ghost text-sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label:   "Vencidas",
            value:   overdue,
            icon:    AlertTriangle,
            accent:  "stat-card-amber",
            iconCls: "text-red-600 bg-red-100",
            valueCls: overdue > 0 ? "text-red-600" : "text-gray-900 dark:text-white",
          },
          {
            label:   "Esta semana",
            value:   thisWeek,
            icon:    Clock,
            accent:  "stat-card-amber",
            iconCls: "text-amber-600 bg-amber-100",
            valueCls: "text-gray-900 dark:text-white",
          },
          {
            label:   "Este mes",
            value:   thisMonth,
            icon:    CalendarDays,
            accent:  "stat-card-blue",
            iconCls: "text-primary bg-primary-100",
            valueCls: "text-gray-900 dark:text-white",
          },
        ].map((s) => (
          <div key={s.label} className="card overflow-hidden">
            <div className={cn("absolute inset-0 opacity-50 rounded-2xl", s.accent)} style={{ position: "absolute" }} />
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</span>
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", s.iconCls)}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className={cn("text-3xl font-black", s.valueCls)}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-flat overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-gray-100 dark:border-slate-700 flex-wrap">

          {/* View toggle */}
          <div className="flex gap-1.5">
            {([["proximas", "Próximas (30d)"], ["todas", "Todas"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilterView(key)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
                  filterView === key
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Entity filter */}
          {entities.length > 1 && (
            <div className="relative">
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="appearance-none input-field py-2 pr-8 text-xs cursor-pointer"
              >
                <option value="todos">Todas las empresas</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>{e.legalName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Obligation type filter */}
          <div className="relative">
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="appearance-none input-field py-2 pr-8 text-xs cursor-pointer"
            >
              <option value="todos">Todos los impuestos</option>
              {tipoOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="ml-auto text-xs text-gray-400 self-center font-medium">
            {filtered.length} obligación{filtered.length !== 1 ? "es" : ""}
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {filtered.map((ob, idx) => {
            const days    = daysUntil(ob.dueDate);
            const urgency = getUrgency(new Date(ob.dueDate + "T12:00:00"));
            const styles  = URGENCY_STYLES[urgency];
            const icon    = TIPO_ICONS[ob.tipo] ?? "📌";

            return (
              <div
                key={`${ob.entityId}-${ob.tipo}-${ob.dueDate}-${idx}`}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-gray-50/50 dark:hover:bg-slate-700/10 transition-colors",
                  styles.bg
                )}
              >
                {/* Left */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Dot + icon */}
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", styles.dot)} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Tipo + badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {icon} {ob.tipo}
                      </span>
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold border",
                        styles.badge
                      )}>
                        {urgencyLabel(days)}
                      </span>
                    </div>

                    {/* Empresa */}
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{ob.empresa}</span>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <span className="font-mono shrink-0">RUC {ob.ruc}</span>
                    </div>

                    {ob.regime && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{ob.regime}</p>
                    )}
                  </div>
                </div>

                {/* Right: date */}
                <div className="flex items-center gap-3 sm:justify-end shrink-0 pl-5 sm:pl-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                        {formatDate(ob.dueDate)}
                      </span>
                    </div>
                    {days >= 0 && (
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {days <= 5 ? (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-gray-300" />
                        )}
                        <span className={cn("text-xs font-semibold", styles.text)}>
                          {urgencyLabel(days)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <CalendarDays className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">
                {obligaciones.length === 0
                  ? "No hay empresas activas con régimen tributario configurado"
                  : "No hay obligaciones para el período seleccionado"}
              </p>
            </div>
          )}
        </div>

        {/* Footer note */}
        {filtered.length > 0 && (
          <div className="px-4 py-3 bg-gray-50/50 dark:bg-slate-800/20 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-400">
              ⚠️ Fechas estimadas según calendario DNIT {new Date().getFullYear()}. Verificar con el calendario oficial DNIT ante cambios de resolución.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
