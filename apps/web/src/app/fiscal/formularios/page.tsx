"use client";

import { useState } from "react";
import { Calculator, TrendingUp, TrendingDown, Download, Printer, Receipt, Building2, DollarSign, ChevronDown, FileText, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";

type FormType = "120" | "500";

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

  const ventasQuery = api.reports.libroIva.useQuery(
    { entityId: entity?.id || "", year, month, side: "ventas" },
    { enabled: isEntityValid && !isNaN(year) && !isNaN(month) }
  );

  const comprasQuery = api.reports.libroIva.useQuery(
    { entityId: entity?.id || "", year, month, side: "compras" },
    { enabled: isEntityValid && !isNaN(year) && !isNaN(month) }
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

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Formularios Oficiales DNIT</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Formulario 120 (IVA General) y Formulario 500 (IRE General) — {entityName} ({entityRuc})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 no-tap-highlight"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </button>
        </div>
      </div>

      {/* Selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button
          onClick={() => setForm("120")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight transition-all",
            form === "120" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          <Receipt className="h-3.5 w-3.5 inline mr-1.5" />
          Formulario 120 — IVA General
        </button>
        <button
          onClick={() => setForm("500")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight transition-all",
            form === "500" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
          )}
        >
          <Building2 className="h-3.5 w-3.5 inline mr-1.5" />
          Formulario 500 — IRE General
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
                  <span className="text-gray-500">Saldo a favor del Fisco (a Pagar)</span>
                  <span className={cn("font-mono font-bold", aPagar > 0 ? "text-red-600" : "text-gray-600 dark:text-gray-400")}>
                    {gs(aPagar)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Saldo a favor del Contribuyente (Crédito para prox. período)</span>
                  <span className={cn("font-mono font-bold", aFavor > 0 ? "text-green-600" : "text-gray-600 dark:text-gray-400")}>
                    {gs(aFavor)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Formulario 500 — IRE Régimen General</h2>
            <p className="text-xs text-gray-400 mt-1">{entityName} — RUC {entityRuc}</p>
            <p className="text-xs text-gray-500">Ejercicio Fiscal Anual: {year}</p>
          </div>

          <div className="p-4 sm:p-6 text-center space-y-3">
            <Building2 className="h-10 w-10 text-gray-400 mx-auto" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Liquidación Anual IRE (Formulario 500)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              La liquidación del Formulario 500 se consolida con el Cierre del Ejercicio y los Estados Financieros anuales aprobados.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Tasa General IRE: 10% sobre la Renta Neta
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionBox({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-3 space-y-1.5">
        {children}
      </div>
    </div>
  );
}

function LineItem({ label, value, indent, bold }: { label: string; value: number; indent?: boolean; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between text-xs", indent && "pl-4", bold && "font-bold text-gray-900 dark:text-white")}>
      <span className={cn(bold ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>{label}</span>
      <span className={cn("font-mono tabular-nums", bold && "text-blue-600 dark:text-blue-400")}>{gs(value)}</span>
    </div>
  );
}
