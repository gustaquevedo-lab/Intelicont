"use client";

import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Filter,
  ArrowRight,
  Check,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getFiscalObligations,
  getCalendarStats,
  getObligationLabel,
  getObligationColor,
  getUrgencyBorder,
  getUrgencyBadge,
  getUrgencyLabel,
} from "@/lib/fiscal-calendar";
import type { FiscalObligation, ObligationType } from "@/lib/fiscal-calendar";

const TODAY = "2026-05-04";
const CURRENT_MONTH = 4;
const CURRENT_YEAR = 2026;

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function CalendarioPage() {
  const obligations = useMemo(() => getFiscalObligations(), []);
  const [viewMonth, setViewMonth] = useState(CURRENT_MONTH);
  const [viewYear, setViewYear] = useState(CURRENT_YEAR);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredObligations = useMemo(() => {
    return obligations.filter((o) => {
      const matchesType = typeFilter === "all" || o.type === typeFilter;
      const matchesCompany = companyFilter === "all" || o.entity === companyFilter;
      return matchesType && matchesCompany;
    });
  }, [obligations, typeFilter, companyFilter]);

  const stats = useMemo(() => getCalendarStats(filteredObligations), [filteredObligations]);

  const companies = useMemo(() => [...new Set(obligations.map((o) => o.entity))], [obligations]);
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    obligations.forEach((o) => { counts[o.type] = (counts[o.type] || 0) + 1; });
    return counts;
  }, [obligations]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return days;
  }, [viewYear, viewMonth]);

  const obligationsByDate = useMemo(() => {
    const map: Record<string, FiscalObligation[]> = {};
    filteredObligations.forEach((o) => {
      const date = o.dueDate;
      if (!map[date]) map[date] = [];
      map[date].push(o);
    });
    return map;
  }, [filteredObligations]);

  const upcomingObligations = useMemo(() => {
    return filteredObligations
      .filter((o) => o.status !== "completed")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 8);
  }, [filteredObligations]);

  const selectedObligations = selectedDate
    ? (obligationsByDate[selectedDate] || [])
    : [];

  const navigateMonth = (dir: number) => {
    const newMonth = viewMonth + dir;
    if (newMonth > 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else if (newMonth < 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth(newMonth);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Calendario Fiscal</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Obligaciones DNIT — {stats.urgent} urgentes, {stats.overdue} vencidas
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors no-tap-highlight">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Configurar Alertas</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard title="Total Obligaciones" value={stats.total.toString()} icon={CalendarIcon} />
        <StatCard title="Pendientes" value={stats.pending.toString()} icon={Clock} color="text-yellow-500 dark:text-yellow-400" />
        <StatCard title="Urgentes" value={stats.urgent.toString()} icon={AlertTriangle} color="text-red-500 dark:text-red-400" />
        <StatCard title="Vencidas" value={stats.overdue.toString()} icon={AlertTriangle} color="text-red-600 dark:text-red-500" />
        <StatCard title="Deuda Pendiente" value={`₲ ${(stats.totalAmount / 1000000).toFixed(1)}M`} icon={TrendingUp} color="text-gray-900 dark:text-white" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors border no-tap-highlight",
            showFilters || typeFilter !== "all" || companyFilter !== "all"
              ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
              : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {(typeFilter !== "all" || companyFilter !== "all") && (
            <span className="h-5 w-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
              {[typeFilter !== "all", companyFilter !== "all"].filter(Boolean).length}
            </span>
          )}
        </button>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Obligación</label>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] sm:text-xs transition-all border no-tap-highlight",
                    typeFilter === "all"
                      ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-medium"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  )}
                >
                  Todas
                </button>
                {Object.entries(typeCounts).map(([type, count]) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] sm:text-xs transition-all border no-tap-highlight",
                      typeFilter === type
                        ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-medium"
                        : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                    )}
                  >
                    {getObligationLabel(type as ObligationType)} ({count})
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Empresa</label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
              >
                <option value="all">Todas</option>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors no-tap-highlight"
              >
                <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
              <h3 className="text-gray-900 dark:text-white text-sm font-medium">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors no-tap-highlight"
              >
                <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Calendar */}
            <div className="p-3 sm:p-4">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-[10px] uppercase text-gray-400 dark:text-gray-500 font-medium py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;

                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayObligations = obligationsByDate[dateStr] || [];
                  const isToday = dateStr === TODAY;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                      className={cn(
                        "relative aspect-square rounded-lg p-1 text-center transition-all hover:bg-gray-100 dark:hover:bg-gray-800/50 no-tap-highlight",
                        isSelected && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-500/10",
                        isToday && "bg-blue-50 dark:bg-blue-500/10"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-medium",
                        isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                      )}>
                        {day}
                      </span>
                      {dayObligations.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-0.5">
                          {dayObligations.slice(0, 3).map((o) => (
                            <div
                              key={o.id}
                              className={cn(
                                "h-1 w-1 rounded-full",
                                o.urgency === "overdue" ? "bg-red-500" :
                                o.urgency === "urgent" ? "bg-orange-500" :
                                o.urgency === "soon" ? "bg-yellow-500" :
                                o.status === "completed" ? "bg-green-500" :
                                "bg-blue-500"
                              )}
                            />
                          ))}
                          {dayObligations.length > 3 && (
                            <span className="text-[8px] text-gray-400">+</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Day Details */}
            {selectedDate && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4">
                <h4 className="text-gray-900 dark:text-white text-sm font-medium mb-3">
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-PY", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h4>
                {selectedObligations.length > 0 ? (
                  <div className="space-y-2">
                    {selectedObligations.map((o) => (
                      <ObligationCard key={o.id} obligation={o} compact />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 text-xs">Sin obligaciones en esta fecha</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-gray-900 dark:text-white text-sm font-medium">Próximos Vencimientos</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800/50 max-h-[500px] overflow-y-auto">
              {upcomingObligations.map((o) => (
                <ObligationCard key={o.id} obligation={o} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ObligationCard({ obligation: o, compact = false }: { obligation: FiscalObligation; compact?: boolean }) {
  const daysLeft = Math.ceil((new Date(o.dueDate).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className={cn(
      "p-3 sm:p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/30 border-l-3",
      o.urgency === "overdue" && "border-l-red-500 bg-red-50/50 dark:bg-red-500/5",
      o.urgency === "urgent" && "border-l-orange-500",
      o.urgency === "soon" && "border-l-yellow-500",
      o.status === "completed" && "border-l-green-500 opacity-75",
      !compact && (
        o.urgency === "normal" ? "border-l-gray-300 dark:border-l-gray-600" : ""
      )
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-mono font-medium", getObligationColor(o.type))}>
              {getObligationLabel(o.type)}
            </span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium",
              getUrgencyBadge(o.urgency)
            )}>
              {getUrgencyLabel(o.urgency)}
            </span>
            {o.status === "completed" && (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
          </div>
          <h4 className={cn(
            "text-xs font-medium truncate",
            o.status === "completed" ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-gray-200"
          )}>
            {o.title}
          </h4>
          {!compact && (
            <p className="text-gray-400 dark:text-gray-500 text-[10px] mt-0.5 truncate">
              {o.entity}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className={cn(
            "text-xs font-mono tabular-nums",
            daysLeft < 0 ? "text-red-500" : daysLeft <= 3 ? "text-orange-500" : "text-gray-500 dark:text-gray-400"
          )}>
            {daysLeft < 0 ? `-${Math.abs(daysLeft)}d` : `${daysLeft}d`}
          </p>
          {o.amount && (
            <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 tabular-nums mt-0.5">
              ₲ {(o.amount / 1000).toFixed(0)}K
            </p>
          )}
        </div>
      </div>
      {!compact && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/50">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{o.period}</span>
          <button className="flex items-center gap-1 text-[10px] text-blue-500 dark:text-blue-400 hover:underline no-tap-highlight">
            Ver detalle <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-gray-500 dark:text-gray-400" }: { title: string; value: string; icon: any; color?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wide">{title}</span>
        <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", color)} />
      </div>
      <p className={cn("text-lg sm:text-xl lg:text-2xl font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}
