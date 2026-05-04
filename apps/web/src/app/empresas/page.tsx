"use client";

import { useState } from "react";
import { Building2, Plus, Search, Filter, MoreHorizontal, Edit, Trash, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Empresa {
  id: number;
  ruc: string;
  nombre: string;
  nombreComercial: string;
  regimen: string;
  estado: "Activa" | "Por vencer" | "Cerrada";
  vencimientos: number;
}

const mockEmpresas: Empresa[] = [
  { id: 1, ruc: "80012345-1", nombre: "Importadora del Este S.A.", nombreComercial: "ImportEste", regimen: "IVA General / IRE General", estado: "Activa", vencimientos: 2 },
  { id: 2, ruc: "80023456-2", nombre: "Tecnología Asunción SRL", nombreComercial: "TechAsun", regimen: "IVA General / IRE Simple", estado: "Activa", vencimientos: 1 },
  { id: 3, ruc: "80034567-3", nombre: "Distribuciones Ñandutí SA", nombreComercial: "Ñandutí Dist.", regimen: "IVA General / IRE General", estado: "Por vencer", vencimientos: 4 },
  { id: 4, ruc: "80045678-4", nombre: "Consultora Guaraní SRL", nombreComercial: "Guaraní Consult.", regimen: "ReSimple", estado: "Activa", vencimientos: 0 },
  { id: 5, ruc: "80056789-5", nombre: "Frigorífico Central SA", nombreComercial: "Frigocentral", regimen: "Exportador / IVA General", estado: "Activa", vencimientos: 3 },
  { id: 6, ruc: "80067890-6", nombre: "Constructora Pilcomayo SRL", nombreComercial: "Construpil", regimen: "IRE General", estado: "Cerrada", vencimientos: 0 },
];

export default function EmpresasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filteredEmpresas = mockEmpresas.filter(
    (e) =>
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ruc.includes(searchTerm) ||
      e.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-white">Empresas</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Gestiona las empresas de tu estudio</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            showForm
              ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          )}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Empresa</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 lg:p-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Nueva Empresa</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="RUC" placeholder="80000000-0" required />
            <Field label="Razón Social" placeholder="Empresa S.A." required />
            <Field label="Nombre Comercial" placeholder="Nombre comercial" />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Régimen Tributario *</label>
              <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                <option value="">Seleccionar régimen</option>
                <option>IVA General / IRE General</option>
                <option>IVA General / IRE Simple</option>
                <option>ReSimple</option>
                <option>Exportador</option>
              </select>
            </div>
            <Field label="Dirección" placeholder="Calle, Ciudad" />
            <Field label="Email" placeholder="contacto@empresa.com.py" type="email" />
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors border border-zinc-700">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                Crear Empresa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & List */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors border border-zinc-700">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {filteredEmpresas.map((empresa) => (
            <div key={empresa.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-zinc-800/30 transition-colors gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{empresa.nombre}</p>
                  <p className="text-zinc-500 text-xs">{empresa.nombreComercial}</p>
                  <div className="flex flex-wrap gap-x-2 mt-0.5">
                    <span className="text-zinc-500 text-xs">RUC: {empresa.ruc}</span>
                    <span className="text-zinc-600 hidden sm:inline">•</span>
                    <span className="text-zinc-500 text-xs truncate hidden sm:inline">{empresa.regimen}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
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
                <div className="flex items-center">
                  <button className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors">
                    <Edit className="h-3.5 w-3.5 text-zinc-500" />
                  </button>
                  <button className="p-1.5 hover:bg-zinc-700 rounded-lg transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5 text-zinc-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEmpresas.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No se encontraron empresas</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", required = false }: { label: string; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />
    </div>
  );
}
