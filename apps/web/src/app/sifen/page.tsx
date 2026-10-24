"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  FileCode,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Clock,
  AlertTriangle,
  Copy,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/trpc/client";
import type { Suggestion } from "@intelicont/ledger/ai";

type IngestOutcome = { fileName: string; status: "saved" | "duplicate" | "error"; warnings: string[]; message?: string };
type PostableAccount = { id: string; code: string; name: string };
type SifenMeta = { sifen?: { issuer?: { name?: string } } } | null;
type Posted = { documentNumber: string; entryNumber: string };

const DOC_LABEL: Record<string, string> = {
  invoice: "Factura", credit_note: "Nota de crédito", debit_note: "Nota de débito", self_invoice: "Autofactura", remito: "Remito",
};
const gs = (n: number) => `₲ ${n.toLocaleString("es-PY")}`;
const errMsg = (e: unknown, fallback: string) => {
  if (!(e instanceof Error)) return fallback;
  const ref = (e as { data?: { requestId?: unknown } }).data?.requestId;
  return typeof ref === "string" ? `${e.message} (ref ${ref.slice(0, 8)})` : e.message;
};

export default function SifenPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const entity = useAuthStore((s) => s.selectedEntity);
  const entityId = entity?.id ?? "";
  const utils = api.useUtils();
  const pending = api["tax-documents"].pending.useQuery({ entityId }, { enabled: !!entityId });
  const accountsQuery = api.accounts.list.useQuery({ entityId }, { enabled: !!entityId });
  const postable: PostableAccount[] = (accountsQuery.data ?? []).filter((a) => a.allowsPosting);
  const [posted, setPosted] = useState<Posted[]>([]);

  // Server-side ingest (validate, dedupe, store): one Idempotency-Key per uploaded file.
  const [outcomes, setOutcomes] = useState<IngestOutcome[]>([]);
  const fileKeys = useRef(new WeakMap<File, string>());
  const ingestFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      let outcome: IngestOutcome;
      if (!entity) {
        outcome = { fileName: file.name, status: "error", warnings: [], message: "Seleccioná una empresa antes de cargar" };
      } else {
        let key = fileKeys.current.get(file);
        if (!key) fileKeys.current.set(file, (key = crypto.randomUUID()));
        try {
          const xml = await file.text();
          const r = await utils.client["tax-documents"].ingestXml.mutate(
            { entityId: entity.id, direction: "received", xml },
            { context: { idempotencyKey: key } },
          );
          outcome = { fileName: file.name, status: r.duplicate ? "duplicate" : "saved", warnings: r.warnings };
        } catch (e) {
          outcome = { fileName: file.name, status: "error", warnings: [], message: errMsg(e, "Error al guardar") };
        }
      }
      setOutcomes((prev) => [...prev, outcome]);
    }
    void utils["tax-documents"].pending.invalidate();
  }, [entity, utils]);

  const handleFiles = useCallback((files: FileList) => {
    const xmlFiles = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".xml"));
    if (xmlFiles.length > 0) void ingestFiles(xmlFiles);
  }, [ingestFiles]);

  const onPosted = useCallback((p: Posted) => {
    setPosted((prev) => [p, ...prev]);
    void utils["tax-documents"].pending.invalidate();
  }, [utils]);

  const docs = pending.data ?? [];

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Carga de Facturas SIFEN</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Cargá los XML de comprobantes electrónicos. La IA sugiere el asiento y vos lo aprobás antes de postear.
          </p>
        </div>
        <Link
          href="/sifen/historial"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight self-start"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Historial</span>
        </Link>
      </div>

      <div
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all no-tap-highlight overflow-hidden",
          isDragging
            ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10"
            : "glass-card border-gray-300 dark:border-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-900/50",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={(e) => { const files = e.target.files; if (files && files.length > 0) handleFiles(files); e.target.value = ""; }}
        />
        <div className="space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center mx-auto">
            <FileCode className="h-7 w-7 text-blue-500 dark:text-blue-400" />
          </div>
          <p className="text-gray-900 dark:text-white text-base sm:text-lg font-medium">Arrastrá tus archivos XML aquí</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">o hacé clic para seleccionar — múltiples archivos permitidos</p>
        </div>
      </div>

      <IngestOutcomes outcomes={outcomes} />

      {posted.length > 0 && (
        <ul aria-label="Asientos publicados" className="space-y-2">
          {posted.map((p) => (
            <li key={p.entryNumber} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-sm">
              <span className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Asiento {p.entryNumber} publicado ({p.documentNumber})
              </span>
              <Link href="/asientos" className="flex items-center gap-1 text-green-700 dark:text-green-400 font-medium hover:underline shrink-0">
                Ver asientos <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section aria-label="Comprobantes pendientes" className="space-y-3">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">Comprobantes pendientes de contabilizar</h2>
        {!entity && <p className="text-xs text-gray-500">Seleccioná una empresa para ver sus comprobantes.</p>}
        {entity && pending.isLoading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
        {entity && !pending.isLoading && docs.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">No hay comprobantes pendientes.</p>
        )}
        {docs.map((d) => (
          <PendingDocument
            key={d.id}
            doc={{
              id: d.id, number: d.number, docType: d.docType, issueDate: String(d.issueDate), cdc: d.cdc,
              total: Number(d.total), issuer: (d.metadata as SifenMeta)?.sifen?.issuer?.name ?? "",
            }}
            accounts={postable}
            onPosted={onPosted}
          />
        ))}
      </section>
    </div>
  );
}

type DocView = { id: string; number: string; docType: string; issueDate: string; cdc: string | null; total: number; issuer: string };

function PendingDocument({ doc, accounts, onPosted }: { doc: DocView; accounts: PostableAccount[]; onPosted: (p: Posted) => void }) {
  const utils = api.useUtils();
  const [proposal, setProposal] = useState<{ decisionId: string; suggestion: Suggestion } | null>(null);
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<"suggest" | "approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  // One Idempotency-Key per (document, decision) and action: a double click or retry replays.
  const keys = useRef(new Map<string, string>());
  const keyFor = (action: string, decisionId: string) => {
    const k = `${action}:${doc.id}:${decisionId}`;
    let v = keys.current.get(k);
    if (!v) keys.current.set(k, (v = crypto.randomUUID()));
    return v;
  };

  const suggest = async (refresh = false) => {
    setBusy("suggest");
    setError(null);
    try {
      const r = await utils.client["tax-documents"].suggestEntry.mutate({ documentId: doc.id, refresh });
      setProposal(r);
      setAccountIds(r.suggestion.lines.map((l) => l.accountId ?? ""));
      setRejecting(false);
    } catch (e) {
      setError(errMsg(e, "No se pudo sugerir el asiento"));
    } finally {
      setBusy(null);
    }
  };

  const approve = async () => {
    if (!proposal) return;
    setBusy("approve");
    setError(null);
    const edited = proposal.suggestion.lines.some((l, i) => (l.accountId ?? "") !== accountIds[i]);
    try {
      const r = await utils.client["tax-documents"].approveEntry.mutate(
        {
          documentId: doc.id,
          decisionId: proposal.decisionId,
          ...(edited && {
            lines: proposal.suggestion.lines.map((l, i) => ({ accountId: accountIds[i], debit: l.debit, credit: l.credit, description: l.description })),
          }),
        },
        { context: { idempotencyKey: keyFor(edited ? `approve-${accountIds.join(",")}` : "approve", proposal.decisionId) } },
      );
      onPosted({ documentNumber: doc.number, entryNumber: r.number });
    } catch (e) {
      setError(errMsg(e, "No se pudo postear el asiento"));
    } finally {
      setBusy(null);
    }
  };

  const reject = async () => {
    if (!proposal || reason.trim().length < 3) return;
    setBusy("reject");
    setError(null);
    try {
      await utils.client["tax-documents"].rejectSuggestion.mutate(
        { decisionId: proposal.decisionId, reason: reason.trim() },
        { context: { idempotencyKey: keyFor("reject", proposal.decisionId) } },
      );
      setProposal(null);
      setRejecting(false);
      setReason("");
    } catch (e) {
      setError(errMsg(e, "No se pudo rechazar"));
    } finally {
      setBusy(null);
    }
  };

  const s = proposal?.suggestion;
  const pct = s ? Math.round(s.confidence * 100) : 0;
  // A local-model proposal is never shown as "green", whatever its score.
  const tone = s?.provider === "ollama" ? "bg-amber-500" : pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500";
  const missingAccount = accountIds.some((id) => !id);

  return (
    <article
      aria-label={`Comprobante ${doc.number}`}
      className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
    >
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {DOC_LABEL[doc.docType] ?? "Comprobante"} {doc.number}
            <span className="text-gray-500 dark:text-gray-400 font-normal"> · {doc.issueDate}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{doc.issuer || "—"} · <span className="font-mono">{gs(doc.total)}</span></p>
          {doc.cdc && <p className="text-[10px] text-gray-400 font-mono truncate">CDC {doc.cdc}</p>}
        </div>
        {!proposal && (
          <button
            onClick={() => suggest()}
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-60 shrink-0"
          >
            {busy === "suggest" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Sugerir asiento
          </button>
        )}
      </div>

      {error && <p role="alert" className="px-3 sm:px-4 pb-3 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {s && proposal && (
        <div aria-label="Asiento propuesto" className="border-t border-purple-200 dark:border-purple-800/40 bg-purple-50/40 dark:bg-purple-900/10 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
              {s.provider === "ollama" ? "IA local" : "Reglas"}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300">Confianza {pct}%</span>
            <div className="h-1.5 w-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden" aria-hidden>
              <div className={cn("h-full", tone)} style={{ width: `${pct}%` }} />
            </div>
          </div>
          {s.provider === "ollama" && (
            <p role="note" className="flex items-start gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-2 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> Sugerido por IA local — revisá con atención
            </p>
          )}
          {s.fallbackReason && (
            <p className="flex items-start gap-1 text-xs text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {s.fallbackReason}
            </p>
          )}
          <p className="text-xs text-gray-700 dark:text-gray-300">{s.rationale}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 text-gray-400 text-[10px] sm:text-xs">Cuenta</th>
                  <th className="text-right py-2 text-gray-400 text-[10px] sm:text-xs">Debe</th>
                  <th className="text-right py-2 text-gray-400 text-[10px] sm:text-xs">Haber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {s.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2">
                      <select
                        aria-label={`Cuenta de la línea ${i + 1}`}
                        value={accountIds[i] ?? ""}
                        onChange={(e) => setAccountIds((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                        className="w-full max-w-xs px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white"
                      >
                        <option value="">Elegí una cuenta…</option>
                        {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} {a.name}</option>)}
                      </select>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-xs">{l.description}</p>
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-gray-900 dark:text-white">{l.debit ? gs(l.debit) : "—"}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-gray-900 dark:text-white">{l.credit ? gs(l.credit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                  <td className="py-2 text-right text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">TOTALES</td>
                  <td className="py-2 text-right font-mono font-bold tabular-nums">{gs(s.lines.reduce((a, l) => a + l.debit, 0))}</td>
                  <td className="py-2 text-right font-mono font-bold tabular-nums">{gs(s.lines.reduce((a, l) => a + l.credit, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {s.sources.length > 0 && (
            <details className="text-xs text-gray-600 dark:text-gray-400">
              <summary className="cursor-pointer">Fuentes ({s.sources.length})</summary>
              <ul aria-label="Fuentes" className="list-disc pl-5 mt-1 space-y-0.5">
                {s.sources.map((src) => <li key={src} className="break-all">{src}</li>)}
              </ul>
            </details>
          )}

          {rejecting ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                aria-label="Motivo del rechazo"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo del rechazo (mín. 3 caracteres)"
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm"
              />
              <button onClick={reject} disabled={busy !== null || reason.trim().length < 3} className="px-3 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-500 text-white disabled:opacity-60">
                Confirmar rechazo
              </button>
              <button onClick={() => setRejecting(false)} className="px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700">Cancelar</button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button onClick={() => suggest(true)} disabled={busy !== null} className="px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-700 disabled:opacity-60">
                Volver a sugerir
              </button>
              <button
                onClick={() => setRejecting(true)}
                disabled={busy !== null}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" /> Rechazar
              </button>
              <button
                onClick={approve}
                disabled={busy !== null || missingAccount || s.lines.length < 2}
                title={missingAccount ? "Elegí una cuenta para cada línea" : undefined}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20 disabled:opacity-60"
              >
                {busy === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Aprobar y postear
              </button>
            </div>
          )}
          {missingAccount && <p className="text-xs text-yellow-700 dark:text-yellow-400">Elegí una cuenta para cada línea antes de aprobar.</p>}
        </div>
      )}
    </article>
  );
}

function IngestOutcomes({ outcomes }: { outcomes: IngestOutcome[] }) {
  if (outcomes.length === 0) return null;
  const chip = {
    saved: { label: "Guardado", cls: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400", Icon: CheckCircle2 },
    duplicate: { label: "Duplicado (ya existía)", cls: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", Icon: Copy },
    error: { label: "Error", cls: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400", Icon: AlertTriangle },
  } as const;
  return (
    <ul aria-label="Resultado de la carga" className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
      {outcomes.map((o, i) => {
        const { label, cls, Icon } = chip[o.status];
        return (
          <li key={i} className="p-3 text-xs sm:text-sm space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-gray-700 dark:text-gray-300">{o.fileName}</span>
              <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full font-medium shrink-0", cls)}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            </div>
            {o.message && <p className="text-red-600 dark:text-red-400">{o.message}</p>}
            {o.warnings.map((w) => (
              <p key={w} className="flex items-start gap-1 text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {w}
              </p>
            ))}
          </li>
        );
      })}
    </ul>
  );
}
