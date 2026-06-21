"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Upload, FileText, CheckCircle, AlertCircle, RefreshCw,
  Loader2, ChevronDown, CheckCircle2, FileUp, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadEntidadesParaFiscal, importMarangatuCsv, importSifenXml } from "../actions";

export default function ImportarFiscalPage() {
  const [entities, setEntities] = useState<Array<{ id: string; legalName: string; ruc: string }>>([]);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [importType, setImportType] = useState<"compras" | "ventas" | "retenciones" | "sifen">("compras");
  
  const [isPending, startTransition] = useTransition();
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [results, setResults] = useState<{
    imported: number;
    duplicates: number;
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const res = await loadEntidadesParaFiscal();
      if (res.ok && res.data.length > 0) {
        setEntities(res.data);
        setSelectedEntity(res.data[0].id);
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target?.result as string);
    };
    reader.onerror = () => {
      setError("Error leyendo el archivo. Por favor, intentá de nuevo.");
    };
    reader.readAsText(file);
  };

  const handleProcess = () => {
    if (!selectedEntity || !fileContent) return;
    setError(null);
    setResults(null);

    startTransition(async () => {
      if (importType === "sifen") {
        const res = await importSifenXml(selectedEntity, fileContent);
        if (res.ok) {
          setResults({ imported: 1, duplicates: 0, message: res.data });
        } else {
          setError(res.error);
        }
      } else {
        const res = await importMarangatuCsv(selectedEntity, fileContent, importType);
        if (res.ok) {
          setResults({
            imported: res.data.importedCount,
            duplicates: res.data.duplicateCount
          });
        } else {
          setError(res.error);
        }
      }
    });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
          <FileUp className="h-7 w-7 text-primary" /> Importador Fiscal Universal
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Subí planillas CSV de Marangatú o facturas XML electrónicas de SIFEN para asentar transacciones en lote.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Setup */}
        <div className="md:col-span-1 space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Configuración</h2>
            
            <div>
              <label className="block text-xs font-semibold text-gray-450 mb-1.5">Empresa</label>
              <div className="relative">
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="w-full appearance-none input-field pr-8 cursor-pointer"
                >
                  <option value="">Seleccionar empresa</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>{e.legalName}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-455 mb-1.5">Formato de Archivo</label>
              <div className="space-y-2">
                {[
                  { key: "compras", label: "Libro Compras (Marangatú CSV)" },
                  { key: "ventas", label: "Libro Ventas (Marangatú CSV)" },
                  { key: "retenciones", label: "Retenciones Recibidas (Marangatú CSV)" },
                  { key: "sifen", label: "Factura Electrónica (SIFEN XML)" },
                ].map((t) => (
                  <label key={t.key} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="importType"
                      checked={importType === t.key}
                      onChange={() => {
                        setImportType(t.key as any);
                        setFileContent(null);
                        setFileName(null);
                        setResults(null);
                      }}
                      className="rounded"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Dropzone & Results */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-6 flex flex-col items-center justify-center border-dashed border-2 border-gray-800 hover:border-gray-700 transition-colors py-12 text-center relative overflow-hidden">
            <input
              type="file"
              accept={importType === "sifen" ? ".xml" : ".csv"}
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-gray-200">
              {fileName ? fileName : "Arrastrá tu archivo o hacé clic para buscar"}
            </p>
            <p className="text-xs text-gray-400 mt-1.5">
              Formatos soportados: {importType === "sifen" ? ".xml" : ".csv"} (Codificación UTF-8)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              disabled={!fileContent || isPending}
              onClick={handleProcess}
              className="btn-secondary flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-bold"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {isPending ? "Procesando lote..." : "Procesar e Importar"}
            </button>
          </div>

          {/* Results Summary */}
          {results && (
            <div className="bg-gray-900/40 border border-green-800/40 rounded-2xl p-5 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-sm font-bold text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5" /> Importación Finalizada con Éxito
              </h3>
              {results.message ? (
                <p className="text-xs text-gray-300 font-medium leading-relaxed bg-gray-950/40 p-4 rounded-xl border border-green-950">
                  {results.message}
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-xs text-gray-400">Comprobantes Importados</p>
                    <p className="text-2xl font-black text-white font-mono mt-1">{results.imported}</p>
                  </div>
                  <div className="bg-gray-950/40 p-4 rounded-xl border border-gray-800 text-center">
                    <p className="text-xs text-gray-400">Duplicados Omitidos</p>
                    <p className="text-2xl font-black text-gray-405 font-mono mt-1">{results.duplicates}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Summary */}
          {error && (
            <div className="bg-red-950/15 border border-red-800/40 rounded-2xl p-5 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-5 w-5" /> Inconsistencia de Datos o Error
              </h3>
              <p className="text-xs text-red-300 font-medium leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* Info Banner */}
          <div className="card-flat p-4 flex items-start gap-3 text-xs text-gray-400">
            <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
            <p>
              <strong>AI Auto-asiento:</strong> Cada comprobante importado se categorizará de forma automática contra la cuenta del mayor sugerida y registrará el correspondiente IVA Débito o IVA Crédito Fiscal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
