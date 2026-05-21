"use client";

import { useState, useTransition } from "react";
import {
  FileText, Plus, Search, Sparkles, CheckCircle,
  Clock, MoreHorizontal, Download, Calendar,
  ChevronDown, Loader2, SendHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { AsientoRow } from "../actions";
import type { EntityOption } from "@/app/asientos/actions";
import { postearAsiento } from "../actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft:    "Borrador",
  posted:   "Posteado",
  reversed: "Revertido",
};

const SOURCE_LABEL: Record<string, string> = {
  manual:        "Manual",
  xml_sifen:     "XML SIFEN",
  conciliacion:  "Conciliación",
  reversal:      "Reversión",
  bank:          "Bancario",
};

const SOURCE_COLORS: Record<string, string> = {
  xml_sifen:     "bg-primary-50 text-primary-700 border-primary-200",
  manual:        "bg-gray-100 text-gray-600 border-gray-200",
  conciliacion:  "bg-accent/10 text-teal-700 border-teal-200",
  reversal:      "bg-red-50 text-red-600 border-red-200",
  bank:          "bg-cyan-50 text-cyan-700 border-cyan-200",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialAsientos: AsientoRow[];
  entities:        EntityOption[];
  dbError?:        string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AsientosClient({ initialAsientos, entities, dbError }: Props) {
  const [asientos, setAsientos]         = useState<AsientoRow[]>(initialAsientos);
  const [searchTerm, setSearchTerm]     = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroEntity, setFiltroEntity] = useState<string>("todos");
  const [postingId, setPostingId]       = useState<string | null>(null);
  const [postError, setPostError]       = useState<string | null>(null);
  const [, startTransition]             = useTransition();

  // ── Client-side filtering ─────────────────────────────────────────────────
  const filtrados = asientos.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      a.description.toLowerCase().includes(q) ||
      a.number.toLowerCase().includes(q) ||
      a.entityName.toLowerCase().includes(q);
    const matchEstado  = filtroEstado  === "todos" || a.status    === filtroEstado;
    const matchEntity  = filtroEntity  === "todos" || a.entityId  === filtroEntity;
    return matchSearch && matchEstado && matchEntity;
  });

  const total      = asientos.length;
  const posteados  = asientos.filter((a) => a.status === "posted").length;
  const borradores = asientos.filter((a) => a.status === "draft").length;

  // ── Postear action ────────────────────────────────────────────────────────
  function handlePostear(id: string) {
    setPostingId(id);
    setPostError(null);
    startTransition(async () => {
      const result = await postearAsiento(id);
      if (result.ok) {
        setAsientos((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "posted" } : a))
        );
      } else {
        setPostError(result.error);
      }
      setPostingId(null);
    });
  }

  // ── CSV export ────────────────────────────────────────────────────────────
  function handleExport() {
    const headers = ["Número", "Fecha", "Empresa", "Descripción", "Estado", "Origen", "Total (₲)", "Líneas"];
    const rows = filtrados.map((a) => [
      a.number,
      a.date,
      a.entityName,
      `"${a.description.replace(/"/g, '""')}"`,
      STATUS_LABEL[a.status] ?? a.status,
      SOURCE_LABEL[a.source] ?? a.source,
      a.totalDebit.toFixed(0),
      a.lineCount,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asientos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">

      {/* ── DB Error banner ────────────────────────────────────────────────── */}
      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          Error de base de datos: {dbError}
        </div>
      )}

      {/* ── Post error toast ───────────────────────────────────────────────── */}
      {postError && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
          {postError}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Asientos Contables</h1>
          <p className="section-subtitle">Libro diario · {new Date().toLocaleDateString("es-PY", { month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-ghost text-sm">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <Link href="/asientos/nuevo" className="btn-secondary text-sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Asiento</span>
          </Link>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Asientos",  value: total,      icon: FileText,    accent: "stat-card-blue",   iconCls: "text-primary bg-primary-100"     },
          { label: "Posteados",       value: posteados,  icon: CheckCircle, accent: "stat-card-green",  iconCls: "text-secondary bg-secondary-100"  },
          { label: "Borradores",      value: borradores, icon: Clock,       accent: "stat-card-amber",  iconCls: "text-amber-600 bg-amber-100"     },
          { label: "Empresas",        value: entities.length, icon: FileText, accent: "stat-card-purple", iconCls: "text-violet-600 bg-violet-100" },
        ].map((s) => (
          <div key={s.label} className="card overflow-hidden">
            <div className={cn("absolute inset-0 opacity-50 rounded-2xl", s.accent)} style={{ position: "absolute" }} />
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

      {/* ── List ───────────────────────────────────────────────────────────── */}
      <div className="card-flat overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-gray-100 dark:border-slate-700">

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, empresa o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 py-2"
            />
          </div>

          {/* Entity filter */}
          {entities.length > 1 && (
            <div className="relative">
              <select
                value={filtroEntity}
                onChange={(e) => setFiltroEntity(e.target.value)}
                className="appearance-none input-field py-2 pr-8 text-xs cursor-pointer"
              >
                <option value="todos">Todas las empresas</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>{e.legalName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}

          {/* Status buttons */}
          <div className="flex gap-1.5">
            {[
              { key: "todos",    label: "Todos"      },
              { key: "draft",    label: "Borradores" },
              { key: "posted",   label: "Posteados"  },
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
          {filtrados.map((a) => {
            const statusLabel = STATUS_LABEL[a.status] ?? a.status;
            const sourceLabel = SOURCE_LABEL[a.source] ?? a.source;
            const isPosting   = postingId === a.id;

            return (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 table-row-hover gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border bg-primary-50 border-primary-100 dark:bg-primary-900/10 dark:border-primary-800/30">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Top row: number + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-900 dark:text-white text-sm font-bold font-mono">{a.number}</span>

                      {/* Status badge */}
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold",
                        a.status === "posted"   ? "badge-green"  :
                        a.status === "draft"    ? "badge-yellow" :
                                                  "badge-gray"
                      )}>
                        {statusLabel}
                      </span>

                      {/* Source badge */}
                      <span className={cn(
                        "hidden sm:inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border",
                        SOURCE_COLORS[a.source] ?? "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {sourceLabel}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5 truncate">{a.description}</p>

                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{a.date}</span>
                      <span className="text-gray-200 dark:text-gray-600">·</span>
                      <span className="truncate">{a.entityName}</span>
                    </div>
                  </div>
                </div>

                {/* Right: amount + actions */}
                <div className="flex items-center gap-2 sm:justify-end shrink-0 pl-13">
                  <div className="text-right">
                    <p className="text-gray-900 dark:text-white text-sm font-bold tabular-nums">
                      ₲ {a.totalDebit.toLocaleString("es-PY")}
                    </p>
                    <p className="text-gray-400 text-xs">{a.lineCount} líneas</p>
                  </div>

                  {/* Postear button (only for drafts) */}
                  {a.status === "draft" && (
                    <button
                      onClick={() => handlePostear(a.id)}
                      disabled={isPosting}
                      title="Postear asiento"
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                        isPosting
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-secondary-50 text-secondary-700 hover:bg-secondary border border-secondary/30 hover:text-white hover:border-secondary"
                      )}
                    >
                      {isPosting
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <SendHorizontal className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{isPosting ? "Posteando…" : "Postear"}</span>
                    </button>
                  )}

                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            );
          })}

          {filtrados.length === 0 && (
            <div className="py-16 text-center">
              <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">
                {asientos.length === 0 ? "No hay asientos todavía" : "No se encontraron asientos con ese filtro"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
