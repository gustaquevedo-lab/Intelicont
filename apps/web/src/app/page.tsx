"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2, Plus, AlertTriangle, TrendingUp, TrendingDown,
  Clock, Search, ArrowUpRight, Sparkles, FileText,
  Receipt, Calculator, ArrowRight, Calendar, CreditCard,
  CheckCircle2, Upload, BarChart3, DollarSign,
  Zap, X, ChevronRight, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import { useAsientos, useEmpresas, useOpenPeriod, usePendingTaxDocuments } from "@/hooks/use-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Area, AreaChart,
  Legend,
} from "recharts";

// ─── Chart Data ──────────────────────────────────────────────────────────

const IVA_MONTHLY = [
  { month: "Ene", debito: 4500000, credito: 2800000 },
  { month: "Feb", debito: 5200000, credito: 3100000 },
  { month: "Mar", debito: 3800000, credito: 2200000 },
  { month: "Abr", debito: 6100000, credito: 3500000 },
  { month: "May", debito: 705000, credito: 3212500 },
  { month: "Jun", debito: 0, credito: 0 },
];

const CASHFLOW = [
  { month: "Ene", ingresos: 52000000, egresos: 38000000 },
  { month: "Feb", ingresos: 48000000, egresos: 42000000 },
  { month: "Mar", ingresos: 61000000, egresos: 45000000 },
  { month: "Abr", ingresos: 55000000, egresos: 48000000 },
  { month: "May", ingresos: 31050000, egresos: 35625000 },
];

const EXPENSE_BREAKDOWN = [
  { name: "Compras", value: 32125000, color: "#3b82f6" },
  { name: "Sueldos", value: 8000000, color: "#8b5cf6" },
  { name: "Honorarios", value: 2500000, color: "#f59e0b" },
  { name: "Alquiler", value: 2500000, color: "#ef4444" },
  { name: "Servicios", value: 1200000, color: "#10b981" },
  { name: "Otros", value: 800000, color: "#6b7280" },
];

