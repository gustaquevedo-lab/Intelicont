"use client";

import { useState } from "react";
import {
  Building2, Plus, Search, Filter,
  MoreHorizontal, Edit, AlertTriangle, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Empresa {
  id: number; ruc: string; nombre: string; nombreComercial: string;
  regimen: string; estado: "Activa" | "Por vencer" | "Cerrada";
  vencimientos: number; initials: string; color: string;
}

const mockEmpresas: Empresa[] = [
  { id: 1, ruc: "80012345-1", nombre: "Importadora del Este S.A.",  nombreComercial: "ImportEste",    regimen: "IVA General / IRE General", estado: "Activa",     vencimientos: 2, initials: "IE", color: "from-blue-500 to-blue-700"     },
  { id: 2, ruc: "80023456-2", nombre: "Tecnología Asunción SRL",    nombreComercial: "TechAsun",      regimen: "IVA General / IRE Simple",  estado: "Activa",     vencimientos: 1, initials: "TA", color: "from-violet-500 to-violet-700" },
  { id: 3, ruc: "80034567-3", nombre: "Distribuciones Ñandutí SA", nombreComercial: "Ñandutí Dist.", regimen: "IVA General / IRE General", estado: "Por vencer", vencimientos: 4, initials: "DN", color: "from-amber-500 to-orange-600"  },
  { id: 4, ruc: "80045678-4", nombre: "Consultora Guaraní SRL",     nombreComercial: "Guaraní Consult.", regimen: "ReSimple",               estado: "Activa",     vencimientos: 0, initials: "CG", color: "from-secondary to-secondary-dark" },
  { id: 5, ruc: "80056789-5", nombre: "Frigorífico Central SA",     nombreComercial: "Frigocentral",  regimen: "Exportador / IVA General",  estado: "Activa",     vencimientos: 3, initials: "FC", color: "from-cyan-500 to-teal-600"    },
  { id: 6, ruc: "80067890-6", nombre: "Constructora Pilcomayo SRL", nombreComercial: "Construpil",    regimen: "IRE General",               estado: "Cerrada",    vencimientos: 0, initials: "CP", color: "from-gray-400 to-gray-500"    },
];

export default function EmpresasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm]     = useState(false);

  const filtered = mockEmpresas.filter(
    (e) =>
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ruc.includes(searchTerm) ||
      e.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Empresas</h1>
          <p className="section-subtitle">Gestión de contribuyentes del estudio</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? "btn-ghost" : "btn-secondary text-sm"}
        >
          <Plus className="h-4 w-4" />
          Nueva Empresa
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",    value: mockEmpresas.length,                                      color: "text-primary" },
          { label: "Activas",  value: mockEmpresas.filter((e) => e.estado === "Activa").length, color: "text-secondary" },
          { label: "Con alertas", value: mockEmpresas.filter((e) => e.vencimientos > 0).length, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="card-flat p-4 text-center">
            <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New empresa form */}
      {showForm && (
        <div className="card p-5 lg:p-6 animate-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-white">Nueva Empresa</h2>
            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="RUC"                 placeholder="80000000-0"          required />
            <Field label="Razón Social"         placeholder="Empresa S.A."        required />
            <Field label="Nombre Comercial"     placeholder="Nombre comercial" />
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Régimen Tributario <span className="text-red-500">*</span>
              </label>
              <select className="input-field">
                <option value="">Seleccionar régimen</option>
                <option>IVA General / IRE General</option>
                <option>IVA General / IRE Simple</option>
                <option>ReSimple</option>
                <option>Exportador</option>
              </select>
            </div>
            <Field label="Dirección"            placeholder="Calle, Ciudad" />
            <Field label="Email"                placeholder="contacto@empresa.com.py" type="email" />
            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancelar</button>
              <button type="submit" className="btn-secondary">Crear Empresa</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="card-flat overflow-hidden">
        {/* Search & filters */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empresa por nombre o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 py-2"
            />
          </div>
          <button className="btn-ghost shrink-0 py-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
          <span className="col-span-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Empresa</span>
          <span className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Régimen</span>
          <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</span>
          <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Acciones</span>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {filtered.map((empresa) => (
            <div key={empresa.id} className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 px-5 py-3.5 table-row-hover">
              {/* Avatar + name */}
              <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm bg-gradient-to-br",
                  empresa.color
                )}>
                  {empresa.initials}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{empresa.nombre}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {empresa.nombreComercial}
                    <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                    RUC {empresa.ruc}
                  </p>
                </div>
              </div>

              {/* Régimen */}
              <div className="sm:col-span-3 hidden sm:block">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{empresa.regimen}</span>
              </div>

              {/* Estado */}
              <div className="sm:col-span-2 flex items-center gap-2">
                {empresa.vencimientos > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-800/30">
                    <AlertTriangle className="h-3 w-3" />
                    {empresa.vencimientos}
                  </span>
                )}
                <span className={cn(
                  empresa.estado === "Activa"     ? "badge-green"  :
                  empresa.estado === "Por vencer" ? "badge-yellow" :
                                                    "badge-gray"
                )}>
                  {empresa.estado}
                </span>
              </div>

              {/* Actions */}
              <div className="sm:col-span-2 flex items-center justify-end gap-1">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-primary">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">No se encontraron empresas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, placeholder, type = "text", required = false }: {
  label: string; placeholder: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input type={type} placeholder={placeholder} className="input-field" />
    </div>
  );
}
