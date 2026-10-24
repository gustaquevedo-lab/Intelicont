"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Receipt,
  Calendar,
  Building2,
  Search,
  ArrowLeft,
  ArrowRight,
  Hash,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";
import type { AppRouter } from "@/trpc";
import type { inferRouterOutputs } from "@trpc/server";

type Out = inferRouterOutputs<AppRouter>["reports"];
type IvaRow = Out["libroIva"]["rows"][number];
type IvaTotals = Out["libroIva"]["totals"];
type DiarioRow = Out["diario"]["rows"][number];
type SumasRow = Out["sumasSaldos"]["rows"][number];

type LibroTab = "iva_compras" | "iva_ventas" | "diario" | "mayor" | "sumas_saldos";

const NATURE_LABELS: Record<string, string> = {
  asset: "Activo",
  liability: "Pasivo",
  equity: "Patrimonio",
  income: "Ingreso",
  expense: "Gasto",
};

const NATURE_COLORS: Record<string, string> = {
  asset: "text-emerald-600 dark:text-emerald-400",
  liability: "text-red-600 dark:text-red-400",
  equity: "text-blue-600 dark:text-blue-400",
  income: "text-green-600 dark:text-green-400",
  expense: "text-orange-600 dark:text-orange-400",
};

const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual", sales: "Ventas", purchase: "Compras", payment: "Pago", collection: "Cobro", bank: "Banco",
  depreciation: "Depreciación", fx_adjustment: "Dif. de cambio", payroll: "Sueldos", import: "Importación", sifen: "XML SIFEN",
};

const gs = (v: number) => `₲ ${v.toLocaleString("es-PY")}`;
const PAGE = 500;

/** Current month in Asunción, `YYYY-MM`. */
const currentMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }).slice(0, 7);

/** First and last day of a `YYYY-MM` month. */
function monthRange(periodo: string) {
  const [y, m] = periodo.split("-").map(Number);
  return { year: y, month: m, from: `${periodo}-01`, to: new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10) };
}

