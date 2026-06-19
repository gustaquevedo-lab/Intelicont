"use client";

import { useState, useMemo } from "react";
import {
  FileSearch, CheckCircle2, AlertCircle, X, Download,
  Search, Calendar, Clock, Filter, TrendingUp,
  FileText, Eye, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RG90Entry {
  id: string;
  tipo: "emitido" | "recibido";
  cdc: string;
  numero: string;
  ruc: string;
  nombre: string;
  fecha: string;
  total: number;
  iva10: number;
  iva5: number;
  estadoEnLibro: "registrado" | "pendiente" | "no_encontrado";
  estadoEnSIFEN: "confirmado" | "pendiente" | "diferencia";
  diferencia: number;
}

const MOCK_RG90: RG90Entry[] = [
  {
    id: "r1", tipo: "recibido", cdc: "5897185478912345678901234567890123456789012345",
    numero: "001-001-00234", ruc: "80012345-1", nombre: "Importadora del Este S.A.",
    fecha: "2026-05-01", total: 11000000, iva10: 1000000, iva5: 0,
    estadoEnLibro: "registrado", estadoEnSIFEN: "confirmado", diferencia: 0,
  },
  {
    id: "r2", tipo: "recibido", cdc: "5897185478912345678901234567890123456789012346",
    numero: "002-001-00089", ruc: "4567890-1", nombre: "Servicios Contables Del Paraguay",
    fecha: "2026-05-03", total: 2750000, iva10: 250000, iva5: 0,
    estadoEnLibro: "registrado", estadoEnSIFEN: "confirmado", diferencia: 0,
  },
  {
    id: "r3", tipo: "recibido", cdc: "5897185478912345678901234567890123456789012347",
    numero: "001-001-00345", ruc: "80023456-2", nombre: "Tecnología Asunción SRL",
    fecha: "2026-05-02", total: 16500000, iva10: 1500000, iva5: 0,
    estadoEnLibro: "registrado", estadoEnSIFEN: "pendiente", diferencia: 0,
  },
  {
    id: "r4", tipo: "emitido", cdc: "5897185478912345678901234567890123456789012350",
    numero: "001-001-00001", ruc: "80012345-1", nombre: "Importadora del Este S.A.",
    fecha: "2026-05-10", total: 6050000, iva10: 550000, iva5: 0,
    estadoEnLibro: "registrado", estadoEnSIFEN: "confirmado", diferencia: 0,
  },
  {
    id: "r5", tipo: "recibido", cdc: "5897185478912345678901234567890123456789012349",
    numero: "001-001-01123", ruc: "9876543-2", nombre: "Agropecuaria Guaraní",
    fecha: "2026-05-08", total: 4125000, iva10: 375000, iva5: 0,
    estadoEnLibro: "no_encontrado", estadoEnSIFEN: "pendiente", diferencia: 4125000,
  },
  {
    id: "r6", tipo: "recibido", cdc: "5897185478912345678901234567890123456789012348",
    numero: "001-001-00056", ruc: "1234567-8", nombre: "Distribuciones Ñandutí S.A.",
    fecha: "2026-05-05", total: -550000, iva10: -50000, iva5: 0,
    estadoEnLibro: "registrado", estadoEnSIFEN: "diferencia", diferencia: -50000,
  },
];

export default function RG90Page() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() =>
    MOCK_RG90.filter((r) => {
      const s = search.toLowerCase();
      const matchesSearch = !s || r.nombre.toLowerCase().includes(s) || r.ruc.includes(s) || r.numero.includes(s);
      if (filter === "all") return matchesSearch;
      if (filter === "pendientes") return matchesSearch && r.estadoEnSIFEN !== "confirmado";
      if (filter === "diferencias") return matchesSearch && r.diferencia !== 0;
      return matchesSearch && r.estadoEnLibro === filter;
    }),
    [search, filter]
  );

  const resumen = useMemo(() => ({
    totalDocs: MOCK_RG90.length,
    confirmados: MOCK_RG90.filter(r => r.estadoEnSIFEN === "confirmado").length,
    pendientes: MOCK_RG90.filter(r => r.estadoEnSIFEN === "pendiente").length,
    diferencias: MOCK_RG90.filter(r => r.diferencia !== 0).length,
    noEncontrados: MOCK_RG90.filter(r => r.estadoEnLibro === "no_encontrado").length,
  }), []);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">RG 90 — Conciliación SIFEN</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Conciliación de comprobantes electrónicos — Período Mayo 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium no-tap-highlight">
            <Download className="h-4 w-4" /> Exportar CSV DNIT
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Docs", value: resumen.totalDocs, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", icon: FileText },
          { label: "Confirmados", value: resumen.confirmados, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", icon: CheckCircle2 },
          { label: "Pendientes", value: resumen.pendientes, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-500/10", icon: Clock },
          { label: "Diferencias", value: resumen.diferencias, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10", icon: AlertCircle },
          { label: "No Encontrados", value: resumen.noEncontrados, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10", icon: X },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">{c.label}</span>
                <div className={cn("h-6 w-6 rounded flex items-center justify-center", c.bg)}>
                  <Icon className={cn("h-3 w-3", c.color)} />
                </div>
              </div>
              <p className={cn("text-xl font-bold", c.color)}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por CDC, RUC, nombre..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white no-tap-highlight">
          <option value="all">Todos</option>
          <option value="registrado">Registrados</option>
          <option value="pendientes">Pendientes SIFEN</option>
          <option value="diferencias">Con Diferencias</option>
          <option value="no_encontrado">No Encontrados</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Tipo</th>
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Número</th>
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">RUC</th>
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Nombre</th>
                <th className="text-left px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Fecha</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Total</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">IVA 10</th>
                <th className="text-center px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Libro</th>
                <th className="text-center px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">SIFEN</th>
                <th className="text-right px-3 py-2 text-[10px] text-gray-500 font-medium uppercase">Dif.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {filtered.map((r) => (
                <tr key={r.id} className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/20",
                  r.diferencia !== 0 && "bg-red-50/30 dark:bg-red-500/5",
                  r.estadoEnLibro === "no_encontrado" && "bg-yellow-50/30 dark:bg-yellow-500/5",
                )}>
                  <td className="px-3 py-2.5">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                      r.tipo === "emitido" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600" : "bg-purple-50 dark:bg-purple-500/10 text-purple-600"
                    )}>
                      {r.tipo === "emitido" ? "Emitido" : "Recibido"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-gray-900 dark:text-white">{r.numero}</td>
                  <td className="px-3 py-2.5 font-mono text-gray-600 dark:text-gray-400">{r.ruc}</td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300 max-w-[150px] truncate">{r.nombre}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-400">{r.fecha}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {Math.abs(r.total).toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-gray-600 dark:text-gray-400">Gs. {Math.abs(r.iva10).toLocaleString("es-PY")}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded",
                      r.estadoEnLibro === "registrado" && "bg-green-50 dark:bg-green-500/10 text-green-600",
                      r.estadoEnLibro === "no_encontrado" && "bg-red-50 dark:bg-red-500/10 text-red-600",
                    )}>
                      {r.estadoEnLibro === "registrado" ? "Registrado" : "No encontrado"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded",
                      r.estadoEnSIFEN === "confirmado" && "bg-green-50 dark:bg-green-500/10 text-green-600",
                      r.estadoEnSIFEN === "pendiente" && "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600",
                      r.estadoEnSIFEN === "diferencia" && "bg-red-50 dark:bg-red-500/10 text-red-600",
                    )}>
                      {r.estadoEnSIFEN === "confirmado" ? "OK" : r.estadoEnSIFEN === "diferencia" ? "Dif." : "Pend."}
                    </span>
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono font-medium",
                    r.diferencia !== 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  )}>
                    {r.diferencia !== 0 ? `Gs. ${Math.abs(r.diferencia).toLocaleString("es-PY")}` : "Gs. 0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
          {filtered.length} de {MOCK_RG90.length} comprobantes — <span className="text-green-500">{resumen.confirmados} conciliados</span>
        </div>
      </div>
    </div>
  );
}
