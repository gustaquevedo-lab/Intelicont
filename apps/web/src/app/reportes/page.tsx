"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  Receipt,
  Building2,
  Calendar,
  Filter,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ReportType = "resumen_fiscal" | "iva" | "ire" | "balance" | "ganancias_perdidas" | "hechauka";

const MOCK_REPORTES = [
  { periodo: "Enero 2026", mes: "Enero 2026", ventas: 52000000, compras: 28000000, ivaPagar: 2400000, ivaFavor: 0, ire: 0, totalImpuestos: 2400000, hechaukaCompras: 42, hechaukaVentas: 35 },
  { periodo: "Febrero 2026", mes: "Febrero 2026", ventas: 48000000, compras: 32000000, ivaPagar: 1600000, ivaFavor: 0, ire: 0, totalImpuestos: 1600000, hechaukaCompras: 38, hechaukaVentas: 31 },
  { periodo: "Marzo 2026", mes: "Marzo 2026", ventas: 61000000, compras: 35000000, ivaPagar: 2600000, ivaFavor: 0, ire: 0, totalImpuestos: 2600000, hechaukaCompras: 45, hechaukaVentas: 40 },
  { periodo: "Abril 2026", mes: "Abril 2026", ventas: 55000000, compras: 30000000, ivaPagar: 2500000, ivaFavor: 0, ire: 0, totalImpuestos: 2500000, hechaukaCompras: 40, hechaukaVentas: 33 },
  { periodo: "Mayo 2026", mes: "Mayo 2026", ventas: 31050000, compras: 32125000, ivaPagar: 0, ivaFavor: 107000, ire: 0, totalImpuestos: 0, hechaukaCompras: 28, hechaukaVentas: 22 },
];

