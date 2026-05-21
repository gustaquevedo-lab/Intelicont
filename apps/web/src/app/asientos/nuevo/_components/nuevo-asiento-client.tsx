"use client";

import {
  useState, useMemo, useTransition, useEffect, useRef, useCallback,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, AlertCircle,
  Sparkles, Calendar, FileText, Building2, Save, Loader2,
  Search, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type EntityOption, type AccountOption } from "../../actions";
import {
  loadCuentas, createAsiento, postearAsiento,
} from "../../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Linea {
  id:          string;
  accountId:   string;
  accountCode: string;
  accountName: string;
  descripcion: string;
  debito:      string;
  credito:     string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 9); }

function emptyLinea(): Linea {
  return { id: uid(), accountId: "", accountCode: "", accountName: "", descripcion: "", debito: "", credito: "" };
}

function formatGs(n: number) {
  if (isNaN(n)) return "0";
  return n.toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  entities: EntityOption[];
  dbError?: string;
}

// ─── Account Autocomplete ─────────────────────────────────────────────────────

interface AccountPickerProps {
  linea:       Linea;
  allCuentas:  AccountOption[];
  loading:     boolean;
  onSelect:    (lineaId: string, account: AccountOption) => void;
}

function AccountPicker({ linea, allCuentas, loading, onSelect }: AccountPickerProps) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return allCuentas.slice(0, 60);
    const q = query.toLowerCase();
    return allCuentas
      .filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [allCuentas, query]);

  function handleOpen() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
          linea.accountId
            ? "text-white bg-zinc-800/50 border border-zinc-700"
            : "text-zinc-500 bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600"
        )}
      >
        {linea.accountId ? (
          <>
            <span className="text-blue-400 font-mono text-xs">{linea.accountCode}</span>{" "}
            <span className="text-zinc-300">{linea.accountName}</span>
          </>
        ) : loading ? (
          <span className="flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Cargando cuentas…
          </span>
        ) : (
          "Seleccionar cuenta"
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setQuery(""); }} />
          <div className="absolute z-20 top-full left-0 mt-1 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-zinc-800 flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Código o nombre de cuenta…"
                className="flex-1 bg-transparent text-white text-xs placeholder-zinc-600 outline-none"
              />
            </div>
            {/* Results */}
            <div className="max-h-60 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-zinc-500 text-xs px-3 py-4 text-center">
                  {allCuentas.length === 0 ? "Esta empresa no tiene plan de cuentas" : "Sin resultados"}
                </p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { onSelect(linea.id, c); setOpen(false); setQuery(""); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-800 transition-colors flex items-baseline gap-2"
                  >
                    <span className="text-blue-400 font-mono text-xs shrink-0 w-16 truncate">{c.code}</span>
                    <span className="text-zinc-300 truncate">{c.name}</span>
                    {c.nature && (
                      <span className="text-zinc-600 text-[10px] shrink-0 ml-auto">{c.nature}</span>
                    )}
                  </button>
                ))
              )}
            </div>
            {filtered.length === 60 && (
              <p className="text-zinc-600 text-xs px-3 py-2 border-t border-zinc-800 text-center">
                Mostrando 60 de {allCuentas.length} — escribí para filtrar
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NuevoAsientoClient({ entities, dbError }: Props) {
  const router = useRouter();

  const [isPending,   startTransition]  = useTransition();
  const [isPosting,   startPost]        = useTransition();
  const [feedback,    setFeedback]      = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [savedId,     setSavedId]       = useState<string | null>(null);
  const [savedNumber, setSavedNumber]   = useState<string | null>(null);

  const [fecha,       setFecha]         = useState(new Date().toISOString().split("T")[0]);
  const [descripcion, setDescripcion]   = useState("");
  const [entityId,    setEntityId]      = useState("");
  const [lineas,      setLineas]        = useState<Linea[]>([emptyLinea(), emptyLinea()]);

  const [allCuentas,  setAllCuentas]    = useState<AccountOption[]>([]);
  const [cuentasLoading, setCuentasLoading] = useState(false);

  // ── Load accounts when entity changes ──────────────────────────────────────
  useEffect(() => {
    if (!entityId) { setAllCuentas([]); return; }
    setCuentasLoading(true);
    loadCuentas(entityId).then((result) => {
      setAllCuentas(result.ok ? result.data : []);
      setCuentasLoading(false);
    });
  }, [entityId]);

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    let debit = 0, credit = 0;
    lineas.forEach((l) => {
      debit  += parseFloat(l.debito)  || 0;
      credit += parseFloat(l.credito) || 0;
    });
    return {
      totalDebit:  debit,
      totalCredit: credit,
      balanced:    Math.abs(debit - credit) < 0.01,
      diff:        Math.abs(debit - credit),
    };
  }, [lineas]);

  // ── Line management ────────────────────────────────────────────────────────
  const addLinea = () => setLineas((prev) => [...prev, emptyLinea()]);

  const removeLinea = (id: string) => {
    if (lineas.length <= 2) return;
    setLineas((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLinea = useCallback((id: string, field: keyof Linea, value: string) => {
    setLineas((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      const next = { ...l, [field]: value };
      // Clear the other side when entering an amount
      if (field === "debito"  && parseFloat(value) > 0) next.credito = "";
      if (field === "credito" && parseFloat(value) > 0) next.debito  = "";
      return next;
    }));
  }, []);

  const selectAccount = useCallback((lineaId: string, account: AccountOption) => {
    setLineas((prev) => prev.map((l) =>
      l.id === lineaId
        ? { ...l, accountId: account.id, accountCode: account.code, accountName: account.name }
        : l
    ));
  }, []);

  // ── IA suggestion ──────────────────────────────────────────────────────────
  function handleSugerenciaIA() {
    setDescripcion("Compra mercadería con IVA 10%");
    // If we have real accounts loaded, try to match by code pattern
    const find = (codePrefix: string) =>
      allCuentas.find((c) => c.code.startsWith(codePrefix));
    const mercaderias  = find("1.2.01") ?? find("1.2") ?? null;
    const ivaCredito   = find("1.1.06") ?? find("1.1.0") ?? null;
    const proveedores  = find("2.1.01") ?? find("2.1") ?? null;

    setLineas([
      { id: uid(), accountId: mercaderias?.id ?? "", accountCode: mercaderias?.code ?? "1.2.01", accountName: mercaderias?.name ?? "Mercaderías",           descripcion: "Compra mercadería gravada 10%", debito: "10000000", credito: "" },
      { id: uid(), accountId: ivaCredito?.id  ?? "", accountCode: ivaCredito?.code  ?? "1.1.06", accountName: ivaCredito?.name  ?? "IVA Crédito Fiscal",    descripcion: "IVA 10% compra",                debito: "1000000",  credito: "" },
      { id: uid(), accountId: proveedores?.id ?? "", accountCode: proveedores?.code ?? "2.1.01", accountName: proveedores?.name ?? "Cuentas a Pagar Proveedores", descripcion: "Compra a crédito",          debito: "",         credito: "11000000" },
    ]);
  }

  // ── Save as DRAFT ──────────────────────────────────────────────────────────
  const isReady = !!descripcion && !!entityId && totals.balanced && totals.totalDebit > 0;

  function handleGuardar() {
    setFeedback(null);
    startTransition(async () => {
      const result = await createAsiento({
        entityId,
        date:        fecha,
        description: descripcion,
        lineas:      lineas.filter((l) => l.accountId).map((l) => ({
          accountId:    l.accountId,
          debit:        l.debito  || "0",
          credit:       l.credito || "0",
          currencyCode: "PYG",
          description:  l.descripcion,
        })),
      });

      if (result.ok) {
        setSavedId(result.data.id);
        setSavedNumber(result.data.number);
        setFeedback({ type: "success", message: `Borrador ${result.data.number} guardado. Podés postearlo o seguir editando.` });
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  }

  // ── Post DRAFT → POSTED ────────────────────────────────────────────────────
  function handlePostear() {
    if (!savedId) return;
    setFeedback(null);
    startPost(async () => {
      const result = await postearAsiento(savedId);
      if (result.ok) {
        setFeedback({ type: "success", message: `Asiento ${savedNumber} posteado correctamente. Redirigiendo…` });
        setTimeout(() => router.push("/asientos"), 1200);
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  }

  const isLoading = isPending || isPosting;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a
            href="/asientos"
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-400" />
          </a>
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-white">Nuevo Asiento</h1>
            <p className="text-zinc-400 text-sm mt-0.5">Crear asiento contable — doble partida obligatoria</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* IA suggestion */}
          <button
            type="button"
            onClick={handleSugerenciaIA}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-600/20 transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Sugerir con IA
          </button>

          {/* Post button — only after saving */}
          {savedId && (
            <button
              type="button"
              disabled={isLoading}
              onClick={handlePostear}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isPosting ? "Posteando…" : "Postear"}
            </button>
          )}

          {/* Save draft button */}
          <button
            type="button"
            disabled={!isReady || isLoading || !!savedId}
            onClick={handleGuardar}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              isReady && !isLoading && !savedId
                ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPending ? "Guardando…" : savedId ? "Guardado ✓" : "Guardar Borrador"}
          </button>
        </div>
      </div>

      {/* DB error */}
      {dbError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-900/20 border border-amber-700/40">
          <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">Base de datos no configurada</p>
            <p className="text-amber-400/70 text-xs">{dbError} — las cuentas no se cargarán.</p>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          "flex items-center gap-2 p-4 rounded-xl border animate-in",
          feedback.type === "success"
            ? "bg-green-900/10 border-green-800/50 text-green-400"
            : "bg-red-900/10 border-red-800/50 text-red-400"
        )}>
          {feedback.type === "success"
            ? <CheckCircle2 className="h-5 w-5 shrink-0" />
            : <AlertCircle  className="h-5 w-5 shrink-0" />}
          <span className="text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Balance indicator */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl border transition-colors",
        totals.balanced && totals.totalDebit > 0
          ? "bg-green-900/10 border-green-800/50"
          : "bg-zinc-900/50 border-zinc-800"
      )}>
        {totals.balanced && totals.totalDebit > 0
          ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
          : <AlertCircle  className="h-5 w-5 text-yellow-400 shrink-0" />}

        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-8">
            <div>
              <span className="text-zinc-400 text-xs uppercase tracking-wide">Total Débitos</span>
              <p className="text-white font-semibold tabular-nums font-mono">₲ {formatGs(totals.totalDebit)}</p>
            </div>
            <div>
              <span className="text-zinc-400 text-xs uppercase tracking-wide">Total Créditos</span>
              <p className="text-white font-semibold tabular-nums font-mono">₲ {formatGs(totals.totalCredit)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              totals.balanced && totals.totalDebit > 0
                ? "bg-green-900/30 text-green-400"
                : "bg-yellow-900/30 text-yellow-400"
            )}>
              {totals.balanced && totals.totalDebit > 0 ? "✓ Balanceado" : "⚠ Desbalanceado"}
            </span>
            {totals.totalDebit > 0 && !totals.balanced && (
              <span className="text-xs text-yellow-400">
                Δ ₲ {formatGs(totals.diff)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Header fields */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Fecha */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" /> Fecha *
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              disabled={!!savedId}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
            />
          </div>

          {/* Empresa */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-1.5">
              <Building2 className="h-3.5 w-3.5 text-zinc-500" /> Empresa *
            </label>
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              disabled={!!savedId}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
            >
              <option value="">Seleccioná una empresa</option>
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.legalName} — RUC {e.ruc}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-500" /> Descripción *
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Compra mercadería Factura 001-233"
              disabled={!!savedId}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Lines table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
        {!entityId && (
          <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border-b border-zinc-700 text-xs text-zinc-400">
            <Building2 className="h-3.5 w-3.5" />
            Seleccioná una empresa para cargar el plan de cuentas
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium uppercase tracking-wider w-8">#</th>
                <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium uppercase tracking-wider min-w-[240px]">Cuenta</th>
                <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium uppercase tracking-wider min-w-[180px]">Descripción</th>
                <th className="text-right py-3 px-4 text-zinc-500 text-xs font-medium uppercase tracking-wider w-40">Débito ₲</th>
                <th className="text-right py-3 px-4 text-zinc-500 text-xs font-medium uppercase tracking-wider w-40">Crédito ₲</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {lineas.map((linea, idx) => (
                <tr key={linea.id} className="hover:bg-zinc-800/20 transition-colors">
                  <td className="py-2 px-4 text-zinc-600 font-mono text-xs">{idx + 1}</td>

                  {/* Account picker */}
                  <td className="py-2 px-4">
                    <AccountPicker
                      linea={linea}
                      allCuentas={allCuentas}
                      loading={cuentasLoading}
                      onSelect={selectAccount}
                    />
                  </td>

                  {/* Description */}
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      value={linea.descripcion}
                      onChange={(e) => updateLinea(linea.id, "descripcion", e.target.value)}
                      placeholder="Detalle de la línea"
                      disabled={!!savedId}
                      className="w-full px-3 py-1.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-40"
                    />
                  </td>

                  {/* Debit */}
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={linea.debito}
                      onChange={(e) => updateLinea(linea.id, "debito", e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="0"
                      disabled={!!savedId}
                      className="w-full text-right px-3 py-1.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-sm text-white font-mono tabular-nums placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-green-500/50 disabled:opacity-40"
                    />
                  </td>

                  {/* Credit */}
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={linea.credito}
                      onChange={(e) => updateLinea(linea.id, "credito", e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder="0"
                      disabled={!!savedId}
                      className="w-full text-right px-3 py-1.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-sm text-white font-mono tabular-nums placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 disabled:opacity-40"
                    />
                  </td>

                  {/* Delete */}
                  <td className="py-2 px-2">
                    <button
                      type="button"
                      onClick={() => removeLinea(linea.id)}
                      disabled={lineas.length <= 2 || !!savedId}
                      className="p-1.5 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-zinc-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-700 bg-zinc-800/50">
                <td colSpan={3} className="py-3 px-4 text-right text-zinc-400 font-medium text-xs uppercase tracking-wide">
                  Totales
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={cn("font-mono font-bold text-base tabular-nums", totals.balanced ? "text-green-400" : "text-white")}>
                    ₲ {formatGs(totals.totalDebit)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={cn("font-mono font-bold text-base tabular-nums", totals.balanced ? "text-green-400" : "text-white")}>
                    ₲ {formatGs(totals.totalCredit)}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={addLinea}
            disabled={!!savedId}
            className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
            Agregar línea
          </button>
        </div>
      </div>

      {/* Validation hints */}
      <div className="space-y-2">
        {!entityId && (
          <Hint icon="⚠" color="yellow">Seleccioná una empresa para continuar</Hint>
        )}
        {!descripcion && (
          <Hint icon="⚠" color="yellow">Agregá una descripción al asiento</Hint>
        )}
        {totals.totalDebit > 0 && !totals.balanced && (
          <Hint icon="✕" color="red">
            Asiento desbalanceado — diferencia: ₲ {formatGs(totals.diff)}
          </Hint>
        )}
        {savedId && (
          <Hint icon="ℹ" color="blue">
            Borrador guardado como <strong>{savedNumber}</strong>. Usá el botón{" "}
            <strong>Postear</strong> para hacerlo inmutable, o cerrá para editarlo luego.
          </Hint>
        )}
      </div>
    </div>
  );
}

// ─── Small hint helper ────────────────────────────────────────────────────────

function Hint({ icon, color, children }: {
  icon: string;
  color: "yellow" | "red" | "blue";
  children: React.ReactNode;
}) {
  const cls = {
    yellow: "text-yellow-400 bg-yellow-900/10 border-yellow-800/30",
    red:    "text-red-400    bg-red-900/10    border-red-800/30",
    blue:   "text-blue-300   bg-blue-900/10   border-blue-800/30",
  }[color];

  return (
    <div className={cn("flex items-center gap-2 text-sm border rounded-lg p-3", cls)}>
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
