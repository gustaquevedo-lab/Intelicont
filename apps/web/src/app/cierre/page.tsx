"use client";

import { useState } from "react";
import {
  CheckCircle2, Clock, AlertCircle, Lock, Unlock,
  ChevronRight, TrendingUp, FileText, Download, Calendar,
  ChevronDown, ChevronUp, Sparkles, BarChart3, Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: "pending" | "in_progress" | "done" | "blocked";
  dependsOn?: string[];
  auto?: boolean;
  link?: string;
}

const CHECKLIST: ChecklistItem[] = [
  { id: "c1", label: "Verificar asientos del período", description: "Revisar que todos los asientos estén posteados y balanceados", status: "done", link: "/asientos" },
  { id: "c2", label: "Cargar todos los XML SIFEN", description: "Asegurar que todos los comprobantes electrónicos estén procesados", status: "done", link: "/sifen/historial" },
  { id: "c3", label: "Conciliación bancaria", description: "Conciliar todos los movimientos bancarios del mes", status: "done", link: "/banco" },
  { id: "c4", label: "Calcular depreciaciones", description: "Registrar depreciación mensual de activos fijos", status: "in_progress", link: "/activos" },
  { id: "c5", label: "Verificar retenciones", description: "Controlar retenciones de IVA, IRE, IRP efectuadas y recibidas", status: "pending" },
  { id: "c6", label: "Armotizar gastos pagados por adelantado", description: "Seguros, alquileres, suscripciones", status: "pending", dependsOn: ["c4"] },
  { id: "c7", label: "Calcular previsión de incobrables", description: "Revisar cuentas a cobrar vencidas > 90 días", status: "pending" },
  { id: "c8", label: "Calcular IRE del período", description: "Determinar base imponible y registrar provisión", status: "pending", dependsOn: ["c1", "c5"] },
  { id: "c9", label: "Generar balance de comprobación", description: "Sumas y saldos del período — verificar débito = crédito", status: "pending", dependsOn: ["c1", "c4", "c5"], auto: true },
  { id: "c10", label: "Cerrar período", description: "Bloquear el período para evitar modificaciones posteriores", status: "pending", dependsOn: ["c9"] },
];

export default function CierreMensualPage() {
  const [items, setItems] = useState(CHECKLIST);
  const [showDetail, setShowDetail] = useState<string | null>(null);
  const [periodoBloqueado, setPeriodoBloqueado] = useState(false);

  const done = items.filter(i => i.status === "done").length;
  const total = items.length;
  const pct = Math.round((done / total) * 100);
  const canClose = items.every(i => i.status === "done" || i.auto);
  const allDone = items.every(i => i.status === "done");

  const toggleStatus = (id: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const next: Record<string, ChecklistItem["status"]> = {
        pending: "in_progress",
        in_progress: "done",
        done: "pending",
      };
      return { ...i, status: next[i.status] };
    }));
  };

  const canToggle = (item: ChecklistItem): boolean => {
    if (!item.dependsOn) return true;
    return item.dependsOn.every(depId => {
      const dep = items.find(i => i.id === depId);
      return dep?.status === "done";
    });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Cierre Mensual</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Mayo 2026 — Importadora del Este S.A.</p>
        </div>
        <div className="flex items-center gap-2">
          {periodoBloqueado ? (
            <span className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800/30">
              <Lock className="h-4 w-4" /> Período Cerrado
            </span>
          ) : (
            <button
              disabled={!canClose}
              onClick={() => setPeriodoBloqueado(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors no-tap-highlight"
            >
              <Lock className="h-4 w-4" />
              Cerrar Período
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Progreso del Cierre</h2>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-green-500" : "bg-blue-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
          <span>{done} de {total} completados</span>
          <span>{allDone ? "Listo para cerrar" : canClose ? "Puede cerrarse" : `${total - done} pendientes`}</span>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Checklist de Cierre</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
          {items.map((item) => {
            const blocked = !canToggle(item);
            const isExpanded = showDetail === item.id;

            return (
              <div key={item.id} className={cn(
                "transition-colors",
                item.status === "done" && "bg-green-50/30 dark:bg-green-500/5",
                item.status === "in_progress" && "bg-blue-50/30 dark:bg-blue-500/5",
              )}>
                <div
                  className="flex items-start gap-3 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/20 no-tap-highlight"
                  onClick={() => !blocked && toggleStatus(item.id)}
                >
                  <button className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors no-tap-highlight",
                    item.status === "done" && "bg-green-500 border-green-500",
                    item.status === "in_progress" && "border-blue-500 bg-blue-50 dark:bg-blue-500/10",
                    item.status === "pending" && "border-gray-300 dark:border-gray-600",
                    item.status === "blocked" && "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-500/10",
                    blocked && item.status !== "done" && "opacity-40 cursor-not-allowed"
                  )}>
                    {item.status === "done" && <CheckCircle2 className="h-4 w-4 text-white" />}
                    {item.status === "in_progress" && <Clock className="h-3 w-3 text-blue-500" />}
                    {item.status === "blocked" && <AlertCircle className="h-3 w-3 text-red-500" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        item.status === "done" ? "text-green-700 dark:text-green-400 line-through" : "text-gray-900 dark:text-white"
                      )}>
                        {item.label}
                      </span>
                      {item.auto && <span className="text-[9px] px-1 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-500">AUTO</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.description}</p>
                    {blocked && item.status !== "done" && (
                      <p className="text-[10px] text-red-400 mt-0.5">Requiere completar pasos anteriores</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.link && (
                      <a href={item.link} onClick={(e) => e.stopPropagation()} className="text-[10px] text-blue-500 hover:text-blue-400 no-tap-highlight">
                        Ir →
                      </a>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDetail(isExpanded ? null : item.id); }}
                      className="p-1 no-tap-highlight"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 ml-9 space-y-2">
                    {item.id === "c9" && (
                      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 text-xs space-y-1 font-mono">
                        <div className="flex justify-between"><span className="text-gray-400">Total Débito</span><span className="text-green-600">Gs. 48,250,000</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Total Crédito</span><span className="text-red-600">Gs. 48,250,000</span></div>
                        <div className="flex justify-between font-bold pt-1 border-t border-gray-200 dark:border-gray-700"><span>Diferencia</span><span className="text-green-600">Gs. 0</span></div>
                      </div>
                    )}
                    {item.id === "c10" && canClose && (
                      <div className="bg-yellow-50 dark:bg-yellow-500/5 rounded-lg p-3 text-xs border border-yellow-200 dark:border-yellow-800/30">
                        <p className="text-yellow-700 dark:text-yellow-400 font-medium">⚠ Atención</p>
                        <p className="text-yellow-600 dark:text-yellow-500 mt-1">Una vez cerrado, el período no podrá modificarse. Los ajustes requerirán reapertura con autorización.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {allDone && (
        <div className="bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-800/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-green-700 dark:text-green-400 font-medium">Cierre completado</h3>
              <p className="text-green-600 dark:text-green-500 text-sm mt-1">
                Período Mayo 2026 cerrado exitosamente. Se generaron los asientos de cierre y el balance de comprobación.
              </p>
              <div className="flex gap-2 mt-3">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium no-tap-highlight">
                  <Download className="h-3.5 w-3.5" /> Balance
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium no-tap-highlight">
                  <FileText className="h-3.5 w-3.5" /> Libro Diario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
