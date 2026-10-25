"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, AlertTriangle, CheckCircle2, Clock, Search,
  ArrowRight, Shield, Download, FileText, Filter, Users,
  Loader2, RefreshCw, ChevronRight, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";

interface ClientPortfolioItem {
  id: string;
  ruc: string;
  legalName: string;
  tradeName?: string | null;
  plan?: string | null;
  role?: string | null;
  period: string;
  dueDate: string;
  daysLeft: number;
  status: "ok" | "warning" | "overdue";
  documentsCount: number;
  ivaStatus: "ready" | "pending";
  rg90Status: "generated" | "pending";
}

export default function EstudioContablePage() {
  const router = useRouter();
  const selectEntity = useAuthStore((s) => s.selectEntity);
  const selectedEntity = useAuthStore((s) => s.selectedEntity);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "urgent" | "ok">("all");

  const portfolioQuery = api.firm.portfolioStatus.useQuery(undefined, {
    staleTime: 30_000,
  });

  const clients: ClientPortfolioItem[] = (portfolioQuery.data?.clients as ClientPortfolioItem[]) ?? [];
  const summary = portfolioQuery.data?.summary ?? {
    totalClients: 0,
    overdue: 0,
    warning: 0,
    ok: 0,
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c: ClientPortfolioItem) => {
      const matchesSearch =
        c.legalName.toLowerCase().includes(search.toLowerCase()) ||
        (c.tradeName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        c.ruc.includes(search);

      if (!matchesSearch) return false;
      if (filter === "urgent") return c.status === "overdue" || c.status === "warning";
      if (filter === "ok") return c.status === "ok";
      return true;
    });
  }, [clients, search, filter]);

  const handleSelectClient = (client: ClientPortfolioItem) => {
    selectEntity({
      id: client.id,
      ruc: client.ruc,
      legalName: client.legalName,
      tradeName: client.tradeName ?? null,
      baseCurrency: "PYG",
    });
    router.push("/asientos");
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
              Administrador de Estudio Contable (AEC)
            </h1>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-medium border border-emerald-500/20">
              Modo Despacho
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Monitoreo centralizado de cartera de clientes, calendario de vencimientos DNIT y obligaciones tributarias
          </p>
        </div>
        <button
          type="button"
          onClick={() => portfolioQuery.refetch()}
          disabled={portfolioQuery.isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", portfolioQuery.isFetching && "animate-spin")} />
          Actualizar Cartera
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Empresas en Cartera</span>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 text-blue-500">
              <Building2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{summary.totalClients}</p>
        </div>

        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Al Día (DNIT)</span>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{summary.ok}</p>
        </div>

        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Próximos a Vencer (≤ 3d)</span>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 text-amber-500">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{summary.warning}</p>
        </div>

        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Vencidos / Urgentes</span>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-500">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{summary.overdue}</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        {/* Filters and search */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por RUC o Razón Social..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors",
                filter === "all" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Todos ({clients.length})
            </button>
            <button
              onClick={() => setFilter("urgent")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors",
                filter === "urgent" ? "bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-xs" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Urgentes ({summary.overdue + summary.warning})
            </button>
            <button
              onClick={() => setFilter("ok")}
              className={cn(
                "px-2.5 py-1 rounded-md font-medium transition-colors",
                filter === "ok" ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs" : "text-gray-500 hover:text-gray-900"
              )}
            >
              Al Día ({summary.ok})
            </button>
          </div>
        </div>

        {/* Clients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                <th className="text-left px-3.5 py-2.5 text-[10px] text-gray-500 font-medium uppercase">Empresa / RUC</th>
                <th className="text-left px-3.5 py-2.5 text-[10px] text-gray-500 font-medium uppercase">Vencimiento DNIT</th>
                <th className="text-center px-3.5 py-2.5 text-[10px] text-gray-500 font-medium uppercase">Comprobantes Mes</th>
                <th className="text-center px-3.5 py-2.5 text-[10px] text-gray-500 font-medium uppercase">IVA (F120)</th>
                <th className="text-center px-3.5 py-2.5 text-[10px] text-gray-500 font-medium uppercase">RG 90</th>
                <th className="text-right px-3.5 py-2.5 text-[10px] text-gray-500 font-medium uppercase">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {portfolioQuery.isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Cargando cartera de clientes...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No se encontraron clientes con el criterio seleccionado.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const isCurrent = selectedEntity?.id === client.id;
                  return (
                    <tr
                      key={client.id}
                      className={cn(
                        "hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors",
                        isCurrent && "bg-blue-50/50 dark:bg-blue-500/5"
                      )}
                    >
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-xs shrink-0">
                            {client.legalName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white leading-tight">
                              {client.tradeName || client.legalName}
                            </p>
                            <p className="font-mono text-[11px] text-gray-500">
                              RUC {client.ruc}
                              {isCurrent && (
                                <span className="ml-1.5 text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.2 rounded font-semibold">
                                  Activa
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full shrink-0",
                              client.status === "ok" && "bg-emerald-500",
                              client.status === "warning" && "bg-amber-500",
                              client.status === "overdue" && "bg-red-500"
                            )}
                          />
                          <div>
                            <p className="font-mono text-gray-900 dark:text-white text-xs">
                              {client.dueDate.split("-").reverse().join("/")}
                            </p>
                            <p className="text-[10px] text-gray-500">
                              {client.daysLeft < 0
                                ? `Vencido hace ${Math.abs(client.daysLeft)}d`
                                : client.daysLeft === 0
                                ? "Vence hoy"
                                : `${client.daysLeft} días restantes`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-center font-mono text-gray-700 dark:text-gray-300">
                        {client.documentsCount}
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-medium",
                            client.ivaStatus === "ready"
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                          )}
                        >
                          {client.ivaStatus === "ready" ? "Liquidado" : "Pendiente"}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <span
                          className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-medium",
                            client.rg90Status === "generated"
                              ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                          )}
                        >
                          {client.rg90Status === "generated" ? "Generado" : "Pendiente"}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectClient(client)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                        >
                          <span>Operar</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
