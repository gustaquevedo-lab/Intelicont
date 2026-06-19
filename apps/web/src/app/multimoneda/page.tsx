"use client";

import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowRightLeft,
  Plus, Search, Calendar, Eye, Globe, ArrowUp, ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TasaCambio {
  moneda: string;
  simbolo: string;
  compra: number;
  venta: number;
  fecha: string;
  variacion: number;
}

interface TransaccionME {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  moneda: string;
  montoME: number;
  tasa: number;
  montoPYG: number;
  partner: string;
}

const TASAS: TasaCambio[] = [
  { moneda: "USD", simbolo: "US$", compra: 7350, venta: 7450, fecha: "2026-05-12", variacion: -25 },
  { moneda: "EUR", simbolo: "€", compra: 7900, venta: 8050, fecha: "2026-05-12", variacion: 50 },
  { moneda: "BRL", simbolo: "R$", compra: 1280, venta: 1350, fecha: "2026-05-12", variacion: -10 },
  { moneda: "ARS", simbolo: "AR$", compra: 6.5, venta: 7.2, fecha: "2026-05-12", variacion: 0.3 },
];

const TRANSACCIONES: TransaccionME[] = [
  { id: "t1", fecha: "2026-05-01", tipo: "Compra", descripcion: "Importación mercadería", moneda: "USD", montoME: 15000, tasa: 7400, montoPYG: 111000000, partner: "Global Trade Inc." },
  { id: "t2", fecha: "2026-05-05", tipo: "Venta", descripcion: "Exportación servicios", moneda: "USD", montoME: 8500, tasa: 7380, montoPYG: 62730000, partner: "Tech Solutions LLC" },
  { id: "t3", fecha: "2026-05-08", tipo: "Compra", descripcion: "Equipos médicos", moneda: "EUR", montoME: 12000, tasa: 7950, montoPYG: 95400000, partner: "MedEquip GmbH" },
  { id: "t4", fecha: "2026-05-10", tipo: "Pago", descripcion: "Anticipo proveedor", moneda: "USD", montoME: 5000, tasa: 7420, montoPYG: 37100000, partner: "Supply Chain Co." },
  { id: "t5", fecha: "2026-04-30", tipo: "Cobro", descripcion: "Factura exportación", moneda: "USD", montoME: 22000, tasa: 7450, montoPYG: 163900000, partner: "Intl Services Ltd." },
];

export default function MultimonedaPage() {
  const [tab, setTab] = useState<"tasas" | "transacciones">("transacciones");

  const saldos = useMemo(() => {
    const saldo: Record<string, { compras: number; ventas: number; neto: number }> = {};
    for (const t of TRANSACCIONES) {
      if (!saldo[t.moneda]) saldo[t.moneda] = { compras: 0, ventas: 0, neto: 0 };
      if (t.tipo === "Compra" || t.tipo === "Pago") saldo[t.moneda].compras += t.montoME;
      else saldo[t.moneda].ventas += t.montoME;
    }
    for (const m of Object.keys(saldo)) {
      saldo[m].neto = saldo[m].ventas - saldo[m].compras;
    }
    return saldo;
  }, []);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Multimoneda</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Tasas de cambio, transacciones en ME y diferencia de cambio</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("transacciones")} className={cn("px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight", tab === "transacciones" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500")}>
          Transacciones
        </button>
        <button onClick={() => setTab("tasas")} className={cn("px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight", tab === "tasas" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500")}>
          Tasas de Cambio
        </button>
      </div>

      {tab === "tasas" && (
        <>
          {/* Live rates */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {TASAS.map((t) => (
              <div key={t.moneda} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{t.simbolo}</span>
                  <span className="text-[10px] text-gray-400">{t.moneda}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-400">Compra</span><span className="font-mono text-gray-700 dark:text-gray-300">Gs. {t.compra.toLocaleString("es-PY")}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Venta</span><span className="font-mono text-gray-700 dark:text-gray-300">Gs. {t.venta.toLocaleString("es-PY")}</span></div>
                </div>
                <div className={cn("flex items-center gap-1 mt-2 text-[10px]", t.variacion < 0 ? "text-red-500" : "text-green-500")}>
                  {t.variacion < 0 ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                  Gs. {Math.abs(t.variacion)} hoy
                </div>
              </div>
            ))}
          </div>

          {/* Calculadora rápida */}
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-blue-500" /> Conversor Rápido
            </h3>
            <SimpleConverter />
          </div>
        </>
      )}

      {tab === "transacciones" && (
        <>
          {/* Saldos */}
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(saldos).map(([moneda, s]) => (
              <div key={moneda} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
                <span className="text-[10px] text-gray-400 uppercase">{moneda}</span>
                <p className={cn("text-lg font-bold font-mono", s.neto >= 0 ? "text-green-600" : "text-red-600")}>
                  {TASAS.find(t => t.moneda === moneda)?.simbolo || moneda} {s.neto.toLocaleString("es-PY")}
                </p>
                <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                  <span>Compras: {s.compras.toLocaleString()}</span>
                  <span>Ventas: {s.ventas.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Diferencia de cambio sugerida */}
          <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Diferencia de Cambio Sugerida</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500">USD: Variación -Gs. 25/USD. Ajuste sugerido: Gs. 125,000 (pérdida)</p>
              </div>
            </div>
          </div>

          {/* Transactions table */}
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Fecha</th>
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Tipo</th>
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Descripción</th>
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Partner</th>
                    <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Monto ME</th>
                    <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Tasa</th>
                    <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Monto PYG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {TRANSACCIONES.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{t.fecha}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                          t.tipo === "Compra" || t.tipo === "Pago" ? "bg-red-50 dark:bg-red-500/10 text-red-600" : "bg-green-50 dark:bg-green-500/10 text-green-600"
                        )}>{t.tipo}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">{t.descripcion}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{t.partner}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">{t.moneda} {t.montoME.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">Gs. {t.tasa.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-900 dark:text-white">Gs. {t.montoPYG.toLocaleString("es-PY")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SimpleConverter() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("PYG");

  const tasa = TASAS.find(t => t.moneda === from);
  const result = tasa ? parseFloat(amount || "0") * tasa.venta : 0;

  return (
    <div className="flex items-center gap-2">
      <input value={amount} onChange={e => setAmount(e.target.value)} type="number"
        className="w-24 px-2 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white no-tap-highlight" />
      <select value={from} onChange={e => setFrom(e.target.value)}
        className="px-2 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white no-tap-highlight">
        {TASAS.map(t => <option key={t.moneda} value={t.moneda}>{t.moneda}</option>)}
      </select>
      <ArrowRightLeft className="h-4 w-4 text-gray-400 shrink-0" />
      <span className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">PYG</span>
      <span className="font-mono text-sm font-bold text-gray-900 dark:text-white">Gs. {result.toLocaleString("es-PY")}</span>
    </div>
  );
}
