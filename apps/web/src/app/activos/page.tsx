"use client";

import { useState, useMemo } from "react";
import {
  Package, Plus, Calculator, TrendingDown, Calendar,
  Search, Edit, Trash, Eye, CheckCircle2, Clock, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FixedAsset {
  id: string;
  code: string;
  name: string;
  category: string;
  purchaseDate: string;
  cost: number;
  residualValue: number;
  lifeMonths: number;
  method: "linear" | "accelerated";
  monthlyDepreciation: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  status: "active" | "depreciated" | "sold";
  accountCode: string;
}

const MOCK_ASSETS: FixedAsset[] = [
  {
    id: "fa1", code: "AF-001", name: "Toyota Hilux 4x4", category: "Rodados",
    purchaseDate: "2024-01-15", cost: 150000000, residualValue: 15000000,
    lifeMonths: 60, method: "linear", monthlyDepreciation: 2250000,
    accumulatedDepreciation: 63000000, netBookValue: 87000000,
    status: "active", accountCode: "1.2.02",
  },
  {
    id: "fa2", code: "AF-002", name: "Notebooks Dell (x5)", category: "Equipos de Computación",
    purchaseDate: "2024-06-01", cost: 25000000, residualValue: 2500000,
    lifeMonths: 36, method: "linear", monthlyDepreciation: 625000,
    accumulatedDepreciation: 14375000, netBookValue: 10625000,
    status: "active", accountCode: "1.2.04",
  },
  {
    id: "fa3", code: "AF-003", name: "Mobiliario de oficina", category: "Muebles y Útiles",
    purchaseDate: "2023-03-01", cost: 35000000, residualValue: 3500000,
    lifeMonths: 120, method: "linear", monthlyDepreciation: 262500,
    accumulatedDepreciation: 9975000, netBookValue: 25025000,
    status: "active", accountCode: "1.2.03",
  },
  {
    id: "fa4", code: "AF-004", name: "Servidor HP ProLiant", category: "Equipos de Computación",
    purchaseDate: "2022-01-01", cost: 45000000, residualValue: 4500000,
    lifeMonths: 48, method: "accelerated", monthlyDepreciation: 937500,
    accumulatedDepreciation: 45000000, netBookValue: 0,
    status: "depreciated", accountCode: "1.2.04",
  },
  {
    id: "fa5", code: "AF-005", name: "Aire acondicionado central", category: "Instalaciones",
    purchaseDate: "2025-01-01", cost: 18000000, residualValue: 1800000,
    lifeMonths: 96, method: "linear", monthlyDepreciation: 168750,
    accumulatedDepreciation: 2700000, netBookValue: 15300000,
    status: "active", accountCode: "1.2.03",
  },
];

export default function ActivosFijosPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FixedAsset | null>(null);

  const filtered = useMemo(() =>
    MOCK_ASSETS.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  );

  const totalCosto = MOCK_ASSETS.reduce((s, a) => s + a.cost, 0);
  const totalDepreciacion = MOCK_ASSETS.reduce((s, a) => s + a.accumulatedDepreciation, 0);
  const totalVNR = MOCK_ASSETS.reduce((s, a) => s + a.netBookValue, 0);
  const depreciacionMensual = MOCK_ASSETS.filter(a => a.status === "active").reduce((s, a) => s + a.monthlyDepreciation, 0);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Activos Fijos</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Registro de bienes de uso y depreciación</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium no-tap-highlight">
          <Plus className="h-4 w-4" />
          Nuevo Activo
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi title="Costo Total" value={`Gs. ${(totalCosto / 1000000).toFixed(1)}M`} icon={Package} color="blue" />
        <Kpi title="Dep. Acumulada" value={`Gs. ${(totalDepreciacion / 1000000).toFixed(1)}M`} icon={TrendingDown} color="yellow" />
        <Kpi title="VNR Total" value={`Gs. ${(totalVNR / 1000000).toFixed(1)}M`} icon={Calculator} color="green" />
        <Kpi title="Dep. Mensual" value={`Gs. ${(depreciacionMensual / 1000000).toFixed(2)}M`} icon={Calendar} color="purple" />
      </div>

      {/* Assets Table */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar activo..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Código</th>
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Nombre</th>
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Categoría</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Costo</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Dep. Mensual</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Dep. Acum.</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">VNR</th>
                <th className="text-center px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {filtered.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => setSelected(asset)}
                  className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/20 cursor-pointer transition-colors",
                    selected?.id === asset.id && "bg-blue-50 dark:bg-blue-500/5"
                  )}
                >
                  <td className="px-3 py-2.5 font-mono text-gray-900 dark:text-white">{asset.code}</td>
                  <td className="px-3 py-2.5 text-gray-900 dark:text-white">{asset.name}</td>
                  <td className="px-3 py-2.5 text-gray-500">{asset.category}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {asset.cost.toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {asset.monthlyDepreciation.toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {asset.accumulatedDepreciation.toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-medium text-gray-900 dark:text-white">Gs. {asset.netBookValue.toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                      asset.status === "active" && "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
                      asset.status === "depreciated" && "bg-gray-100 dark:bg-gray-800 text-gray-500",
                      asset.status === "sold" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600"
                    )}>
                      {asset.status === "active" ? "Activo" : asset.status === "depreciated" ? "Depreciado" : "Vendido"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800/50">
          {filtered.map((asset) => (
            <div key={asset.id} onClick={() => setSelected(asset)} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-gray-900 dark:text-white">{asset.code}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded", asset.status === "active" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500")}>
                  {asset.status}
                </span>
              </div>
              <p className="text-sm text-gray-900 dark:text-white">{asset.name}</p>
              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                <span>{asset.category}</span>
                <span className="font-mono">VNR Gs. {(asset.netBookValue / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <AssetDetail asset={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function AssetDetail({ asset, onClose }: { asset: FixedAsset; onClose: () => void }) {
  const pctDepreciado = asset.cost > 0 ? (asset.accumulatedDepreciation / (asset.cost - asset.residualValue)) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">{asset.code} — {asset.name}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm no-tap-highlight">×</button>
      </div>
      <div className="p-3 sm:p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Meta label="Categoría" value={asset.category} />
          <Meta label="Fecha Compra" value={asset.purchaseDate} />
          <Meta label="Método" value={asset.method === "linear" ? "Línea Recta" : "Acelerado"} />
          <Meta label="Vida Útil" value={`${asset.lifeMonths} meses`} />
          <Meta label="Costo" value={`Gs. ${asset.cost.toLocaleString("es-PY")}`} />
          <Meta label="Valor Residual" value={`Gs. ${asset.residualValue.toLocaleString("es-PY")}`} />
          <Meta label="Dep. Mensual" value={`Gs. ${asset.monthlyDepreciation.toLocaleString("es-PY")}`} />
          <Meta label="Cta. Contable" value={asset.accountCode} />
        </div>

        {/* Depreciation Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Progreso de depreciación</span>
            <span className="font-mono text-gray-700 dark:text-gray-300">{pctDepreciado.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", pctDepreciado >= 100 ? "bg-green-500" : "bg-blue-500")}
              style={{ width: `${Math.min(100, pctDepreciado)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>Gs. 0</span>
            <span>Gs. {asset.netBookValue.toLocaleString("es-PY")}</span>
          </div>
        </div>

        {/* Journal Entry Suggestion */}
        <div className="bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-800/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Asiento de Depreciación Mensual</span>
          </div>
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between text-purple-700 dark:text-purple-300">
              <span>5.1.07 — Depreciación de Rodados</span>
              <span>D: Gs. {asset.monthlyDepreciation.toLocaleString("es-PY")}</span>
            </div>
            <div className="flex justify-between text-purple-600 dark:text-purple-400">
              <span>1.2.02 — Dep. Acum. Rodados</span>
              <span>C: Gs. {asset.monthlyDepreciation.toLocaleString("es-PY")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
    yellow: "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10",
    green: "text-green-500 bg-green-50 dark:bg-green-500/10",
    purple: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
  };
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{title}</span>
        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", colors[color])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 text-[10px]">{label}</span>
      <p className="text-gray-700 dark:text-gray-300 truncate">{value}</p>
    </div>
  );
}
