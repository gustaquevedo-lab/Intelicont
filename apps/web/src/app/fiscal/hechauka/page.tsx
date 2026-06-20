"use client";

import { useState, useMemo } from "react";
import {
  Download, FileText, TrendingUp, TrendingDown, Calendar,
  Search, Filter, Printer, Info, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getHechaukaCompras, getHechaukaVentas, getHechaukaResumen,
  downloadHechauka, generateHechaukaCSV, downloadCSV,
} from "@/lib/hechauka";

export default function HechaukaPage() {
  const [tab, setTab] = useState<"compras" | "ventas" | "resumen">("compras");
  const compras = useMemo(() => getHechaukaCompras(), []);
  const ventas = useMemo(() => getHechaukaVentas(), []);
  const resumen = useMemo(() => getHechaukaResumen(), []);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
            RG 90 (ex Hechauka) — Libro Electrónico
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Libro de Compras y Ventas — RG 90/2021 — Período Mayo 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadHechauka("2026-05")}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors no-tap-highlight"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* Information Banner on Hechauka to RG 90 Transition */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-300">
            Cumplimiento DNIT: RG 90 (Registro Electrónico de Comprobantes)
          </h4>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
            De acuerdo con las resoluciones de la <strong>DNIT (ex SET)</strong>, el antiguo sistema informativo Hechauka ha sido discontinuado para las operaciones mensuales generales de compras y ventas, siendo reemplazado por el <strong>RG 90</strong> en el sistema Marangatú. InteliCont genera la información compatible con los requerimientos actuales.
          </p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[
          { key: "compras", label: "Compras", icon: TrendingDown },
          { key: "ventas", label: "Ventas", icon: TrendingUp },
          { key: "resumen", label: "Resumen", icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={cn(
                "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors no-tap-highlight",
                tab === t.key
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "compras" && (
        <TableDoc
          title="Compras"
          icon={TrendingDown}
          iconColor="text-red-500"
          items={compras}
          cols={["Fecha", "Timbrado", "RUC", "Proveedor", "Nro", "Grav. 10%", "IVA 10%", "Total"]}
          renderRow={(c: any) => [
            c.fecha, c.timbrado, `${c.rucProveedor}-${c.dvProveedor}`, c.nombreProveedor,
            c.numeroComprobante,
            `Gs. ${c.gravado10.toLocaleString("es-PY")}`,
            `Gs. ${c.iva10.toLocaleString("es-PY")}`,
            `Gs. ${c.total.toLocaleString("es-PY")}`,
          ]}
          total={resumen.comprasTotal}
        />
      )}

      {tab === "ventas" && (
        <TableDoc
          title="Ventas"
          icon={TrendingUp}
          iconColor="text-green-500"
          items={ventas}
          cols={["Fecha", "Timbrado", "RUC", "Cliente", "Nro", "Grav. 10%", "IVA 10%", "Total"]}
          renderRow={(v: any) => [
            v.fecha, v.timbrado, `${v.rucCliente}-${v.dvCliente}`, v.nombreCliente,
            v.numeroComprobante,
            `Gs. ${v.gravado10.toLocaleString("es-PY")}`,
            `Gs. ${v.iva10.toLocaleString("es-PY")}`,
            `Gs. ${v.total.toLocaleString("es-PY")}`,
          ]}
          total={resumen.ventasTotal}
        />
      )}

      {tab === "resumen" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ResumenCard
            title="Compras"
            icon={TrendingDown}
            iconColor="text-red-500"
            data={{
              "Gravado 10%": resumen.comprasGravado10,
              "Gravado 5%": resumen.comprasGravado5,
              "Exento": resumen.comprasExento,
              "IVA Crédito 10%": resumen.comprasIva10,
              "IVA Crédito 5%": resumen.comprasIva5,
              "Total": resumen.comprasTotal,
            }}
          />
          <ResumenCard
            title="Ventas"
            icon={TrendingUp}
            iconColor="text-green-500"
            data={{
              "Gravado 10%": resumen.ventasGravado10,
              "Gravado 5%": resumen.ventasGravado5,
              "Exento": resumen.ventasExento,
              "IVA Débito 10%": resumen.ventasIva10,
              "IVA Débito 5%": resumen.ventasIva5,
              "Total": resumen.ventasTotal,
            }}
          />
        </div>
      )}
    </div>
  );
}

function TableDoc({ title, icon: Icon, iconColor, items, cols, renderRow, total }: any) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconColor)} />
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h2>
        <span className="text-xs text-gray-400 ml-auto">{items.length} registros</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
              {cols.map((col: string) => (
                <th key={col} className="text-left px-3 py-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {items.map((item: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                {renderRow(item).map((cell: string, j: number) => (
                  <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap font-mono">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/80">
              <td className="px-3 py-2 font-medium text-gray-900 dark:text-white" colSpan={cols.length - 1}>
                Total
              </td>
              <td className="px-3 py-2 font-bold text-gray-900 dark:text-white font-mono">
                Gs. {total.toLocaleString("es-PY")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ResumenCard({ title, icon: Icon, iconColor, data }: {
  title: string; icon: any; iconColor: string; data: Record<string, number>;
}) {
  const entries = Object.entries(data);
  const total = entries.reduce((s, [, v]) => s + Math.abs(v), 0);
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn("h-4 w-4", iconColor)} />
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-2">
        {entries.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-xs font-mono tabular-nums text-gray-700 dark:text-gray-300">
              Gs. {value.toLocaleString("es-PY")}
            </span>
          </div>
        ))}
        <hr className="border-gray-100 dark:border-gray-800" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-900 dark:text-white">Total Absoluto</span>
          <span className="text-sm font-bold font-mono tabular-nums text-gray-900 dark:text-white">
            Gs. {total.toLocaleString("es-PY")}
          </span>
        </div>
      </div>
    </div>
  );
}
