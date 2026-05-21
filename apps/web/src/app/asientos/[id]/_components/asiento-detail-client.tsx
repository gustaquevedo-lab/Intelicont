"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, AlertCircle, Clock, RotateCcw,
  Send, Loader2, Building2, Calendar, FileText, Hash,
  TrendingUp, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  postearAsiento, reverseJournalEntry,
  type AsientoDetail,
} from "../../actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatGs(n: number) {
  if (!n && n !== 0) return "—";
  return n.toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-PY", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

const STATUS_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  draft:    { label: "Borrador",  icon: Clock,         cls: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800" },
  posted:   { label: "Posteado", icon: CheckCircle2,   cls: "bg-green-100  dark:bg-green-900/30  text-green-800  dark:text-green-300  border border-green-200  dark:border-green-800"  },
  reversed: { label: "Revertido",icon: RotateCcw,      cls: "bg-gray-100   dark:bg-gray-800      text-gray-600   dark:text-gray-400   border border-gray-200   dark:border-gray-700"   },
};

const SOURCE_LABEL: Record<string, string> = {
  manual:    "Manual",
  purchase:  "Compra SIFEN",
  sale:      "Venta SIFEN",
  bank:      "Bancario",
  payroll:   "Nómina",
  closing:   "Cierre",
  adjustment:"Ajuste",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  asiento: AsientoDetail;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AsientoDetailClient({ asiento }: Props) {
  const router = useRouter();
  const [isPosting,    startPost]    = useTransition();
  const [isReversing,  startReverse] = useTransition();
  const [feedback,     setFeedback]  = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showRevModal, setRevModal]  = useState(false);
  const [revDesc,      setRevDesc]   = useState(`Reversión de ${asiento.number}`);

  const status = STATUS_META[asiento.status] ?? STATUS_META.draft;
  const StatusIcon = status.icon;

  const balanced  = Math.abs(asiento.totalDebit - asiento.totalCredit) < 0.01;
  const isPosted  = asiento.status === "posted";
  const isDraft   = asiento.status === "draft";

  function handlePostear() {
    setFeedback(null);
    startPost(async () => {
      const result = await postearAsiento(asiento.id);
      if (result.ok) {
        setFeedback({ type: "success", msg: "Asiento posteado. Ya es inmutable." });
        router.refresh();
      } else {
        setFeedback({ type: "error", msg: result.error });
      }
    });
  }

  function handleReverse() {
    setFeedback(null);
    setRevModal(false);
    startReverse(async () => {
      const result = await reverseJournalEntry(asiento.id, revDesc);
      if (result.ok) {
        setFeedback({ type: "success", msg: `Contra-asiento ${result.data.number} creado y posteado.` });
        router.refresh();
        setTimeout(() => router.push(`/asientos/${result.data.id}`), 1500);
      } else {
        setFeedback({ type: "error", msg: result.error });
      }
    });
  }

  return (
    <div className="page-container max-w-5xl print:p-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 no-print">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push("/asientos")}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors mt-0.5"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="section-title text-2xl">{asiento.number || "Sin número"}</h1>
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", status.cls)}>
                <StatusIcon className="h-3.5 w-3.5" /> {status.label}
              </span>
            </div>
            <p className="section-subtitle">{asiento.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => window.print()}
            className="btn-ghost text-sm flex items-center gap-2"
          >
            <Printer className="h-4 w-4" /> Imprimir
          </button>

          {isDraft && (
            <button
              onClick={handlePostear}
              disabled={isPosting || !balanced}
              className="btn-secondary flex items-center gap-2"
              title={!balanced ? "El asiento está desbalanceado" : ""}
            >
              {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isPosting ? "Posteando…" : "Postear"}
            </button>
          )}

          {isPosted && !asiento.reversalOf && (
            <button
              onClick={() => setRevModal(true)}
              disabled={isReversing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50"
            >
              {isReversing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {isReversing ? "Revirtiendo…" : "Revertir"}
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          "flex items-center gap-2 p-4 rounded-xl border text-sm",
          feedback.type === "success"
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
        )}>
          {feedback.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle  className="h-4 w-4 shrink-0" />}
          {feedback.msg}
        </div>
      )}

      {/* Reversal banner */}
      {asiento.reversalOf && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
          <RotateCcw className="h-4 w-4 shrink-0" />
          <span>Este asiento es una <strong>reversión</strong> de otro asiento posteado.</span>
          <button
            onClick={() => router.push(`/asientos/${asiento.reversalOf}`)}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Ver original
          </button>
        </div>
      )}

      {/* Metadata grid */}
      <div className="card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Building2 className="h-3.5 w-3.5" /> Empresa
          </div>
          <p className="font-semibold text-gray-900 dark:text-white truncate">{asiento.entityName}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Calendar className="h-3.5 w-3.5" /> Fecha
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">{formatDate(asiento.date)}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <Hash className="h-3.5 w-3.5" /> Número
          </div>
          <p className="font-semibold text-gray-900 dark:text-white font-mono">{asiento.number}</p>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
            <FileText className="h-3.5 w-3.5" /> Origen
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">{SOURCE_LABEL[asiento.source] ?? asiento.source}</p>
        </div>
        {asiento.postedAt && (
          <div className="col-span-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Posteado
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              {new Date(asiento.postedAt).toLocaleString("es-PY")}
            </p>
          </div>
        )}
      </div>

      {/* Balance summary */}
      <div className={cn(
        "card p-4 flex flex-col sm:flex-row items-center justify-between gap-4",
        balanced ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10" : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
      )}>
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Total Débitos</p>
            <p className="text-xl font-bold font-mono text-gray-900 dark:text-white tabular-nums">
              ₲ {formatGs(asiento.totalDebit)}
            </p>
          </div>
          <div className="text-2xl text-gray-400">=</div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Total Créditos</p>
            <p className="text-xl font-bold font-mono text-gray-900 dark:text-white tabular-nums">
              ₲ {formatGs(asiento.totalCredit)}
            </p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full",
          balanced
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        )}>
          {balanced ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {balanced ? "Doble partida ✓" : "Desbalanceado"}
        </div>
      </div>

      {/* Lines table */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 dark:border-slate-700">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-gray-900 dark:text-white text-sm">Líneas del asiento</h2>
          <span className="ml-auto text-xs text-gray-400">{asiento.lineas.length} líneas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800/50">
              <tr>
                <th className="text-left py-2.5 px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8">#</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Código</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cuenta</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Detalle</th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">Débito ₲</th>
                <th className="text-right py-2.5 px-5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">Crédito ₲</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {asiento.lineas.map((line, idx) => (
                <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-5 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-primary bg-primary-50 dark:bg-primary/10 px-1.5 py-0.5 rounded">
                      {line.accountCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{line.accountName}</td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs hidden md:table-cell">
                    {line.description || <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-gray-900 dark:text-white">
                    {line.debit > 0 ? formatGs(line.debit) : <span className="text-gray-200 dark:text-gray-700">—</span>}
                  </td>
                  <td className="py-3 px-5 text-right font-mono tabular-nums text-gray-900 dark:text-white">
                    {line.credit > 0 ? formatGs(line.credit) : <span className="text-gray-200 dark:text-gray-700">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-slate-800/50 border-t-2 border-gray-200 dark:border-slate-700">
              <tr>
                <td colSpan={4} className="py-3 px-5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-right">
                  TOTALES
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-gray-900 dark:text-white">
                  {formatGs(asiento.totalDebit)}
                </td>
                <td className="py-3 px-5 text-right font-mono font-bold tabular-nums text-gray-900 dark:text-white">
                  {formatGs(asiento.totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Reversal Modal */}
      {showRevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">Revertir asiento</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Se creará un contra-asiento inverso</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
              <strong>Asiento {asiento.number}</strong> — {formatDate(asiento.date)}<br />
              Total: ₲ {formatGs(asiento.totalDebit)}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Descripción del contra-asiento
              </label>
              <input
                type="text"
                value={revDesc}
                onChange={(e) => setRevDesc(e.target.value)}
                className="input-field"
                placeholder="Motivo de la reversión"
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              El asiento original quedará marcado como <strong>Revertido</strong>. Esta operación no se puede deshacer.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRevModal(false)}
                className="flex-1 btn-ghost"
              >
                Cancelar
              </button>
              <button
                onClick={handleReverse}
                disabled={!revDesc.trim() || isReversing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
              >
                {isReversing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Confirmar reversión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
