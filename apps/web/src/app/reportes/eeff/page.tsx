"use client";

import { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign,
  Download, Printer, Calendar, Building2, ChevronDown,
  FileText, ArrowUp, ArrowDown, Minus, Loader2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";

type Tab = "balance" | "pyg" | "flujo";

const gs = (v: number) => `₲ ${Math.round(v).toLocaleString("es-PY")}`;

export default function EstadosFinancierosPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [tab, setTab] = useState<Tab>("balance");

  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();
  const [from, setFrom] = useState(`${currentYear}-01-01`);
  const [to, setTo] = useState(today);

  const isEntityValid = !!entity?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entity.id);

  const { data, isLoading, error } = api.reports.sumasSaldos.useQuery(
    { entityId: entity?.id || "", from, to },
    { enabled: isEntityValid }
  );

  const rows = data?.rows || [];

  // Group accounts by standard Paraguayan accounting structure
  const {
    activoCte,
    activoNoCte,
    pasivoCte,
    pasivoNoCte,
    patrimonio,
    ingresos,
    costos,
    gastos,
    cajasBancos,
  } = useMemo(() => {
    const aCte: { code: string; name: string; amount: number }[] = [];
    const aNoCte: { code: string; name: string; amount: number }[] = [];
    const pCte: { code: string; name: string; amount: number }[] = [];
    const pNoCte: { code: string; name: string; amount: number }[] = [];
    const pat: { code: string; name: string; amount: number }[] = [];
    const ing: { code: string; name: string; amount: number }[] = [];
    const cos: { code: string; name: string; amount: number }[] = [];
    const gas: { code: string; name: string; amount: number }[] = [];
    const cb: { code: string; name: string; opening: number; debit: number; credit: number; closing: number }[] = [];

    for (const r of rows) {
      const netAsset = r.saldoDeudor - r.saldoAcreedor;
      const netLiability = r.saldoAcreedor - r.saldoDeudor;

      if (r.code.startsWith("1.1")) {
        aCte.push({ code: r.code, name: r.name, amount: netAsset });
        if (r.code.startsWith("1.1.01") || r.code.startsWith("1.1.02") || r.code.startsWith("1.1.03")) {
          cb.push({ code: r.code, name: r.name, opening: r.opening, debit: r.debit, credit: r.credit, closing: r.closing });
        }
      } else if (r.code.startsWith("1.2") || r.code.startsWith("1.")) {
        aNoCte.push({ code: r.code, name: r.name, amount: netAsset });
      } else if (r.code.startsWith("2.1")) {
        pCte.push({ code: r.code, name: r.name, amount: netLiability });
      } else if (r.code.startsWith("2.2") || r.code.startsWith("2.")) {
        pNoCte.push({ code: r.code, name: r.name, amount: netLiability });
      } else if (r.code.startsWith("3.")) {
        pat.push({ code: r.code, name: r.name, amount: netLiability });
      } else if (r.code.startsWith("4.")) {
        ing.push({ code: r.code, name: r.name, amount: netLiability });
      } else if (r.code.startsWith("5.1")) {
        cos.push({ code: r.code, name: r.name, amount: netAsset });
      } else if (r.code.startsWith("5.")) {
        gas.push({ code: r.code, name: r.name, amount: netAsset });
      }
    }

    return {
      activoCte: aCte,
      activoNoCte: aNoCte,
      pasivoCte: pCte,
      pasivoNoCte: pNoCte,
      patrimonio: pat,
      ingresos: ing,
      costos: cos,
      gastos: gas,
      cajasBancos: cb,
    };
  }, [rows]);

  const totalActivoCte = activoCte.reduce((s, i) => s + i.amount, 0);
  const totalActivoNoCte = activoNoCte.reduce((s, i) => s + i.amount, 0);
  const totalActivo = totalActivoCte + totalActivoNoCte;

  const totalPasivoCte = pasivoCte.reduce((s, i) => s + i.amount, 0);
  const totalPasivoNoCte = pasivoNoCte.reduce((s, i) => s + i.amount, 0);
  const totalPasivo = totalPasivoCte + totalPasivoNoCte;

  const totalIngresos = ingresos.reduce((s, i) => s + i.amount, 0);
  const totalCostos = costos.reduce((s, i) => s + i.amount, 0);
  const totalGastos = gastos.reduce((s, i) => s + i.amount, 0);
  const utilidadBruta = totalIngresos - totalCostos;
  const resultadoEjercicio = utilidadBruta - totalGastos;

  const totalPatrimonioBase = patrimonio.reduce((s, i) => s + i.amount, 0);
  const totalPatrimonio = totalPatrimonioBase + resultadoEjercicio;
  const totalPasivoPatrimonio = totalPasivo + totalPatrimonio;

  // Ratios
  const liquidezCorriente = totalPasivoCte > 0 ? (totalActivoCte / totalPasivoCte).toFixed(2) : "N/A";
  const endeudamiento = totalActivo > 0 ? (totalPasivo / totalActivo).toFixed(2) : "0.00";
  const margenBrutoPct = totalIngresos > 0 ? (((totalIngresos - totalCostos) / totalIngresos) * 100).toFixed(1) + "%" : "0.0%";
  const roePct = totalPatrimonio > 0 ? ((resultadoEjercicio / totalPatrimonio) * 100).toFixed(1) + "%" : "0.0%";

  const handleExport = () => {
    let csv = `Cuenta,Nombre,Monto\n`;
    if (tab === "balance") {
      csv += `--- ACTIVO CORRIENTE ---\n`;
      activoCte.forEach((r) => { csv += `"${r.code}","${r.name}",${r.amount}\n`; });
      csv += `--- ACTIVO NO CORRIENTE ---\n`;
      activoNoCte.forEach((r) => { csv += `"${r.code}","${r.name}",${r.amount}\n`; });
      csv += `--- PASIVO CORRIENTE ---\n`;
      pasivoCte.forEach((r) => { csv += `"${r.code}","${r.name}",${r.amount}\n`; });
      csv += `--- PASIVO NO CORRIENTE ---\n`;
      pasivoNoCte.forEach((r) => { csv += `"${r.code}","${r.name}",${r.amount}\n`; });
      csv += `--- PATRIMONIO NETO ---\n`;
      patrimonio.forEach((r) => { csv += `"${r.code}","${r.name}",${r.amount}\n`; });
      csv += `"3.9.99","Resultado del Ejercicio",${resultadoEjercicio}\n`;
    } else if (tab === "pyg") {
      csv += `--- INGRESOS ---\n`;
      ingresos.forEach((r) => { csv += `"${r.code}","${r.name}",${r.amount}\n`; });
      csv += `--- COSTOS ---\n`;
      costos.forEach((r) => { csv += `"${r.code}","${r.name}",${r.amount}\n`; });
      csv += `--- GASTOS ---\n`;
      gastos.forEach((r) => { csv += `"${r.code}","${r.name}",${r.amount}\n`; });
    } else {
      csv += `--- CAJA Y BANCOS ---\n`;
      cajasBancos.forEach((r) => { csv += `"${r.code}","${r.name} - Entradas",${r.debit}\n"${r.code}","${r.name} - Salidas",${r.credit}\n`; });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EEFF_${entity?.ruc || "reporte"}_${tab}_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const entityName = entity?.tradeName || entity?.legalName || "Empresa Seleccionada";
  const entityRuc = entity?.ruc || "Sin RUC";

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Estados Financieros</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            {entityName} — RUC {entityRuc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 no-tap-highlight"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium no-tap-highlight"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Date Filter & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
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

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500 dark:text-gray-400 font-medium">Período:</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {!entity ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-8">
          <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Seleccione una Empresa</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Elija una empresa en la barra superior para cargar sus balances contables y estados financieros.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400">Calculando saldos contables...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900/50 border border-red-200 dark:border-red-900/30 rounded-xl p-6">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Error al cargar balance</h3>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error.message}</p>
        </div>
      ) : (
        <>
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
                Desde {from} hasta {to}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{entityName}</p>
              <p className="text-[10px] text-gray-400 font-mono">RUC {entityRuc} · Expresado en Guaraníes</p>
            </div>

            {rows.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-500">
                Sin movimientos contables para el período seleccionado.
              </div>
            ) : (
              <>
                {tab === "balance" && (
                  <div className="p-3 sm:p-4 space-y-4">
                    <Section title="ACTIVO" icon={TrendingUp} color="text-blue-500">
                      <SubSection title="Activo Corriente" items={activoCte} total={totalActivoCte} />
                      <SubSection title="Activo No Corriente" items={activoNoCte} total={totalActivoNoCte} />
                      <TotalLine label="Total Activo" amount={totalActivo} />
                    </Section>

                    <Section title="PASIVO" icon={TrendingDown} color="text-red-500">
                      <SubSection title="Pasivo Corriente" items={pasivoCte} total={totalPasivoCte} />
                      <SubSection title="Pasivo No Corriente" items={pasivoNoCte} total={totalPasivoNoCte} />
                      <TotalLine label="Total Pasivo" amount={totalPasivo} />
                    </Section>

                    <Section title="PATRIMONIO NETO" icon={BarChart3} color="text-green-500">
                      <SubSection title="Capital y Reservas" items={patrimonio} total={totalPatrimonioBase} hideHeader />
                      <Line code="3.9.99" name="Resultado del Ejercicio" amount={resultadoEjercicio} />
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
                )}

                {tab === "pyg" && (
                  <div className="p-3 sm:p-4 space-y-4">
                    <Section title="INGRESOS OPERATIVOS" icon={TrendingUp} color="text-green-500">
                      {ingresos.length === 0 ? <p className="text-xs text-gray-400 pl-4 py-1 italic">Sin ingresos en el período</p> : null}
                      {ingresos.map((i) => (
                        <Line key={i.code} code={i.code} name={i.name} amount={i.amount} />
                      ))}
                      <TotalLine label="Total Ingresos" amount={totalIngresos} />
                    </Section>

                    <Section title="COSTO DE VENTAS" icon={Minus} color="text-amber-500">
                      {costos.length === 0 ? <p className="text-xs text-gray-400 pl-4 py-1 italic">Sin costos imputados</p> : null}
                      {costos.map((i) => (
                        <Line key={i.code} code={i.code} name={i.name} amount={i.amount} />
                      ))}
                      <TotalLine label="Utilidad Bruta" amount={utilidadBruta} bold />
                    </Section>

                    <Section title="GASTOS OPERATIVOS" icon={TrendingDown} color="text-red-500">
                      {gastos.length === 0 ? <p className="text-xs text-gray-400 pl-4 py-1 italic">Sin gastos operativos registrados</p> : null}
                      {gastos.map((i) => (
                        <Line key={i.code} code={i.code} name={i.name} amount={i.amount} />
                      ))}
                      <TotalLine label="Total Gastos" amount={totalGastos} />
                    </Section>

                    <TotalLine label="Resultado del Ejercicio" amount={resultadoEjercicio} double result={resultadoEjercicio < 0} />
                  </div>
                )}

                {tab === "flujo" && (
                  <div className="p-3 sm:p-4 space-y-4">
                    <Section title="MOVIMIENTOS DE FONDOS (CAJA Y BANCOS)" icon={DollarSign} color="text-blue-500">
                      {cajasBancos.length === 0 ? (
                        <p className="text-xs text-gray-400 pl-4 py-1 italic">Sin cuentas de caja o bancos con movimientos</p>
                      ) : (
                        cajasBancos.map((c) => (
                          <div key={c.code} className="py-2 border-b border-gray-100 dark:border-gray-800/60 last:border-0 pl-4">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{c.code} — {c.name}</span>
                              <span className="font-mono">{gs(c.closing)}</span>
                            </div>
                            <div className="grid grid-cols-3 text-[11px] text-gray-500 mt-1">
                              <span>Saldo Ant: {gs(c.opening)}</span>
                              <span className="text-green-600">Entradas: {gs(c.debit)}</span>
                              <span className="text-red-600">Salidas: {gs(c.credit)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </Section>
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-400">
              <span>Generado por InteliCont</span>
              <span>{new Date().toLocaleDateString("es-PY")}</span>
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <AnalyticsCard title="Liquidez Corriente" value={liquidezCorriente} subtitle="Activo Cte / Pasivo Cte" good={Number(liquidezCorriente) >= 1} />
            <AnalyticsCard title="Endeudamiento" value={endeudamiento} subtitle="Pasivo / Activo" good={Number(endeudamiento) <= 0.6} />
            <AnalyticsCard title="Margen Bruto" value={margenBrutoPct} subtitle="Utilidad Bruta / Ventas" good={parseFloat(margenBrutoPct) > 0} />
            <AnalyticsCard title="ROE" value={roePct} subtitle="Resultado / Patrimonio" good={parseFloat(roePct) > 0} />
          </div>
        </>
      )}
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
      <span className={cn("font-mono tabular-nums", amount < 0 ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300")}>
        {gs(amount)}
      </span>
    </div>
  );
}

function SubTotal({ amount }: { amount: number }) {
  return (
    <div className="flex justify-end py-0.5 pl-4 border-t border-dashed border-gray-200 dark:border-gray-700">
      <span className="text-xs font-mono font-medium text-gray-600 dark:text-gray-400">
        {gs(amount)}
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
        double ? "text-sm text-gray-900 dark:text-white" : "text-xs text-gray-900 dark:text-white",
        amount < 0 ? "text-red-600 dark:text-red-400" : ""
      )}>
        {gs(amount)}
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
