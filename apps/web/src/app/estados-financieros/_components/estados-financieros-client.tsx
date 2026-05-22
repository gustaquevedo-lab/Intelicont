"use client";

import { useState, useTransition } from "react";
import {
  BarChart3, ChevronDown, ChevronRight, Loader2,
  AlertCircle, CheckCircle2, Printer, Download,
  TrendingUp, TrendingDown, Minus, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadBalanceGeneral, loadEstadoResultados,
  type BalanceGeneral, type EstadoResultados, type AccountBalance,
} from "../actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gs(n: number) {
  return Math.round(Math.abs(n)).toLocaleString("es-PY");
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-PY", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

// ─── Account tree row ─────────────────────────────────────────────────────────

function AccountRow({
  node, expanded, onToggle, showZero,
}: {
  node:     AccountBalance;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  showZero: boolean;
}) {
  if (!showZero && node.subtotal === 0 && node.children.length === 0) return null;

  const hasChildren = node.children.length > 0;
  const isExpanded  = expanded.has(node.id);
  const isHeader    = hasChildren;
  const indent      = node.level * 16;

  return (
    <>
      <tr
        className={cn(
          "border-b transition-colors",
          isHeader
            ? "border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/40"
            : "border-gray-50 dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/20",
          node.level === 0 && "bg-gray-50 dark:bg-slate-800/30",
        )}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        <td className="py-1.5 pr-4" style={{ paddingLeft: `${indent + 12}px` }}>
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <span className="text-gray-400 w-3.5 shrink-0">
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </span>
            ) : (
              <span className="w-3.5 shrink-0" />
            )}
            <span className="font-mono text-[10px] text-primary bg-primary-50 dark:bg-primary/10 px-1 py-0.5 rounded shrink-0 min-w-[44px] text-center">
              {node.code}
            </span>
            <span className={cn(
              "text-sm truncate",
              node.level === 0 ? "font-bold text-gray-900 dark:text-white"
                : isHeader    ? "font-semibold text-gray-800 dark:text-gray-200"
                              : "text-gray-700 dark:text-gray-300",
            )}>
              {node.name}
            </span>
          </div>
        </td>

        {/* Balance column */}
        <td className={cn(
          "py-1.5 px-4 text-right font-mono tabular-nums text-sm w-40",
          node.level === 0 ? "font-bold text-gray-900 dark:text-white"
            : isHeader    ? "font-semibold text-gray-800 dark:text-gray-200"
                          : node.subtotal !== 0 ? "text-gray-800 dark:text-gray-200" : "text-gray-300 dark:text-gray-600",
        )}>
          {node.subtotal !== 0 || node.level === 0
            ? `₲ ${gs(node.subtotal)}`
            : "—"}
        </td>
      </tr>

      {/* Children */}
      {hasChildren && isExpanded && node.children.map((child) => (
        <AccountRow
          key={child.id}
          node={child}
          expanded={expanded}
          onToggle={onToggle}
          showZero={showZero}
        />
      ))}
    </>
  );
}

// ─── Section component ────────────────────────────────────────────────────────

