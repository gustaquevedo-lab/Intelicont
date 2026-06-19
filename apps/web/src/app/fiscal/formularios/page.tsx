"use client";

import { useState } from "react";
import { Calculator, TrendingUp, TrendingDown, Download, Printer, Receipt, Building2, DollarSign, ChevronDown, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type FormType = "500" | "120";

const FORM_500 = {
  periodo: "Mayo 2026",
  entity: "Importadora del Este S.A.",
  ruc: "80012345-1",
  ventas: { gravado10: 5500000, gravado5: 0, exento: 0, ivaDebito10: 550000, ivaDebito5: 0, totalIvaDebito: 550000 },
  compras: { gravado10: 13500000, gravado5: -500000, exento: 0, ivaCredito10: 1350000, ivaCredito5: -25000, totalIvaCredito: 1325000 },
  retencionesRecibidas: 12500,
  saldoAFavorAnterior: 0,
  totalAPagar: 0,
  saldoAFavor: 775000,
};

const FORM_120 = {
  periodo: "Ejercicio 2025",
  entity: "Importadora del Este S.A.",
  ruc: "80012345-1",
  regimen: "General",
  ingresosBrutos: 520000000,
  costos: 280000000,
  gastosOperativos: 95000000,
  gastosFinancieros: 3500000,
  utilidadAntesIRE: 141500000,
  ajustes: { mas: 2500000, menos: 1200000 },
  baseImponible: 142800000,
  tasa: 0.30,
  ireDeterminado: 42840000,
  anticipos: 15000000,
  retencionesSufridas: 3200000,
  saldoAPagar: 24640000,
};

export default function FormulariosPage() {
  const [form, setForm] = useState<FormType>("500");

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Formularios DNIT</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Formulario 500 (IVA) y Formulario 120 (IRE)</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium no-tap-highlight">
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button onClick={() => setForm("500")} className={cn("px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight", form === "500" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500")}>
          <Receipt className="h-3.5 w-3.5 inline mr-1.5" />Formulario 500 — IVA
        </button>
        <button onClick={() => setForm("120")} className={cn("px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight", form === "120" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500")}>
          <Building2 className="h-3.5 w-3.5 inline mr-1.5" />Formulario 120 — IRE
        </button>
      </div>

      {form === "500" && <Form500 data={FORM_500} />}
      {form === "120" && <Form120 data={FORM_120} />}
    </div>
  );
}

function Form500({ data }: { data: typeof FORM_500 }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Formulario 500 — Declaración Jurada del IVA</h2>
        <p className="text-xs text-gray-400 mt-1">{data.entity} — RUC {data.ruc}</p>
        <p className="text-xs text-gray-500">Período: {data.periodo}</p>
      </div>

      <div className="p-3 sm:p-4 space-y-4">
        <Section500 title="VENTAS — IVA DÉBITO FISCAL" icon={TrendingUp} color="text-green-500">
          <Line500 label="Gravado 10%" value={data.ventas.gravado10} />
          <Line500 label="Gravado 5%" value={data.ventas.gravado5} />
          <Line500 label="Exento" value={data.ventas.exento} />
          <hr className="border-gray-100 dark:border-gray-800" />
          <Line500 label="IVA Débito 10%" value={data.ventas.ivaDebito10} indent />
          <Line500 label="IVA Débito 5%" value={data.ventas.ivaDebito5} indent />
          <Line500 label="Total IVA Débito Fiscal" value={data.ventas.totalIvaDebito} bold />
        </Section500>

        <Section500 title="COMPRAS — IVA CRÉDITO FISCAL" icon={TrendingDown} color="text-red-500">
          <Line500 label="Gravado 10%" value={data.compras.gravado10} />
          <Line500 label="Gravado 5%" value={data.compras.gravado5} />
          <Line500 label="Exento" value={data.compras.exento} />
          <hr className="border-gray-100 dark:border-gray-800" />
          <Line500 label="IVA Crédito 10%" value={data.compras.ivaCredito10} indent />
          <Line500 label="IVA Crédito 5%" value={data.compras.ivaCredito5} indent />
          <Line500 label="Total IVA Crédito Fiscal" value={data.compras.totalIvaCredito} bold />
        </Section500>

        <Section500 title="LIQUIDACIÓN DEL IMPUESTO" icon={Calculator} color="text-blue-500">
          <Line500 label="IVA Débito Fiscal" value={data.ventas.totalIvaDebito} />
          <Line500 label="(-) IVA Crédito Fiscal" value={data.compras.totalIvaCredito} negative />
          <Line500 label="(+) Retenciones Recibidas" value={data.retencionesRecibidas} />
          <Line500 label="(+) Saldo a Favor Anterior" value={data.saldoAFavorAnterior} />
          <hr className="border-gray-100 dark:border-gray-800" />
          <Line500 label="Saldo a Favor del Contribuyente" value={data.saldoAFavor} bold color="text-green-600" />
          <Line500 label="Total a Pagar" value={data.totalAPagar} bold color="text-red-600" />
        </Section500>

        <div className={cn("text-center text-sm font-bold py-2 rounded-lg", data.saldoAFavor > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
          {data.saldoAFavor > 0
            ? `Saldo a Favor: Gs. ${data.saldoAFavor.toLocaleString("es-PY")}`
            : `IVA a Pagar: Gs. ${data.totalAPagar.toLocaleString("es-PY")}`}
        </div>
      </div>
    </div>
  );
}

function Form120({ data }: { data: typeof FORM_120 }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">Formulario 120 — Impuesto a la Renta Empresarial</h2>
        <p className="text-xs text-gray-400 mt-1">{data.entity} — RUC {data.ruc} — Régimen {data.regimen}</p>
        <p className="text-xs text-gray-500">Período: {data.periodo}</p>
      </div>

      <div className="p-3 sm:p-4 space-y-4">
        <Section500 title="DETERMINACIÓN DE LA RENTA NETA" icon={TrendingUp} color="text-green-500">
          <Line500 label="Ingresos Brutos" value={data.ingresosBrutos} />
          <Line500 label="(-) Costos" value={data.costos} negative />
          <Line500 label="(-) Gastos Operativos" value={data.gastosOperativos} negative />
          <Line500 label="(-) Gastos Financieros" value={data.gastosFinancieros} negative />
          <hr className="border-gray-100 dark:border-gray-800" />
          <Line500 label="Utilidad antes del IRE" value={data.utilidadAntesIRE} bold />
        </Section500>

        <Section500 title="AJUSTES Y BASE IMPONIBLE" icon={Calculator} color="text-amber-500">
          <Line500 label="(+) Ajustes (gastos no deducibles)" value={data.ajustes.mas} />
          <Line500 label="(-) Ajustes (rentas exentas)" value={data.ajustes.menos} negative />
          <hr className="border-gray-100 dark:border-gray-800" />
          <Line500 label="Base Imponible" value={data.baseImponible} bold />
        </Section500>

        <Section500 title="LIQUIDACIÓN DEL IMPUESTO" icon={DollarSign} color="text-blue-500">
          <Line500 label={`IRE Determinado (${(data.tasa * 100).toFixed(0)}%)`} value={data.ireDeterminado} />
          <Line500 label="(-) Anticipos" value={data.anticipos} negative />
          <Line500 label="(-) Retenciones Sufridas" value={data.retencionesSufridas} negative />
          <hr className="border-gray-100 dark:border-gray-800" />
          <Line500 label="Saldo a Pagar" value={data.saldoAPagar} bold color={data.saldoAPagar > 0 ? "text-red-600" : "text-green-600"} />
        </Section500>

        <div className={cn("text-center text-sm font-bold py-2 rounded-lg", data.saldoAPagar > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
          {data.saldoAPagar > 0
            ? `IRE a Pagar: Gs. ${data.saldoAPagar.toLocaleString("es-PY")}`
            : `Saldo a Favor: Gs. ${Math.abs(data.saldoAPagar).toLocaleString("es-PY")}`}
        </div>
      </div>
    </div>
  );
}

function Section500({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: any }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", color)} />
        <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="space-y-1 pl-6">{children}</div>
    </div>
  );
}

function Line500({ label, value, indent, bold, negative, color }: {
  label: string; value: number; indent?: boolean; bold?: boolean; negative?: boolean; color?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between py-0.5 text-xs", indent && "pl-4 border-l-2 border-gray-100 dark:border-gray-800")}>
      <span className={cn("text-gray-600 dark:text-gray-400", bold && "font-bold text-gray-800 dark:text-gray-200")}>{label}</span>
      <span className={cn("font-mono tabular-nums", bold ? "font-bold text-sm" : "text-xs",
        negative ? "text-red-600 dark:text-red-400" : color || "text-gray-700 dark:text-gray-300"
      )}>
        {negative ? `(Gs. ${Math.abs(value).toLocaleString("es-PY")})` : `Gs. ${value.toLocaleString("es-PY")}`}
      </span>
    </div>
  );
}
