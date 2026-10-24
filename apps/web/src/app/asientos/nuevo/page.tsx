"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookPlus, CheckCircle2, Loader2, Plus, Trash2, X } from "lucide-react";
import { todayInAsuncionISO } from "@intelicont/ledger/tax-calendar";
import { useAuthStore } from "@/lib/auth-store";
import { useIdempotencyKey } from "@/lib/trpc-hooks";
import { clampDateToPeriod, validateEntryForm } from "@/lib/entry-form";
import { formatGs, parseGs } from "@/lib/gs";
import { api } from "@/trpc/client";
import { cn } from "@/lib/utils";

type Account = { id: string; code: string; name: string };
type Line = { key: string; accountId: string; debit: number; credit: number; description: string };

const labelCls = "block text-sm font-medium text-gray-300";
const inputCls = "mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50";
const cellCls = "w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50";

const newLine = (): Line => ({ key: crypto.randomUUID(), accountId: "", debit: 0, credit: 0, description: "" });
const monthLabel = (p: { year: number; month: number }) => `${String(p.month).padStart(2, "0")}/${p.year}`;

export default function NuevoAsientoPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  if (!entity) {
    return (
      <div className="p-12 text-center">
        <BookPlus className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Seleccioná una empresa para registrar un asiento</p>
      </div>
    );
  }
  // Keyed by entity: switching company starts a clean form (and a new Idempotency-Key).
  return <EntryForm key={entity.id} entityId={entity.id} entityName={entity.tradeName || entity.legalName} />;
}

