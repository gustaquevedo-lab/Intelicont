"use client";

import { useState } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign,
  Download, Printer, Calendar, Building2, ChevronDown,
  FileText, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "balance" | "pyg" | "flujo";

const BALANCE_DATA = {
  periodo: "31 de Mayo 2026",
  entity: "Importadora del Este S.A.",
  ruc: "80012345-1",
  activo: {
    corriente: [
      { code: "1.1.01", name: "Caja", amount: 2500000 },
      { code: "1.1.02", name: "Banco GNB Cta. Cte.", amount: 56050000 },
      { code: "1.1.03", name: "Banco Itaú Cta. Cte.", amount: 18500000 },
      { code: "1.1.05", name: "Cuentas a Cobrar Clientes", amount: 32500000 },
      { code: "1.1.06", name: "IVA Crédito Fiscal", amount: 2850000 },
      { code: "1.2.01", name: "Mercaderías", amount: 84500000 },
    ],
    noCorriente: [
      { code: "1.2.02", name: "Rodados", amount: 65000000 },
      { code: "1.2.03", name: "Mobiliario y Útiles", amount: 12000000 },
      { code: "1.2.04", name: "Equipo de Computación", amount: 25000000 },
      { code: "1.2.02", name: "Dep. Acum. Rodados", amount: -63000000 },
      { code: "1.2.04", name: "Dep. Acum. Eq. Computación", amount: -14375000 },
    ],
  },
  pasivo: {
    corriente: [
      { code: "2.1.01", name: "Cuentas a Pagar Proveedores", amount: 14700000 },
      { code: "2.1.02", name: "IVA Débito Fiscal", amount: 550000 },
      { code: "2.1.05", name: "Retenciones a Pagar", amount: 12500 },
      { code: "2.1.06", name: "IRE a Pagar", amount: 0 },
    ],
    noCorriente: [] as { code: string; name: string; amount: number }[],
  },
  patrimonio: [
    { code: "3.1.01", name: "Capital Social", amount: 200000000 },
    { code: "3.1.02", name: "Reserva Legal", amount: 10000000 },
    { code: "3.1.03", name: "Resultados Acumulados", amount: 45000000 },
    { code: "3.1.04", name: "Resultado del Ejercicio", amount: -1212500 },
  ],
};

const PYG_DATA = {
  periodo: "Mayo 2026",
  ingresos: [
    { code: "4.1.01", name: "Ventas de Mercaderías", amount: 5500000 },
    { code: "4.1.02", name: "Prestación de Servicios", amount: 0 },
    { code: "4.1.03", name: "Otros Ingresos", amount: 0 },
  ],
  costos: [
    { code: "5.1.01", name: "Costo de Mercaderías Vendidas", amount: -3750000 },
  ],
  gastos: [
    { code: "5.1.02", name: "Sueldos y Salarios", amount: -8000000 },
    { code: "5.1.03", name: "Seguridad Social", amount: -1320000 },
    { code: "5.1.04", name: "Honorarios Profesionales", amount: -2500000 },
    { code: "5.1.05", name: "Alquileres", amount: -2500000 },
    { code: "5.1.06", name: "Servicios Públicos", amount: -850000 },
    { code: "5.1.07", name: "Depreciación de Rodados", amount: -2250000 },
    { code: "5.1.08", name: "Depreciación Eq. Computación", amount: -625000 },
    { code: "5.1.09", name: "Gastos Financieros", amount: -125000 },
    { code: "5.1.10", name: "Otros Gastos", amount: -312500 },
  ],
};

const FLUJO_DATA = {
  periodo: "Mayo 2026",
  operativo: [
    { name: "Cobranzas a clientes", amount: 8550000 },
    { name: "Pago a proveedores", amount: -13750000 },
    { name: "Pago de sueldos", amount: -8000000 },
    { name: "Pago de impuestos", amount: -12500 },
    { name: "Pago de servicios", amount: -3350000 },
    { name: "Otros cobros operativos", amount: 2500000 },
  ],
  inversion: [
    { name: "Compra de equipos", amount: -5000000 },
  ],
  financiamiento: [
    { name: "Préstamo bancario recibido", amount: 0 },
    { name: "Pago de préstamos", amount: 0 },
  ],
};

