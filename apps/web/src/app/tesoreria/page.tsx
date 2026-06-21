"use client";

import { useState, useEffect, useTransition } from "react";
import {
  FileText, Plus, RefreshCw, CheckCircle2, Loader2,
  Calendar, Coins, Landmark, Printer, AlertCircle, TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { loadPaymentOrders, createPaymentOrder } from "../fiscal/actions-avanzadas";
import { loadEntidadesParaFiscal } from "../fiscal/actions";

export default function TesoreriaPage() {
  const selectedEntity = useAuthStore((state) => state.selectedEntity);
  const [orders, setOrders] = useState<any[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);
  
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<string | null>(null);

  // Forms
  const [showModal, setShowModal] = useState(false);
  const [opNumber, setOpNumber] = useState("");
  const [opDate, setOpDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "check" | "bank_transfer">("cash");
  
  // Check fields
  const [checkNumber, setCheckNumber] = useState("");
  const [checkType, setCheckType] = useState<"vista" | "diferido">("vista");
  const [checkDueDate, setCheckDueDate] = useState("");
  const [payeeName, setPayeeName] = useState("");

  const [error, setError] = useState<string | null>(null);

  const fetchOrders = () => {
    if (!selectedEntity?.id) return;
    startTransition(async () => {
      const res = await loadPaymentOrders(selectedEntity.id);
      if (res.ok) setOrders(res.data);
    });
  };

  // Fetch partners list to select who to pay
  const fetchPartners = () => {
    if (!selectedEntity?.id) return;
    // Simple mock or dynamic load of partners
    setPartnersList([
      { id: "p1", legalName: "Despachante Solución S.A." },
      { id: "p2", legalName: "Proveedora de Insumos S.R.L." },
      { id: "p3", legalName: "Copaco S.A." },
    ]);
  };

  useEffect(() => {
    fetchOrders();
    fetchPartners();
  }, [selectedEntity]);

  const handleCreate = () => {
    if (!selectedEntity?.id || !opNumber || !selectedPartnerId) return;
    startTransition(async () => {
      const res = await createPaymentOrder(
        selectedEntity.id,
        opDate,
        opNumber,
        selectedPartnerId,
        totalAmount,
        paymentMethod,
        "b1-mock-id", // mock default bank account ID
        checkNumber || undefined,
        checkType || undefined,
        checkDueDate || undefined,
        payeeName || undefined
      );
      if (res.ok) {
        setShowModal(false);
        setOpNumber("");
        setSelectedPartnerId("");
        setTotalAmount(0);
        setCheckNumber("");
        setPayeeName("");
        setLogs(`✓ Orden de Pago N° ${opNumber} emitida con éxito. Asiento contable de egreso registrado.`);
        fetchOrders();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Coins className="h-7 w-7 text-primary" /> Tesorería y Órdenes de Pago
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Emisión de Órdenes de Pago (OPs), control de egresos, transferencias y emisión de cheques.
          </p>
        </div>

        <div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Emitir Pago (OP)
          </button>
        </div>
      </div>

      {logs && (
        <div className="bg-green-950/20 border border-green-800/40 rounded-2xl p-5 space-y-2 animate-in slide-in-from-bottom-2">
          <h3 className="text-xs font-bold text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Pago Emitido con Éxito
          </h3>
          <p className="text-xs text-gray-300 font-mono">
            {logs}
          </p>
        </div>
      )}

      {/* Payment Orders Table */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/20">
          <h3 className="text-sm font-bold text-white">Historial de Órdenes de Pago (OPs)</h3>
          <span className="text-xs text-gray-500 font-medium">{orders.length} pagos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/30 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-3">Fecha</th>
                <th className="p-3">Nro OP</th>
                <th className="p-3">Beneficiario / Tercero</th>
                <th className="p-3">Medio de Pago</th>
                <th className="p-3 text-right">Monto Pagado</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300">
              {orders.map((o, idx) => (
                <tr key={idx} className="hover:bg-gray-800/10">
                  <td className="p-3 font-mono">{new Date(o.date).toLocaleDateString("es-PY")}</td>
                  <td className="p-3 font-mono">{o.number}</td>
                  <td className="p-3 font-semibold text-white">{o.partnerName || "Proveedor General"}</td>
                  <td className="p-3 uppercase">{o.paymentMethod === "bank_transfer" ? "Transferencia" : o.paymentMethod === "check" ? "Cheque" : "Efectivo"}</td>
                  <td className="p-3 text-right font-mono font-bold text-red-400">
                    Gs. {Math.round(parseFloat(o.totalAmount)).toLocaleString("es-PY")}
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] font-bold">
                      {o.status === "paid" ? "Pagado" : "Procesado"}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No hay Órdenes de Pago emitidas en el ejercicio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create OP Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-sm font-bold text-white">Emitir Orden de Pago</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Fecha de Pago</label>
                  <input
                    type="date"
                    value={opDate}
                    onChange={(e) => setOpDate(e.target.value)}
                    className="w-full input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nro OP</label>
                  <input
                    type="text"
                    value={opNumber}
                    onChange={(e) => setOpNumber(e.target.value)}
                    placeholder="OP-000123"
                    className="w-full input-field text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Tercero / Acreedor</label>
                <div className="relative">
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="w-full appearance-none input-field pr-8 cursor-pointer text-sm"
                  >
                    <option value="">Seleccionar beneficiario</option>
                    {partnersList.map((p) => (
                      <option key={p.id} value={p.id}>{p.legalName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Monto (Gs.)</label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full input-field text-xs font-mono font-bold text-red-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Medio de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full input-field text-xs"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="bank_transfer">Transferencia</option>
                    <option value="check">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Conditional Check fields */}
              {paymentMethod === "check" && (
                <div className="space-y-2 border-t border-gray-800 pt-2 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nro Cheque</label>
                      <input
                        type="text"
                        value={checkNumber}
                        onChange={(e) => setCheckNumber(e.target.value)}
                        placeholder="Ch-1234567"
                        className="w-full input-field text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Tipo Cheque</label>
                      <select
                        value={checkType}
                        onChange={(e) => setCheckType(e.target.value as any)}
                        className="w-full input-field text-xs"
                      >
                        <option value="vista">Al Día (Vista)</option>
                        <option value="diferido">Diferido</option>
                      </select>
                    </div>
                  </div>

                  {checkType === "diferido" && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Fecha de Pago/Cobro</label>
                      <input
                        type="date"
                        value={checkDueDate}
                        onChange={(e) => setCheckDueDate(e.target.value)}
                        className="w-full input-field text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Páguese a la Orden de</label>
                    <input
                      type="text"
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      placeholder="Nombre del beneficiario en el cheque"
                      className="w-full input-field text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleCreate} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">
                Emitir Pago
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
