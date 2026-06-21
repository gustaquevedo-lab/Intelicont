"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import {
  Receipt, Upload, CheckCircle2, Clock, AlertCircle,
  X, ChevronDown, Loader2, Sparkles, ThumbsUp, ThumbsDown,
  FileX, FileCheck, Eye, RefreshCw, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComprobanteRow } from "../actions";

import {
  ingestXML, loadProposal, approveProposal, rejectProposal,
} from "../actions";
import type { JournalProposal, ProposedLine } from "@/lib/ai/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOC_TYPE_LABEL: Record<string, string> = {
  factura:       "Factura",
  nota_credito:  "Nota Crédito",
  nota_debito:   "Nota Débito",
  autofactura:   "Autofactura",
  nota_remision: "Nota Remisión",
  retencion:     "Retención",
};

const STATUS_LABEL: Record<string, string> = {
  pending_review: "Pendiente",
  proposed:       "Propuesta IA",
  approved:       "Aprobado",
  rejected:       "Rechazado",
  posted:         "Posteado",
};

const STATUS_BADGE: Record<string, string> = {
  pending_review: "badge-yellow",
  proposed:       "bg-blue-50 text-blue-700 border border-blue-200",
  approved:       "badge-green",
  posted:         "badge-green",
  rejected:       "badge-gray",
};

const PROVIDER_LABEL: Record<string, string> = {
  rules:  "Reglas",
  gemini: "Gemini",
  openai: "OpenAI",
  claude: "Claude",
  ollama: "Ollama",
};

function fmt(n: number) {
  return `₲ ${n.toLocaleString("es-PY", { maximumFractionDigits: 0 })}`;
}

// ─── Review Panel ─────────────────────────────────────────────────────────────

interface ReviewPanelProps {
  docId:    string;
  onClose:  () => void;
  onDone:   (docId: string, newStatus: string) => void;
}