export default function EstadosFinancierosPage() {
  const [tab, setTab] = useState<Tab>("balance");

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Estados Financieros</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Importadora del Este S.A. — RUC 80012345-1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-medium no-tap-highlight">
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium no-tap-highlight">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[
          { key: "balance" as Tab, label: "Balance General", icon: BarChart3 },
          { key: "pyg" as Tab, label: "Ganancias y Pérdidas", icon: TrendingUp },
          { key: "flujo" as Tab, label: "Flujo de Efectivo", icon: DollarSign },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium no-tap-highlight",
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

      {/* Report Content */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 text-center border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {tab === "balance" && "Balance General"}
            {tab === "pyg" && "Estado de Resultados"}
            {tab === "flujo" && "Flujo de Efectivo"}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {tab === "balance" ? `Al ${BALANCE_DATA.periodo}` : tab === "pyg" ? PYG_DATA.periodo : FLUJO_DATA.periodo}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{BALANCE_DATA.entity}</p>
          <p className="text-[10px] text-gray-400 font-mono">RUC {BALANCE_DATA.ruc} · Expresado en Guaraníes</p>
        </div>

        {tab === "balance" && <BalanceSheet />}
        {tab === "pyg" && <PyGStatement />}
        {tab === "flujo" && <CashFlowStatement />}

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
          <span>Generado por InteliCont</span>
          <span>{new Date().toLocaleDateString("es-PY")}</span>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AnalyticsCard title="Liquidez Corriente" value="10.81" subtitle="Activo Cte / Pasivo Cte" good />
        <AnalyticsCard title="Endeudamiento" value="0.09" subtitle="Pasivo / Activo" good />
        <AnalyticsCard title="Margen Bruto" value="31.8%" subtitle="Utilidad Bruta / Ventas" good />
        <AnalyticsCard title="ROE" value="-0.5%" subtitle="Resultado / Patrimonio" good={false} />
      </div>
    </div>
  );
}

function BalanceSheet() {
  const { activo, pasivo, patrimonio } = BALANCE_DATA;
  const totalActivoCte = activo.corriente.reduce((s, i) => s + i.amount, 0);
  const totalActivoNoCte = activo.noCorriente.reduce((s, i) => s + i.amount, 0);
  const totalActivo = totalActivoCte + totalActivoNoCte;
  const totalPasivoCte = pasivo.corriente.reduce((s, i) => s + i.amount, 0);
  const totalPasivoNoCte = pasivo.noCorriente.reduce((s, i) => s + i.amount, 0);
  const totalPasivo = totalPasivoCte + totalPasivoNoCte;
  const totalPatrimonio = patrimonio.reduce((s, i) => s + i.amount, 0);
  const totalPasivoPatrimonio = totalPasivo + totalPatrimonio;

  return (
    <div className="p-3 sm:p-4 space-y-4">
      <Section title="ACTIVO" icon={TrendingUp} color="text-blue-500">
        <SubSection title="Activo Corriente" items={activo.corriente} total={totalActivoCte} />
        <SubSection title="Activo No Corriente" items={activo.noCorriente} total={totalActivoNoCte} />
        <TotalLine label="Total Activo" amount={totalActivo} />
      </Section>

      <Section title="PASIVO" icon={TrendingDown} color="text-red-500">
        <SubSection title="Pasivo Corriente" items={pasivo.corriente} total={totalPasivoCte} />
        <SubSection title="Pasivo No Corriente" items={pasivo.noCorriente} total={totalPasivoNoCte} />
        <TotalLine label="Total Pasivo" amount={totalPasivo} />
      </Section>

      <Section title="PATRIMONIO NETO" icon={BarChart3} color="text-green-500">
        <SubSection title="" items={patrimonio} total={totalPatrimonio} hideHeader />
        <TotalLine label="Total Patrimonio Neto" amount={totalPatrimonio} />
      </Section>

      <TotalLine label="Total Pasivo + Patrimonio" amount={totalPasivoPatrimonio} double />
      <div className={cn(
        "text-center text-xs font-mono py-1 rounded",
        Math.abs(totalActivo - totalPasivoPatrimonio) < 1000
          ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/5"
          : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/5"
      )}>
        {Math.abs(totalActivo - totalPasivoPatrimonio) < 1000
          ? "✓ Balance cuadrado"
          : `⚠ Diferencia: Gs. ${(totalActivo - totalPasivoPatrimonio).toLocaleString("es-PY")}`}
      </div>
    </div>
  );
}

