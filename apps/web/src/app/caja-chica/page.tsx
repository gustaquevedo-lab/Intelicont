"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Wallet, Plus, RefreshCw, CheckCircle2, Loader2,
  Calendar, User, DollarSign, FileText, AlertCircle, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import {
  loadPettyCashFunds, createPettyCashFund, addPettyCashExpense,
  loadPendingPettyExpenses, reimbursePettyCashFund
} from "../fiscal/actions-avanzadas";
import { loadEntidadesParaFiscal } from "../fiscal/actions";

export default function CajaChicaPage() {
  const selectedEntity = useAuthStore((state) => state.selectedEntity);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  
  const [isPending, startTransition] = useTransition();
  const [reimburseLogs, setReimburseLogs] = useState<string | null>(null);
  
  // Modals / Forms
  const [showFundModal, setShowFundModal] = useState(false);
  const [newFundName, setNewFundName] = useState("");
  const [newCustodian, setNewCustodian] = useState("");
  const [newMaxAmount, setNewMaxAmount] = useState(1500000); // Gs. 1.500.000 default

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [ticketDate, setTicketDate] = useState(new Date().toISOString().split("T")[0]);
  const [ticketPartner, setTicketPartner] = useState("");
  const [ticketRuc, setTicketRuc] = useState("");
  const [ticketInvoice, setTicketInvoice] = useState("");
  const [ticketTotal, setTicketTotal] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const fetchFunds = () => {
    if (!selectedEntity?.id) return;
    startTransition(async () => {
      const res = await loadPettyCashFunds(selectedEntity.id);
      if (res.ok) {
        setFunds(res.data);
        if (res.data.length > 0 && !selectedFundId) {
          setSelectedFundId(res.data[0].id);
        }
      }
    });
  };

  const fetchPending = () => {
    if (!selectedFundId) return;
    startTransition(async () => {
      const res = await loadPendingPettyExpenses(selectedFundId);
      if (res.ok) setPendingExpenses(res.data);
    });
  };

  useEffect(() => {
    fetchFunds();
  }, [selectedEntity]);

  useEffect(() => {
    fetchPending();
  }, [selectedFundId]);

  const handleCreateFund = () => {
    if (!selectedEntity?.id || !newFundName || !newCustodian) return;
    startTransition(async () => {
      const res = await createPettyCashFund(
        selectedEntity.id,
        newFundName,
        newCustodian,
        newMaxAmount,
        "a9042b46-7789-4246-8890-000000000000" // mock default GL cash account
      );
      if (res.ok) {
        setShowFundModal(false);
        setNewFundName("");
        setNewCustodian("");
        fetchFunds();
      } else {
        setError(res.error);
      }
    });
  };

  const handleAddExpense = () => {
    if (!selectedFundId || !ticketPartner || !ticketRuc || !ticketInvoice) return;
    startTransition(async () => {
      // Direct 10% VAT calculation for tickets
      const gravado10 = Math.round(ticketTotal / 1.1);
      const iva10 = ticketTotal - gravado10;

      const res = await addPettyCashExpense(
        selectedFundId,
        ticketDate,
        ticketPartner,
        ticketRuc,
        ticketInvoice,
        ticketTotal,
        iva10,
        0,
        0,
        "50012345-6677-4246-8890-000000000000" // mock default GL general expense account
      );
      if (res.ok) {
        setShowExpenseModal(false);
        setTicketPartner("");
        setTicketRuc("");
        setTicketInvoice("");
        setTicketTotal(0);
        fetchPending();
      } else {
        setError(res.error);
      }
    });
  };

  const handleReimburse = () => {
    if (!selectedFundId) return;
    setReimburseLogs(null);
    startTransition(async () => {
      const res = await reimbursePettyCashFund(selectedFundId, new Date().toISOString().split("T")[0]);
      if (res.ok) {
        setReimburseLogs(res.data);
        fetchPending();
      } else {
        setError(res.error);
      }
    });
  };

  const selectedFund = funds.find((f) => f.id === selectedFundId);
  const totalPending = pendingExpenses.reduce((s, e) => s + parseFloat(e.total), 0);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" /> Fondo Fijo y Caja Chica
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Rendición de comprobantes menores, arqueos y reposición contable de fondos.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFundModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Crear Fondo
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left: Funds List */}
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Fondos Disponibles</h2>
          <div className="space-y-2">
            {funds.map((f) => {
              const active = f.id === selectedFundId;
              return (
                <button
                  key={f.id}
                  onClick={() => { setSelectedFundId(f.id); setReimburseLogs(null); }}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all text-xs flex flex-col gap-1.5",
                    active
                      ? "bg-gray-800 border-gray-700 text-white shadow-lg"
                      : "bg-gray-900/40 border-gray-800/80 text-gray-400 hover:text-white"
                  )}
                >
                  <span className="font-bold text-sm block">{f.name}</span>
                  <span>Custodio: {f.custodian}</span>
                  <span className="font-mono mt-1 text-primary">Gs. {Math.round(f.maxAmount).toLocaleString("es-PY")}</span>
                </button>
              );
            })}
            {funds.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-6">No hay fondos activos.</p>
            )}
          </div>
        </div>

        {/* Right: Selected Fund Details */}
        <div className="md:col-span-3 space-y-6">
          {selectedFund ? (
            <>
              {/* Cards Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5 space-y-1">
                  <span className="text-xs text-gray-400 font-medium">Monto Asignado</span>
                  <p className="text-2xl font-black text-white font-mono">
                    Gs. {Math.round(selectedFund.maxAmount).toLocaleString("es-PY")}
                  </p>
                </div>
                <div className="card p-5 space-y-1 border-amber-800/20 bg-amber-950/5">
                  <span className="text-xs text-amber-400 font-medium">Rendido Pendiente</span>
                  <p className="text-2xl font-black text-amber-300 font-mono">
                    Gs. {Math.round(totalPending).toLocaleString("es-PY")}
                  </p>
                </div>
                <div className="card p-5 space-y-1 border-green-800/20 bg-green-950/5">
                  <span className="text-xs text-green-400 font-medium">Efectivo Disponible</span>
                  <p className="text-2xl font-black text-green-400 font-mono">
                    Gs. {Math.round(selectedFund.maxAmount - totalPending).toLocaleString("es-PY")}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700/50 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Plus className="h-4 w-4" /> Rendir Ticket / Gasto
                </button>
                <button
                  disabled={totalPending === 0 || isPending}
                  onClick={handleReimburse}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Reponer Fondo Fijo (Reembolso)
                </button>
              </div>

              {/* Pending Expenses Table */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/20">
                  <h3 className="text-sm font-bold text-white">Comprobantes Rendidos en este Arqueo</h3>
                  <span className="text-xs text-gray-500 font-medium">{pendingExpenses.length} comprobantes</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-950/30 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Factura</th>
                        <th className="p-3">Proveedor</th>
                        <th className="p-3">RUC</th>
                        <th className="p-3 text-right">Monto Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-gray-300">
                      {pendingExpenses.map((exp, idx) => (
                        <tr key={idx} className="hover:bg-gray-800/10">
                          <td className="p-3 font-mono">{new Date(exp.date).toLocaleDateString("es-PY")}</td>
                          <td className="p-3 font-mono">{exp.invoiceNumber}</td>
                          <td className="p-3">{exp.partnerName}</td>
                          <td className="p-3 font-mono">{exp.partnerRuc}</td>
                          <td className="p-3 text-right font-mono font-bold text-white">
                            Gs. {Math.round(exp.total).toLocaleString("es-PY")}
                          </td>
                        </tr>
                      ))}
                      {pendingExpenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500">
                            No hay gastos pendientes en este fondo fijo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center py-20">
              <AlertCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-semibold text-sm">Seleccioná o creá un fondo fijo para ver su estado contable.</p>
            </div>
          )}

          {reimburseLogs && (
            <div className="bg-green-950/20 border border-green-800/40 rounded-2xl p-5 space-y-2 animate-in slide-in-from-bottom-2">
              <h3 className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Reposición Procesada
              </h3>
              <p className="text-xs text-gray-300 font-mono leading-relaxed bg-gray-950/60 p-3 rounded-xl">
                {reimburseLogs}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Fund Modal */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Crear Nuevo Fondo Fijo</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nombre del Fondo</label>
                <input
                  type="text"
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  placeholder="Ej: Caja Chica Administración"
                  className="w-full input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Custodio Responsable</label>
                <input
                  type="text"
                  value={newCustodian}
                  onChange={(e) => setNewCustodian(e.target.value)}
                  placeholder="Ej: Ana Gómez"
                  className="w-full input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Monto Asignado (Gs.)</label>
                <input
                  type="number"
                  value={newMaxAmount}
                  onChange={(e) => setNewMaxAmount(Number(e.target.value))}
                  className="w-full input-field text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowFundModal(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleCreateFund} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">
                Crear Fondo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rendir Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Rendir Ticket / Gasto</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Fecha</label>
                  <input
                    type="date"
                    value={ticketDate}
                    onChange={(e) => setTicketDate(e.target.value)}
                    className="w-full input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nro Factura</label>
                  <input
                    type="text"
                    value={ticketInvoice}
                    onChange={(e) => setTicketInvoice(e.target.value)}
                    placeholder="001-001-0001234"
                    className="w-full input-field text-xs font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Proveedor</label>
                <input
                  type="text"
                  value={ticketPartner}
                  onChange={(e) => setTicketPartner(e.target.value)}
                  placeholder="Razón Social"
                  className="w-full input-field text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">RUC Proveedor</label>
                  <input
                    type="text"
                    value={ticketRuc}
                    onChange={(e) => setTicketRuc(e.target.value)}
                    placeholder="1234567-8"
                    className="w-full input-field text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Monto Total (Gs.)</label>
                  <input
                    type="number"
                    value={ticketTotal}
                    onChange={(e) => setTicketTotal(Number(e.target.value))}
                    className="w-full input-field text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowExpenseModal(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleAddExpense} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">
                Registrar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
