"use client";

import { useState } from "react";
import {
  Upload, FileText, CheckCircle2, AlertCircle, Download,
  Eye, Table, FileSpreadsheet, X, Plus, Sparkles,
  ArrowRight, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ImportType = "cuentas" | "terceros" | "asientos" | "facturas";

interface PreviewRow {
  row: number;
  data: Record<string, string>;
  valid: boolean;
  errors: string[];
}

const SAMPLE_DATA: Record<ImportType, { headers: string[]; rows: string[][] }> = {
  cuentas: {
    headers: ["code", "name", "nature", "allowsPosting"],
    rows: [["1.1.08", "Inversiones Temporales", "asset", "true"], ["2.1.07", "Préstamos Bancarios CP", "liability", "true"], ["4.1.04", "Ingresos Financieros", "income", "true"]],
  },
  terceros: {
    headers: ["ruc", "legalName", "kind", "email", "phone"],
    rows: [["80099999-0", "Nuevo Proveedor S.A.", "supplier", "info@nuevo.com.py", "+595 21 999 000"], ["7001234-5", "Cliente Ejemplo SRL", "customer", "cliente@ejemplo.com.py", ""]],
  },
  asientos: {
    headers: ["date", "description", "accountCode", "debit", "credit"],
    rows: [["2026-05-15", "Compra materiales", "1.2.01", "5000000", "0"], ["2026-05-15", "Compra materiales", "2.1.01", "0", "5000000"]],
  },
  facturas: {
    headers: ["number", "date", "ruc", "name", "gravado10", "iva10", "total"],
    rows: [["001-001-99999", "2026-05-15", "80012345-1", "Importadora del Este", "3000000", "300000", "3300000"]],
  },
};

export default function ImportWizardPage() {
  const [type, setType] = useState<ImportType>("cuentas");
  const [step, setStep] = useState<"select" | "preview" | "done">("select");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [imported, setImported] = useState(0);

  const handlePreview = () => {
    const sample = SAMPLE_DATA[type];
    const rows: PreviewRow[] = sample.rows.map((row, i) => {
      const data: Record<string, string> = {};
      const errors: string[] = [];
      sample.headers.forEach((h, j) => { data[h] = row[j] || ""; });
      if (type === "cuentas" && !data.code) errors.push("Código requerido");
      if (type === "terceros" && !data.ruc) errors.push("RUC requerido");
      return { row: i + 2, data, valid: errors.length === 0, errors };
    });
    setPreview(rows);
    setStep("preview");
  };

  const handleImport = () => {
    const valid = preview.filter(r => r.valid).length;
    setImported(valid);
    setStep("done");
  };

  const reset = () => { setStep("select"); setPreview([]); setImported(0); };

  const types = [
    { key: "cuentas" as ImportType, label: "Plan de Cuentas", icon: FileText },
    { key: "terceros" as ImportType, label: "Terceros", icon: FileText },
    { key: "asientos" as ImportType, label: "Asientos", icon: FileSpreadsheet },
    { key: "facturas" as ImportType, label: "Facturas", icon: FileSpreadsheet },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Importar Datos</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Importación masiva desde Excel/CSV con validación</p>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {["Seleccionar", "Previsualizar", "Importar"].map((label, i) => (
          <div key={label} className="flex items-center flex-1">
            <div className={cn("flex items-center gap-2",
              (i === 0 && step === "select") || (i === 1 && step === "preview") || (i === 2 && step === "done")
                ? "text-blue-600" : step === "done" || (i < ["select", "preview", "done"].indexOf(step)) ? "text-green-600" : "text-gray-400"
            )}>
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                step === "done" || (i < ["select", "preview", "done"].indexOf(step)) ? "bg-green-100 text-green-600" :
                (i === 0 && step === "select") || (i === 1 && step === "preview") ? "bg-blue-100 text-blue-600" : "bg-gray-100"
              )}>{i + 1}</div>
              <span className="text-xs font-medium hidden sm:inline">{label}</span>
            </div>
            {i < 2 && <div className={cn("flex-1 h-0.5 mx-2", step === "done" || i === 0 ? "bg-green-300" : "bg-gray-200")} />}
          </div>
        ))}
      </div>

      {step === "select" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {types.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setType(t.key)}
                  className={cn("flex items-center gap-3 p-4 rounded-xl border text-left no-tap-highlight",
                    type === t.key ? "border-blue-500 bg-blue-50 dark:bg-blue-500/5" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50"
                  )}>
                  <Icon className={cn("h-5 w-5", type === t.key ? "text-blue-500" : "text-gray-400")} />
                  <span className={cn("text-sm font-medium", type === t.key ? "text-blue-600" : "text-gray-700 dark:text-gray-300")}>{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-medium mb-2">Columnas esperadas: {SAMPLE_DATA[type].headers.join(", ")}</h3>
            <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Arrastrá un archivo .csv o .xlsx</p>
              <p className="text-[10px] text-gray-400 mt-1">o usá datos de demo</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={handlePreview}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium no-tap-highlight">
              <Eye className="h-4 w-4" /> Previsualizar
            </button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <>
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-medium">Vista previa — {preview.length} filas</h3>
              <span className={cn("text-xs", preview.some(r => !r.valid) ? "text-red-500" : "text-green-500")}>
                {preview.filter(r => r.valid).length} válidas, {preview.filter(r => !r.valid).length} con errores
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50">
                    <th className="px-3 py-2 text-left text-[10px] text-gray-500">#</th>
                    <th className="px-3 py-2 text-left text-[10px] text-gray-500">Estado</th>
                    {SAMPLE_DATA[type].headers.map(h => <th key={h} className="px-3 py-2 text-left text-[10px] text-gray-500">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {preview.map((r) => (
                    <tr key={r.row} className={cn(!r.valid && "bg-red-50/30 dark:bg-red-500/5")}>
                      <td className="px-3 py-2 text-gray-400">{r.row}</td>
                      <td className="px-3 py-2">{r.valid ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <AlertCircle className="h-3.5 w-3.5 text-red-500" />}</td>
                      {SAMPLE_DATA[type].headers.map(h => <td key={h} className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">{r.data[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setStep("select")} className="px-4 py-2.5 text-sm text-gray-500 no-tap-highlight">← Volver</button>
            <button onClick={handleImport} disabled={preview.every(r => !r.valid)}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-40 no-tap-highlight">
              Importar {preview.filter(r => r.valid).length} registros
            </button>
          </div>
        </>
      )}

      {step === "done" && (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Importación Exitosa</h2>
            <p className="text-sm text-gray-500 mt-1">{imported} registros importados correctamente</p>
          </div>
          <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium no-tap-highlight">
            Nueva Importación
          </button>
        </div>
      )}
    </div>
  );
}