function PyGStatement() {
  const { ingresos, costos, gastos } = PYG_DATA;
  const totalIngresos = ingresos.reduce((s, i) => s + i.amount, 0);
  const totalCostos = costos.reduce((s, i) => s + i.amount, 0);
  const totalGastos = gastos.reduce((s, i) => s + i.amount, 0);
  const utilidadBruta = totalIngresos + totalCostos;
  const utilidadNeta = utilidadBruta + totalGastos;

  return (
    <div className="p-3 sm:p-4 space-y-4">
      <Section title="INGRESOS OPERATIVOS" icon={TrendingUp} color="text-green-500">
        {ingresos.map((i) => (
          <Line key={i.code} code={i.code} name={i.name} amount={i.amount} />
        ))}
        <TotalLine label="Total Ingresos" amount={totalIngresos} />
      </Section>

      <Section title="COSTO DE VENTAS" icon={Minus} color="text-amber-500">
        {costos.map((i) => (
          <Line key={i.code} code={i.code} name={i.name} amount={i.amount} />
        ))}
        <TotalLine label="Utilidad Bruta" amount={utilidadBruta} bold />
      </Section>

      <Section title="GASTOS OPERATIVOS" icon={TrendingDown} color="text-red-500">
        {gastos.map((i) => (
          <Line key={i.code} code={i.code} name={i.name} amount={i.amount} />
        ))}
        <TotalLine label="Total Gastos" amount={totalGastos} />
      </Section>

      <TotalLine label="Resultado del Ejercicio" amount={utilidadNeta} double result />
    </div>
  );
}

