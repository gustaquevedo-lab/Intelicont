"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { Shield, ChevronDown, ChevronUp, Building2, Loader2 } from "lucide-react";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";
import { actionLabel, formatDateTime, targetLabel, TARGET_LABELS } from "@/lib/audit-labels";

const selectCls = "px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300";
/** Calendar day (Asunción) of an event timestamp, for the from/to filters. */
const dayOf = (d: Date | string | null) => (d ? new Date(d).toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }) : "");

export default function AuditoriaPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  // Actions are filtered client-side over the loaded page so the select can list every distinct action returned.
  const { data, isLoading, error } = api.audit.list.useQuery({ entityId: entity?.id ?? "", limit: 500 }, { enabled: !!entity });
  const all = data?.events ?? [];
  const actions = useMemo(() => [...new Set(all.map((e) => e.action))].sort(), [all]);
  const types = useMemo(() => [...new Set([...Object.keys(TARGET_LABELS), ...all.map((e) => e.targetType)])].sort(), [all]);
  const events = all.filter((e) => {
    const day = dayOf(e.createdAt);
    return (!action || e.action === action) && (!targetType || e.targetType === targetType) && (!from || day >= from) && (!to || day <= to);
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Auditoría</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{entity ? `Quién hizo qué y cuándo en ${entity.tradeName || entity.legalName}` : "Seleccioná una empresa"}</p>
      </div>

      {!entity ? (
        <div className="p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Seleccioná una empresa para ver su auditoría</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-2">
            <select aria-label="Filtrar por acción" value={action} onChange={(e) => setAction(e.target.value)} className={selectCls}>
              <option value="">Todas las acciones</option>
              {actions.map((a) => <option key={a} value={a}>{actionLabel(a)}</option>)}
            </select>
            <select aria-label="Filtrar por tipo" value={targetType} onChange={(e) => setTargetType(e.target.value)} className={selectCls}>
              <option value="">Todos los tipos</option>
              {types.map((t) => <option key={t} value={t}>{targetLabel(t)}</option>)}
            </select>
            <input type="date" aria-label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} className={selectCls} />
            <input type="date" aria-label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} className={selectCls} />
          </div>

          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>
          ) : error ? (
            <p role="alert" className="p-6 text-sm text-red-500">{error.message}</p>
          ) : events.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No hay eventos de auditoría</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Eventos de auditoría">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <th className="p-3 font-medium">Fecha</th>
                    <th className="p-3 font-medium">Usuario</th>
                    <th className="p-3 font-medium">Acción</th>
                    <th className="p-3 font-medium hidden md:table-cell">Objeto</th>
                    <th className="p-3 font-medium hidden md:table-cell">Motivo</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {events.map((ev) => (
                    <Fragment key={ev.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{formatDateTime(ev.createdAt)}</td>
                        <td className="p-3 text-gray-900 dark:text-white">{ev.actor?.name ?? "Sistema"}</td>
                        <td className="p-3 text-gray-900 dark:text-white">{actionLabel(ev.action)}</td>
                        <td className="p-3 hidden md:table-cell text-gray-500">
                          {ev.targetType === "journal_entry" && ev.targetId ? (
                            <Link href={`/asientos/${ev.targetId}`} className="text-blue-600 dark:text-blue-400 hover:underline">{targetLabel(ev.targetType)}</Link>
                          ) : targetLabel(ev.targetType)}
                        </td>
                        <td className="p-3 hidden md:table-cell text-gray-500">{ev.reason}</td>
                        <td className="p-3 text-right">
                          <button
                            aria-label={`${open === ev.id ? "Ocultar" : "Ver"} detalle de ${actionLabel(ev.action)}`}
                            aria-expanded={open === ev.id}
                            onClick={() => setOpen(open === ev.id ? null : ev.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            {open === ev.id ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                          </button>
                        </td>
                      </tr>
                      {open === ev.id && (
                        <tr>
                          <td colSpan={6} className="p-3 bg-gray-50 dark:bg-gray-900">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {(["before", "after"] as const).map((k) => (
                                <div key={k}>
                                  <p className="font-medium text-gray-500 mb-1">{k === "before" ? "Antes" : "Después"}</p>
                                  <pre aria-label={k === "before" ? "Antes" : "Después"} className="p-2 rounded bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 overflow-x-auto text-gray-700 dark:text-gray-300">{ev[k] == null ? "—" : JSON.stringify(ev[k], null, 2)}</pre>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
