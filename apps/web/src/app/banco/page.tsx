"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import {
  CreditCard, ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock,
  AlertTriangle, Upload, Plus, Zap, X, Search, ChevronDown,
  Loader2, Link2, Link2Off, RefreshCw, TrendingUp, DollarSign,
  FileText, Sparkles, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadBankAccounts, loadBankMovements, loadUnmatchedJournalLines,
  runAiMatcher, importBankMovements, addManualBankMovement,
  markReconciliation, parseCsvText,
  type BankAccountRow, type BankMovementRow, type JournalLineRow,
  type AiMatchSuggestion,
} from "./banco-actions";

function formatGs(n: number) {
  return n.toLocaleString("es-PY", { maximumFractionDigits: 0 });
}

function StatusBadge({ status }: { status: BankMovementRow["reconciliationStatus"] }) {
  if (!status || status === "pending") return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
      <Clock className="h-2.5 w-2.5" /> Pendiente
    </span>
  );
  if (status === "matched" || status === "manual") return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
      <CheckCircle2 className="h-2.5 w-2.5" /> Conciliado
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
      <AlertTriangle className="h-2.5 w-2.5" /> Diferencia
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-400 bg-green-500/10 border-green-500/30"
    : score >= 60 ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
    : "text-gray-400 bg-gray-500/10 border-gray-500/30";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border", color)}>
      <Sparkles className="h-2.5 w-2.5" /> {score}%
    </span>
  );
}

// ─── Add Movement Modal ────────────────────────────────────────────────────

