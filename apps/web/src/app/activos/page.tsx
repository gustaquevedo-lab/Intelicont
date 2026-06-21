"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import {
  Package, Plus, Calculator, TrendingDown, Calendar,
  Search, X, Loader2, Zap, CheckCircle2, AlertTriangle,
  BarChart3, DollarSign, ChevronRight, Sparkles, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadFixedAssetsDetailed, createFixedAsset, generateDepreciationEntry,
  generateBulkDepreciation, loadGlAccounts,
  type FixedAssetRow,
} from "./activos-actions";

function formatGs(n: number) {
  return n.toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

// ─── New Asset Modal ───────────────────────────────────────────────────────

function NewAssetModal({
  entityId,
  accounts,
  onClose,
  onCreated,
}: {
  entityId: string;
  accounts: Array<{ id: string; code: string; name: string; nature: string }>;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    serialNumber: "",
    adquisitionDate: new Date().toISOString().split("T")[0],
    costValue: "",
    usefulLifeMonths: "60",
    glAccountId: "",
    depreciationAccountId: "",
  });
  const [pending, startT] = useTransition();
  const [error, setError] = useState("");

  function handleSave() {
    if (!form.code || !form.name || !form.adquisitionDate || !form.costValue) {
      setError("Completá los campos obligatorios (*)"); return;
    }
    setError("");
    startT(async () => {
      const res = await createFixedAsset({
        entityId,
        code:            form.code,
        name:            form.name,
        serialNumber:    form.serialNumber || undefined,
        adquisitionDate: form.adquisitionDate,
        costValue:       parseFloat(form.costValue.replace(/[^0-9.]/g, "")),
        usefulLifeMonths: parseInt(form.usefulLifeMonths),
        glAccountId:     form.glAccountId || undefined,
        depreciationAccountId: form.depreciationAccountId || undefined,
      });
      if (res.ok) { onCreated(); onClose(); }
      else setError(res.error);
    });
  }

  const assetAccounts = accounts.filter((a) => a.nature === "asset");
  const expenseAccounts = accounts.filter((a) => a.nature === "expense");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-950 border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-400" /> Registrar Activo Fijo
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Código *</label>
              <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="AF-001" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nro. Serie</label>
              <input value={form.serialNumber} onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
                placeholder="SN-12345" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Nombre / Descripción *</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Toyota Hilux 4x4" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha Adquisición *</label>
              <input type="date" value={form.adquisitionDate} onChange={(e) => setForm((f) => ({ ...f, adquisitionDate: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Valor Costo (Gs.) *</label>
              <input value={form.costValue} onChange={(e) => setForm((f) => ({ ...f, costValue: e.target.value }))}
                placeholder="150.000.000" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Vida Útil (meses) *</label>
              <select value={form.usefulLifeMonths} onChange={(e) => setForm((f) => ({ ...f, usefulLifeMonths: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="24">24 m (2 años)</option>
                <option value="36">36 m (3 años)</option>
                <option value="48">48 m (4 años)</option>
                <option value="60">60 m (5 años)</option>
                <option value="96">96 m (8 años)</option>
                <option value="120">120 m (10 años)</option>
                <option value="180">180 m (15 años)</option>
                <option value="240">240 m (20 años)</option>
              </select>
            </div>
          </div>

          {accounts.length > 0 && (
            <>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cuenta Activo (Bs. de Uso)</label>
                <select value={form.glAccountId} onChange={(e) => setForm((f) => ({ ...f, glAccountId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">— Sin asignar —</option>
                  {assetAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cuenta Depreciación (Gasto)</label>
                <select value={form.depreciationAccountId} onChange={(e) => setForm((f) => ({ ...f, depreciationAccountId: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                  <option value="">— Sin asignar —</option>
                  {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        {/* Preview */}
        {form.costValue && form.usefulLifeMonths && (
          <div className="mt-4 p-3 bg-blue-950/20 border border-blue-800/30 rounded-xl">
            <p className="text-[10px] text-blue-400 mb-1 font-semibold">PREVIEW — Depreciación Lineal</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <span className="text-gray-400">Dep. mensual:</span>
              <span className="text-blue-300 text-right">
                Gs. {formatGs(Math.round(parseFloat(form.costValue.replace(/[^0-9.]/g, "") || "0") / parseInt(form.usefulLifeMonths || "1")))}
              </span>
              <span className="text-gray-400">Dep. anual:</span>
              <span className="text-blue-300 text-right">
                Gs. {formatGs(Math.round(parseFloat(form.costValue.replace(/[^0-9.]/g, "") || "0") / parseInt(form.usefulLifeMonths || "1") * 12))}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800">Cancelar</button>
          <button onClick={handleSave} disabled={pending}
            className="flex-1 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? "Registrando..." : "Registrar Activo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail + Depreciation Panel ──────────────────────────────────────────

function AssetDetailPanel({
  asset,
  entityId,
  onClose,
  onRefresh,
}: {
  asset: FixedAssetRow;
  entityId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [deprPeriod, setDeprPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [genPending, startGen] = useTransition();
  const [deprResult, setDeprResult] = useState<{ entryNumber: string; amount: number } | null>(null);
  const [deprError, setDeprError] = useState("");

  function handleGenerate() {
    setDeprResult(null);
    setDeprError("");
    startGen(async () => {
      const res = await generateDepreciationEntry(entityId, asset.id, deprPeriod);
      if (res.ok) { setDeprResult(res.data); onRefresh(); }
      else setDeprError(res.error);
    });
  }

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-bold text-white">{asset.code} — {asset.name}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
      </div>

      <div className="p-4 space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label: "Costo",          value: `Gs. ${formatGs(asset.costValue)}` },
            { label: "VNR Actual",     value: `Gs. ${formatGs(asset.netBookValue)}` },
            { label: "Dep. Mensual",   value: `Gs. ${formatGs(asset.monthlyDepreciation)}` },
            { label: "Vida Útil",      value: `${asset.usefulLifeMonths} m · ${asset.remainingMonths} rest.` },
          ].map((m) => (
            <div key={m.label} className="bg-gray-900 rounded-xl p-3">
              <p className="text-gray-500 mb-0.5">{m.label}</p>
              <p className="text-white font-mono font-medium">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400">Progreso de depreciación</span>
            <span className={cn("font-mono font-bold", asset.status === "fully_depreciated" ? "text-green-400" : "text-blue-400")}>
              {asset.percentDepreciated.toFixed(1)}%
            </span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", asset.status === "fully_depreciated" ? "bg-green-500" : "bg-gradient-to-r from-blue-600 to-blue-400")}
              style={{ width: `${Math.min(100, asset.percentDepreciated)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>Gs. {formatGs(asset.depreciatedValue)} dep. acumulada</span>
            <span>{asset.monthsElapsed} meses transcurridos</span>
          </div>
        </div>

        {/* Suggested journal entry */}
        <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-300">Asiento de Depreciación Mensual</span>
          </div>
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between text-purple-300">
              <span>Depreciación — {asset.name.slice(0, 25)}</span>
              <span>D: Gs. {formatGs(asset.monthlyDepreciation)}</span>
            </div>
            <div className="flex justify-between text-purple-400/70">
              <span>Dep. Acumulada — {asset.name.slice(0, 20)}</span>
              <span>H: Gs. {formatGs(asset.monthlyDepreciation)}</span>
            </div>
          </div>
        </div>

        {/* Generate depreciation */}
        {asset.status === "active" && (
          <div className="border border-gray-800 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-300">Generar Asiento de Depreciación</p>
            <div className="flex gap-2">
              <input
                type="month"
                value={deprPeriod}
                onChange={(e) => setDeprPeriod(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              />
              <button onClick={handleGenerate} disabled={genPending || !asset.glAccountId || !asset.depreciationAccountId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors">
                {genPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Generar
              </button>
            </div>
            {!asset.glAccountId && <p className="text-[10px] text-amber-400">⚠ Asigná cuentas contables al activo para generar asientos.</p>}
            {deprResult && (
              <p className="text-[10px] text-green-400 font-medium">✓ Asiento {deprResult.entryNumber} generado — Gs. {formatGs(deprResult.amount)}</p>
            )}
            {deprError && <p className="text-[10px] text-red-400">{deprError}</p>}
          </div>
        )}

        {asset.status === "fully_depreciated" && (
          <div className="flex items-center gap-2 p-3 bg-green-950/20 border border-green-800/30 rounded-xl">
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
            <p className="text-xs text-green-400">Este activo está completamente depreciado. VNR = Gs. 0</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────

function Kpi({ title, value, sub, icon: Icon, color }: {
  title: string; value: string; sub?: string; icon: any; color: string
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{title}</span>
        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", color)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-lg font-bold text-white font-mono">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ActivosFijosPage() {
  const [assets, setAssets]         = useState<FixedAssetRow[]>([]);
  const [accounts, setAccounts]     = useState<Array<{ id: string; code: string; name: string; nature: string }>>([]);
  const [selected, setSelected]     = useState<FixedAssetRow | null>(null);
  const [showModal, setShowModal]   = useState(false);
  const [search, setSearch]         = useState("");
  const [loading, startLoad]        = useTransition();
  const [bulkPending, startBulk]    = useTransition();
  const [bulkPeriod, setBulkPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [feedback, setFeedback]     = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const entityId = typeof window !== "undefined"
    ? (localStorage.getItem("selectedEntityId") || sessionStorage.getItem("selectedEntityId") || "")
    : "";

  const refresh = () => {
    if (!entityId) return;
    startLoad(async () => {
      const [assetRes, accRes] = await Promise.all([
        loadFixedAssetsDetailed(entityId),
        loadGlAccounts(entityId),
      ]);
      if (assetRes.ok) setAssets(assetRes.data);
      if (accRes.ok) setAccounts(accRes.data);
    });
  };

  useEffect(() => { refresh(); }, []);

  function handleBulkDepreciation() {
    setFeedback(null);
    startBulk(async () => {
      const res = await generateBulkDepreciation(entityId, bulkPeriod);
      if (res.ok) {
        const { processed, totalAmount, errors } = res.data;
        setFeedback({
          type: errors.length === 0 ? "ok" : "err",
          msg: `✓ ${processed} asientos generados por Gs. ${formatGs(totalAmount)}${errors.length > 0 ? ` · ${errors.length} errores: ${errors.join(", ")}` : ""}`,
        });
        refresh();
      } else {
        setFeedback({ type: "err", msg: res.error });
      }
    });
  }

  const filtered = useMemo(() =>
    assets.filter((a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    ), [assets, search]);

  const totalCosto     = assets.reduce((s, a) => s + a.costValue, 0);
  const totalDepr      = assets.reduce((s, a) => s + a.depreciatedValue, 0);
  const totalVNR       = assets.reduce((s, a) => s + a.netBookValue, 0);
  const monthlyTotal   = assets.filter((a) => a.status === "active").reduce((s, a) => s + a.monthlyDepreciation, 0);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-400" /> Bienes de Uso
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Activos fijos, depreciación y revalúo contable</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Bulk depreciation */}
          <div className="flex items-center gap-1">
            <input type="month" value={bulkPeriod} onChange={(e) => setBulkPeriod(e.target.value)}
              className="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none" />
            <button onClick={handleBulkDepreciation} disabled={bulkPending || assets.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors">
              {bulkPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Depr. Masiva
            </button>
          </div>
          <button onClick={refresh} disabled={loading} className="p-2 text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">
            <Plus className="h-4 w-4" /> Nuevo Activo
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm",
          feedback.type === "ok" ? "bg-green-950/20 border-green-800/40 text-green-400" : "bg-red-950/20 border-red-800/40 text-red-400"
        )}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi title="Costo Total"    value={`Gs. ${formatGs(Math.round(totalCosto/1000000))}M`}  icon={Package}      color="text-blue-400 bg-blue-500/10" />
        <Kpi title="Dep. Acumulada" value={`Gs. ${formatGs(Math.round(totalDepr/1000000))}M`}   icon={TrendingDown}  color="text-amber-400 bg-amber-500/10" />
        <Kpi title="VNR Total"      value={`Gs. ${formatGs(Math.round(totalVNR/1000000))}M`}    icon={Calculator}    color="text-green-400 bg-green-500/10" />
        <Kpi title="Dep. Mensual"   value={`Gs. ${formatGs(Math.round(monthlyTotal/1000000))}M`} icon={Calendar}     color="text-purple-400 bg-purple-500/10"
          sub={`${assets.filter((a) => a.status === "active").length} activos activos`} />
      </div>

      {/* Table */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-gray-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar activo…"
              className="w-full pl-9 pr-4 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 && assets.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="h-10 w-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">Sin activos registrados</p>
            <p className="text-xs text-gray-600 mt-1">Registrá tu primer bien de uso con el botón "Nuevo Activo"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/60">
                  {["Código", "Nombre", "Adquisición", "Costo", "Dep. Mensual", "Dep. Acum.", "VNR", "Progreso", "Estado", ""].map((h) => (
                    <th key={h} className={cn("px-3 py-2.5 text-[10px] text-gray-500 font-medium uppercase tracking-wide",
                      h === "" ? "w-6" : h === "Progreso" ? "w-28" : ""
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {filtered.map((asset) => (
                  <tr key={asset.id}
                    onClick={() => setSelected(selected?.id === asset.id ? null : asset)}
                    className={cn("hover:bg-gray-800/20 cursor-pointer transition-colors",
                      selected?.id === asset.id && "bg-blue-900/10"
                    )}>
                    <td className="px-3 py-2.5 font-mono text-blue-400">{asset.code}</td>
                    <td className="px-3 py-2.5 text-white max-w-[180px] truncate">{asset.name}</td>
                    <td className="px-3 py-2.5 text-gray-400 font-mono">{asset.adquisitionDate}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-300">Gs. {formatGs(asset.costValue)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-amber-400">Gs. {formatGs(asset.monthlyDepreciation)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-400">Gs. {formatGs(asset.depreciatedValue)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-white">Gs. {formatGs(asset.netBookValue)}</td>
                    <td className="px-3 py-2.5 w-28">
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", asset.status === "fully_depreciated" ? "bg-green-500" : "bg-blue-500")}
                          style={{ width: `${Math.min(100, asset.percentDepreciated)}%` }} />
                      </div>
                      <p className="text-[9px] text-gray-500 mt-0.5 text-right">{asset.percentDepreciated.toFixed(0)}%</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        asset.status === "active" ? "bg-green-500/10 text-green-400" : "bg-gray-700 text-gray-400"
                      )}>
                        {asset.status === "active" ? "Activo" : "Depreciado"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <ChevronRight className={cn("h-3.5 w-3.5 transition-transform",
                        selected?.id === asset.id ? "rotate-90 text-blue-400" : "text-gray-600"
                      )} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <AssetDetailPanel
          asset={selected}
          entityId={entityId}
          onClose={() => setSelected(null)}
          onRefresh={refresh}
        />
      )}

      {/* Modal */}
      {showModal && (
        <NewAssetModal
          entityId={entityId}
          accounts={accounts}
          onClose={() => setShowModal(false)}
          onCreated={() => { refresh(); setShowModal(false); }}
        />
      )}
    </div>
  );
}
