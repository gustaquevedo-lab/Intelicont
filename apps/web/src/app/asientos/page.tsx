"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";
import { SOURCE_LABELS, dayOf } from "@/lib/audit-labels";

type Estado = "posted" | "reversed" | "reversal" | "draft";
const ESTADO_LABEL: Record<Estado, string> = { posted: "Posteado", reversed: "Reversado", reversal: "Reversión", draft: "Borrador" };
const ESTADO_COLOR: Record<Estado, string> = {
  posted: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
  reversed: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  reversal: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};
const PAGE = 100;
const gs = (v: number) => `₲ ${v.toLocaleString("es-PY")}`;

export default function AsientosPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [pages, setPages] = useState(1);
  const entityId = entity?.id ?? "";
  const results = api.useQueries((t) =>
    Array.from({ length: pages }, (_, i) => t["journal-entries"].list({ entityId, limit: PAGE, offset: i * PAGE }, { enabled: !!entity })));
  const count = api["journal-entries"].count.useQuery({ entityId }, { enabled: !!entity });
  const entries = results.flatMap((r) => r.data ?? []);
  const total = count.data?.total ?? entries.length;
  const isLoading = results.some((r) => r.isLoading);
  const error = results.find((r) => r.error)?.error;
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<"" | Estado>("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .map((e) => ({ ...e, estado: (e.reversalOf ? "reversal" : e.status) as Estado }))
      .filter((e) => (!estado || e.estado === estado) && (!q || `${e.number} ${e.description ?? ""}`.toLowerCase().includes(q)));
  }, [entries, search, estado]);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Asientos Contables</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{entity ? `Libro diario de ${entity.tradeName || entity.legalName}` : "Seleccioná una empresa"}</p>
        </div>
        <Link href="/asientos/nuevo" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo asiento</span>
        </Link>
      </div>

      {!entity ? (
        <div className="p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Seleccioná una empresa para ver sus asientos</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                aria-label="Buscar asiento"
                placeholder="Buscar por número o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <select
              aria-label="Filtrar por estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value as "" | Estado)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300"
            >
              <option value="">Todos</option>
              {(["posted", "reversed", "reversal", "draft"] as Estado[]).map((s) => <option key={s} value={s}>{ESTADO_LABEL[s]}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>
          ) : error ? (
            <p role="alert" className="p-6 text-sm text-red-500">{error.message}</p>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No hay asientos que coincidan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Asientos">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <th className="p-3 font-medium">Número</th>
                    <th className="p-3 font-medium">Fecha</th>
                    <th className="p-3 font-medium hidden sm:table-cell">Origen</th>
                    <th className="p-3 font-medium">Descripción</th>
                    <th className="p-3 font-medium text-right">Total</th>
                    <th className="p-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {rows.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-3"><Link href={`/asientos/${e.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">{e.number}</Link></td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{dayOf(e.date)}</td>
                      <td className="p-3 text-gray-500 hidden sm:table-cell">{SOURCE_LABELS[e.source ?? ""] ?? e.source}</td>
                      <td className="p-3 text-gray-900 dark:text-white">{e.description}</td>
                      <td className="p-3 text-right tabular-nums text-gray-900 dark:text-white whitespace-nowrap">{gs(e.total)}</td>
                      <td className="p-3"><span className={cn("inline-flex px-2 py-1 rounded-full text-xs font-medium", ESTADO_COLOR[e.estado])}>{ESTADO_LABEL[e.estado]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!isLoading && !error && total > entries.length && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
              <span role="status">Mostrando los últimos {entries.length} de {total} asientos — usá el Libro Diario para el detalle completo</span>
              <button onClick={() => setPages((n) => n + 1)} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">Cargar más</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