function EntryForm({ entityId, entityName }: { entityId: string; entityName: string }) {
  const utils = api.useUtils();
  const accountsQuery = api.accounts.list.useQuery({ entityId });
  const periodsQuery = api.fiscal.periods.useQuery({ entityId });
  const accounts = useMemo<Account[]>(
    () => (accountsQuery.data ?? []).filter((a) => a.allowsPosting).sort((a, b) => a.code.localeCompare(b.code, "es", { numeric: true })),
    [accountsQuery.data],
  );
  const openPeriods = useMemo(() => (periodsQuery.data ?? []).filter((p) => p.status === "open"), [periodsQuery.data]);

  const today = todayInAsuncionISO();
  const [periodChoice, setPeriodChoice] = useState("");
  const [dateChoice, setDateChoice] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>(() => [newLine(), newLine()]);
  const [saved, setSaved] = useState<{ id: string; number: string } | null>(null);
  const [errorShown, setErrorShown] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  const focusRow = useRef<number | null>(null);

  // Default period: the open one of the current Asunción month, else the most recent open one (list is newest first).
  const currentMonth = openPeriods.find((p) => `${p.year}-${String(p.month).padStart(2, "0")}` === today.slice(0, 7));
  const period = openPeriods.find((p) => p.id === periodChoice) ?? currentMonth ?? openPeriods[0] ?? null;
  const date = dateChoice ?? (period ? clampDateToPeriod(today, period) : today);

  const idem = useIdempotencyKey();
  const create = api["journal-entries"].create.useMutation({
    trpc: idem.trpc,
    onSuccess: async (r) => {
      setSaved({ id: r.id, number: r.number });
      idem.renew();
      await Promise.all([utils["journal-entries"].list.invalidate(), utils["journal-entries"].count.invalidate()]);
    },
  });

  const validation = validateEntryForm({
    entityId,
    period: period ? { id: period.id, year: period.year, month: period.month } : null,
    date,
    description,
    lines,
  });
  const { totals } = validation;
  const canSave = validation.ok && !create.isPending && !saved;
  const dirty = description.trim() !== "" || lines.some((l) => l.accountId || l.debit || l.credit);

  const setLine = (key: string, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const addLine = () => {
    focusRow.current = lines.length;
    setLines((ls) => [...ls, newLine()]);
  };
  const removeLine = (key: string) => setLines((ls) => (ls.length > 2 ? ls.filter((l) => l.key !== key) : ls));
  useEffect(() => {
    if (focusRow.current === null) return;
    formRef.current?.querySelector<HTMLInputElement>(`[data-account-input="${focusRow.current}"]`)?.focus();
    focusRow.current = null;
  }, [lines.length]);

  const submit = () => {
    if (!canSave || !period) return;
    setErrorShown(true);
    create.mutate({
      entityId,
      periodId: period.id,
      date,
      description: description.trim(),
      lineas: lines
        .filter((l) => l.accountId || l.debit || l.credit)
        .map((l) => ({ accountId: l.accountId, debit: l.debit, credit: l.credit, currencyCode: "PYG", ...(l.description.trim() && { description: l.description.trim() }) })),
    });
  };

  const reset = () => {
    setPeriodChoice("");
    setDateChoice(null);
    setDescription("");
    setLines([newLine(), newLine()]);
    setSaved(null);
    create.reset();
  };

  const balanced = totals.diff === 0 && totals.debit > 0;
  const loading = accountsQuery.isLoading || periodsQuery.isLoading;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <Link href="/asientos" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white"><ArrowLeft className="h-4 w-4" />Asientos</Link>
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold text-white">Nuevo asiento</h1>
        <p className="text-gray-400 text-sm mt-0.5">Asiento manual de {entityName}. Una vez posteado no se modifica: se corrige con un contra-asiento.</p>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>
      ) : !period ? (
        <p role="alert" className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-800 text-sm text-yellow-500">
          Esta empresa no tiene períodos fiscales abiertos, no se pueden registrar asientos.
        </p>
      ) : (
        <form
          ref={formRef}
          aria-label="Asiento manual"
          className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 lg:p-6 space-y-5"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (!saved) addLine(); }
            else if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault(); // Enter must not post an immutable entry by accident
          }}
        >
          {saved && (
            <div role="status" className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-green-900/20 border border-green-800 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Asiento <strong data-testid="entry-number">{saved.number}</strong> posteado</span>
              <Link href={`/asientos/${saved.id}`} className="underline">Ver asiento</Link>
              <button type="button" onClick={reset} className="underline">Nuevo asiento</button>
            </div>
          )}
          {create.error && errorShown && (
            <div role="alert" className="flex items-start justify-between gap-3 p-3 rounded-lg bg-red-900/20 border border-red-800 text-sm text-red-400">
              <div>
                <p>No se pudo postear el asiento.</p>
                <details className="mt-1 text-xs text-red-300">
                  <summary className="cursor-pointer">Detalle técnico</summary>
                  <p className="mt-1 break-words">{create.error.message}</p>
                </details>
              </div>
              <button type="button" aria-label="Cerrar alerta" onClick={() => setErrorShown(false)}><X className="h-4 w-4" /></button>
            </div>
          )}

          <fieldset disabled={!!saved || create.isPending} className="space-y-5 min-w-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={labelCls}>
                Período
                <select
                  value={period.id}
                  onChange={(e) => {
                    const next = openPeriods.find((p) => p.id === e.target.value);
                    setPeriodChoice(e.target.value);
                    if (next) setDateChoice(clampDateToPeriod(date, next));
                  }}
                  className={inputCls}
                >
                  {openPeriods.map((p) => <option key={p.id} value={p.id}>{monthLabel(p)}</option>)}
                </select>
              </label>
              <label className={labelCls}>
                Fecha
                <input type="date" value={date} onChange={(e) => setDateChoice(e.target.value)} className={inputCls} />
              </label>
              <label className={labelCls}>
                Descripción
                <input type="text" value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} placeholder="Ej.: Aporte de capital" className={inputCls} />
              </label>
            </div>

            <div role="group" aria-label="Líneas del asiento" className="space-y-2">
              <div className="hidden md:grid grid-cols-[minmax(0,2fr)_1fr_1fr_minmax(0,1.5fr)_2.25rem] gap-2 text-xs font-medium text-gray-400 px-0.5">
                <span>Cuenta</span><span className="text-right">Debe</span><span className="text-right">Haber</span><span>Descripción de línea</span><span />
              </div>
              {lines.map((l, i) => (
                <div key={l.key} data-row={i} className="grid grid-cols-2 md:grid-cols-[minmax(0,2fr)_1fr_1fr_minmax(0,1.5fr)_2.25rem] gap-2 items-start">
                  <div className="col-span-2 md:col-span-1">
                    <AccountCombobox label={`Cuenta línea ${i + 1}`} index={i} accounts={accounts} value={l.accountId} onChange={(id) => setLine(l.key, { accountId: id })} />
                  </div>
                  <AmountInput label={`Debe línea ${i + 1}`} value={l.debit} onChange={(n) => setLine(l.key, { debit: n, ...(n > 0 && { credit: 0 }) })} />
                  <AmountInput label={`Haber línea ${i + 1}`} value={l.credit} onChange={(n) => setLine(l.key, { credit: n, ...(n > 0 && { debit: 0 }) })} />
                  <input
                    aria-label={`Descripción línea ${i + 1}`}
                    value={l.description}
                    onChange={(e) => setLine(l.key, { description: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Tab" && !e.shiftKey && i === lines.length - 1) { e.preventDefault(); addLine(); }
                    }}
                    placeholder="Opcional"
                    className={cn(cellCls, "col-span-2 md:col-span-1")}
                  />
                  <button
                    type="button"
                    aria-label={`Eliminar línea ${i + 1}`}
                    disabled={lines.length <= 2}
                    onClick={() => removeLine(l.key)}
                    className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-30 disabled:hover:text-gray-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300">
                <Plus className="h-4 w-4" />Agregar línea <span className="text-xs text-gray-500">(Ctrl+Enter)</span>
              </button>
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800">
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm" aria-label="Totales">
              <div className="flex gap-2"><dt className="text-gray-400">Σ Debe</dt><dd data-testid="total-debit" className="text-white tabular-nums">₲ {formatGs(totals.debit)}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-400">Σ Haber</dt><dd data-testid="total-credit" className="text-white tabular-nums">₲ {formatGs(totals.credit)}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-400">Diferencia</dt><dd data-testid="difference" className="text-white tabular-nums">₲ {formatGs(Math.abs(totals.diff))}</dd></div>
              <span
                data-testid="balance-chip"
                className={cn("px-2.5 py-1 rounded-full text-xs font-medium", balanced ? "bg-green-900/30 text-green-400" : totals.diff !== 0 ? "bg-red-900/30 text-red-400" : "bg-gray-800 text-gray-400")}
              >
                {balanced ? "Balanceado" : totals.diff !== 0 ? `Descuadrado por ₲ ${formatGs(Math.abs(totals.diff))}` : "Sin importes"}
              </span>
            </dl>
            <button
              type="submit"
              disabled={!canSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar y postear
            </button>
          </div>
          {dirty && !validation.ok && !saved && (
            <ul aria-label="Pendientes" className="text-xs text-gray-500 list-disc pl-5 space-y-0.5">
              {validation.errors.map((m) => <li key={m}>{m}</li>)}
            </ul>
          )}
        </form>
      )}
    </div>
  );
}

function AmountInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <input
      aria-label={label}
      inputMode="numeric"
      autoComplete="off"
      value={value ? formatGs(value) : ""}
      placeholder="0"
      onChange={(e) => {
        const n = parseGs(e.target.value.replace(/\D/g, ""));
        if (n !== null) onChange(n);
      }}
      className={cn(cellCls, "text-right tabular-nums")}
    />
  );
}

