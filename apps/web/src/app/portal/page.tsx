"use client";

import { useState } from "react";
import {
  Building2, FileText, Receipt, Download, Eye,
  TrendingUp, TrendingDown, Calendar, Clock, CheckCircle2,
  CreditCard, DollarSign, ChevronDown, ChevronRight, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "documentos" | "declaraciones" | "saldos";

interface ClienteDoc {
  id: string; tipo: "factura" | "nc" | "nd" | "recibo";
  numero: string; fecha: string; total: number;
  iva: number; estado: "emitida" | "pagada" | "vencida";
  vencimiento: string;
}

const MOCK_DOCS: ClienteDoc[] = [
  { id: "d1", tipo: "factura", numero: "001-001-00001", fecha: "2026-05-10", total: 6050000, iva: 550000, estado: "emitida", vencimiento: "2026-06-09" },
  { id: "d2", tipo: "factura", numero: "001-001-00045", fecha: "2026-04-15", total: 3200000, iva: 290900, estado: "pagada", vencimiento: "2026-05-15" },
  { id: "d3", tipo: "nc", numero: "001-001-00012", fecha: "2026-04-20", total: -500000, iva: -45000, estado: "pagada", vencimiento: "2026-05-20" },
  { id: "d4", tipo: "factura", numero: "001-001-00088", fecha: "2026-03-01", total: 8500000, iva: 772700, estado: "vencida", vencimiento: "2026-03-31" },
  { id: "d5", tipo: "factura", numero: "001-001-00100", fecha: "2026-05-15", total: 1800000, iva: 163600, estado: "emitida", vencimiento: "2026-06-14" },
];

const MOCK_DECLARACIONES = [
  { periodo: "Mayo 2026", ivaDebito: 705000, ivaCredito: 0, saldoFavor: 0, estado: "pendiente" },
  { periodo: "Abril 2026", ivaDebito: 550000, ivaCredito: 0, saldoFavor: 0, estado: "presentada" },
  { periodo: "Marzo 2026", ivaDebito: 480000, ivaCredito: 120000, saldoFavor: 0, estado: "presentada" },
];

export default function PortalClientePage() {
  const [tab, setTab] = useState<Tab>("documentos");

  const totalEmitido = MOCK_DOCS.filter(d => d.estado === "emitida").reduce((s, d) => s + d.total, 0);
  const totalVencido = MOCK_DOCS.filter(d => d.estado === "vencida").reduce((s, d) => s + d.total, 0);
  const totalPagado = MOCK_DOCS.filter(d => d.estado === "pagada").reduce((s, d) => s + d.total, 0);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Client banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 opacity-80" />
              <span className="text-sm opacity-80 font-mono">RUC 3456789-0</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">Comercial Paraguaya S.A.</h1>
            <p className="text-blue-200 text-sm mt-1">Portal del Cliente — Vista limitada</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-blue-200 text-xs">Último acceso</p>
            <p className="text-sm">Hoy, 14:30</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Saldo Pendiente" value={`Gs. ${(totalEmitido / 1000000).toFixed(1)}M`} icon={Clock} color="text-yellow-400" />
        <KPI label="Vencido" value={`Gs. ${(totalVencido / 1000000).toFixed(1)}M`} icon={AlertCircle} color="text-red-400" />
        <KPI label="Última Factura" value="15 May 2026" icon={Calendar} color="text-blue-400" />
        <KPI label="IVA del Mes" value="Gs. 705K" icon={DollarSign} color="text-green-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {[
          { key: "documentos" as Tab, label: "Documentos", icon: FileText },
          { key: "declaraciones" as Tab, label: "Declaraciones", icon: Receipt },
          { key: "saldos" as Tab, label: "Saldos", icon: CreditCard },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight",
                tab === t.key ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500")}>
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "documentos" && (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                  <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Tipo</th>
                  <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Número</th>
                  <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Fecha</th>
                  <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Vence</th>
                  <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Total</th>
                  <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">IVA</th>
                  <th className="text-center px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Estado</th>
                  <th className="text-center px-3 py-2 text-[10px] text-gray-500 font-medium uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {MOCK_DOCS.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                    <td className="px-3 py-2.5">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                        doc.tipo === "factura" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600",
                        doc.tipo === "nc" && "bg-red-50 dark:bg-red-500/10 text-red-600",
                      )}>
                        {doc.tipo === "factura" ? "Factura" : doc.tipo === "nc" ? "NC" : doc.tipo === "nd" ? "ND" : "Rec."}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-900 dark:text-white">{doc.numero}</td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{doc.fecha}</td>
                    <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{doc.vencimiento}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {Math.abs(doc.total).toLocaleString("es-PY")}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">Gs. {Math.abs(doc.iva).toLocaleString("es-PY")}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                        doc.estado === "emitida" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600",
                        doc.estado === "pagada" && "bg-green-50 dark:bg-green-500/10 text-green-600",
                        doc.estado === "vencida" && "bg-red-50 dark:bg-red-500/10 text-red-600",
                      )}>
                        {doc.estado === "emitida" ? "Emitida" : doc.estado === "pagada" ? "Pagada" : "Vencida"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button className="p-1 text-gray-400 hover:text-blue-500 no-tap-highlight"><Download className="h-3.5 w-3.5" /></button>
                      <button className="p-1 text-gray-400 hover:text-blue-500 no-tap-highlight"><Eye className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "declaraciones" && (
        <div className="space-y-2">
          {MOCK_DECLARACIONES.map((d) => (
            <div key={d.periodo} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">IVA — {d.periodo}</p>
                <p className="text-xs text-gray-400">Débito: Gs. {d.ivaDebito.toLocaleString("es-PY")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs px-2 py-1 rounded font-medium",
                  d.estado === "presentada" ? "bg-green-50 dark:bg-green-500/10 text-green-600" : "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600")}>
                  {d.estado === "presentada" ? "Presentada" : "Pendiente"}
                </span>
                <button className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1">
                  <Download className="h-3 w-3" /> Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "saldos" && (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Resumen de Cuenta Corriente</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
              <span className="text-[10px] text-gray-400">Total Facturado</span>
              <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">Gs. {(MOCK_DOCS.filter(d => d.total > 0).reduce((s, d) => s + d.total, 0) / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
              <span className="text-[10px] text-gray-400">Saldo Pendiente</span>
              <p className="text-lg font-bold text-yellow-600 font-mono">Gs. {(totalEmitido / 1000000).toFixed(1)}M</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
              <span className="text-[10px] text-gray-400">Notas de Crédito</span>
              <p className="text-lg font-bold text-red-600 font-mono">Gs. 0.5M</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
              <span className="text-[10px] text-gray-400">Último Pago</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">15 Abr 2026 — Gs. 3.2M</p>
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
      <p className="text-base font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
