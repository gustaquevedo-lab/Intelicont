"use client";

import { useState } from "react";
import Link from "next/link";
import { FileArchive, Download, Building2, Info, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";

const currentMonth = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }).slice(0, 7);
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const fecha = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "");

export default function RegistroComprobantesPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const [periodo, setPeriodo] = useState(currentMonth);
  const [format, setFormat] = useState<"csv" | "txt">("csv");
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo);
  const [year, month] = valid ? periodo.split("-").map(Number) : [0, 0];
  const q = api.fiscal.registroPreview.useQuery({ entityId: entity?.id ?? "", year, month }, { enabled: !!entity && valid });
  const r = q.data;
  const mmaaaa = valid ? `${periodo.slice(5, 7)}${periodo.slice(0, 4)}` : "";

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Registro de Comprobantes (RG 90)</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Archivo oficial de comprobantes de ventas, compras, ingresos y egresos para Marangatú (DNIT)
            {entity && <> · {entity.tradeName || entity.legalName}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as "csv" | "txt")}
            aria-label="Formato de exportación"
            className="px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="csv">.CSV (delimitado por ;)</option>
            <option value="txt">.TXT (tabulaciones)</option>
          </select>
          <input
            type="month"
            aria-label="Período"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
          />
        </div>
      </div>

      {!entity ? (
        <Empty text="Seleccioná una empresa para generar su Registro de Comprobantes" />
      ) : !valid ? (
        <Empty text="Elegí un período válido" />
      ) : q.isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : q.error || !r ? (
        <Empty text="No se pudo preparar el Registro de Comprobantes" />
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400">{MESES[month - 1]} {year} · RUC <span className="font-mono">{entity.ruc}</span></p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Ventas (Tipo 1)" value={r.counts.ventas} />
            <Stat label="Compras (Tipo 2)" value={r.counts.compras} />
            <Stat label="Ingresos/Egresos (3/4)" value={(r.counts as Record<string, number>).ingresos ?? 0 + ((r.counts as Record<string, number>).egresos ?? 0)} />
            <Stat label="Con errores" value={r.errors.length} />
          </div>

          <div role="note" className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-800/30 rounded-xl p-3 sm:p-4 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Los comprobantes electrónicos SIFEN no se incluyen: Marangatu los obtiene directamente.
              {" "}Excluidos este mes: <span className="font-semibold" aria-label="Electrónicos excluidos">{r.excluded.electronic}</span>
            </p>
          </div>

          {r.errors.length > 0 && (
            <section aria-label="Errores" className="bg-white dark:bg-gray-900/50 border border-red-200 dark:border-red-800/30 rounded-xl overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-red-200 dark:border-red-800/30 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <h2 className="text-sm font-medium text-gray-900 dark:text-white">Comprobantes que no se exportan</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">Documento</th>
                      <th className="text-left font-medium px-3 py-2">Mensaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {r.errors.map((e) => (
                      <tr key={e.documentId}>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {e.side === "ventas" ? "Venta" : "Compra"}{" "}
                          {e.entryId ? (
                            <Link href={`/asientos/${e.entryId}`} className="font-mono text-blue-600 dark:text-blue-400 hover:underline">{e.number}</Link>
                          ) : (
                            <span className="font-mono">{e.number}</span>
                          )}
                          <span className="text-gray-400"> · {fecha(e.issueDate)}</span>
                        </td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section aria-label="Archivos" className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-gray-500" />
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">Archivos</h2>
            </div>
            {r.files.length === 0 ? (
              <p className="p-4 text-xs text-gray-500 dark:text-gray-400">Sin comprobantes no electrónicos para exportar en este período</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {r.files.map((f) => (
                  <li key={f.name} className="p-3 sm:p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs sm:text-sm text-gray-900 dark:text-white truncate">{f.name}.zip</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{f.rows.toLocaleString("es-PY")} {f.rows === 1 ? "comprobante" : "comprobantes"}</p>
                    </div>
                    <a
                      href={`/api/registro/${entity.id}/${mmaaaa}?part=${f.part}&format=${format}`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shrink-0 no-tap-highlight"
                    >
                      <Download className="h-3.5 w-3.5" /> Descargar .zip
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-500/5 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-3 sm:p-4 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-700 dark:text-yellow-400">
          Formato basado en la especificación técnica de junio 2021 (obligación 955). Delimitador <code>;</code> según los ejemplos
          oficiales: probá una importación de prueba en Marangatu antes de presentar.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-lg sm:text-2xl font-semibold tabular-nums text-gray-900 dark:text-white" aria-label={label}>{value.toLocaleString("es-PY")}</p>
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
