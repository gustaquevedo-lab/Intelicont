"use client";

import { useState } from "react";
import {
  FileText, Plus, Search, Sparkles, CheckCircle,
  Clock, MoreHorizontal, Download, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Asiento {
  id: string; numero: string; fecha: string; empresa: string;
  origen: string; estado: "Borrador" | "Posteado" | "Revertido";
  descripcion: string; total: number; lineas: number; sugerenciaIA?: boolean;
}

const mockAsientos: Asiento[] = [
  { id: "JE-001", numero: "001-2026", fecha: "2026-05-01", empresa: "Importadora del Este",  origen: "XML SIFEN",   estado: "Posteado", descripcion: "Compra mercadería Factura 001-233",           total: 15750000, lineas: 4, sugerenciaIA: true  },
  { id: "JE-002", numero: "002-2026", fecha: "2026-05-02", empresa: "Tech Asunción",          origen: "Manual",      estado: "Posteado", descripcion: "Pago honorarios profesionales",               total: 2500000,  lineas: 2                      },
  { id: "JE-003", numero: "003-2026", fecha: "2026-05-03", empresa: "Importadora del Este",  origen: "XML SIFEN",   estado: "Borrador", descripcion: "Venta Factura 002-445",                       total: 8920000,  lineas: 3, sugerenciaIA: true  },
  { id: "JE-004", numero: "004-2026", fecha: "2026-05-04", empresa: "Ñandutí Dist.",         origen: "Conciliación",estado: "Posteado", descripcion: "Conciliación bancaria Mayo",                  total: 5600000,  lineas: 2                      },
  { id: "JE-005", numero: "005-2026", fecha: "2026-05-05", empresa: "Frigocentral",           origen: "XML SIFEN",   estado: "Borrador", descripcion: "Retención IVA proveedor",                    total: 1230000,  lineas: 2, sugerenciaIA: true  },
  { id: "JE-006", numero: "REV-001", fecha: "2026-05-06", empresa: "Tech Asunción",          origen: "Reversión",   estado: "Posteado", descripcion: "Reversión JE-002 (error imputación)",        total: 2500000,  lineas: 2                      },
  { id: "JE-007", numero: "006-2026", fecha: "2026-05-07", empresa: "Guaraní Consult.",      origen: "Manual",      estado: "Posteado", descripcion: "Ajuste por inflación Mayo",                  total: 890000,   lineas: 6                      },
  { id: "JE-008", numero: "007-2026", fecha: "2026-05-08", empresa: "Importadora del Este",  origen: "XML SIFEN",   estado: "Borrador", descripcion: "Nota de Crédito 001-089",                    total: 1250000,  lineas: 3, sugerenciaIA: true  },
];

const origenColors: Record<string, string> = {
  "XML SIFEN":    "bg-primary-50 text-primary-700 border-primary-200",
  "Manual":       "bg-gray-100 text-gray-600 border-gray-200",
  "Conciliación": "bg-accent/10 text-teal-700 border-teal-200",
  "Reversión":    "bg-red-50 text-red-600 border-red-200",
};

export default function AsientosPage() {
  const [searchTerm, setSearchTerm]     = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  const filtrados = mockAsientos.filter((a) => {
    const matchSearch = a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numero.includes(searchTerm) || a.empresa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filtroEstado === "todos" || a.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const posteados    = mockAsientos.filter((a) => a.estado === "Posteado").length;
  const borradores   = mockAsientos.filter((a) => a.estado === "Borrador").length;
  const sugerencias  = mockAsientos.filter((a) => a.sugerenciaIA).length;

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Asientos Contables</h1>
          <p className="section-subtitle">Libro diario · Mayo 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <Link href="/asientos/nuevo" className="btn-secondary text-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Asiento</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Asientos",  value: mockAsientos.length, icon: FileText,     accent: "stat-card-blue",   iconCls: "text-primary bg-primary-100"    },
          { label: "Posteados",       value: posteados,           icon: CheckCircle,  accent: "stat-card-green",  iconCls: "text-secondary bg-secondary-100" },
          { label: "Borradores",      value: borradores,          icon: Clock,        accent: "stat-card-amber",  iconCls: "text-amber-600 bg-amber-100"    },
          { label: "Sugerencias IA",  value: sugerencias,         icon: Sparkles,     accent: "stat-card-purple", iconCls: "text-violet-600 bg-violet-100"  },
        ].map((s) => (
          <div key={s.label} className="card overflow-hidden">
            <div className={cn("absolute inset-0 opacity-50 rounded-2xl", s.accent)} style={{ position: 'absolute' }} />
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{s.label}</span>
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", s.iconCls)}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="card-flat overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar asiento, empresa o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 py-2"
            />
          </div>
          <div className="flex gap-1.5">
            {[
              { key: "todos",    label: "Todos"     },
              { key: "Borrador", label: "Borradores" },
              { key: "Posteado", label: "Posteados"  },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFiltroEstado(key)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
                  filtroEstado === key
                    ? "bg-primary text-white shadow-primary"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {filtrados.map((a) => (
            <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 table-row-hover gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                  a.sugerenciaIA
                    ? "bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-700"
                    : "bg-primary-50 border-primary-100 dark:bg-primary-900/10 dark:border-primary-800/30"
                )}>
                  {a.sugerenciaIA
                    ? <Sparkles className="h-5 w-5 text-violet-500" />
                    : <FileText  className="h-5 w-5 text-primary" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-900 dark:text-white text-sm font-bold font-mono">{a.numero}</span>

                    {/* Estado badge */}
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold",
                      a.estado === "Posteado"  ? "badge-green"  :
                      a.estado === "Borrador"  ? "badge-yellow" :
                                                  "badge-gray"
                    )}>
                      {a.estado}
                    </span>

                    {/* Origen */}
                    <span className={cn(
                      "hidden sm:inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border",
                      origenColors[a.origen] ?? "bg-gray-100 text-gray-600 border-gray-200"
                    )}>
                      {a.origen}
                    </span>

                    {a.sugerenciaIA && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-200">
                        <Sparkles className="h-3 w-3" /> IA
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5 truncate">{a.descripcion}</p>

                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>{a.fecha}</span>
                    <span className="text-gray-200 dark:text-gray-600">·</span>
                    <span>{a.empresa}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:justify-end shrink-0 pl-13">
                <div className="text-right">
                  <p className="text-gray-900 dark:text-white text-sm font-bold tabular-nums">
                    ₲ {a.total.toLocaleString("es-PY")}
                  </p>
                  <p className="text-gray-400 text-xs">{a.lineas} líneas</p>
                </div>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <div className="py-16 text-center">
              <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No se encontraron asientos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
