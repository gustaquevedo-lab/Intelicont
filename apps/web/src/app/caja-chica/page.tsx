"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Wallet, Plus, RefreshCw, CheckCircle2, Loader2,
  Calendar, User, DollarSign, FileText, AlertCircle, Trash2,
  ChevronDown, ChevronUp, History, Tag, MessageSquare,
  Receipt, Sparkles, X, TrendingDown, Archive, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import {
  loadPettyCashFunds, createPettyCashFund, addPettyCashExpense,
  loadPendingPettyExpenses, reimbursePettyCashFund
} from "../fiscal/actions-avanzadas";

// ─── Constants ─────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  { id: "alimentacion",   label: "Alimentación / Viáticos",    color: "text-orange-400",  bg: "bg-orange-500/10" },
  { id: "transporte",     label: "Transporte / Combustible",   color: "text-blue-400",    bg: "bg-blue-500/10" },
  { id: "papeleria",      label: "Papelería / Útiles",         color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  { id: "comunicacion",   label: "Telefonía / Internet",       color: "text-cyan-400",    bg: "bg-cyan-500/10" },
  { id: "servicios",      label: "Servicios Públicos",         color: "text-purple-400",  bg: "bg-purple-500/10" },
  { id: "reparacion",     label: "Reparación / Mantenimiento", color: "text-red-400",     bg: "bg-red-500/10" },
  { id: "limpieza",       label: "Artículos de Limpieza",      color: "text-green-400",   bg: "bg-green-500/10" },
  { id: "otros",          label: "Otros Gastos Menores",       color: "text-gray-400",    bg: "bg-gray-700/50" },
];

const IVA_RATES = [
  { value: "10", label: "10% (General)", compute: (total: number) => Math.round(total / 1.1) },
  { value: "5",  label: "5% (Especial)",  compute: (total: number) => Math.round(total / 1.05) },
  { value: "0",  label: "Exento (0%)",    compute: (total: number) => total },
];

