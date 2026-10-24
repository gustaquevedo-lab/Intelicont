"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2, Plus, TrendingUp, TrendingDown, Calendar, Calculator, FileText, BookOpen, Receipt,
  BarChart3, FileCode, Clock, History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/trpc/client";
import { LEVEL_BADGE, OBLIGATION_NAME, dueLabel } from "@/lib/fiscal-calendar";
import { actionLabel, targetLabel, formatDateTime } from "@/lib/audit-labels";

const gs = (v: number) => `₲ ${Math.abs(v).toLocaleString("es-PY")}`;
const currentMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }).slice(0, 7);

// ─── Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { selectedEntity } = useAuthStore();
  const entityId = selectedEntity?.id ?? "";
  const [periodo, setPeriodo] = useState(currentMonth);
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo);
  const [year, month] = valid ? periodo.split("-").map(Number) : [0, 0];
  const enabled = !!selectedEntity && valid;

  const form104 = api.fiscal.form104.useQuery({ entityId, year, month }, { enabled });
  const pending = api["tax-documents"].pending.useQuery({ entityId }, { enabled: !!selectedEntity });
  const entries = api["journal-entries"].count.useQuery({ entityId, year, month }, { enabled });
  const activity = api.audit.list.useQuery({ entityId, limit: 8 }, { enabled: !!selectedEntity });
  // Upcoming deadlines: real calendar of the active entity (next 30 days and overdue)
  const upcoming = api.fiscal.upcoming.useQuery({ entityId, days: 30 }, { enabled: !!selectedEntity });
  const upcomingDeadlines = upcoming.data?.items ?? [];
  // Overdue = not filed until a "presentado" state exists.
  const overdueDeadlines = upcomingDeadlines.filter((d) => d.level === "overdue");
  const next = upcomingDeadlines.find((d) => d.daysLeft >= 0);

  const r = form104.data;
  const events = activity.data?.events ?? [];
  const dash = (loading: boolean) => (loading ? "…" : "—");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in no-theme-transition">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
            <BarChart3 className="h-3 w-3" />
            <span>Panel General</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {selectedEntity ? (selectedEntity.tradeName || selectedEntity.legalName) : "Sin empresa seleccionada"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">RUC {selectedEntity?.ruc || "—"}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            aria-label="Período"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-2.5 py-2.5 card rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <Link href="/sifen" className="flex items-center gap-2 px-4 py-2.5 card hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300">
            <FileCode className="h-4 w-4" />
            Cargar SIFEN
          </Link>
          <Link href="/documentos/nuevo" className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white hover:bg-primary-dark transition-all rounded-xl text-sm font-black shadow-xl shadow-primary/20">
            <Plus className="h-4 w-4" />
            Comprobante manual
          </Link>
        </div>
      </div>

      {!selectedEntity ? (
        <div className="card rounded-2xl p-10 text-center space-y-3">
          <Building2 className="h-8 w-8 mx-auto text-gray-400" />
          <p className="text-sm text-gray-500">Todavía no hay una empresa activa. Creá una para empezar a contabilizar.</p>
          <Link href="/empresas?nueva=1" className="inline-block text-sm font-bold text-primary hover:underline">Crear empresa</Link>
        </div>
      ) : (
      <>
      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          title={r ? (r.saldo > 0 ? "IVA a pagar" : r.saldo < 0 ? "Saldo a favor" : "IVA del mes") : "IVA del mes"}
          value={r ? (r.saldo === 0 ? "Sin saldo" : gs(r.saldo)) : dash(form104.isLoading)}
          sub={r ? `Débito ${gs(r.debitoFiscal)} − Crédito ${gs(r.creditoFiscal)}` : "Formulario 104"}
          icon={r && r.saldo < 0 ? TrendingDown : TrendingUp}
          variant="secondary"
          href="/fiscal/formulario-104"
        />
        <KpiCard
          title="Comprobantes pendientes"
          value={pending.data ? String(pending.data.length) : dash(pending.isLoading)}
          sub="Sin contabilizar"
          icon={Receipt}
          variant="accent"
          href="/sifen"
        />
        <KpiCard
          title="Asientos del mes"
          value={entries.data ? String(entries.data.total) : dash(entries.isLoading)}
          sub={valid ? periodo : "Elegí un período válido"}
          icon={FileText}
          variant="primary"
          href="/asientos"
        />
        <KpiCard
          title="Próx. vencimiento"
          value={next ? dueLabel(next.dueDate) : "—"}
          sub={next ? `${OBLIGATION_NAME[next.obligation] ?? next.obligation} · ${next.period}` : "Sin vencimientos en 30 días"}
          icon={Calendar}
          variant="neutral"
          href="/calendario"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* IVA of the month: Formulario 104 débito vs crédito */}
          <div className="card rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">IVA del mes</h2>
              <p className="text-xs text-gray-500 font-medium">Débito vs crédito fiscal según el Libro IVA de {valid ? periodo : "—"}</p>
            </div>
            {!r ? (
              <p className="text-sm text-gray-400">{form104.isLoading ? "Cargando…" : "No hay datos de IVA para este período."}</p>
            ) : r.debitoFiscal === 0 && r.creditoFiscal === 0 ? (
              <p className="text-sm text-gray-400">Sin documentos con IVA en este período.</p>
            ) : (
              <div className="space-y-4">
                <IvaBar label="Débito fiscal" value={r.debitoFiscal} max={Math.max(r.debitoFiscal, r.creditoFiscal)} className="bg-primary" />
                <IvaBar label="Crédito fiscal" value={r.creditoFiscal} max={Math.max(r.debitoFiscal, r.creditoFiscal)} className="bg-secondary" />
              </div>
            )}
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ShortcutCard icon={FileCode} label="Carga SIFEN" href="/sifen" color="primary" />
            <ShortcutCard icon={BookOpen} label="Libros IVA" href="/libros" color="secondary" />
            <ShortcutCard icon={Calculator} label="Formulario 104" href="/fiscal/formulario-104" color="amber" />
            <ShortcutCard icon={Calendar} label="Calendario" href="/calendario" color="primary" />
          </div>
        </div>

        {/* Right Col: Deadlines & Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Deadlines */}
          <div className="card rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Vencimientos</h3>
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 divide-y divide-gray-200/30 dark:divide-gray-800/30">
              {upcomingDeadlines.length === 0 && (
                <p className="p-4 text-xs text-gray-400">Sin vencimientos en los próximos 30 días.</p>
              )}
              {upcomingDeadlines.map((d) => (
                <div key={`${d.obligation}-${d.period}`} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn("text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full", LEVEL_BADGE[d.level ?? "none"])}>
                      {OBLIGATION_NAME[d.obligation] ?? d.obligation}
                    </span>
                    <span className="text-xs font-black text-gray-400 group-hover:text-primary transition-colors">{dueLabel(d.dueDate)}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">Período {d.period}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", d.level === "overdue" || d.level === "1" ? "bg-red-500" : "bg-primary")}
                        style={{ width: `${Math.max(10, 100 - Math.max(d.daysLeft, 0) * 3)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 shrink-0">{d.daysLeft < 0 ? "vencido" : `${d.daysLeft}d`}</span>
                  </div>
                </div>
              ))}
            </div>
            {overdueDeadlines.length > 0 && (
              <Link href={`/calendario?mes=${overdueDeadlines[0].dueDate.slice(0, 7)}`} className="px-4 py-3 text-center text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-t border-red-200/50 dark:border-red-500/20 hover:underline">
                {overdueDeadlines.length} {overdueDeadlines.length === 1 ? "vencimiento anterior sin presentar" : "vencimientos anteriores sin presentar"}
              </Link>
            )}
            <Link href="/calendario" className="p-4 text-center text-xs font-black text-primary hover:bg-primary/5 transition-all border-t border-gray-200/50 dark:border-gray-800/50 uppercase tracking-widest">
              Ver Calendario Fiscal
            </Link>
          </div>

          {/* Recent activity (audit trail) */}
          <div className="card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Actividad reciente</h3>
              <History className="h-4 w-4 text-primary" />
            </div>
            <ul aria-label="Actividad reciente" className="divide-y divide-gray-200/30 dark:divide-gray-800/30">
              {events.length === 0 && <li className="p-4 text-xs text-gray-400">{activity.isLoading ? "Cargando…" : "Sin actividad registrada."}</li>}
              {events.map((ev) => (
                <li key={ev.id} className="p-4">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{actionLabel(ev.action)} · {targetLabel(ev.targetType)}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="h-3 w-3" />{formatDateTime(ev.createdAt)}{ev.actor ? ` · ${ev.actor.name}` : " · sistema"}
                  </p>
                </li>
              ))}
            </ul>
            <Link href="/auditoria" className="block p-4 text-center text-xs font-black text-primary hover:bg-primary/5 transition-all border-t border-gray-200/50 dark:border-gray-800/50 uppercase tracking-widest">
              Ver auditoría
            </Link>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

function IvaBar({ label, value, max, className }: { label: string; value: number; max: number; className: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-bold text-gray-600 dark:text-gray-300">{label}</span>
        <span className="font-black tabular-nums text-gray-900 dark:text-white" data-testid={`iva-${label.startsWith("Débito") ? "debito" : "credito"}`}>{gs(value)}</span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", className)} style={{ width: `${max > 0 ? Math.max(2, Math.round((Math.abs(value) / max) * 100)) : 0}%` }} />
      </div>
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, variant, href }: {
  title: string; value: string; sub: string;
  icon: React.ComponentType<{ className?: string }>; variant: "primary" | "secondary" | "accent" | "neutral";
  href: string;
}) {
  const styles = {
    primary: "from-primary/20 to-primary/5 text-primary border-primary/20",
    secondary: "from-secondary/20 to-secondary/5 text-secondary border-secondary/20",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-500/20",
    neutral: "from-gray-500/10 to-gray-500/5 text-gray-500 border-gray-200 dark:border-gray-800",
  };
  const iconStyles = {
    primary: "bg-primary text-white shadow-primary/20",
    secondary: "bg-secondary text-white shadow-secondary/20",
    accent: "bg-amber-500 text-white shadow-amber-500/20",
    neutral: "bg-gray-100 dark:bg-gray-800 text-gray-500",
  };

  return (
    <Link href={href} aria-label={title} className={cn("card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl bg-gradient-to-br block", styles[variant])}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">{title}</span>
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-lg", iconStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums" data-testid="kpi-value">{value}</h4>
      <p className="text-xs font-bold text-gray-400 mt-1">{sub}</p>
    </Link>
  );
}

function ShortcutCard({ icon: Icon, label, href, color }: { icon: any, label: string, href: string, color: "primary" | "secondary" | "amber" }) {
  const colors = {
    primary: "text-primary bg-primary/10 border-primary/20 hover:bg-primary hover:text-white shadow-primary/10",
    secondary: "text-secondary bg-secondary/10 border-secondary/20 hover:bg-secondary hover:text-white shadow-secondary/10",
    amber: "text-amber-600 bg-amber-600/10 border-amber-600/20 hover:bg-amber-600 hover:text-white shadow-amber-600/10",
  };

  return (
    <Link href={href} className={cn(
      "card p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl",
      "border group", colors[color]
    )}>
      <div className="h-10 w-10 rounded-xl bg-white dark:bg-gray-950 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-black uppercase tracking-tighter transition-colors group-hover:text-white">
        {label}
      </span>
    </Link>
  );
}
