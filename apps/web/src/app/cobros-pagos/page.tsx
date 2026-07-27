"use client";

import { useState, useMemo } from "react";
import {
  CreditCard, ArrowDown, ArrowUp, CheckCircle2, DollarSign,
  Search, Calendar, Building2, FileText, TrendingUp, TrendingDown,
  Banknote, Receipt, ChevronDown, Plus, Eye, Sparkles, X,
  Clock, AlertCircle, Info, Loader2, Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "cobros" | "pagos";

interface FacturaPendiente {
  id: string;
  numero: string;
  partner: string;
  ruc: string;
  timbrado: string;
  fecha: string;
  vencimiento: string;
  total: number;
  iva: number;
  base: number;
  saldoPendiente: number;
  seleccionado: boolean;
  diasVencido: number;
  direccion: string;
}

const FACTURAS_CLIENTES: FacturaPendiente[] = [
  { id: "fc1", numero: "001-001-00001", partner: "Comercial Paraguaya S.A.", ruc: "3456789-0", timbrado: "12345678", fecha: "2026-05-10", vencimiento: "2026-06-09", total: 6050000, iva: 550000, base: 5500000, saldoPendiente: 6050000, seleccionado: false, diasVencido: 0, direccion: "Av. Mcal. López 1234, Asunción" },
  { id: "fc2", numero: "001-001-00002", partner: "Servicios Contables Del Paraguay", ruc: "4567890-1", timbrado: "87654321", fecha: "2026-05-12", vencimiento: "2026-06-11", total: 1320000, iva: 120000, base: 1200000, saldoPendiente: 1320000, seleccionado: false, diasVencido: 0, direccion: "Eligio Ayala 456, Asunción" },
  { id: "fc3", numero: "001-001-00099", partner: "Tecnología Asunción SRL", ruc: "80023456-2", timbrado: "11223344", fecha: "2026-04-15", vencimiento: "2026-05-15", total: 525000, iva: 47727, base: 477273, saldoPendiente: 525000, seleccionado: false, diasVencido: -10, direccion: "San Martín 789, Asunción" },
];

const FACTURAS_PROVEEDORES: FacturaPendiente[] = [
  { id: "fp1", numero: "001-001-00234", partner: "Importadora del Este S.A.", ruc: "80012345-1", timbrado: "99887766", fecha: "2026-05-01", vencimiento: "2026-05-31", total: 11000000, iva: 1000000, base: 10000000, saldoPendiente: 11000000, seleccionado: false, diasVencido: 0, direccion: "Ruta 7 km 12, Ciudad del Este" },
  { id: "fp2", numero: "002-001-00089", partner: "Servicios Contables Del Paraguay", ruc: "4567890-1", timbrado: "44556677", fecha: "2026-05-03", vencimiento: "2026-06-02", total: 2750000, iva: 250000, base: 2500000, saldoPendiente: 2750000, seleccionado: false, diasVencido: 0, direccion: "Eligio Ayala 456, Asunción" },
  { id: "fp3", numero: "001-001-00345", partner: "Tecnología Asunción SRL", ruc: "80023456-2", timbrado: "55443322", fecha: "2026-05-02", vencimiento: "2026-06-01", total: 16500000, iva: 1500000, base: 15000000, saldoPendiente: 16500000, seleccionado: false, diasVencido: 0, direccion: "San Martín 789, Asunción" },
  { id: "fp4", numero: "001-001-01145", partner: "Importadora del Este S.A.", ruc: "80012345-1", timbrado: "11998877", fecha: "2026-05-10", vencimiento: "2026-06-09", total: 9350000, iva: 850000, base: 8500000, saldoPendiente: 9350000, seleccionado: false, diasVencido: 0, direccion: "Ruta 7 km 12, Ciudad del Este" },
];

const BANCOS = [
  { id: "b1", name: "Banco GNB", cuenta: "001-0123456-78", saldo: 56050000 },
  { id: "b2", name: "Banco Continental", cuenta: "002-0234567-89", saldo: 18500000 },
  { id: "b3", name: "Banco Itaú", cuenta: "003-0345678-90", saldo: 45000000 },
];

const CAJA = { id: "c1", name: "Caja Chica", saldo: 2500000 };

const OPERACIONES_RECIENTES = [
  { id: "op1", tipo: "cobro", partner: "Comercial Paraguaya S.A.", monto: 4500000, fecha: "2026-05-10", asiento: "JE-COBRO-AB1234" },
  { id: "op2", tipo: "pago",  partner: "Importadora del Este S.A.", monto: 11000000, fecha: "2026-05-08", asiento: "JE-PAGO-CD5678" },
  { id: "op3", tipo: "cobro", partner: "Tecnología Asunción SRL", monto: 1800000, fecha: "2026-05-05", asiento: "JE-COBRO-EF9012" },
];

function formatGs(n: number) { return `Gs. ${n.toLocaleString("es-PY")}`; }

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 text-[10px] uppercase tracking-wider">{label}</span>
      <p className="text-gray-200 truncate font-mono text-xs mt-0.5">{value}</p>
    </div>
  );
}