function formatGs(n: number) {
  return `Gs. ${Math.round(n).toLocaleString("es-PY")}`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function IvaSummary({ total, rate }: { total: number; rate: string }) {
  if (!total || rate === "0") {
    return (
      <div className="bg-gray-800/50 rounded-lg p-2.5 text-[10px] text-gray-500 text-center">
        Exento — sin IVA aplicable
      </div>
    );
  }
  const pct = parseFloat(rate) / 100;
  const base = Math.round(total / (1 + pct));
  const iva = total - base;
  return (
    <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg p-2.5 space-y-1">
      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Desglose IVA {rate}%</p>
      <div className="flex justify-between text-[11px] font-mono">
        <span className="text-gray-400">Base Imponible:</span>
        <span className="text-gray-200">{formatGs(base)}</span>
      </div>
      <div className="flex justify-between text-[11px] font-mono">
        <span className="text-blue-400">IVA {rate}%:</span>
        <span className="text-blue-300 font-bold">{formatGs(iva)}</span>
      </div>
      <div className="flex justify-between text-[11px] font-mono border-t border-blue-800/30 pt-1 mt-1">
        <span className="text-white font-semibold">Total:</span>
        <span className="text-white font-bold">{formatGs(total)}</span>
      </div>
    </div>
  );
}

function CategoryBadge({ categoryId }: { categoryId: string }) {
  const cat = EXPENSE_CATEGORIES.find(c => c.id === categoryId);
  if (!cat) return null;
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", cat.color, cat.bg)}>
      {cat.label}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CajaChicaPage() {
  const selectedEntity = useAuthStore((state) => state.selectedEntity);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState("");
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [reimburseLogs, setReimburseLogs] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showFundModal, setShowFundModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);

  // Fund creation form
  const [newFundName, setNewFundName] = useState("");
  const [newCustodian, setNewCustodian] = useState("");
  const [newMaxAmount, setNewMaxAmount] = useState(1500000);

  // Expense rendition form
  const [ticketDate, setTicketDate] = useState(new Date().toISOString().split("T")[0]);
  const [ticketPartner, setTicketPartner] = useState("");
  const [ticketRuc, setTicketRuc] = useState("");
  const [ticketInvoice, setTicketInvoice] = useState("");
  const [ticketTotal, setTicketTotal] = useState(0);
  const [ticketCategory, setTicketCategory] = useState("otros");
  const [ticketIvaRate, setTicketIvaRate] = useState("10");
  const [ticketObservations, setTicketObservations] = useState("");

  // Mock arqueo history
  const arqueoHistory = [
    { date: "2026-04-30", total: 1150000, count: 8, id: "arq-1" },
    { date: "2026-03-31", total: 980000, count: 6, id: "arq-2" },
    { date: "2026-02-28", total: 1320000, count: 10, id: "arq-3" },
  ];

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

  useEffect(() => { fetchFunds(); }, [selectedEntity]);
  useEffect(() => { fetchPending(); }, [selectedFundId]);

  const handleCreateFund = () => {
    if (!selectedEntity?.id || !newFundName || !newCustodian) return;
    startTransition(async () => {
      const res = await createPettyCashFund(
        selectedEntity.id, newFundName, newCustodian, newMaxAmount,
        "a9042b46-7789-4246-8890-000000000000"
      );
      if (res.ok) {
        setShowFundModal(false);
        setNewFundName(""); setNewCustodian("");
        fetchFunds();
      } else { setError(res.error); }
    });
  };

  const handleAddExpense = () => {
    if (!selectedFundId || !ticketPartner || !ticketRuc || !ticketInvoice) return;
    startTransition(async () => {
      const pct = parseFloat(ticketIvaRate) / 100;
      const base = Math.round(ticketTotal / (1 + pct));
      const iva = ticketTotal - base;
      const iva10 = ticketIvaRate === "10" ? iva : 0;
      const iva5  = ticketIvaRate === "5"  ? iva : 0;

      const res = await addPettyCashExpense(
        selectedFundId, ticketDate, ticketPartner, ticketRuc, ticketInvoice,
        ticketTotal, iva10, iva5, 0,
        "50012345-6677-4246-8890-000000000000"
      );
      if (res.ok) {
        setShowExpenseModal(false);
        setTicketPartner(""); setTicketRuc(""); setTicketInvoice("");
        setTicketTotal(0); setTicketObservations(""); setTicketCategory("otros");
        fetchPending();
      } else { setError(res.error); }
    });
  };

  const handleReimburse = () => {
    if (!selectedFundId) return;
    setReimburseLogs(null);
    startTransition(async () => {
      const res = await reimbursePettyCashFund(selectedFundId, new Date().toISOString().split("T")[0]);
      if (res.ok) { setReimburseLogs(res.data); fetchPending(); }
      else setError(res.error);
    });
  };

  const selectedFund = funds.find((f) => f.id === selectedFundId);
  const totalPending = pendingExpenses.reduce((s, e) => s + parseFloat(e.total), 0);
  const disponible = (selectedFund?.maxAmount || 0) - totalPending;
  const usoPct = selectedFund ? Math.min(100, Math.round((totalPending / selectedFund.maxAmount) * 100)) : 0;

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-6xl mx-auto space-y-6">

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
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700/50 text-gray-300 hover:text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <History className="h-4 w-4" /> Historial
          </button>
          <button
            onClick={() => setShowFundModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-600/10"
          >
            <Plus className="h-4 w-4" /> Crear Fondo
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-950/20 border border-red-800/40 rounded-xl text-sm text-red-400">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Left: Funds List */}
        <div className="md:col-span-1 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Fondos</h2>
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
                      ? "bg-gray-800 border-gray-600 text-white shadow-lg ring-1 ring-blue-500/20"
                      : "bg-gray-900/40 border-gray-800/80 text-gray-400 hover:text-white hover:border-gray-700"
                  )}
                >
                  <span className="font-bold text-sm block truncate">{f.name}</span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <User className="h-3 w-3" /> {f.custodian}
                  </span>
                  <span className="font-mono mt-1 text-primary font-bold">{formatGs(Math.round(f.maxAmount))}</span>
                </button>
              );
            })}
            {funds.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-6 border border-dashed border-gray-800 rounded-xl">
                No hay fondos activos.
              </p>
            )}
          </div>
        </div>

        {/* Right: Selected Fund Details */}
        <div className="md:col-span-3 space-y-5">
          {selectedFund ? (
            <>
              {/* Cards Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5 space-y-1">
                  <span className="text-xs text-gray-400 font-medium">Monto Asignado</span>
                  <p className="text-2xl font-black text-white font-mono">
                    {formatGs(Math.round(selectedFund.maxAmount))}
                  </p>
                </div>
                <div className="card p-5 space-y-1 border-amber-800/20 bg-amber-950/5">
                  <span className="text-xs text-amber-400 font-medium">Rendido Pendiente</span>
                  <p className="text-2xl font-black text-amber-300 font-mono">
                    {formatGs(Math.round(totalPending))}
                  </p>
                </div>
                <div className={cn("card p-5 space-y-1",
                  disponible < selectedFund.maxAmount * 0.2
                    ? "border-red-800/20 bg-red-950/5"
                    : "border-green-800/20 bg-green-950/5"
                )}>
                  <span className={cn("text-xs font-medium",
                    disponible < selectedFund.maxAmount * 0.2 ? "text-red-400" : "text-green-400"
                  )}>Efectivo Disponible</span>
                  <p className={cn("text-2xl font-black font-mono",
                    disponible < selectedFund.maxAmount * 0.2 ? "text-red-400" : "text-green-400"
                  )}>
                    {formatGs(Math.round(disponible))}
                  </p>
                </div>
              </div>

              {/* Usage Progress Bar */}
              <div className="card p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Uso del Fondo</span>
                  <span className={cn("font-bold font-mono",
                    usoPct > 80 ? "text-red-400" : usoPct > 50 ? "text-amber-400" : "text-green-400"
                  )}>{usoPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500",
                      usoPct > 80 ? "bg-red-500" : usoPct > 50 ? "bg-amber-500" : "bg-green-500"
                    )}
                    style={{ width: `${usoPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500">
                  {usoPct > 80
                    ? "⚠ Fondo próximo a agotarse — considerar reposición"
                    : usoPct > 50
                    ? "Uso moderado del fondo"
                    : "Fondo con saldo saludable"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end flex-wrap">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700/50 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Plus className="h-4 w-4" /> Rendir Ticket / Gasto
                </button>
                <button
                  disabled={totalPending === 0 || isPending}
                  onClick={handleReimburse}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 shadow-lg shadow-blue-600/10"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Reponer Fondo (Reembolso)
                </button>
              </div>

              {/* Pending Expenses Table */}
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/20">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-gray-400" />
                    Comprobantes Rendidos en este Arqueo
                  </h3>
                  <span className="text-xs text-gray-500 font-medium bg-gray-800 px-2 py-0.5 rounded-full">
                    {pendingExpenses.length} comprobantes
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-950/30 text-gray-400 font-bold uppercase tracking-wider">
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Factura</th>
                        <th className="p-3">Proveedor / Categoría</th>
                        <th className="p-3">RUC</th>
                        <th className="p-3 text-right">Monto Total</th>
                        <th className="p-3 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40 text-gray-300">
                      {pendingExpenses.map((exp, idx) => {
                        const isExpanded = expandedExpense === exp.id || expandedExpense === String(idx);
                        return (
                          <>
                            <tr key={idx} className="hover:bg-gray-800/10 cursor-pointer" onClick={() => setExpandedExpense(isExpanded ? null : (exp.id || String(idx)))}>
                              <td className="p-3 font-mono">{new Date(exp.date).toLocaleDateString("es-PY")}</td>
                              <td className="p-3 font-mono text-blue-400">{exp.invoiceNumber}</td>
                              <td className="p-3">
                                <span className="font-medium text-white block">{exp.partnerName}</span>
                                {exp.category && <CategoryBadge categoryId={exp.category} />}
                              </td>
                              <td className="p-3 font-mono">{exp.partnerRuc}</td>
                              <td className="p-3 text-right font-mono font-bold text-white">
                                {formatGs(Math.round(exp.total))}
                              </td>
                              <td className="p-3">
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${idx}-detail`} className="bg-gray-900/40">
                                <td colSpan={6} className="px-4 pb-3 pt-1">
                                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                                      <p className="text-gray-500 mb-0.5">IVA Incluido</p>
                                      <p className="font-mono text-blue-300 font-bold">{formatGs(Math.round(parseFloat(exp.iva10 || "0") + parseFloat(exp.iva5 || "0")))}</p>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                                      <p className="text-gray-500 mb-0.5">Neto Gravado</p>
                                      <p className="font-mono text-gray-200 font-bold">{formatGs(Math.round(exp.total - (parseFloat(exp.iva10 || "0") + parseFloat(exp.iva5 || "0"))))}</p>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-2.5">
                                      <p className="text-gray-500 mb-0.5">Observaciones</p>
                                      <p className="text-gray-300 italic">{exp.observations || "Sin observaciones"}</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                      {pendingExpenses.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center">
                            <Receipt className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No hay gastos pendientes en este fondo fijo.</p>
                            <p className="text-gray-600 text-xs mt-1">Usá el botón "Rendir Ticket / Gasto" para agregar comprobantes.</p>
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
              <Wallet className="h-12 w-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 font-semibold text-sm">Seleccioná o creá un fondo fijo para ver su estado contable.</p>
            </div>
          )}

          {reimburseLogs && (
            <div className="bg-green-950/20 border border-green-800/40 rounded-2xl p-5 space-y-2 animate-in slide-in-from-bottom-2">
              <h3 className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Reposición Procesada
              </h3>
              <p className="text-xs text-gray-300 font-mono leading-relaxed bg-gray-950/60 p-3 rounded-xl border border-gray-900 whitespace-pre-wrap">
                {reimburseLogs}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Create Fund Modal ────────────────────────────────────────── */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-blue-600/20 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Crear Nuevo Fondo Fijo</h3>
                  <p className="text-[11px] text-gray-500">Fondo para caja chica y gastos menores</p>
                </div>
              </div>
              <button onClick={() => setShowFundModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre del Fondo *</label>
                <input
                  type="text"
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  placeholder="Ej: Caja Chica Administración"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Custodio Responsable *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    value={newCustodian}
                    onChange={(e) => setNewCustodian(e.target.value)}
                    placeholder="Ej: Ana Gómez"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Monto Asignado (Gs.) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <input
                    type="number"
                    value={newMaxAmount}
                    onChange={(e) => setNewMaxAmount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Equivalente a: {formatGs(newMaxAmount)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowFundModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleCreateFund}
                disabled={!newFundName || !newCustodian || isPending}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                Crear Fondo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Rendir Expense Modal ────────────────────────────────────────── */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-600/20 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Rendir Ticket / Gasto</h3>
                  <p className="text-[11px] text-gray-500">Fondo: {selectedFund?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                <Tag className="h-3 w-3 inline mr-1" /> Categoría de Gasto
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setTicketCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all text-left",
                      ticketCategory === cat.id
                        ? `${cat.bg} ${cat.color} border-current/30`
                        : "bg-gray-800/50 text-gray-500 border-gray-700/50 hover:text-gray-300 hover:bg-gray-800"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date + Invoice */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Fecha</label>
                <input type="date" value={ticketDate} onChange={(e) => setTicketDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nro Factura</label>
                <input type="text" value={ticketInvoice} onChange={(e) => setTicketInvoice(e.target.value)}
                  placeholder="001-001-0001234"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Proveedor / Razón Social</label>
              <input type="text" value={ticketPartner} onChange={(e) => setTicketPartner(e.target.value)}
                placeholder="Razón Social del proveedor"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
            </div>

            {/* RUC + Total */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">RUC Proveedor</label>
                <input type="text" value={ticketRuc} onChange={(e) => setTicketRuc(e.target.value)}
                  placeholder="1234567-8"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Monto Total (Gs.)</label>
                <input type="number" value={ticketTotal || ""} onChange={(e) => setTicketTotal(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white font-mono placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
            </div>

            {/* IVA Rate Selector */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tasa de IVA Aplicada</label>
              <div className="flex gap-1.5">
                {IVA_RATES.map(rate => (
                  <button key={rate.value} onClick={() => setTicketIvaRate(rate.value)}
                    className={cn("flex-1 py-2 text-xs font-semibold rounded-lg border transition-all",
                      ticketIvaRate === rate.value
                        ? "bg-blue-600 text-white border-blue-500"
                        : "bg-gray-800 text-gray-400 border-gray-700 hover:text-white"
                    )}>
                    {rate.label}
                  </button>
                ))}
              </div>
            </div>

            {/* IVA Preview */}
            {ticketTotal > 0 && (
              <IvaSummary total={ticketTotal} rate={ticketIvaRate} />
            )}

            {/* Observations */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                <MessageSquare className="h-3 w-3 inline mr-1" /> Observaciones (opcional)
              </label>
              <textarea
                value={ticketObservations}
                onChange={(e) => setTicketObservations(e.target.value)}
                placeholder="Detalle adicional sobre el gasto..."
                rows={2}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleAddExpense}
                disabled={!ticketPartner || !ticketRuc || !ticketInvoice || ticketTotal <= 0 || isPending}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin inline mr-1" /> : null}
                Registrar Gasto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Arqueo History Modal ─────────────────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-purple-600/20 flex items-center justify-center">
                  <Archive className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Historial de Arqueos</h3>
                  <p className="text-[11px] text-gray-500">Reposiciones anteriores del fondo</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {arqueoHistory.map((arq) => (
                <div key={arq.id} className="flex items-center justify-between p-3.5 bg-gray-800/40 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{new Date(arq.date).toLocaleDateString("es-PY", { year: "numeric", month: "long", day: "numeric" })}</p>
                      <p className="text-[11px] text-gray-500">{arq.count} comprobantes rendidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-green-400">{formatGs(arq.total)}</p>
                    <p className="text-[10px] text-gray-500">Reembolsado</p>
                  </div>
                </div>
              ))}
              {arqueoHistory.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-6">No hay arqueos anteriores.</p>
              )}
            </div>

            <button onClick={() => setShowHistoryModal(false)}
              className="w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
