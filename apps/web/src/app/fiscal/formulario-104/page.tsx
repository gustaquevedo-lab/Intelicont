"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calculator, Download, FileText, TrendingUp, TrendingDown,
  ArrowRight, Calendar, Building2, FileCode, Printer,
  AlertCircle, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadHechauka } from "@/lib/hechauka";

const MOCK_DATA = {
  entity: {
    ruc: "80012345-1",
    name: "Importadora del Este S.A.",
    period: "Mayo 2026",
    month: 5,
    year: 2026,
  },
  sales: {
    gravado10: 5500000,
    gravado5: 0,
    exento: 0,
    totalGravado: 5500000,
    ivaDebito10: 550000,
    ivaDebito5: 0,
    totalIvaDebito: 550000,
  },
  purchases: {
    gravado10: 13500000,
    gravado5: -500000,
    exento: 0,
    totalGravado: 13000000,
    ivaCredito10: 1350000,
    ivaCredito5: -25000,
    totalIvaCredito: 1325000,
  },
  retentions: {
    ivaRecibidas: 12500,
    ivaEfectuadas: 0,
    ireEfectuadas: 0,
  },
  saldoAnterior: 0,
};

export default function Formulario104Page() {
  const data = MOCK_DATA;
  const ivaAPagar = data.sales.totalIvaDebito - data.purchases.totalIvaCredito + data.saldoAnterior;
  const saldoFavor = ivaAPagar < 0 ? Math.abs(ivaAPagar) : 0;
  const montoAPagar = Math.max(0, ivaAPagar);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
            Formulario 104 — DJ IVA
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Declaración Jurada del IVA — {data.entity.period}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors no-tap-highlight">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors no-tap-highlight">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Entity Info */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Datos del Contribuyente</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">RUC</span>
            <p className="font-mono text-gray-900 dark:text-white">{data.entity.ruc}</p>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Razón Social</span>
            <p className="text-gray-900 dark:text-white">{data.entity.name}</p>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Período</span>
            <p className="font-mono text-gray-900 dark:text-white">{data.entity.period}</p>
          </div>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales */}
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">Ventas — IVA Débito</h2>
          </div>
          <div className="p-3 sm:p-4 space-y-2">
            <LineItem label="Gravado 10%" value={data.sales.gravado10} />
            <LineItem label="Gravado 5%" value={data.sales.gravado5} />
            <LineItem label="Exento" value={data.sales.exento} />
            <hr className="border-gray-100 dark:border-gray-800" />
            <LineItem label="Total Gravado" value={data.sales.totalGravado} bold />
            <hr className="border-gray-100 dark:border-gray-800" />
            <LineItem label="IVA Débito 10%" value={data.sales.ivaDebito10} sub />
            <LineItem label="IVA Débito 5%" value={data.sales.ivaDebito5} sub />
            <LineItem label="Total IVA Débito" value={data.sales.totalIvaDebito} sub bold color="text-green-600 dark:text-green-400" />
          </div>
        </div>

        {/* Purchases */}
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">Compras — IVA Crédito</h2>
          </div>
          <div className="p-3 sm:p-4 space-y-2">
            <LineItem label="Gravado 10%" value={data.purchases.gravado10} />
            <LineItem label="Gravado 5%" value={data.purchases.gravado5} />
            <LineItem label="Exento" value={data.purchases.exento} />
            <hr className="border-gray-100 dark:border-gray-800" />
            <LineItem label="Total Gravado" value={data.purchases.totalGravado} bold />
            <hr className="border-gray-100 dark:border-gray-800" />
            <LineItem label="IVA Crédito 10%" value={data.purchases.ivaCredito10} sub />
            <LineItem label="IVA Crédito 5%" value={data.purchases.ivaCredito5} sub />
            <LineItem label="Total IVA Crédito" value={data.purchases.totalIvaCredito} sub bold color="text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Retentions */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRight className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Retenciones</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <LineItem label="IVA Recibidas" value={data.retentions.ivaRecibidas} sub />
          <LineItem label="IVA Efectuadas" value={data.retentions.ivaEfectuadas} sub />
          <LineItem label="IRE Efectuadas" value={data.retentions.ireEfectuadas} sub />
        </div>
      </div>

      {/* Result */}
      <div className={cn(
        "rounded-xl p-4 sm:p-6 border-2",
        ivaAPagar > 0
          ? "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-800/30"
          : "bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-800/30"
      )}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calculator className={cn("h-5 w-5", ivaAPagar > 0 ? "text-red-500" : "text-green-500")} />
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">Resultado del Período</h2>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">IVA Débito</span>
                <span className="font-mono text-gray-900 dark:text-white">Gs. {data.sales.totalIvaDebito.toLocaleString("es-PY")}</span>
                <span className="text-gray-400">−</span>
                <span className="text-gray-500 dark:text-gray-400">IVA Crédito</span>
                <span className="font-mono text-gray-900 dark:text-white">Gs. {data.purchases.totalIvaCredito.toLocaleString("es-PY")}</span>
              </div>
              {data.saldoAnterior > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">+ Saldo Anterior</span>
                  <span className="font-mono text-gray-900 dark:text-white">Gs. {data.saldoAnterior.toLocaleString("es-PY")}</span>
                </div>
              )}
              {saldoFavor > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Saldo a favor: Gs. {saldoFavor.toLocaleString("es-PY")}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {montoAPagar > 0 ? "IVA a Pagar" : "Saldo a Favor"}
            </p>
            <p className={cn(
              "text-2xl sm:text-3xl lg:text-4xl font-bold tabular-nums font-mono",
              montoAPagar > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            )}>
              Gs. {montoAPagar > 0 ? montoAPagar.toLocaleString("es-PY") : saldoFavor.toLocaleString("es-PY")}
            </p>
            {montoAPagar > 0 && (
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="text-[10px] text-red-600 dark:text-red-400">
                    Vence: {getVencimiento(2026, 5, "80012345-1")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hechauka Section */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">Libro Electrónico — Hechauka</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadHechauka("2026-05")}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-500/20 transition-colors no-tap-highlight">
              <Download className="h-3.5 w-3.5" />
              CSV Compras + Ventas
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Próximo Vencimiento</span>
            </div>
            <p className="text-gray-900 dark:text-white font-mono text-sm">25 de Junio 2026</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Formato</span>
            </div>
            <p className="text-gray-900 dark:text-white text-sm">CSV DNIT (Compras + Ventas)</p>
          </div>
        </div>
      </div>

      {/* Reference Info */}
      <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-800/30 rounded-xl p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <p>El Formulario 104 debe presentarse mensualmente según el calendario DNIT.</p>
            <p>El vencimiento depende del último dígito del RUC (sin DV): dígito 1 → día 11, dígito 2 → día 12, etc.</p>
            <p>El Hechauka (libro electrónico) debe presentarse hasta el día 25 del mes siguiente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LineItem({ label, value, bold, sub, color }: {
  label: string; value: number; bold?: boolean; sub?: boolean; color?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", sub && "pl-3 border-l-2 border-gray-100 dark:border-gray-800")}>
      <span className={cn(
        "text-gray-500 dark:text-gray-400",
        bold ? "text-xs font-medium" : "text-xs",
        sub && "text-[10px]"
      )}>
        {label}
      </span>
      <span className={cn(
        "font-mono tabular-nums",
        bold ? "text-sm font-bold text-gray-900 dark:text-white" : sub ? "text-xs" : "text-xs text-gray-700 dark:text-gray-300",
        color
      )}>
        {value < 0 ? `(Gs. ${Math.abs(value).toLocaleString("es-PY")})` : `Gs. ${value.toLocaleString("es-PY")}`}
      </span>
    </div>
  );
}

function getVencimiento(year: number, month: number, ruc: string): string {
  const lastDigit = parseInt(ruc.replace(/[^0-9]/g, "").slice(-1), 10);
  const day = 10 + lastDigit;
  const date = new Date(year, month, day);
  return date.toLocaleDateString("es-PY", { day: "numeric", month: "long", year: "numeric" });
}
