"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import { BookOpen, Search, Download, ChevronDown, AlertCircle, Loader2 } from "lucide-react";
import {
  loadCuentasParaLibro,
  getLibroMayor,
  type EntityOption,
  type AccountOption,
  type LibroMayorResult,
} from "../actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPYG(n: number) {
  return new Intl.NumberFormat("es-PY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function firstOfYearISO() {
  return `${new Date().getFullYear()}-01-01`;
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCSV(result: LibroMayorResult, entityName: string) {
  const rows = [
    ["Libro Mayor", "", "", "", "", ""],
    [`Empresa: ${entityName}`, "", "", "", "", ""],
    [`Cuenta: ${result.account.code} - ${result.account.name}`, "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["Fecha", "Referencia", "Descripción", "Debe", "Haber", "Saldo"],
    ...result.lines.map((l) => [
      fmtDate(l.fecha),
      l.numero,
      l.descripcion,
      l.debit  > 0 ? l.debit.toFixed(2)  : "",
      l.credit > 0 ? l.credit.toFixed(2) : "",
      l.saldo.toFixed(2),
    ]),
    ["", "", "", "", "", ""],
    [
      "TOTALES", "", "",
      result.totalDebit.toFixed(2),
      result.totalCredit.toFixed(2),
      result.saldoFinal.toFixed(2),
    ],
  ];

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `libro_mayor_${result.account.code}_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Account picker ───────────────────────────────────────────────────────────

interface AccountPickerProps {
  accounts:  AccountOption[];
  value:     string;
  onChange:  (id: string) => void;
  disabled?: boolean;
}

function AccountPicker({ accounts, value, onChange, disabled }: AccountPickerProps) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState("");
  const ref                 = useRef<HTMLDivElement>(null);

  const selected = accounts.find((a) => a.id === value);

  const filtered = query.trim()
    ? accounts.filter(
        (a) =>
          a.code.toLowerCase().includes(query.toLowerCase()) ||
          a.name.toLowerCase().includes(query.toLowerCase())
      )
    : accounts;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled || accounts.length === 0}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50 hover:border-zinc-500 transition-colors"
      >
        <span className="truncate">
          {selected ? `${selected.code} — ${selected.name}` : "Seleccioná una cuenta…"}
        </span>
        <ChevronDown size={14} className="shrink-0 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
          <div className="p-2 border-b border-zinc-700">
            <div className="flex items-center gap-2 rounded bg-zinc-800 px-2">
              <Search size={13} className="text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por código o nombre…"
                className="flex-1 bg-transparent py-1.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none"
              />
            </div>
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500">Sin resultados</li>
            ) : (
              filtered.map((a) => (
                <li
                  key={a.id}
                  onClick={() => { onChange(a.id); setOpen(false); setQuery(""); }}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-zinc-700 transition-colors ${
                    a.id === value ? "bg-zinc-700 text-white" : "text-zinc-300"
                  }`}
                >
                  <span className="font-mono text-xs text-zinc-400 w-16 shrink-0">{a.code}</span>
                  <span className="truncate">{a.name}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

interface LibroMayorClientProps {
  entities: EntityOption[];
  dbError?: string;
}

export function LibroMayorClient({ entities, dbError }: LibroMayorClientProps) {
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);

  const entityId = selectedEntity?.id || "";

  // Filters
  const [accountId, setAccountId] = useState("");
  const [dateFrom,  setDateFrom]  = useState(firstOfYearISO());
  const [dateTo,    setDateTo]    = useState(todayISO());

  // Data
  const [cuentas,     setCuentas]     = useState<AccountOption[]>([]);
  const [result,      setResult]      = useState<LibroMayorResult | null>(null);
  const [queryError,  setQueryError]  = useState<string | null>(null);

  const [loadingCuentas, startLoadCuentas] = useTransition();
  const [loadingLibro,   startLoadLibro]   = useTransition();

  // Load accounts when entity changes
  useEffect(() => {
    if (!entityId) { setCuentas([]); setAccountId(""); return; }
    startLoadCuentas(async () => {
      const res = await loadCuentasParaLibro(entityId);
      if (res.ok) {
        setCuentas(res.data);
        setAccountId("");
        setResult(null);
      }
    });
  }, [entityId]);

  const handleBuscar = useCallback(() => {
    setQueryError(null);
    setResult(null);
    startLoadLibro(async () => {
      const res = await getLibroMayor(entityId, accountId, dateFrom, dateTo);
      if (res.ok) {
        setResult(res.data);
      } else {
        setQueryError(res.error);
      }
    });
  }, [entityId, accountId, dateFrom, dateTo]);

  const entityName = entities.find((e) => e.id === entityId)?.legalName ?? "";

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10">
            <BookOpen size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Libro Mayor</h1>
            <p className="text-xs text-zinc-500">Movimientos por cuenta con saldo acumulado</p>
          </div>
        </div>

        {result && result.lines.length > 0 && (
          <button
            onClick={() => exportCSV(result, entityName)}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:border-violet-500 hover:text-violet-300 transition-colors"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* DB error banner */}
      {dbError && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={15} className="shrink-0" />
          <span>{dbError}</span>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 pt-5 pb-4 border-b border-zinc-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Empresa */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Empresa Activa</label>
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-300 font-semibold truncate uppercase">
              {selectedEntity?.tradeName || selectedEntity?.legalName || "Cargando..."}
            </div>
          </div>

          {/* Cuenta */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Cuenta
              {loadingCuentas && <Loader2 size={11} className="inline ml-1 animate-spin text-violet-400" />}
            </label>
            <AccountPicker
              accounts={cuentas}
              value={accountId}
              onChange={setAccountId}
              disabled={!entityId || loadingCuentas}
            />
          </div>

          {/* Desde */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Hasta */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleBuscar}
            disabled={!entityId || !accountId || !dateFrom || !dateTo || loadingLibro}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingLibro ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            Consultar
          </button>

          {queryError && (
            <span className="flex items-center gap-1.5 text-sm text-red-400">
              <AlertCircle size={13} />
              {queryError}
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {!result && !loadingLibro && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
            <BookOpen size={40} strokeWidth={1} className="mb-3" />
            <p className="text-sm">Seleccioná empresa, cuenta y período para consultar el libro mayor</p>
          </div>
        )}

        {loadingLibro && (
          <div className="flex items-center justify-center py-20 text-zinc-500">
            <Loader2 size={24} className="animate-spin mr-2" />
            <span className="text-sm">Cargando movimientos…</span>
          </div>
        )}

        {result && !loadingLibro && (
          <>
            {/* Account header */}
            <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5">Cuenta</p>
                  <p className="font-semibold text-zinc-100">
                    <span className="font-mono text-violet-400 mr-2">{result.account.code}</span>
                    {result.account.name}
                  </p>
                  {result.account.nature && (
                    <p className="text-xs text-zinc-500 mt-0.5 capitalize">{result.account.nature}</p>
                  )}
                </div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Total Débito</p>
                    <p className="font-mono text-sm text-zinc-200">₲ {fmtPYG(result.totalDebit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Total Crédito</p>
                    <p className="font-mono text-sm text-zinc-200">₲ {fmtPYG(result.totalCredit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Saldo Final</p>
                    <p className={`font-mono text-sm font-semibold ${result.saldoFinal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      ₲ {fmtPYG(result.saldoFinal)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {result.lines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                <p className="text-sm">No hay movimientos para este período</p>
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900">
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 w-24">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 w-28">Referencia</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400">Descripción</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 w-32">Débito</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 w-32">Crédito</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 w-36">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {result.lines.map((line, idx) => (
                      <tr
                        key={line.id}
                        className={`hover:bg-zinc-800/40 transition-colors ${idx % 2 === 0 ? "" : "bg-zinc-900/30"}`}
                      >
                        <td className="px-4 py-2.5 text-zinc-400 tabular-nums text-xs">
                          {fmtDate(line.fecha)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-xs text-violet-400">{line.numero}</span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-300 max-w-xs truncate">
                          {line.descripcion || <span className="text-zinc-600 italic">sin descripción</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {line.debit > 0 ? (
                            <span className="text-zinc-200">₲ {fmtPYG(line.debit)}</span>
                          ) : (
                            <span className="text-zinc-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums">
                          {line.credit > 0 ? (
                            <span className="text-zinc-200">₲ {fmtPYG(line.credit)}</span>
                          ) : (
                            <span className="text-zinc-700">—</span>
                          )}
                        </td>
                        <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                          line.saldo >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}>
                          ₲ {fmtPYG(line.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-zinc-700 bg-zinc-900">
                      <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Total ({result.lines.length} movimiento{result.lines.length !== 1 ? "s" : ""})
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-zinc-100">
                        ₲ {fmtPYG(result.totalDebit)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-zinc-100">
                        ₲ {fmtPYG(result.totalCredit)}
                      </td>
                      <td className={`px-4 py-3 text-right tabular-nums font-bold text-base ${
                        result.saldoFinal >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}>
                        ₲ {fmtPYG(result.saldoFinal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