function CashFlowStatement() {
  const { operativo, inversion, financiamiento } = FLUJO_DATA;
  const totalOp = operativo.reduce((s, i) => s + i.amount, 0);
  const totalInv = inversion.reduce((s, i) => s + i.amount, 0);
  const totalFin = financiamiento.reduce((s, i) => s + i.amount, 0);
  const total = totalOp + totalInv + totalFin;
  const saldoInicial = 52500000;
  const saldoFinal = saldoInicial + total;

  return (
    <div className="p-3 sm:p-4 space-y-4">
      <Section title="ACTIVIDADES OPERATIVAS" icon={DollarSign} color="text-blue-500">
        {operativo.map((i, idx) => (
          <div key={idx} className="flex justify-between text-xs py-1">
            <span className="text-gray-600 dark:text-gray-400">{i.name}</span>
            <span className={cn("font-mono tabular-nums", i.amount >= 0 ? "text-green-600" : "text-red-600")}>
              Gs. {i.amount.toLocaleString("es-PY")}
            </span>
          </div>
        ))}
        <TotalLine label="Flujo Operativo" amount={totalOp} result={totalOp < 0} />
      </Section>

      <Section title="ACTIVIDADES DE INVERSIÓN" icon={BarChart3} color="text-purple-500">
        {inversion.map((i, idx) => (
          <div key={idx} className="flex justify-between text-xs py-1">
            <span className="text-gray-600 dark:text-gray-400">{i.name}</span>
            <span className={cn("font-mono tabular-nums", i.amount >= 0 ? "text-green-600" : "text-red-600")}>
              Gs. {i.amount.toLocaleString("es-PY")}
            </span>
          </div>
        ))}
        <TotalLine label="Flujo Inversión" amount={totalInv} result />
      </Section>

      <Section title="ACTIVIDADES DE FINANCIAMIENTO" icon={Building2} color="text-amber-500">
        {financiamiento.map((i, idx) => (
          <div key={idx} className="flex justify-between text-xs py-1">
            <span className="text-gray-600 dark:text-gray-400">{i.name}</span>
            <span className={cn("font-mono tabular-nums", i.amount >= 0 ? "text-green-600" : "text-red-600")}>
              Gs. {i.amount.toLocaleString("es-PY")}
            </span>
          </div>
        ))}
        <TotalLine label="Flujo Financiamiento" amount={totalFin} result />
      </Section>

      <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Saldo Inicial</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">Gs. {saldoInicial.toLocaleString("es-PY")}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Variación del Período</span>
          <span className={cn("font-mono", total >= 0 ? "text-green-600" : "text-red-600")}>
            Gs. {total.toLocaleString("es-PY")}
          </span>
        </div>
        <hr className="border-gray-200 dark:border-gray-700" />
        <div className="flex justify-between text-sm font-bold">
          <span className="text-gray-900 dark:text-white">Saldo Final</span>
          <span className="font-mono text-gray-900 dark:text-white">Gs. {saldoFinal.toLocaleString("es-PY")}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Components ─────────────────────────────────────────────────

function Section({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: any }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-4 w-4", color)} />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function SubSection({ title, items, total, hideHeader }: { title: string; items: any[]; total: number; hideHeader?: boolean }) {
  return (
    <div className="mb-2">
      {!hideHeader && <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1 ml-4">{title}</p>}
      {items.map((item) => (
        <Line key={item.code} code={item.code} name={item.name} amount={item.amount} />
      ))}
      {!hideHeader && <SubTotal amount={total} />}
    </div>
  );
}

function Line({ code, name, amount }: { code: string; name: string; amount: number }) {
  return (
    <div className="flex items-center justify-between py-1 pl-4 text-xs hover:bg-gray-50 dark:hover:bg-gray-800/20 rounded">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-gray-400 w-14">{code}</span>
        <span className="text-gray-700 dark:text-gray-300">{name}</span>
      </div>
      <span className="font-mono tabular-nums text-gray-700 dark:text-gray-300">
        Gs. {amount.toLocaleString("es-PY")}
      </span>
    </div>
  );
}

function SubTotal({ amount }: { amount: number }) {
  return (
    <div className="flex justify-end py-0.5 pl-4 border-t border-dashed border-gray-200 dark:border-gray-700">
      <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400">
        Gs. {amount.toLocaleString("es-PY")}
      </span>
    </div>
  );
}

function TotalLine({ label, amount, double, bold, result }: { label: string; amount: number; double?: boolean; bold?: boolean; result?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between py-1.5 px-2 rounded",
      double ? "border-t-2 border-gray-900 dark:border-white" : "border-t border-gray-300 dark:border-gray-600",
      result === true ? "bg-red-50 dark:bg-red-500/5" : result === false ? "bg-green-50 dark:bg-green-500/5" : "bg-gray-50 dark:bg-gray-800/30"
    )}>
      <span className={cn("font-bold", double ? "text-sm text-gray-900 dark:text-white" : "text-xs text-gray-800 dark:text-gray-200")}>
        {label}
      </span>
      <span className={cn(
        "font-mono tabular-nums font-bold",
        double ? "text-sm text-gray-900 dark:text-white" : "text-xs text-gray-900 dark:text-white"
      )}>
        Gs. {amount.toLocaleString("es-PY")}
      </span>
    </div>
  );
}

function AnalyticsCard({ title, value, subtitle, good }: { title: string; value: string; subtitle: string; good: boolean }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide">{title}</span>
      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
      <div className="flex items-center gap-1 mt-0.5">
        {good ? <ArrowUp className="h-3 w-3 text-green-500" /> : <ArrowDown className="h-3 w-3 text-red-500" />}
        <span className="text-[10px] text-gray-400">{subtitle}</span>
      </div>
    </div>
  );
}
