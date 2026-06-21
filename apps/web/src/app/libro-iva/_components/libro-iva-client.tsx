"use client";

import { useState, useTransition } from "react";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import {
  BookMarked, ChevronDown, Download, Search,
  Loader2, AlertCircle, RefreshCw, Receipt,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadLibroIVA, generateHechauka, type LibroIVARow } from "../actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const DOC_TYPE_LABEL: Record<string, string> = {
  factura:       "FAC",
  nota_credito:  "NC",
  nota_debito:   "ND",
  autofactura:   "AF",
  nota_remision: "NR",
  retencion:     "RET",
};

function fmt(n: number) {
  return n.toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

// ─── IVA table ────────────────────────────────────────────────────────────────

function IVATable({ rows, label }: { rows: LibroIVARow[]; label: string }) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? rows.filter((r) =>
        r.issuerName.toLowerCase().includes(search.toLowerCase()) ||
        r.issuerRuc.includes(search) ||
        (r.docNumber ?? "").includes(search)
      )
    : rows;

  return (
    <div className="card-flat overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" /> {label}
          <span className="text-gray-400 font-normal text-xs">({rows.length})</span>
        </h3>
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text" placeholder="Buscar..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
              <th className="text-left py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide w-24">Fecha</th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide w-10">Tipo</th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide w-28">Número</th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide">Razón Social</th>
              <th className="text-left py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide w-24">RUC</th>
              <th className="text-right py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide w-28">Grav. 10%</th>
              <th className="text-right py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide w-24">IVA 10%</th>
              <th className="text-right py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide w-24">IVA 5%</th>
              <th className="text-right py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide w-24">Exento</th>
              <th className="text-right py-2.5 px-3 font-semibold text-gray-400 uppercase tracking-wide w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {filtered.map((r) => {
              const base10 = r.iva10 > 0 ? Math.round((r.iva10 / 0.1) * 0.9) : 0;
              return (
                <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/10">
                  <td className="py-2 px-3 font-mono text-gray-600 dark:text-gray-400">{r.issueDate}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-slate-700 text-gray-500">
                      {DOC_TYPE_LABEL[r.docType] ?? r.docType}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-gray-700 dark:text-gray-300">{r.docNumber ?? "—"}</td>
                  <td className="py-2 px-3 text-gray-900 dark:text-white truncate max-w-[200px]">{r.issuerName}</td>
                  <td className="py-2 px-3 font-mono text-gray-500">{r.issuerRuc}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-gray-700 dark:text-gray-300">{fmt(base10)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-primary font-medium">{fmt(r.iva10)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-primary font-medium">{fmt(r.iva5)}</td>
                  <td className="py-2 px-3 text-right tabular-nums text-gray-500">{fmt(r.ivaExento)}</td>
                  <td className="py-2 px-3 text-right tabular-nums font-bold text-gray-900 dark:text-white">{fmt(r.total)}</td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-gray-400 text-xs">
                  {rows.length === 0 ? "Sin comprobantes para este período" : "Sin resultados"}
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-300 dark:border-slate-500 bg-gray-50 dark:bg-slate-800/50 font-bold">
                <td colSpan={5} className="py-2.5 px-3 text-xs text-gray-600 dark:text-gray-400">TOTALES ({rows.length} comprobantes)</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-xs text-gray-900 dark:text-white">
                  {fmt(rows.reduce((s,r) => s + (r.iva10 > 0 ? Math.round((r.iva10/0.1)*0.9) : 0), 0))}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-xs text-primary">{fmt(rows.reduce((s,r)=>s+r.iva10,0))}</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-xs text-primary">{fmt(rows.reduce((s,r)=>s+r.iva5,0))}</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-xs text-gray-500">{fmt(rows.reduce((s,r)=>s+r.ivaExento,0))}</td>
                <td className="py-2.5 px-3 text-right tabular-nums text-xs text-gray-900 dark:text-white">{fmt(rows.reduce((s,r)=>s+r.total,0))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

import type { LibroIVASummary } from "../actions";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  entities:     Array<{ id: string; legalName: string; ruc: string }>;
  defaultYear:  number;
  defaultMonth: number;
  dbError?:     string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LibroIVAClient({ entities, defaultYear, defaultMonth, dbError }: Props) {
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);

  const entityId = selectedEntity?.id || "";

  const [year,     setYear]     = useState(defaultYear);
  const [month,    setMonth]    = useState(defaultMonth);
  const [data,     setData]     = useState<LibroIVASummary | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [, startTransition]     = useTransition();

  const years = Array.from({ length: 5 }, (_, i) => defaultYear - 2 + i);
  const entity = entities.find((e) => e.id === entityId) || selectedEntity;

  function handleConsultar() {
    if (!entityId) { setError("Seleccioná una empresa"); return; }
    setError(null);
    setLoading(true);
    startTransition(async () => {
      const result = await loadLibroIVA(entityId, year, month);
      setLoading(false);
      if (!result.ok) { setError(result.error); return; }
      setData(result.data);
    });
  }

  async function handleExportHechauka(type: "compras" | "ventas") {
    if (!data || !entity) return;
    const rows = type === "compras" ? data.compras : data.ventas;
    const csv  = await generateHechauka(entity.ruc, entity.legalName, year, month, rows, type);
    const blob = new Blob([csv], { type: "text/plain;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `hechauka-${type}-${entity.ruc}-${String(month).padStart(2,"0")}-${year}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const { totals } = data ?? { totals: null };
  const credFiscal  = totals ? totals.compraIVA10 + totals.compraIVA5 : 0;
  const debFiscal   = totals ? totals.ventaIVA10  + totals.ventaIVA5  : 0;
  const saldo       = totals?.saldoIVA ?? 0;

  return (
    <div className="page-container">

      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Error: {dbError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Libro IVA</h1>
          <p className="section-subtitle">Compras y Ventas · Formulario 104 DNIT</p>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <button onClick={() => handleExportHechauka("compras")} className="btn-ghost text-sm">
              <Download className="h-4 w-4" /> Hechauka Compras
            </button>
            <button onClick={() => handleExportHechauka("ventas")} className="btn-ghost text-sm">
              <Download className="h-4 w-4" /> Hechauka Ventas
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Entity */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Empresa Activa</label>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300">
            <span className="uppercase truncate">
              {selectedEntity?.tradeName || selectedEntity?.legalName || "Cargando..."} — {selectedEntity?.ruc}
            </span>
          </div>
        </div>

        {/* Year */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Año</label>
          <div className="relative">
            <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setData(null); }}
              className="appearance-none input-field py-2 pr-8 text-sm cursor-pointer w-full">
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Month */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Mes</label>
          <div className="relative">
            <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setData(null); }}
              className="appearance-none input-field py-2 pr-8 text-sm cursor-pointer w-full">
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="sm:col-span-4 flex justify-end">
          <button onClick={handleConsultar} disabled={loading || !entityId} className="btn-secondary">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando…</> : <><RefreshCw className="h-4 w-4" /> Consultar</>}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* IVA Summary (Formulario 104 base) */}
      {totals && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Crédito Fiscal */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-blue-500" /> Crédito Fiscal (Compras)
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">₲ {fmt(credFiscal)}</p>
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <div className="flex justify-between"><span>IVA 10%</span><span className="font-mono">₲ {fmt(totals.compraIVA10)}</span></div>
              <div className="flex justify-between"><span>IVA 5%</span><span className="font-mono">₲ {fmt(totals.compraIVA5)}</span></div>
              <div className="flex justify-between border-t border-gray-100 dark:border-slate-700 pt-1 font-semibold">
                <span>Total compras</span><span className="font-mono">₲ {fmt(totals.compraTotal)}</span>
              </div>
            </div>
          </div>

          {/* Débito Fiscal */}
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-secondary" /> Débito Fiscal (Ventas)
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">₲ {fmt(debFiscal)}</p>
            <div className="mt-2 space-y-1 text-xs text-gray-500">
              <div className="flex justify-between"><span>IVA 10%</span><span className="font-mono">₲ {fmt(totals.ventaIVA10)}</span></div>
              <div className="flex justify-between"><span>IVA 5%</span><span className="font-mono">₲ {fmt(totals.ventaIVA5)}</span></div>
              <div className="flex justify-between border-t border-gray-100 dark:border-slate-700 pt-1 font-semibold">
                <span>Total ventas</span><span className="font-mono">₲ {fmt(totals.ventaTotal)}</span>
              </div>
            </div>
          </div>

          {/* Saldo IVA */}
          <div className={cn("card p-4", saldo < 0 ? "ring-2 ring-amber-300" : "ring-2 ring-secondary/30")}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Minus className="h-3.5 w-3.5" /> Saldo IVA (CF − DF)
            </p>
            <p className={cn("text-2xl font-black", saldo < 0 ? "text-amber-600" : "text-secondary")}>
              ₲ {fmt(Math.abs(saldo))}
            </p>
            <p className={cn("text-xs font-semibold mt-1", saldo < 0 ? "text-amber-600" : "text-secondary")}>
              {saldo < 0 ? "▲ A pagar a DNIT" : saldo > 0 ? "▼ Saldo a favor" : "= Sin deuda"}
            </p>
            <p className="text-[10px] text-gray-400 mt-2">
              Base para Formulario 104 — {MONTHS[month-1]} {year}
            </p>
          </div>
        </div>
      )}

      {/* Compras */}
      {data && <IVATable rows={data.compras} label={`Libro IVA Compras — ${MONTHS[month-1]} ${year}`} />}

      {/* Ventas */}
      {data && <IVATable rows={data.ventas}  label={`Libro IVA Ventas — ${MONTHS[month-1]} ${year}`} />}

      {/* Empty state before query */}
      {!data && !loading && (
        <div className="card-flat py-20 text-center">
          <BookMarked className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">
            Seleccioná empresa y período, luego hacé clic en Consultar
          </p>
        </div>
      )}
    </div>
  );
}