// ─── Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);
  const { data: asientos } = useAsientos(selectedEntity?.id ?? null);
  const { data: pendingDocs } = usePendingTaxDocuments(selectedEntity?.id ?? null);
  const { data: openPeriod } = useOpenPeriod(selectedEntity?.id ?? null);
  const sifenPending = pendingDocs?.length ?? 0;
  const sifenTotalPendiente = pendingDocs?.reduce((sum, d) => sum + Math.abs(parseFloat(d.total)), 0) ?? 0;

  const today = new Date();
  const monthName = today.toLocaleDateString("es-PY", { month: "long", year: "numeric" });

  // Current month IVA
  const ivaDebito = 705000;
  const ivaCredito = 3212500;
  const saldoFavor = ivaCredito - ivaDebito;

  // Upcoming deadlines
  const upcomingDeadlines = [
    { id: 1, label: "IVA — Form. 104", entity: "Importadora del Este", date: "12 May", days: 7, urgent: true },
    { id: 2, label: "Hechauka", entity: "Importadora del Este", date: "25 May", days: 20, urgent: false },
    { id: 3, label: "IRE — Form. 1301", entity: "Tech Asunción", date: "15 May", days: 10, urgent: false },
    { id: 4, label: "Retenciones IRP", entity: "Dist. Ñandutí", date: "20 May", days: 15, urgent: false },
  ];

  // Activity feed
  const activityFeed = [
    { id: 1, type: "asiento", title: "JE-001-2026 posteado", desc: "Compra ImportEste — Gs. 11.000.000", time: "Hoy 10:30", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: 2, type: "sifen", title: "XML procesado", desc: "Factura 001-001-01145 — IA 94%", time: "Hoy 09:15", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
    { id: 3, type: "vencimiento", title: "IVA vence en 7 días", desc: "Importadora del Este — Form. 104", time: "Ayer", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: 4, type: "asiento", title: "JE-004-2026 posteado", desc: "Venta ComerPar — Gs. 6.050.000", time: "Ayer 16:00", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in no-theme-transition">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
            <BarChart3 className="h-3 w-3" />
            <span>Sistema Contable Inteligente</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            {selectedEntity ? (selectedEntity.tradeName || selectedEntity.legalName) : "Consolidado Global"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center gap-2">
            {monthName} <span className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700" /> RUC {selectedEntity?.ruc || "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 card hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300">
            <Upload className="h-4 w-4" />
            Importar
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white hover:bg-primary-dark transition-all rounded-xl text-sm font-black shadow-xl shadow-primary/20">
            <Plus className="h-4 w-4" />
            Nuevo Asiento
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          title="Saldo IVA a Favor"
          value={`Gs. ${(saldoFavor / 1000000).toFixed(1)}M`}
          sub={saldoFavor > 0 ? "Crédito Fiscal" : "A pagar"}
          icon={TrendingDown}
          variant="secondary"
          trend={{ value: 5, positive: true }}
        />
        <KpiCard
          title="Ingresos Mayo"
          value={`Gs. ${(31050000 / 1000000).toFixed(1)}M`}
          sub="Basado en facturación"
          icon={TrendingUp}
          variant="primary"
          trend={{ value: 12, positive: true }}
        />
        <KpiCard
          title="SIFEN Pendientes"
          value={sifenPending.toString()}
          sub={`Gs. ${(sifenTotalPendiente / 1000000).toFixed(1)}M`}
          icon={Zap}
          variant="accent"
          trend={null}
        />
        <KpiCard
          title="Próx. Vencimiento"
          value="12 May"
          sub="IVA - Form 104"
          icon={Calendar}
          variant="neutral"
          trend={null}
        />
      </div>

      {/* Main Grid: Charts & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Main Charts */}
        <div className="lg:col-span-8 space-y-6">
          {/* IVA Evolution */}
          <div className="card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Evolución de IVA</h2>
                <p className="text-xs text-gray-500 font-medium">Débito vs Crédito mensual</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-[10px] font-black uppercase text-gray-400">Débito</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="text-[10px] font-black uppercase text-gray-400">Crédito</span>
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={IVA_MONTHLY} barGap={8}>
                  <defs>
                    <linearGradient id="barGradPrimary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#104c91" stopOpacity={1} />
                      <stop offset="100%" stopColor="#104c91" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="barGradSecondary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00a651" stopOpacity={1} />
                      <stop offset="100%" stopColor="#00a651" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--muted-foreground))" }} 
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip 
                    cursor={{ fill: "hsl(var(--primary) / 0.05)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="card p-3 rounded-xl shadow-2xl">
                            <p className="text-xs font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">
                              {payload[0].payload.month} 2026
                            </p>
                            <div className="space-y-1">
                              {payload.map((p, i) => (
                                <div key={i} className="flex items-center justify-between gap-4 text-xs">
                                  <span className="text-gray-500 font-medium">{p.name}:</span>
                                  <span className="font-black tabular-nums" style={{ color: p.color }}>
                                    Gs. {Number(p.value).toLocaleString("es-PY")}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="debito" name="Débito" fill="url(#barGradPrimary)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="credito" name="Crédito" fill="url(#barGradSecondary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <ShortcutCard icon={Receipt} label="Facturación" href="/sifen" color="primary" />
            <ShortcutCard icon={BookOpen} label="Libros IVA" href="/libros" color="secondary" />
            <ShortcutCard icon={Calculator} label="Impuestos" href="/impuestos" color="amber" />
            <ShortcutCard icon={CreditCard} label="Bancos" href="/banco" color="primary" />
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
              {upcomingDeadlines.map((d) => (
                <div key={d.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full",
                      d.urgent ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    )}>
                      {d.label}
                    </span>
                    <span className="text-xs font-black text-gray-400 group-hover:text-primary transition-colors">{d.date}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{d.entity}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full", d.urgent ? "bg-red-500" : "bg-primary")} 
                        style={{ width: `${Math.max(10, 100 - d.days * 5)}%` }} 
                      />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 shrink-0">{d.days}d</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/calendario" className="p-4 text-center text-xs font-black text-primary hover:bg-primary/5 transition-all border-t border-gray-200/50 dark:border-gray-800/50 uppercase tracking-widest">
              Ver Calendario Fiscal
            </Link>
          </div>

          {/* AI Feed */}
          <div className="card rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">InteliInsights</h3>
                <p className="text-[10px] text-gray-500 font-bold">Asistente de Inteligencia</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-white dark:border-gray-800 shadow-lg">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  Hemos detectado <span className="font-black text-primary">4 nuevas facturas</span> en el portal SIFEN que coinciden con gastos recurrentes. ¿Deseas procesar los asientos?
                </p>
                <button className="mt-3 w-full py-2 bg-primary text-white rounded-lg text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                  Revisar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, variant, trend }: {
  title: string; value: string; sub: string;
  icon: any; variant: "primary" | "secondary" | "accent" | "neutral";
  trend: { value: number; positive: boolean } | null;
}) {
  const styles = {
    primary: "from-primary/20 to-primary/5 text-primary border-primary/20",
    secondary: "from-secondary/20 to-secondary/5 text-secondary border-secondary/20",
    accent: "from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-500/20",
    neutral: "from-gray-500/10 to-gray-500/5 text-gray-500 border-gray-200 dark:border-gray-800",
  };

  return (
    <div className={cn(
      "card rounded-2xl p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl group relative overflow-hidden",
      "bg-gradient-to-br", styles[variant]
    )}>
      {/* Background Decor */}
      <div className="absolute -right-4 -top-4 h-24 w-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">{title}</span>
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-12",
            variant === "primary" ? "bg-primary text-white shadow-primary/20" :
            variant === "secondary" ? "bg-secondary text-white shadow-secondary/20" :
            variant === "accent" ? "bg-amber-500 text-white shadow-amber-500/20" :
            "bg-gray-100 dark:bg-gray-800 text-gray-500"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        
        <div className="flex items-baseline gap-2">
          <h4 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">{value}</h4>
          {trend && (
            <span className={cn(
              "text-[10px] font-black px-1.5 py-0.5 rounded-lg flex items-center gap-0.5",
              trend.positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
            )}>
              {trend.positive ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
              {trend.value}%
            </span>
          )}
        </div>
        <p className="text-xs font-bold text-gray-400 mt-1">{sub}</p>
      </div>
    </div>
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