function ReviewPanel({ docId, onClose, onDone }: ReviewPanelProps) {
  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState<string | null>(null);
  const [docData, setDocData]       = useState<{ doc: Record<string, any>; proposal: JournalProposal | null } | null>(null);
  const [lines,   setLines]         = useState<ProposedLine[]>([]);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Load on mount
  const loaded = useRef(false);
  if (!loaded.current) {
    loaded.current = true;
    loadProposal(docId).then((r) => {
      setLoading(false);
      if (!r.ok) { setError(r.error); return; }
      setDocData(r.data as any);
      setLines(r.data.proposal?.lines ?? []);
    });
  }

  const totalDebit  = lines.reduce((s, l) => s + (l.debit  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.01;

  function updateLine(idx: number, field: keyof ProposedLine, value: string | number) {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  }

  function handleApprove() {
    if (!docData) return;
    const doc = docData.doc;
    setActionError(null);
    startTransition(async () => {
      const result = await approveProposal(
        docId,
        lines.map((l) => ({
          accountId:   l.accountId ?? "",
          debit:       Number(l.debit)  || 0,
          credit:      Number(l.credit) || 0,
          description: l.description,
        })),
        doc.entityId,
        doc.issueDate,
        `${DOC_TYPE_LABEL[doc.docType] ?? doc.docType} ${doc.docNumber ?? ""} - ${doc.issuerName}`.trim(),
      );
      if (result.ok) {
        onDone(docId, "posted");
        onClose();
      } else {
        setActionError(result.error);
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      await rejectProposal(docId);
      onDone(docId, "rejected");
      onClose();
    });
  }

  const confidence = docData?.proposal?.confidence ?? 0;
  const confColor  = confidence >= 0.8 ? "bg-secondary" : confidence >= 0.6 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Revisar Propuesta IA</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {docData && (
            <>
              {/* Doc summary */}
              <div className="card-flat p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Emisor</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{docData.doc.issuerName}</p>
                  <p className="text-xs text-gray-400 font-mono">{docData.doc.issuerRuc}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Número</p>
                  <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{docData.doc.docNumber ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Total</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(docData.doc.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">IVA</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    10%: {fmt(docData.doc.iva10)}<br/>
                    5%: {fmt(docData.doc.iva5)}
                  </p>
                </div>
              </div>

              {/* Confidence */}
              {docData.proposal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Confianza IA ({PROVIDER_LABEL[docData.proposal.provider] ?? docData.proposal.provider})</span>
                    <span className="font-bold text-gray-900 dark:text-white">{Math.round(confidence * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", confColor)} style={{ width: `${confidence * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 italic">{docData.proposal.reasoning}</p>
                </div>
              )}

              {/* Editable lines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Líneas del Asiento</h3>
                  <span className={cn("text-xs font-semibold px-2 py-1 rounded-lg", balanced ? "text-secondary bg-secondary-50" : "text-red-600 bg-red-50")}>
                    {balanced ? `✓ Balanceado ${fmt(totalDebit)}` : `✗ Débito ${fmt(totalDebit)} ≠ Crédito ${fmt(totalCredit)}`}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-700">
                        <th className="text-left py-2 px-2 text-gray-400 font-semibold w-32">Cuenta</th>
                        <th className="text-left py-2 px-2 text-gray-400 font-semibold">Descripción</th>
                        <th className="text-right py-2 px-2 text-gray-400 font-semibold w-28">Débito</th>
                        <th className="text-right py-2 px-2 text-gray-400 font-semibold w-28">Crédito</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                      {lines.map((l, i) => (
                        <tr key={i}>
                          <td className="py-2 px-2">
                            <span className={cn("font-mono text-xs", l.accountId ? "text-primary" : "text-red-500")}>
                              {l.accountCode || "—"}
                            </span>
                            <br />
                            <span className="text-gray-400 text-[10px] truncate block max-w-[8rem]">{l.accountName}</span>
                          </td>
                          <td className="py-1 px-2">
                            <input
                              type="text"
                              value={l.description}
                              onChange={(e) => updateLine(i, "description", e.target.value)}
                              className="w-full text-xs bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none py-0.5"
                            />
                          </td>
                          <td className="py-1 px-2">
                            <input
                              type="number"
                              value={l.debit || ""}
                              onChange={(e) => updateLine(i, "debit", parseFloat(e.target.value) || 0)}
                              className="w-full text-right text-xs bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none py-0.5 tabular-nums"
                            />
                          </td>
                          <td className="py-1 px-2">
                            <input
                              type="number"
                              value={l.credit || ""}
                              onChange={(e) => updateLine(i, "credit", parseFloat(e.target.value) || 0)}
                              className="w-full text-right text-xs bg-transparent border-b border-transparent hover:border-gray-200 focus:border-primary focus:outline-none py-0.5 tabular-nums"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200 dark:border-slate-600 font-bold">
                        <td colSpan={2} className="py-2 px-2 text-xs text-gray-500">Totales</td>
                        <td className="py-2 px-2 text-right text-xs tabular-nums text-gray-900 dark:text-white">{totalDebit.toLocaleString("es-PY")}</td>
                        <td className="py-2 px-2 text-right text-xs tabular-nums text-gray-900 dark:text-white">{totalCredit.toLocaleString("es-PY")}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {actionError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {actionError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {docData && (
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-gray-100 dark:border-slate-700 shrink-0">
            <button
              onClick={handleReject}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <ThumbsDown className="h-4 w-4" /> Rechazar
            </button>
            <button
              onClick={handleApprove}
              disabled={isPending || !balanced || lines.length < 2}
              className={cn(
                "btn-secondary text-sm",
                (!balanced || lines.length < 2) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isPending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Aprobando…</>
                : <><ThumbsUp className="h-4 w-4" /> Aprobar y Postear</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialData: ComprobanteRow[];
  entities:    Array<{ id: string; legalName: string; ruc: string }>;
  dbError?:    string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ComprobantesClient({ initialData, entities, dbError }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);

  const entityId = selectedEntity?.id || "";

  const [data,         setData]         = useState<ComprobanteRow[]>(initialData);
  const [perspective,  setPerspective]  = useState<"buyer" | "seller">("buyer");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterEntity, setFilterEntity] = useState("todos");
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState<string | null>(null);
  const [uploadSuccess,setUploadSuccess]= useState<string | null>(null);
  const [reviewDocId,  setReviewDocId]  = useState<string | null>(null);
  const [, startTransition]            = useTransition();

  const filtered = data.filter((d) => {
    const mS = filterStatus === "todos" || d.status === filterStatus ||
      (filterStatus === "pending" && (d.status === "pending_review" || d.status === "proposed"));
    const mE = filterEntity === "todos" || d.entityId === filterEntity;
    return mS && mE;
  });

  const pendientes = data.filter((d) => d.status === "pending_review" || d.status === "proposed").length;
  const aprobados  = data.filter((d) => d.status === "posted" || d.status === "approved").length;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!entityId) { setUploadError("Seleccioná una empresa primero"); return; }

    setUploadError(null);
    setUploadSuccess(null);
    setUploading(true);

    try {
      const xml    = await file.text();
      const result = await ingestXML(entityId, xml, file.name, perspective);

      if (!result.ok) {
        setUploadError(result.error);
      } else {
        const d = result.data;
        setUploadSuccess(
          `✓ ${DOC_TYPE_LABEL[d.parsed.docType] ?? d.parsed.docType} ${d.parsed.docNumber ?? ""} — ${d.parsed.issuerName} — ${fmt(d.parsed.total)} — Confianza IA: ${Math.round(d.confidence * 100)}% (${PROVIDER_LABEL[d.provider] ?? d.provider})`
        );
        // Reload list from server
        startTransition(() => {
          window.location.reload();
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Error al procesar el archivo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleReviewDone(docId: string, newStatus: string) {
    setData((prev) => prev.map((d) => d.id === docId ? { ...d, status: newStatus } : d));
  }

  return (
    <div className="page-container">

      {dbError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Error: {dbError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Comprobantes SIFEN</h1>
          <p className="section-subtitle">Ingestión de facturas electrónicas con propuesta IA</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/comprobantes/registrar"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/10"
          >
            <Plus className="h-4 w-4" /> Registrar Manual
          </a>
        </div>
      </div>

      {/* Upload card */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 dark:text-white text-sm mb-4 flex items-center gap-2">
          <Upload className="h-4 w-4 text-primary" /> Ingresar Comprobante XML
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Entity (Read-only Context badge) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Empresa Activa</label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300">
              <span className="uppercase truncate max-w-[200px]">
                {selectedEntity?.tradeName || selectedEntity?.legalName || "Cargando..."}
              </span>
            </div>
          </div>

          {/* Perspective */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Perspectiva</label>
            <div className="flex gap-1.5">
              {(["buyer","seller"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPerspective(p)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold transition-colors",
                    perspective === p
                      ? "bg-primary text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                  )}
                >
                  {p === "buyer" ? "📥 Compra" : "📤 Venta"}
                </button>
              ))}
            </div>
          </div>

          {/* File */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Archivo XML</label>
            <label className={cn(
              "flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors text-sm font-semibold",
              uploading
                ? "border-primary/30 bg-primary-50 text-primary cursor-not-allowed"
                : "border-gray-200 dark:border-slate-600 hover:border-primary hover:bg-primary-50 text-gray-500 hover:text-primary"
            )}>
              {uploading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Procesando con IA…</>
                : <><Upload className="h-4 w-4" /> Seleccionar .xml</>}
              <input
                ref={fileRef}
                type="file"
                accept=".xml,text/xml,application/xml"
                onChange={handleFileChange}
                disabled={uploading || !entityId}
                className="hidden"
              />
            </label>
          </div>
        </div>


        {/* Feedback */}
        {uploadError && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-secondary-50 border border-secondary-200 text-sm text-secondary-dark">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-secondary" /> {uploadSuccess}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",      value: data.length,   icon: Receipt,     color: "text-primary"    },
          { label: "Pendientes", value: pendientes,     icon: Clock,       color: "text-amber-600"  },
          { label: "Aprobados",  value: aprobados,      icon: FileCheck,   color: "text-secondary"  },
        ].map((s) => (
          <div key={s.label} className="card-flat p-4 flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", s.color === "text-primary" ? "bg-primary-50" : s.color === "text-amber-600" ? "bg-amber-50" : "bg-secondary-50")}>
              <s.icon className={cn("h-4 w-4", s.color)} />
            </div>
            <div>
              <p className={cn("text-xl font-black", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="card-flat overflow-hidden">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-gray-100 dark:border-slate-700 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {[
              { k: "todos",    l: "Todos"    },
              { k: "pending",  l: "Pendientes" },
              { k: "posted",   l: "Aprobados"  },
              { k: "rejected", l: "Rechazados" },
            ].map(({ k, l }) => (
              <button key={k} onClick={() => setFilterStatus(k)}
                className={cn("px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
                  filterStatus === k ? "bg-primary text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200")}>{l}</button>
            ))}
          </div>


        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {filtered.map((doc) => (
            <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 table-row-hover gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                  doc.status === "posted" || doc.status === "approved"
                    ? "bg-secondary-50 border-secondary-100" : doc.status === "rejected"
                    ? "bg-gray-50 border-gray-100" : doc.status === "proposed"
                    ? "bg-violet-50 border-violet-100" : "bg-amber-50 border-amber-100"
                )}>
                  {doc.status === "posted" || doc.status === "approved"
                    ? <FileCheck className="h-5 w-5 text-secondary" />
                    : doc.status === "rejected"
                    ? <FileX className="h-5 w-5 text-gray-400" />
                    : doc.status === "proposed"
                    ? <Sparkles className="h-5 w-5 text-violet-500" />
                    : <Receipt className="h-5 w-5 text-amber-500" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-white">{doc.docNumber ?? "SIN-NRO"}</span>
                    <span className={cn("inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold", STATUS_BADGE[doc.status] ?? "badge-gray")}>
                      {STATUS_LABEL[doc.status] ?? doc.status}
                    </span>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-lg text-xs font-medium border bg-gray-50 text-gray-500 border-gray-200">
                      {DOC_TYPE_LABEL[doc.docType] ?? doc.docType}
                    </span>
                    {doc.aiProvider && doc.aiConfidence !== null && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-200">
                        <Sparkles className="h-3 w-3" />
                        {PROVIDER_LABEL[doc.aiProvider] ?? doc.aiProvider} {Math.round((doc.aiConfidence ?? 0) * 100)}%
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">{doc.issuerName}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span className="font-mono">{doc.issuerRuc}</span>
                    <span className="text-gray-200 dark:text-gray-600">·</span>
                    <span>{doc.issueDate}</span>
                    <span className="text-gray-200 dark:text-gray-600">·</span>
                    <span className="truncate">{doc.entityName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:justify-end shrink-0 pl-13 sm:pl-0">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">{fmt(doc.total)}</p>
                  <p className="text-xs text-gray-400">{doc.currency}</p>
                </div>

                {doc.status === "proposed" && (
                  <button
                    onClick={() => setReviewDocId(doc.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> Revisar
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Receipt className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">
                {data.length === 0 ? "Subí el primer XML para comenzar" : "Sin comprobantes para ese filtro"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Review panel modal */}
      {reviewDocId && (
        <ReviewPanel
          docId={reviewDocId}
          onClose={() => setReviewDocId(null)}
          onDone={handleReviewDone}
        />
      )}
    </div>
  );
}
