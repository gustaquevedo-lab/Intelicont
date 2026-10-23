"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";
import { todayInAsuncionISO } from "@intelicont/ledger/tax-calendar";
import { LEVEL_BADGE, OBLIGATION_HREF, OBLIGATION_NAME, dueLabel, noticeLabel } from "@/lib/fiscal-calendar";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function CalendarioPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [view, setView] = useState(() => {
    const today = todayInAsuncionISO();
    return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
  });
  const q = api.fiscal.calendarMonth.useQuery({ entityId: entity?.id ?? "", ...view }, { enabled: !!entity });
  const items = q.data?.items ?? [];

  const go = (delta: number) =>
    setView(({ year, month }) => {
      const idx = year * 12 + (month - 1) + delta;
      return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
    });

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Calendario Fiscal</h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
          Vencimientos de IVA y Registro de Comprobantes{entity && <> · {entity.tradeName || entity.legalName}</>}
        </p>
      </div>

      <div role="note" className="flex gap-2 items-start rounded-lg border border-yellow-200 dark:border-yellow-500/20 bg-yellow-50 dark:bg-yellow-500/10 p-3 text-xs sm:text-sm text-yellow-800 dark:text-yellow-300">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <p>Fechas calculadas con una regla no verificada (terminación de RUC): confirmá con el calendario oficial de la DNIT.</p>
      </div>

      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
          <button aria-label="Mes anterior" onClick={() => go(-1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors no-tap-highlight">
            <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <h2 className="text-gray-900 dark:text-white text-sm font-medium">{MESES[view.month - 1]} {view.year}</h2>
          <button aria-label="Mes siguiente" onClick={() => go(1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors no-tap-highlight">
            <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {!entity ? (
          <p className="p-4 text-xs text-gray-400">Seleccioná una empresa.</p>
        ) : q.isLoading ? (
          <p className="p-4 text-xs text-gray-400 flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando…</p>
        ) : q.error ? (
          <p className="p-4 text-xs text-red-500">No se pudo cargar el calendario.</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-xs text-gray-400">Sin vencimientos este mes (la empresa no tiene régimen IVA general o no se generaron fechas).</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {items.map((o) => (
              <li key={`${o.obligation}-${o.period}`} className="p-3 sm:p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{OBLIGATION_NAME[o.obligation] ?? o.obligation}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Período {o.period} · vence {dueLabel(o.dueDate)}</p>
                  {OBLIGATION_HREF[o.obligation] && (
                    <Link href={OBLIGATION_HREF[o.obligation]} className="inline-flex items-center gap-1 mt-1 text-[11px] text-blue-500 dark:text-blue-400 hover:underline">
                      Preparar <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
                <span className={cn("shrink-0 text-[11px] px-2 py-1 rounded font-medium", LEVEL_BADGE[o.level ?? "none"])}>
                  {noticeLabel(o.daysLeft)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
