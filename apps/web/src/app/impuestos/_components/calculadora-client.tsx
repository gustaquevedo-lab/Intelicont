"use client";

import { useState, useMemo } from "react";
import {
  Calculator, ChevronDown, Info, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gs(n: number) {
  return Math.round(n).toLocaleString("es-PY");
}

function parseNum(s: string): number {
  return parseFloat(s.replace(/[^\d.]/g, "")) || 0;
}

function NumInput({
  label, value, onChange, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder="0"
        className="input-field font-mono"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function ResultRow({ label, value, bold, indent, highlight }: {
  label: string;
  value: string;
  bold?: boolean;
  indent?: boolean;
  highlight?: "green" | "red" | "blue";
}) {
  return (
    <div className={cn(
      "flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800",
      indent && "pl-4",
      highlight === "green" && "bg-green-50 dark:bg-green-900/10 rounded px-3",
      highlight === "red"   && "bg-red-50 dark:bg-red-900/10 rounded px-3",
      highlight === "blue"  && "bg-blue-50 dark:bg-blue-900/10 rounded px-3",
    )}>
      <span className={cn(
        "text-sm",
        bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400",
      )}>
        {label}
      </span>
      <span className={cn(
        "font-mono text-sm tabular-nums",
        bold ? "font-bold text-gray-900 dark:text-white" : "text-gray-800 dark:text-gray-200",
        highlight === "green" && "text-green-700 dark:text-green-300",
        highlight === "red"   && "text-red-700 dark:text-red-300",
        highlight === "blue"  && "text-blue-700 dark:text-blue-300",
      )}>
        {value}
      </span>
    </div>
  );
}

// ─── IVA Tab ──────────────────────────────────────────────────────────────────

function IVATab() {
  const [monto,       setMonto]       = useState("");
  const [tasa,        setTasa]        = useState<"10" | "5" | "exento">("10");
  const [tipoMonto,   setTipoMonto]   = useState<"neto" | "total">("neto");

  const result = useMemo(() => {
    const m = parseNum(monto);
    if (!m) return null;

    if (tasa === "exento") {
      return { neto: m, iva: 0, total: m, rate: 0 };
    }

    const rate = tasa === "10" ? 0.10 : 0.05;

    if (tipoMonto === "neto") {
      const iva   = m * rate;
      const total = m + iva;
      return { neto: m, iva, total, rate };
    } else {
      const neto  = m / (1 + rate);
      const iva   = m - neto;
      return { neto, iva, total: m, rate };
    }
  }, [monto, tasa, tipoMonto]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NumInput
          label="Monto"
          value={monto}
          onChange={setMonto}
          hint={tipoMonto === "neto" ? "Monto sin IVA" : "Monto con IVA incluido"}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tipo de monto</label>
          <div className="flex rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            {([["neto", "Sin IVA"], ["total", "Con IVA"]] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTipoMonto(v)}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold transition-colors",
                  tipoMonto === v
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tasa IVA</label>
          <div className="flex rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            {([["10", "10%"], ["5", "5%"], ["exento", "Exento"]] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setTasa(v)}
                className={cn(
                  "flex-1 py-2 text-sm font-semibold transition-colors",
                  tasa === v
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {result && (
        <div className="card p-5 space-y-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Resultado</h3>
          <ResultRow label="Base imponible (neto)" value={`₲ ${gs(result.neto)}`} />
          <ResultRow
            label={`IVA ${result.rate * 100}%`}
            value={`₲ ${gs(result.iva)}`}
            highlight="blue"
          />
          <ResultRow label="Total (con IVA)" value={`₲ ${gs(result.total)}`} bold highlight="green" />

          {result.rate > 0 && (
            <div className="pt-3 mt-2 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
              <p>Fórmula: base × {result.rate * 100}% = IVA</p>
              <p>Proporción IVA/Total: {((result.iva / result.total) * 100).toFixed(2)}%</p>
            </div>
          )}
        </div>
      )}

      <div className="card-flat p-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Tasas vigentes IVA Paraguay (Ley 125/91 y modificaciones)</p>
        <p>• <strong>10%</strong> — Servicios en general, importaciones, bienes no incluidos en 5%</p>
        <p>• <strong>5%</strong> — Productos de la canasta básica, medicamentos, venta de inmuebles, arrendamiento</p>
        <p>• <strong>Exento</strong> — Exportaciones, ciertos servicios educativos, transferencias de divisas</p>
      </div>
    </div>
  );
}

// ─── IRE Tab ──────────────────────────────────────────────────────────────────

function IRETab() {
  const [ingresos,   setIngresos]   = useState("");
  const [egresos,    setEgresos]    = useState("");
  const [regime,     setRegime]     = useState<"general" | "simple" | "resignple">("general");

  const result = useMemo(() => {
    const ing = parseNum(ingresos);
    const egr = parseNum(egresos);
    if (!ing) return null;

    const renta = Math.max(0, ing - egr);

    if (regime === "general") {
      // IRE General: 10% sobre renta neta (25% tope empresas vinculadas → ignorado aquí)
      const tasa = 0.10;
      return { ing, egr, renta, tasa, impuesto: renta * tasa, label: "IRE General (tasa 10%)" };
    }

    if (regime === "simple") {
      // IRE SIMPLE: ingresos <= Gs 2.000M anuales (≈ US$270k)
      // Tasa: 8% sobre renta neta; si renta < 0 → 0
      const tasa = 0.08;
      return { ing, egr, renta, tasa, impuesto: renta * tasa, label: "IRE SIMPLE (tasa 8%)" };
    }

    // ReSiMPle: ingresos <= Gs 500M anuales; tasa 2.5% sobre INGRESOS (no renta)
    const tasa = 0.025;
    return { ing, egr, renta, tasa, impuesto: ing * tasa, label: "ReSiMPle (2.5% sobre ingresos brutos)" };
  }, [ingresos, egresos, regime]);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Régimen IRE</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            ["general",   "IRE General",  "Ingresos > ₲ 2.000 M"],
            ["simple",    "IRE SIMPLE",   "Ingresos ≤ ₲ 2.000 M"],
            ["resignple", "ReSiMPle",     "Ingresos ≤ ₲ 500 M"],
          ] as const).map(([v, l, hint]) => (
            <button
              key={v}
              onClick={() => setRegime(v)}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition-all",
                regime === v
                  ? "border-primary bg-primary-50 dark:bg-primary/10"
                  : "border-gray-100 dark:border-slate-700 hover:border-gray-200"
              )}
            >
              <p className={cn("text-sm font-bold", regime === v ? "text-primary" : "text-gray-900 dark:text-white")}>{l}</p>
              <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumInput
          label="Ingresos del ejercicio (₲)"
          value={ingresos}
          onChange={setIngresos}
          hint="Total ingresos gravados del año fiscal"
        />
        {regime !== "resignple" && (
          <NumInput
            label="Egresos deducibles (₲)"
            value={egresos}
            onChange={setEgresos}
            hint="Costos y gastos vinculados al giro"
          />
        )}
      </div>

      {result && (
        <div className="card p-5 space-y-1">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">{result.label}</h3>
          <ResultRow label="Ingresos brutos" value={`₲ ${gs(result.ing)}`} />
          {regime !== "resignple" && (
            <>
              <ResultRow label="Egresos deducibles" value={`₲ ${gs(result.egr)}`} />
              <ResultRow label="Renta neta imponible" value={`₲ ${gs(result.renta)}`} />
            </>
          )}
          <ResultRow
            label={`Tasa ${result.tasa * 100}%`}
            value={`${result.tasa * 100}%`}
            highlight="blue"
          />
          <ResultRow
            label="IRE estimado a pagar"
            value={`₲ ${gs(result.impuesto)}`}
            bold
            highlight={result.impuesto > 0 ? "red" : "green"}
          />
        </div>
      )}

      <div className="card-flat p-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> IRE — Impuesto a la Renta Empresarial (Ley 6380/19)</p>
        <p>• <strong>IRE General:</strong> tasa 10% sobre renta neta. Sin límite de ingresos.</p>
        <p>• <strong>IRE SIMPLE:</strong> tasa 8%. Hasta ₲ 2.000 M de ingresos anuales.</p>
        <p>• <strong>ReSiMPle:</strong> tasa 2.5% sobre ingresos brutos. Hasta ₲ 500 M. Contabilidad simplificada.</p>
        <p>• Todos los regímenes tienen vencimiento anual en Formulario 101 (presentación: abril/mayo).</p>
      </div>
    </div>
  );
}

// ─── Retenciones Tab ─────────────────────────────────────────────────────────

function RetencionesTab() {
  const [monto, setMonto] = useState("");
  const [tipo,  setTipo]  = useState<"iva_10" | "iva_5" | "ire_pagos" | "ire_honorarios">("iva_10");

  const TIPOS = [
    { id: "iva_10",        label: "IVA 10% (30%)",       tasa: 0.03,   desc: "30% del IVA → 3% del neto" },
    { id: "iva_5",         label: "IVA 5% (30%)",        tasa: 0.015,  desc: "30% del IVA → 1.5% del neto" },
    { id: "ire_pagos",     label: "IRE Pagos al Estado", tasa: 0.015,  desc: "1.5% sobre pagos al estado (Art. 34)" },
    { id: "ire_honorarios",label: "IRE Honorarios",      tasa: 0.02,   desc: "2% sobre honorarios profesionales" },
  ] as const;

  const selected = TIPOS.find((t) => t.id === tipo)!;

  const result = useMemo(() => {
    const m = parseNum(monto);
    if (!m) return null;
    const retencion = m * selected.tasa;
    const pago      = m - retencion;
    return { monto: m, retencion, pago, tasa: selected.tasa };
  }, [monto, selected]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tipo de retención</label>
          <div className="space-y-2">
            {TIPOS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all",
                  tipo === t.id
                    ? "border-primary bg-primary-50 dark:bg-primary/10"
                    : "border-gray-100 dark:border-slate-700 hover:border-gray-200"
                )}
              >
                <div className={cn(
                  "h-3 w-3 rounded-full mt-0.5 shrink-0 border-2",
                  tipo === t.id ? "border-primary bg-primary" : "border-gray-300"
                )} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</p>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <NumInput
            label="Monto del comprobante (₲)"
            value={monto}
            onChange={setMonto}
            hint="Monto total gravado (incluido IVA)"
          />

          {result && (
            <div className="card p-5 space-y-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Comprobante de Retención</h3>
              <ResultRow label="Monto total" value={`₲ ${gs(result.monto)}`} />
              <ResultRow
                label={`Retención (${(result.tasa * 100).toFixed(1)}%)`}
                value={`₲ ${gs(result.retencion)}`}
                highlight="red"
                bold
              />
              <ResultRow
                label="Pago al proveedor (neto)"
                value={`₲ ${gs(result.pago)}`}
                bold
                highlight="green"
              />
              <div className="pt-3 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-400">
                Informar al DNIT en Formulario 120 (Tesaka)
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card-flat p-4 space-y-2 text-xs text-gray-500 dark:text-gray-400">
        <p className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Info className="h-3.5 w-3.5" /> Retenciones en Paraguay (Ley 6380/19 y RG DNIT)</p>
        <p>• Agentes de retención: contribuyentes habilitados por DNIT, empresas del estado, unipersonales con RUC.</p>
        <p>• El comprobante de retención debe emitirse dentro de los 5 días hábiles del pago.</p>
        <p>• Los retenidos pueden imputar como crédito fiscal en sus declaraciones.</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS = [
  { id: "iva",         label: "IVA"          },
  { id: "ire",         label: "IRE"          },
  { id: "retenciones", label: "Retenciones"  },
] as const;

export function CalculadoraClient() {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("iva");

  return (
    <div className="page-container max-w-3xl">
      <div>
        <h1 className="section-title text-2xl lg:text-3xl flex items-center gap-3">
          <Calculator className="h-7 w-7" /> Calculadora de Impuestos
        </h1>
        <p className="section-subtitle">IVA, IRE y Retenciones · Paraguay (Ley 6380/19)</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all",
              tab === t.id
                ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="card p-6">
        {tab === "iva"         && <IVATab />}
        {tab === "ire"         && <IRETab />}
        {tab === "retenciones" && <RetencionesTab />}
      </div>
    </div>
  );
}
