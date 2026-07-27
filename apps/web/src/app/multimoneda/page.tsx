"use client";

import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowRightLeft,
  Plus, Globe, ArrowUp, ArrowDown, X, CheckCircle2,
  Sparkles, RefreshCw, Info, AlertTriangle, Edit2,
  Calendar, Building2, BarChart3, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TasaCambio {
  moneda: string;
  simbolo: string;
  compra: number;
  venta: number;
  fecha: string;
  variacion: number;
}

interface TransaccionME {
  id: string;
  fecha: string;
  tipo: "Compra" | "Venta" | "Pago" | "Cobro";
  descripcion: string;
  moneda: string;
  montoME: number;
  tasa: number;
  montoPYG: number;
  partner: string;
  asiento?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TASAS_INIT: TasaCambio[] = [
  { moneda: "USD", simbolo: "US$", compra: 7350, venta: 7450, fecha: "2026-05-12", variacion: -25 },
  { moneda: "EUR", simbolo: "€",   compra: 7900, venta: 8050, fecha: "2026-05-12", variacion: 50 },
  { moneda: "BRL", simbolo: "R$",  compra: 1280, venta: 1350, fecha: "2026-05-12", variacion: -10 },
  { moneda: "ARS", simbolo: "AR$", compra: 6.5,  venta: 7.2,  fecha: "2026-05-12", variacion: 0.3 },
];

const TRANSACCIONES_INIT: TransaccionME[] = [
  { id: "t1", fecha: "2026-05-01", tipo: "Compra", descripcion: "Importación mercadería", moneda: "USD", montoME: 15000, tasa: 7400, montoPYG: 111000000, partner: "Global Trade Inc.", asiento: "JE-001234" },
  { id: "t2", fecha: "2026-05-05", tipo: "Venta",  descripcion: "Exportación servicios",  moneda: "USD", montoME: 8500,  tasa: 7380, montoPYG: 62730000,  partner: "Tech Solutions LLC", asiento: "JE-001235" },
  { id: "t3", fecha: "2026-05-08", tipo: "Compra", descripcion: "Equipos médicos",        moneda: "EUR", montoME: 12000, tasa: 7950, montoPYG: 95400000,  partner: "MedEquip GmbH", asiento: "JE-001236" },
  { id: "t4", fecha: "2026-05-10", tipo: "Pago",   descripcion: "Anticipo proveedor",     moneda: "USD", montoME: 5000,  tasa: 7420, montoPYG: 37100000,  partner: "Supply Chain Co.", asiento: "JE-001237" },
  { id: "t5", fecha: "2026-04-30", tipo: "Cobro",  descripcion: "Factura exportación",    moneda: "USD", montoME: 22000, tasa: 7450, montoPYG: 163900000, partner: "Intl Services Ltd.", asiento: "JE-001230" },
];

function formatGs(n: number) { return `Gs. ${Math.round(n).toLocaleString("es-PY")}`; }

const TIPOS_TRANSACCION = ["Compra", "Venta", "Pago", "Cobro"] as const;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MultimonedaPage() {
  const [tab, setTab] = useState<"tasas" | "transacciones">("transacciones");
  const [tasas, setTasas] = useState<TasaCambio[]>(TASAS_INIT);
  const [transacciones, setTransacciones] = useState<TransaccionME[]>(TRANSACCIONES_INIT);

  // Modals
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [showUpdateRatesModal, setShowUpdateRatesModal] = useState(false);
  const [showFxModal, setShowFxModal] = useState(false);
  const [showTxDetail, setShowTxDetail] = useState<TransaccionME | null>(null);

  // New transaction form
  const [txForm, setTxForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    tipo: "Compra" as typeof TIPOS_TRANSACCION[number],
    descripcion: "",
    moneda: "USD",
    montoME: "",
    partner: "",
  });

  // Rate update form
  const [rateEdits, setRateEdits] = useState<Record<string, { compra: string; venta: string }>>({});
  const [rateSuccess, setRateSuccess] = useState(false);

