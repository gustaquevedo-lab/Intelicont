"use client";

import { useState } from "react";
import Link from "next/link";
import { Calculator, TrendingUp, TrendingDown, Building2, AlertCircle, Info, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";

const gs = (v: number) => (v < 0 ? `(₲ ${Math.abs(v).toLocaleString("es-PY")})` : `₲ ${v.toLocaleString("es-PY")}`);
const currentMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }).slice(0, 7);
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function Formulario104Page() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [periodo, setPeriodo] = useState(currentMonth);
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo);
  const [year, month] = valid ? periodo.split("-").map(Number) : [0, 0];
  const enabled = !!entity && valid;
  const input = { entityId: entity?.id ?? "", year, month };

  const q = api.fiscal.form104.useQuery(input, { enabled });
  const ventasBook = api.reports.libroIva.useQuery({ ...input, side: "ventas" }, { enabled });
  const comprasBook = api.reports.libroIva.useQuery({ ...input, side: "compras" }, { enabled });
  const venc = api.fiscal.vencimientoIva.useQuery({ year, month, ruc: entity?.ruc ?? "" }, { enabled });

  const r = q.data;
  const matches = !!r && !!ventasBook.data && !!comprasBook.data
    && r.debitoFiscal === ventasBook.data.totals.iva10 + ventasBook.data.totals.iva5
    && r.creditoFiscal === comprasBook.data.totals.iva10 + comprasBook.data.totals.iva5;
  const empty = !!r && !ventasBook.data?.rows.length && !comprasBook.data?.rows.length;
  const libro = (tab: "iva_ventas" | "iva_compras") => `/libros?tab=${tab}&periodo=${periodo}`;

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Formulario 104 — DJ IVA</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Resumen para la presentación — no incluye saldo anterior ni retenciones
            {entity && <> · {entity.tradeName || entity.legalName}</>}
          </p>
        </div>
        <input
          type="month"
          aria-label="Período"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
        />
      </div>

      {!entity ? (
        <Empty text="Seleccioná una empresa para ver su Formulario 104" />
      ) : !valid ? (
        <Empty text="Elegí un período válido" />
      ) : q.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : q.error || !r ? (
        <Empty text="No se pudo calcular el Formulario 104" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{MESES[month - 1]} {year} · RUC <span className="font-mono">{entity.ruc}</span></span>
            {matches && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Cuadra con el Libro IVA
              </span>
            )}
          </div>

          {empty && <Empty text="Sin documentos con IVA en este período" />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Section title="Débito fiscal (ventas)" icon={<TrendingUp className="h-4 w-4 text-green-500" />} href={libro("iva_ventas")}>
              <Line label="Gravado 10% (base)" value={r.ventas.base10} />
              <Line label="Gravado 5% (base)" value={r.ventas.base5} />
              <Line label="Exento" value={r.ventas.exento} />
              <hr className="border-gray-100 dark:border-gray-800" />
              <Line label="IVA 10%" value={r.ventas.iva10} sub />
              <Line label="IVA 5%" value={r.ventas.iva5} sub />
              <Line label="Total débito fiscal" value={r.debitoFiscal} sub bold />
            </Section>
            <Section title="Crédito fiscal (compras)" icon={<TrendingDown className="h-4 w-4 text-red-500" />} href={libro("iva_compras")}>
              <Line label="Gravado 10% (base)" value={r.compras.base10} />
              <Line label="Gravado 5% (base)" value={r.compras.base5} />
              <Line label="Exento" value={r.compras.exento} />
              <hr className="border-gray-100 dark:border-gray-800" />
              <Line label="IVA 10%" value={r.compras.iva10} sub />
              <Line label="IVA 5%" value={r.compras.iva5} sub />
              <Line label="Total crédito fiscal" value={r.creditoFiscal} sub bold />
            </Section>
          </div>

          <div className={cn("rounded-xl p-4 sm:p-6 border-2", r.saldo > 0
            ? "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-800/30"
            : "bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-800/30")}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className={cn("h-5 w-5", r.saldo > 0 ? "text-red-500" : "text-green-500")} />
                  <h2 className="text-sm font-medium text-gray-900 dark:text-white">Liquidación</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Débito <span className="font-mono text-gray-900 dark:text-white">{gs(r.debitoFiscal)}</span> − Crédito{" "}
                  <span className="font-mono text-gray-900 dark:text-white">{gs(r.creditoFiscal)}</span>
                </p>
                {r.saldo > 0 && venc.data && (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3" /> Vence: {venc.data.label}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  {r.saldo > 0 ? "IVA a pagar" : "Saldo a favor"}
                </p>
                <p className={cn("text-2xl sm:text-3xl lg:text-4xl font-bold tabular-nums font-mono", r.saldo > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400")}>
                  {gs(Math.abs(r.saldo))}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-800/30 rounded-xl p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
            <p>Los montos se toman del Libro IVA del mes (las notas de crédito restan). Las bases son el gravado menos el IVA.</p>
            <p>El vencimiento depende del último dígito del RUC (sin DV) según el calendario DNIT.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center text-sm text-gray-500 dark:text-gray-400">
      <Building2 className="h-5 w-5 mx-auto mb-2 text-gray-400" />
      {text}
    </div>
  );
}

function Section({ title, icon, href, children }: { title: string; icon: React.ReactNode; href: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">{icon}<h2 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h2></div>
        <Link href={href} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Ver Libro IVA</Link>
      </div>
      <div className="p-3 sm:p-4 space-y-2">{children}</div>
    </section>
  );
}

function Line({ label, value, bold, sub }: { label: string; value: number; bold?: boolean; sub?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", sub && "pl-3 border-l-2 border-gray-100 dark:border-gray-800")}>
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className={cn("font-mono tabular-nums text-xs", bold ? "text-sm font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300")}>{gs(value)}</span>
    </div>
  );
}
