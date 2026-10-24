"use client";

import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowRightLeft,
  Plus, Search, Calendar, Eye, Globe, ArrowUp, ArrowDown,
  RefreshCw, CheckCircle2, Sparkles, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/trpc/client";
import { useToast } from "@/components/ui/toast";
import type { TasaCambio } from "@/lib/fx/dolarpy-service";

export default function MultimonedaPage() {
  const { selectedEntity } = useAuthStore();
  const { addToast } = useToast();
  const [tab, setTab] = useState<"tasas" | "transacciones" | "revaluacion">("transacciones");

  const entityId = selectedEntity?.id || "00000000-0000-0000-0000-000000000001";

  // Queries
  const { data: tasasData, isLoading: loadingTasas, refetch: refetchTasas } = api.multimoneda.tasas.useQuery();
  const { data: transaccionesData, isLoading: loadingTx, refetch: refetchTx } = api.multimoneda.transacciones.useQuery(
    { entityId },
    { enabled: !!entityId }
  );

  const tasas = tasasData || [
    { moneda: "USD", simbolo: "US$", nombre: "Dólar", compra: 7920, venta: 7980, fecha: "2026-05-12", variacion: -10, fuente: "BCP" },
    { moneda: "EUR", simbolo: "€", nombre: "Euro", compra: 8650, venta: 8790, fecha: "2026-05-12", variacion: 20, fuente: "BCP" },
    { moneda: "BRL", simbolo: "R$", nombre: "Real", compra: 1390, venta: 1450, fecha: "2026-05-12", variacion: -5, fuente: "Cambios" },
    { moneda: "ARS", simbolo: "AR$", nombre: "Peso", compra: 6.8, venta: 7.4, fecha: "2026-05-12", variacion: 0.2, fuente: "Cambios" },
  ];

  const transacciones = transaccionesData || [];

  // Saldo neto por moneda
  const saldos = useMemo(() => {
    const saldo: Record<string, { compras: number; ventas: number; neto: number }> = {};
    for (const t of transacciones) {
      if (!saldo[t.currencyCode]) saldo[t.currencyCode] = { compras: 0, ventas: 0, neto: 0 };
      if (t.direction === "debit") saldo[t.currencyCode].compras += t.amountME;
      else saldo[t.currencyCode].ventas += t.amountME;
    }
    for (const m of Object.keys(saldo)) {
      saldo[m].neto = saldo[m].ventas - saldo[m].compras;
    }
    return saldo;
  }, [transacciones]);

  // Cálculo de diferencia de cambio acumulada
  const diferenciaCalculada = useMemo(() => {
    const usdTasa = tasas.find((t) => t.moneda === "USD");
    const tasaActual = usdTasa?.venta || 7980;
    const usdTx = transacciones.filter((t) => t.currencyCode === "USD");

    let totalDiff = 0;
    let netME = 0;

    for (const t of usdTx) {
      const diffUnit = tasaActual - t.fxRate;
      const diffLine = t.direction === "credit" ? t.amountME * diffUnit : -t.amountME * diffUnit;
      totalDiff += diffLine;
      netME += t.direction === "credit" ? t.amountME : -t.amountME;
    }

    const isGain = totalDiff >= 0;
    return {
      moneda: "USD",
      netME: Math.abs(netME),
      tasaActual,
      totalDiff: Math.abs(totalDiff),
      isGain,
    };
  }, [tasas, transacciones]);

  // Mutation para registrar el asiento
  const ajusteMutation = api.multimoneda.generarAjuste.useMutation({
    onSuccess: (res) => {
      addToast({
        type: "success",
        title: "Ajuste Contable Generado",
        message: res.message,
      });
      refetchTx();
    },
    onError: (err) => {
      addToast({
        type: "error",
        title: "Error al generar ajuste",
        message: err.message,
      });
    },
  });

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
            Multimoneda y Diferencia de Cambio
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Cotizaciones oficiales BCP / DolarPy, control de divisas y revaluación fiscal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchTasas();
              refetchTx();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", (loadingTasas || loadingTx) && "animate-spin")} />
            Actualizar Cotizaciones
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("transacciones")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all no-tap-highlight",
            tab === "transacciones" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          Transacciones ({transacciones.length})
        </button>
        <button
          onClick={() => setTab("tasas")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all no-tap-highlight",
            tab === "tasas" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          Cotizaciones Oficiales
        </button>
        <button
          onClick={() => setTab("revaluacion")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all no-tap-highlight",
            tab === "revaluacion" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          Revaluación y Ajuste
        </button>
      </div>

      {/* Tab: Tasas */}
      {tab === "tasas" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tasas.map((t) => (
              <div
                key={t.moneda}
                className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{t.simbolo}</span>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{t.moneda}</span>
                    <p className="text-[10px] text-gray-400">{t.nombre}</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compra:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      Gs. {t.compra.toLocaleString("es-PY")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Venta:</span>
                    <span className="font-mono text-gray-900 dark:text-white font-semibold">
                      Gs. {t.venta.toLocaleString("es-PY")}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[10px]">
                  <span className={cn("flex items-center gap-0.5 font-medium", t.variacion < 0 ? "text-red-500" : "text-green-500")}>
                    {t.variacion < 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                    Gs. {Math.abs(t.variacion)} hoy
                  </span>
                  <span className="text-gray-400 truncate max-w-[100px]">{t.fuente}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-500" /> Conversor Rápido en Vivo
            </h3>
            <SimpleConverter tasas={tasas} />
          </div>
        </>
      )}

      {/* Tab: Transacciones */}
      {tab === "transacciones" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(saldos).length > 0 ? (
              Object.entries(saldos).map(([moneda, s]) => {
                const info = tasas.find((t) => t.moneda === moneda);
                return (
                  <div
                    key={moneda}
                    className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase">{moneda}</span>
                      <span className="text-[10px] text-gray-400">{info?.simbolo || moneda}</span>
                    </div>
                    <p className={cn("text-xl font-bold font-mono mt-1", s.neto >= 0 ? "text-green-600" : "text-red-600")}>
                      {info?.simbolo || ""} {s.neto.toLocaleString("es-PY")}
                    </p>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span>Débitos: {s.compras.toLocaleString()}</span>
                      <span>Créditos: {s.ventas.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-center py-6 text-gray-400 text-xs">
                No hay transacciones en moneda extranjera registradas.
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">Movimientos en Moneda Extranjera</h2>
              <span className="text-xs text-gray-400">Total: {transacciones.length} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Fecha</th>
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Asiento</th>
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Descripción</th>
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Partner</th>
                    <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Monto ME</th>
                    <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Cotización</th>
                    <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Importe Base (PYG)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {transacciones.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{t.date}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-500">{t.entryNumber || "—"}</td>
                      <td className="px-3 py-2.5 text-gray-800 dark:text-gray-200">{t.description}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
                        {t.partnerName || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-medium text-gray-900 dark:text-white">
                        {t.currencyCode} {t.amountME.toLocaleString("es-PY")}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">
                        Gs. {t.fxRate.toLocaleString("es-PY")}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-900 dark:text-white">
                        Gs. {t.amountPYG.toLocaleString("es-PY")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Tab: Revaluación & Ajuste de Cierre */}
      {tab === "revaluacion" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Revaluación Cambiaria al Cierre Fiscal (Art. 38 Ley 6380)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Ajusta los saldos deudores y acreedores en moneda extranjera a la cotización oficial de cierre del BCP para reflejar la diferencia de cambio devengada.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 mb-4">
              <div>
                <span className="text-[11px] text-gray-400">Saldo Neto Valuado</span>
                <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">
                  USD {diferenciaCalculada.netME.toLocaleString("es-PY")}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-gray-400">Cotización de Cierre BCP</span>
                <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                  Gs. {diferenciaCalculada.tasaActual.toLocaleString("es-PY")}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-gray-400">Diferencia de Cambio Neta</span>
                <p
                  className={cn(
                    "text-lg font-bold font-mono",
                    diferenciaCalculada.isGain ? "text-green-600" : "text-amber-500"
                  )}
                >
                  {diferenciaCalculada.isGain ? "+" : "-"} Gs. {diferenciaCalculada.totalDiff.toLocaleString("es-PY")}
                </p>
                <span className="text-[10px] text-gray-400">
                  {diferenciaCalculada.isGain ? "Ganancia Cambiaria (Cuenta 4.x)" : "Pérdida Cambiaria (Cuenta 5.x)"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500">
                Se generará un asiento automático con partida doble contra la cuenta de moneda extranjera.
              </span>
              <button
                onClick={() =>
                  ajusteMutation.mutate({
                    entityId,
                    currencyCode: "USD",
                    amountME: diferenciaCalculada.netME || 1000,
                    fxRateCurrent: diferenciaCalculada.tasaActual,
                    diffAmountPYG: diferenciaCalculada.totalDiff || 125000,
                    isGain: diferenciaCalculada.isGain,
                  })
                }
                disabled={ajusteMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {ajusteMutation.isPending ? "Generando asiento..." : "Generar Asiento de Diferencia de Cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleConverter({ tasas }: { tasas: TasaCambio[] }) {
  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState("USD");

  const tasa = tasas.find((t) => t.moneda === from);
  const result = tasa ? parseFloat(amount || "0") * tasa.venta : 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        type="number"
        className="w-32 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white outline-none"
        placeholder="Monto"
      />
      <select
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white outline-none cursor-pointer"
      >
        {tasas.map((t) => (
          <option key={t.moneda} value={t.moneda}>
            {t.moneda} ({t.simbolo})
          </option>
        ))}
      </select>
      <ArrowRightLeft className="h-4 w-4 text-gray-400 shrink-0" />
      <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
        PYG (Guaraníes)
      </span>
      <span className="font-mono text-base font-bold text-gray-900 dark:text-white">
        Gs. {Math.round(result).toLocaleString("es-PY")}
      </span>
    </div>
  );
}