  // FX Difference
  const [fxSuccess, setFxSuccess] = useState(false);

  // Computed saldos
  const saldos = useMemo(() => {
    const saldo: Record<string, { compras: number; ventas: number; neto: number }> = {};
    for (const t of transacciones) {
      if (!saldo[t.moneda]) saldo[t.moneda] = { compras: 0, ventas: 0, neto: 0 };
      if (t.tipo === "Compra" || t.tipo === "Pago") saldo[t.moneda].compras += t.montoME;
      else saldo[t.moneda].ventas += t.montoME;
    }
    for (const m of Object.keys(saldo)) saldo[m].neto = saldo[m].ventas - saldo[m].compras;
    return saldo;
  }, [transacciones]);

  // FX calculation
  const fxDiff = useMemo(() => {
    return tasas.map(t => {
      const posicion = saldos[t.moneda];
      if (!posicion) return null;
      const valorOriginal = posicion.neto * t.compra;
      const valorActual = posicion.neto * t.venta;
      const diferencia = valorActual - valorOriginal;
      return { moneda: t.moneda, simbolo: t.simbolo, saldoME: posicion.neto, diferencia };
    }).filter(Boolean);
  }, [saldos, tasas]);

  const handleAddTransaction = () => {
    if (!txForm.descripcion || !txForm.montoME || !txForm.partner) return;
    const tasa = tasas.find(t => t.moneda === txForm.moneda);
    const montoME = parseFloat(txForm.montoME);
    const montoPYG = montoME * (tasa?.venta || 7400);

    const newTx: TransaccionME = {
      id: `t${Date.now()}`,
      fecha: txForm.fecha,
      tipo: txForm.tipo,
      descripcion: txForm.descripcion,
      moneda: txForm.moneda,
      montoME,
      tasa: tasa?.venta || 7400,
      montoPYG,
      partner: txForm.partner,
      asiento: `JE-${Date.now().toString().slice(-6)}`,
    };
    setTransacciones(prev => [newTx, ...prev]);
    setShowNewTxModal(false);
    setTxForm({ fecha: new Date().toISOString().split("T")[0], tipo: "Compra", descripcion: "", moneda: "USD", montoME: "", partner: "" });
  };

  const handleUpdateRates = () => {
    setTasas(prev => prev.map(t => {
      const edit = rateEdits[t.moneda];
      if (!edit) return t;
      return {
        ...t,
        compra: parseFloat(edit.compra) || t.compra,
        venta: parseFloat(edit.venta) || t.venta,
        fecha: new Date().toISOString().split("T")[0],
        variacion: 0,
      };
    }));
    setShowUpdateRatesModal(false);
    setRateEdits({});
    setRateSuccess(true);
    setTimeout(() => setRateSuccess(false), 3000);
  };