export default function LibrosPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [activeLibro, setActiveLibro] = useState<LibroTab>("iva_compras");
  const [periodo, setPeriodo] = useState(currentMonth);
  const [search, setSearch] = useState("");
  const [mayorAccountId, setMayorAccountId] = useState<string | null>(null);

  const tabs: { id: LibroTab; label: string; shortLabel: string; icon: typeof Receipt }[] = [
    { id: "iva_compras", label: "IVA Compras", shortLabel: "Compras", icon: Receipt },
    { id: "iva_ventas", label: "IVA Ventas", shortLabel: "Ventas", icon: FileText },
    { id: "diario", label: "Libro Diario", shortLabel: "Diario", icon: BookOpen },
    { id: "mayor", label: "Libro Mayor", shortLabel: "Mayor", icon: Hash },
    { id: "sumas_saldos", label: "Sumas y Saldos", shortLabel: "S&S", icon: FileSpreadsheet },
  ];

  // Deep links from the Form 104: /libros?tab=iva_compras|iva_ventas&periodo=YYYY-MM (applied after hydration).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tab = q.get("tab"), p = q.get("periodo");
    if (tab === "iva_compras" || tab === "iva_ventas") setActiveLibro(tab);
    if (p && /^\d{4}-(0[1-9]|1[0-2])$/.test(p)) setPeriodo(p);
  }, []);

  const range = monthRange(periodo || currentMonth());

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Libros Contables</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Libro IVA, Diario, Mayor y Sumas y Saldos — {periodo}
            {entity && <> · {entity.tradeName || entity.legalName}</>}
          </p>
        </div>
        <input
          type="month"
          aria-label="Período"
          value={periodo}
          onChange={(e) => { setPeriodo(e.target.value); setMayorAccountId(null); }}
          className="px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
        />
      </div>

      {/* Tabs */}
      <div role="tablist" className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-1.5 flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeLibro === tab.id}
              aria-label={tab.label}
              onClick={() => { setActiveLibro(tab.id); setMayorAccountId(null); setSearch(""); }}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all flex-1 justify-center min-w-[60px] sm:min-w-[120px] no-tap-highlight",
                activeLibro === tab.id
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {!entity ? (
        <EmptyState icon={Building2} text="Seleccioná una empresa para ver sus libros" />
      ) : (
        <>
          {(activeLibro === "iva_compras" || activeLibro === "iva_ventas") && (
            <LibroIVA
              key={activeLibro}
              entityId={entity.id}
              year={range.year}
              month={range.month}
              side={activeLibro === "iva_compras" ? "compras" : "ventas"}
              search={search}
              onSearch={setSearch}
            />
          )}
          {activeLibro === "diario" && <LibroDiario key={periodo} entityId={entity.id} from={range.from} to={range.to} />}
          {activeLibro === "mayor" && !mayorAccountId && (
            <LibroMayorList entityId={entity.id} from={range.from} to={range.to} onSelect={setMayorAccountId} />
          )}
          {activeLibro === "mayor" && mayorAccountId && (
            <LibroMayorDetail entityId={entity.id} accountId={mayorAccountId} from={range.from} to={range.to} onBack={() => setMayorAccountId(null)} />
          )}
          {activeLibro === "sumas_saldos" && <SumasYSaldos entityId={entity.id} from={range.from} to={range.to} />}
        </>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Receipt; text: string }) {
  return (
    <div className="p-8 sm:p-12 text-center">
      <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">{text}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="p-8 flex justify-center text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin" aria-label="Cargando" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return <p role="alert" className="p-4 text-sm text-red-600 dark:text-red-400">{message}</p>;
}

function EntryLink({ entryId, children }: { entryId: string | null; children: React.ReactNode }) {
  if (!entryId) return <>{children}</>;
  return (
    <Link href={`/asientos/${entryId}`} className="hover:underline text-blue-600 dark:text-blue-400" title="Ver asiento">
      {children}
    </Link>
  );
}

// IVA Book Component
function LibroIVA({ entityId, year, month, side, search, onSearch }: {
  entityId: string; year: number; month: number; side: "compras" | "ventas"; search: string; onSearch: (s: string) => void;
}) {
  const q = api.reports.libroIva.useQuery({ entityId, year, month, side });
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase();
    const all = q.data?.rows ?? [];
    if (!s) return all;
    return all.filter((e) =>
      (e.counterparty ?? "").toLowerCase().includes(s) || e.number.includes(s) || (e.counterpartyRuc ?? "").includes(s) || (e.cdc ?? "").includes(s));
  }, [q.data, search]);
  const totals: IvaTotals = q.data?.totals ?? { gravado10: 0, gravado5: 0, exento: 0, iva10: 0, iva5: 0, total: 0 };
  const label = side === "compras" ? "Compras" : "Ventas";
  const ivaKind = side === "compras" ? "Crédito" : "Débito";
  const signed = (e: IvaRow, v: number) => gs(v * e.sign);

  return (
    <>
      {/* Totals */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4" aria-label={`Resumen IVA ${label}`}>
        <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-3">Resumen IVA {label}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <TotalItem label="Gravado 10%" value={totals.gravado10} />
          <TotalItem label="Gravado 5%" value={totals.gravado5} />
          <TotalItem label="Exento" value={totals.exento} />
          <TotalItem label={`IVA 10% ${ivaKind}`} value={totals.iva10} highlight={side === "ventas"} />
          <TotalItem label={`IVA 5% ${ivaKind}`} value={totals.iva5} />
          <TotalItem label="Total" value={totals.total} bold />
        </div>
      </div>

      {/* Entries */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar por nombre, RUC, número o CDC..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
            />
          </div>
        </div>

        {q.isLoading ? <Loading /> : q.error ? <ErrorState message={q.error.message} /> : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs" aria-label={`Libro IVA ${label}`}>
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                    {["Fecha", "Comprobante", "RUC", "Nombre"].map((h) => (
                      <th key={h} className="text-left py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">{h}</th>
                    ))}
                    {["Grav. 10%", "Grav. 5%", "Exento", "IVA 10%", "IVA 5%", "Total"].map((h) => (
                      <th key={h} className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {rows.map((e) => (
                    <tr key={e.documentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{e.date}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-700 dark:text-gray-300">
                            <EntryLink entryId={e.entryId}>{e.number}</EntryLink>
                          </span>
                          {e.sign < 0 && <span className="text-[9px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">NC</span>}
                          {e.docType === "debit_note" && <span className="text-[9px] px-1 py-0.5 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">ND</span>}
                          {e.totalOnly && <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">solo total</span>}
                          {!e.entryId && <span className="text-[9px] px-1 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">sin asiento</span>}
                        </div>
                        {e.cdc && <p className="font-mono text-[9px] text-gray-400 mt-0.5">CDC {e.cdc}</p>}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-gray-500 dark:text-gray-400">{e.counterpartyRuc ?? "—"}</td>
                      <td className="py-2.5 px-3 text-gray-900 dark:text-gray-200">{e.counterparty ?? "—"}</td>
                      {[e.gravado10, e.gravado5, e.exento, e.iva10, e.iva5].map((v, i) => (
                        <td key={i} className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">{signed(e, v)}</td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums font-medium">{signed(e, e.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <td className="py-2.5 px-3" colSpan={4}>
                      <span className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide text-[10px]">TOTALES ({q.data?.rows.length ?? 0} registros)</span>
                    </td>
                    {[totals.gravado10, totals.gravado5, totals.exento, totals.iva10, totals.iva5].map((v, i) => (
                      <td key={i} className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">{gs(v)}</td>
                    ))}
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums font-bold">{gs(totals.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800/50">
              {rows.map((e) => (
                <div key={e.documentId} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300"><EntryLink entryId={e.entryId}>{e.number}</EntryLink></span>
                      {e.sign < 0 && <span className="text-[9px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">NC</span>}
                      {e.totalOnly && <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">solo total</span>}
                    </div>
                    <span className="font-mono text-xs font-medium text-gray-900 dark:text-white tabular-nums">{signed(e, e.total)}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">{e.counterparty ?? "—"}</p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                    <span>{e.date}</span>
                    <span>·</span>
                    <span className="font-mono">{e.counterpartyRuc ?? "—"}</span>
                    <span>·</span>
                    <span className="font-mono">IVA {gs((e.iva10 + e.iva5) * e.sign)}</span>
                  </div>
                </div>
              ))}
            </div>

            {rows.length === 0 && <EmptyState icon={Receipt} text="No hay comprobantes que imputen IVA en este período" />}
          </>
        )}
      </div>
    </>
  );
}

// Libro Diario Component
function LibroDiario({ entityId, from, to }: { entityId: string; from: string; to: string }) {
  const [offset, setOffset] = useState(0);
  const q = api.reports.diario.useQuery({ entityId, from, to, limit: PAGE, offset });
  const groups = useMemo(() => {
    const out: { entryId: string; lines: DiarioRow[] }[] = [];
    for (const r of q.data?.rows ?? []) {
      const last = out[out.length - 1];
      if (last?.entryId === r.entryId) last.lines.push(r);
      else out.push({ entryId: r.entryId, lines: [r] });
    }
    return out;
  }, [q.data]);
  const totals = q.data?.totals ?? { debit: 0, credit: 0, entries: 0, lines: 0 };
  const balanced = totals.debit === totals.credit;

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-gray-900 dark:text-white text-sm font-medium">Libro Diario</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{totals.lines} líneas en {totals.entries} asientos</p>
        </div>
        <div className={cn("flex items-center gap-3 text-xs font-mono", balanced ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
          <span>D {gs(totals.debit)}</span>
          <span className="text-gray-400">=</span>
          <span>C {gs(totals.credit)}</span>
          {balanced && <span className="hidden sm:inline text-green-500">✓</span>}
        </div>
      </div>

      {q.isLoading ? <Loading /> : q.error ? <ErrorState message={q.error.message} /> : groups.map(({ entryId, lines }) => {
        const head = lines[0];
        const entryTotal = lines.reduce((s, e) => s + e.debit, 0);
        return (
          <div key={entryId} className="border-b border-gray-100 dark:border-gray-800/50 last:border-b-0">
            {/* Entry Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-900/80">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">{head.date}</span>
                <span className="text-xs font-mono"><EntryLink entryId={entryId}>{head.entryNumber ?? "s/n"}</EntryLink></span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  head.source === "sifen" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                )}>{SOURCE_LABELS[head.source] ?? head.source}</span>
                {head.reversalOf && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                    <Link href={`/asientos/${head.reversalOf}`} className="hover:underline">Reversión</Link>
                  </span>
                )}
                {head.entryDescription && <span className="hidden sm:inline text-[10px] text-gray-400 truncate">{head.entryDescription}</span>}
              </div>
              <span className="font-mono text-xs text-gray-500 dark:text-gray-400 tabular-nums">{gs(entryTotal)}</span>
            </div>

            {/* Entry Lines */}
            <div className="divide-y divide-gray-50 dark:divide-gray-800/30">
              {lines.map((e) => (
                <div key={e.lineId} className="px-4 sm:px-6 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[10px] sm:text-xs text-purple-500 dark:text-purple-400 w-20 sm:w-24 shrink-0">{e.accountCode}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{e.accountName}</p>
                        {e.lineDescription && <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{e.lineDescription}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {e.debit > 0 && <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">D {e.debit.toLocaleString("es-PY")}</span>}
                      {e.credit > 0 && <span className="font-mono text-xs text-red-600 dark:text-red-400 tabular-nums">C {e.credit.toLocaleString("es-PY")}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!q.isLoading && !q.error && groups.length === 0 && <EmptyState icon={BookOpen} text="No hay asientos publicados en este período" />}

      {totals.lines > PAGE && (
        <div className="flex items-center justify-between p-3 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-800">
          <span>Líneas {offset + 1}–{Math.min(offset + PAGE, totals.lines)} de {totals.lines}</span>
          <div className="flex gap-2">
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))} className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40">Anterior</button>
            <button disabled={offset + PAGE >= totals.lines} onClick={() => setOffset(offset + PAGE)} className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Libro Mayor List: accounts with an opening balance or movements up to the end of the period.
function LibroMayorList({ entityId, from, to, onSelect }: { entityId: string; from: string; to: string; onSelect: (accountId: string) => void }) {
  const q = api.reports.sumasSaldos.useQuery({ entityId, from, to });
  const accounts = q.data?.rows ?? [];
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-gray-900 dark:text-white text-sm font-medium">Libro Mayor</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Seleccioná una cuenta para ver movimientos</p>
      </div>
      {q.isLoading ? <Loading /> : q.error ? <ErrorState message={q.error.message} /> : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
          {accounts.map((acc) => (
            <button
              key={acc.accountId}
              onClick={() => onSelect(acc.accountId)}
              className="w-full flex items-center gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors text-left no-tap-highlight"
            >
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{acc.code}</span>
                  <span className={cn("text-[10px]", NATURE_COLORS[acc.nature])}>{NATURE_LABELS[acc.nature]}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm truncate">{acc.name}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn(
                  "font-mono text-sm tabular-nums font-medium",
                  acc.closing > 0 ? "text-emerald-600 dark:text-emerald-400" : acc.closing < 0 ? "text-red-600 dark:text-red-400" : "text-gray-500"
                )}>
                  {gs(Math.abs(acc.closing))}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{acc.closing >= 0 ? "Deudor" : "Acreedor"}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
            </button>
          ))}
          {accounts.length === 0 && <EmptyState icon={Hash} text="No hay cuentas con movimientos hasta este período" />}
        </div>
      )}
    </div>
  );
}

// Libro Mayor Detail
function LibroMayorDetail({ entityId, accountId, from, to, onBack }: { entityId: string; accountId: string; from: string; to: string; onBack: () => void }) {
  const q = api.reports.mayor.useQuery({ entityId, accountId, from, to });
  const d = q.data;
  const balanceClass = (v: number, bg = false) =>
    v > 0 ? (bg ? "bg-emerald-50 dark:bg-emerald-500/10" : "text-emerald-600 dark:text-emerald-400")
      : v < 0 ? (bg ? "bg-red-50 dark:bg-red-500/10" : "text-red-600 dark:text-red-400")
        : (bg ? "bg-gray-50 dark:bg-gray-800/30" : "text-gray-700 dark:text-gray-300");
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs mb-2 transition-colors no-tap-highlight"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </button>
        {d?.account && (
          <>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-medium">{d.account.code}</span>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded", NATURE_COLORS[d.account.nature])}>{NATURE_LABELS[d.account.nature]}</span>
            </div>
            <h3 className="text-gray-900 dark:text-white text-sm font-semibold mt-0.5">{d.account.name}</h3>
          </>
        )}
      </div>

      {q.isLoading ? <Loading /> : q.error ? <ErrorState message={q.error.message} /> : d && (
        <>
          <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800/50">
            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2.5">
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Saldo Anterior</span>
              <p className="font-mono text-sm text-gray-700 dark:text-gray-300 tabular-nums">{gs(d.opening)}</p>
            </div>
            <div className={cn("rounded-lg p-2.5", balanceClass(d.closing, true))}>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">Saldo al {to}</span>
              <p className={cn("font-mono text-sm tabular-nums", balanceClass(d.closing))}>{gs(d.closing)}</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {d.rows.map((e) => (
              <div key={e.lineId} className="px-3 sm:px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">{e.date}</span>
                      <span className="text-xs font-mono"><EntryLink entryId={e.entryId}>{e.entryNumber ?? "s/n"}</EntryLink></span>
                      {e.reversalOf && <span className="text-[9px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">Reversión</span>}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 text-xs truncate">{e.lineDescription ?? e.entryDescription ?? ""}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      {e.debit > 0 && <span className="text-emerald-600 dark:text-emerald-400">D {e.debit.toLocaleString("es-PY")}</span>}
                      {e.credit > 0 && <span className="text-red-600 dark:text-red-400">C {e.credit.toLocaleString("es-PY")}</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums mt-0.5">Saldo: {gs(e.balance)}</p>
                  </div>
                </div>
              </div>
            ))}
            {d.rows.length === 0 && <EmptyState icon={Hash} text="Sin movimientos en este período" />}
          </div>
        </>
      )}
    </div>
  );
}

// Sumas y Saldos
function SumasYSaldos({ entityId, from, to }: { entityId: string; from: string; to: string }) {
  const q = api.reports.sumasSaldos.useQuery({ entityId, from, to });
  const rows: SumasRow[] = q.data?.rows ?? [];
  const totals = q.data?.totals ?? { opening: 0, debit: 0, credit: 0, saldoDeudor: 0, saldoAcreedor: 0 };
  const balanced = totals.debit === totals.credit && totals.saldoDeudor === totals.saldoAcreedor;
  const cols = ["Saldo Anterior", "Suma Débito", "Suma Crédito", "Saldo Deudor", "Saldo Acreedor"];

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-gray-900 dark:text-white text-sm font-medium">Sumas y Saldos</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Del {from} al {to}</p>
        </div>
        {rows.length > 0 && (
          <span className={cn("text-xs", balanced ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
            {balanced ? "Balanceado ✓" : "Desbalanceado"}
          </span>
        )}
      </div>

      {q.isLoading ? <Loading /> : q.error ? <ErrorState message={q.error.message} /> : rows.length === 0 ? (
        <EmptyState icon={FileSpreadsheet} text="No hay movimientos hasta este período" />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs" aria-label="Sumas y Saldos">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                  <th className="text-left py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Cuenta</th>
                  {cols.map((c) => <th key={c} className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">{c}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {rows.map((r) => (
                  <tr key={r.accountId} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-blue-600 dark:text-blue-400">{r.code}</span>
                        <span className="text-gray-700 dark:text-gray-300 truncate">{r.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">{gs(r.opening)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{gs(r.debit)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-red-600 dark:text-red-400 tabular-nums">{gs(r.credit)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums">{r.saldoDeudor ? gs(r.saldoDeudor) : ""}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums">{r.saldoAcreedor ? gs(r.saldoAcreedor) : ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide text-[10px]">TOTALES</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">{gs(totals.opening)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{gs(totals.debit)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-red-600 dark:text-red-400 tabular-nums">{gs(totals.credit)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums font-bold">{gs(totals.saldoDeudor)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums font-bold">{gs(totals.saldoAcreedor)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800/50">
            {rows.map((r) => (
              <div key={r.accountId} className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{r.code}</span>
                  <span className="text-gray-700 dark:text-gray-300 text-xs truncate">{r.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div><span className="text-gray-400">Saldo Ant.</span><p className="font-mono text-gray-600 dark:text-gray-400 tabular-nums">{gs(r.opening)}</p></div>
                  <div><span className="text-gray-400">Débito</span><p className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">{gs(r.debit)}</p></div>
                  <div><span className="text-gray-400">Crédito</span><p className="font-mono text-red-600 dark:text-red-400 tabular-nums">{gs(r.credit)}</p></div>
                  <div>
                    <span className="text-gray-400">{r.saldoAcreedor ? "Saldo Acreedor" : "Saldo Deudor"}</span>
                    <p className="font-mono text-gray-900 dark:text-white tabular-nums font-medium">{gs(r.saldoAcreedor || r.saldoDeudor)}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="p-3 bg-gray-50 dark:bg-gray-900/80">
              <span className="text-gray-500 dark:text-gray-400 text-[10px] font-medium uppercase tracking-wide">Totales</span>
              <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                <span className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">D {gs(totals.debit)}</span>
                <span className="font-mono text-red-600 dark:text-red-400 tabular-nums">C {gs(totals.credit)}</span>
                <span className="font-mono text-gray-900 dark:text-white tabular-nums font-bold">Deudor {gs(totals.saldoDeudor)}</span>
                <span className="font-mono text-gray-900 dark:text-white tabular-nums font-bold">Acreedor {gs(totals.saldoAcreedor)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TotalItem({ label, value, bold = false, highlight = false }: { label: string; value: number; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2.5">
      <p className="text-gray-400 dark:text-gray-500 text-[10px] mb-0.5">{label}</p>
      <p className={cn(
        "font-mono tabular-nums",
        bold ? "text-gray-900 dark:text-white font-bold text-sm" :
        highlight ? "text-blue-600 dark:text-blue-400 text-xs sm:text-sm" :
        "text-gray-600 dark:text-gray-400 text-xs sm:text-sm"
      )}>
        {gs(value)}
      </p>
    </div>
  );
}
