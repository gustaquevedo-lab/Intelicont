"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, RotateCcw, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useIdempotencyKey } from "@/lib/trpc-hooks";
import { actionLabel, dayOf, formatDateTime, SOURCE_LABELS } from "@/lib/audit-labels";

const gs = (v: number) => `₲ ${v.toLocaleString("es-PY")}`;

export default function AsientoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const utils = api.useUtils();
  const { data: entry, isLoading, error } = api["journal-entries"].get.useQuery({ id });
  const own = api.audit.list.useQuery({ entityId: entry?.entityId ?? "", targetId: id }, { enabled: !!entry });
  // `journal_entry.reversed` is recorded on the reversal entry, so the original's trail also shows it from the counterpart.
  const counterpart = entry?.reversedBy ?? entry?.reversalOf ?? undefined;
  const other = api.audit.list.useQuery({ entityId: entry?.entityId ?? "", targetId: counterpart, action: "journal_entry.reversed" }, { enabled: !!entry && !!counterpart });
  const events = [...(own.data?.events ?? []), ...(other.data?.events ?? [])]
    .filter((e, i, all) => all.findIndex((x) => x.id === e.id) === i)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  const [modal, setModal] = useState(false);

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>;
  if (error || !entry) return <p role="alert" className="p-8 text-sm text-red-500">{error?.message ?? "Asiento no encontrado"}</p>;

  const reversed = entry.status === "reversed";
  const isReversal = !!entry.reversalOf;
  const total = entry.lines.reduce((s, l) => s + l.debit, 0);
  const badge = reversed ? "Reversado" : isReversal ? "Reversión" : entry.status === "posted" ? "Posteado" : "Borrador";
  const refresh = async () => {
    await Promise.all([utils["journal-entries"].get.invalidate(), utils["journal-entries"].list.invalidate(), utils.audit.list.invalidate()]);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      <Link href="/asientos" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4" />Asientos</Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Asiento {entry.number}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{entry.description}</p>
          <p className="text-gray-500 text-xs mt-1">
            {dayOf(entry.date)} · {SOURCE_LABELS[entry.source ?? ""] ?? entry.source} · <span data-testid="estado" className={cn("font-medium", reversed ? "text-orange-500" : "text-green-600 dark:text-green-400")}>{badge}</span>
          </p>
          <div className="text-xs mt-2 space-x-4">
            {entry.document && (
              <Link href={`/libros?tab=${entry.document.direction === "issued" ? "iva_ventas" : "iva_compras"}&periodo=${String(entry.document.issueDate).slice(0, 7)}`} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                <FileText className="h-3 w-3" />Comprobante {entry.document.number}
              </Link>
            )}
            {entry.reversedBy && <Link href={`/asientos/${entry.reversedBy}`} className="text-orange-500 hover:underline">Ver asiento de reversión</Link>}
            {entry.reversalOf && <Link href={`/asientos/${entry.reversalOf}`} className="text-purple-500 hover:underline">Ver asiento original</Link>}
          </div>
        </div>
        {entry.status === "posted" && !reversed && !isReversal && (
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-500 text-white transition-colors self-start">
            <RotateCcw className="h-4 w-4" />Revertir
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm" aria-label="Líneas del asiento">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-800">
              <th className="p-3 font-medium">Cuenta</th>
              <th className="p-3 font-medium hidden sm:table-cell">Descripción</th>
              <th className="p-3 font-medium text-right">Débito</th>
              <th className="p-3 font-medium text-right">Crédito</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {entry.lines.map((l) => (
              <tr key={l.id}>
                <td className="p-3 text-gray-900 dark:text-white"><span className="font-mono text-xs text-gray-500 mr-2">{l.accountCode}</span>{l.accountName}</td>
                <td className="p-3 text-gray-500 hidden sm:table-cell">{l.description}</td>
                <td className="p-3 text-right tabular-nums">{l.debit ? gs(l.debit) : ""}</td>
                <td className="p-3 text-right tabular-nums">{l.credit ? gs(l.credit) : ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 dark:border-gray-800 font-medium">
              <td className="p-3" colSpan={2}>Total</td>
              <td className="p-3 text-right tabular-nums">{gs(total)}</td>
              <td className="p-3 text-right tabular-nums">{gs(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <section aria-label="Rastro de auditoría" className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Rastro de auditoría</h2>
        {own.isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        ) : own.error || other.error ? (
          <p role="alert" className="text-sm text-red-500">No se pudo cargar el rastro: {(own.error ?? other.error)!.message}</p>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li key={ev.id} className="text-sm flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="font-medium text-gray-900 dark:text-white">{actionLabel(ev.action)}</span>
                <span className="text-gray-500">{ev.actor?.name ?? "Sistema"}</span>
                <span className="text-gray-500 text-xs self-center">{formatDateTime(ev.createdAt)}</span>
                {ev.reason && <span className="w-full text-gray-500 text-xs">Motivo: {ev.reason}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {modal && <ReverseModal entryId={id} onClose={() => setModal(false)} onDone={refresh} />}
    </div>
  );
}

function ReverseModal({ entryId, onClose, onDone }: { entryId: string; onClose: () => void; onDone: () => Promise<void> }) {
  const [reason, setReason] = useState("");
  // One key per modal lifetime (one user action); renewed on success.
  const idem = useIdempotencyKey();
  const reverse = api["journal-entries"].reverse.useMutation({
    trpc: idem.trpc,
    onSuccess: async () => {
      idem.renew();
      try {
        await onDone();
      } finally {
        onClose();
      }
    },
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !reverse.isPending && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reverse.isPending, onClose]);
  const tooShort = reason.trim().length < 3;
  const locked = reverse.isPending || reverse.isSuccess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" aria-label="Revertir asiento" className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Revertir asiento</h2>
          <button aria-label="Cerrar" onClick={onClose} disabled={reverse.isPending} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="h-4 w-4 text-gray-400" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (!tooShort && !locked) reverse.mutate({ entryId, reason: reason.trim() }); }} className="space-y-4">
          <p className="text-xs text-gray-500">Se creará un contra-asiento. El asiento original no se modifica.</p>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Motivo
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required minLength={3} className="mt-1 w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white" />
          </label>
          {reverse.error && <p role="alert" className="text-sm text-red-500">{reverse.error.message}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={reverse.isPending} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancelar</button>
            <button type="submit" disabled={tooShort || locked} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium">Confirmar reversión</button>
          </div>
        </form>
      </div>
    </div>
  );
}
