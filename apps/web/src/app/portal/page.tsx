"use client";

import { useState } from "react";
import {
  Building2, FileText, Receipt, Download, Eye,
  TrendingUp, TrendingDown, Calendar, Clock, CheckCircle2,
  CreditCard, DollarSign, ChevronDown, ChevronRight, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";

type Tab = "documentos" | "declaraciones" | "saldos";

const gs = (v: number) => `₲ ${Math.round(v).toLocaleString("es-PY")}`;

export default function PortalClientePage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [tab, setTab] = useState<Tab>("documentos");

  const isEntityValid = !!entity?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entity.id);

  const docsQuery = api["tax-documents"].list.useQuery(
    { entityId: entity?.id || "" },
    { enabled: isEntityValid }
  );

  const rawDocs = docsQuery.data || [];
  const issuedDocs = rawDocs.filter((d) => d.direction === "issued");

  const entityName = entity?.tradeName || entity?.legalName || "Empresa Seleccionada";
  const entityRuc = entity?.ruc || "Sin RUC";

  const totalEmitido = issuedDocs.reduce((s, d) => s + (d.total || 0), 0);
  const totalIva = issuedDocs.reduce((s, d) => s + (d.iva10 || 0) + (d.iva5 || 0), 0);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Client banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-4 sm:p-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 opacity-80" />
              <span className="text-sm opacity-90 font-mono">RUC {entityRuc}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">{entityName}</h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-1">Portal del Cliente / Contribuyente — Comprobantes Emitidos</p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="inline-block px-2.5 py-1 bg-white/10 rounded-full text-xs font-medium backdrop-blur-sm">
              En línea
            </span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Total Emitido" value={gs(totalEmitido)} icon={DollarSign} color="text-green-500" />
        <KPI label="IVA Liquidado" value={gs(totalIva)} icon={Receipt} color="text-blue-500" />
        <KPI label="Comprobantes" value={String(issuedDocs.length)} icon={FileText} color="text-yellow-500" />
        <KPI label="Última Emisión" value={issuedDocs[0]?.issueDate || "—"} icon={Calendar} color="text-purple-500" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[
          { key: "documentos" as Tab, label: "Comprobantes", icon: FileText },
          { key: "saldos" as Tab, label: "Resumen Fiscal", icon: CreditCard },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight transition-all",
                tab === t.key
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {!entity ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-8">
          <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Seleccione una Empresa</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Elija una empresa en el menú superior para ver los comprobantes del portal.
          </p>
        </div>
      ) : docsQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
          <p className="text-xs text-gray-400">Cargando comprobantes...</p>
        </div>
      ) : tab === "documentos" ? (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {issuedDocs.length === 0 ? (
            <div className="text-center py-16 p-6">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No hay comprobantes de venta emitidos para esta empresa.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Tipo</th>
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Número</th>
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Fecha</th>
                    <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Timbrado</th>
                    <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Total</th>
                    <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">IVA (10%+5%)</th>
                    <th className="text-center px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {issuedDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-blue-50 dark:bg-blue-500/10 text-blue-600">
                          {doc.docType || "Factura"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-900 dark:text-white">{doc.number}</td>
                      <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{doc.issueDate}</td>
                      <td className="px-3 py-2.5 font-mono text-gray-600 dark:text-gray-400">{doc.timbrado}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-900 dark:text-white font-medium">
                        {gs(doc.total)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">
                        {gs((doc.iva10 || 0) + (doc.iva5 || 0))}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-medium",
                          doc.status === "posted" ? "bg-green-50 dark:bg-green-500/10 text-green-600" : "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600"
                        )}>
                          {doc.status === "posted" ? "Asentado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Resumen General de Emisiones</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
              <span className="text-[10px] text-gray-400">Total Facturado</span>
              <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{gs(totalEmitido)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
              <span className="text-[10px] text-gray-400">Total IVA Débito Generado</span>
              <p className="text-lg font-bold text-blue-600 font-mono">{gs(totalIva)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</span>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <p className="text-base font-bold text-gray-900 dark:text-white font-mono">{value}</p>
    </div>
  );
}