export default function ReportesPage() {
  const storeReportes = MOCK_REPORTES;
  const [activeReport, setActiveReport] = useState<ReportType>("resumen_fiscal");
  const [periodoDesde, setPeriodoDesde] = useState("2026-01");
  const [periodoHasta, setPeriodoHasta] = useState("2026-05");

  const reports = [
    { id: "resumen_fiscal" as ReportType, label: "Resumen Fiscal", icon: BarChart3 },
    { id: "iva" as ReportType, label: "IVA", icon: Receipt },
    { id: "ire" as ReportType, label: "IRE", icon: Building2 },
    { id: "balance" as ReportType, label: "Balance", icon: TrendingUp },
    { id: "ganancias_perdidas" as ReportType, label: "Ganancias y Pérdidas", icon: TrendingDown },
    { id: "hechauka" as ReportType, label: "Hechauka", icon: FileText },
  ];

  const totales = storeReportes.reduce(
    (acc, r) => ({
      ventas: acc.ventas + r.ventas,
      compras: acc.compras + r.compras,
      ivaPagar: acc.ivaPagar + r.ivaPagar,
      ire: acc.ire + r.ire,
      totalImpuestos: acc.totalImpuestos + r.totalImpuestos,
    }),
    { ventas: 0, compras: 0, ivaPagar: 0, ire: 0, totalImpuestos: 0 }
  );

  const gananciaNeta = totales.ventas - totales.compras - totales.totalImpuestos;
  const margenBruto = totales.ventas > 0 ? ((totales.ventas - totales.compras) / totales.ventas * 100) : 0;

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Reportes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Informes fiscales, balances y exportaciones para DNIT
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs sm:text-sm transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs sm:text-sm transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-1.5 flex overflow-x-auto gap-1 scrollbar-thin">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all shrink-0 whitespace-nowrap no-tap-highlight",
                activeReport === report.id
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {report.label}
            </button>
          );
        })}
      </div>

      {/* Period selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">Período:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={periodoDesde}
            onChange={(e) => setPeriodoDesde(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
          />
          <span className="text-gray-400">—</span>
          <input
            type="month"
            value={periodoHasta}
            onChange={(e) => setPeriodoHasta(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard label="Total Ventas" value={totales.ventas} icon={TrendingUp} color="green" />
        <KpiCard label="Total Compras" value={totales.compras} icon={TrendingDown} color="red" />
        <KpiCard label="IVA a Pagar" value={totales.ivaPagar} icon={Receipt} color="blue" />
        <KpiCard label="IRE" value={totales.ire} icon={Building2} color="purple" />
        <KpiCard label="Total Impuestos" value={totales.totalImpuestos} icon={FileText} color="amber" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly breakdown */}
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-gray-900 dark:text-white text-sm sm:text-base font-medium">Desglose Mensual</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                  <th className="text-left py-2.5 px-3 sm:px-4 text-gray-500 font-medium">Período</th>
                  <th className="text-right py-2.5 px-3 sm:px-4 text-gray-500 font-medium">Ventas</th>
                  <th className="text-right py-2.5 px-3 sm:px-4 text-gray-500 font-medium hidden sm:table-cell">Compras</th>
                  <th className="text-right py-2.5 px-3 sm:px-4 text-gray-500 font-medium">IVA</th>
                  <th className="text-right py-2.5 px-3 sm:px-4 text-gray-500 font-medium">Total Imp.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {storeReportes.map((r) => (
                  <tr key={r.periodo} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="py-2.5 px-3 sm:px-4 text-gray-900 dark:text-white font-medium">{r.periodo}</td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-gray-600 dark:text-gray-300">₲ {(r.ventas / 1000000).toFixed(0)}M</td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-gray-600 dark:text-gray-300 hidden sm:table-cell">₲ {(r.compras / 1000000).toFixed(0)}M</td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-gray-600 dark:text-gray-300">₲ {(r.ivaPagar / 1000).toFixed(0)}K</td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono tabular-nums text-gray-900 dark:text-white font-medium">₲ {(r.totalImpuestos / 1000).toFixed(0)}K</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fiscal health */}
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
          <h3 className="text-gray-900 dark:text-white text-sm sm:text-base font-medium">Salud Fiscal</h3>

          {/* Visual bars */}
          <div className="space-y-3">
            <BarChart label="Carga impositiva s/ventas" value={(totales.totalImpuestos / totales.ventas * 100).toFixed(1)} pct={totales.totalImpuestos / totales.ventas * 100} color="blue" />
            <BarChart label="Margen bruto" value={margenBruto.toFixed(1)} pct={margenBruto} color="green" />
            <BarChart label="IVA vs Ventas" value={(totales.ivaPagar / totales.ventas * 100).toFixed(1)} pct={totales.ivaPagar / totales.ventas * 100} color="purple" />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Ganancia Neta Est.</p>
                <p className={cn("text-lg font-bold font-mono tabular-nums", gananciaNeta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                  ₲ {Math.abs(gananciaNeta).toLocaleString("es-PY")}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Margen Neto</p>
                <p className={cn("text-lg font-bold font-mono tabular-nums", gananciaNeta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                  {totales.ventas > 0 ? (gananciaNeta / totales.ventas * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>

          {/* Export options */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <h4 className="text-gray-900 dark:text-white text-sm font-medium mb-3">Exportar</h4>
            <div className="grid grid-cols-2 gap-2">
              <ExportBtn label="PDF" desc="Informe completo" />
              <ExportBtn label="Excel" desc="Datos en tabla" />
              <ExportBtn label="CSV" desc="Datos crudos" />
              <ExportBtn label="XML" desc="Formato DNIT" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  const colors: Record<string, string> = {
    green: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
    red: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wide">{label}</span>
        <div className={cn("h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center", colors[color])}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </div>
      <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white font-mono tabular-nums truncate">
        ₲ {value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toLocaleString("es-PY")}
      </p>
    </div>
  );
}

function BarChart({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-600 dark:text-gray-400 text-xs">{label}</span>
        <span className="text-gray-900 dark:text-white text-xs font-mono font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colors[color])}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ExportBtn({ label, desc }: { label: string; desc: string }) {
  return (
    <button className="flex flex-col items-start p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors no-tap-highlight">
      <span className="text-gray-900 dark:text-white text-xs sm:text-sm font-medium">{label}</span>
      <span className="text-gray-400 text-[10px] sm:text-xs">{desc}</span>
    </button>
  );
}
