"use client";

import { useState } from "react";
import {
  Calculator,
  Receipt,
  Building2,
  CreditCard,
  ArrowRight,
  Info,
  RotateCcw,
  Download,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TaxType = "iva" | "ire" | "irp" | "retenciones";

interface IvaResult {
  debitoFiscal: number;
  creditoFiscal: number;
  iva10: { ventas: number; compras: number };
  iva5: { ventas: number; compras: number };
  exento: { ventas: number; compras: number };
  ivaPagar: number;
}

interface IreResult {
  baseImponible: number;
  tasa: number;
  impuestoBruto: number;
  retencionesPrevias: number;
  irePagar: number;
}

const IVA_RATE = 0.10;
const IVA5_RATE = 0.05;
const IRE_RATE = 0.30; // 30% sobre la renta neta (Régimen General)
const IRP_RATE = 0.10; // 10% retención estándar

export default function CalculadoraImpuestosPage() {
  const [activeTab, setActiveTab] = useState<TaxType>("iva");
  const [ivaData, setIvaData] = useState({ ventas10: "", ventas5: "", exentas: "", compras10: "", compras5: "", exentasCompra: "" });
  const [ireData, setIreData] = useState({ ingresos: "", costos: "", gastos: "", retencionesPrevias: "" });
  const [irpData, setIrpData] = useState({ montoBruto: "", retencionesPrevias: "" });
  const [retencionesData, setRetencionesData] = useState({ base: "", tasa: "10" });
  const [calculated, setCalculated] = useState(false);

  const calculateIva = (): IvaResult | null => {
    const ventas10 = parseFloat(ivaData.ventas10) || 0;
    const ventas5 = parseFloat(ivaData.ventas5) || 0;
    const exentas = parseFloat(ivaData.exentas) || 0;
    const compras10 = parseFloat(ivaData.compras10) || 0;
    const compras5 = parseFloat(ivaData.compras5) || 0;
    const exentasCompra = parseFloat(ivaData.exentasCompra) || 0;

    const debito10 = ventas10 * IVA_RATE;
    const debito5 = ventas5 * IVA5_RATE;
    const credito10 = compras10 * IVA_RATE;
    const credito5 = compras5 * IVA5_RATE;

    const totalDebito = debito10 + debito5;
    const totalCredito = credito10 + credito5;
    const ivaPagar = Math.max(0, totalDebito - totalCredito);

    return {
      debitoFiscal: totalDebito,
      creditoFiscal: totalCredito,
      iva10: { ventas: debito10, compras: credito10 },
      iva5: { ventas: debito5, compras: credito5 },
      exento: { ventas: exentas, compras: exentasCompra },
      ivaPagar,
    };
  };

  const calculateIre = (): IreResult | null => {
    const ingresos = parseFloat(ireData.ingresos) || 0;
    const costos = parseFloat(ireData.costos) || 0;
    const gastos = parseFloat(ireData.gastos) || 0;
    const retencionesPrevias = parseFloat(ireData.retencionesPrevias) || 0;

    const baseImponible = Math.max(0, ingresos - costos - gastos);
    const impuestoBruto = baseImponible * IRE_RATE;
    const irePagar = Math.max(0, impuestoBruto - retencionesPrevias);

    return { baseImponible, tasa: IRE_RATE * 100, impuestoBruto, retencionesPrevias, irePagar };
  };

  const calculateIrp = () => {
    const montoBruto = parseFloat(irpData.montoBruto) || 0;
    const retencionesPrevias = parseFloat(irpData.retencionesPrevias) || 0;
    const retencion = montoBruto * IRP_RATE;
    return { montoBruto, retencion, retencionesPrevias, neto: Math.max(0, retencion - retencionesPrevias) };
  };

  const calculateRetenciones = () => {
    const base = parseFloat(retencionesData.base) || 0;
    const tasa = parseFloat(retencionesData.tasa) / 100 || 0.10;
    return base * tasa;
  };

  const ivaResult = calculateIva();
  const ireResult = calculateIre();
  const irpResult = calculateIrp();
  const retencionesResult = calculateRetenciones();

  const handleCalculate = () => {
    setCalculated(true);
  };

  const handleReset = () => {
    setCalculated(false);
    setIvaData({ ventas10: "", ventas5: "", exentas: "", compras10: "", compras5: "", exentasCompra: "" });
    setIreData({ ingresos: "", costos: "", gastos: "", retencionesPrevias: "" });
    setIrpData({ montoBruto: "", retencionesPrevias: "" });
    setRetencionesData({ base: "", tasa: "10" });
  };

  const tabs = [
    { id: "iva" as TaxType, label: "IVA", icon: Receipt },
    { id: "ire" as TaxType, label: "IRE", icon: Building2 },
    { id: "irp" as TaxType, label: "IRP", icon: CreditCard },
    { id: "retenciones" as TaxType, label: "Retenciones", icon: Calculator },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-white">Calculadora de Impuestos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Cálculo de IVA, IRE, IRP y retenciones según normativa DNIT Paraguay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </button>
          <button
            onClick={handleCalculate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Calculator className="h-4 w-4" />
            Calcular
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-1.5 flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCalculated(false);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all flex-1 justify-center min-w-[120px]",
                activeTab === tab.id
                  ? "bg-gray-800 text-white font-medium"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* IVA Calculator */}
      {activeTab === "iva" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-400" />
              Datos para cálculo de IVA
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Ventas Gravadas 10%" value={ivaData.ventas10} onChange={(v) => setIvaData({ ...ivaData, ventas10: v })} prefix="₲" />
                <InputField label="Ventas Gravadas 5%" value={ivaData.ventas5} onChange={(v) => setIvaData({ ...ivaData, ventas5: v })} prefix="₲" />
                <InputField label="Ventas Exentas" value={ivaData.exentas} onChange={(v) => setIvaData({ ...ivaData, exentas: v })} prefix="₲" />
              </div>
              <div className="border-t border-gray-800 my-4" />
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Compras Gravadas 10%" value={ivaData.compras10} onChange={(v) => setIvaData({ ...ivaData, compras10: v })} prefix="₲" />
                <InputField label="Compras Gravadas 5%" value={ivaData.compras5} onChange={(v) => setIvaData({ ...ivaData, compras5: v })} prefix="₲" />
                <InputField label="Compras Exentas" value={ivaData.exentasCompra} onChange={(v) => setIvaData({ ...ivaData, exentasCompra: v })} prefix="₲" />
              </div>
            </div>
          </div>

          {calculated && ivaResult && (
            <div className="bg-gray-900/50 border border-blue-500/20 rounded-xl p-6 space-y-4">
              <h2 className="text-white font-medium flex items-center gap-2">
                <ChevronDown className="h-5 w-5 text-blue-400 rotate-180" />
                Resultado — IVA a Pagar
              </h2>
              <div className="space-y-2">
                <ResultRow label="Débito Fiscal (ventas)" value={ivaResult.debitoFiscal} />
                <ResultRow label="Crédito Fiscal (compras)" value={ivaResult.creditoFiscal} negative />
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <ResultRow label="IVA a Pagar" value={ivaResult.ivaPagar} bold highlight={ivaResult.ivaPagar > 0} />
                </div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-gray-400 text-xs">
                    {ivaResult.ivaPagar === 0
                      ? "No hay IVA a pagar este período. Tenés remanente de crédito fiscal."
                      : "El IVA a pagar se liquida mediante Form. 703 en el portal DNIT."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IRE Calculator */}
      {activeTab === "ire" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-400" />
              Datos para cálculo de IRE
            </h2>
            <div className="space-y-3">
              <InputField label="Ingresos Brutos" value={ireData.ingresos} onChange={(v) => setIreData({ ...ireData, ingresos: v })} prefix="₲" />
              <InputField label="Costos" value={ireData.costos} onChange={(v) => setIreData({ ...ireData, costos: v })} prefix="₲" />
              <InputField label="Gastos Deducibles" value={ireData.gastos} onChange={(v) => setIreData({ ...ireData, gastos: v })} prefix="₲" />
              <InputField label="Retenciones Previas" value={ireData.retencionesPrevias} onChange={(v) => setIreData({ ...ireData, retencionesPrevias: v })} prefix="₲" />
            </div>
          </div>

          {calculated && ireResult && (
            <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 space-y-4">
              <h2 className="text-white font-medium flex items-center gap-2">
                <ChevronDown className="h-5 w-5 text-purple-400 rotate-180" />
                Resultado — IRE a Pagar
              </h2>
              <div className="space-y-2">
                <ResultRow label="Base Imponible" value={ireResult.baseImponible} />
                <ResultRow label={`Tasa (${ireResult.tasa}%)`} value={ireResult.impuestoBruto} />
                <ResultRow label="Retenciones previas" value={ireResult.retencionesPrevias} negative />
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <ResultRow label="IRE a Pagar" value={ireResult.irePagar} bold highlight={ireResult.irePagar > 0} />
                </div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                  <p className="text-gray-400 text-xs">
                    El IRE (Impuesto a la Renta Empresarial) se calcula al 30% sobre la renta neta imponible. Régimen General — Form. 1301.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* IRP Calculator */}
      {activeTab === "irp" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-400" />
              Datos para cálculo de IRP
            </h2>
            <div className="space-y-3">
              <InputField label="Monto Bruto del Pago" value={irpData.montoBruto} onChange={(v) => setIrpData({ ...irpData, montoBruto: v })} prefix="₲" />
              <InputField label="Retenciones Previas" value={irpData.retencionesPrevias} onChange={(v) => setIrpData({ ...irpData, retencionesPrevias: v })} prefix="₲" />
            </div>
          </div>

          {calculated && (
            <div className="bg-gray-900/50 border border-amber-500/20 rounded-xl p-6 space-y-4">
              <h2 className="text-white font-medium flex items-center gap-2">
                <ChevronDown className="h-5 w-5 text-amber-400 rotate-180" />
                Resultado — Retención IRP
              </h2>
              <div className="space-y-2">
                <ResultRow label="Monto Bruto" value={irpResult.montoBruto} />
                <ResultRow label="Retención (10%)" value={irpResult.retencion} />
                <ResultRow label="Retenciones previas" value={irpResult.retencionesPrevias} negative />
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <ResultRow label="Neto a Retener" value={irpResult.neto} bold highlight={irpResult.neto > 0} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Retenciones Calculator */}
      {activeTab === "retenciones" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-white font-medium flex items-center gap-2">
              <Calculator className="h-5 w-5 text-cyan-400" />
              Calculadora de Retenciones
            </h2>
            <div className="space-y-3">
              <InputField label="Base Imponible" value={retencionesData.base} onChange={(v) => setRetencionesData({ ...retencionesData, base: v })} prefix="₲" />
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Tasa de Retención</label>
                <select
                  value={retencionesData.tasa}
                  onChange={(e) => setRetencionesData({ ...retencionesData, tasa: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="10">IRP 10% — Honorarios, alquileres, etc.</option>
                  <option value="2">IRE 2% — Retención sobre ingresos brutos</option>
                  <option value="1">IDU 1% — Dividendos</option>
                  <option value="6">IRE 6% — Régimen Simplificado</option>
                </select>
              </div>
            </div>
          </div>

          {calculated && (
            <div className="bg-gray-900/50 border border-cyan-500/20 rounded-xl p-6 space-y-4">
              <h2 className="text-white font-medium flex items-center gap-2">
                <ChevronDown className="h-5 w-5 text-cyan-400 rotate-180" />
                Resultado — Retención
              </h2>
              <div className="space-y-2">
                <ResultRow label="Base Imponible" value={parseFloat(retencionesData.base) || 0} />
                <ResultRow label={`Retención (${retencionesData.tasa}%)`} value={retencionesResult} bold highlight={retencionesResult > 0} />
              </div>
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/50">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-gray-400 text-xs">
                    Las retenciones se declaran mediante Form. 115. El agente de retención debe enterar el monto dentro de los plazos establecidos por DNIT.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InputField({ label, value, onChange, prefix }: { label: string; value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className={cn(
            "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50",
            prefix && "pl-8"
          )}
        />
      </div>
    </div>
  );
}

function ResultRow({ label, value, bold = false, highlight = false, negative = false }: { label: string; value: number; bold?: boolean; highlight?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={cn("text-gray-400 text-sm", bold && "font-medium text-gray-300")}>{label}</span>
      <span className={cn(
        "font-mono tabular-nums text-sm",
        bold && "font-bold text-lg",
        highlight && "text-white",
        negative && value > 0 ? "text-green-400" : "",
        !highlight && !negative ? "text-gray-300" : "",
        negative && value > 0 && "-"
      )}>
        {value === 0 ? "₲ 0" : `₲ ${Math.abs(value).toLocaleString("es-PY")}`}
      </span>
    </div>
  );
}
