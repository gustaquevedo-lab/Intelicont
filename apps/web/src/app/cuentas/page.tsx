"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Hash,
  TrendingUp,
  Filter,
  ArrowUpDown,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountTree, AccountDetail } from "@/components/account-tree";
import { AccountModal } from "@/components/account-modal";
import {
  PY_CHART_OF_ACCOUNTS,
  buildAccountTree,
  flattenTree,
  findAccountByCode,
  getNatureLabel,
  formatBalance,
} from "@/lib/chart-of-accounts";
import type { ChartAccount } from "@/lib/chart-of-accounts";

export default function CuentasPage() {
  const accounts = useMemo(() => buildAccountTree(PY_CHART_OF_ACCOUNTS), []);
  const flatAccounts = useMemo(() => flattenTree(accounts), [accounts]);

  const [searchTerm, setSearchTerm] = useState("");
  const [natureFilter, setNatureFilter] = useState("all");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [allAccounts, setAllAccounts] = useState(PY_CHART_OF_ACCOUNTS);
  const treeAccounts = useMemo(() => buildAccountTree(allAccounts), [allAccounts]);

  const selectedAccount = selectedCode
    ? findAccountByCode(treeAccounts, selectedCode)
    : null;

  const stats = useMemo(() => {
    const total = flatAccounts.length;
    const groups = flatAccounts.filter((a) => !a.allowsPosting).length;
    const analytic = flatAccounts.filter((a) => a.allowsPosting).length;
    const totalAssets = flatAccounts
      .filter((a) => a.nature === "asset")
      .reduce((s, a) => s + a.balance, 0);
    const totalIncome = flatAccounts
      .filter((a) => a.nature === "income")
      .reduce((s, a) => s + a.balance, 0);
    const totalExpenses = flatAccounts
      .filter((a) => a.nature === "expense")
      .reduce((s, a) => s + a.balance, 0);
    return { total, groups, analytic, totalAssets, totalIncome, totalExpenses };
  }, [flatAccounts]);

  const handleSelect = useCallback((code: string) => {
    setSelectedCode((prev) => {
      if (prev === code) return null;
      return code;
    });
    setShowMobileDetail(true);
  }, []);

  const handleSave = (account: ChartAccount) => {
    setAllAccounts((prev) => {
      const existing = prev.find((a) => a.code === account.code);
      if (existing) {
        return prev.map((a) =>
          a.code === account.code ? { ...account, children: a.children } : a
        );
      }
      return [...prev, account];
    });
    setShowModal(false);
  };

  const handleEdit = (code: string) => {
    setModalMode("edit");
    setShowModal(true);
  };

  const handleCreateNew = () => {
    setModalMode("create");
    setShowModal(true);
  };

  const natureOptions = [
    { value: "all", label: "Todas", count: flatAccounts.length },
    { value: "asset", label: "Activos", count: flatAccounts.filter((a) => a.nature === "asset").length },
    { value: "liability", label: "Pasivos", count: flatAccounts.filter((a) => a.nature === "liability").length },
    { value: "equity", label: "Patrimonio", count: flatAccounts.filter((a) => a.nature === "equity").length },
    { value: "income", label: "Ingresos", count: flatAccounts.filter((a) => a.nature === "income").length },
    { value: "expense", label: "Gastos", count: flatAccounts.filter((a) => a.nature === "expense").length },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Plan de Cuentas</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Estructura contable — {stats.groups} grupos, {stats.analytic} analíticas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight">
            <ArrowUpDown className="h-4 w-4" />
            <span className="hidden sm:inline">Reordenar</span>
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors no-tap-highlight"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Cuenta</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Total Cuentas" value={stats.total.toString()} icon={Hash} />
        <StatCard title="Cuentas Grupo" value={stats.groups.toString()} icon={BookOpen} color="text-blue-500 dark:text-blue-400" />
        <StatCard title="Total Activos" value={`₲ ${(stats.totalAssets / 1000000).toFixed(1)}M`} icon={TrendingUp} color="text-emerald-500 dark:text-emerald-400" />
        <StatCard title="Ingresos vs Gastos" value={`${stats.totalIncome > stats.totalExpenses ? "+" : ""}₲ ${((stats.totalIncome - stats.totalExpenses) / 1000000).toFixed(1)}M`} icon={stats.totalIncome >= stats.totalExpenses ? TrendingUp : AlertTriangle} color="text-green-500 dark:text-green-400" />
      </div>

      {/* Search + Filters */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors border no-tap-highlight",
              showFilters || natureFilter !== "all"
                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {natureFilter !== "all" && (
              <span className="h-5 w-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                1
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-wrap gap-1.5">
              {natureOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNatureFilter(opt.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border no-tap-highlight",
                    natureFilter === opt.value
                      ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 font-medium"
                      : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {opt.label}
                  <span className={cn(
                    "text-[10px] font-mono",
                    natureFilter === opt.value ? "text-blue-400" : "text-gray-400"
                  )}>
                    {opt.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className={cn(
        "grid gap-4 sm:gap-6",
        selectedAccount ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
      )}>
        {/* Tree */}
        <div className={cn(selectedAccount ? "lg:col-span-2" : "")}>
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-gray-900 dark:text-white text-sm font-medium">Estructura de Cuentas</h3>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {flatAccounts.filter((a) =>
                  a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  a.code.includes(searchTerm)
                ).length} visibles
              </span>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <AccountTree
                accounts={treeAccounts}
                selectedCode={selectedCode}
                onSelect={handleSelect}
                searchTerm={searchTerm}
                natureFilter={natureFilter}
              />
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 text-xs flex items-center justify-between">
              <span>{flatAccounts.length} cuentas en total</span>
              <span className="hidden sm:flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">↑↓</kbd> navegar</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">↵</kbd> ver</span>
              </span>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedAccount && (
          <>
            {/* Mobile detail (overlay) */}
            <div className="lg:hidden fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileDetail(false)} />
              <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-950 shadow-xl overflow-y-auto p-3">
                <AccountDetail
                  account={selectedAccount}
                  onClose={() => setShowMobileDetail(false)}
                  onEdit={handleEdit}
                />
              </div>
            </div>

            {/* Desktop detail */}
            <div className="hidden lg:block lg:col-span-1">
              <AccountDetail
                account={selectedAccount}
                onClose={() => setSelectedCode(null)}
                onEdit={handleEdit}
              />
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <AccountModal
        open={showModal}
        mode={modalMode}
        accounts={allAccounts}
        editingAccount={selectedAccount || null}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-gray-500 dark:text-gray-400" }: { title: string; value: string; icon: any; color?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wide">{title}</span>
        <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", color)} />
      </div>
      <p className={cn("text-lg sm:text-xl lg:text-2xl font-bold tabular-nums", color)}>{value}</p>
    </div>
  );
}
