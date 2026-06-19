"use client";

import { useState, useMemo } from "react";
import {
  CreditCard, ArrowDown, ArrowUp, CheckCircle2, DollarSign,
  Search, Calendar, Building2, FileText, TrendingUp, TrendingDown,
  Banknote, Receipt, ChevronDown, Plus, Eye, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "cobros" | "pagos";

interface FacturaPendiente {
  id: string;
  numero: string;
  partner: string;
  ruc: string;
  fecha: string;
  vencimiento: string;
  total: number;
  saldoPendiente: number;
  seleccionado: boolean;
  diasVencido: number;
}

const FACTURAS_CLIENTES: FacturaPendiente[] = [
  { id: "fc1", numero: "001-001-00001", partner: "Comercial Paraguaya S.A.", ruc: "3456789-0", fecha: "2026-05-10", vencimiento: "2026-06-09", total: 6050000, saldoPendiente: 6050000, seleccionado: false, diasVencido: 0 },
  { id: "fc2", numero: "001-001-00002", partner: "Servicios Contables Del Paraguay", ruc: "4567890-1", fecha: "2026-05-12", vencimiento: "2026-06-11", total: 1320000, saldoPendiente: 1320000, seleccionado: false, diasVencido: 0 },
  { id: "fc3", numero: "001-001-00099", partner: "Tecnología Asunción SRL", ruc: "80023456-2", fecha: "2026-04-15", vencimiento: "2026-05-15", total: 525000, saldoPendiente: 525000, seleccionado: false, diasVencido: -10 },
];

const FACTURAS_PROVEEDORES: FacturaPendiente[] = [
  { id: "fp1", numero: "001-001-00234", partner: "Importadora del Este S.A.", ruc: "80012345-1", fecha: "2026-05-01", vencimiento: "2026-05-31", total: 11000000, saldoPendiente: 11000000, seleccionado: false, diasVencido: 0 },
  { id: "fp2", numero: "002-001-00089", partner: "Servicios Contables Del Paraguay", ruc: "4567890-1", fecha: "2026-05-03", vencimiento: "2026-06-02", total: 2750000, saldoPendiente: 2750000, seleccionado: false, diasVencido: 0 },
  { id: "fp3", numero: "001-001-00345", partner: "Tecnología Asunción SRL", ruc: "80023456-2", fecha: "2026-05-02", vencimiento: "2026-06-01", total: 16500000, saldoPendiente: 16500000, seleccionado: false, diasVencido: 0 },
  { id: "fp4", numero: "001-001-01145", partner: "Importadora del Este S.A.", ruc: "80012345-1", fecha: "2026-05-10", vencimiento: "2026-06-09", total: 9350000, saldoPendiente: 9350000, seleccionado: false, diasVencido: 0 },
];

const BANCOS = [
  { id: "b1", name: "Banco GNB — Cta. Cte. 001-0123456-78", saldo: 56050000 },
  { id: "b2", name: "Banco Continental — Cta. Cte. 002-0234567-89", saldo: 18500000 },
  { id: "b3", name: "Banco Itaú — Cta. Cte. 003-0345678-90", saldo: 45000000 },
];

const CAJA = { id: "c1", name: "Caja Chica", saldo: 2500000 };

export default function CobrosPagosPage() {
  const [tab, setTab] = useState<Tab>("cobros");
  const [facturas, setFacturas] = useState<FacturaPendiente[]>(FACTURAS_CLIENTES);
  const [bancoId, setBancoId] = useState(BANCOS[0].id);
  const [usarCaja, setUsarCaja] = useState(false);
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split("T")[0]);
  const [referencia, setReferencia] = useState("");
  const [montoParcial, setMontoParcial] = useState("");
  const [completado, setCompletado] = useState(false);
  const [asientoGenerado, setAsientoGenerado] = useState<string | null>(null);

  const facturasData = tab === "cobros" ? FACTURAS_CLIENTES : FACTURAS_PROVEEDORES;
  const esCobro = tab === "cobros";

  const toggleFactura = (id: string) => {
    setFacturas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, seleccionado: !f.seleccionado } : f))
    );
  };

  const seleccionadas = facturas.filter((f) => f.seleccionado);
  const totalSeleccionado = seleccionadas.reduce((s, f) => s + f.saldoPendiente, 0);
  const totalAPagar = facturas.reduce((s, f) => s + f.saldoPendiente, 0);

  const cuentaSeleccionada = usarCaja ? CAJA : BANCOS.find((b) => b.id === bancoId);

  const handleRegistrar = () => {
    if (!referencia.trim()) return;
    if (seleccionadas.length === 0) return;

    const jeNum = `JE-COBRO-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    setAsientoGenerado(jeNum);
    setCompletado(true);
  };

  const reset = () => {
    setTab("cobros");
    setFacturas(FACTURAS_CLIENTES);
    setBancoId(BANCOS[0].id);
    setUsarCaja(false);
    setFechaPago(new Date().toISOString().split("T")[0]);
    setReferencia("");
    setMontoParcial("");
    setCompletado(false);
    setAsientoGenerado(null);
  };

  if (completado) {
    return (
      <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        <div className="text-center py-8">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {esCobro ? "Cobro Registrado" : "Pago Registrado"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Asiento contable generado automáticamente</p>
        </div>

        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Asiento" value={asientoGenerado || ""} />
            <Meta label="Fecha" value={fechaPago} />
            <Meta label="Cuenta" value={cuentaSeleccionada?.name || ""} />
            <Meta label="Referencia" value={referencia} />
          </div>

          <div className="rounded-lg bg-green-50 dark:bg-green-500/5 border border-green-200 p-3 space-y-1 text-xs font-mono">
            <p className="text-green-700 dark:text-green-400 font-medium mb-1">Asiento Generado:</p>
            {seleccionadas.map((f, i) => (
              <div key={f.id} className="flex justify-between text-green-600 dark:text-green-500">
                <span>{esCobro ? f.partner : "Proveedores"}</span>
                <span>{esCobro ? `C: Gs. ${f.saldoPendiente.toLocaleString("es-PY")}` : `D: Gs. ${Math.abs(f.saldoPendiente).toLocaleString("es-PY")}`}</span>
              </div>
            ))}
            <div className="flex justify-between text-green-600 dark:text-green-500 pt-1 border-t border-green-200">
              <span>{cuentaSeleccionada?.name}</span>
              <span>{esCobro ? `D: Gs. ${totalSeleccionado.toLocaleString("es-PY")}` : `C: Gs. ${Math.abs(totalSeleccionado).toLocaleString("es-PY")}`}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={reset} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium no-tap-highlight">
              {esCobro ? "Nuevo Cobro" : "Nuevo Pago"}
            </button>
            <a href="/asientos" className="flex items-center justify-center px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium no-tap-highlight">
              <FileText className="h-4 w-4 mr-1.5" /> Ver Asientos
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
            Cobros y Pagos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Registrar cobros de clientes y pagos a proveedores con asiento automático
          </p>
        </div>
      </div>

      {/* Tab + Totals */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
          <button onClick={() => { setTab("cobros"); setFacturas(FACTURAS_CLIENTES); }}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight",
              tab === "cobros" ? "bg-white dark:bg-gray-700 shadow-sm text-green-600" : "text-gray-500")}>
            <ArrowDown className="h-3.5 w-3.5" /> Cobros
          </button>
          <button onClick={() => { setTab("pagos"); setFacturas(FACTURAS_PROVEEDORES); }}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight",
              tab === "pagos" ? "bg-white dark:bg-gray-700 shadow-sm text-red-600" : "text-gray-500")}>
            <ArrowUp className="h-3.5 w-3.5" /> Pagos
          </button>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="text-right">
            <span className="text-[10px] text-gray-400">Total pendiente</span>
            <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
              Gs. {totalAPagar.toLocaleString("es-PY")}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-gray-400">Seleccionado</span>
            <p className={cn("text-sm font-bold font-mono", esCobro ? "text-green-600" : "text-red-600")}>
              Gs. {totalSeleccionado.toLocaleString("es-PY")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Facturas pendientes */}
        <div className="lg:col-span-2 space-y-2">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {esCobro ? "Facturas por Cobrar" : "Facturas por Pagar"}
          </h3>
          {facturasData.map((f) => {
            const factura = facturas.find((sf) => sf.id === f.id) || f;
            return (
              <div
                key={f.id}
                onClick={() => toggleFactura(f.id)}
                className={cn(
                  "bg-white dark:bg-gray-900/50 border rounded-xl p-3 sm:p-4 cursor-pointer transition-all hover:border-gray-300 dark:hover:border-gray-700 no-tap-highlight",
                  factura.seleccionado
                    ? "border-blue-500 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-500/5"
                    : "border-gray-200 dark:border-gray-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
                      factura.seleccionado ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"
                    )}>
                      {factura.seleccionado && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-900 dark:text-white">{f.numero}</span>
                        <span className={cn("text-[10px] px-1 py-0.5 rounded", f.diasVencido < 0 ? "bg-red-50 dark:bg-red-500/10 text-red-600" : "bg-green-50 dark:bg-green-500/10 text-green-600")}>
                          {f.diasVencido < 0 ? `Vencido (${Math.abs(f.diasVencido)}d)` : "Vigente"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{f.partner}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">Gs. {f.saldoPendiente.toLocaleString("es-PY")}</p>
                    <p className="text-[10px] text-gray-400">Vence: {f.vencimiento}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel de pago */}
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Detalle del {esCobro ? "Cobro" : "Pago"}</h3>

          {/* Cuenta */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Cuenta bancaria</label>
            <div className="space-y-1">
              {BANCOS.map((b) => (
                <button key={b.id} onClick={() => { setBancoId(b.id); setUsarCaja(false); }}
                  className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs no-tap-highlight",
                    bancoId === b.id && !usarCaja ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700")}>
                  <span className="truncate">{b.name}</span>
                  <span className="font-mono shrink-0 ml-2">Gs. {(b.saldo / 1000000).toFixed(1)}M</span>
                </button>
              ))}
              <button onClick={() => setUsarCaja(true)}
                className={cn("w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs no-tap-highlight",
                  usarCaja ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400")}>
                <span>Caja Chica</span>
                <span className="font-mono">Gs. {(CAJA.saldo / 1000000).toFixed(1)}M</span>
              </button>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
            <input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white no-tap-highlight" />
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nro. Referencia</label>
            <input value={referencia} onChange={(e) => setReferencia(e.target.value)}
              placeholder="CHQ-001, TRF-002..."
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 no-tap-highlight" />
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Facturas seleccionadas</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{seleccionadas.length}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total a {esCobro ? "cobrar" : "pagar"}</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">Gs. {totalSeleccionado.toLocaleString("es-PY")}</span>
            </div>
          </div>

          {/* Preview asiento */}
          {seleccionadas.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-800/30 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-[10px] text-purple-600 font-medium">Asiento sugerido</span>
              </div>
              <div className="space-y-1 text-[10px] font-mono text-purple-700 dark:text-purple-300">
                {esCobro ? (
                  <>
                    <div className="flex justify-between"><span>{cuentaSeleccionada?.name.split("—")[0].trim()}</span><span>D: Gs. {totalSeleccionado.toLocaleString("es-PY")}</span></div>
                    {seleccionadas.map((f) => (
                      <div key={f.id} className="flex justify-between pl-2"><span>{f.partner}</span><span>C: Gs. {f.saldoPendiente.toLocaleString("es-PY")}</span></div>
                    ))}
                  </>
                ) : (
                  <>
                    {seleccionadas.map((f) => (
                      <div key={f.id} className="flex justify-between"><span>{f.partner}</span><span>D: Gs. {Math.abs(f.saldoPendiente).toLocaleString("es-PY")}</span></div>
                    ))}
                    <div className="flex justify-between"><span>{cuentaSeleccionada?.name.split("—")[0].trim()}</span><span>C: Gs. {Math.abs(totalSeleccionado).toLocaleString("es-PY")}</span></div>
                  </>
                )}
              </div>
            </div>
          )}

          <button
            onClick={handleRegistrar}
            disabled={seleccionadas.length === 0 || !referencia.trim()}
            className={cn("w-full py-2.5 rounded-lg text-sm font-medium transition-colors no-tap-highlight",
              esCobro ? "bg-green-600 hover:bg-green-500 text-white" : "bg-red-600 hover:bg-red-500 text-white",
              "disabled:opacity-40"
            )}>
            <CheckCircle2 className="h-4 w-4 inline mr-1.5" />
            Registrar {esCobro ? "Cobro" : "Pago"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 text-[10px]">{label}</span>
      <p className="text-gray-700 dark:text-gray-300 truncate font-mono text-sm">{value}</p>
    </div>
  );
}