/** Searchable account select: type to filter by code or name, ↑/↓ to move, Enter (or Tab on a filtered list) to pick, Esc to close. */
function AccountCombobox({ label, index, accounts, value, onChange }: { label: string; index: number; accounts: Account[]; value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = `accounts-${index}`;
  const selected = accounts.find((a) => a.id === value);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? accounts.filter((a) => `${a.code} ${a.name}`.toLowerCase().includes(q)) : accounts).slice(0, 50);
  }, [accounts, query]);

  const pick = (a: Account) => { onChange(a.id); setQuery(""); setOpen(false); };

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
        data-account-input={index}
        autoComplete="off"
        placeholder="Buscar cuenta…"
        value={open ? query : selected ? `${selected.code} — ${selected.name}` : ""}
        onFocus={(e) => { setOpen(true); setActive(0); e.currentTarget.select(); }}
        onBlur={() => setOpen(false)}
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && open && matches[active] && !(e.ctrlKey || e.metaKey)) { e.preventDefault(); e.stopPropagation(); pick(matches[active]); }
          else if (e.key === "Escape" && open) { e.preventDefault(); e.stopPropagation(); setOpen(false); }
          else if (e.key === "Tab" && open && query.trim() && matches[active]) pick(matches[active]);
        }}
        className={cellCls}
      />
      {open && (
        <ul id={listId} role="listbox" aria-label={`Cuentas línea ${index + 1}`} className="absolute z-20 mt-1 max-h-60 w-full min-w-64 overflow-auto rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl">
          {matches.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">Sin resultados</li>}
          {matches.map((a, i) => (
            <li
              key={a.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(a); }}
              onMouseEnter={() => setActive(i)}
              className={cn("px-3 py-1.5 text-sm cursor-pointer", i === active ? "bg-blue-600 text-white" : "text-gray-200")}
            >
              {a.code} — {a.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