function AddMovementModal({
  bankAccountId,
  onClose,
  onAdded,
}: {
  bankAccountId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    ref: "",
    amount: "",
    direction: "debit" as "credit" | "debit",
  });
  const [pending, startT] = useTransition();
  const [error, setError] = useState("");

  function handleSave() {
    if (!form.description || !form.amount) { setError("Completá los campos requeridos"); return; }
    setError("");
    startT(async () => {
      const res = await addManualBankMovement(bankAccountId, {
        ...form,
        amount: parseFloat(form.amount.replace(/[^0-9.]/g, "")),
      });
      if (res.ok) { onAdded(); onClose(); }
      else setError(res.error);
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-400" /> Nuevo Movimiento Bancario
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tipo</label>
            <div className="flex bg-gray-800 p-1 rounded-lg">
              {(["debit", "credit"] as const).map((d) => (
                <button key={d} onClick={() => setForm((f) => ({ ...f, direction: d }))}
                  className={cn("flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                    form.direction === d ? (d === "credit" ? "bg-green-600 text-white" : "bg-red-600 text-white") : "text-gray-400"
                  )}>
                  {d === "credit" ? "Ingreso (Crédito)" : "Egreso (Débito)"}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: "Fecha *", key: "date", type: "date" },
            { label: "Descripción *", key: "description", type: "text", placeholder: "Ej: Transferencia cliente ABC" },
            { label: "Referencia / Nro. Cheque", key: "ref", type: "text", placeholder: "TXN-001, CHQ-1234..." },
            { label: "Monto (Gs.) *", key: "amount", type: "text", placeholder: "1.500.000" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2 text-sm text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={pending}
            className="flex-1 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? "Guardando..." : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function ConciliacionBancariaPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccountRow[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [bankMovements, setBankMovements]     = useState<BankMovementRow[]>([]);
  const [journalLines, setJournalLines]       = useState<JournalLineRow[]>([]);
  const [aiSuggestions, setAiSuggestions]     = useState<AiMatchSuggestion[]>([]);

  const [loadingMain, startLoadMain]   = useTransition();
  const [loadingAi, startLoadAi]       = useTransition();
  const [reconciling, startReconcile]  = useTransition();

  const [selectedBankMov, setSelectedBankMov]   = useState<BankMovementRow | null>(null);
  const [selectedJlLine, setSelectedJlLine]     = useState<JournalLineRow | null>(null);

  const [search, setSearch]           = useState("");
  const [glFilter, setGlFilter]       = useState<"all" | "pending" | "matched">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback]       = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvLoading, setCsvLoading]   = useState(false);

  // Load bank accounts on mount — using entityId from localStorage/sessionStorage
  useEffect(() => {
    const entityId = typeof window !== "undefined"
      ? (localStorage.getItem("selectedEntityId") || sessionStorage.getItem("selectedEntityId") || "")
      : "";
    if (!entityId) return;

    loadBankAccounts(entityId).then((r) => {
      if (r.ok && r.data.length > 0) {
        setBankAccounts(r.data);
        setSelectedAccountId(r.data[0].id);
      }
    });
  }, []);

  // Load movements + journal lines when account changes
  const refreshData = useCallback(() => {
    if (!selectedAccountId) return;
    const account = bankAccounts.find((a) => a.id === selectedAccountId);
    startLoadMain(async () => {
      const [movRes, jlRes] = await Promise.all([
        loadBankMovements(selectedAccountId),
        account?.glAccountId
          ? loadUnmatchedJournalLines(
              typeof window !== "undefined"
                ? (localStorage.getItem("selectedEntityId") || "")
                : "",
              account.glAccountId
            )
          : Promise.resolve({ ok: true as const, data: [] }),
      ]);
      if (movRes.ok) setBankMovements(movRes.data);
      if (jlRes.ok) setJournalLines(jlRes.data);
      setAiSuggestions([]);
    });
  }, [selectedAccountId, bankAccounts]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // Run AI Matcher
  function handleRunAiMatcher() {
    startLoadAi(async () => {
      const res = await runAiMatcher(bankMovements, journalLines);
      if (res.ok) {
        setAiSuggestions(res.data);
        setFeedback({ type: "ok", msg: `✓ AI encontró ${res.data.length} sugerencias de conciliación.` });
      } else {
        setFeedback({ type: "err", msg: res.error });
      }
    });
  }

  // Match selected pair
  function handleMatch(status: "matched" | "manual") {
    if (!selectedBankMov || !selectedJlLine) return;
    const bm = selectedBankMov;
    const jl = selectedJlLine;
    startReconcile(async () => {
      const res = await markReconciliation(bm.id, jl.entryId, status, 100);
      if (res.ok) {
        setFeedback({ type: "ok", msg: `✓ Conciliado: ${bm.description} ↔ ${jl.entryNumber}` });
        setSelectedBankMov(null);
        setSelectedJlLine(null);
        refreshData();
      } else {
        setFeedback({ type: "err", msg: res.error });
      }
    });
  }

  // Accept AI suggestion
  function handleAcceptSuggestion(sug: AiMatchSuggestion) {
    startReconcile(async () => {
      const jl = journalLines.find((j) => j.id === sug.journalLineId);
      if (!jl) return;
      const res = await markReconciliation(sug.bankMovementId, jl.entryId, "matched", sug.score);
      if (res.ok) {
        setAiSuggestions((prev) => prev.filter((s) => s.bankMovementId !== sug.bankMovementId));
        setFeedback({ type: "ok", msg: `✓ Sugerencia aceptada (score ${sug.score}%)` });
        refreshData();
      }
    });
  }

  // CSV import
  async function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedAccountId) return;
    setCsvLoading(true);
    const text = await file.text();
    const movements = await parseCsvText(text);
    if (!movements.length) {
      setFeedback({ type: "err", msg: "No se pudieron leer movimientos del archivo. Verificá el formato." });
      setCsvLoading(false);
      return;
    }
    const res = await importBankMovements(selectedAccountId, movements);
    setCsvLoading(false);
    if (res.ok) {
      setFeedback({ type: "ok", msg: `✓ ${res.data.imported} importados, ${res.data.skipped} omitidos (duplicados).` });
      refreshData();
    } else {
      setFeedback({ type: "err", msg: res.error });
    }
  }

  const filteredBankMovs = bankMovements.filter((m) => {
    if (search && !m.description.toLowerCase().includes(search.toLowerCase()) && !m.ref.toLowerCase().includes(search.toLowerCase())) return false;
    if (glFilter === "pending" && m.reconciliationStatus === "matched") return false;
    if (glFilter === "matched" && m.reconciliationStatus !== "matched") return false;
    return true;
  });

  const conciliados = bankMovements.filter((m) => m.reconciliationStatus === "matched" || m.reconciliationStatus === "manual").length;
  const pendientes  = bankMovements.filter((m) => !m.reconciliationStatus || m.reconciliationStatus === "pending").length;
  const totalIngr   = bankMovements.filter((m) => m.direction === "credit").reduce((s, m) => s + m.amount, 0);
  const totalEgr    = bankMovements.filter((m) => m.direction === "debit").reduce((s, m) => s + m.amount, 0);

  const currentAccount = bankAccounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-400" /> Conciliación Bancaria
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Conciliá extractos bancarios con el Libro Mayor — asistido por IA
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input ref={csvInputRef} type="file" accept=".csv,.txt" onChange={handleCsvFile} className="hidden" />
          <button onClick={() => csvInputRef.current?.click()} disabled={csvLoading || !selectedAccountId}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors disabled:opacity-40">
            {csvLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Importar CSV
          </button>
          <button onClick={handleRunAiMatcher} disabled={loadingAi || bankMovements.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40">
            {loadingAi ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loadingAi ? "Analizando..." : "AI Matcher"}
          </button>
          <button onClick={() => setShowAddModal(true)} disabled={!selectedAccountId}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40">
            <Plus className="h-4 w-4" /> Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm animate-in fade-in slide-in-from-top-1",
          feedback.type === "ok" ? "bg-green-950/20 border-green-800/40 text-green-400" : "bg-red-950/20 border-red-800/40 text-red-400"
        )}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Account Selector */}
      {bankAccounts.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-8 text-center">
          <Building2 className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No hay cuentas bancarias registradas</p>
          <p className="text-gray-600 text-xs mt-1">Configurá una cuenta bancaria en Configuración → Cuentas Bancarias</p>
        </div>
      ) : (
        <>
          {/* Account tabs */}
          <div className="flex gap-2 flex-wrap">
            {bankAccounts.map((acc) => (
              <button key={acc.id} onClick={() => setSelectedAccountId(acc.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                  selectedAccountId === acc.id
                    ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                    : "bg-gray-900/40 border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-600"
                )}>
                <CreditCard className="h-3.5 w-3.5" />
                <span className="font-medium">{acc.bankName}</span>
                <span className="text-xs opacity-60 font-mono">{acc.accountNumber}</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-gray-700/50">{acc.currencyCode}</span>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Ingresos", value: `₲ ${formatGs(totalIngr)}`, icon: ArrowDownLeft, color: "text-green-400", bg: "bg-green-500/10" },
              { label: "Total Egresos",  value: `₲ ${formatGs(totalEgr)}`,  icon: ArrowUpRight,  color: "text-red-400",   bg: "bg-red-500/10" },
              { label: "Conciliados",    value: `${conciliados} / ${bankMovements.length}`, icon: CheckCircle2, color: "text-blue-400",   bg: "bg-blue-500/10" },
              { label: "Pendientes",     value: String(pendientes),           icon: Clock,         color: "text-amber-400", bg: "bg-amber-500/10" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", s.bg)}>
                    <s.icon className={cn("h-4 w-4", s.color)} />
                  </div>
                  <span className="text-gray-500 text-xs">{s.label}</span>
                </div>
                <p className={cn("font-mono text-base font-bold tabular-nums", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* AI Suggestions Banner */}
          {aiSuggestions.length > 0 && (
            <div className="bg-purple-950/30 border border-purple-700/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">
                  {aiSuggestions.length} sugerencias de AI — Revisalas y acepta las correctas
                </span>
              </div>
              <div className="space-y-2">
                {aiSuggestions.slice(0, 5).map((sug) => {
                  const bm = bankMovements.find((m) => m.id === sug.bankMovementId);
                  const jl = journalLines.find((j) => j.id === sug.journalLineId);
                  if (!bm || !jl) return null;
                  return (
                    <div key={sug.bankMovementId} className="flex items-center gap-3 bg-purple-900/20 rounded-lg px-3 py-2">
                      <ScoreBadge score={sug.score} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-purple-200 truncate">
                          <span className="font-mono text-purple-400">{bm.ref || bm.description.slice(0, 25)}</span>
                          {" "}↔{" "}
                          <span className="font-mono text-purple-400">{jl.entryNumber}</span>
                        </p>
                        <p className="text-[10px] text-purple-400/70">{sug.reason}</p>
                      </div>
                      <span className={cn("text-xs font-mono", bm.direction === "credit" ? "text-green-400" : "text-red-400")}>
                        {bm.direction === "credit" ? "+" : "-"}₲{formatGs(bm.amount)}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => handleAcceptSuggestion(sug)} disabled={reconciling}
                          className="text-[10px] px-2 py-1 bg-green-700/80 hover:bg-green-600 text-white rounded-md transition-colors">
                          ✓ Aceptar
                        </button>
                        <button onClick={() => setAiSuggestions((p) => p.filter((s) => s.bankMovementId !== sug.bankMovementId))}
                          className="text-[10px] px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors">
                          Ignorar
                        </button>
                      </div>
                    </div>
                  );
                })}
                {aiSuggestions.length > 5 && (
                  <p className="text-[10px] text-purple-400 text-center">y {aiSuggestions.length - 5} más...</p>
                )}
              </div>
            </div>
          )}

          {/* Manual match action bar */}
          {(selectedBankMov || selectedJlLine) && (
            <div className="bg-blue-950/30 border border-blue-700/40 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
              <Link2 className="h-4 w-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                {selectedBankMov && (
                  <p className="text-xs text-blue-300">
                    <span className="font-bold">Extracto:</span> {selectedBankMov.description.slice(0, 40)} · ₲{formatGs(selectedBankMov.amount)}
                  </p>
                )}
                {selectedJlLine && (
                  <p className="text-xs text-blue-300">
                    <span className="font-bold">Asiento:</span> {selectedJlLine.entryNumber} — {selectedJlLine.description.slice(0, 35)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {selectedBankMov && selectedJlLine && (
                  <button onClick={() => handleMatch("matched")} disabled={reconciling}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold disabled:opacity-50">
                    {reconciling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                    Conciliar
                  </button>
                )}
                <button onClick={() => { setSelectedBankMov(null); setSelectedJlLine(null); }}
                  className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg">
                  Limpiar
                </button>
              </div>
            </div>
          )}

          {/* Dual Column */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* LEFT: Extracto Bancario */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-green-400" />
                  Extracto Bancario
                  {currentAccount && <span className="text-[10px] text-gray-500 font-normal font-mono">{currentAccount.bankName}</span>}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-800/60 p-0.5 rounded-lg text-[10px]">
                    {(["all", "pending", "matched"] as const).map((f) => (
                      <button key={f} onClick={() => setGlFilter(f)}
                        className={cn("px-2 py-1 rounded-md transition-colors",
                          glFilter === f ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
                        )}>
                        {f === "all" ? "Todo" : f === "pending" ? "Pendiente" : "Conciliado"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 border-b border-gray-800/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por descripción o referencia…"
                    className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-800/40 max-h-[500px] overflow-y-auto">
                {loadingMain ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : filteredBankMovs.length === 0 ? (
                  <div className="py-10 text-center">
                    <CreditCard className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Sin movimientos. Importá un extracto CSV o cargá manualmente.</p>
                  </div>
                ) : filteredBankMovs.map((mov) => {
                  const isSel = selectedBankMov?.id === mov.id;
                  const aiSug = aiSuggestions.find((s) => s.bankMovementId === mov.id);
                  return (
                    <div key={mov.id}
                      onClick={() => {
                        if (mov.reconciliationStatus === "matched") return;
                        setSelectedBankMov(isSel ? null : mov);
                      }}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 transition-colors",
                        mov.reconciliationStatus === "matched" ? "opacity-50 cursor-default" : "cursor-pointer",
                        isSel ? "bg-blue-900/20 border-l-2 border-l-blue-500" : "hover:bg-gray-800/20"
                      )}>
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                        mov.direction === "credit" ? "bg-green-500/10" : "bg-red-500/10"
                      )}>
                        {mov.direction === "credit"
                          ? <ArrowDownLeft className="h-4 w-4 text-green-400" />
                          : <ArrowUpRight  className="h-4 w-4 text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{mov.description}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-gray-500 font-mono">{mov.ref || "—"}</span>
                          <span className="text-[10px] text-gray-600">·</span>
                          <span className="text-[10px] text-gray-500">{mov.date}</span>
                          <StatusBadge status={mov.reconciliationStatus} />
                          {aiSug && <ScoreBadge score={aiSug.score} />}
                        </div>
                      </div>
                      <p className={cn("text-sm font-mono font-bold tabular-nums shrink-0",
                        mov.direction === "credit" ? "text-green-400" : "text-red-400"
                      )}>
                        {mov.direction === "credit" ? "+" : "-"}₲{formatGs(mov.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Libro Mayor */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Libro Mayor — Asientos Sin Conciliar
                </h2>
                <button onClick={refreshData} disabled={loadingMain} className="text-gray-400 hover:text-white">
                  <RefreshCw className={cn("h-4 w-4", loadingMain && "animate-spin")} />
                </button>
              </div>

              {!currentAccount?.glAccountId ? (
                <div className="p-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Esta cuenta bancaria no tiene cuenta GL asignada.</p>
                  <p className="text-[10px] text-gray-600 mt-1">Asignala en Configuración → Cuentas Bancarias</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/40 max-h-[500px] overflow-y-auto">
                  {loadingMain ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    </div>
                  ) : journalLines.length === 0 ? (
                    <div className="py-10 text-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-xs text-green-500 font-medium">¡Todo conciliado!</p>
                      <p className="text-[10px] text-gray-600 mt-1">No hay asientos pendientes de conciliación en esta cuenta.</p>
                    </div>
                  ) : journalLines.map((jl) => {
                    const isSel = selectedJlLine?.id === jl.id;
                    const netAmount = jl.debit > 0 ? jl.debit : jl.credit;
                    const isDebit   = jl.debit > 0;
                    return (
                      <div key={jl.id}
                        onClick={() => setSelectedJlLine(isSel ? null : jl)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
                          isSel ? "bg-blue-900/20 border-l-2 border-l-blue-500" : "hover:bg-gray-800/20"
                        )}>
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          isDebit ? "bg-red-500/10" : "bg-green-500/10"
                        )}>
                          {isDebit
                            ? <ArrowUpRight  className="h-4 w-4 text-red-400" />
                            : <ArrowDownLeft className="h-4 w-4 text-green-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium truncate">{jl.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-mono text-blue-400">{jl.entryNumber}</span>
                            <span className="text-[10px] text-gray-600">·</span>
                            <span className="text-[10px] text-gray-500">{jl.date}</span>
                            <span className="text-[10px] text-gray-600">·</span>
                            <span className="text-[10px] text-gray-500 font-mono">{jl.accountCode}</span>
                          </div>
                        </div>
                        <p className={cn("text-sm font-mono font-bold tabular-nums shrink-0",
                          isDebit ? "text-red-400" : "text-green-400"
                        )}>
                          {isDebit ? "D" : "H"} ₲{formatGs(netAmount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showAddModal && selectedAccountId && (
        <AddMovementModal
          bankAccountId={selectedAccountId}
          onClose={() => setShowAddModal(false)}
          onAdded={refreshData}
        />
      )}
    </div>
  );
}
