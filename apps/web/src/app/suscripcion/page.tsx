"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { useEntity } from "@/hooks/use-entity";
import { getSubscriptionDataAction, submitPaymentOrderAction } from "./actions";
import type { SubscriptionPlan, BankTransferDetails, PaymentOrder } from "@/lib/subscription-service";
import { useToast } from "@/components/ui/toast";

export default function SuscripcionPage() {
  const { selectedEntity } = useEntity();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [bankDetails, setBankDetails] = useState<BankTransferDetails | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);

  // Form state
  const [selectedPlanId, setSelectedPlanId] = useState<"starter" | "pro" | "inhouse" | "enterprise">("pro");
  const [billingCycle, setBillingCycle] = useState<"mensual" | "anual">("mensual");
  const [bancoOrigen, setBancoOrigen] = useState("Banco Itaú");
  const [comprobanteRef, setComprobanteRef] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSubscriptionDataAction(selectedEntity?.id);
      setPlans(data.plans);
      setBankDetails(data.bankDetails);
      setOrders(data.orders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEntity?.id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    addToast({
      type: "success",
      title: "Copiado al portapapeles",
      message: `${label}: ${text}`,
    });
    setTimeout(() => setCopiedField(null), 2500);
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[1];
  const amountGs =
    billingCycle === "anual" ? selectedPlan?.priceGsAnnual || 0 : selectedPlan?.priceGsMonthly || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comprobanteRef.trim()) {
      addToast({
        type: "error",
        title: "Dato requerido",
        message: "Por favor ingresá el número de comprobante o referencia SIPAP.",
      });
      return;
    }

    setSubmitting(true);
    const res = await submitPaymentOrderAction({
      entityId: selectedEntity?.id || "00000000-0000-0000-0000-000000000001",
      entityName: selectedEntity?.legalName || "Mi Estudio Contable",
      plan: selectedPlanId,
      billingCycle,
      amountGs,
      comprobanteRef: comprobanteRef.trim(),
      bancoOrigen: bancoOrigen.trim(),
      notas: notas.trim() || undefined,
    });
    setSubmitting(false);

    if (res.success) {
      addToast({
        type: "success",
        title: "Comprobante Registrado",
        message: "Tu comprobante SIPAP fue enviado para verificación inmediata.",
      });
      setComprobanteRef("");
      setNotas("");
      loadData();
    } else {
      addToast({
        type: "error",
        title: "Error al registrar comprobante",
        message: res.error || "No se pudo procesar la solicitud.",
      });
    }
  };

  const currentPlanName = selectedEntity?.plan || "Starter";

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Suscripción & Facturación B2B
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Gestioná el plan de tu estudio contable y pagá mediante transferencia bancaria SIPAP directa
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-gray-400">Plan Actual</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">
              {currentPlanName}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Planes Disponibles */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            1. Seleccioná tu Plan de Suscripción
          </h2>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setBillingCycle("mensual")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                billingCycle === "mensual"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle("anual")}
              className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1 ${
                billingCycle === "anual"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Anual <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">(-17%)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans
            .filter((p) => p.id !== "starter")
            .map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              const price = billingCycle === "anual" ? plan.priceGsAnnual : plan.priceGsMonthly;
              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative cursor-pointer rounded-2xl p-5 border transition-all ${
                    isSelected
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 dark:border-blue-500 shadow-md ring-2 ring-blue-500/30"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                      ⭐ Más Elegido
                    </span>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="my-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs text-gray-400">Gs. </span>
                    <span className="text-2xl font-black text-gray-900 dark:text-white">
                      {price.toLocaleString("es-PY")}
                    </span>
                    <span className="text-xs text-gray-500"> / {billingCycle === "anual" ? "año" : "mes"}</span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-4">
                    {plan.features.slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {isSelected ? "Plan Seleccionado ✓" : "Elegir este Plan"}
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* Grid: 2 Columnas: Datos Bancarios SIPAP & Formulario de Notificación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Columna Izquierda: Datos Bancarios Oficiales */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                2. Datos Bancarios Oficiales (SIPAP)
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Transferí desde cualquier banco o cooperativa de Paraguay
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Cuenta Oficial
            </span>
          </div>

          {bankDetails && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Banco:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{bankDetails.banco}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Razón Social / Titular:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{bankDetails.titular}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">RUC:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900 dark:text-white">
                    <span>{bankDetails.ruc}</span>
                    <button
                      onClick={() => copyToClipboard(bankDetails.ruc, "RUC")}
                      className="p-1 text-gray-400 hover:text-blue-500 rounded"
                      title="Copiar RUC"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Tipo de Cuenta:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{bankDetails.tipoCuenta}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Número de Cuenta:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                    <span>{bankDetails.cuenta}</span>
                    <button
                      onClick={() => copyToClipboard(bankDetails.cuenta, "Número de Cuenta")}
                      className="p-1 text-gray-400 hover:text-blue-500 rounded"
                      title="Copiar Cuenta"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Alias SIPAP:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900 dark:text-white">
                    <span>{bankDetails.aliasSipap}</span>
                    <button
                      onClick={() => copyToClipboard(bankDetails.aliasSipap, "Alias SIPAP")}
                      className="p-1 text-gray-400 hover:text-blue-500 rounded"
                      title="Copiar Alias"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                  Emitimos factura electrónica SIFEN oficial por el 100% de los servicios contratados con IVA incluido. Al confirmar el pago recibirás el KuDE por correo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Formulario de Carga de Comprobante */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              3. Informar Transferencia SIPAP
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Registrá los datos de tu comprobante para activar o renovar inmediatamente
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-gray-500 block">Plan a Activar:</span>
                <span className="font-bold text-gray-900 dark:text-white capitalize">
                  {selectedPlan?.name} ({billingCycle})
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block">Total a Pagar:</span>
                <span className="font-black text-sm text-blue-600 dark:text-blue-400">
                  Gs. {amountGs.toLocaleString("es-PY")}
                </span>
              </div>
            </div>

            {/* Banco Origen */}
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Banco o Cooperativa de Origen *
              </label>
              <select
                value={bancoOrigen}
                onChange={(e) => setBancoOrigen(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="Banco Itaú">Banco Itaú Paraguay</option>
                <option value="Banco Continental">Banco Continental</option>
                <option value="Banco GNB">Banco GNB Paraguay</option>
                <option value="Banco Nacional de Fomento (BNF)">Banco Nacional de Fomento (BNF)</option>
                <option value="Banco Basa">Banco Basa</option>
                <option value="Banco Atlas">Banco Atlas</option>
                <option value="Sudameris Bank">Sudameris Bank</option>
                <option value="Ueno Bank">Ueno Bank</option>
                <option value="Familiar">Banco Familiar</option>
                <option value="Cooperativa">Cooperativa / Otro</option>
              </select>
            </div>

            {/* Comprobante / Referencia */}
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                N° de Referencia / Comprobante SIPAP *
              </label>
              <input
                type="text"
                required
                value={comprobanteRef}
                onChange={(e) => setComprobanteRef(e.target.value)}
                placeholder="Ej: 202610250012399 o 87654321"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Notas opcionales */}
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas adicionales o nombre del ordenante (opcional)
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Pago realizado por Juan Pérez / RUC facturación"
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !comprobanteRef.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/20"
            >
              {submitting ? "Enviando comprobante..." : "Notificar Transferencia SIPAP"}
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Historial de Comprobantes Notificados */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Historial de Solicitudes y Pagos Notificados
        </h3>

        {orders.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 py-3 text-center">
            No registrás comprobantes de pago pendientes de verificación.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500">
                  <th className="py-2 px-3">Fecha</th>
                  <th className="py-2 px-3">Plan</th>
                  <th className="py-2 px-3">Monto Gs.</th>
                  <th className="py-2 px-3">Comprobante SIPAP</th>
                  <th className="py-2 px-3">Banco</th>
                  <th className="py-2 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2 px-3 font-mono">
                      {new Date(o.createdAt).toLocaleDateString("es-PY")}
                    </td>
                    <td className="py-2 px-3 font-semibold uppercase">{o.plan}</td>
                    <td className="py-2 px-3 font-mono font-bold">
                      {o.amountGs.toLocaleString("es-PY")}
                    </td>
                    <td className="py-2 px-3 font-mono">{o.comprobanteRef}</td>
                    <td className="py-2 px-3">{o.bancoOrigen || "SIPAP"}</td>
                    <td className="py-2 px-3">
                      {o.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </span>
                      ) : o.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                          <AlertTriangle className="w-3 h-3" /> Rechazado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          <Clock className="w-3 h-3" /> En Verificación
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
