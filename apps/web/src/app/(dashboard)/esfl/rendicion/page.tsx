import React from "react";

export default function RendicionCgrPage() {
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">🏛️ Rendición de Cuentas — CGR / MEF</h1>
          <p className="text-sm text-slate-400">
            Formulario de Rendición de Fondos Públicos PGN (Contraloría General de la República de Paraguay)
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition">
            📥 Exportar Excel (.xlsx)
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm transition">
            📄 Generar PDF Oficial
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Total Ejecutado PGN</span>
          <span className="text-xl font-extrabold text-indigo-400 mt-1 block">PYG 1.250.000.000</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Gastos Exentos</span>
          <span className="text-xl font-extrabold text-emerald-400 mt-1 block">PYG 450.000.000</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Gastos Gravados Prorrateados</span>
          <span className="text-xl font-extrabold text-amber-400 mt-1 block">PYG 800.000.000</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Objetos del Gasto Rendidos</span>
          <span className="text-xl font-extrabold text-slate-200 mt-1 block">12 Rubros PGN</span>
        </div>
      </div>

      {/* Report Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-semibold text-slate-200 text-sm">Matriz de Trazabilidad: SIFEN CDC ➔ Asiento ➔ OG PGN</h2>
          <span className="text-xs text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
            Convenio: PGN-2026-MINISTERIO
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Comprobante</th>
                <th className="p-3">CDC SIFEN</th>
                <th className="p-3">RUC Proveedor</th>
                <th className="p-3">Razón Social</th>
                <th className="p-3">OG PGN</th>
                <th className="p-3">Concepto</th>
                <th className="p-3 text-right">Total (PYG)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="hover:bg-slate-800/50 transition">
                <td className="p-3">2026-07-20</td>
                <td className="p-3 font-mono">001-001-0004521</td>
                <td className="p-3 font-mono text-[10px] text-slate-400">440098127364...</td>
                <td className="p-3 font-mono">80012345-1</td>
                <td className="p-3">Transporte Yrendague S.A.</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-indigo-900/60 text-indigo-300 rounded font-mono">OG 210</span></td>
                <td className="p-3">Pasajes y Viáticos a comunidades rural</td>
                <td className="p-3 text-right font-semibold text-slate-100">15.000.000</td>
              </tr>
              <tr className="hover:bg-slate-800/50 transition">
                <td className="p-3">2026-07-22</td>
                <td className="p-3 font-mono">002-001-0001099</td>
                <td className="p-3 font-mono text-[10px] text-slate-400">440055123991...</td>
                <td className="p-3 font-mono">80098765-4</td>
                <td className="p-3">Insumos Sanitarios del Este SRL</td>
                <td className="p-3"><span className="px-2 py-0.5 bg-indigo-900/60 text-indigo-300 rounded font-mono">OG 340</span></td>
                <td className="p-3">Kits de Limpieza e Higiene PGN</td>
                <td className="p-3 text-right font-semibold text-slate-100">42.500.000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
