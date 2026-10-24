"use client";

import { useState } from "react";
import {
  CheckCircle2, Clock, AlertCircle, Lock, Unlock,
  ChevronRight, TrendingUp, FileText, Download, Calendar,
  ChevronDown, ChevronUp, Sparkles, BarChart3, Calculator, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/trpc/client";
import { useToast } from "@/components/ui/toast";

export default function CierreMensualPage() {
  const { selectedEntity } = useAuthStore();
  const { addToast } = useToast();

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const entityId = selectedEntity?.id || "00000000-0000-0000-0000-000000000001";

  const { data: statusData, isLoading, refetch } = api.cierre.validate.useQuery(
    { entityId, year, month },
    { enabled: !!entityId }
  );

  const closeMutation = api.cierre.closePeriod.useMutation({
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Período cerrado",
        message: `El período fiscal ${month}/${year} ha sido cerrado exitosamente.`,
      });
      refetch();
    },
    onError: (err) => {
      addToast({
        type: "error",
        title: "Error al cerrar período",
        message: err.message,
      });
    },
  });

  const reopenMutation = api.cierre.reopenPeriod.useMutation({
    onSuccess: () => {
      addToast({
        type: "info",
        title: "Período reabierto",
        message: `El período ${month}/${year} está nuevamente abierto para edición.`,
      });
      refetch();
    },
    onError: (err) => {
      addToast({
        type: "error",
        title: "Error al reabrir",
        message: err.message,
      });
    },
  });

  const closingEntryMutation = api.cierre.generateClosingEntry.useMutation({
    onSuccess: (res) => {
      addToast({
        type: "success",
        title: "Refundición de resultados",
        message: res.message,
      });
      refetch();
    },
    onError: (err) => {
      addToast({
        type: "error",
        title: "Error al generar refundición",
        message: err.message,
      });
    },
  });

  const isClosed = statusData?.status === "closed";
  const checks = statusData?.checks || {
    asientosPosteados: { label: "Todos los asientos posteados y aprobados", ok: true, count: 0 },
    comprobantesProcesados: { label: "Todos los XML SIFEN y comprobantes procesados", ok: true, count: 0 },
    balanceCuadrado: { label: "Balance de sumas y saldos cuadrado (Debe === Haber)", ok: true, diferencia: 0 },
    conciliacionBancaria: { label: "Conciliación bancaria al día", ok: true },
  };

  const checklistItems = [
    {
      id: "c1",
      label: checks.asientosPosteados.label,
      description: checks.asientosPosteados.ok
        ? "Todos los asientos del mes están posteados"
        : `Hay ${checks.asientosPosteados.count} asientos en borrador pendientes de posteo`,
      ok: checks.asientosPosteados.ok,
      link: "/asientos",
    },
    {
      id: "c2",
      label: checks.comprobantesProcesados.label,
      description: "Comprobantes electrónicos SIFEN y documentos timbrados validados",
      ok: checks.comprobantesProcesados.ok,
      link: "/sifen/historial",
    },
    {
      id: "c3",
      label: checks.conciliacionBancaria.label,
      description: "Movimientos bancarios emparejados con el libro mayor (1.1.1.02)",
      ok: checks.conciliacionBancaria.ok,
      link: "/banco/conciliacion",
    },
    {
      id: "c4",
      label: checks.balanceCuadrado.label,
      description: checks.balanceCuadrado.ok
        ? "La partida doble cierra perfectamente (Diferencia Gs. 0)"
        : `Diferencia de cuadratura: Gs. ${checks.balanceCuadrado.diferencia.toLocaleString("es-PY")}`,
      ok: checks.balanceCuadrado.ok,
      link: "/balance",
    },
    {
      id: "c5",
      label: "Asiento de Refundición de Resultados",
      description: "Cancelación de cuentas nominales (clases 4 y 5) contra Resultado del Ejercicio",
      ok: isClosed,
      isAction: true,
    },
  ];

  const okCount = checklistItems.filter((i) => i.ok).length;
  const totalCount = checklistItems.length;
  const pct = isClosed ? 100 : Math.round((okCount / totalCount) * 100);
  const canClose = (statusData?.canClose ?? true) && !isClosed;

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
            Cierre Mensual y Anual
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            {selectedEntity?.legalName || "Empresa"} — Período Fiscal {month.toString().padStart(2, "0")}/{year}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 text-xs">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent font-medium text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  Mes {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent font-medium text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg bg-gray-100 dark:bg-gray-800 transition-colors"
            title="Actualizar validación"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </button>

          {isClosed ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800/30">
                <Lock className="h-4 w-4" /> Período Cerrado
              </span>
              <button
                onClick={() => statusData?.periodId && reopenMutation.mutate({ periodId: statusData.periodId })}
                disabled={reopenMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Unlock className="h-4 w-4" /> Reabrir
              </button>
            </div>
          ) : (
            <button
              disabled={!canClose || closeMutation.isPending}
              onClick={() => statusData?.periodId && closeMutation.mutate({ periodId: statusData.periodId })}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors shadow-sm"
            >
              <Lock className="h-4 w-4" />
              {closeMutation.isPending ? "Cerrando..." : "Cerrar Período"}
            </button>
          )}
        </div>
      </div>

      {/* Progress card */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Progreso del Cierre</h2>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", isClosed || pct === 100 ? "bg-green-500" : "bg-blue-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{okCount} de {totalCount} controles listos</span>
          <span>{isClosed ? "Período cerrado y bloqueado" : canClose ? "Listo para cerrar" : "Pendiente de regularización"}</span>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Validación de Cierre Fiscal (DNIT / Res. 49/14)</h2>
          <span className="text-xs text-gray-400">Validado en tiempo real con Postgres</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
          {checklistItems.map((item) => {
            const isExpanded = showDetail === item.id;
            return (
              <div
                key={item.id}
                className={cn(
                  "transition-colors",
                  item.ok && "bg-green-50/20 dark:bg-green-500/5",
                  !item.ok && "bg-amber-50/20 dark:bg-amber-500/5"
                )}
              >
                <div className="flex items-start gap-3 p-3 sm:p-4">
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                      item.ok ? "bg-green-500 border-green-500 text-white" : "border-amber-400 bg-amber-50 dark:bg-amber-500/10 text-amber-500"
                    )}
                  >
                    {item.ok ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm font-medium", item.ok ? "text-green-800 dark:text-green-300" : "text-gray-900 dark:text-white")}>
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.isAction && !isClosed && (
                      <button
                        onClick={() =>
                          statusData?.periodId &&
                          closingEntryMutation.mutate({ entityId, periodId: statusData.periodId })
                        }
                        disabled={closingEntryMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/30 hover:bg-indigo-100 transition-colors"
                      >
                        <Sparkles className="h-3 w-3" />
                        {closingEntryMutation.isPending ? "Generando..." : "Generar Refundición"}
                      </button>
                    )}
                    {item.link && (
                      <a
                        href={item.link}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                      >
                        Revisar <ChevronRight className="h-3 w-3" />
                      </a>
                    )}
                    <button
                      onClick={() => setShowDetail(isExpanded ? null : item.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 ml-9 space-y-2 text-xs">
                    {item.id === "c4" && (
                      <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 font-mono space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Diferencia de Balance</span>
                          <span className={cn(checks.balanceCuadrado.ok ? "text-green-600 font-bold" : "text-red-500 font-bold")}>
                            Gs. {checks.balanceCuadrado.diferencia.toLocaleString("es-PY")}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-sans mt-1">
                          El libro mayor verifica que el saldo de las cuentas de activo, pasivo, patrimonio, ingresos y gastos cuadre exactamente a cero.
                        </p>
                      </div>
                    )}
                    {item.id === "c5" && (
                      <div className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3 space-y-1 text-gray-600 dark:text-gray-300">
                        <p className="font-medium text-gray-800 dark:text-gray-200">¿Qué hace el asiento de refundición?</p>
                        <p>
                          Cancela los saldos acreedores de las cuentas de ingresos (clase 4) debitándolas, cancela los saldos deudores de gastos y costos (clase 5) acreditándolas, y transfiere la diferencia neta a la cuenta de Resultado del Ejercicio (Patrimonio Neto).
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Banner if Closed */}
      {isClosed && (
        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-800/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-green-800 dark:text-green-300 font-medium">Período Contable Cerrado</h3>
              <p className="text-green-700 dark:text-green-400 text-xs sm:text-sm mt-1">
                El período fiscal {month}/{year} se encuentra formalmente cerrado y protegido contra alteraciones.
                {statusData?.closedAt && ` Fecha de cierre: ${new Date(statusData.closedAt).toLocaleString("es-PY")}.`}
              </p>
              <div className="flex gap-2 mt-3">
                <a
                  href="/balance"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                >
                  <BarChart3 className="h-3.5 w-3.5" /> Ver Balance de Sumas y Saldos
                </a>
                <a
                  href="/asientos"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" /> Ver Libro Diario
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
