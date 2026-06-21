"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import {
  BookOpen, ChevronDown, ChevronRight, Search,
  AlertCircle, Loader2, Download, Layers, Settings2, X,
  ToggleLeft, ToggleRight, DollarSign, Percent, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadPlanDeCuentas,
  updateAccountFlags,
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
    ["Código", "Nombre", "Naturaleza", "Nivel", "Imputable", "Req.CC", "Ajuste FX", "No Deducible IRE"],
    ...flat.map((n) => [
      n.code,
      n.name,
      NATURE_META[n.nature ?? ""]?.label ?? n.nature ?? "",
      String(n.level + 1),
      n.allowsPosting ? "Sí" : "No",
      n.costCenterRequired ? "Sí" : "No",
      n.admitsFxAdjustment ? "Sí" : "No",
      n.nonDeductibleIre   ? "Sí" : "No",
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
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
  selectedId,
  onSelect,
}: {
  node:        AccountNode;
  expandedIds: Set<string>;
  onToggle:    (id: string) => void;
  searchMatch: Set<string>;
  selectedId:  string | null;
  onSelect:    (node: AccountNode) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isMatch    = searchMatch.size > 0 && searchMatch.has(node.id);
  const isSelected = selectedId === node.id;

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
          isSelected  ? "bg-primary/10 ring-1 ring-primary/30" :
          isMatch     ? "bg-yellow-50 dark:bg-yellow-900/10" :
                        "hover:bg-gray-50 dark:hover:bg-slate-800/50"
        )}
        style={{ paddingLeft: `${indent + 12}px` }}
        onClick={() => {
          if (hasChildren) onToggle(node.id);
          if (node.allowsPosting) onSelect(node);
        }}
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

        {/* Fiscal flags badges (only if postable) */}
        {node.allowsPosting && (
          <>
            {node.costCenterRequired && (
              <span title="Requiere Centro de Costo" className="hidden sm:inline-flex text-[9px] font-bold px-1 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800 shrink-0">
                CC
              </span>
            )}
            {node.admitsFxAdjustment && (
              <span title="Admite ajuste por tipo de cambio" className="hidden sm:inline-flex text-[9px] font-bold px-1 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800 shrink-0">
                FX
              </span>
            )}
            {node.nonDeductibleIre && (
              <span title="No deducible IRE" className="hidden sm:inline-flex text-[9px] font-bold px-1 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 shrink-0">
                ND
              </span>
            )}
            <span title="Editar flags fiscales" className="hidden group-hover:inline-flex items-center text-[10px] text-primary shrink-0">
              <Settings2 className="h-3 w-3" />
            </span>
          </>
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
              selectedId={selectedId}
              onSelect={onSelect}
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
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);

  const entityId = selectedEntity?.id || "";

  const [tree,        setTree]        = useState<AccountNode[] | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [isPending,   startLoad]      = useTransition();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search,      setSearch]      = useState("");

  // Flags panel
  const [selectedAccount, setSelectedAccount] = useState<AccountNode | null>(null);
  const [flagPending,     startFlagSave]       = useTransition();
  const [flagSuccess,     setFlagSuccess]      = useState(false);

  // Local editable flags (draft until saved)
  const [draftCC,  setDraftCC]  = useState(false);
  const [draftFX,  setDraftFX]  = useState(false);
  const [draftND,  setDraftND]  = useState(false);

  const entity = entities.find((e) => e.id === entityId) || selectedEntity;

  // Auto-load Plan de Cuentas when entity changes
  useEffect(() => {
    if (!entityId) return;
    setError(null);
    setTree(null);
    setExpandedIds(new Set());
    setSearch("");
    setSelectedAccount(null);
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
  }, [entityId]);

  function handleLoad() {
    // Left for backward compatibility if called elsewhere, but useEffect handles it now.
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

  function handleSelectAccount(node: AccountNode) {
    setSelectedAccount(node);
    setDraftCC(node.costCenterRequired ?? false);
    setDraftFX(node.admitsFxAdjustment ?? false);
    setDraftND(node.nonDeductibleIre   ?? false);
    setFlagSuccess(false);
  }

  function handleSaveFlags() {
    if (!selectedAccount) return;
    startFlagSave(async () => {
      const res = await updateAccountFlags(selectedAccount.id, {
        costCenterRequired: draftCC,
        admitsFxAdjustment: draftFX,
        nonDeductibleIre:   draftND,
      });
      if (res.ok) {
        setFlagSuccess(true);
        // Patch tree in place
        if (tree) {
          const flat = flattenTree(tree);
          const found = flat.find((n) => n.id === selectedAccount.id);
          if (found) {
            found.costCenterRequired = draftCC;
            found.admitsFxAdjustment = draftFX;
            found.nonDeductibleIre   = draftND;
          }
          setTree([...tree]);
        }
      }
    });
  }

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
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Empresa Activa</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span className="uppercase truncate">
                {selectedEntity?.tradeName || selectedEntity?.legalName || "Cargando..."}
              </span>
            </div>
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
        <div className="flex gap-4">
          {/* Tree panel */}
          <div className="flex-1 card overflow-hidden">
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
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800">CC</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800">FX</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800">ND</span>
              <span className="text-xs text-gray-400 ml-auto">Click en imputable para editar flags</span>
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
                    selectedId={selectedAccount?.id ?? null}
                    onSelect={handleSelectAccount}
                  />
                ))
              )}
            </div>
          </div>

          {/* Flags side panel */}
          {selectedAccount && (
            <div className="w-72 shrink-0 card p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Settings2 className="h-4 w-4 text-primary" /> Flags Fiscales
                </h3>
                <button onClick={() => setSelectedAccount(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-mono text-primary">{selectedAccount.code}</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{selectedAccount.name}</p>
              </div>

              <div className="space-y-3">
                {/* Flag 1: Requiere Centro de Costo */}
                <button
                  onClick={() => setDraftCC(!draftCC)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left",
                    draftCC
                      ? "bg-violet-50 border-violet-300 dark:bg-violet-900/20 dark:border-violet-700"
                      : "bg-gray-50 border-gray-200 dark:bg-slate-800/50 dark:border-slate-700"
                  )}
                >
                  {draftCC
                    ? <ToggleRight className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
                    : <ToggleLeft  className="h-5 w-5 text-gray-400 shrink-0" />
                  }
                  <div>
                    <p className={cn("text-xs font-bold", draftCC ? "text-violet-700 dark:text-violet-300" : "text-gray-600 dark:text-gray-400")}>
                      <Building2 className="inline h-3 w-3 mr-1" />Req. Centro de Costo
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Bloquea asientos sin CC asignado</p>
                  </div>
                </button>

                {/* Flag 2: Admite Ajuste FX */}
                <button
                  onClick={() => setDraftFX(!draftFX)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left",
                    draftFX
                      ? "bg-teal-50 border-teal-300 dark:bg-teal-900/20 dark:border-teal-700"
                      : "bg-gray-50 border-gray-200 dark:bg-slate-800/50 dark:border-slate-700"
                  )}
                >
                  {draftFX
                    ? <ToggleRight className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    : <ToggleLeft  className="h-5 w-5 text-gray-400 shrink-0" />
                  }
                  <div>
                    <p className={cn("text-xs font-bold", draftFX ? "text-teal-700 dark:text-teal-300" : "text-gray-600 dark:text-gray-400")}>
                      <DollarSign className="inline h-3 w-3 mr-1" />Admite Ajuste FX
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Revaloriza al cierre (Caja USD, etc.)</p>
                  </div>
                </button>

                {/* Flag 3: No Deducible IRE */}
                <button
                  onClick={() => setDraftND(!draftND)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left",
                    draftND
                      ? "bg-orange-50 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700"
                      : "bg-gray-50 border-gray-200 dark:bg-slate-800/50 dark:border-slate-700"
                  )}
                >
                  {draftND
                    ? <ToggleRight className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                    : <ToggleLeft  className="h-5 w-5 text-gray-400 shrink-0" />
                  }
                  <div>
                    <p className={cn("text-xs font-bold", draftND ? "text-orange-700 dark:text-orange-300" : "text-gray-600 dark:text-gray-400")}>
                      <Percent className="inline h-3 w-3 mr-1" />No Deducible IRE
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Excluye de la base imponible IRE</p>
                  </div>
                </button>
              </div>

              <button
                onClick={handleSaveFlags}
                disabled={flagPending}
                className="btn-primary flex items-center justify-center gap-2 w-full"
              >
                {flagPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {flagPending ? "Guardando…" : "Guardar Flags"}
              </button>

              {flagSuccess && (
                <p className="text-xs text-center text-green-600 dark:text-green-400 font-semibold animate-in fade-in">
                  ✓ Flags guardados correctamente
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
