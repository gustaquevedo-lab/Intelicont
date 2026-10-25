"use client";

import { useState, useMemo } from "react";
import {
  Package, Plus, Calculator, TrendingDown, Calendar,
  Search, BarChart3, Loader2, Sparkles, X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/trpc/client";

interface FixedAsset {
  id: string;
  code: string;
  name: string;
  category: string;
  purchaseDate: string;
  cost: number;
  residualValue: number;
  usefulLifeMonths: number;
  method: string;
  status: string;
  monthlyDepreciation: number;
  annualDepreciation?: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  revaluedCost?: number;
  accountCode?: string;
}

const DEFAULT_MOCK_ASSETS: FixedAsset[] = [
  {
    id: "fa1", code: "AF-001", name: "Toyota Hilux 4x4", category: "Vehículos y Rodados",
    purchaseDate: "2024-01-15", cost: 150000000, residualValue: 15000000,
    usefulLifeMonths: 60, method: "linear", monthlyDepreciation: 2250000,
    accumulatedDepreciation: 63000000, netBookValue: 87000000,
    status: "active", accountCode: "1.2.02",
  },
  {
    id: "fa2", code: "AF-002", name: "Notebooks Dell (x5)", category: "Equipos de Computación",
    purchaseDate: "2024-06-01", cost: 25000000, residualValue: 2500000,
    usefulLifeMonths: 48, method: "linear", monthlyDepreciation: 468750,
    accumulatedDepreciation: 14062500, netBookValue: 10937500,
    status: "active", accountCode: "1.2.04",
  },
  {
    id: "fa3", code: "AF-003", name: "Mobiliario y Estantes de Oficina", category: "Muebles y Útiles",
    purchaseDate: "2023-03-01", cost: 35000000, residualValue: 3500000,
    usefulLifeMonths: 120, method: "linear", monthlyDepreciation: 262500,
    accumulatedDepreciation: 9975000, netBookValue: 25025000,
    status: "active", accountCode: "1.2.03",
  },
];

export default function ActivosFijosPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FixedAsset | null>(null);
  const [coeficienteBcp, setCoeficienteBcp] = useState<number>(1.0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New asset form state
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<"furniture" | "vehicles" | "machinery" | "computers" | "buildings" | "tools" | "installations" | "other">("vehicles");
  const [newCost, setNewCost] = useState(0);
  const [newResidual, setNewResidual] = useState(0);
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));

  const listQuery = api["fixed-assets"].list.useQuery(
    {
      entityId: entity?.id ?? "00000000-0000-0000-0000-000000000000",
      revaluationCoefficient: coeficienteBcp,
    },
    { enabled: !!entity?.id }
  );

  const createMutation = api["fixed-assets"].create.useMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      listQuery.refetch();
    },
  });

  const assets: FixedAsset[] = useMemo(() => {
    if (listQuery.data && listQuery.data.length > 0) {
      return listQuery.data.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        category: a.category,
        purchaseDate: a.purchaseDate,
        cost: a.cost,
        residualValue: a.residualValue,
        usefulLifeMonths: a.usefulLifeMonths,
        method: a.method,
        status: a.status,
        monthlyDepreciation: a.monthlyDepreciation,
        annualDepreciation: a.annualDepreciation,
        accumulatedDepreciation: a.accumulatedDepreciation,
        netBookValue: a.netBookValue,
        revaluedCost: a.revaluedCost,
      }));
    }
    return DEFAULT_MOCK_ASSETS;
  }, [listQuery.data]);

  const filtered = useMemo(() =>
    assets.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    ),
    [assets, search]
  );

  const totalCosto = assets.reduce((s, a) => s + (a.revaluedCost ?? a.cost), 0);
  const totalDepreciacion = assets.reduce((s, a) => s + a.accumulatedDepreciation, 0);
  const totalVNR = assets.reduce((s, a) => s + a.netBookValue, 0);
  const depreciacionMensual = assets.filter((a) => a.status === "active").reduce((s, a) => s + a.monthlyDepreciation, 0);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entity?.id || !newCode || !newName || newCost <= 0) return;
    createMutation.mutate({
      entityId: entity.id,
      code: newCode,
      name: newName,
      category: newCategory,
      purchaseDate: newDate,
      initialCost: newCost,
      residualValue: newResidual,
    });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Bienes de Uso y Activos Fijos</h1>
            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-medium border border-blue-500/20">
              RG 77/2020 IRE
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Inventario reglamentario, coeficientes de revalúo oficial BCP y amortización acumulada
            {entity && <> · {entity.tradeName || entity.legalName}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-lg text-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-gray-500 dark:text-gray-400">Revalúo BCP:</span>
            <select
              value={coeficienteBcp}
              onChange={(e) => setCoeficienteBcp(Number(e.target.value))}
              aria-label="Coeficiente de revalúo BCP"
              className="bg-transparent font-mono font-medium text-gray-900 dark:text-white focus:outline-none"
            >
              <option value="1.0">1.000 (Sin revalúo)</option>
              <option value="1.035">1.035 (3.5% IPC)</option>
              <option value="1.042">1.042 (4.2% Anual)</option>
              <option value="1.050">1.050 (5.0% BCP)</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium no-tap-highlight shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Bien de Uso
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi title="Costo Revaluado Total" value={`Gs. ${(totalCosto / 1000000).toFixed(1)}M`} icon={Package} color="blue" />
        <Kpi title="Dep. Acumulada" value={`Gs. ${(totalDepreciacion / 1000000).toFixed(1)}M`} icon={TrendingDown} color="yellow" />
        <Kpi title="Valor Neto Fiscal (VNR)" value={`Gs. ${(totalVNR / 1000000).toFixed(1)}M`} icon={Calculator} color="green" />
        <Kpi title="Depreciación Mensual" value={`Gs. ${(depreciacionMensual / 1000000).toFixed(2)}M`} icon={Calendar} color="purple" />
      </div>

      {/* Assets Table */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar bien de uso por código, nombre o categoría..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
            />
          </div>
          {listQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Código</th>
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Nombre</th>
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Categoría</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Costo Histórico</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Dep. Mensual</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Dep. Acumulada</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Valor Fiscal Neto</th>
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
                  <td className="px-3 py-2.5 text-gray-900 dark:text-white font-medium">{asset.name}</td>
                  <td className="px-3 py-2.5 text-gray-500">{asset.category}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {asset.cost.toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {asset.monthlyDepreciation.toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {asset.accumulatedDepreciation.toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-medium text-blue-600 dark:text-blue-400">Gs. {asset.netBookValue.toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                      asset.status === "active" && "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
                      asset.status === "depreciated" && "bg-gray-100 dark:bg-gray-800 text-gray-500",
                      asset.status === "disposed" && "bg-red-50 dark:bg-red-500/10 text-red-600"
                    )}>
                      {asset.status === "active" ? "Activo" : asset.status === "depreciated" ? "Amortizado 100%" : "Dado de baja"}
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
              <p className="text-sm text-gray-900 dark:text-white font-medium">{asset.name}</p>
              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                <span>{asset.category}</span>
                <span className="font-mono text-blue-500">VNR Gs. {(asset.netBookValue / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nuevo Activo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Registrar Bien de Uso (RG 77/2020)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateAsset} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Código Interno</label>
                  <input
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="AF-001"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Categoría Oficial</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="vehicles">Rodados / Vehículos (5 años - 20%)</option>
                    <option value="computers">Equipos de Computación (4 años - 25%)</option>
                    <option value="furniture">Muebles y Útiles (10 años - 10%)</option>
                    <option value="machinery">Maquinarias (10 años - 10%)</option>
                    <option value="buildings">Edificaciones (40 años - 2.5%)</option>
                    <option value="installations">Instalaciones (10 años - 10%)</option>
                    <option value="tools">Herramientas (5 años - 20%)</option>
                    <option value="other">Otros Bienes (5 años - 20%)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Nombre o Descripción</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Camioneta Isuzu D-Max 2024"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Fecha de Compra</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Costo Histórico (Gs.)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newCost || ""}
                    onChange={(e) => setNewCost(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Valor Residual (Gs.)</label>
                  <input
                    type="number"
                    min="0"
                    value={newResidual || ""}
                    onChange={(e) => setNewResidual(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-1.5"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar Bien de Uso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <AssetDetail asset={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function AssetDetail({ asset, onClose }: { asset: FixedAsset; onClose: () => void }) {
  const depreciable = asset.cost - asset.residualValue;
  const pctDepreciado = depreciable > 0 ? (asset.accumulatedDepreciation / depreciable) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
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
          <Meta label="Método" value="Línea Recta (RG 77)" />
          <Meta label="Vida Útil" value={`${asset.usefulLifeMonths} meses`} />
          <Meta label="Costo" value={`Gs. ${asset.cost.toLocaleString("es-PY")}`} />
          <Meta label="Valor Residual" value={`Gs. ${asset.residualValue.toLocaleString("es-PY")}`} />
          <Meta label="Dep. Mensual" value={`Gs. ${asset.monthlyDepreciation.toLocaleString("es-PY")}`} />
          <Meta label="Valor Neto Fiscal" value={`Gs. ${asset.netBookValue.toLocaleString("es-PY")}`} />
        </div>

        {/* Depreciation Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">Progreso de amortización</span>
            <span className="font-mono text-gray-700 dark:text-gray-300">{pctDepreciado.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", pctDepreciado >= 100 ? "bg-green-500" : "bg-blue-500")}
              style={{ width: `${Math.min(100, pctDepreciado)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>Amortizado: Gs. {asset.accumulatedDepreciation.toLocaleString("es-PY")}</span>
            <span>VNR: Gs. {asset.netBookValue.toLocaleString("es-PY")}</span>
          </div>
        </div>

        {/* Journal Entry Suggestion */}
        <div className="bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-800/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Asiento Contable de Depreciación Sugerido</span>
          </div>
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between text-purple-700 dark:text-purple-300">
              <span>5.1.07 — Gasto por Depreciación de Bienes de Uso</span>
              <span>D: Gs. {asset.monthlyDepreciation.toLocaleString("es-PY")}</span>
            </div>
            <div className="flex justify-between text-purple-600 dark:text-purple-400">
              <span>1.2.02 — Depreciación Acumulada (Regularizadora de Activo)</span>
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
