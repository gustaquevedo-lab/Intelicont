"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileCode, Search, Calendar, Receipt, CheckCircle2,
  AlertCircle, Clock, TrendingUp, Upload, Sparkles,
  Eye, X, CheckSquare, Square, Play, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaxDocuments, usePendingTaxDocuments, useOpenPeriod } from "@/hooks/use-data";
import { useApproveTaxDocument, useRejectTaxDocument, useBatchApproveTaxDocuments, useBatchRejectTaxDocuments } from "@/hooks/use-data";
import { useEntity } from "@/hooks/use-entity";
import { useUser } from "@/hooks/use-user";
import type { TaxDocument } from "@/lib/sifen-store";

const TYPE_LABEL: Record<string, string> = {
  invoice: "Factura", credit_note: "Nota de Credito", debit_note: "Nota de Debito",
};

function fmtPyg(n: number): string {
  return n.toLocaleString("es-PY");
}

export default function SifenBandejaPage() {
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);
  const entityId = selectedEntity?.id ?? null;
  
  const { data: openPeriod } = useOpenPeriod(entityId);
  const periodId = openPeriod?.id ?? "";
  
  const [detailDoc, setDetailDoc] = useState<TaxDocument | null>(null);
  const [mobileDetail, setMobileDetail] = useState(false);
  
  // Filter state (replaces Zustand filter)
  const [filter, setFilter] = useState<{ search: string; status: string; docType: string }>({
    search: "",
    status: "all",
    docType: "all"
  });
  
  // Selection state (replaces Zustand selectedIds)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Data fetching
  const { data: rawDocuments = [], isLoading, isError, error } = useTaxDocuments(entityId);
  const { data: rawPendingDocs = [] } = usePendingTaxDocuments(entityId);

  const documents = rawDocuments as unknown as TaxDocument[];
  const pendingDocs = rawPendingDocs as unknown as TaxDocument[];
  
  // Mutations
  const approveMutation = useApproveTaxDocument();
  const rejectMutation = useRejectTaxDocument();
  const batchApproveMutation = useBatchApproveTaxDocuments();
  const batchRejectMutation = useBatchRejectTaxDocuments();

  // Filtered documents (same logic as before)
  const filtered = useMemo(() => {
    if (!documents.length) return [];
    const { search, status, docType } = filter;
    return documents.filter(doc => {
      const s = search.toLowerCase();
      const matches = !s || 
        doc.number.toLowerCase().includes(s) || 
        (doc.partnerName || "").toLowerCase().includes(s) || 
        (doc.partnerRuc || "").includes(s) || 
        (doc.cdc || "").includes(s);
      const ms = status === "all" || 
        doc.status === status || 
        (status === "pending_reviewing" && (doc.status === "pending" || doc.status === "reviewing"));
      const mt = docType === "all" || doc.docType === docType;
      return matches && ms && mt;
    });
  }, [documents, filter]);

  const stats = useMemo(() => {
    const pending = documents.filter((d) => d.status === "pending");
    const reviewing = documents.filter((d) => d.status === "reviewing");
    const posted = documents.filter((d) => d.status === "posted");
    const errors = documents.filter((d) => d.status === "error" || d.status === "rejected");
    
    // Calculate total IVA (10% + 5%) from all documents
    const totalIva = documents.reduce((sum, doc) => {
      const iva10 = parseFloat(doc.iva10 || "0");
      const iva5 = parseFloat(doc.iva5 || "0");
      return sum + iva10 + iva5;
    }, 0);
    
    return {
      total: documents.length, pending: pending.length, reviewing: reviewing.length,
      posted: posted.length, errors: errors.length,
      totalPendiente: [...pending, ...reviewing].reduce((s, d) => s + Math.abs(parseFloat(d.total)), 0),
      totalIva: totalIva
    };
  }, [documents]);

  const selectedArr = Array.from(selectedIds);

  const actionable = filtered.filter((d) => d.status === "pending" || d.status === "reviewing");
  const selActionable = actionable.filter((d) => selectedIds.has(d.id));
  const allChecked = filtered.length > 0 && selectedIds.size === filtered.length;

  const totalPend = stats.pending + stats.reviewing;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map((d) => d.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const approveDocument = async (id: string) => {
    if (!entityId || !periodId) return;
    await approveMutation.mutateAsync({ documentId: id, entityId, periodId });
  };
  
  const rejectDocument = async (id: string) => {
    if (!entityId) return;
    await rejectMutation.mutateAsync({ documentId: id, entityId, reason: "Rechazado desde bandeja" });
  };
  
  const batchApprove = async () => {
    if (selectedIds.size === 0 || !entityId || !periodId) return;
    await batchApproveMutation.mutateAsync({ 
      documentIds: Array.from(selectedIds), 
      entityId, 
      periodId 
    });
  };
  
  const batchReject = async () => {
    if (selectedIds.size === 0 || !entityId) return;
    await batchRejectMutation.mutateAsync({ 
      documentIds: Array.from(selectedIds), 
      entityId, 
      reason: "Rechazado desde bandeja" 
    });
  };
  
  const batchStartReview = async () => {
    // TODO: Implement batch start review via server action if needed
    console.log("Batch start review not implemented yet");
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
            Bandeja SIFEN
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Pipeline de documentos electronicos — {totalPend} por procesar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sifen" className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors no-tap-highlight">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Cargar XML</span>
          </Link>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Flujo de Procesamiento
        </h3>
        <div className="flex items-center">
          {[
            { l: "Pendiente", n: stats.pending, c: "text-yellow-500", b: "bg-yellow-500", ic: Clock },
            { l: "En Revision", n: stats.reviewing, c: "text-purple-500", b: "bg-purple-500", ic: Play },
            { l: "Publicado", n: stats.posted, c: "text-green-500", b: "bg-green-500", ic: CheckCircle2 },
            { l: "Error", n: stats.errors, c: "text-red-500", b: "bg-red-500", ic: AlertCircle },
          ].map((s, i) => (
            <div key={s.l} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center flex-1">
                <span className={cn("text-lg sm:text-xl lg:text-2xl font-bold tabular-nums", s.c)}>{s.n}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <s.ic className={cn("h-3 w-3", s.c)} />
                  <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{s.l}</span>
                </div>
                <div className={cn("w-full h-1 rounded-full mt-1.5", s.b, s.n === 0 && "opacity-20")} />
              </div>
              {i < 3 && <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300 dark:text-gray-600 shrink-0 mx-0.5 mt-3" />}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard t="Total Docs" v={stats.total} ic={FileCode} cl="text-blue-500" />
        <StatCard t="Pendientes" v={stats.pending} ic={Clock} cl="text-yellow-500" />
        <StatCard t="En Revision" v={stats.reviewing} ic={Play} cl="text-purple-500" />
        <StatCard t="Publicados" v={stats.posted} ic={CheckCircle2} cl="text-green-500" />
      </div>

      {/* Pending Banner */}
      {totalPend > 0 && (
        <div className="bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-800/30 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white text-sm font-medium">
                  {totalPend} doc{totalPend !== 1 ? "s" : ""} pendiente{totalPend !== 1 ? "s" : ""} de revision
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
                  La IA ya genero las sugerencias de asiento.
                </p>
              </div>
            </div>
            <span className="text-purple-600 dark:text-purple-400 font-mono text-sm font-bold">
              PYG {fmtPyg(stats.totalPendiente)}
            </span>
          </div>
        </div>
      )}

      {/* Financial Summary */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
          <h2 className="text-gray-900 dark:text-white text-sm font-medium">Resumen Financiero</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FinItem l="Total Pendiente" v={stats.totalPendiente} pyg />
          <FinItem l="IVA Total" v={stats.totalIva} pyg />
          <FinItem l="Publicados" v={stats.posted} />
          <FinItem l="Errores" v={stats.errors} />
        </div>
      </div>

      {/* Filters + Batch */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={filter.search} onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Buscar por CDC, numero, emisor o RUC..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight" />
          </div>
          <select value={filter.status} onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="px-2.5 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight">
            <option value="all">Todos los estados</option>
            <option value="pending_reviewing">Pendientes + Revision</option>
            <option value="pending">Pendientes</option>
            <option value="reviewing">En Revision</option>
            <option value="posted">Publicados</option>
            <option value="error">Errores</option>
            <option value="rejected">Rechazados</option>
          </select>
          <select value={filter.docType} onChange={(e) => setFilter(prev => ({ ...prev, docType: e.target.value }))}
            className="px-2.5 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight">
            <option value="all">Todos los tipos</option>
            <option value="invoice">Factura</option>
            <option value="credit_note">Nota de Credito</option>
            <option value="debit_note">Nota de Debito</option>
          </select>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400">{selectedIds.size} seleccionados</span>
            <div className="flex-1" />
            <button onClick={batchStartReview} disabled={selActionable.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-500/20 disabled:opacity-40 no-tap-highlight">
              <Play className="h-3 w-3" />Revisar
            </button>
            <button onClick={batchApprove} disabled={selActionable.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-200 dark:hover:bg-green-500/20 disabled:opacity-40 no-tap-highlight">
              <ThumbsUp className="h-3 w-3" />Aprobar
            </button>
            <button onClick={batchReject} disabled={selActionable.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium hover:bg-red-200 dark:hover:bg-red-500/20 disabled:opacity-40 no-tap-highlight">
              <ThumbsDown className="h-3 w-3" />Rechazar
            </button>
            <button onClick={clearSelection} className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 no-tap-highlight">
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="hidden sm:grid sm:grid-cols-12 gap-2 p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
          <div className="col-span-1">
            <button onClick={() => allChecked ? clearSelection() : selectAll()} className="no-tap-highlight">
              {allChecked ? <CheckSquare className="h-4 w-4 text-blue-500" /> : <Square className="h-4 w-4 text-gray-300 dark:text-gray-600" />}
            </button>
          </div>
          <div className="col-span-3">Documento</div>
          <div className="col-span-2">Emisor</div>
          <div className="col-span-1">Fecha</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-1 text-right">IVA</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-1" />
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
          {filtered.map((doc) => {
            const sel = selectedIds.has(doc.id);
            const t = parseFloat(doc.total);
            const iv = parseFloat(doc.iva10 || "0") + parseFloat(doc.iva5 || "0");

            return (
              <div key={doc.id} className={cn(
                "p-3 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors no-tap-highlight cursor-pointer",
                doc.status === "pending" && "bg-yellow-50/30 dark:bg-yellow-500/5",
                doc.status === "reviewing" && "bg-purple-50/30 dark:bg-purple-500/5",
                doc.status === "error" && "bg-red-50/30 dark:bg-red-500/5",
              )}>
                {/* Mobile row */}
                <div className="sm:hidden">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); toggleSelect(doc.id); }} className="no-tap-highlight shrink-0">
                        {sel ? <CheckSquare className="h-4 w-4 text-blue-500" /> : <Square className="h-4 w-4 text-gray-300 dark:text-gray-600" />}
                      </button>
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center",
                        doc.docType === "credit_note" && "bg-red-50 dark:bg-red-500/10",
                        doc.docType === "debit_note" && "bg-amber-50 dark:bg-amber-500/10",
                        !doc.docType.startsWith("credit") && !doc.docType.startsWith("debit") && "bg-blue-50 dark:bg-blue-500/10")}>
                        <Receipt className={cn("h-4 w-4", doc.docType === "credit_note" && "text-red-500", doc.docType === "debit_note" && "text-amber-500", !doc.docType.startsWith("credit") && !doc.docType.startsWith("debit") && "text-blue-500")} />
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white text-sm font-mono">{doc.number}</p>
                        <p className="text-gray-400 text-xs">{doc.partnerName}</p>
                      </div>
                    </div>
                    <StatusBadge s={doc.status} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                    <span>{doc.issueDate}</span>
                    <span className="font-mono">PYG {fmtPyg(Math.abs(t))}</span>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="hidden sm:contents">
                  <div className="col-span-1">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(doc.id); }} className="no-tap-highlight">
                      {sel ? <CheckSquare className="h-4 w-4 text-blue-500" /> : <Square className="h-4 w-4 text-gray-300 dark:text-gray-600" />}
                    </button>
                  </div>
                  <div className="col-span-3 flex items-center gap-3 min-w-0">
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                      doc.docType === "credit_note" && "bg-red-50 dark:bg-red-500/10",
                      doc.docType === "debit_note" && "bg-amber-50 dark:bg-amber-500/10",
                      !doc.docType.startsWith("credit") && !doc.docType.startsWith("debit") && "bg-blue-50 dark:bg-blue-500/10")}>
                      <Receipt className={cn("h-4 w-4", doc.docType === "credit_note" && "text-red-500", doc.docType === "debit_note" && "text-amber-500", !doc.docType.startsWith("credit") && !doc.docType.startsWith("debit") && "text-blue-500")} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-gray-900 dark:text-white">{doc.number}</span>
                        {doc.docType === "credit_note" && <span className="text-[9px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">NC</span>}
                        {doc.docType === "debit_note" && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">ND</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{(doc.cdc || "").slice(0, 22)}...</p>
                    </div>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <p className="text-xs text-gray-900 dark:text-white truncate">{doc.partnerName}</p>
                    <p className="text-[10px] text-gray-400 font-mono">RUC: {doc.partnerRuc}</p>
                  </div>
                  <div className="col-span-1 flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Calendar className="h-3 w-3 shrink-0" />{doc.issueDate}
                  </div>
                  <div className="col-span-1 text-right font-mono text-xs tabular-nums text-gray-900 dark:text-white">
                    PYG {fmtPyg(Math.abs(t))}
                  </div>
                  <div className="col-span-1 text-right font-mono text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                    PYG {fmtPyg(Math.abs(iv))}
                  </div>
                  <div className="col-span-2">
                    <StatusBadge s={doc.status} />
                    {(doc.status === "pending" || doc.status === "reviewing") && doc.aiConfidence && (
                      <div className="flex items-center gap-1 mt-1">
                        <Sparkles className="h-3 w-3 text-purple-500" />
                        <span className="text-[10px] text-purple-500">{doc.aiConfidence}% IA</span>
                      </div>
                    )}
                    {doc.journalEntryId && (
                      <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{doc.journalEntryId}</p>
                    )}
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    {(doc.status === "pending" || doc.status === "reviewing") && (
                      <button onClick={(e) => { e.stopPropagation(); approveDocument(doc.id); }}
                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-500/10 rounded-lg no-tap-highlight" title="Aprobar">
                        <ThumbsUp className="h-3.5 w-3.5 text-green-500" />
                      </button>
                    )}
                    <button onClick={() => { setDetailDoc(doc); setMobileDetail(true); }}
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg no-tap-highlight">
                      <Eye className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <FileCode className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron documentos</p>
          </div>
        )}

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>{filtered.length} de {stats.total} documentos</span>
          <Link href="/sifen" className="text-blue-500 hover:underline">+ Cargar XML</Link>
        </div>
      </div>

      {/* Detail panel — Desktop */}
      {detailDoc && (
        <div className="hidden lg:block">
          <DetailPanel doc={detailDoc} onClose={() => setDetailDoc(null)}
            onApprove={() => { approveDocument(detailDoc.id); setDetailDoc(null); }}
            onReject={() => { rejectDocument(detailDoc.id); setDetailDoc(null); }} />
        </div>
      )}

      {/* Detail panel — Mobile */}
      {detailDoc && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileDetail(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-950 shadow-xl overflow-y-auto">
            <DetailPanel doc={detailDoc} onClose={() => setMobileDetail(false)}
              onApprove={() => { approveDocument(detailDoc.id); setMobileDetail(false); }}
              onReject={() => { rejectDocument(detailDoc.id); setMobileDetail(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────

function StatusBadge({ s }: { s: TaxDocument["status"] }) {
  const cfg: Record<string, { ic: any; lb: string; cl: string }> = {
    pending: { ic: Clock, lb: "Pendiente", cl: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
    reviewing: { ic: Play, lb: "En Revision", cl: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    approved: { ic: CheckCircle2, lb: "Aprobado", cl: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    posted: { ic: CheckCircle2, lb: "Publicado", cl: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" },
    error: { ic: AlertCircle, lb: "Error", cl: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" },
    rejected: { ic: ThumbsDown, lb: "Rechazado", cl: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" },
  };
  const c = cfg[s] || { ic: Clock, lb: s, cl: "" };
  const Icon = c.ic;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium", c.cl)}>
      <Icon className="h-3 w-3" />{c.lb}
    </span>
  );
}

// ─── Detail Panel ──────────────────────────────────────────────────────

function DetailPanel({ doc, onClose, onApprove, onReject }: {
  doc: TaxDocument; onClose: () => void; onApprove: () => void; onReject: () => void;
}) {
  const [showAi, setShowAi] = useState(true);
  const t = parseFloat(doc.total);
  const ai = doc.aiSuggestion;

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {TYPE_LABEL[doc.docType] || doc.docType} — {doc.number}
          </span>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg no-tap-highlight">
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <M label="CDC" v={(doc.cdc || "").slice(0, 24) + "..."} />
          <M label="Timbrado" v={doc.timbrado || "-"} />
          <M label="Tipo" v={TYPE_LABEL[doc.docType] || doc.docType} />
          <M label="Fecha" v={doc.issueDate} />
          <M label="Emisor" v={doc.partnerName || "-"} />
          <M label="RUC Emisor" v={doc.partnerRuc || "-"} />
          <M label="Condicion" v={doc.condition === "cash" ? "Contado" : doc.condition === "credit" ? "Credito" : "-"} />
          <M label="Estado" v={doc.status} />
        </div>

        {/* Amount */}
        <div className={cn("rounded-lg p-3 border", t > 0 ? "bg-green-50 dark:bg-green-500/10 border-green-200" : "bg-red-50 dark:bg-red-500/10 border-red-200")}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wide text-gray-400 font-medium">Total</span>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><p className="text-[10px] text-gray-400">Gravado 10%</p><p className="font-mono text-xs text-gray-700 dark:text-gray-300">PYG {fmtPyg(parseFloat(doc.gravado10))}</p></div>
            <div><p className="text-[10px] text-gray-400">IVA 10%</p><p className="font-mono text-xs text-gray-700 dark:text-gray-300">PYG {fmtPyg(parseFloat(doc.iva10))}</p></div>
          </div>
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <p className={cn("font-mono text-xl font-bold", t > 0 ? "text-green-600" : "text-red-600")}>
            PYG {fmtPyg(Math.abs(t))}
          </p>
        </div>

        {/* AI Suggestion */}
        {ai && (doc.status === "pending" || doc.status === "reviewing") && (
          <div className="bg-purple-50 dark:bg-purple-500/5 rounded-lg border border-purple-200 dark:border-purple-800/30 overflow-hidden">
            <button onClick={() => setShowAi(!showAi)}
              className="w-full p-3 flex items-center justify-between hover:bg-purple-100/50 dark:hover:bg-purple-500/10 no-tap-highlight">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  Asiento Sugerido por IA{ai.confidence ? ` — ${ai.confidence}%` : ""}
                </span>
              </div>
              {showAi ? <ChevronUp className="h-4 w-4 text-purple-400" /> : <ChevronDown className="h-4 w-4 text-purple-400" />}
            </button>
            {showAi && (
              <div className="p-3 pt-0 space-y-2">
                {ai.lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white dark:bg-gray-800/50 rounded p-2 text-xs">
                    <span className="font-mono text-gray-400 w-10 shrink-0">{line.accountCode}</span>
                    <span className="flex-1 text-gray-700 dark:text-gray-300">{line.description}</span>
                    {line.debit !== "0" && (
                      <span className="font-mono tabular-nums text-green-600">D: PYG {fmtPyg(parseInt(line.debit))}</span>
                    )}
                    {line.credit !== "0" && (
                      <span className="font-mono tabular-nums text-red-600">C: PYG {fmtPyg(parseInt(line.credit))}</span>
                    )}
                  </div>
                ))}
                <div className={cn("text-[10px] font-medium", ai.balanced ? "text-green-600" : "text-red-600")}>
                  {ai.balanced ? "Balanceado" : "Desbalanceado"}
                  {" — D: PYG "}{fmtPyg(ai.totalDebit)}
                  {" / C: PYG "}{fmtPyg(ai.totalCredit)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Journal Entry Ref */}
        {doc.journalEntryId && (
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
            <span className="text-[10px] text-gray-400">Asiento Generado</span>
            <p className="text-gray-900 dark:text-white font-mono text-sm">{doc.journalEntryId}</p>
          </div>
        )}

        {/* Error */}
        {doc.status === "error" && doc.metadata && (doc.metadata as any).error && (
          <div className="bg-red-50 dark:bg-red-500/5 rounded-lg p-3 border border-red-200 dark:border-red-800/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600 font-medium">Error SIFEN</span>
            </div>
            <p className="text-xs text-red-500">{(doc.metadata as any).error as string}</p>
          </div>
        )}

        {/* Actions */}
        {(doc.status === "pending" || doc.status === "reviewing") && (
          <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button onClick={onApprove}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium no-tap-highlight">
              <ThumbsUp className="h-4 w-4" />Aprobar y Publicar
            </button>
            <button onClick={onReject}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 rounded-lg text-sm font-medium no-tap-highlight">
              <ThumbsDown className="h-4 w-4" />Rechazar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────

function M({ label, v }: { label: string; v: string }) {
  return <div><span className="text-gray-400 text-[10px]">{label}</span><p className="text-gray-700 dark:text-gray-300 truncate text-xs">{v}</p></div>;
}

function StatCard({ t, v, ic: Icon, cl }: { t: string; v: number; ic: any; cl: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wide">{t}</span>
        <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", cl)} />
      </div>
      <p className={cn("text-lg sm:text-xl lg:text-2xl font-bold tabular-nums", cl)}>{v}</p>
    </div>
  );
}

function FinItem({ l, v, pyg }: { l: string; v: number; pyg?: boolean }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2.5 sm:p-3">
      <p className="text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs mb-0.5">{l}</p>
      <p className="text-gray-900 dark:text-white font-mono tabular-nums text-xs sm:text-sm">
        {pyg ? `PYG ${fmtPyg(Math.round(v))}` : v}
      </p>
    </div>
  );
}