function Section({
  title, nodes, total, colorCls, expanded, onToggle, showZero,
}: {
  title:    string;
  nodes:    AccountBalance[];
  total:    number;
  colorCls: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  showZero: boolean;
}) {
  return (
    <div className="overflow-hidden">
      {/* Section header */}
      <div className={cn("px-4 py-2 flex items-center justify-between", colorCls)}>
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        <span className="font-mono font-bold text-sm">₲ {gs(total)}</span>
      </div>
      <table className="w-full">
        <tbody>
          {nodes.map((node) => (
            <AccountRow
              key={node.id}
              node={node}
              expanded={expanded}
              onToggle={onToggle}
              showZero={showZero}
            />
          ))}
          {nodes.length === 0 && (
            <tr>
              <td colSpan={2} className="py-4 px-4 text-center text-xs text-gray-400">
                Sin movimientos en este período
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Balance General view ─────────────────────────────────────────────────────

function BalanceView({ data }: { data: BalanceGeneral }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    [...data.activo, ...data.pasivo, ...data.patrimonio].forEach((n) => s.add(n.id));
    return s;
  });
  const [showZero, setShowZero] = useState(false);

  function toggle(id: string) {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  return (
    <div className="space-y-4 print:space-y-2">

      {/* Print header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-lg font-bold">BALANCE GENERAL</h1>
        <p className="text-sm">{data.entityName} — RUC {data.ruc}</p>
        <p className="text-sm">Al {fmtDate(data.asOfDate)}</p>
      </div>

      {/* Ecuación check */}
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl border text-sm no-print",
        data.ecuacionVerified
          ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
          : "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
      )}>
        {data.ecuacionVerified
          ? <CheckCircle2 className="h-4 w-4 shrink-0" />
          : <AlertCircle  className="h-4 w-4 shrink-0" />}
        <span>
          {data.ecuacionVerified
            ? "Ecuación contable verificada: Activo = Pasivo + Patrimonio"
            : "⚠ Ecuación contable no cuadra — puede haber asientos sin completar"}
        </span>
        <label className="ml-auto flex items-center gap-1.5 text-xs cursor-pointer no-print">
          <input type="checkbox" checked={showZero} onChange={(e) => setShowZero(e.target.checked)} className="rounded" />
          Mostrar cuentas en cero
        </label>
      </div>

      {/* Two-column layout for print */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">

        {/* LEFT: ACTIVO */}
        <div className="card overflow-hidden">
          <Section
            title="ACTIVO"
            nodes={data.activo}
            total={data.totalActivo}
            colorCls="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200"
            expanded={expanded}
            onToggle={toggle}
            showZero={showZero}
          />
          {/* Total activo footer */}
          <div className="bg-blue-100 dark:bg-blue-900/40 px-4 py-2.5 flex justify-between items-center border-t border-blue-200 dark:border-blue-800">
            <span className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wide">TOTAL ACTIVO</span>
            <span className="font-mono font-black text-blue-900 dark:text-blue-100 text-base">₲ {gs(data.totalActivo)}</span>
          </div>
        </div>

        {/* RIGHT: PASIVO + PATRIMONIO */}
        <div className="space-y-4 print:space-y-2">
          <div className="card overflow-hidden">
            <Section
              title="PASIVO"
              nodes={data.pasivo}
              total={data.totalPasivo}
              colorCls="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
              expanded={expanded}
              onToggle={toggle}
              showZero={showZero}
            />
            <div className="bg-red-100 dark:bg-red-900/40 px-4 py-2.5 flex justify-between items-center border-t border-red-200 dark:border-red-800">
              <span className="text-xs font-bold text-red-800 dark:text-red-200 uppercase tracking-wide">TOTAL PASIVO</span>
              <span className="font-mono font-black text-red-900 dark:text-red-100 text-base">₲ {gs(data.totalPasivo)}</span>
            </div>
          </div>

          <div className="card overflow-hidden">
            <Section
              title="PATRIMONIO NETO"
              nodes={data.patrimonio}
              total={data.totalPatrimonio - data.resultadoEjercicio}
              colorCls="bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200"
              expanded={expanded}
              onToggle={toggle}
              showZero={showZero}
            />
            {/* Net income line */}
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-50 dark:border-slate-800">
                  <td className="py-1.5 pl-12 pr-4 text-sm text-gray-700 dark:text-gray-300 italic">
                    Resultado del ejercicio
                  </td>
                  <td className={cn(
                    "py-1.5 px-4 text-right font-mono tabular-nums text-sm font-semibold w-40",
                    data.resultadoEjercicio >= 0 ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                  )}>
                    {data.resultadoEjercicio >= 0 ? "" : "("}{`₲ ${gs(data.resultadoEjercicio)}`}{data.resultadoEjercicio < 0 ? ")" : ""}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="bg-purple-100 dark:bg-purple-900/40 px-4 py-2.5 flex justify-between items-center border-t border-purple-200 dark:border-purple-800">
              <span className="text-xs font-bold text-purple-800 dark:text-purple-200 uppercase tracking-wide">TOTAL PATRIMONIO</span>
              <span className="font-mono font-black text-purple-900 dark:text-purple-100 text-base">₲ {gs(data.totalPatrimonio)}</span>
            </div>
          </div>

          {/* TOTAL PASIVO + PATRIMONIO */}
          <div className="card p-4 flex items-center justify-between bg-gray-900 dark:bg-slate-900 border-gray-800">
            <span className="text-xs font-bold text-white uppercase tracking-wide">TOTAL PASIVO + PATRIMONIO</span>
            <span className="font-mono font-black text-white text-base">₲ {gs(data.totalPasivo + data.totalPatrimonio)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Estado de Resultados view ────────────────────────────────────────────────

function EERRView({ data }: { data: EstadoResultados }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    [...data.ingresos, ...data.egresos].forEach((n) => s.add(n.id));
    return s;
  });
  const [showZero, setShowZero] = useState(false);

  function toggle(id: string) {
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const ganancia = data.resultado >= 0;

  return (
    <div className="space-y-4 max-w-2xl mx-auto print:space-y-2">

      {/* Print header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-lg font-bold">ESTADO DE RESULTADOS</h1>
        <p className="text-sm">{data.entityName} — RUC {data.ruc}</p>
        <p className="text-sm">{fmtDate(data.fromDate)} al {fmtDate(data.toDate)}</p>
      </div>

      <div className="no-print flex justify-end">
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" checked={showZero} onChange={(e) => setShowZero(e.target.checked)} className="rounded" />
          Mostrar cuentas en cero
        </label>
      </div>

      {/* INGRESOS */}
      <div className="card overflow-hidden">
        <Section
          title="INGRESOS"
          nodes={data.ingresos}
          total={data.totalIngresos}
          colorCls="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
          expanded={expanded}
          onToggle={toggle}
          showZero={showZero}
        />
        <div className="bg-green-100 dark:bg-green-900/40 px-4 py-2.5 flex justify-between border-t border-green-200 dark:border-green-800">
          <span className="text-xs font-bold text-green-800 dark:text-green-200 uppercase tracking-wide">TOTAL INGRESOS</span>
          <span className="font-mono font-black text-green-900 dark:text-green-100">₲ {gs(data.totalIngresos)}</span>
        </div>
      </div>

      {/* EGRESOS */}
      <div className="card overflow-hidden">
        <Section
          title="EGRESOS / COSTOS Y GASTOS"
          nodes={data.egresos}
          total={data.totalEgresos}
          colorCls="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200"
          expanded={expanded}
          onToggle={toggle}
          showZero={showZero}
        />
        <div className="bg-orange-100 dark:bg-orange-900/40 px-4 py-2.5 flex justify-between border-t border-orange-200 dark:border-orange-800">
          <span className="text-xs font-bold text-orange-800 dark:text-orange-200 uppercase tracking-wide">TOTAL EGRESOS</span>
          <span className="font-mono font-black text-orange-900 dark:text-orange-100">₲ {gs(data.totalEgresos)}</span>
        </div>
      </div>

      {/* RESULTADO */}
      <div className={cn(
        "card p-5 flex items-center justify-between",
        ganancia
          ? "bg-green-700 dark:bg-green-800 border-green-600"
          : "bg-red-700 dark:bg-red-800 border-red-600"
      )}>
        <div className="flex items-center gap-3">
          {ganancia
            ? <TrendingUp  className="h-6 w-6 text-white" />
            : <TrendingDown className="h-6 w-6 text-white" />}
          <div>
            <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">
              {ganancia ? "Ganancia del ejercicio" : "Pérdida del ejercicio"}
            </p>
            <p className="text-white text-xs opacity-70">{fmtDate(data.fromDate)} — {fmtDate(data.toDate)}</p>
          </div>
        </div>
        <span className="font-mono font-black text-white text-2xl tabular-nums">
          ₲ {gs(data.resultado)}
        </span>
      </div>

      {/* IRE reference */}
      <div className="card-flat p-4 flex items-start gap-3 text-xs text-gray-500 dark:text-gray-400 no-print">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-400" />
        <p>
          El resultado del ejercicio es la base para el cálculo del <strong>IRE</strong>.
          Usá la <a href="/impuestos" className="text-primary hover:underline">Calculadora de Impuestos</a> para estimar el IRE General, SIMPLE o ReSiMPle.
        </p>
      </div>
    </div>
  );
}

// ─── Props + Main component ───────────────────────────────────────────────────

interface Props {
  entities:    Array<{ id: string; legalName: string; ruc: string }>;
  defaultFrom: string;
  defaultTo:   string;
  dbError?:    string;
}

const TABS = [
  { id: "balance", label: "Balance General"      },
  { id: "eerr",    label: "Estado de Resultados" },
] as const;

export function EstadosFinancierosClient({ entities, defaultFrom, defaultTo, dbError }: Props) {
  const [tab,      setTab]      = useState<"balance" | "eerr">("balance");
  const [entityId, setEntityId] = useState(entities[0]?.id ?? "");
  const [asOf,     setAsOf]     = useState(defaultTo);
  const [from,     setFrom]     = useState(defaultFrom);
  const [to,       setTo]       = useState(defaultTo);
  const [isPending, startLoad]  = useTransition();
  const [balData,  setBalData]  = useState<BalanceGeneral | null>(null);
  const [eerrData, setEerrData] = useState<EstadoResultados | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  function handleGenerar() {
    if (!entityId) return;
    setError(null);
    setBalData(null);
    setEerrData(null);

    startLoad(async () => {
      if (tab === "balance") {
        const r = await loadBalanceGeneral(entityId, asOf);
        if (r.ok) setBalData(r.data);
        else setError(r.error);
      } else {
        const r = await loadEstadoResultados(entityId, from, to);
        if (r.ok) setEerrData(r.data);
        else setError(r.error);
      }
    });
  }

  const hasData = tab === "balance" ? !!balData : !!eerrData;

  return (
    <div className="page-container max-w-6xl">

      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {dbError}
        </div>
      )}

      {/* Header */}
      <div className="no-print">
        <h1 className="section-title text-2xl lg:text-3xl flex items-center gap-3">
          <BarChart3 className="h-7 w-7 text-primary" /> Estados Financieros
        </h1>
        <p className="section-subtitle">Balance General y Estado de Resultados conforme NIIF / PGC</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl no-print">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setBalData(null); setEerrData(null); setError(null); }}
            className={cn(
              "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
              tab === t.id
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="card p-5 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Empresa</label>
            <div className="relative">
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="appearance-none input-field pr-8 cursor-pointer"
              >
                <option value="">Seleccioná una empresa</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>{e.legalName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {tab === "balance" ? (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Fecha de corte</label>
              <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="input-field" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Desde</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Hasta</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field" />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleGenerar}
            disabled={!entityId || isPending}
            className="btn-secondary flex items-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
            {isPending ? "Calculando…" : `Generar ${tab === "balance" ? "Balance General" : "Estado de Resultados"}`}
          </button>

          {hasData && (
            <button onClick={() => window.print()} className="btn-ghost flex items-center gap-2">
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Content */}
      {tab === "balance" && balData && <BalanceView data={balData} />}
      {tab === "eerr"    && eerrData && <EERRView data={eerrData} />}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; font-size: 11px; }
          .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          .card-flat { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>
    </div>
  );
}
