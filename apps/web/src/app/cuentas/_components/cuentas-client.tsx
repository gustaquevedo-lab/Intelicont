"use client";

import { useState, useTransition, useMemo } from "react";
import {
  BookOpen, ChevronDown, ChevronRight, Search,
  AlertCircle, Loader2, Download, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadPlanDeCuentas,
  type AccountNode,
} from "../actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NATURE_META: Record<string, { label: string; cls: string }> = {
  asset:    { label: "Activo",   cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  liability:{ label: "Pasivo",   cls: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800" },
  equity:   { label: "Patrimonio",cls:"bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  income:   { label: "Ingreso",  cls: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800" },
  expense:  { label: "Egreso",   cls: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
};

// Flatten tree for search/export
function flattenTree(nodes: AccountNode[]): AccountNode[] {
  const result: AccountNode[] = [];
  function walk(node: AccountNode) {
    result.push(node);
    node.children.forEach(walk);
  }
  nodes.forEach(walk);
  return result;
}

// Export to CSV
function exportCSV(nodes: AccountNode[], entityName: string) {
  const flat = flattenTree(nodes);
  const rows = [
    ["Plan de Cuentas", entityName],
    [],
    ["Código", "Nombre", "Naturaleza", "Nivel", "Imputable"],
    ...flat.map((n) => [
      n.code,
      n.name,
      NATURE_META[n.nature ?? ""]?.label ?? n.nature ?? "",
      String(n.level + 1),
      n.allowsPosting ? "Sí" : "No",
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement("a"), { href: url, download: `plan_cuentas_${Date.now()}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Tree node component ─────────────────────────────────────────────────────

function TreeNode({
  node,
  expandedIds,
  onToggle,
  searchMatch,
}: {
  node:        AccountNode;
  expandedIds: Set<string>;
  onToggle:    (id: string) => void;
  searchMatch: Set<string>;
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isMatch    = searchMatch.size > 0 && searchMatch.has(node.id);

  // Show node if it matches or has matching descendants
  if (searchMatch.size > 0 && !searchMatch.has(node.id) && !node.children.some((c) => searchMatch.has(c.id))) {
    // Only hide leaf nodes that don't match; parents are shown if any child matches
    if (!hasChildren) return null;
    const anyChildMatch = node.children.some((c) => searchMatch.has(c.id) || c.children.length > 0);
    if (!anyChildMatch) return null;
  }

  const natureMeta = NATURE_META[node.nature ?? ""];
  const indent = node.level * 20;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-3 rounded-lg transition-colors group cursor-pointer",
          isMatch ? "bg-yellow-50 dark:bg-yellow-900/10" : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
        )}
        style={{ paddingLeft: `${indent + 12}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {/* Expand toggle */}
        <span className="shrink-0 w-4 h-4 flex items-center justify-center text-gray-400">
          {hasChildren
            ? (isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
            : <span className="h-3.5 w-3.5" />}
        </span>

        {/* Code */}
        <span className="font-mono text-xs text-primary bg-primary-50 dark:bg-primary/10 px-1.5 py-0.5 rounded shrink-0 min-w-[56px]">
          {node.code}
        </span>

        {/* Name */}
        <span className={cn(
          "flex-1 text-sm truncate",
          node.level === 0 ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300",
          !node.allowsPosting && node.level > 0 && "text-gray-500 dark:text-gray-400",
        )}>
          {node.name}
        </span>

        {/* Nature badge */}
        {natureMeta && (
          <span className={cn(
            "hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0",
            natureMeta.cls
          )}>
            {natureMeta.label}
          </span>
        )}

        {/* Posting badge */}
        {!node.allowsPosting && (
          <span className="hidden sm:inline-flex text-[10px] text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 shrink-0">
            Cabecera
          </span>
        )}

        {/* Children count */}
        {hasChildren && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
            {node.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              onToggle={onToggle}
              searchMatch={searchMatch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  entities: Array<{ id: string; legalName: string; ruc: string }>;
  dbError?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CuentasClient({ entities, dbError }: Props) {
  const [entityId,    setEntityId]    = useState(entities[0]?.id ?? "");
  const [tree,        setTree]        = useState<AccountNode[] | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [isPending,   startLoad]      = useTransition();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search,      setSearch]      = useState("");

  const entity = entities.find((e) => e.id === entityId);

  function handleLoad() {
    if (!entityId) return;
    setError(null);
    setTree(null);
    setExpandedIds(new Set());
    setSearch("");
    startLoad(async () => {
      const result = await loadPlanDeCuentas(entityId);
      if (result.ok) {
        setTree(result.data);
        // Auto-expand top level
        const topIds = new Set(result.data.map((n) => n.id));
        setExpandedIds(topIds);
      } else {
        setError(result.error);
      }
    });
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    if (!tree) return;
    const all = new Set<string>();
    flattenTree(tree).forEach((n) => all.add(n.id));
    setExpandedIds(all);
  }

  function collapseAll() {
    if (!tree) return;
    const topIds = new Set(tree.map((n) => n.id));
    setExpandedIds(topIds);
  }

  // Search matching
  const searchMatch = useMemo(() => {
    if (!tree || !search.trim()) return new Set<string>();
    const q   = search.toLowerCase();
    const flat = flattenTree(tree);
    const ids  = new Set<string>();
    flat.forEach((n) => {
      if (n.code.toLowerCase().includes(q) || n.name.toLowerCase().includes(q)) {
        ids.add(n.id);
      }
    });
    return ids;
  }, [tree, search]);

  // Auto-expand matching nodes when searching
  useMemo(() => {
    if (!tree || searchMatch.size === 0) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (!tree) return next;
      flattenTree(tree).forEach((n) => {
        if (searchMatch.has(n.id)) next.add(n.id);
      });
      return next;
    });
  }, [searchMatch]);

  const flatCount = tree ? flattenTree(tree).length : 0;
  const postingCount = tree ? flattenTree(tree).filter((n) => n.allowsPosting).length : 0;

  return (
    <div className="page-container max-w-5xl">

      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Error: {dbError}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="section-title text-2xl lg:text-3xl flex items-center gap-3">
          <BookOpen className="h-7 w-7" /> Plan de Cuentas
        </h1>
        <p className="section-subtitle">Árbol de cuentas DNIT por empresa</p>
      </div>

      {/* Controls */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Empresa</label>
            <div className="relative">
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="appearance-none input-field pr-8 cursor-pointer"
              >
                <option value="">Seleccioná una empresa</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>{e.legalName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleLoad}
              disabled={!entityId || isPending}
              className="btn-secondary flex items-center gap-2"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
              {isPending ? "Cargando…" : "Ver plan de cuentas"}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Tree */}
      {tree && (
        <div className="card overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-gray-100 dark:border-slate-700">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar cuenta…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 py-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto text-xs text-gray-500 dark:text-gray-400">
              <span>{flatCount} cuentas · {postingCount} imputables</span>
              <button onClick={expandAll}   className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">Expandir</button>
              <button onClick={collapseAll} className="px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">Colapsar</button>
              <button
                onClick={() => entity && exportCSV(tree, entity.legalName)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-gray-50 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/30">
            {Object.entries(NATURE_META).map(([, meta]) => (
              <span key={meta.label} className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", meta.cls)}>
                {meta.label}
              </span>
            ))}
            <span className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700">Cabecera</span>
            <span className="text-xs text-gray-400 ml-auto">Click para expandir/colapsar</span>
          </div>

          {/* Tree */}
          <div className="p-2 max-h-[600px] overflow-y-auto">
            {search.trim() && searchMatch.size === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Sin resultados para "{search}"</p>
            ) : (
              tree.map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  expandedIds={expandedIds}
                  onToggle={toggleExpanded}
                  searchMatch={searchMatch}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
