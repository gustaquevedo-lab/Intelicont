"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Calculator, TrendingUp, TrendingDown, Download, Printer,
  Receipt, Building2, ChevronDown, AlertCircle, Loader2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadEntidadesParaFiscal, loadLiquidacionIVA, loadLiquidacionIRE,
  type LiquidacionIVA, type LiquidacionIRE,
} from "../actions";

export default function FormulariosPage() {
  const [entities, setEntities] = useState<Array<{ id: string; legalName: string; ruc: string }>>([]);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(5); // Mayo
  const [activeTab, setActiveTab] = useState<"120" | "500">("120"); // 120 = IVA, 500 = IRE

  const [isPending, startTransition] = useTransition();
  const [ivaData, setIvaData] = useState<LiquidacionIVA | null>(null);
  const [ireData, setIreData] = useState<LiquidacionIRE | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load entities on mount
  useEffect(() => {
    startTransition(async () => {
      const res = await loadEntidadesParaFiscal();
      if (res.ok) {
        setEntities(res.data);
        if (res.data.length > 0) {
          setSelectedEntity(res.data[0].id);
        }
      }
    });
  }, []);

  // Fetch liquidacion when selection or tab changes
  const handleCalculate = () => {
    if (!selectedEntity) return;
    setError(null);
    setIvaData(null);
    setIreData(null);

    startTransition(async () => {
      if (activeTab === "120") {
        const res = await loadLiquidacionIVA(selectedEntity, selectedYear, selectedMonth);
        if (res.ok) setIvaData(res.data);
        else setError(res.error);
      } else {
        const res = await loadLiquidacionIRE(selectedEntity, selectedYear);
        if (res.ok) setIreData(res.data);
        else setError(res.error);
      }
    });
  };

  useEffect(() => {
    if (selectedEntity) {
      handleCalculate();
    }
  }, [selectedEntity, selectedYear, selectedMonth, activeTab]);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            Declaraciones Juradas (DNIT)
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Liquidación interactiva de impuestos basada en transacciones del Libro Mayor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            disabled={!ivaData && !ireData}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 border border-gray-700/50 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="h-4 w-4" /> Imprimir Borrador
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-900/20 border border-gray-800/60 p-4 rounded-xl no-print">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-450 mb-1.5">Empresa / Contribuyente</label>
          <div className="relative">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full appearance-none input-field pr-8 cursor-pointer"
            >
              <option value="">Seleccioná una empresa</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>{e.legalName} ({e.ruc})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-455 mb-1.5">Ejercicio Fiscal (Año)</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full input-field"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        {activeTab === "120" && (
          <div>
            <label className="block text-xs font-semibold text-gray-455 mb-1.5">Mes a Declarar</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full input-field"
            >
              <option value={1}>Enero</option>
              <option value={2}>Febrero</option>
              <option value={3}>Marzo</option>
              <option value={4}>Abril</option>
              <option value={5}>Mayo</option>
              <option value={6}>Junio</option>
              <option value={7}>Julio</option>
              <option value={8}>Agosto</option>
              <option value={9}>Septiembre</option>
              <option value={10}>Octubre</option>
              <option value={11}>Noviembre</option>
              <option value={12}>Diciembre</option>
            </select>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-gray-900/40 border border-gray-800/80 p-1 rounded-xl w-full sm:w-96 backdrop-blur-sm no-print">
        <button
          onClick={() => setActiveTab("120")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
            activeTab === "120" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          <Receipt className="h-3.5 w-3.5" /> Formulario 120 (IVA)
        </button>
        <button
          onClick={() => setActiveTab("500")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5",
            activeTab === "500" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
          )}
        >
          <Building2 className="h-3.5 w-3.5" /> Formulario 500 (IRE General)
        </button>
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Forms Contents */}
      {!isPending && activeTab === "120" && ivaData && <Form120View data={ivaData} />}
      {!isPending && activeTab === "500" && ireData && <Form500View data={ireData} />}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; font-size: 11px; }
          .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; background: white !important; }
        }
      `}</style>
    </div>
  );
}

function Form120View({ data }: { data: LiquidacionIVA }) {
  const formatGs = (n: number) => `Gs. ${Math.round(n).toLocaleString("es-PY")}`;

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm animate-in fade-in duration-200">
      <div className="p-6 text-center border-b border-gray-800 bg-gray-950/20 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div className="text-left">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">Formulario 120 — Declaración del IVA</h2>
          <p className="text-xs text-gray-400 mt-1">{data.entityName} — RUC {data.ruc}</p>
          <p className="text-xs text-blue-400 font-semibold mt-1">Período Fiscal: {data.periodo}</p>
        </div>
        <div className="text-right bg-gray-850 px-3 py-1.5 rounded-xl border border-gray-800 text-xs">
          <span className="text-gray-400">Vencimiento DNIT: </span>
          <span className="font-bold text-white font-mono">{data.vencimientoFecha}</span>
          {data.presentacionTardia && (
            <span className="block text-[10px] text-amber-400 font-bold mt-0.5">⚠️ Fuera de Plazo</span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        <FormSection title="Rubro 1: Enajenación de Bienes y Prestación de Servicios (Ventas)" icon={TrendingUp} color="text-green-500">
          <FormLine label="Operaciones Gravadas al 10%" value={data.ventas.gravado10} />
          <FormLine label="Operaciones Gravadas al 5%" value={data.ventas.gravado5} />
          <FormLine label="Operaciones Exentas de Impuesto" value={data.ventas.exento} />
          <div className="h-px bg-gray-800 my-2" />
          <FormLine label="IVA Débito Fiscal al 10%" value={data.ventas.ivaDebito10} indent />
          <FormLine label="IVA Débito Fiscal al 5%" value={data.ventas.ivaDebito5} indent />
          <FormLine label="Total IVA Débito Fiscal del Período" value={data.ventas.totalIvaDebito} bold />
        </FormSection>

        <FormSection title="Rubro 2: Adquisición de Bienes y Servicios (Compras)" icon={TrendingDown} color="text-red-500">
          <FormLine label="Compras Locales Gravadas al 10%" value={data.compras.gravado10} />
          <FormLine label="Compras Locales Gravadas al 5%" value={data.compras.gravado5} />
          <FormLine label="Compras Locales Exentas" value={data.compras.exento} />
          <div className="h-px bg-gray-800 my-2" />
          <FormLine label="IVA Crédito Fiscal Bruto" value={data.compras.totalIvaCredito} indent />
          <div className="pl-4 flex items-center justify-between text-[11px] text-gray-500 py-0.5">
            <span>Factor de Prorrateo (Ventas Gravadas / Total Ventas)</span>
            <span className="font-mono font-bold">{(data.coeficienteProrrateo * 100).toFixed(2)}%</span>
          </div>
          <FormLine label="(-) IVA Crédito No Computable (Operaciones Exentas)" value={data.ivaCreditoNoComputable} indent negative />
          <FormLine label="Total IVA Crédito Fiscal Computable" value={data.ivaCreditoComputable} bold />
        </FormSection>

        <FormSection title="Rubro 3: Liquidación del Impuesto y Saldo" icon={Calculator} color="text-blue-500">
          <FormLine label="Total IVA Débito Fiscal" value={data.ventas.totalIvaDebito} />
          <FormLine label="(-) Total IVA Crédito Fiscal Computable" value={data.ivaCreditoComputable} negative />
          <FormLine label="(-) Retenciones del IVA Recibidas" value={data.retencionesRecibidas} negative />
          <FormLine label="(-) Saldo a Favor del Contribuyente del Período Anterior" value={data.saldoAFavorAnterior} negative />
          <div className="h-px bg-gray-800 my-2" />
          <FormLine label="Saldo Técnico IVA (a favor del contribuyente)" value={data.saldoAFavor} bold color="text-green-400" />
        </FormSection>

        {data.presentacionTardia && (
          <FormSection title="Liquidación de Multas y Recargos (Presentación Tardía)" icon={Info} color="text-amber-500">
            <FormLine label="Multa por Contravención (Presentación Tardía)" value={data.multaContravencion} />
            <FormLine label="Recargo por Mora (1.5% mensual sobre saldo deudor)" value={data.recargoMora} />
          </FormSection>
        )}

        <div className={cn(
          "p-4 rounded-xl text-center text-sm font-bold border",
          data.saldoAFavor > 0
            ? "bg-green-950/20 border-green-800/40 text-green-400"
            : "bg-red-950/20 border-red-800/40 text-red-400"
        )}>
          {data.saldoAFavor > 0
            ? `SALDO A FAVOR COMPILADO: ${formatGs(data.saldoAFavor)}`
            : `IMPUESTO NETO A PAGAR (INCL. MULTAS): ${formatGs(data.totalAPagar)}`}
        </div>
      </div>
    </div>
  );
}

function Form500View({ data }: { data: LiquidacionIRE }) {
  const formatGs = (n: number) => `Gs. ${Math.round(n).toLocaleString("es-PY")}`;

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm animate-in fade-in duration-200">
      <div className="p-6 text-center border-b border-gray-800 bg-gray-950/20">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">Formulario 500 — IRE General</h2>
        <p className="text-xs text-gray-400 mt-1">{data.entityName} — RUC {data.ruc} — Régimen {data.regimen}</p>
        <p className="text-xs text-blue-400 font-semibold mt-1">Período Fiscal: {data.periodo}</p>
      </div>

      <div className="p-6 space-y-6">
        <FormSection title="Sección A: Determinación de la Renta Neta" icon={TrendingUp} color="text-green-500">
          <FormLine label="Ingresos Operativos Brutos del Ejercicio" value={data.ingresosBrutos} />
          <FormLine label="(-) Costo de Mercaderías Vendidas" value={data.costos} negative />
          <FormLine label="(-) Gastos Operativos y de Administración" value={data.gastosOperativos} negative />
          <FormLine label="(-) Gastos Financieros" value={data.gastosFinancieros} negative />
          <div className="h-px bg-gray-800 my-2" />
          <FormLine label="Utilidad Contable antes del Impuesto" value={data.utilidadAntesIRE} bold />
        </FormSection>

        <FormSection title="Sección B: Ajustes para Conciliación Fiscal" icon={Calculator} color="text-amber-500">
          <FormLine label="(+) Gastos No Deducibles (Ajuste al IRE)" value={data.ajustes.mas} />
          <FormLine label="(-) Rentas Exentas / Exoneradas" value={data.ajustes.menos} negative />
          <div className="h-px bg-gray-800 my-2" />
          <FormLine label="Base Imponible Fiscal (Renta Neta Imponible)" value={data.baseImponible} bold />
        </FormSection>

        <FormSection title="Sección C: Liquidación del Impuesto" icon={Building2} color="text-blue-500">
          <FormLine label={`IRE Determinado (Tasa General del ${(data.tasa * 100).toFixed(0)}%)`} value={data.ireDeterminado} />
          <FormLine label="(-) Anticipos Pagados del Ejercicio" value={data.anticipos} negative />
          <FormLine label="(-) Retenciones Sufridas del Ejercicio" value={data.retencionesSufridas} negative />
          <div className="h-px bg-gray-800 my-2" />
          <FormLine label="Saldo Neto de Impuesto a Pagar" value={data.saldoAPagar} bold color={data.saldoAPagar > 0 ? "text-red-400" : "text-green-400"} />
        </FormSection>

        <div className={cn(
          "p-4 rounded-xl text-center text-sm font-bold border",
          data.saldoAPagar > 0
            ? "bg-red-950/20 border-red-800/40 text-red-400"
            : "bg-green-950/20 border-green-800/40 text-green-400"
        )}>
          {data.saldoAPagar > 0
            ? `SALDO A PAGAR DEL EJERCICIO: ${formatGs(data.saldoAPagar)}`
            : `EJERCICIO CON SALDO A FAVOR / CERO`}
        </div>
      </div>
    </div>
  );
}

function FormSection({ title, icon: Icon, color, children }: {
  title: string; icon: any; color: string; children: any;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <Icon className={cn("h-4 w-4", color)} />
        <h3 className="text-xs sm:text-sm font-bold text-gray-200 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-2 pl-6">{children}</div>
    </div>
  );
}

function FormLine({ label, value, indent, bold, negative, color }: {
  label: string; value: number; indent?: boolean; bold?: boolean; negative?: boolean; color?: string;
}) {
  return (
    <div className={cn(
      "flex items-center justify-between py-1 text-xs",
      indent && "pl-4 border-l border-gray-800",
      bold && "font-bold text-white"
    )}>
      <span className={cn("text-gray-400", bold && "text-white")}>{label}</span>
      <span className={cn(
        "font-mono tabular-nums",
        bold ? "text-sm text-white" : "text-xs text-gray-300",
        negative && "text-red-400",
        color
      )}>
        {negative ? `(Gs. ${Math.abs(value).toLocaleString("es-PY")})` : `Gs. ${value.toLocaleString("es-PY")}`}
      </span>
    </div>
  );
}
