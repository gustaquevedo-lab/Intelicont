"use client";

import { useState } from "react";
import {
  Building2,
  Plus,
  AlertTriangle,
  TrendingUp,
  Clock,
  Search,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mockEmpresas = [
  { id: 1, ruc: "80012345-1", nombre: "Importadora del Este S.A.", regimen: "IVA General", estado: "Activa", vencimientos: 2 },
  { id: 2, ruc: "80023456-2", nombre: "Tecnología Asunción SRL", regimen: "IRE Simple", estado: "Activa", vencimientos: 1 },
  { id: 3, ruc: "80034567-3", nombre: "Distribuciones Ñandutí SA", regimen: "IVA General", estado: "Por vencer", vencimientos: 4 },
  { id: 4, ruc: "80045678-4", nombre: "Consultora Guaraní SRL", regimen: "ReSimple", estado: "Activa", vencimientos: 0 },
  { id: 5, ruc: "80056789-5", nombre: "Frigorífico Central SA", regimen: "Exportador", estado: "Activa", vencimientos: 3 },
  { id: 6, ruc: "80067890-6", nombre: "Constructora Pilcomayo SRL", regimen: "IRE General", estado: "Cerrada", vencimientos: 0 },
];

const mockObligaciones = [
  { id: 1, empresa: "Importadora del Este", tipo: "IVA 104", fecha: "2026-05-12", estado: "Pendiente" },
  { id: 2, empresa: "Tecnología Asunción", tipo: "IRE 501v2", fecha: "2026-05-15", estado: "En proceso" },
  { id: 3, empresa: "Distribuciones Ñandutí", tipo: "Hechauka", fecha: "2026-05-10", estado: "Vence pronto" },
];

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredEmpresas = mockEmpresas.filter(
    (e) => e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || e.ruc.includes(searchTerm)
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-white">Panel General</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Resumen de tu estudio contable</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors border border-zinc-700">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Sugerencias IA
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />
            Nueva Empresa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Empresas Activas" value="15" change="+2 este mes" icon={Building2} />
        <StatCard title="Obligaciones Pendientes" value="7" change="3 vencen esta semana" icon={AlertTriangle} variant="warning" />
        <StatCard title="Asientos Procesados" value="1.240" change="+18% vs mes anterior" icon={TrendingUp} />
        <StatCard title="Tiempo Cierre Prom." value="2.4h" change="-35% vs mes anterior" icon={Clock} />
      </div>

      {/* Obligaciones */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-white font-medium">Obligaciones Próximas</h2>
          <span className="text-zinc-500 text-sm hover:text-zinc-300 cursor-pointer transition-colors">Ver todas →</span>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {mockObligaciones.map((obligacion) => (
            <div key={obligacion.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  obligacion.estado === "Vence pronto" ? "bg-red-400" :
                  obligacion.estado === "En proceso" ? "bg-yellow-400" : "bg-blue-400"
                )} />
                <div>
                  <p className="text-white text-sm font-medium">{obligacion.tipo}</p>
                  <p className="text-zinc-500 text-xs">{obligacion.empresa}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-zinc-300 text-sm">{obligacion.fecha}</p>
                <p className={cn(
                  "text-xs",
                  obligacion.estado === "Vence pronto" ? "text-red-400" :
                  obligacion.estado === "En proceso" ? "text-yellow-400" : "text-zinc-500"
                )}>{obligacion.estado}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empresas */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-white font-medium">Empresas</h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {filteredEmpresas.map((empresa) => (
            <div key={empresa.id} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{empresa.nombre}</p>
                  <p className="text-zinc-500 text-xs">RUC: {empresa.ruc} • {empresa.regimen}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {empresa.vencimientos > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-900/20 text-red-400 border border-red-800/50">
                    <AlertTriangle className="h-3 w-3" />
                    {empresa.vencimientos}
                  </span>
                )}
                <span className={cn(
                  "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                  empresa.estado === "Activa" ? "bg-green-900/30 text-green-400 border border-green-800" :
                  empresa.estado === "Por vencer" ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800" :
                  "bg-zinc-800 text-zinc-500 border border-zinc-700"
                )}>
                  {empresa.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, variant = "default" }: { title: string; value: string; change: string; icon: any; variant?: "default" | "warning" }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-zinc-400 text-xs uppercase tracking-wide">{title}</span>
        <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
          <Icon className={cn("h-4 w-4", variant === "warning" ? "text-yellow-400" : "text-zinc-400")} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        <ArrowUpRight className="h-3 w-3 text-green-400" />
        <span className="text-xs text-green-400">{change}</span>
      </div>
    </div>
  );
}
