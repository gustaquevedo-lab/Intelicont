"use client";

import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Download,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Asiento {
  id: string;
  numero: string;
  fecha: string;
  empresa: string;
  origen: string;
  estado: "Borrador" | "Posteado" | "Revertido";
  descripcion: string;
  total: number;
  lineas: number;
  sugerenciaIA?: boolean;
}

const mockAsientos: Asiento[] = [
  { id: "JE-001", numero: "001-2026", fecha: "2026-05-01", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Posteado", descripcion: "Compra mercadería Factura 001-233", total: 15750000, lineas: 4, sugerenciaIA: true },
  { id: "JE-002", numero: "002-2026", fecha: "2026-05-02", empresa: "Tech Asunción", origen: "Manual", estado: "Posteado", descripcion: "Pago honorarios profesionales", total: 2500000, lineas: 2 },
  { id: "JE-003", numero: "003-2026", fecha: "2026-05-03", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Borrador", descripcion: "Venta Factura 002-445", total: 8920000, lineas: 3, sugerenciaIA: true },
  { id: "JE-004", numero: "004-2026", fecha: "2026-05-04", empresa: "Ñandutí Dist.", origen: "Conciliación", estado: "Posteado", descripcion: "Conciliación bancaria Mayo", total: 5600000, lineas: 2 },
  { id: "JE-005", numero: "005-2026", fecha: "2026-05-05", empresa: "Frigocentral", origen: "XML SIFEN", estado: "Borrador", descripcion: "Retención IVA proveedor", total: 1230000, lineas: 2, sugerenciaIA: true },
  { id: "JE-006", numero: "REV-001", fecha: "2026-05-06", empresa: "Tech Asunción", origen: "Reversión", estado: "Posteado", descripcion: "Reversión asiento JE-002 (error imputación)", total: 2500000, lineas: 2 },
  { id: "JE-007", numero: "006-2026", fecha: "2026-05-07", empresa: "Guaraní Consult.", origen: "Manual", estado: "Posteado", descripcion: "Ajuste por inflación Mayo", total: 890000, lineas: 6 },
  { id: "JE-008", numero: "007-2026", fecha: "2026-05-08", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Borrador", descripcion: "Nota de Crédito 001-089", total: 1250000, lineas: 3, sugerenciaIA: true },
];

export default function AsientosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  const asientosFiltrados = mockAsientos.filter((a) => {
    const matchesSearch = a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) || a.numero.includes(searchTerm) || a.empresa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filtroEstado === "todos" || a.estado === filtroEstado;
    return matchesSearch && matchesEstado;
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-white">Asientos Contables</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Gestión del libro diario y asientos</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors border border-zinc-700">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <a
            href="/asientos/nuevo"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Asiento</span>
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Asientos" value={mockAsientos.length.toString()} icon={FileText} />
        <StatCard title="Posteados" value={mockAsientos.filter((a) => a.estado === "Posteado").length.toString()} icon={CheckCircle} color="text-green-400" />
        <StatCard title="Borradores" value={mockAsientos.filter((a) => a.estado === "Borrador").length.toString()} icon={Clock} color="text-yellow-400" />
        <StatCard title="Sugerencias IA" value={mockAsientos.filter((a) => a.sugerenciaIA).length.toString()} icon={Sparkles} color="text-purple-400" />
      </div>

      {/* Filters & List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-zinc-800">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar asiento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="flex gap-1.5">
              {["todos", "Borrador", "Posteado"].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                    filtroEstado === estado
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-zinc-700"
                  )}
                >
                  {estado === "todos" ? "Todos" : estado}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {asientosFiltrados.map((asiento) => (
            <div key={asiento.id} className="p-3 sm:p-4 hover:bg-zinc-800/30 transition-colors cursor-pointer">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    asiento.sugerenciaIA
                      ? "bg-purple-900/30 border border-purple-800"
                      : "bg-zinc-800 border border-zinc-700"
                  )}>
                    {asiento.sugerenciaIA ? (
                      <Sparkles className="h-5 w-5 text-purple-400" />
                    ) : (
                      <FileText className="h-5 w-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-mono font-medium">{asiento.numero}</span>
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded text-xs font-medium",
                        asiento.estado === "Posteado" ? "bg-green-900/30 text-green-400" :
                        asiento.estado === "Borrador" ? "bg-yellow-900/30 text-yellow-400" :
                        "bg-zinc-800 text-zinc-500"
                      )}>
                        {asiento.estado}
                      </span>
                      {asiento.sugerenciaIA && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-900/20 text-purple-400 border border-purple-800/50">
                          <Sparkles className="h-3 w-3" />
                          IA
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm mt-0.5 truncate">{asiento.descripcion}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {asiento.fecha}
                      </span>
                      <span>{asiento.empresa}</span>
                      <span className="text-zinc-600 hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{asiento.origen}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:justify-end shrink-0">
                  <div className="text-right">
                    <p className="text-white text-sm font-medium tabular-nums">
                      ₲ {asiento.total.toLocaleString("es-PY")}
                    </p>
                    <p className="text-zinc-500 text-xs">{asiento.lineas} líneas</p>
                  </div>
                  <button className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {asientosFiltrados.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No se encontraron asientos</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-zinc-400" }: any) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-zinc-400 text-xs uppercase tracking-wide">{title}</span>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
    </div>
  );
}
