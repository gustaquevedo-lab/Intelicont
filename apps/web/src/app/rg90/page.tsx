"use client";

import { useState, useTransition, useMemo } from "react";
import {
  FileSearch, CheckCircle2, AlertCircle, Download,
  Search, Clock, TrendingUp, TrendingDown,
  FileText, Shield, Loader2, X, RefreshCw, Info,
  ChevronDown, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadRG90Data, loadEntidadesParaRG90, generateRG90Csv,
  type RG90Row, type RG90Resumen,
} from "./actions";

function formatGs(n: number) {
  return Math.abs(n).toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

function downloadCsvString(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Summary Cards ─────────────────────────────────────────────────────────

function ResumenPanel({ resumen, period }: { resumen: RG90Resumen; period: string }) {
  const saldoPos = resumen.saldoIva >= 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Compras */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown className="h-4 w-4 text-red-400" />
          <span className="text-sm font-bold text-white">COMPRAS</span>
          <span className="text-[10px] text-gray-500 ml-auto font-mono">{period}</span>
        </div>
        <div className="space-y-2 text-xs">
          {[
            { label: "Gravado 10%", value: resumen.comprasGravado10, color: "text-gray-300" },
            { label: "Gravado 5%",  value: resumen.comprasGravado5,  color: "text-gray-300" },
            { label: "Exento",      value: resumen.comprasExento,     color: "text-gray-300" },
            { label: "IVA Crédito 10%", value: resumen.comprasIva10, color: "text-blue-400" },
            { label: "IVA Crédito 5%",  value: resumen.comprasIva5,  color: "text-blue-400" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between">
              <span className="text-gray-500">{r.label}</span>
              <span className={cn("font-mono tabular-nums", r.color)}>₲ {formatGs(r.value)}</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
            <span className="text-white">TOTAL</span>
            <span className="text-red-400 font-mono">₲ {formatGs(resumen.comprasTotal)}</span>
          </div>
        </div>
      </div>

      {/* Ventas */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-green-400" />
          <span className="text-sm font-bold text-white">VENTAS</span>
          <span className="text-[10px] text-gray-500 ml-auto font-mono">{period}</span>
        </div>
        <div className="space-y-2 text-xs">
          {[
            { label: "Gravado 10%", value: resumen.ventasGravado10, color: "text-gray-300" },
            { label: "Gravado 5%",  value: resumen.ventasGravado5,  color: "text-gray-300" },
            { label: "Exento",      value: resumen.ventasExento,     color: "text-gray-300" },
            { label: "IVA Débito 10%", value: resumen.ventasIva10, color: "text-amber-400" },
            { label: "IVA Débito 5%",  value: resumen.ventasIva5,  color: "text-amber-400" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between">
              <span className="text-gray-500">{r.label}</span>
              <span className={cn("font-mono tabular-nums", r.color)}>₲ {formatGs(r.value)}</span>
            </div>
          ))}
          <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
            <span className="text-white">TOTAL</span>
            <span className="text-green-400 font-mono">₲ {formatGs(resumen.ventasTotal)}</span>
          </div>
        </div>
      </div>

      {/* IVA Saldo */}
      <div className={cn(
        "border rounded-2xl p-4",
        saldoPos ? "bg-amber-950/20 border-amber-800/40" : "bg-green-950/20 border-green-800/40"
      )}>
        <div className="flex items-center gap-2 mb-3">
          <Shield className={cn("h-4 w-4", saldoPos ? "text-amber-400" : "text-green-400")} />
          <span className="text-sm font-bold text-white">SALDO IVA</span>
        </div>
        <div className="space-y-2 text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-gray-500">IVA Débito (ventas)</span>
            <span className="font-mono text-amber-400">₲ {formatGs(resumen.ventasIva10 + resumen.ventasIva5)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">IVA Crédito (compras)</span>
            <span className="font-mono text-blue-400">₲ {formatGs(resumen.comprasIva10 + resumen.comprasIva5)}</span>
          </div>
        </div>
        <div className={cn(
          "p-3 rounded-xl text-center",
          saldoPos ? "bg-amber-500/10" : "bg-green-500/10"
        )}>
          <p className={cn("text-[10px] font-medium mb-1", saldoPos ? "text-amber-400" : "text-green-400")}>
            {saldoPos ? "IVA A PAGAR" : "CRÉDITO A FAVOR"}
          </p>
          <p className={cn("text-2xl font-black font-mono tabular-nums", saldoPos ? "text-amber-300" : "text-green-300")}>
            ₲ {formatGs(resumen.saldoIva)}
          </p>
        </div>
        <p className="text-[9px] text-gray-600 mt-2 text-center">Base para Formulario IVA — Marangatú</p>
      </div>
    </div>
  );
}

// ─── Row Table ──────────────────────────────────────────────────────────────

function DocumentTable({
  rows,
  tipo,
  onExport,
}: {
  rows:     RG90Row[];
  tipo:     "compras" | "ventas";
  onExport: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() =>
    rows.filter((r) => {
      const s = search.toLowerCase();
      return !s || r.nombre.toLowerCase().includes(s) || r.ruc.includes(s) || r.numero.includes(s);
    }),
    [rows, search]
  );

  const totalGrav10 = filtered.reduce((s, r) => s + r.gravado10, 0);
  const totalIva10  = filtered.reduce((s, r) => s + r.iva10, 0);
  const totalTotal  = filtered.reduce((s, r) => s + r.total, 0);

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          {tipo === "compras"
            ? <TrendingDown className="h-4 w-4 text-red-400" />
            : <TrendingUp   className="h-4 w-4 text-green-400" />}
          <span className="text-sm font-bold text-white">
            {tipo === "compras" ? "LIBRO DE COMPRAS" : "LIBRO DE VENTAS"}
          </span>
          <span className="text-[10px] text-gray-500">{filtered.length} comprobantes</span>
        </div>
        <button onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700/80 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors">
          <Download className="h-3.5 w-3.5" /> CSV Marangatú
        </button>
      </div>

      <div className="p-3 border-b border-gray-800/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, RUC o número…"
            className="w-full pl-9 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
        </div>
      </div>

      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-900 border-b border-gray-800">
              {["Fecha", "Nro. Comprobante", "Timbrado", "RUC", tipo === "compras" ? "Proveedor" : "Cliente", "Grav. 10%", "IVA 10%", "Total"].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[10px] text-gray-500 font-medium uppercase whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-500 text-xs">
                  Sin comprobantes en este período
                </td>
              </tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-800/20 transition-colors">
                <td className="px-3 py-2 text-gray-400 font-mono whitespace-nowrap">{r.fecha}</td>
                <td className="px-3 py-2 text-white font-mono">{r.numero}</td>
                <td className="px-3 py-2 text-gray-500 font-mono">{r.timbrado}</td>
                <td className="px-3 py-2 text-gray-400 font-mono">{r.ruc}</td>
                <td className="px-3 py-2 text-gray-300 max-w-[180px] truncate">{r.nombre}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-300">₲ {formatGs(r.gravado10)}</td>
                <td className="px-3 py-2 text-right font-mono text-blue-400">₲ {formatGs(r.iva10)}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-white">₲ {formatGs(r.total)}</td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="sticky bottom-0">
              <tr className="bg-gray-900 border-t-2 border-gray-700">
                <td colSpan={5} className="px-3 py-2 text-xs font-bold text-gray-400 uppercase">TOTALES</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-gray-200">₲ {formatGs(totalGrav10)}</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-300">₲ {formatGs(totalIva10)}</td>
                <td className="px-3 py-2 text-right font-mono font-black text-white">₲ {formatGs(totalTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const TABS = ["resumen", "compras", "ventas"] as const;
type Tab = typeof TABS[number];

export default function RG90Page() {
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo   = now.toISOString().slice(0, 10);

  const [entityId,  setEntityId]  = useState("");
  const [entities,  setEntities]  = useState<Array<{ id: string; legalName: string; ruc: string }>>([]);
  const [from,      setFrom]      = useState(defaultFrom);
  const [to,        setTo]        = useState(defaultTo);
  const [tab,       setTab]       = useState<Tab>("resumen");
  const [data,      setData]      = useState<{ rows: RG90Row[]; resumen: RG90Resumen } | null>(null);
  const [error,     setError]     = useState("");
  const [feedback,  setFeedback]  = useState("");

  const [loading,   startLoad]    = useTransition();
  const [initDone,  setInitDone]  = useState(false);

  // Load entities on mount
  if (!initDone) {
    setInitDone(true);
    loadEntidadesParaRG90().then((r) => {
      if (r.ok && r.data.length > 0) {
        setEntities(r.data);
        setEntityId(r.data[0].id);
      }
    });
  }

  function handleLoad() {
    if (!entityId) { setError("Seleccioná una empresa"); return; }
    setError("");
    setData(null);
    startLoad(async () => {
      const res = await loadRG90Data(entityId, from, to);
      if (res.ok) setData(res.data);
      else setError(res.error);
    });
  }

  async function handleExport(tipo: "compras" | "ventas") {
    if (!data) return;
    const csv      = await generateRG90Csv(data.rows, tipo);
    const entity   = entities.find((e) => e.id === entityId);
    const filename = `RG90_${tipo.toUpperCase()}_${entity?.ruc ?? "empresa"}_${from}_${to}.csv`;
    downloadCsvString(csv, filename);
    setFeedback(`✓ CSV ${tipo} exportado: ${filename}`);
  }

  const period = `${from} → ${to}`;
  const compras = data?.rows.filter((r) => r.tipo === "recibido") ?? [];
  const ventas  = data?.rows.filter((r) => r.tipo === "emitido")  ?? [];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-blue-400" />
            RG 90 — Libro Electrónico
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Libro de Compras y Ventas · Resolución General 90/2021 DNIT
          </p>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <button onClick={() => handleExport("compras")}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-700/80 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Download className="h-4 w-4" /> CSV Compras
            </button>
            <button onClick={() => handleExport("ventas")}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-700/80 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
              <Download className="h-4 w-4" /> CSV Ventas
            </button>
          </div>
        )}
      </div>

      {/* Banner DNIT */}
      <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-300">
          <span className="font-semibold">DNIT — RG 90/2021:</span> El antiguo Hechauka fue reemplazado por el RG 90 en Marangatú.
          Los CSV generados aquí usan el formato de Libro de Compras/Ventas compatible con el sistema DNIT.
          <span className="ml-1 text-blue-400 font-medium">IVA Débito − IVA Crédito = Saldo a pagar en Formulario IVA.</span>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-green-950/20 border-green-800/40 text-green-400 text-sm">
          <span>{feedback}</span>
          <button onClick={() => setFeedback("")}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Empresa</label>
            <select value={entityId} onChange={(e) => setEntityId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
              <option value="">— Seleccioná empresa —</option>
              {entities.map((e) => <option key={e.id} value={e.id}>{e.legalName} ({e.ruc})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>
        </div>
        <button onClick={handleLoad} disabled={loading || !entityId}
          className="mt-3 flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSearch className="h-4 w-4" />}
          {loading ? "Cargando…" : "Generar Libro RG90"}
        </button>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      {data && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-900/60 p-1 rounded-xl w-fit border border-gray-800">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  tab === t ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
                )}>
                {t === "resumen" ? "Resumen IVA" : t === "compras" ? `Compras (${compras.length})` : `Ventas (${ventas.length})`}
              </button>
            ))}
          </div>

          {tab === "resumen" && <ResumenPanel resumen={data.resumen} period={period} />}
          {tab === "compras" && <DocumentTable rows={compras} tipo="compras" onExport={() => handleExport("compras")} />}
          {tab === "ventas"  && <DocumentTable rows={ventas}  tipo="ventas"  onExport={() => handleExport("ventas")}  />}
        </>
      )}
    </div>
  );
}
