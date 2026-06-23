"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  ArrowLeft, Upload, Sparkles, Loader2, CheckCircle2, AlertCircle,
  FileText, Calendar, DollarSign, X, Receipt, Building2, AlertTriangle,
  CreditCard, Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadEntidadesParaComprobantes,
  loadPendingInstallments,
  processReceiptOCR,
  registerReceipt,
  fetchExchangeRate,
} from "../actions";

function formatGs(v: number) {
  return v.toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

type Installment = {
  id: string;
  documentId: string;
  docNumber: string;
  partnerName: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: string;
  isOverdue: boolean;
  currencyCode: string;
  fxRate: number;
};

export default function RecibosPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [ocrPending, setOcrPending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [entities, setEntities] = useState<Array<{ id: string; legalName: string; ruc: string }>>([]);
  const [entityId, setEntityId] = useState("");
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  // Selected installments to pay with this receipt
  const [selectedInstIds, setSelectedInstIds] = useState<Set<string>>(new Set());

  // Track user-inputted amounts for partial payments (maps installmentId -> numeric amount)
  const [partialAmounts, setPartialAmounts] = useState<Record<string, number>>({});

  // Receipt form fields
  const [receiptNumber, setReceiptNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [partnerRuc, setPartnerRuc] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "card">("cash");

  // Multi-currency handling for payment
  const [paymentFxRate, setPaymentFxRate] = useState<number>(0);
  const [fetchingFx, setFetchingFx] = useState(false);

  // Check if any selected installment is in foreign currency (e.g. USD)
  const selectedForeignInstallments = installments.filter(
    (i) => selectedInstIds.has(i.id) && i.currencyCode && i.currencyCode !== "PYG"
  );
  const hasForeignCurrency = selectedForeignInstallments.length > 0;
  // Use first foreign currency code as target
  const targetCurrency = selectedForeignInstallments[0]?.currencyCode || "USD";

  // Fetch exchange rate on date change if foreign debt is selected
  useEffect(() => {
    if (!hasForeignCurrency || !issueDate) return;
    setFetchingFx(true);
    fetchExchangeRate(targetCurrency, "dnit", issueDate).then((res) => {
      setFetchingFx(false);
      if (res.ok) {
        setPaymentFxRate(res.data.sellRate);
      }
    });
  }, [issueDate, hasForeignCurrency, targetCurrency]);

  // Computed total of selected installments
  // If foreign currency, show total in USD, but compute PYG conversion dynamically
  const selectedTotal = installments
    .filter((i) => selectedInstIds.has(i.id))
    .reduce((s, i) => {
      const amt = partialAmounts[i.id] !== undefined ? partialAmounts[i.id] : i.amount;
      return s + amt;
    }, 0);

  const handlePartialAmountChange = (id: string, value: number) => {
    setPartialAmounts((prev) => ({
      ...prev,
      [id]: Math.max(0, value),
    }));
  };

  // Load entities
  useEffect(() => {
    loadEntidadesParaComprobantes().then((r) => {
      if (r.ok) {
        setEntities(r.data);
        if (r.data.length > 0) setEntityId(r.data[0].id);
      }
    });
  }, []);

  // Load pending installments when entity changes
  useEffect(() => {
    if (!entityId) return;
    setLoadingInstallments(true);
    loadPendingInstallments(entityId).then((r) => {
      setLoadingInstallments(false);
      if (r.ok) setInstallments(r.data);
    });
  }, [entityId]);

  const toggleInstallment = (id: string) => {
    setSelectedInstIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // OCR Processing
  const handleOcrFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrPending(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Raw = reader.result as string;
      const base64Data = base64Raw.split(",")[1];
      const res = await processReceiptOCR(base64Data, file.type);
      setOcrPending(false);

      if (res.ok) {
        const d = res.data;
        if (d.number) setReceiptNumber(d.number);
        if (d.issueDate) setIssueDate(d.issueDate);
        if (d.partnerRuc) setPartnerRuc(d.partnerRuc);
        if (d.partnerName) setPartnerName(d.partnerName);
        setFeedback({ type: "success", message: "✓ Recibo digitalizado con Gemini. Verificá y completá los datos." });
      } else {
        setFeedback({ type: "error", message: res.error });
      }
    };
  };

  const handleRegister = () => {
    setFeedback(null);
    if (!entityId || !receiptNumber || !issueDate || !partnerRuc || !partnerName) {
      setFeedback({ type: "error", message: "Completá todos los campos del recibo." });
      return;
    }
    if (selectedInstIds.size === 0) {
      setFeedback({ type: "error", message: "Seleccioná al menos una cuota a saldar." });
      return;
    }

    startTransition(async () => {
      const result = await registerReceipt({
        entityId,
        number: receiptNumber,
        issueDate,
        total: selectedTotal,
        partnerRuc,
        partnerName,
        paymentMethod,
        installmentPayments: Array.from(selectedInstIds).map((id) => {
          const inst = installments.find((i) => i.id === id);
          const payAmount = partialAmounts[id] !== undefined ? partialAmounts[id] : (inst?.amount || 0);
          return { installmentId: id, payAmount };
        }),
        paymentFxRate: hasForeignCurrency ? paymentFxRate : undefined,
      });

      if (result.ok) {
        setFeedback({
          type: "success",
          message: `✓ Recibo registrado. Asiento ${result.data.entryNumber} generado.`,
        });
        // Refresh installments
        setSelectedInstIds(new Set());
        setPartialAmounts({});
        setReceiptNumber("");
        loadPendingInstallments(entityId).then((r) => {
          if (r.ok) setInstallments(r.data);
        });
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  };

  const overdueCount = installments.filter((i) => i.isOverdue).length;
  const totalPending = installments.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/comprobantes" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </a>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-400" />
              Recibos de Pago
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Registrá pagos y cancelá cuotas pendientes a crédito. Gemini lee el recibo por vos.
            </p>
          </div>
        </div>

        <select
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none"
        >
          {entities.map((e) => (
            <option key={e.id} value={e.id}>{e.legalName}</option>
          ))}
        </select>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          "flex items-center gap-3 p-4 rounded-xl border animate-in fade-in",
          feedback.type === "success"
            ? "bg-green-950/20 border-green-800/40 text-green-400"
            : "bg-red-950/20 border-red-800/40 text-red-400"
        )}>
          {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Cuotas Pendientes</p>
          <p className="text-2xl font-bold text-white mt-1">{installments.length}</p>
        </div>
        <div className={cn(
          "border rounded-2xl p-4",
          overdueCount > 0 ? "bg-red-950/20 border-red-800/30" : "bg-gray-900/40 border-gray-800/60"
        )}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: overdueCount > 0 ? "#f87171" : "#6b7280" }}>
            Vencidas
          </p>
          <p className={cn("text-2xl font-bold mt-1", overdueCount > 0 ? "text-red-400" : "text-white")}>
            {overdueCount}
          </p>
        </div>
        <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total a Pagar</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">₲ {formatGs(totalPending)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Pending Installments List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-200">Cuotas Pendientes</h2>
              {selectedInstIds.size > 0 && (
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg">
                  {selectedInstIds.size} sel. · ₲ {formatGs(selectedTotal)}
                </span>
              )}
            </div>

            {loadingInstallments ? (
              <div className="flex items-center justify-center py-12 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">Cargando cuotas...</span>
              </div>
            ) : installments.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-semibold">No hay cuotas pendientes</p>
                <p className="text-xs text-gray-600 mt-1">¡Todas las facturas a crédito están al día!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800/60">
                {installments.map((inst) => {
                  const isSelected = selectedInstIds.has(inst.id);
                  const payAmount = partialAmounts[inst.id] !== undefined ? partialAmounts[inst.id] : inst.amount;

                  return (
                    <div
                      key={inst.id}
                      className={cn(
                        "w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-all border-l-2",
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500"
                          : "hover:bg-gray-800/10 border-transparent",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleInstallment(inst.id)}
                        className="flex items-center gap-4 text-left flex-1 min-w-0"
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected ? "bg-emerald-500 border-emerald-500" : "border-gray-600"
                        )}>
                          {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white truncate">{inst.partnerName}</span>
                            {inst.isOverdue && (
                              <span className="shrink-0 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Vencida
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Fac. {inst.docNumber} · Cuota {inst.installmentNumber} · Vence: <span className={cn("font-mono", inst.isOverdue ? "text-red-400" : "text-gray-300")}>{inst.dueDate}</span>
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500">Monto total</p>
                          <span className="text-xs font-semibold font-mono text-gray-400 line-through">
                            ₲ {formatGs(inst.amount)}
                          </span>
                        </div>

                        {isSelected ? (
                          <div className="flex flex-col items-end">
                            <label className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Monto a Pagar (Gs.)</label>
                            <input
                              type="number"
                              value={payAmount}
                              onChange={(e) => handlePartialAmountChange(inst.id, parseFloat(e.target.value) || 0)}
                              className="w-32 px-2.5 py-1 bg-gray-900 border border-emerald-500/40 rounded-lg text-xs font-mono text-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-[10px] text-gray-500">Saldo pendiente</p>
                            <span className="text-sm font-bold font-mono text-white">
                              ₲ {formatGs(inst.amount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Receipt Form */}
        <div className="lg:col-span-2 space-y-4">

          {/* OCR Uploader */}
          <div
            className="bg-gray-900/30 border-2 border-dashed border-gray-800 hover:border-emerald-600/40 transition-colors rounded-2xl p-5 flex flex-col items-center text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleOcrFile}
            />
            {ocrPending ? (
              <div className="space-y-2">
                <Loader2 className="h-7 w-7 animate-spin text-emerald-500 mx-auto" />
                <p className="text-sm text-gray-300 font-semibold">Gemini leyendo el recibo...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-6 w-6 text-gray-500" />
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold text-gray-300">Subí el recibo para digitalizar con IA</p>
                <p className="text-xs text-gray-500">Foto o PDF — Gemini extrae los datos automáticamente</p>
              </div>
            )}
          </div>

          {/* Receipt Data Form */}
          <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-200 border-b border-gray-800 pb-2">Datos del Recibo</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1">Nro. Recibo *</label>
                <input
                  type="text"
                  placeholder="Ej: REC-001"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              {hasForeignCurrency && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                    TC Pago ({targetCurrency}) *
                    {fetchingFx && <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={paymentFxRate || ""}
                    onChange={(e) => setPaymentFxRate(parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 7520"
                    className="w-full px-3 py-2 bg-gray-800/50 border border-cyan-800/40 rounded-xl text-sm text-cyan-300 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">RUC *</label>
                <input
                  type="text"
                  placeholder="00000000-0"
                  value={partnerRuc}
                  onChange={(e) => setPartnerRuc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-400 mb-1">Razón Social *</label>
                <input
                  type="text"
                  placeholder="Ej: Distribuidora SA"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Forma de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "cash", label: "Efectivo", icon: Banknote },
                  { value: "bank", label: "Banco", icon: Building2 },
                  { value: "card", label: "Tarjeta", icon: CreditCard },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value as any)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                      paymentMethod === value
                        ? "bg-emerald-600/20 border-emerald-500/60 text-emerald-300"
                        : "bg-gray-800/30 border-gray-700/40 text-gray-400 hover:border-gray-600"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            {selectedInstIds.size > 0 && (() => {
              // Calculate preview metrics
              let totalPygLiability = 0;
              let totalPygPayment = 0;

              selectedForeignInstallments.forEach((i) => {
                const payAmt = partialAmounts[i.id] !== undefined ? partialAmounts[i.id] : i.amount;
                totalPygLiability += Math.round(payAmt * i.fxRate);
                totalPygPayment += Math.round(payAmt * (paymentFxRate || i.fxRate));
              });

              const diff = totalPygLiability - totalPygPayment;

              return (
                <div className="rounded-xl bg-emerald-950/20 border border-emerald-800/30 p-3 space-y-2 animate-in fade-in">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">{selectedInstIds.size} cuota{selectedInstIds.size !== 1 ? "s" : ""} seleccionada{selectedInstIds.size !== 1 ? "s" : ""}</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {hasForeignCurrency 
                        ? `${targetCurrency} ${selectedTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : `₲ ${formatGs(selectedTotal)}`
                      }
                    </span>
                  </div>

                  {hasForeignCurrency && (
                    <div className="border-t border-gray-800 pt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between text-gray-400">
                        <span>Deuda Original en PYG:</span>
                        <span className="font-mono">₲ {formatGs(totalPygLiability)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Valor al TC de Pago:</span>
                        <span className="font-mono">₲ {formatGs(totalPygPayment)}</span>
                      </div>

                      {diff !== 0 ? (
                        <div className={cn(
                          "flex justify-between font-semibold mt-1 p-1 rounded",
                          diff > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        )}>
                          <span>{diff > 0 ? "Ganancia por Dif. Cambio:" : "Pérdida por Dif. Cambio:"}</span>
                          <span className="font-mono">₲ {formatGs(Math.abs(diff))}</span>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic text-[10px] text-center mt-1">
                          Sin diferencia de cambio (mismo tipo de cambio).
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-500 mt-1 border-t border-gray-800/60 pt-1.5">
                    Se generará el asiento: Débito Proveedores / Crédito {paymentMethod === "cash" ? "Caja" : paymentMethod === "bank" ? "Banco" : "Tarjeta"}
                    {hasForeignCurrency && diff !== 0 && " + cuenta de Diferencia de Cambio."}
                  </p>
                </div>
              );
            })()}

            <button
              onClick={handleRegister}
              disabled={isPending || !receiptNumber || !partnerRuc || selectedInstIds.size === 0}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all",
                !isPending && receiptNumber && partnerRuc && selectedInstIds.size > 0
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              )}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              {isPending ? "Registrando..." : "Registrar Recibo y Saldar Cuotas"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
