"use client";

import { useState } from "react";
import { Building2, Plus, Search, Filter, MoreHorizontal, Edit, Trash, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Empresa {
  id: number;
  ruc: string;
  nombre: string;
  nombreComercial: string;
  regimen: string;
  estado: "Activa" | "Por vencer" | "Cerrada";
  vencimientos: number;
  direccion: string;
  telefono: string;
  email: string;
}

const mockEmpresas: Empresa[] = [
  { id: 1, ruc: "80012345-1", nombre: "Importadora del Este S.A.", nombreComercial: "ImportEste", regimen: "IVA General / IRE General", estado: "Activa", vencimientos: 2, direccion: "Av. Mcal. López 1234, Asunción", telefono: "+595 21 123 456", email: "admin@importeste.com.py" },
  { id: 2, ruc: "80023456-2", nombre: "Tecnología Asunción SRL", nombreComercial: "TechAsun", regimen: "IVA General / IRE Simple", estado: "Activa", vencimientos: 1, direccion: "Calle Palma 567, Asunción", telefono: "+595 981 234 567", email: "info@techasun.com.py" },
  { id: 3, ruc: "80034567-3", nombre: "Distribuciones Ñandutí SA", nombreComercial: "Ñandutí Dist.", regimen: "IVA General / IRE General", estado: "Por vencer", vencimientos: 4, direccion: "Ruta 2 km 15, C. Limpio", telefono: "+595 21 987 654", email: "contabilidad@nanduti.com.py" },
  { id: 4, ruc: "80045678-4", nombre: "Consultora Guaraní SRL", nombreComercial: "Guaraní Consult.", regimen: "ReSimple", estado: "Activa", vencimientos: 0, direccion: "Av. Eusebio Ayala 2345, Asunción", telefono: "+595 982 345 678", email: "contacto@guarani.com.py" },
  { id: 5, ruc: "80056789-5", nombre: "Frigorífico Central SA", nombreComercial: "Frigocentral", regimen: "Exportador / IVA General", estado: "Activa", vencimientos: 3, direccion: "Zona Industrial, Villeta", telefono: "+595 21 456 789", email: "admin@frigocentral.com.py" },
  { id: 6, ruc: "80067890-6", nombre: "Constructora Pilcomayo SRL", nombreComercial: "Construpil", regimen: "IRE General", estado: "Cerrada", vencimientos: 0, direccion: "Calle España 890, Asunción", telefono: "+595 21 345 678", email: "info@construpil.com.py" },
];

export default function EmpresasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [empresas, setEmpresas] = useState<Empresa[]>(mockEmpresas);

  const filteredEmpresas = empresas.filter(
    (e) =>
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ruc.includes(searchTerm) ||
      e.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Empresas</h1>
          <p className="text-zinc-400 mt-1">Gestiona las empresas de tu estudio</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              showForm
                ? "bg-zinc-700 text-zinc-300"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            )}
          >
            <Plus className="h-4 w-4" />
            {showForm ? "Cancelar" : "Nueva Empresa"}
          </button>
        </div>
      </div>

      {/* Formulario Nueva Empresa */}
      {showForm && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-medium text-white mb-4">Nueva Empresa</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">RUC *</label>
              <input
                type="text"
                placeholder="80000000-0"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Razón Social *</label>
              <input
                type="text"
                placeholder="Empresa S.A."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Nombre Comercial</label>
              <input
                type="text"
                placeholder="Nombre comercial"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Régimen Tributario *</label>
              <select className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar régimen</option>
                <option value="iva_gral">IVA General / IRE General</option>
                <option value="iva_gral_simple">IVA General / IRE Simple</option>
                <option value="resimple">ReSimple</option>
                <option value="exportador">Exportador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Dirección</label>
              <input
                type="text"
                placeholder="Calle, Ciudad"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="contacto@empresa.com.py"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors border border-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Crear Empresa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, RUC o nombre comercial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors border border-zinc-700">
              <Filter className="h-4 w-4" />
              Filtros
            </button>
          </div>
        </div>

        {/* Lista de Empresas */}
        <div className="divide-y divide-zinc-800">
          {filteredEmpresas.map((empresa) => (
            <div
              key={empresa.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-zinc-800/40 transition-colors gap-4"
            >
              <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                  <Building2 className="h-6 w-6 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{empresa.nombre}</p>
                  <p className="text-zinc-500 text-xs">{empresa.nombreComercial}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-zinc-500 text-xs">RUC: {empresa.ruc}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-500 text-xs truncate">{empresa.regimen}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                {empresa.vencimientos > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-900/20 text-red-400 border border-red-800/50">
                    <AlertTriangle className="h-3 w-3" />
                    {empresa.vencimientos} pendientes
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
                <div className="flex items-center gap-1">
                  <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors">
                    <Edit className="h-4 w-4 text-zinc-500" />
                  </button>
                  <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEmpresas.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">No se encontraron empresas</p>
            <p className="text-zinc-600 text-xs mt-1">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
}
