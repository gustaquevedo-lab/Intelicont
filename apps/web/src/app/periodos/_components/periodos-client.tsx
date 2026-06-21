"use client";

import { useState, useTransition } from "react";
import {
  Lock, Unlock, Plus, ChevronDown, AlertCircle,
  CheckCircle2, Loader2, Calendar, FileText,
  AlertTriangle, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadPeriodos, openPeriod, closePeriod, reopenPeriod, type PeriodoRow } from "../actions";
import { useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  open:     { label: "Abierto",     cls: "badge-green",  icon: Unlock      },
  closing:  { label: "En cierre",   cls: "badge-yellow", icon: Loader2     },
  closed:   { label: "Cerrado",     cls: "badge-gray",   icon: Lock        },
  reopened: { label: "Reabierto",   cls: "badge-yellow", icon: Unlock      },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  entities: Array<{ id: string; legalName: string; ruc: string }>;
  defaultEntityId?: string;
  dbError?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PeriodosClient({ entities, defaultEntityId, dbError }: Props) {
  const now = new Date();
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);
  const activeEntityId = selectedEntity?.id || defaultEntityId || "";
  const entity = selectedEntity || entities.find((e) => e.id === activeEntityId);

  const [periodos,      setPeriodos]      = useState<PeriodoRow[] | null>(null);
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const [actionMsg,     setActionMsg]     = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending,     startLoad]        = useTransition();
  const [isActing,      startAction]      = useTransition();

  // New period form
  const [showNewForm,   setShowNewForm]   = useState(false);
  const [newYear,       setNewYear]       = useState(now.getFullYear());
  const [newMonth,      setNewMonth]      = useState(now.getMonth() + 1);

  // Close modal
  const [closeTarget,   setCloseTarget]   = useState<PeriodoRow | null>(null);
  const [genCierre,     setGenCierre]     = useState(true);

  // ─── Auto load periods when activeEntityId changes ──────────────────────
  useEffect(() => {
    if (activeEntityId) {
      setLoadError(null);
      setPeriodos(null);
      startLoad(async () => {
        const r = await loadPeriodos(activeEntityId);
        if (r.ok) setPeriodos(r.data);
        else setLoadError(r.error);
      });
    } else {
      setPeriodos([]);
    }
  }, [activeEntityId]);

  function handleLoad() {
    if (!activeEntityId) return;
    setLoadError(null);
    setPeriodos(null);
    startLoad(async () => {
      const r = await loadPeriodos(activeEntityId);
      if (r.ok) setPeriodos(r.data);
      else setLoadError(r.error);
    });
  }

  function handleOpenPeriod() {
    if (!activeEntityId) return;
    startAction(async () => {
      const r = await openPeriod(activeEntityId, newYear, newMonth);
      if (r.ok) {
        setActionMsg({ type: "success", text: `Período ${MONTHS[newMonth - 1]} ${newYear} abierto` });
        setShowNewForm(false);
        handleLoad();
      } else {
        setActionMsg({ type: "error", text: r.error });
      }
    });
  }

  function handleClose(p: PeriodoRow) {
    setCloseTarget(p);
    setGenCierre(true);
    setActionMsg(null);
  }

  function confirmClose() {
    if (!closeTarget) return;
    startAction(async () => {
      const r = await closePeriod(closeTarget.entityId, closeTarget.year, closeTarget.month, genCierre);
      setCloseTarget(null);
      if (r.ok) {
        const msg = r.data.closingNumber
          ? `Período cerrado. Asiento de cierre ${r.data.closingNumber} generado. Resultado neto: ₲ ${Math.round(Math.abs(r.data.resultadoNeto)).toLocaleString("es-PY")}`
          : `Período cerrado correctamente.`;
        setActionMsg({ type: "success", text: msg });
        handleLoad();
      } else {
        setActionMsg({ type: "error", text: r.error });
      }
    });
  }

  function handleReopen(p: PeriodoRow) {
    if (!confirm(`¿Reabrís el período ${p.monthName} ${p.year}? Los asientos podrán modificarse.`)) return;
    startAction(async () => {
      const r = await reopenPeriod(p.id);
      if (r.ok) {
        setActionMsg({ type: "success", text: `Período ${p.monthName} ${p.year} reabierto` });
        handleLoad();
      } else {
        setActionMsg({ type: "error", text: r.error });
      }
    });
  }

  return (
    <div className="page-container max-w-4xl">

      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{dbError}</div>
      )}

      {/* Header */}
      <div>
        <h1 className="section-title text-2xl lg:text-3xl flex items-center gap-3">
          <Calendar className="h-7 w-7" /> Períodos Fiscales
        </h1>
        <p className="section-subtitle">Apertura y cierre de períodos contables — bloquea asientos retroactivos</p>
      </div>

      {/* Info */}
      <div className="card p-4 flex items-start gap-3 text-sm">
        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-blue-700 dark:text-blue-300">
          Los períodos <strong>cerrados</strong> bloquean la creación de asientos con fecha en ese mes.
          El cierre puede generar un <strong>asiento de cierre automático</strong> que salda las cuentas de resultado contra patrimonio.
        </p>
      </div>

      {/* Selector + load */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Empresa</label>
            <div className="input-field bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 flex items-center justify-between min-h-[42px] px-3 border border-gray-200 dark:border-slate-700 rounded-lg">
              <span className="font-medium">{entity?.legalName || "No seleccionada"}</span>
              <span className="text-xs text-gray-400 font-mono">{entity?.ruc || ""}</span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <button onClick={handleLoad} disabled={!activeEntityId || isPending}
              className="btn-secondary flex items-center gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
              {isPending ? "Actualizando…" : "Actualizar"}
            </button>
            {periodos !== null && (
              <button onClick={() => setShowNewForm((v) => !v)}
                className="btn-ghost flex items-center gap-2" disabled={!activeEntityId}>
                <Plus className="h-4 w-4" /> Nuevo período
              </button>
            )}
          </div>
        </div>

        {/* New period form */}
        {showNewForm && (
          <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Abrir nuevo período</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Mes</label>
                <select value={newMonth} onChange={(e) => setNewMonth(Number(e.target.value))} className="input-field">
                  {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Año</label>
                <input type="number" value={newYear} min={2020} max={2100}
                  onChange={(e) => setNewYear(Number(e.target.value))} className="input-field" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleOpenPeriod} disabled={isActing}
                className="btn-secondary flex items-center gap-2 text-sm">
                {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Abrir {MONTHS[newMonth - 1]} {newYear}
              </button>
              <button onClick={() => setShowNewForm(false)} className="btn-ghost text-sm">Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      {actionMsg && (
        <div className={cn(
          "flex items-start gap-2 p-4 rounded-xl border text-sm",
          actionMsg.type === "success"
            ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
            : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
        )}>
          {actionMsg.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            : <AlertCircle  className="h-4 w-4 shrink-0 mt-0.5" />}
          {actionMsg.text}
        </div>
      )}

      {/* Error */}
      {loadError && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {loadError}
        </div>
      )}

      {/* Periods table */}
      {periodos !== null && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                Períodos registrados ({periodos.length})
              </h2>
            </div>
          </div>

          {periodos.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No hay períodos registrados. Abrí el primero con el botón "Nuevo período".</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-slate-800">
              {periodos.map((p) => {
                const meta    = STATUS_META[p.status] ?? STATUS_META.open;
                const Icon    = meta.icon;
                const isClosed = p.status === "closed";
                return (
                  <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                        isClosed ? "bg-gray-100 dark:bg-slate-700" : "bg-primary-50 dark:bg-primary/10"
                      )}>
                        <Icon className={cn("h-5 w-5", isClosed ? "text-gray-400" : "text-primary")} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {p.monthName} {p.year}
                          </span>
                          <span className={cn("inline-flex text-xs font-semibold px-2 py-0.5 rounded-full", meta.cls)}>
                            {meta.label}
                          </span>
                          {p.draftCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" /> {p.draftCount} borradores sin postear
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          {p.postedCount} asientos posteados
                          {p.closedAt && (
                            <span className="text-gray-400">
                              · Cerrado {new Date(p.closedAt).toLocaleDateString("es-PY")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isClosed && (
                        <button
                          onClick={() => handleClose(p)}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-50"
                        >
                          <Lock className="h-3.5 w-3.5" /> Cerrar período
                        </button>
                      )}
                      {isClosed && (
                        <button
                          onClick={() => handleReopen(p)}
                          disabled={isActing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          <Unlock className="h-3.5 w-3.5" /> Reabrir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Close modal */}
      {closeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Cerrar período</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {closeTarget.monthName} {closeTarget.year}
                </p>
              </div>
            </div>

            {closeTarget.draftCount > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>
                  Hay <strong>{closeTarget.draftCount} asientos en borrador</strong> en este período.
                  Al cerrar quedarán bloqueados — posteálos antes o aceptá cerrar igual.
                </p>
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={genCierre}
                onChange={(e) => setGenCierre(e.target.checked)}
                className="mt-0.5 rounded"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Generar asiento de cierre automático</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Salda cuentas de ingresos y egresos contra la cuenta de Resultado del Ejercicio.
                  Recomendado para cierres anuales.
                </p>
              </div>
            </label>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Una vez cerrado, no se pueden crear ni modificar asientos con fecha en {closeTarget.monthName} {closeTarget.year}.
              Podés reabrir el período si es necesario (con auditoría).
            </p>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setCloseTarget(null)} className="flex-1 btn-ghost text-sm">
                Cancelar
              </button>
              <button
                onClick={confirmClose}
                disabled={isActing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
              >
                {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                Cerrar período
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
