"use client";

import { useState, useTransition } from "react";
import {
  Calculator, Receipt, Building2, CreditCard,
  RotateCcw, ChevronDown, Info, Sparkles, X,
  Save, FileDown, CheckCircle2, Loader2, Brain,
  AlertTriangle, TrendingUp, Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { runTaxCopilotAction } from "./actions";

type TaxType = "iva" | "ire" | "irp" | "retenciones";

const IVA_RATE = 0.10;
const IVA5_RATE = 0.05;
const IRE_RATE = 0.30;
const IRP_RATE = 0.10;

const TABS = [
  { id: "iva" as TaxType, label: "IVA", icon: Receipt, color: "blue", desc: "Impuesto al Valor Agregado" },
  { id: "ire" as TaxType, label: "IRE", icon: Building2, color: "purple", desc: "Impuesto a la Renta Empresarial" },
  { id: "irp" as TaxType, label: "IRP", icon: CreditCard, color: "amber", desc: "Impuesto a la Renta Personal" },
  { id: "retenciones" as TaxType, label: "Retenciones", icon: Calculator, color: "cyan", desc: "Retención en la Fuente" },
];

function formatGs(n: number) {
  return n === 0 ? "₲ 0" : `₲ ${Math.abs(n).toLocaleString("es-PY")}`;
}

function InputField({ label, value, onChange, prefix, hint }: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className={cn(
            "w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder-gray-600",
            prefix && "pl-8"
          )}
        />
      </div>
      {hint && <p className="text-[10px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

function ResultRow({ label, value, bold = false, highlight = false, negative = false, color }: {
  label: string; value: number; bold?: boolean; highlight?: boolean; negative?: boolean; color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={cn("text-gray-400 text-sm", bold && "font-semibold text-gray-200")}>{label}</span>
      <span className={cn(
        "font-mono tabular-nums text-sm",
        bold && "font-bold text-lg",
        highlight && "text-white",
        color || (!highlight && !negative ? "text-gray-300" : ""),
        negative && value > 0 ? "text-green-400" : "",
      )}>
        {negative && value > 0 ? "-" : ""}{formatGs(value)}
      </span>
    </div>
  );
}

// AI Analysis Panel
function AiAnalysisPanel({ analysis, onClose }: { analysis: string; onClose: () => void }) {
  return (
    <div className="bg-purple-950/20 border border-purple-800/40 rounded-2xl p-5 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-purple-300">Copiloto Fiscal IA</p>
            <p className="text-[10px] text-gray-500">Análisis basado en legislación paraguaya (Ley 6380/19)</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="bg-gray-950/50 border border-purple-900/30 rounded-xl p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
        {analysis}
      </div>
    </div>
  );
}

export default function CalculadoraImpuestosPage() {
  const [activeTab, setActiveTab] = useState<TaxType>("iva");
  const [ivaData, setIvaData] = useState({ ventas10: "", ventas5: "", exentas: "", compras10: "", compras5: "", exentasCompra: "" });
  const [ireData, setIreData] = useState({ ingresos: "", costos: "", gastos: "", retencionesPrevias: "" });
  const [irpData, setIrpData] = useState({ montoBruto: "", retencionesPrevias: "" });
  const [retencionesData, setRetencionesData] = useState({ base: "", tasa: "10" });
  const [calculated, setCalculated] = useState(false);

  // Modals & AI
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiPending, startAiT] = useTransition();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [savedPeriod, setSavedPeriod] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
  const [savedList, setSavedList] = useState<{ name: string; period: string; type: TaxType; amount: number }[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ─── Calculators ────────────────────────────────────────────────────────

  const ivaResult = (() => {
    const v10 = parseFloat(ivaData.ventas10) || 0;
    const v5 = parseFloat(ivaData.ventas5) || 0;
    const c10 = parseFloat(ivaData.compras10) || 0;
    const c5 = parseFloat(ivaData.compras5) || 0;
    const debito = v10 * IVA_RATE + v5 * IVA5_RATE;
    const credito = c10 * IVA_RATE + c5 * IVA5_RATE;
    return {
      debitoFiscal: debito, creditoFiscal: credito,
      iva10: { ventas: v10 * IVA_RATE, compras: c10 * IVA_RATE },
      iva5: { ventas: v5 * IVA5_RATE, compras: c5 * IVA5_RATE },
      ivaPagar: Math.max(0, debito - credito),
      remanente: Math.max(0, credito - debito),
    };
  })();

  const ireResult = (() => {
    const ing = parseFloat(ireData.ingresos) || 0;
    const cos = parseFloat(ireData.costos) || 0;
    const gas = parseFloat(ireData.gastos) || 0;
    const ret = parseFloat(ireData.retencionesPrevias) || 0;
    const base = Math.max(0, ing - cos - gas);
    const bruto = base * IRE_RATE;
    return { baseImponible: base, tasa: IRE_RATE * 100, impuestoBruto: bruto, retencionesPrevias: ret, irePagar: Math.max(0, bruto - ret) };
  })();

  const irpResult = (() => {
    const bruto = parseFloat(irpData.montoBruto) || 0;
    const ret = parseFloat(irpData.retencionesPrevias) || 0;
    const retencion = bruto * IRP_RATE;
    return { montoBruto: bruto, retencion, retencionesPrevias: ret, neto: Math.max(0, retencion - ret) };
  })();

  const retencionesResult = (() => {
    const base = parseFloat(retencionesData.base) || 0;
    const tasa = parseFloat(retencionesData.tasa) / 100;
    return { base, tasa: parseFloat(retencionesData.tasa), importe: base * tasa };
  })();

  const getResultAmount = () => {
    if (activeTab === "iva") return ivaResult.ivaPagar;
    if (activeTab === "ire") return ireResult.irePagar;
    if (activeTab === "irp") return irpResult.neto;
    return retencionesResult.importe;
  };

  // ─── AI Copilot ──────────────────────────────────────────────────────────

  const handleRunAI = () => {
    if (!calculated) return;
    setAiAnalysis(null);
    startAiT(async () => {
      const result = await runTaxCopilotAction({
        type: activeTab,
        values: activeTab === "iva" ? ivaData : activeTab === "ire" ? ireData : activeTab === "irp" ? irpData : retencionesData,
        result: activeTab === "iva" ? ivaResult : activeTab === "ire" ? ireResult : activeTab === "irp" ? irpResult : retencionesResult,
      } as any);
      if (result.success) setAiAnalysis(result.analysis || "Análisis completado.");
    });
  };

  // ─── Save Liquidation ────────────────────────────────────────────────────

  const handleSave = () => {
    if (!savedName) return;
    setSavedList(prev => [...prev, {
      name: savedName,
      period: savedPeriod,
      type: activeTab,
      amount: getResultAmount(),
    }]);
    setSavedName("");
    setShowSaveModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    setCalculated(false);
    setAiAnalysis(null);
    setIvaData({ ventas10: "", ventas5: "", exentas: "", compras10: "", compras5: "", exentasCompra: "" });
    setIreData({ ingresos: "", costos: "", gastos: "", retencionesPrevias: "" });
    setIrpData({ montoBruto: "", retencionesPrevias: "" });
    setRetencionesData({ base: "", tasa: "10" });
  };

  const currentTab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Calculadora de Impuestos</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Cálculo de IVA, IRE, IRP y retenciones según normativa DNIT Paraguay (Ley 6380/19)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {calculated && (
            <>
              <button
                onClick={handleRunAI}
                disabled={aiPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-800/40 rounded-xl text-sm font-semibold transition-all"
              >
                {aiPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {aiPending ? "Analizando..." : "Copiloto Fiscal IA"}
              </button>
              <button
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-800/40 rounded-xl text-sm font-semibold transition-all"
              >
                <Save className="h-4 w-4" /> Guardar
              </button>
            </>
          )}
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors border border-gray-700">
            <RotateCcw className="h-4 w-4" /> Limpiar
          </button>
          <button onClick={() => setCalculated(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-blue-600/10">
            <Calculator className="h-4 w-4" /> Calcular
          </button>
        </div>
      </div>

      {/* Save success toast */}
      {saveSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-950/20 border border-green-800/40 rounded-xl text-sm text-green-400 animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>Liquidación guardada correctamente.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-1.5 flex flex-wrap gap-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setActiveTab(t.id); setCalculated(false); setAiAnalysis(null); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all flex-1 justify-center min-w-[140px]",
                activeTab === t.id
                  ? "bg-gray-800 text-white font-semibold shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}>
              <Icon className="h-4 w-4" />
              <span className="font-medium">{t.label}</span>
              <span className="hidden lg:block text-[10px] text-gray-500">— {t.desc}</span>
            </button>
          );
        })}
      </div>

      {/* IVA Calculator */}
      {activeTab === "iva" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-400" />
              <h2 className="text-white font-semibold">Datos para cálculo de IVA</h2>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Ventas del Período</p>
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Gravadas 10%" value={ivaData.ventas10} onChange={v => setIvaData({ ...ivaData, ventas10: v })} prefix="₲" />
                <InputField label="Gravadas 5%" value={ivaData.ventas5} onChange={v => setIvaData({ ...ivaData, ventas5: v })} prefix="₲" />
                <InputField label="Exentas" value={ivaData.exentas} onChange={v => setIvaData({ ...ivaData, exentas: v })} prefix="₲" />
              </div>
            </div>
            <div className="border-t border-gray-800" />
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Compras del Período</p>
              <div className="grid grid-cols-3 gap-3">
                <InputField label="Gravadas 10%" value={ivaData.compras10} onChange={v => setIvaData({ ...ivaData, compras10: v })} prefix="₲" />
                <InputField label="Gravadas 5%" value={ivaData.compras5} onChange={v => setIvaData({ ...ivaData, compras5: v })} prefix="₲" />
                <InputField label="Exentas" value={ivaData.exentasCompra} onChange={v => setIvaData({ ...ivaData, exentasCompra: v })} prefix="₲" />
              </div>
            </div>
          </div>

          {calculated && (
            <div className="bg-gray-900/50 border border-blue-500/20 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <ChevronDown className="h-5 w-5 text-blue-400 rotate-180" />
                </div>
                <h2 className="text-white font-semibold">Resultado — IVA</h2>
              </div>
              <div className="space-y-1">
                <ResultRow label="Débito Fiscal (ventas)" value={ivaResult.debitoFiscal} />
                <div className="pl-4 space-y-0.5 text-[11px] text-gray-500 font-mono">
                  <div className="flex justify-between">
                    <span>IVA Ventas 10%</span><span>{formatGs(ivaResult.iva10.ventas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA Ventas 5%</span><span>{formatGs(ivaResult.iva5.ventas)}</span>
                  </div>
                </div>
                <ResultRow label="Crédito Fiscal (compras)" value={ivaResult.creditoFiscal} negative />
                <div className="border-t border-gray-700 pt-2 mt-1 space-y-1">
                  {ivaResult.ivaPagar > 0 ? (
                    <ResultRow label="IVA a Pagar" value={ivaResult.ivaPagar} bold highlight color="text-amber-300" />
                  ) : (
                    <ResultRow label="Remanente de Crédito" value={ivaResult.remanente} bold color="text-green-400" />
                  )}
                </div>
              </div>
              <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-gray-400 text-xs">
                    {ivaResult.ivaPagar === 0
                      ? `Tenés remanente de crédito fiscal de ${formatGs(ivaResult.remanente)} trasladable al próximo período.`
                      : "El IVA a pagar se liquida mediante Form. 703 (mensual) en el portal DNIT Marangatú."}
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
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-400" />
              <h2 className="text-white font-semibold">Datos para cálculo de IRE</h2>
            </div>
            <InputField label="Ingresos Brutos del Ejercicio" value={ireData.ingresos} onChange={v => setIreData({ ...ireData, ingresos: v })} prefix="₲" hint="Total de ventas netas del año fiscal" />
            <InputField label="Costos de Ventas" value={ireData.costos} onChange={v => setIreData({ ...ireData, costos: v })} prefix="₲" />
            <InputField label="Gastos Deducibles Admitidos" value={ireData.gastos} onChange={v => setIreData({ ...ireData, gastos: v })} prefix="₲" hint="Incluye depreciaciones, sueldos, alquileres, etc." />
            <InputField label="Retenciones de IRE Previas" value={ireData.retencionesPrevias} onChange={v => setIreData({ ...ireData, retencionesPrevias: v })} prefix="₲" hint="Retenciones acreditables del ejercicio" />
          </div>

          {calculated && (
            <div className="bg-gray-900/50 border border-purple-500/20 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <ChevronDown className="h-5 w-5 text-purple-400 rotate-180" />
                </div>
                <h2 className="text-white font-semibold">Resultado — IRE</h2>
              </div>
              <div className="space-y-1">
                <ResultRow label="Base Imponible (Renta Neta)" value={ireResult.baseImponible} />
                <ResultRow label={`Alícuota (${ireResult.tasa}%)`} value={ireResult.impuestoBruto} />
                <ResultRow label="Retenciones previas" value={ireResult.retencionesPrevias} negative />
                <div className="border-t border-gray-700 pt-2">
                  <ResultRow label="IRE Neto a Pagar" value={ireResult.irePagar} bold highlight color="text-purple-300" />
                </div>
              </div>
              <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                  <p className="text-gray-400 text-xs">
                    El IRE se liquida en el Form. 1301 dentro de los 4 meses del cierre del ejercicio fiscal. Tasa: 30% para Renta Media (&gt;Gs. 500M), 25% para Renta Básica.
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
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-400" />
              <h2 className="text-white font-semibold">Datos para cálculo de IRP</h2>
            </div>
            <InputField label="Monto Bruto del Pago" value={irpData.montoBruto} onChange={v => setIrpData({ ...irpData, montoBruto: v })} prefix="₲" hint="Honorarios profesionales, alquileres, etc." />
            <InputField label="Retenciones Previas Acreditables" value={irpData.retencionesPrevias} onChange={v => setIrpData({ ...irpData, retencionesPrevias: v })} prefix="₲" />
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-3">
              <p className="text-[11px] text-amber-300">
                <strong>Alícuota IRP:</strong> 10% sobre el monto bruto del pago. El agente pagador retiene y entera mediante Form. 115.
              </p>
            </div>
          </div>

          {calculated && (
            <div className="bg-gray-900/50 border border-amber-500/20 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-400" /> Resultado — IRP
              </h2>
              <div className="space-y-1">
                <ResultRow label="Monto Bruto" value={irpResult.montoBruto} />
                <ResultRow label="Retención IRP (10%)" value={irpResult.retencion} />
                <ResultRow label="Retenciones previas" value={irpResult.retencionesPrevias} negative />
                <div className="border-t border-gray-700 pt-2">
                  <ResultRow label="Neto a Retener y Enterar" value={irpResult.neto} bold highlight color="text-amber-300" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Retenciones Calculator */}
      {activeTab === "retenciones" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-cyan-400" />
              <h2 className="text-white font-semibold">Calculadora de Retenciones</h2>
            </div>
            <InputField label="Base Imponible" value={retencionesData.base} onChange={v => setRetencionesData({ ...retencionesData, base: v })} prefix="₲" />
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Tipo de Retención / Alícuota</label>
              <select value={retencionesData.tasa} onChange={e => setRetencionesData({ ...retencionesData, tasa: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30">
                <option value="10">IRP 10% — Honorarios, alquileres, art. 29 Ley 6380</option>
                <option value="2">IRE 2% — Retención sobre ingresos brutos</option>
                <option value="1">IDU 1% — Dividendos / distribución de utilidades</option>
                <option value="6">IRACIS 6% — Régimen Simplificado</option>
                <option value="15">IRP 15% — Renta capital mobiliario</option>
              </select>
            </div>
          </div>

          {calculated && (
            <div className="bg-gray-900/50 border border-cyan-500/20 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-cyan-400" /> Resultado — Retención
              </h2>
              <div className="space-y-1">
                <ResultRow label="Base Imponible" value={retencionesResult.base} />
                <ResultRow label={`Tasa de Retención (${retencionesResult.tasa}%)`} value={retencionesResult.importe} bold highlight color="text-cyan-300" />
              </div>
              <div className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/50">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
                  <p className="text-gray-400 text-xs">
                    Las retenciones se declaran mensualmente mediante Form. 115. El agente de retención tiene 10 días hábiles del mes siguiente para enterar el monto.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Analysis Panel */}
      {aiAnalysis && (
        <AiAnalysisPanel analysis={aiAnalysis} onClose={() => setAiAnalysis(null)} />
      )}

      {/* Saved liquidations */}
      {savedList.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Save className="h-4 w-4 text-green-400" /> Liquidaciones Guardadas
          </h3>
          <div className="space-y-2">
            {savedList.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-800/40 border border-gray-800 rounded-xl">
                <div>
                  <p className="text-xs font-semibold text-white">{item.name}</p>
                  <p className="text-[10px] text-gray-500">{item.period} · {item.type.toUpperCase()}</p>
                </div>
                <span className="text-xs font-mono text-amber-300 font-bold">{formatGs(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Save Modal ───────────────────────────────────────────────────── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5 text-green-400" />
                <h3 className="text-sm font-bold text-white">Guardar Liquidación</h3>
              </div>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nombre de la Liquidación</label>
                <input value={savedName} onChange={e => setSavedName(e.target.value)}
                  placeholder={`Ej: ${currentTab.label} Mayo 2026`}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Período Fiscal</label>
                <input type="month" value={savedPeriod} onChange={e => setSavedPeriod(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 flex justify-between text-xs">
                <span className="text-gray-400">Total calculado ({currentTab.label})</span>
                <span className="font-mono font-bold text-white">{formatGs(getResultAmount())}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!savedName}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40">
                <Save className="h-4 w-4 inline mr-1.5" /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
