"use client";

import { useState } from "react";
import { Building2, Plus, Search, Filter, MoreHorizontal, Edit, Trash, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmpresas } from "@/hooks/use-data";

export default function EmpresasPage() {
  const { data: empresas = [], isLoading } = useEmpresas();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filteredEmpresas = empresas.filter(
    (e) =>
      e.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ruc.includes(searchTerm) ||
      (e.tradeName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-white">Empresas</h1>
          <p className="text-gray-400 text-sm mt-0.5">Gestiona las empresas de tu estudio</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            showForm
              ? "bg-gray-800 text-gray-300 border border-gray-700"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          )}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Empresa</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 lg:p-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Nueva Empresa</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="RUC" placeholder="80000000-0" required />
            <Field label="Razón Social" placeholder="Empresa S.A." required />
            <Field label="Nombre Comercial" placeholder="Nombre comercial" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Régimen Tributario *</label>
              <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50">
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
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700">
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
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-800/50">
          {filteredEmpresas.map((empresa) => (
            <div key={empresa.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-800/30 transition-colors gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{empresa.legalName}</p>
                  <p className="text-gray-500 text-xs">{empresa.tradeName}</p>
                  <div className="flex flex-wrap gap-x-2 mt-0.5">
                    <span className="text-gray-500 text-xs">RUC: {empresa.ruc}</span>
                    <span className="text-gray-600 hidden sm:inline">•</span>
                    <span className="text-gray-500 text-xs truncate hidden sm:inline">{empresa.taxRegimes?.join(" / ") || ""}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={cn(
                  "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                  empresa.status === "active" ? "bg-green-900/30 text-green-400 border border-green-800" :
                  "bg-gray-800 text-gray-500 border border-gray-700"
                )}>
                  {empresa.status === "active" ? "Activa" : empresa.status}
                </span>
                <div className="flex items-center">
                  <button className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                    <Edit className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                  <button className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Cargando empresas...</p>
          </div>
        )}
        {!isLoading && filteredEmpresas.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No se encontraron empresas</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", required = false }: { label: string; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />
    </div>
  );
}
