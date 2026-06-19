"use client";

import { useState } from "react";
import {
  Upload, FileText, File, Image, Download, Eye, Trash2,
  Search, Filter, Paperclip, Link2, Calendar, X, Plus,
  FileCode, FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Documento {
  id: string;
  nombre: string;
  tipo: "pdf" | "xml" | "imagen" | "excel" | "otro";
  tamaño: string;
  fecha: string;
  vinculadoA: string;
  vinculadoTipo: string;
  etiquetas: string[];
}

const MOCK_DOCS: Documento[] = [
  { id: "d1", nombre: "Factura_001-001-00234.xml", tipo: "xml", tamaño: "45 KB", fecha: "2026-05-01", vinculadoA: "001-2026", vinculadoTipo: "Asiento", etiquetas: ["sifen", "compra"] },
  { id: "d2", nombre: "Comprobante_pago_ImportEste.pdf", tipo: "pdf", tamaño: "1.2 MB", fecha: "2026-05-02", vinculadoA: "JE-001", vinculadoTipo: "Asiento", etiquetas: ["pago", "banco"] },
  { id: "d3", nombre: "DJ_IVA_Mayo_2026.pdf", tipo: "pdf", tamaño: "850 KB", fecha: "2026-05-12", vinculadoA: "Formulario 104", vinculadoTipo: "Declaración", etiquetas: ["iva", "declaracion"] },
  { id: "d4", nombre: "Factura_002-001-00089.xml", tipo: "xml", tamaño: "38 KB", fecha: "2026-05-03", vinculadoA: "002-2026", vinculadoTipo: "Asiento", etiquetas: ["sifen", "compra"] },
  { id: "d5", nombre: "Contrato_alquiler_2026.pdf", tipo: "pdf", tamaño: "2.4 MB", fecha: "2026-01-01", vinculadoA: "Inmobiliaria Central", vinculadoTipo: "Tercero", etiquetas: ["contrato", "alquiler"] },
  { id: "d6", nombre: "Balance_Abril_2026.xlsx", tipo: "excel", tamaño: "156 KB", fecha: "2026-05-02", vinculadoA: "Cierre Abril", vinculadoTipo: "Cierre", etiquetas: ["balance", "cierre"] },
  { id: "d7", nombre: "Foto_factura_servicios.jpg", tipo: "imagen", tamaño: "3.1 MB", fecha: "2026-05-08", vinculadoA: "001-001-01123", vinculadoTipo: "SIFEN", etiquetas: ["sifen", "foto"] },
];

const TIPO_ICONS: Record<string, any> = {
  pdf: FileText, xml: FileCode, imagen: Image, excel: FileSpreadsheet, otro: File,
};

export default function DocumentosPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = MOCK_DOCS.filter(d => {
    const s = search.toLowerCase();
    return (!s || d.nombre.toLowerCase().includes(s) || d.etiquetas.some(t => t.includes(s))) &&
      (filter === "all" || d.tipo === filter);
  });

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Documentos</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Evidencias, XMLs, PDFs y archivos vinculados</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium no-tap-highlight">
          <Upload className="h-4 w-4" /> Subir Documento
        </button>
      </div>

      {/* Stats + Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documentos..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white no-tap-highlight" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "xml", "pdf", "imagen", "excel"].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium no-tap-highlight",
                filter === t ? "bg-blue-100 dark:bg-blue-500/10 text-blue-600" : "bg-gray-100 dark:bg-gray-800 text-gray-500")}>
              {t === "all" ? "Todos" : t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(doc => {
          const Icon = TIPO_ICONS[doc.tipo] || File;
          return (
            <div key={doc.id} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors group">
              <div className="flex items-start gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  doc.tipo === "pdf" && "bg-red-50 dark:bg-red-500/10",
                  doc.tipo === "xml" && "bg-blue-50 dark:bg-blue-500/10",
                  doc.tipo === "imagen" && "bg-purple-50 dark:bg-purple-500/10",
                  doc.tipo === "excel" && "bg-green-50 dark:bg-green-500/10",
                )}>
                  <Icon className={cn("h-5 w-5",
                    doc.tipo === "pdf" && "text-red-500",
                    doc.tipo === "xml" && "text-blue-500",
                    doc.tipo === "imagen" && "text-purple-500",
                    doc.tipo === "excel" && "text-green-500",
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.nombre}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{doc.tamaño} · {doc.fecha}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Paperclip className="h-3 w-3 text-gray-400" />
                    <span className="text-[10px] text-gray-500">{doc.vinculadoTipo}: {doc.vinculadoA}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {doc.etiquetas.map(t => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-gray-400 hover:text-blue-500 rounded no-tap-highlight"><Eye className="h-3.5 w-3.5" /></button>
                <button className="p-1.5 text-gray-400 hover:text-blue-500 rounded no-tap-highlight"><Download className="h-3.5 w-3.5" /></button>
                <button className="p-1.5 text-gray-400 hover:text-red-500 rounded no-tap-highlight ml-auto"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs text-gray-400">{filtered.length} documentos</div>
    </div>
  );
}
