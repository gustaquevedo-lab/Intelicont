"use client";

import { useState, useTransition } from "react";
import {
  BarChart3, ChevronDown, ChevronRight, Loader2,
  AlertCircle, CheckCircle2, Printer, Download,
  TrendingUp, TrendingDown, Minus, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadBalanceGeneral, loadEstadoResultados, loadFlujoCaja,
  type BalanceGeneral, type EstadoResultados, type AccountBalance, type FlujoCaja,
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

// ─── Flujo de Caja view ───────────────────────────────────────────────────────

function FlujoView({ data }: { data: FlujoCaja }) {
  const isPositive = data.variacionNeta >= 0;

  return (
    <div className="space-y-4 max-w-2xl mx-auto print:space-y-2">
      {/* Print header */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-lg font-bold">ESTADO DE FLUJO DE CAJA</h1>
        <p className="text-sm">{data.entityName} — RUC {data.ruc}</p>
        <p className="text-sm">{fmtDate(data.fromDate)} al {fmtDate(data.toDate)}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 flex items-center justify-between border-b border-blue-100 dark:border-blue-800">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-200">Actividades Operativas</span>
          <span className="font-mono font-bold text-sm text-blue-900 dark:text-blue-100">₲ {gs(data.totalOperativo)}</span>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
            <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10">
              <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">Resultado del ejercicio (Utilidad/Pérdida)</td>
              <td className="py-2.5 px-4 text-right font-mono text-gray-950 dark:text-white">₲ {gs(data.resultadoEjercicio)}</td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10">
              <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">(+) Depreciaciones y Amortizaciones</td>
              <td className="py-2.5 px-4 text-right font-mono text-gray-950 dark:text-white">₲ {gs(data.depreciaciones)}</td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10">
              <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">(+/-) Cambio en Cuentas por Cobrar (Clientes)</td>
              <td className="py-2.5 px-4 text-right font-mono text-gray-950 dark:text-white">₲ {gs(data.cambioClientes)}</td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10">
              <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">(+/-) Cambio en Inventarios (Mercaderías)</td>
              <td className="py-2.5 px-4 text-right font-mono text-gray-950 dark:text-white">₲ {gs(data.cambioInventario)}</td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10">
              <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">(+/-) Cambio en Cuentas por Pagar (Proveedores)</td>
              <td className="py-2.5 px-4 text-right font-mono text-gray-950 dark:text-white">₲ {gs(data.cambioProveedores)}</td>
            </tr>
            <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10">
              <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">(+/-) Cambio en Otros Pasivos Operativos</td>
              <td className="py-2.5 px-4 text-right font-mono text-gray-950 dark:text-white">₲ {gs(data.cambioOtrosPasivos)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 flex items-center justify-between border-b border-amber-100 dark:border-amber-800">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">Actividades de Inversión</span>
          <span className="font-mono font-bold text-sm text-amber-900 dark:text-amber-100">₲ {gs(data.totalInversion)}</span>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
            <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10">
              <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">Adquisición / Venta de Propiedad, Planta y Equipo</td>
              <td className="py-2.5 px-4 text-right font-mono text-gray-950 dark:text-white">₲ {gs(data.inversionActivos)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 flex items-center justify-between border-b border-purple-100 dark:border-purple-800">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-200">Actividades de Financiación</span>
          <span className="font-mono font-bold text-sm text-purple-900 dark:text-purple-100">₲ {gs(data.totalFinanciamiento)}</span>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
            <tr className="hover:bg-gray-50/50 dark:hover:bg-slate-800/10">
              <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">Obtención / Pago de Préstamos y Cambios Patrimoniales</td>
              <td className="py-2.5 px-4 text-right font-mono text-gray-950 dark:text-white">₲ {gs(data.financiamientoPrestamos)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Resumen Final */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Variación Neta de Efectivo</span>
          <span className={cn("font-mono font-black text-lg", isPositive ? "text-green-500" : "text-red-500")}>
            {isPositive ? "+" : ""} ₲ {gs(data.variacionNeta)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Efectivo al Inicio del Período</span>
          <span className="font-mono font-semibold text-gray-900 dark:text-white">₲ {gs(data.efectivoInicio)}</span>
        </div>
        <div className="flex items-center justify-between text-sm pt-1">
          <span className="text-gray-600 dark:text-gray-400">Efectivo al Final del Período</span>
          <span className="font-mono font-bold text-gray-900 dark:text-white">₲ {gs(data.efectivoFin)}</span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  entities:    Array<{ id: string; legalName: string; ruc: string }>;
  defaultFrom: string;
  defaultTo:   string;
  dbError?:    string;
}

const TABS = [
  { id: "balance", label: "Balance General"      },
  { id: "eerr",    label: "Estado de Resultados" },
  { id: "flujo",   label: "Flujo de Caja"        },
] as const;

export function EstadosFinancierosClient({ entities, defaultFrom, defaultTo, dbError }: Props) {
  const [tab,      setTab]      = useState<"balance" | "eerr" | "flujo">("balance");
  const [entityId, setEntityId] = useState(entities[0]?.id ?? "");
  const [asOf,     setAsOf]     = useState(defaultTo);
  const [from,     setFrom]     = useState(defaultFrom);
  const [to,       setTo]       = useState(defaultTo);
  const [isPending, startLoad]  = useTransition();
  const [balData,  setBalData]  = useState<BalanceGeneral | null>(null);
  const [eerrData, setEerrData] = useState<EstadoResultados | null>(null);
  const [flujoData, setFlujoData] = useState<FlujoCaja | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  function handleGenerar() {
    if (!entityId) return;
    setError(null);
    setBalData(null);
    setEerrData(null);
    setFlujoData(null);

    startLoad(async () => {
      if (tab === "balance") {
        const r = await loadBalanceGeneral(entityId, asOf);
        if (r.ok) setBalData(r.data);
        else setError(r.error);
      } else if (tab === "eerr") {
        const r = await loadEstadoResultados(entityId, from, to);
        if (r.ok) setEerrData(r.data);
        else setError(r.error);
      } else {
        const r = await loadFlujoCaja(entityId, from, to);
        if (r.ok) setFlujoData(r.data);
        else setError(r.error);
      }
    });
  }

  function downloadCsv() {
    let csvContent = "";
    let filename = "";

    if (tab === "balance" && balData) {
      filename = `Balance_General_${balData.entityName.replace(/\s+/g, "_")}_al_${balData.asOfDate}.csv`;
      csvContent = "Codigo;Cuenta;Saldo\n";
      
      const flattenNode = (node: AccountBalance, lines: string[]) => {
        if (node.subtotal !== 0) {
          lines.push(`${node.code};"${node.name}";${Math.round(node.subtotal)}`);
        }
        node.children.forEach(c => flattenNode(c, lines));
      };

      csvContent += "ACTIVO\n";
      const activoLines: string[] = [];
      balData.activo.forEach(n => flattenNode(n, activoLines));
      csvContent += activoLines.join("\n") + `\nTotal Activo;;${Math.round(balData.totalActivo)}\n\n`;

      csvContent += "PASIVO\n";
      const pasivoLines: string[] = [];
      balData.pasivo.forEach(n => flattenNode(n, pasivoLines));
      csvContent += pasivoLines.join("\n") + `\nTotal Pasivo;;${Math.round(balData.totalPasivo)}\n\n`;

      csvContent += "PATRIMONIO NETO\n";
      const patLines: string[] = [];
      balData.patrimonio.forEach(n => flattenNode(n, patLines));
      csvContent += patLines.join("\n") + `\nResultado del Ejercicio;;${Math.round(balData.resultadoEjercicio)}\n`;
      csvContent += `Total Patrimonio;;${Math.round(balData.totalPatrimonio)}\n\n`;
      csvContent += `TOTAL PASIVO + PATRIMONIO;;${Math.round(balData.totalPasivo + balData.totalPatrimonio)}\n`;
    } 
    
    else if (tab === "eerr" && eerrData) {
      filename = `Estado_Resultados_${eerrData.entityName.replace(/\s+/g, "_")}_desde_${eerrData.fromDate}_hasta_${eerrData.toDate}.csv`;
      csvContent = "Codigo;Cuenta;Saldo\n";
      
      const flattenNode = (node: AccountBalance, lines: string[]) => {
        if (node.subtotal !== 0) {
          lines.push(`${node.code};"${node.name}";${Math.round(node.subtotal)}`);
        }
        node.children.forEach(c => flattenNode(c, lines));
      };

      csvContent += "INGRESOS\n";
      const ingresosLines: string[] = [];
      eerrData.ingresos.forEach(n => flattenNode(n, ingresosLines));
      csvContent += ingresosLines.join("\n") + `\nTotal Ingresos;;${Math.round(eerrData.totalIngresos)}\n\n`;

      csvContent += "EGRESOS\n";
      const egresosLines: string[] = [];
      eerrData.egresos.forEach(n => flattenNode(n, egresosLines));
      csvContent += egresosLines.join("\n") + `\nTotal Egresos;;${Math.round(eerrData.totalEgresos)}\n\n`;

      csvContent += `RESULTADO DEL EJERCICIO;;${Math.round(eerrData.resultado)}\n`;
    } 
    
    else if (tab === "flujo" && flujoData) {
      filename = `Flujo_Caja_${flujoData.entityName.replace(/\s+/g, "_")}_desde_${flujoData.fromDate}_hasta_${flujoData.toDate}.csv`;
      csvContent = "Concepto;Monto\n";
      csvContent += `Resultado Neto del Ejercicio;${Math.round(flujoData.resultadoEjercicio)}\n`;
      csvContent += `(+) Depreciaciones y Amortizaciones;${Math.round(flujoData.depreciaciones)}\n`;
      csvContent += `(+/-) Cambio en Cuentas por Cobrar (Clientes);${Math.round(flujoData.cambioClientes)}\n`;
      csvContent += `(+/-) Cambio en Inventarios;${Math.round(flujoData.cambioInventario)}\n`;
      csvContent += `(+/-) Cambio en Proveedores;${Math.round(flujoData.cambioProveedores)}\n`;
      csvContent += `(+/-) Cambio en Otros Pasivos;${Math.round(flujoData.cambioOtrosPasivos)}\n`;
      csvContent += `FLUJO NETO DE ACTIVIDADES OPERATIVAS;${Math.round(flujoData.totalOperativo)}\n\n`;
      csvContent += `Adquisicion de Activos Fijos;${Math.round(flujoData.inversionActivos)}\n`;
      csvContent += `FLUJO NETO DE ACTIVIDADES DE INVERSION;${Math.round(flujoData.totalInversion)}\n\n`;
      csvContent += `Prestamos y Cambios Patrimoniales;${Math.round(flujoData.financiamientoPrestamos)}\n`;
      csvContent += `FLUJO NETO DE ACTIVIDADES DE FINANCIACION;${Math.round(flujoData.totalFinanciamiento)}\n\n`;
      csvContent += `Variacion Neta de Efectivo y Equivalentes;${Math.round(flujoData.variacionNeta)}\n`;
      csvContent += `Efectivo al Inicio del Periodo;${Math.round(flujoData.efectivoInicio)}\n`;
      csvContent += `Efectivo al Final del Periodo;${Math.round(flujoData.efectivoFin)}\n`;
    }

    if (!csvContent) return;

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const hasData = tab === "balance" ? !!balData : tab === "eerr" ? !!eerrData : !!flujoData;

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
        <p className="section-subtitle">Balance General, Estado de Resultados y Flujo de Caja conforme NIIF / PGC</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl no-print">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setBalData(null); setEerrData(null); setFlujoData(null); setError(null); }}
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
            {isPending ? "Calculando…" : `Generar ${tab === "balance" ? "Balance General" : tab === "eerr" ? "Estado de Resultados" : "Flujo de Caja"}`}
          </button>

          {hasData && (
            <>
              <button onClick={() => window.print()} className="btn-ghost flex items-center gap-2">
                <Printer className="h-4 w-4" /> Imprimir / PDF
              </button>
              <button onClick={downloadCsv} className="btn-ghost flex items-center gap-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20">
                <Download className="h-4 w-4" /> Exportar CSV
              </button>
            </>
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
      {tab === "flujo"   && flujoData && <FlujoView data={flujoData} />}

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
