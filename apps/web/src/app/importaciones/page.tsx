"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Ship, Plus, RefreshCw, CheckCircle2, Loader2,
  Calendar, Anchor, FileText, AlertCircle, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { loadImportClearances, createImportClearance } from "../fiscal/actions-avanzadas";

export default function ImportacionesPage() {
  const selectedEntity = useAuthStore((state) => state.selectedEntity);
  const [clearances, setClearances] = useState<any[]>([]);
  
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<string | null>(null);

  // Forms
  const [showModal, setShowModal] = useState(false);
  const [clearanceNumber, setClearanceNumber] = useState("");
  const [clearanceDate, setClearanceDate] = useState(new Date().toISOString().split("T")[0]);
  const [fobValue, setFobValue] = useState(0);
  const [freightValue, setFreightValue] = useState(0);
  const [insuranceValue, setInsuranceValue] = useState(0);
  const [customsTax, setCustomsTax] = useState(0);
  const [ivaAduana, setIvaAduana] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const fetchClearances = () => {
    if (!selectedEntity?.id) return;
    startTransition(async () => {
      const res = await loadImportClearances(selectedEntity.id);
      if (res.ok) setClearances(res.data);
    });
  };

  useEffect(() => {
    fetchClearances();
  }, [selectedEntity]);

  const handleCreate = () => {
    if (!selectedEntity?.id || !clearanceNumber) return;
    startTransition(async () => {
      const res = await createImportClearance(
        selectedEntity.id,
        clearanceNumber,
        clearanceDate,
        fobValue,
        freightValue,
        insuranceValue,
        customsTax,
        ivaAduana,
        [] // no local invoices linked in mock environment for simplicity
      );
      if (res.ok) {
        setShowModal(false);
        setClearanceNumber("");
        setFobValue(0);
        setFreightValue(0);
        setInsuranceValue(0);
        setCustomsTax(0);
        setIvaAduana(0);
        setLogs(`✓ Despacho Contable N° ${clearanceNumber} procesado e integrado al Libro Diario.`);
        fetchClearances();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <Ship className="h-7 w-7 text-primary" /> Despachos de Importación
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Carga de costo de importación (CIF), liquidación aduanera y prorrateo de costos locales.
          </p>
        </div>

        <div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Nuevo Despacho
          </button>
        </div>
      </div>

      {logs && (
        <div className="bg-green-950/20 border border-green-800/40 rounded-2xl p-5 space-y-2 animate-in slide-in-from-bottom-2">
          <h3 className="text-xs font-bold text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Despacho Procesado con Éxito
          </h3>
          <p className="text-xs text-gray-300 font-mono">
            {logs}
          </p>
        </div>
      )}

      {/* Clearances Table */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/20">
          <h3 className="text-sm font-bold text-white">Historial de Despachos</h3>
          <span className="text-xs text-gray-500 font-medium">{clearances.length} despachos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/30 text-gray-400 font-bold uppercase tracking-wider">
                <th className="p-3">Fecha</th>
                <th className="p-3">Nro Despacho</th>
                <th className="p-3 text-right">FOB (CIF)</th>
                <th className="p-3 text-right">Gravamen Aduana</th>
                <th className="p-3 text-right">IVA Aduana</th>
                <th className="p-3 text-right">Total Costo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300">
              {clearances.map((c, idx) => {
                const totalCost = parseFloat(c.fobValue) + parseFloat(c.freightValue) + parseFloat(c.insuranceValue) + parseFloat(c.customsTax);
                return (
                  <tr key={idx} className="hover:bg-gray-800/10">
                    <td className="p-3 font-mono">{new Date(c.date).toLocaleDateString("es-PY")}</td>
                    <td className="p-3 font-mono">{c.clearanceNumber}</td>
                    <td className="p-3 text-right font-mono">Gs. {Math.round(parseFloat(c.fobValue)).toLocaleString("es-PY")}</td>
                    <td className="p-3 text-right font-mono">Gs. {Math.round(parseFloat(c.customsTax)).toLocaleString("es-PY")}</td>
                    <td className="p-3 text-right font-mono text-blue-400">Gs. {Math.round(parseFloat(c.ivaAduana)).toLocaleString("es-PY")}</td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      Gs. {Math.round(totalCost).toLocaleString("es-PY")}
                    </td>
                  </tr>
                );
              })}
              {clearances.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No hay despachos de importación cargados en el ejercicio.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Clearance Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Cargar Liquidación de Despacho</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Fecha Liquidación</label>
                  <input
                    type="date"
                    value={clearanceDate}
                    onChange={(e) => setClearanceDate(e.target.value)}
                    className="w-full input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nro Despacho</label>
                  <input
                    type="text"
                    value={clearanceNumber}
                    onChange={(e) => setClearanceNumber(e.target.value)}
                    placeholder="26013DSP000123"
                    className="w-full input-field text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Valor FOB (Gs.)</label>
                  <input
                    type="number"
                    value={fobValue}
                    onChange={(e) => setFobValue(Number(e.target.value))}
                    className="w-full input-field text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Flete Internacional</label>
                  <input
                    type="number"
                    value={freightValue}
                    onChange={(e) => setFreightValue(Number(e.target.value))}
                    className="w-full input-field text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Seguro (Gs.)</label>
                  <input
                    type="number"
                    value={insuranceValue}
                    onChange={(e) => setInsuranceValue(Number(e.target.value))}
                    className="w-full input-field text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Gravamen / Tasa Aduana</label>
                  <input
                    type="number"
                    value={customsTax}
                    onChange={(e) => setCustomsTax(Number(e.target.value))}
                    className="w-full input-field text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">IVA Aduana Pagado (Gs.)</label>
                <input
                  type="number"
                  value={ivaAduana}
                  onChange={(e) => setIvaAduana(Number(e.target.value))}
                  className="w-full input-field text-sm font-mono font-bold text-blue-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <button onClick={() => setShowModal(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleCreate} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">
                Procesar Despacho
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