  const handleGenerateFxEntry = () => {
    setFxSuccess(true);
    setTimeout(() => { setFxSuccess(false); setShowFxModal(false); }, 2500);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Multimoneda</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Tasas de cambio, transacciones en ME y diferencia de cambio
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowFxModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-300 border border-amber-800/40 rounded-xl text-sm font-semibold transition-all">
            <TrendingDown className="h-4 w-4" /> Diferencia de Cambio
          </button>
          <button onClick={() => setShowUpdateRatesModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700/50 rounded-xl text-sm font-semibold transition-all">
            <RefreshCw className="h-4 w-4" /> Actualizar Tasas
          </button>
          <button onClick={() => setShowNewTxModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/10">
            <Plus className="h-4 w-4" /> Nueva Transacción ME
          </button>
        </div>
      </div>

      {/* Rate update success toast */}
      {rateSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-950/20 border border-green-800/40 rounded-xl text-sm text-green-400 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4" /> Tasas de cambio actualizadas correctamente.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/80 border border-gray-700/50 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("transacciones")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
          tab === "transacciones" ? "bg-gray-700 text-white shadow-sm" : "text-gray-400 hover:text-white")}>
          Transacciones
        </button>
        <button onClick={() => setTab("tasas")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
          tab === "tasas" ? "bg-gray-700 text-white shadow-sm" : "text-gray-400 hover:text-white")}>
          Tasas de Cambio
        </button>
      </div>

      {/* ─── TASAS TAB ──────────────────────────────────────────────────── */}
      {tab === "tasas" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tasas.map(t => (
              <div key={t.moneda} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 space-y-3 hover:border-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-white">{t.simbolo}</span>
                    <span className="text-xs text-gray-500 ml-1.5">{t.moneda}</span>
                  </div>
                  <div className={cn("flex items-center gap-0.5 text-xs font-bold",
                    t.variacion < 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {t.variacion < 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                    {Math.abs(t.variacion)}
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Compra</span>
                    <span className="font-mono text-gray-200 font-semibold">{formatGs(t.compra)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Venta</span>
                    <span className="font-mono text-green-300 font-semibold">{formatGs(t.venta)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-600">Actualizado: {t.fecha}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-400" /> Conversor Rápido
            </h3>
            <SimpleConverter tasas={tasas} />
          </div>
        </>
      )}

      {/* ─── TRANSACCIONES TAB ──────────────────────────────────────────── */}
      {tab === "transacciones" && (
        <>
          {/* Saldos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(saldos).map(([moneda, s]) => {
              const t = tasas.find(t => t.moneda === moneda);
              return (
                <div key={moneda} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-gray-500 font-bold uppercase">{moneda}</span>
                    <span className={cn("text-[10px] font-semibold",
                      s.neto >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {s.neto >= 0 ? "Posición larga" : "Posición corta"}
                    </span>
                  </div>
                  <p className={cn("text-xl font-black font-mono",
                    s.neto >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {t?.simbolo || moneda} {Math.abs(s.neto).toLocaleString("es-PY")}
                  </p>
                  <div className="flex gap-2 text-[10px] text-gray-500 mt-1">
                    <span>Compras: {s.compras.toLocaleString()}</span>
                    <span>Ventas: {s.ventas.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transactions table */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/20">
              <h3 className="text-sm font-bold text-white">Transacciones en Moneda Extranjera</h3>
              <span className="text-xs text-gray-500">{transacciones.length} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-950/30 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="px-3 py-2.5 text-left">Fecha</th>
                    <th className="px-3 py-2.5 text-left">Tipo</th>
                    <th className="px-3 py-2.5 text-left">Descripción</th>
                    <th className="px-3 py-2.5 text-left">Partner</th>
                    <th className="px-3 py-2.5 text-right">Monto ME</th>
                    <th className="px-3 py-2.5 text-right">Tasa</th>
                    <th className="px-3 py-2.5 text-right">Monto PYG</th>
                    <th className="px-3 py-2.5 text-center">Asiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {transacciones.map(t => (
                    <tr key={t.id} onClick={() => setShowTxDetail(t)}
                      className="hover:bg-gray-800/20 cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 text-gray-400 font-mono">{t.fecha}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                          t.tipo === "Compra" || t.tipo === "Pago"
                            ? "bg-red-500/10 text-red-400 border border-red-800/30"
                            : "bg-green-500/10 text-green-400 border border-green-800/30"
                        )}>{t.tipo}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-200 max-w-[160px] truncate">{t.descripcion}</td>
                      <td className="px-3 py-2.5 text-gray-400 truncate max-w-[120px]">{t.partner}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-white">{t.moneda} {t.montoME.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-500">{formatGs(t.tasa)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-200">{formatGs(t.montoPYG)}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-blue-400 text-[10px]">{t.asiento}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ─── New Transaction Modal ───────────────────────────────────────── */}
      {showNewTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nueva Transacción ME</h3>
                  <p className="text-[11px] text-gray-500">Moneda extranjera con tasa de cambio</p>
                </div>
              </div>
              <button onClick={() => setShowNewTxModal(false)} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Tipo */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tipo de Operación</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIPOS_TRANSACCION.map(tipo => (
                    <button key={tipo} onClick={() => setTxForm(f => ({ ...f, tipo }))}
                      className={cn("py-1.5 text-xs font-semibold rounded-lg border transition-all",
                        txForm.tipo === tipo
                          ? (tipo === "Compra" || tipo === "Pago")
                            ? "bg-red-600 text-white border-red-500"
                            : "bg-green-600 text-white border-green-500"
                          : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                      )}>
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha</label>
                  <input type="date" value={txForm.fecha} onChange={e => setTxForm(f => ({ ...f, fecha: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Moneda</label>
                  <select value={txForm.moneda} onChange={e => setTxForm(f => ({ ...f, moneda: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                    {tasas.map(t => <option key={t.moneda} value={t.moneda}>{t.moneda} — {t.simbolo}</option>)}
                  </select>
                </div>
              </div>

              {/* Descripcion + Partner */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Descripción</label>
                <input value={txForm.descripcion} onChange={e => setTxForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Importación de equipos"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Empresa / Partner</label>
                <input value={txForm.partner} onChange={e => setTxForm(f => ({ ...f, partner: e.target.value }))}
                  placeholder="Razón social del partner"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Monto ({txForm.moneda})
                </label>
                <input type="number" value={txForm.montoME} onChange={e => setTxForm(f => ({ ...f, montoME: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>

              {/* Preview conversion */}
              {txForm.montoME && parseFloat(txForm.montoME) > 0 && (
                <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl p-3">
                  <p className="text-[10px] text-blue-400 font-bold uppercase mb-1.5">Conversión a PYG (tasa venta)</p>
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <span className="text-gray-400">{txForm.montoME} {txForm.moneda}</span>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-white font-bold">
                      {formatGs(parseFloat(txForm.montoME) * (tasas.find(t => t.moneda === txForm.moneda)?.venta || 7400))}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Tasa: {formatGs(tasas.find(t => t.moneda === txForm.moneda)?.venta || 7400)} / {txForm.moneda}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowNewTxModal(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleAddTransaction}
                disabled={!txForm.descripcion || !txForm.montoME || !txForm.partner}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
                Registrar y Contabilizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Update Rates Modal ──────────────────────────────────────────── */}
      {showUpdateRatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Actualizar Tasas del Día</h3>
                  <p className="text-[11px] text-gray-500">Ingresá las cotizaciones actuales (BCP / Banco)</p>
                </div>
              </div>
              <button onClick={() => setShowUpdateRatesModal(false)} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {tasas.map(t => {
                const edit = rateEdits[t.moneda] || { compra: String(t.compra), venta: String(t.venta) };
                return (
                  <div key={t.moneda} className="bg-gray-800/40 rounded-xl p-3.5 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-sm font-bold text-white">{t.simbolo} {t.moneda}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Compra (Gs.)</label>
                        <input type="number" value={edit.compra}
                          onChange={e => setRateEdits(prev => ({ ...prev, [t.moneda]: { ...edit, compra: e.target.value } }))}
                          className="w-full px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 mb-1">Venta (Gs.)</label>
                        <input type="number" value={edit.venta}
                          onChange={e => setRateEdits(prev => ({ ...prev, [t.moneda]: { ...edit, venta: e.target.value } }))}
                          className="w-full px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowUpdateRatesModal(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleUpdateRates}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
                <RefreshCw className="h-4 w-4 inline mr-1.5" /> Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FX Difference Modal ─────────────────────────────────────────── */}
      {showFxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Diferencia de Cambio</h3>
                  <p className="text-[11px] text-gray-500">Ajuste por fluctuación de tipo de cambio</p>
                </div>
              </div>
              <button onClick={() => setShowFxModal(false)} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {fxDiff.map(fx => {
                if (!fx) return null;
                const ganancia = fx.diferencia > 0;
                return (
                  <div key={fx.moneda} className={cn("rounded-xl p-3.5 border",
                    ganancia ? "bg-green-950/20 border-green-800/30" : "bg-red-950/20 border-red-800/30"
                  )}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">{fx.simbolo} {fx.moneda}</p>
                        <p className="text-[11px] text-gray-500">Posición: {fx.saldoME.toLocaleString()} {fx.moneda}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-mono font-bold", ganancia ? "text-green-400" : "text-red-400")}>
                          {ganancia ? "+" : ""}{formatGs(Math.round(fx.diferencia))}
                        </p>
                        <p className={cn("text-[10px]", ganancia ? "text-green-500" : "text-red-500")}>
                          {ganancia ? "Ganancia de cambio" : "Pérdida de cambio"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-400">
                  El ajuste de diferencia de cambio se genera como un asiento contable que afecta las cuentas de "Ganancia/Pérdida por Diferencia de Cambio" (4.x.01 / 5.x.01) al cierre del período.
                </p>
              </div>
            </div>

            {fxSuccess && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-950/20 border border-green-800/40 rounded-xl text-xs text-green-400 animate-in zoom-in duration-200">
                <CheckCircle2 className="h-4 w-4" /> Asiento de diferencia de cambio generado.
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowFxModal(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Cerrar
              </button>
              <button onClick={handleGenerateFxEntry}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Generar Asiento Automático
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Transaction Detail Modal ────────────────────────────────────── */}
      {showTxDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Detalle de Transacción ME</h3>
                <p className="text-[11px] text-gray-500 font-mono">{showTxDetail.asiento}</p>
              </div>
              <button onClick={() => setShowTxDetail(null)} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-gray-800/40 rounded-xl p-4 space-y-2.5">
              {[
                ["Fecha", showTxDetail.fecha],
                ["Tipo", showTxDetail.tipo],
                ["Descripción", showTxDetail.descripcion],
                ["Partner", showTxDetail.partner],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-200 font-medium">{v}</span>
                </div>
              ))}
            </div>

            <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Datos de Cambio</p>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Monto ME</span>
                <span className="text-white font-bold">{showTxDetail.moneda} {showTxDetail.montoME.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-gray-400">Tasa aplicada</span>
                <span className="text-gray-200">{formatGs(showTxDetail.tasa)}</span>
              </div>
              <div className="flex justify-between text-xs font-mono border-t border-blue-800/30 pt-2">
                <span className="text-white font-semibold">Equivalente PYG</span>
                <span className="text-white font-bold">{formatGs(showTxDetail.montoPYG)}</span>
              </div>
            </div>

            <button onClick={() => setShowTxDetail(null)}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Simple Converter ──────────────────────────────────────────────────────────
function SimpleConverter({ tasas }: { tasas: TasaCambio[] }) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [type, setType] = useState<"compra" | "venta">("venta");

  const tasa = tasas.find(t => t.moneda === from);
  const rate = type === "compra" ? (tasa?.compra || 0) : (tasa?.venta || 0);
  const result = parseFloat(amount || "0") * rate;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <input value={amount} onChange={e => setAmount(e.target.value)} type="number"
          className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
        <select value={from} onChange={e => setFrom(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/30">
          {tasas.map(t => <option key={t.moneda} value={t.moneda}>{t.moneda}</option>)}
        </select>
        <div className="flex gap-1">
          {(["compra", "venta"] as const).map(t => (
            <button key={t} onClick={() => setType(t)}
              className={cn("px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all capitalize",
                type === t ? "bg-blue-600 text-white border-blue-500" : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
              )}>
              {t}
            </button>
          ))}
        </div>
        <ArrowRightLeft className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-bold text-gray-300">PYG</span>
        <span className="font-mono text-lg font-black text-white">
          {result > 0 ? `Gs. ${result.toLocaleString("es-PY")}` : "—"}
        </span>
      </div>
      {tasa && (
        <p className="text-[10px] text-gray-600">
          Tasa {type}: {formatGs(rate)} / {from} · Actualizado: {tasa.fecha}
        </p>
      )}
    </div>
  );
}
