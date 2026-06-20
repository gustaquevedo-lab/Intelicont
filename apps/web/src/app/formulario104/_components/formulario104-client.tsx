"use client";

import { useState, useTransition } from "react";
import {
  FileText, Loader2, Printer, AlertCircle, Info,
  ChevronDown, TrendingDown, TrendingUp, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadLibroIVA, type LibroIVASummary } from "@/app/libro-iva/actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function gs(n: number) {
  return Math.round(n).toLocaleString("es-PY");
}

function Row({ label, value, bold, indent, note }: {
  label: string;
  value: number | string;
  bold?: boolean;
  indent?: number;
  note?: string;
}) {
  return (
    <tr className={cn("border-b border-gray-100 dark:border-slate-800", bold && "bg-gray-50 dark:bg-slate-800/50")}>
      <td className={cn(
        "py-2 pr-4 text-sm text-gray-700 dark:text-gray-300",
        indent === 1 && "pl-6",
        indent === 2 && "pl-10",
        !indent && "pl-3",
        bold && "font-bold text-gray-900 dark:text-white",
      )}>
        {label}
        {note && <span className="text-xs text-gray-400 ml-2">{note}</span>}
      </td>
      <td className={cn(
        "py-2 pl-4 text-right font-mono tabular-nums text-sm w-40",
        bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-800 dark:text-gray-200",
      )}>
        {typeof value === "number" ? gs(value) : value}
      </td>
    </tr>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <tr className="bg-primary-50 dark:bg-primary/10">
      <td colSpan={2} className="py-2 px-3 text-xs font-bold text-primary uppercase tracking-wider">
        {children}
      </td>
    </tr>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  entities:     Array<{ id: string; legalName: string; ruc: string }>;
  defaultYear:  number;
  defaultMonth: number;
  dbError?:     string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Formulario104Client({ entities, defaultYear, defaultMonth, dbError }: Props) {
  const [entityId,  setEntityId]  = useState(entities[0]?.id ?? "");
  const [year,      setYear]      = useState(defaultYear);
  const [month,     setMonth]     = useState(defaultMonth);
  const [data,      setData]      = useState<LibroIVASummary | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [isPending, startLoad]    = useTransition();

  const entity = entities.find((e) => e.id === entityId);

  function handleConsultar() {
    if (!entityId) return;
    setError(null);
    setData(null);
    startLoad(async () => {
      const result = await loadLibroIVA(entityId, year, month);
      if (result.ok) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    });
  }

  // ── Computed values ────────────────────────────────────────────────────────
  // Débito fiscal (ventas)
  const df10   = data?.totals.ventaIVA10    ?? 0;
  const df5    = data?.totals.ventaIVA5     ?? 0;
  const dfTotal = df10 + df5;

  // Crédito fiscal (compras)
  const cf10   = data?.totals.compraIVA10   ?? 0;
  const cf5    = data?.totals.compraIVA5    ?? 0;
  const cfTotal = cf10 + cf5;

  // Bases gravadas
  const base10V = data ? data.totals.ventaSubtotal  - data.totals.ventaIVA5  - data.totals.ventaExento  : 0;
  const base5V  = data ? data.totals.ventaIVA5 / 0.05 * 0.95 : 0;
  const base10C = data ? data.totals.compraSubtotal - data.totals.compraIVA5 - data.totals.compraExento : 0;
  const base5C  = data ? data.totals.compraIVA5 / 0.05 * 0.95 : 0;

  // Saldo IVA: DF − CF (positive = pagar a DNIT, negative = saldo a favor)
  const saldo  = dfTotal - cfTotal;
  const aPagar = Math.max(0,  saldo);
  const aFavor = Math.max(0, -saldo);

  return (
    <div className="page-container max-w-4xl">

      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Error: {dbError}
        </div>
      )}

      {/* Header */}
      <div className="no-print">
        <h1 className="section-title text-2xl lg:text-3xl flex items-center gap-3">
          <FileText className="h-7 w-7 text-primary" /> Formulario 104 — IVA Mensual
        </h1>
        <p className="section-subtitle">Resumen para declaración jurada de IVA ante DNIT</p>
      </div>

      {/* Info banner */}
      <div className="card p-4 flex items-start gap-3 no-print">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Este resumen refleja los comprobantes cargados en el sistema.
          Los valores deben transcribirse al sistema DNIT (Marangatú).
          Verificá con el Libro IVA antes de presentar.
        </p>
      </div>

      {/* Filters */}
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

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Mes</label>
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="appearance-none input-field pr-8 cursor-pointer"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Año</label>
            <input
              type="number"
              value={year}
              min={2020}
              max={2100}
              onChange={(e) => setYear(Number(e.target.value))}
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleConsultar}
            disabled={!entityId || isPending}
            className="btn-secondary flex items-center gap-2"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {isPending ? "Calculando…" : "Generar Formulario 104"}
          </button>

          {data && (
            <button
              onClick={() => window.print()}
              className="btn-ghost flex items-center gap-2"
            >
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

      {/* ─── Form content ─────────────────────────────────────────────────── */}
      {data && entity && (
        <div className="space-y-6 print:space-y-4">

          {/* Print header */}
          <div className="hidden print:block border-2 border-gray-800 p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-lg font-bold">FORMULARIO 104 — IVA MENSUAL</h1>
                <p className="text-sm text-gray-600">Declaración Jurada de IVA · DNIT Paraguay</p>
              </div>
              <div className="text-right text-sm">
                <p><strong>Período:</strong> {MONTHS[month - 1]} {year}</p>
                <p className="text-gray-500">Generado: {new Date().toLocaleDateString("es-PY")} — <span className="font-semibold text-[#104c91] dark:text-[#256ebf]">Inteli</span><span className="font-semibold text-[#00a651]">Cont</span></p>
              </div>
            </div>
          </div>

          {/* Entity header */}
          <div className="card p-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Contribuyente</p>
              <p className="font-bold text-gray-900 dark:text-white">{entity.legalName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">RUC</p>
              <p className="font-bold font-mono text-gray-900 dark:text-white">{entity.ruc}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Período fiscal</p>
              <p className="font-bold text-gray-900 dark:text-white">{MONTHS[month - 1]} {year}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Comprobantes</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {data.compras.length} compras · {data.ventas.length} ventas
              </p>
            </div>
          </div>

          {/* Main form table */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800 dark:bg-slate-900">
                  <th className="text-left py-3 px-3 text-white text-xs font-bold uppercase tracking-wide">Concepto</th>
                  <th className="text-right py-3 px-4 text-white text-xs font-bold uppercase tracking-wide w-44">Guaraníes (₲)</th>
                </tr>
              </thead>
              <tbody>

                {/* ─ DÉBITO FISCAL (VENTAS) ─ */}
                <SectionHeader>SECCIÓN A — DÉBITO FISCAL (VENTAS / INGRESOS)</SectionHeader>
                <Row label="Ventas gravadas tasa 10% (base imponible)"  value={base10V} indent={1} />
                <Row label="IVA débito fiscal 10%"                       value={df10}    indent={2} bold />
                <Row label="Ventas gravadas tasa 5% (base imponible)"   value={base5V}  indent={1} />
                <Row label="IVA débito fiscal 5%"                        value={df5}     indent={2} bold />
                <Row label="Ventas exentas"                              value={data.totals.ventaExento} indent={1} />
                <Row label="Total ventas (incluido IVA)"                 value={data.totals.ventaTotal}  indent={1} />
                <Row label="TOTAL DÉBITO FISCAL"                         value={dfTotal} bold />

                {/* ─ CRÉDITO FISCAL (COMPRAS) ─ */}
                <SectionHeader>SECCIÓN B — CRÉDITO FISCAL (COMPRAS / EGRESOS)</SectionHeader>
                <Row label="Compras gravadas tasa 10% (base imponible)" value={base10C} indent={1} />
                <Row label="IVA crédito fiscal 10%"                      value={cf10}    indent={2} bold />
                <Row label="Compras gravadas tasa 5% (base imponible)"  value={base5C}  indent={1} />
                <Row label="IVA crédito fiscal 5%"                       value={cf5}     indent={2} bold />
                <Row label="Compras exentas"                             value={data.totals.compraExento} indent={1} />
                <Row label="Total compras (incluido IVA)"                value={data.totals.compraTotal}  indent={1} />
                <Row label="TOTAL CRÉDITO FISCAL"                        value={cfTotal} bold />

                {/* ─ LIQUIDACIÓN ─ */}
                <SectionHeader>SECCIÓN C — LIQUIDACIÓN DEL IVA</SectionHeader>
                <Row label="Débito fiscal (A)"                           value={dfTotal}  indent={1} />
                <Row label="Crédito fiscal (B)"                          value={cfTotal}  indent={1} />
                <Row label="Saldo del período (A − B)"                   value={saldo}    indent={1} bold />

                <tr>
                  <td colSpan={2} className="py-2" />
                </tr>

                {aPagar > 0 && (
                  <Row label="⟶ IVA A PAGAR A DNIT" value={aPagar} bold />
                )}
                {aFavor > 0 && (
                  <Row label="⟶ SALDO A FAVOR DEL CONTRIBUYENTE" value={aFavor} bold />
                )}
                {aPagar === 0 && aFavor === 0 && (
                  <Row label="⟶ SALDO CERO — Sin obligación" value="₲ 0" bold />
                )}

              </tbody>
            </table>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className={cn(
              "card p-4 text-center",
              "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10"
            )}>
              <TrendingDown className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide mb-1">Débito Fiscal</p>
              <p className="text-xl font-black font-mono text-blue-900 dark:text-blue-100">₲ {gs(dfTotal)}</p>
            </div>

            <div className={cn(
              "card p-4 text-center",
              "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10"
            )}>
              <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wide mb-1">Crédito Fiscal</p>
              <p className="text-xl font-black font-mono text-green-900 dark:text-green-100">₲ {gs(cfTotal)}</p>
            </div>

            <div className={cn(
              "card p-4 text-center",
              aPagar > 0
                ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
                : "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10"
            )}>
              <Minus className="h-5 w-5 mx-auto mb-1" style={{ color: aPagar > 0 ? "#ef4444" : "#10b981" }} />
              <p className={cn(
                "text-xs font-semibold uppercase tracking-wide mb-1",
                aPagar > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
              )}>
                {aPagar > 0 ? "A Pagar" : "Saldo a Favor"}
              </p>
              <p className={cn(
                "text-xl font-black font-mono",
                aPagar > 0 ? "text-red-900 dark:text-red-100" : "text-emerald-900 dark:text-emerald-100"
              )}>
                ₲ {gs(aPagar > 0 ? aPagar : aFavor)}
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="card-flat p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1 no-print">
            <p className="font-semibold text-gray-600 dark:text-gray-300">⚠ Notas importantes</p>
            <p>• Los valores son calculados con base en los comprobantes cargados (estados: proposed, approved, posted).</p>
            <p>• Este formulario es un <strong>resumen referencial</strong>. La declaración oficial debe realizarse en el portal DNIT (Marangatú).</p>
            <p>• Verificar si existen ajustes, retenciones o saldos de períodos anteriores que afecten el resultado.</p>
            <p>• Bases gravadas calculadas como: base10 = iva10 / 0.10 × 0.90 · base5 = iva5 / 0.05 × 0.95</p>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; font-size: 12px; }
          .card { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  );
}
