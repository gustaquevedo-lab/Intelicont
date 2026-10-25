"use client";

import { useState } from "react";
import {
  Calculator, TrendingUp, TrendingDown, Download, Printer,
  Receipt, Building2, DollarSign, ChevronDown, FileText,
  AlertCircle, CheckCircle2, Loader2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";

type FormType = "120" | "500" | "501";

const gs = (v: number) => `₲ ${Math.round(v).toLocaleString("es-PY")}`;

export default function FormulariosPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [form, setForm] = useState<FormType>("120");

  const now = new Date();
  const [periodo, setPeriodo] = useState(() => {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const [year, month] = periodo.split("-").map(Number);
  const isEntityValid = !!entity?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entity.id);

  // IVA Form 120 queries
  const ventasQuery = api.reports.libroIva.useQuery(
    { entityId: entity?.id || "", year, month, side: "ventas" },
    { enabled: isEntityValid && !isNaN(year) && !isNaN(month) && form === "120" }
  );

  const comprasQuery = api.reports.libroIva.useQuery(
    { entityId: entity?.id || "", year, month, side: "compras" },
    { enabled: isEntityValid && !isNaN(year) && !isNaN(month) && form === "120" }
  );

  // IRE Form 500 query
  const form500Query = api.fiscal.form500.useQuery(
    { entityId: entity?.id || "", year },
    { enabled: isEntityValid && !isNaN(year) && form === "500" }
  );

  // IRE Simple Form 501 query
  const form501Query = api.fiscal.form501.useQuery(
    { entityId: entity?.id || "", year },
    { enabled: isEntityValid && !isNaN(year) && form === "501" }
  );

  const entityName = entity?.tradeName || entity?.legalName || "Empresa Seleccionada";
  const entityRuc = entity?.ruc || "Sin RUC";

  const vTotals = ventasQuery.data?.totals || { gravado10: 0, gravado5: 0, exento: 0, iva10: 0, iva5: 0, total: 0 };
  const cTotals = comprasQuery.data?.totals || { gravado10: 0, gravado5: 0, exento: 0, iva10: 0, iva5: 0, total: 0 };

  const totalDebito = vTotals.iva10 + vTotals.iva5;
  const totalCredito = cTotals.iva10 + cTotals.iva5;
  const saldoImpuesto = totalDebito - totalCredito;
  const aPagar = Math.max(0, saldoImpuesto);
  const aFavor = Math.max(0, -saldoImpuesto);

  const f500 = form500Query.data;
  const f501 = form501Query.data;

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Formularios Oficiales DNIT</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Liquidación de IVA (Form 120), IRE General (Form 500) e IRE Simple (Form 501) — {entityName} ({entityRuc})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {form === "120" ? (
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              aria-label="Período mensual"
              className="px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <select
              value={year}
              onChange={(e) => setPeriodo(`${e.target.value}-12`)}
              aria-label="Ejercicio fiscal"
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
            >
              <option value="2026">Ejercicio 2026</option>
              <option value="2025">Ejercicio 2025</option>
              <option value="2024">Ejercicio 2024</option>
            </select>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 no-tap-highlight"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Selector */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setForm("120")}
          className={cn(
            "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium no-tap-highlight transition-all",
            form === "120" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          <Receipt className="h-3.5 w-3.5 inline mr-1.5" />
          Formulario 120 — IVA General
        </button>
        <button
          onClick={() => setForm("500")}
          className={cn(
            "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium no-tap-highlight transition-all",
            form === "500" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          <Building2 className="h-3.5 w-3.5 inline mr-1.5" />
          Formulario 500 — IRE General
        </button>
        <button
          onClick={() => setForm("501")}
          className={cn(
            "px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium no-tap-highlight transition-all",
            form === "501" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          <Sparkles className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />
          Formulario 501 — IRE Simple
        </button>
      </div>

      {!entity ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-8">
          <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Seleccione una Empresa</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Elija una empresa para calcular las liquidaciones de impuestos DNIT.
          </p>
        </div>
      ) : form === "120" ? (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Formulario 120 v4 — Declaración Jurada del IVA</h2>
            <p className="text-xs text-gray-400 mt-1">{entityName} — RUC {entityRuc}</p>
            <p className="text-xs text-gray-500">Período Fiscal: {periodo}</p>
          </div>

          {ventasQuery.isLoading || comprasQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
              <p className="text-xs text-gray-400">Consultando registros del Libro IVA...</p>
            </div>
          ) : (
            <div className="p-3 sm:p-4 space-y-4">
              <SectionBox title="RUBRO 1: VENTAS / OPERACIONES (DÉBITO FISCAL)" icon={TrendingUp} color="text-green-500">
                <LineItem label="Gravadas 10% (Base imponible)" value={vTotals.gravado10} />
                <LineItem label="Gravadas 5% (Base imponible)" value={vTotals.gravado5} />
                <LineItem label="Exentas del IVA" value={vTotals.exento} />
                <hr className="border-gray-100 dark:border-gray-800" />
                <LineItem label="Débito Fiscal IVA 10%" value={vTotals.iva10} indent />
                <LineItem label="Débito Fiscal IVA 5%" value={vTotals.iva5} indent />
                <LineItem label="Total Débito Fiscal del Mes" value={totalDebito} bold />
              </SectionBox>

              <SectionBox title="RUBRO 2: COMPRAS / ADQUISICIONES (CRÉDITO FISCAL)" icon={TrendingDown} color="text-red-500">
                <LineItem label="Gravadas 10% (Base imponible)" value={cTotals.gravado10} />
                <LineItem label="Gravadas 5% (Base imponible)" value={cTotals.gravado5} />
                <LineItem label="Exentas del IVA" value={cTotals.exento} />
                <hr className="border-gray-100 dark:border-gray-800" />
                <LineItem label="Crédito Fiscal IVA 10%" value={cTotals.iva10} indent />
                <LineItem label="Crédito Fiscal IVA 5%" value={cTotals.iva5} indent />
                <LineItem label="Total Crédito Fiscal del Mes" value={totalCredito} bold />
              </SectionBox>

              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 space-y-2 border border-gray-200 dark:border-gray-700">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">RUBRO 3: DETERMINACIÓN DEL IMPUESTO</h4>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Total Débito Fiscal (Inciso a):</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-white">{gs(totalDebito)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Total Crédito Fiscal (Inciso b):</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-white">{gs(totalCredito)}</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700 my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>{aPagar > 0 ? "Saldo a Pagar a la DNIT:" : "Saldo a Favor del Contribuyente:"}</span>
                  <span className={cn("font-mono", aPagar > 0 ? "text-red-500" : "text-green-500")}>
                    {gs(aPagar > 0 ? aPagar : aFavor)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : form === "500" ? (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Formulario 500 — IRE General (Tasa 10%)</h2>
            <p className="text-xs text-gray-400 mt-1">{entityName} — RUC {entityRuc}</p>
            <p className="text-xs text-gray-500">Ejercicio Fiscal: {year}</p>
          </div>

          {form500Query.isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
              <p className="text-xs text-gray-400">Calculando Estado de Resultados y Renta Neta Imponible...</p>
            </div>
          ) : f500 ? (
            <div className="p-3 sm:p-4 space-y-4">
              <SectionBox title="RUBRO 1: INGRESOS BRUTOS DEVENGADOS" icon={TrendingUp} color="text-green-500">
                <LineItem label="Total Ingresos Brutos Operativos" value={f500.rubro1_TotalIngresos} bold />
              </SectionBox>

              <SectionBox title="RUBRO 2 Y 3: COSTOS Y GASTOS DEDUCIBLES" icon={TrendingDown} color="text-red-500">
                <LineItem label="Costo de Ventas / Servicios" value={f500.rubro2_TotalCostos} />
                <LineItem label="Renta Bruta del Ejercicio" value={f500.rubro3_RentaBruta} bold />
                <hr className="border-gray-100 dark:border-gray-800" />
                <LineItem label="Total Gastos Deducibles (Adm, Personal, Depreciaciones)" value={f500.rubro3_TotalGastos} />
                <LineItem label="Renta Neta Contable" value={f500.rubro4_RentaNetaContable} bold />
              </SectionBox>

              <SectionBox title="RUBRO 4: CONCILIACIÓN TRIBUTARIA Y RENTA NETA IMPONIBLE" icon={Calculator} color="text-purple-500">
                <LineItem label="Gastos No Deducibles (+)" value={f500.rubro4_AjustesFiscalesPositivos} />
                <LineItem label="Rentas Exentas / No Gravadas (-)" value={f500.rubro4_AjustesFiscalesNegativos} />
                <LineItem label="Renta Neta Imponible (Base Imponible)" value={f500.rubro4_RentaNetaImponible} bold />
              </SectionBox>

              <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded-lg p-4 space-y-2 border border-blue-200 dark:border-blue-800/40">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">RUBRO 5 Y 6: LIQUIDACIÓN DEL IMPUESTO (10%)</h4>
                <div className="flex justify-between text-xs">
                  <span>Impuesto Liquidado (10% de Renta Neta Imponible):</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{gs(f500.rubro5_ImpuestoLiquidado)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Retenciones sufridas y anticipos computables:</span>
                  <span className="font-mono">{gs(f500.rubro6_CreditosFiscales)}</span>
                </div>
                <hr className="border-blue-200 dark:border-blue-800/30 my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Saldo a Pagar de IRE:</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{gs(f500.rubro6_SaldoAPagar)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Formulario 501 — IRE Régimen Simple</h2>
            <p className="text-xs text-gray-400 mt-1">{entityName} — RUC {entityRuc}</p>
            <p className="text-xs text-gray-500">Ejercicio Fiscal: {year}</p>
          </div>

          {form501Query.isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500 mb-2" />
              <p className="text-xs text-gray-400">Comparando Renta Real vs Renta Presunta (30%)...</p>
            </div>
          ) : f501 ? (
            <div className="p-3 sm:p-4 space-y-4">
              <SectionBox title="BASE IMPONIBLE (ART. 26 LEY 6380/19)" icon={Calculator} color="text-amber-500">
                <LineItem label="Total Ingresos Brutos del Ejercicio" value={f501.ingresosBrutos} />
                <LineItem label="Total Egresos Reales Documentados" value={f501.egresosReales} />
                <hr className="border-gray-100 dark:border-gray-800" />
                <LineItem label="Renta Real (Ingresos - Egresos)" value={f501.rentaReal} />
                <LineItem label="Renta Presunta (30% sobre Ingresos Brutos)" value={f501.rentaPresunta} />
                <hr className="border-gray-100 dark:border-gray-800" />
                <LineItem label="Base Imponible Seleccionada (La menor entre ambas)" value={f501.baseImponible} bold />
              </SectionBox>

              <div className="bg-amber-50/50 dark:bg-amber-500/5 rounded-lg p-4 space-y-2 border border-amber-200 dark:border-amber-800/40">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">IMPUESTO DETERMINADO (10%)</h4>
                <div className="flex justify-between text-sm font-bold">
                  <span>Impuesto IRE Simple a Ingresar:</span>
                  <span className="font-mono text-red-600 dark:text-red-400">{gs(f501.saldoAPagar)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SectionBox({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  return (
    <div className="border border-gray-100 dark:border-gray-800/60 rounded-xl p-3 sm:p-4 space-y-2.5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn("h-4 w-4", color)} />
        <h3 className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function LineItem({ label, value, indent, bold }: { label: string; value: number; indent?: boolean; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between text-xs", indent && "pl-4", bold && "font-semibold text-gray-900 dark:text-white")}>
      <span className={cn(bold ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>{label}:</span>
      <span className="font-mono">{gs(value)}</span>
    </div>
  );
}
