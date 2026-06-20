"use client";

import { useState, useEffect, useTransition } from "react";
import {
  CheckCircle2, Clock, AlertCircle, Lock, Unlock,
  ChevronRight, TrendingUp, FileText, Download, Calendar,
  ChevronDown, ChevronUp, Sparkles, BarChart3, Calculator,
  RefreshCw, Landmark, AlertTriangle, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { verifyPeriodStatus, processAnnualClosing, type CierreValidations } from "./actions";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: "pending" | "in_progress" | "done" | "blocked";
  dependsOn?: string[];
  auto?: boolean;
  link?: string;
}

export default function CierreMensualPage() {
  const selectedEntity = useAuthStore((state) => state.selectedEntity);
  const [activeTab, setActiveTab] = useState<"mensual" | "anual">("mensual");
  
  // Selection
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(5); // Mayo
  
  const [isPending, startTransition] = useTransition();
  const [validations, setValidations] = useState<CierreValidations | null>(null);
  const [periodoBloqueado, setPeriodoBloqueado] = useState(false);
  const [closingLogs, setClosingLogs] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const formatGs = (val: number) => {
    return `Gs. ${Math.round(val).toLocaleString("es-PY")}`;
  };

  const loadValidations = () => {
    if (!selectedEntity?.id) return;
    startTransition(async () => {
      const res = await verifyPeriodStatus(
        selectedEntity.id,
        selectedYear,
        activeTab === "mensual" ? selectedMonth : undefined
      );
      if (res.ok) {
        setValidations(res.data);
      }
    });
  };

  useEffect(() => {
    loadValidations();
  }, [selectedEntity, selectedYear, selectedMonth, activeTab]);

  // Construct Dynamic Checklist based on real backend validations
  const checklistItems: ChecklistItem[] = activeTab === "mensual" ? [
    {
      id: "m1",
      label: "Asientos en Borrador (Draft)",
      description: validations && validations.draftEntriesCount > 0
        ? `Tenés ${validations.draftEntriesCount} asientos en estado borrador`
        : "No existen asientos en borrador pendientes",
      status: validations && validations.draftEntriesCount > 0 ? "blocked" : "done",
      link: "/asientos"
    },
    {
      id: "m2",
      label: "Asientos Desbalanceados",
      description: validations && validations.unbalancedEntriesCount > 0
        ? `Encontrado(s) ${validations.unbalancedEntriesCount} asiento(s) descuadrados`
        : "Todos los asientos están correctamente balanceados (Débito = Crédito)",
      status: validations && validations.unbalancedEntriesCount > 0 ? "blocked" : "done",
      link: "/asientos"
    },
    {
      id: "m3",
      label: "Conciliación de Movimientos Bancarios",
      description: validations && validations.unreconciledBankCount > 0
        ? `Existen ${validations.unreconciledBankCount} transacciones bancarias pendientes de conciliar`
        : "Todas las transacciones bancarias están conciliadas",
      status: validations && validations.unreconciledBankCount > 0 ? "in_progress" : "done",
      link: "/banco/conciliacion"
    },
    {
      id: "m4",
      label: "Control de Saldos Bancarios vs Contabilidad",
      description: validations && validations.bankBalances.some(b => Math.abs(b.difference) > 0.01)
        ? "Existen diferencias entre el saldo contable y el extracto"
        : "Los saldos del mayor coinciden con los extractos bancarios",
      status: validations && validations.bankBalances.some(b => Math.abs(b.difference) > 0.01) ? "in_progress" : "done",
      link: "/banco"
    },
    {
      id: "m5",
      label: "Cálculo de Costo de Ventas e Inventario",
      description: "Generar el costo promedio ponderado de stock mensual",
      status: "done",
      link: "/comprobantes"
    }
  ] : [
    {
      id: "a1",
      label: "Períodos Mensuales Cerrados",
      description: validations
        ? `${validations.monthsClosedCount} de 12 meses cerrados en el ejercicio fiscal`
        : "Verificar bloqueo de meses anteriores",
      status: validations && validations.monthsClosedCount === 12 ? "done" : "blocked",
      link: "/periodos"
    },
    {
      id: "a2",
      label: "Depreciación de Activos Fijos del Ejercicio",
      description: "Amortizaciones anuales completas de bienes de uso cargados",
      status: "done",
      link: "/activos"
    },
    {
      id: "a3",
      label: "Refundición de Cuentas de Resultado",
      description: "Cerrar cuentas de Ingresos (Clase 4) y Egresos (Clase 5) contra Patrimonio",
      status: closingLogs ? "done" : "pending",
    },
    {
      id: "a4",
      label: "Cierre Patrimonial del Ejercicio",
      description: "Saldar cuentas de Activo, Pasivo y Patrimonio al 31 de Diciembre",
      status: closingLogs ? "done" : "pending",
    }
  ];

  const doneCount = checklistItems.filter(i => i.status === "done").length;
  const totalCount = checklistItems.length;
  const pct = Math.round((doneCount / totalCount) * 100);
  const canClose = checklistItems.every(i => i.status === "done" || i.status === "in_progress");

  const handleMonthlyLock = () => {
    setPeriodoBloqueado(true);
  };

  const handleAnnualClosingProcess = () => {
    if (!selectedEntity?.id) return;
    startTransition(async () => {
      const res = await processAnnualClosing(selectedEntity.id, selectedYear);
      if (res.ok) {
        setClosingLogs(
          `✓ Asiento de Refundición generado: ${res.data.refundEntryNumber}\n✓ Asiento de Cierre Patrimonial generado: ${res.data.patrimonialEntryNumber}\n✓ Ejercicio Fiscal ${selectedYear} cerrado con éxito.`
        );
        loadValidations();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            Cierre de Períodos Contables
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Bloqueo mensual, auditoría de balance y asientos automáticos de cierre del ejercicio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadValidations}
            disabled={isPending}
            className="p-2 bg-gray-800 border border-gray-700/50 hover:bg-gray-750 text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
          </button>

          {periodoBloqueado ? (
            <span className="flex items-center gap-1.5 px-3 py-2 bg-red-950/20 border border-red-800/40 text-red-400 rounded-xl text-sm font-semibold">
              <Lock className="h-4 w-4" /> Período Cerrado
            </span>
          ) : (
            <button
              disabled={doneCount < totalCount || isPending}
              onClick={activeTab === "mensual" ? handleMonthlyLock : handleAnnualClosingProcess}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg",
                doneCount === totalCount && !isPending
                  ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700/50"
              )}
            >
              <Lock className="h-4 w-4" />
              {activeTab === "mensual" ? "Bloquear Mes" : "Procesar Cierre Anual"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-gray-900/40 border border-gray-800/80 p-1 rounded-xl w-full sm:w-80 backdrop-blur-sm">
        <button
          onClick={() => { setActiveTab("mensual"); setClosingLogs(null); }}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "mensual" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Cierre Mensual
        </button>
        <button
          onClick={() => { setActiveTab("anual"); setClosingLogs(null); }}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all",
            activeTab === "anual" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          Cierre Anual
        </button>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-900/20 border border-gray-800/60 p-4 rounded-xl">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Ejercicio Fiscal (Año)</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-2 bg-gray-850 border border-gray-750 rounded-xl text-sm text-white focus:outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
        
        {activeTab === "mensual" && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">Mes a Cerrar</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-850 border border-gray-750 rounded-xl text-sm text-white focus:outline-none animate-in fade-in"
            >
              <option value={1}>Enero</option>
              <option value={2}>Febrero</option>
              <option value={3}>Marzo</option>
              <option value={4}>Abril</option>
              <option value={5}>Mayo</option>
              <option value={6}>Junio</option>
              <option value={7}>Julio</option>
              <option value={8}>Agosto</option>
              <option value={9}>Septiembre</option>
              <option value={10}>Octubre</option>
              <option value={11}>Noviembre</option>
              <option value={12}>Diciembre</option>
            </select>
          </div>
        )}
      </div>

      {/* Progress Card */}
      <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200">Progreso de Auditoría Contable</h2>
          <span className="text-sm font-bold text-blue-400 font-mono">{pct}%</span>
        </div>
        <div className="h-3 bg-gray-850 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", pct === 100 ? "bg-green-500" : "bg-blue-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
          <span>{doneCount} de {totalCount} controles listos</span>
          <span>{pct === 100 ? "Listo para procesar cierre" : "Controles obligatorios pendientes"}</span>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-gray-900/40 border border-gray-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-200">Checklist Operativo de Contabilidad</h2>
        </div>

        <div className="divide-y divide-gray-800/60">
          {checklistItems.map((item) => {
            const isExpanded = showDetail === item.id;
            return (
              <div key={item.id} className={cn(
                "transition-colors",
                item.status === "done" && "bg-green-950/5",
                item.status === "in_progress" && "bg-blue-950/5",
                item.status === "blocked" && "bg-red-950/5"
              )}>
                <div className="flex items-start gap-4 p-4">
                  <div className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200",
                    item.status === "done" && "bg-green-500 border-green-500 text-white",
                    item.status === "in_progress" && "border-blue-500 bg-blue-950/20 text-blue-400 animate-pulse",
                    item.status === "pending" && "border-gray-700 bg-gray-900",
                    item.status === "blocked" && "border-red-500 bg-red-950/20 text-red-400"
                  )}>
                    {item.status === "done" && <CheckCircle2 className="h-4 w-4" />}
                    {item.status === "in_progress" && <Clock className="h-3.5 w-3.5" />}
                    {item.status === "blocked" && <AlertTriangle className="h-3.5 w-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "text-sm font-semibold",
                      item.status === "done" ? "text-green-400 line-through opacity-80" : "text-white"
                    )}>
                      {item.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                    {item.status === "blocked" && (
                      <p className="text-[10px] text-red-400 font-semibold mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Bloqueo: corregí los errores para cerrar
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.link && (
                      <a href={item.link} className="text-xs text-blue-400 hover:text-blue-300 font-semibold bg-blue-500/10 px-2.5 py-1 rounded-lg transition-colors">
                        Revisar →
                      </a>
                    )}
                    {(item.id === "m4" || item.id === "a3") && (
                      <button
                        onClick={() => setShowDetail(isExpanded ? null : item.id)}
                        className="p-1 hover:bg-gray-800 rounded-lg text-gray-400"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && item.id === "m4" && validations && (
                  <div className="px-4 pb-4 ml-10 space-y-3 animate-in fade-in duration-200">
                    <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-950/40">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-900 text-gray-400 uppercase tracking-wider font-bold">
                          <tr>
                            <th className="p-2.5">Banco / Cuenta</th>
                            <th className="p-2.5 text-right">Saldo Mayor</th>
                            <th className="p-2.5 text-right">Saldo Extracto</th>
                            <th className="p-2.5 text-right">Diferencia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60 font-mono">
                          {validations.bankBalances.map((bal, idx) => (
                            <tr key={idx} className="hover:bg-gray-900/20">
                              <td className="p-2.5 font-medium text-white">{bal.bankName} - Cta. {bal.accountNumber}</td>
                              <td className="p-2.5 text-right text-gray-300">{formatGs(bal.ledgerBalance)}</td>
                              <td className="p-2.5 text-right text-gray-300">{formatGs(bal.statementBalance)}</td>
                              <td className={cn(
                                "p-2.5 text-right font-bold",
                                Math.abs(bal.difference) > 0.01 ? "text-red-400" : "text-green-400"
                              )}>
                                {formatGs(bal.difference)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {isExpanded && item.id === "a3" && (
                  <div className="px-4 pb-4 ml-10 space-y-2 text-xs text-gray-400 animate-in fade-in">
                    <p>El cierre contable del ejercicio fiscal generará automáticamente dos transacciones clave:</p>
                    <ul className="list-disc pl-4 space-y-1 font-mono text-[11px]">
                      <li><span className="text-blue-400 font-bold">REF-XXXXX</span>: Refundición de las cuentas de ingresos y egresos para determinar la Utilidad/Pérdida Neta.</li>
                      <li><span className="text-blue-400 font-bold">PAT-XXXXX</span>: Asiento de cierre patrimonial a fin de saldar los saldos de balance a cero en el ejercicio corriente.</li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Output Console / Action Logs */}
      {closingLogs && (
        <div className="bg-gray-900/50 border border-green-800/40 rounded-2xl p-5 backdrop-blur-sm space-y-3 animate-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-sm font-bold text-green-400 flex items-center gap-1.5">
            <ShieldCheck className="h-5 w-5" /> Proceso de Cierre Completado
          </h3>
          <pre className="font-mono text-xs text-gray-300 bg-gray-950/60 p-4 rounded-xl border border-gray-900 overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {closingLogs}
          </pre>
        </div>
      )}
    </div>
  );
}