export default function CobrosPagosPage() {
  const [tab, setTab] = useState<Tab>("cobros");
  const [facturas, setFacturas] = useState<FacturaPendiente[]>(FACTURAS_CLIENTES);
  const [bancoId, setBancoId] = useState(BANCOS[0].id);
  const [usarCaja, setUsarCaja] = useState(false);
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0]);
  const [referencia, setReferencia] = useState("");

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<FacturaPendiente | null>(null);
  const [showPartialModal, setShowPartialModal] = useState<FacturaPendiente | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [asientoGenerado, setAsientoGenerado] = useState<string | null>(null);

  // Partial payment
  const [montoParcial, setMontoParcial] = useState("");

  const facturasData = tab === "cobros" ? FACTURAS_CLIENTES : FACTURAS_PROVEEDORES;
  const esCobro = tab === "cobros";

  const toggleFactura = (id: string) => {
    setFacturas(prev => prev.map(f => f.id === id ? { ...f, seleccionado: !f.seleccionado } : f));
  };

  const seleccionadas = facturas.filter(f => f.seleccionado);
  const totalSeleccionado = seleccionadas.reduce((s, f) => s + f.saldoPendiente, 0);
  const totalAPagar = facturasData.reduce((s, f) => s + f.saldoPendiente, 0);
  const cuentaSeleccionada = usarCaja ? CAJA : BANCOS.find(b => b.id === bancoId);

  const handleConfirmar = () => {
    if (!referencia.trim() || seleccionadas.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleRegistrar = () => {
    const jeNum = `JE-${esCobro ? "COBRO" : "PAGO"}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    setAsientoGenerado(jeNum);
    setShowConfirmModal(false);
    setShowSuccessModal(true);
  };

  const reset = () => {
    setTab("cobros");
    setFacturas(FACTURAS_CLIENTES);
    setBancoId(BANCOS[0].id);
    setUsarCaja(false);
    setFechaPago(new Date().toISOString().split("T")[0]);
    setReferencia("");
    setAsientoGenerado(null);
    setShowSuccessModal(false);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Cobros y Pagos</h1>
          <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
            Registrar cobros de clientes y pagos a proveedores con asiento automático
          </p>
        </div>
        <button
          onClick={() => setShowHistoryPanel(!showHistoryPanel)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700/50 text-gray-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Clock className="h-4 w-4" /> Operaciones Recientes
        </button>
      </div>

      {/* Recent operations panel */}
      {showHistoryPanel && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" /> Operaciones Recientes
            </h3>
            <button onClick={() => setShowHistoryPanel(false)} className="text-gray-500 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2">
            {OPERACIONES_RECIENTES.map(op => (
              <div key={op.id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center",
                    op.tipo === "cobro" ? "bg-green-500/10" : "bg-red-500/10"
                  )}>
                    {op.tipo === "cobro"
                      ? <ArrowDown className="h-3.5 w-3.5 text-green-400" />
                      : <ArrowUp className="h-3.5 w-3.5 text-red-400" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{op.partner}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{op.asiento} · {op.fecha}</p>
                  </div>
                </div>
                <span className={cn("text-xs font-mono font-bold", op.tipo === "cobro" ? "text-green-400" : "text-red-400")}>
                  {op.tipo === "cobro" ? "+" : "-"}{formatGs(op.monto)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab + Totals */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-gray-800/80 rounded-xl p-1 w-fit border border-gray-700/50">
          <button onClick={() => { setTab("cobros"); setFacturas(FACTURAS_CLIENTES); }}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === "cobros" ? "bg-green-600 text-white shadow-sm" : "text-gray-400 hover:text-white")}>
            <ArrowDown className="h-3.5 w-3.5" /> Cobros
          </button>
          <button onClick={() => { setTab("pagos"); setFacturas(FACTURAS_PROVEEDORES); }}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === "pagos" ? "bg-red-600 text-white shadow-sm" : "text-gray-400 hover:text-white")}>
            <ArrowUp className="h-3.5 w-3.5" /> Pagos
          </button>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total pendiente</span>
            <p className="text-sm font-bold text-white font-mono">{formatGs(totalAPagar)}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Seleccionado</span>
            <p className={cn("text-sm font-bold font-mono", esCobro ? "text-green-400" : "text-red-400")}>
              {formatGs(totalSeleccionado)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Facturas pendientes */}
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {esCobro ? "Facturas por Cobrar" : "Facturas por Pagar"}
          </h3>
          {facturasData.map(f => {
            const factura = facturas.find(sf => sf.id === f.id) || f;
            return (
              <div key={f.id} className={cn(
                "border rounded-xl p-3 sm:p-4 transition-all hover:border-gray-600 bg-gray-900/50",
                factura.seleccionado
                  ? "border-blue-500/70 bg-blue-500/5"
                  : f.diasVencido < 0
                  ? "border-red-800/50 bg-red-950/5"
                  : "border-gray-800"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1" onClick={() => toggleFactura(f.id)} style={{cursor:'pointer'}}>
                    <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
                      factura.seleccionado ? "border-blue-500 bg-blue-500" : "border-gray-600"
                    )}>
                      {factura.seleccionado && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-white">{f.numero}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                          f.diasVencido < 0
                            ? "bg-red-500/10 text-red-400 border border-red-800/30"
                            : "bg-green-500/10 text-green-400 border border-green-800/30"
                        )}>
                          {f.diasVencido < 0 ? `Vencida (${Math.abs(f.diasVencido)}d)` : "Vigente"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{f.partner} · RUC {f.ruc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="font-mono text-sm font-bold text-white">{formatGs(f.saldoPendiente)}</p>
                      <p className="text-[10px] text-gray-500">Vence: {f.vencimiento}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setShowDetailModal(f)}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setShowPartialModal(f); setMontoParcial(String(f.saldoPendiente)); }}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        title="Pago parcial"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel de pago */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-white">Detalle del {esCobro ? "Cobro" : "Pago"}</h3>

          {/* Cuenta */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Cuenta de {esCobro ? "destino" : "origen"}</label>
            <div className="space-y-1">
              {BANCOS.map(b => (
                <button key={b.id} onClick={() => { setBancoId(b.id); setUsarCaja(false); }}
                  className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs border transition-all",
                    bancoId === b.id && !usarCaja
                      ? "bg-blue-500/10 text-blue-400 border-blue-800/40"
                      : "bg-gray-800/50 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white"
                  )}>
                  <div className="text-left">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-[10px] font-mono opacity-60">{b.cuenta}</p>
                  </div>
                  <span className="font-mono">{formatGs(b.saldo)}</span>
                </button>
              ))}
              <button onClick={() => setUsarCaja(true)}
                className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs border transition-all",
                  usarCaja
                    ? "bg-blue-500/10 text-blue-400 border-blue-800/40"
                    : "bg-gray-800/50 text-gray-400 border-gray-800 hover:border-gray-700"
                )}>
                <span>Caja Chica</span>
                <span className="font-mono">{formatGs(CAJA.saldo)}</span>
              </button>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Fecha</label>
            <input type="date" value={fechaPago} onChange={e => setFechaPago(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Nro. Referencia / Cheque</label>
            <input value={referencia} onChange={e => setReferencia(e.target.value)}
              placeholder="CHQ-001, TRF-002..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30" />
          </div>

          {/* Resumen */}
          <div className="bg-gray-800/30 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Facturas seleccionadas</span>
              <span className="font-mono text-gray-200">{seleccionadas.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total a {esCobro ? "cobrar" : "pagar"}</span>
              <span className="font-mono font-bold text-white">{formatGs(totalSeleccionado)}</span>
            </div>
          </div>

          {/* Preview asiento */}
          {seleccionadas.length > 0 && (
            <div className="bg-purple-950/20 border border-purple-800/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Asiento IA sugerido</span>
              </div>
              <div className="space-y-1 text-[10px] font-mono">
                {esCobro ? (
                  <>
                    <div className="flex justify-between text-purple-300">
                      <span>{cuentaSeleccionada?.name}</span>
                      <span className="text-green-400">D: {formatGs(totalSeleccionado)}</span>
                    </div>
                    {seleccionadas.map(f => (
                      <div key={f.id} className="flex justify-between text-purple-400/70 pl-2">
                        <span className="truncate mr-2">{f.partner.split(" ")[0]}</span>
                        <span>H: {formatGs(f.saldoPendiente)}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {seleccionadas.map(f => (
                      <div key={f.id} className="flex justify-between text-purple-300">
                        <span className="truncate mr-2">{f.partner.split(" ")[0]}</span>
                        <span className="text-red-400">D: {formatGs(f.saldoPendiente)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-purple-400/70 pl-2">
                      <span>{cuentaSeleccionada?.name}</span>
                      <span>H: {formatGs(totalSeleccionado)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleConfirmar}
            disabled={seleccionadas.length === 0 || !referencia.trim()}
            className={cn("w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-lg",
              esCobro ? "bg-green-600 hover:bg-green-500 shadow-green-600/10" : "bg-red-600 hover:bg-red-500 shadow-red-600/10",
              "text-white disabled:opacity-40 disabled:cursor-not-allowed"
            )}>
            <CheckCircle2 className="h-4 w-4 inline mr-1.5" />
            Registrar {esCobro ? "Cobro" : "Pago"}
          </button>
        </div>
      </div>

      {/* ─── Confirmation Modal ────────────────────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center",
                esCobro ? "bg-green-500/10" : "bg-red-500/10"
              )}>
                {esCobro ? <ArrowDown className="h-5 w-5 text-green-400" /> : <ArrowUp className="h-5 w-5 text-red-400" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Confirmar {esCobro ? "Cobro" : "Pago"}</h3>
                <p className="text-[11px] text-gray-500">Revisá los datos antes de contabilizar</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Meta label="Cuenta" value={cuentaSeleccionada?.name || ""} />
              <Meta label="Fecha" value={fechaPago} />
              <Meta label="Referencia" value={referencia} />
              <Meta label="Facturas" value={`${seleccionadas.length} seleccionadas`} />
            </div>

            {/* Asiento preview completo */}
            <div className="bg-gray-800/50 rounded-xl p-3.5 border border-gray-700/50 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Asiento Contable a Generar</p>
              {esCobro ? (
                <>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-300">1.1.02 {cuentaSeleccionada?.name}</span>
                    <span className="text-green-400 font-bold">D: {formatGs(totalSeleccionado)}</span>
                  </div>
                  {seleccionadas.map(f => (
                    <div key={f.id} className="flex justify-between text-xs font-mono pl-4 border-l border-gray-700">
                      <span className="text-gray-400 truncate">{f.partner}</span>
                      <span className="text-gray-300">H: {formatGs(f.saldoPendiente)}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {seleccionadas.map(f => (
                    <div key={f.id} className="flex justify-between text-xs font-mono">
                      <span className="text-gray-300 truncate">{f.partner}</span>
                      <span className="text-red-400 font-bold">D: {formatGs(f.saldoPendiente)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-mono pl-4 border-l border-gray-700">
                    <span className="text-gray-400">1.1.02 {cuentaSeleccionada?.name}</span>
                    <span className="text-gray-300">H: {formatGs(totalSeleccionado)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-xs font-mono border-t border-gray-700 pt-2 mt-1">
                <span className="text-gray-400 font-semibold">TOTAL</span>
                <span className="text-white font-bold">{formatGs(totalSeleccionado)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Revisar
              </button>
              <button onClick={handleRegistrar}
                className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors shadow-lg",
                  esCobro ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
                )}>
                ✓ Confirmar y Contabilizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Invoice Detail Modal ──────────────────────────────────────────── */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Detalle de Factura</h3>
                <p className="text-[11px] text-gray-500 font-mono">{showDetailModal.numero}</p>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-800/40 rounded-xl p-4 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <Meta label="Empresa" value={showDetailModal.partner} />
                  <Meta label="RUC" value={showDetailModal.ruc} />
                  <Meta label="Timbrado" value={showDetailModal.timbrado} />
                  <Meta label="Fecha Emisión" value={showDetailModal.fecha} />
                  <Meta label="Vencimiento" value={showDetailModal.vencimiento} />
                  <Meta label="Estado" value={showDetailModal.diasVencido < 0 ? `Vencida ${Math.abs(showDetailModal.diasVencido)}d` : "Vigente"} />
                </div>
                <div className="border-t border-gray-700 pt-2.5 mt-1">
                  <Meta label="Dirección" value={showDetailModal.direccion} />
                </div>
              </div>

              <div className="bg-gray-800/40 rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Desglose Fiscal</p>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-400">Base Imponible (Neto)</span>
                  <span className="text-gray-200">{formatGs(showDetailModal.base)}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-blue-400">IVA 10%</span>
                  <span className="text-blue-300">{formatGs(showDetailModal.iva)}</span>
                </div>
                <div className="flex justify-between text-xs font-mono border-t border-gray-700 pt-2">
                  <span className="text-white font-bold">Total Factura</span>
                  <span className="text-white font-bold">{formatGs(showDetailModal.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowDetailModal(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Cerrar
              </button>
              <button
                onClick={() => { toggleFactura(showDetailModal.id); setShowDetailModal(null); }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Seleccionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Partial Payment Modal ─────────────────────────────────────────── */}
      {showPartialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Pago Parcial</h3>
                <p className="text-[11px] text-gray-500 truncate">{showPartialModal.partner}</p>
              </div>
              <button onClick={() => setShowPartialModal(null)} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-gray-800/40 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Saldo total pendiente</span>
                <span className="font-mono text-white font-bold">{formatGs(showPartialModal.saldoPendiente)}</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">
                  Monto a {esCobro ? "Cobrar" : "Pagar"} Ahora (Gs.)
                </label>
                <input
                  type="number"
                  value={montoParcial}
                  onChange={e => setMontoParcial(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              {montoParcial && parseFloat(montoParcial) > 0 && parseFloat(montoParcial) < showPartialModal.saldoPendiente && (
                <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-300">
                    Quedará un saldo pendiente de {formatGs(showPartialModal.saldoPendiente - parseFloat(montoParcial))}.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowPartialModal(null)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => setShowPartialModal(null)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
                Aplicar Parcial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Success Modal ─────────────────────────────────────────────────── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl animate-in zoom-in-90 duration-300">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <div className="absolute -top-1 -right-1 left-0 right-0 flex justify-center">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-1.5 w-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">{esCobro ? "Cobro Registrado" : "Pago Registrado"}</h2>
              <p className="text-gray-400 text-sm mt-1">Asiento contable generado automáticamente</p>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 text-left space-y-2 border border-gray-700/50">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Asiento generado</span>
                <span className="font-mono text-blue-400 font-bold">{asientoGenerado}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Fecha</span>
                <span className="font-mono text-gray-200">{fechaPago}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Cuenta</span>
                <span className="font-mono text-gray-200">{cuentaSeleccionada?.name}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-gray-700 pt-2">
                <span className="text-gray-400 font-semibold">Monto total</span>
                <span className="font-mono text-white font-bold">{formatGs(totalSeleccionado)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={reset}
                className={cn("flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors",
                  esCobro ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500"
                )}>
                {esCobro ? "Nuevo Cobro" : "Nuevo Pago"}
              </button>
              <a href="/asientos"
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
                <FileText className="h-4 w-4" /> Ver Asientos
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
