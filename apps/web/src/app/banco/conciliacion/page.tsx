"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import {
  Upload, CheckCircle2, X, AlertCircle, Search, ArrowRight,
  Download, FileText, TrendingUp, TrendingDown, Sparkles,
  Eye, ChevronDown, ChevronUp, CreditCard, Banknote, Filter,
  Calendar, DollarSign, BarChart3, Zap, Brain, Info, Loader2,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { FeatureGate } from "@/app/_components/feature-gate";
import { cn } from "@/lib/utils";
import { matchBankToGL, type BankMovement, type GLTransaction, type MatchResult } from "@/lib/bank-matcher";
import { parseBankCSV } from "@/lib/bank-parser";

const MOCK_GL: GLTransaction[] = [
  { id: "gl1", date: "2026-05-01", amount: 11000000, direction: "credit", description: "Pago a Importadora del Este", partnerName: "ImportEste", accountCode: "2.1.01" },
  { id: "gl2", date: "2026-05-03", amount: 2737500, direction: "credit", description: "Pago honorarios SerConPy", partnerName: "SerConPy", accountCode: "2.1.01" },
  { id: "gl3", date: "2026-05-01", amount: 2500000, direction: "debit", description: "Cobro factura pendiente", partnerName: "ComerPar", accountCode: "1.1.05" },
  { id: "gl4", date: "2026-05-10", amount: 2500000, direction: "credit", description: "Pago alquiler oficina", partnerName: "Inmobiliaria Central", accountCode: "5.1.05" },
  { id: "gl5", date: "2026-05-11", amount: 6050000, direction: "debit", description: "Cobro venta ComerPar", partnerName: "ComerPar", accountCode: "1.1.05" },
  { id: "gl6", date: "2026-05-05", amount: 1500000, direction: "credit", description: "Pago servicios públicos ANDE", partnerName: "ANDE", accountCode: "5.1.06" },
];

const SAMPLE_CSV = `Fecha,Descripción,Referencia,Crédito,Débito
01/05/2026,"Pago Importadora del Este","CHQ-001",0,11000000
03/05/2026,"Pago honorarios SerConPy","TRF-002",0,2737500
01/05/2026,"Cobro factura pendiente","DEP-003",2500000,0
10/05/2026,"Pago alquiler","CHQ-004",0,2500000
11/05/2026,"Cobro Comercial Paraguaya","TRF-005",6050000,0
15/05/2026,"Comisión bancaria","",0,45000
16/05/2026,"Intereses ganados","",85000,0`;

export default function ConciliacionBancariaPage() {
  const authStoreSelectedEntity = useAuthStore((state) => state.selectedEntity);

  if (authStoreSelectedEntity?.features && !authStoreSelectedEntity.features.bankApi) {
    return (
      <FeatureGate
        feature="bankApi"
        title="API Bancaria Desactivada"
        description="La conciliación bancaria y la sincronización con entidades bancarias como Itaú o GNB están desactivadas en tu plan actual. Habilítalo en el panel superadmin."
      >
        <div />
      </FeatureGate>
    );
  }

  const [step, setStep] = useState<"import" | "review" | "done">("import");
  const [csvText, setCsvText] = useState("");
  const [bankMovements, setBankMovements] = useState<BankMovement[]>([]);
  const [matches, setMatches] = useState<(MatchResult & { confirmed: boolean })[]>([]);
  const [unmatchedBank, setUnmatchedBank] = useState<BankMovement[]>([]);
  const [unmatchedGL, setUnmatchedGL] = useState<GLTransaction[]>([]);
  const [bankName, setBankName] = useState("gnb");
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState(2);

  // New state for match detail modal and AI suggestions
  const [showMatchDetail, setShowMatchDetail] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);

  const handleImport = () => {
    const text = csvText.trim() || SAMPLE_CSV;
    const result = parseBankCSV(text, bankName);
    if (!result.success) return;

    const movements: BankMovement[] = result.movements.map((m, i) => ({
      id: `bm-${i}`,
      date: m.date,
      amount: m.amount,
      direction: m.direction,
      description: m.description,
      ref: m.ref,
    }));

    setBankMovements(movements);
    runMatching(movements);
    setStep("review");
  };

  const runMatching = useCallback((movements: BankMovement[]) => {
    const result = matchBankToGL(movements, MOCK_GL, tolerance / 100);
    setMatches(result.matches.map(m => ({ ...m, confirmed: false })));
    setUnmatchedBank(result.unmatchedBank);
    setUnmatchedGL(result.unmatchedGL);
  }, [tolerance]);

  const confirmMatch = (bankId: string) => {
    setMatches(prev => prev.map(m => m.bankMovementId === bankId ? { ...m, confirmed: true } : m));
  };

  const rejectMatch = (bankId: string) => {
    const match = matches.find(m => m.bankMovementId === bankId);
    if (!match) return;
    const bm = bankMovements.find(b => b.id === bankId);
    if (bm) setUnmatchedBank(prev => [...prev, bm]);
    setMatches(prev => prev.filter(m => m.bankMovementId !== bankId));
  };

  const [customGL, setCustomGL] = useState<GLTransaction[]>([]);
  const [registeringBmId, setRegisteringBmId] = useState<string | null>(null);
  const [expenseAccount, setExpenseAccount] = useState("5.1.10");
  const [expenseDesc, setExpenseDesc] = useState("");

  const getGLTransaction = (id: string) => MOCK_GL.find(gl => gl.id === id) || customGL.find(gl => gl.id === id);
  const getBankMovement = (id: string) => bankMovements.find(bm => bm.id === id);

  const handleRegisterExpense = (bm: BankMovement) => {
    const newGlId = `gl-exp-${Date.now()}`;
    const newGL: GLTransaction = {
      id: newGlId,
      date: bm.date,
      amount: bm.amount,
      direction: bm.direction === "debit" ? "credit" : "debit",
      description: expenseDesc || bm.description || "Gasto Bancario",
      partnerName: "Banco",
      accountCode: expenseAccount,
    };

    setCustomGL(prev => [...prev, newGL]);
    
    // Automatically match and confirm
    const newMatch = {
      bankMovementId: bm.id,
      glTransactionId: newGlId,
      score: 1.0,
      confidence: "high" as const,
      reason: `Gasto Bancario Registrado (${expenseAccount})`,
      confirmed: true,
    };

    setMatches(prev => [...prev, newMatch]);
    setUnmatchedBank(prev => prev.filter(b => b.id !== bm.id));
    
    // Reset form state
    setRegisteringBmId(null);
    setExpenseDesc("");
  };

  const confirmedCount = matches.filter(m => m.confirmed).length;
  const totalCount = matches.length;

  const handleFinish = () => {
    setStep("done");
  };

  // AI suggestion for unmatched items
  const handleAiSuggest = async (bm: BankMovement) => {
    setAiLoadingId(bm.id);
    // Simulate AI analysis with delay
    await new Promise(r => setTimeout(r, 1500));
    const suggestions: string[] = [];
    const desc = bm.description?.toLowerCase() || "";
    if (desc.includes("comisión") || desc.includes("comision") || desc.includes("cargo")) {
      suggestions.push(`Cuenta sugerida: 5.1.09 — Comisiones Bancarias (${bm.direction === "debit" ? "gasto bancario" : "ingreso financiero"})`); 
    } else if (desc.includes("interes") || desc.includes("interés")) {
      suggestions.push(bm.direction === "credit" ? "Cuenta sugerida: 4.3.01 — Intereses Ganados" : "Cuenta sugerida: 5.3.01 — Intereses Pagados");
    } else if (desc.includes("transfer") || desc.includes("trf")) {
      suggestions.push("Posible transferencia interna. Verificá si existe asiento de egreso/ingreso bancario correspondiente.");
    } else {
      suggestions.push(`Movimiento sin match identificado. Monto: Gs. ${bm.amount.toLocaleString("es-PY")}. Tipo: ${bm.direction === "debit" ? "débito" : "crédito"}.`);
      suggestions.push("Revisá el extracto bancario físico y buscá el concepto en los asientos del mayor.");
    }
    setAiSuggestions(prev => ({ ...prev, [bm.id]: suggestions.join("\n\n") }));
    setAiLoadingId(null);
  };

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Conciliación Bancaria</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Banco GNB — Mayo 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs px-2 py-1 rounded font-medium",
            step === "import" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600",
            step === "review" && "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600",
            step === "done" && "bg-green-50 dark:bg-green-500/10 text-green-600",
          )}>
            {step === "import" ? "Paso 1: Importar" : step === "review" ? "Paso 2: Revisar" : "Completado"}
          </span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { label: "Importar Extracto", active: step === "import", done: step !== "import" },
          { label: "Revisar Matches", active: step === "review", done: step === "done" },
          { label: "Confirmar y Postear", active: step === "done", done: false },
        ].map((s, i) => (
          <div key={s.label} className="flex items-center flex-1">
            <div className={cn("flex items-center gap-2", s.active ? "text-blue-600" : s.done ? "text-green-600" : "text-gray-400")}>
              <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                s.active ? "bg-blue-100 dark:bg-blue-500/20" : s.done ? "bg-green-100 dark:bg-green-500/20" : "bg-gray-100 dark:bg-gray-800"
              )}>
                {s.done ? "✓" : i + 1}
              </div>
              <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && <div className={cn("flex-1 h-0.5 mx-2", s.done ? "bg-green-300" : "bg-gray-200 dark:bg-gray-700")} />}
          </div>
        ))}
      </div>

      {step === "import" && (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-medium text-gray-900 dark:text-white">Importar Extracto Bancario</h2>
          </div>

          <div className="flex items-center gap-3">
            <select value={bankName} onChange={e => setBankName(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs no-tap-highlight">
              <option value="gnb">Banco GNB</option>
              <option value="itau">Banco Itaú</option>
              <option value="continental">Banco Continental</option>
              <option value="generic">Otro / Genérico</option>
            </select>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>Tolerancia:</span>
              <input type="number" value={tolerance} onChange={e => setTolerance(Number(e.target.value))}
                className="w-14 px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-center text-xs no-tap-highlight" />
              <span>%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Pegar CSV del extracto</label>
            <textarea
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder={SAMPLE_CSV.split("\n").slice(0, 2).join("\n") + "\n..."}
              rows={8}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white font-mono placeholder-gray-400 no-tap-highlight resize-y"
            />
            <p className="text-[10px] text-gray-400 mt-1">CSV con columnas: Fecha, Descripción, Referencia, Crédito, Débito. O arrastrá un archivo .csv</p>
          </div>

          <div className="flex gap-2">
            <button onClick={handleImport}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium no-tap-highlight">
              <Zap className="h-4 w-4" /> Procesar Extracto
            </button>
            <button onClick={() => { setCsvText(SAMPLE_CSV); handleImport(); }}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg text-sm no-tap-highlight">
              Usar datos de demo
            </button>
          </div>
        </div>
      )}

      {step === "review" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatBox title="Matches" value={totalCount} icon={Sparkles} color="text-purple-500" />
            <StatBox title="Confirmados" value={confirmedCount} icon={CheckCircle2} color="text-green-500" />
            <StatBox title="Sin match banco" value={unmatchedBank.length} icon={X} color="text-orange-500" />
            <StatBox title="Sin match GL" value={unmatchedGL.length} icon={AlertCircle} color="text-red-500" />
          </div>

          {/* Matched */}
          {matches.length > 0 && (
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Matches Automáticos ({totalCount})</h3>
                <span className="text-xs text-gray-400">{confirmedCount} confirmados</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {matches.map((match) => {
                  const bm = getBankMovement(match.bankMovementId);
                  const gl = getGLTransaction(match.glTransactionId);
                  if (!bm || !gl) return null;

                  const isDetailOpen = showMatchDetail === match.bankMovementId;
                  return (
                    <div key={match.bankMovementId} className={cn("p-3 transition-colors", match.confirmed && "bg-green-950/5 dark:bg-green-500/5")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            match.confidence === "high" ? "bg-green-500/10" :
                            match.confidence === "medium" ? "bg-yellow-500/10" : "bg-red-500/10"
                          )}>
                            {match.confirmed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                              match.confidence === "high" ? <Sparkles className="h-4 w-4 text-green-400" /> :
                              <AlertCircle className="h-4 w-4 text-yellow-500" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-white">{bm.date}</span>
                              <span className="text-xs text-gray-400 truncate">{bm.description}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-800/30">
                                Score: {match.score}
                              </span>
                              <span className={cn("text-[10px] px-1 py-0.5 rounded font-medium",
                                match.confidence === "high" ? "text-green-400" : match.confidence === "medium" ? "text-yellow-400" : "text-red-400"
                              )}>{match.confidence}</span>
                              <span className="text-[10px] text-gray-500">{match.reason}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-white">
                            Gs. {bm.amount.toLocaleString("es-PY")}
                          </span>
                          <button
                            onClick={() => setShowMatchDetail(isDetailOpen ? null : match.bankMovementId)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {!match.confirmed ? (
                            <>
                              <button onClick={() => confirmMatch(match.bankMovementId)}
                                className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 no-tap-highlight">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => rejectMatch(match.bankMovementId)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 no-tap-highlight">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-green-400 font-semibold bg-green-500/10 px-2 py-0.5 rounded-full">✓ OK</span>
                          )}
                        </div>
                      </div>

                      {/* Match Detail Expand */}
                      {isDetailOpen && (
                        <div className="mt-3 ml-11 grid grid-cols-2 gap-3 animate-in fade-in duration-150">
                          <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Lado Banco (Extracto)</p>
                            <div className="space-y-1 text-[11px] font-mono">
                              <div className="flex justify-between"><span className="text-gray-500">Fecha</span><span className="text-gray-200">{bm.date}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Monto</span><span className={cn("font-bold", bm.direction === "credit" ? "text-green-400" : "text-red-400")}>Gs. {bm.amount.toLocaleString("es-PY")}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="text-gray-300">{bm.direction === "credit" ? "Crédito" : "Débito"}</span></div>
                              {bm.ref && <div className="flex justify-between"><span className="text-gray-500">Ref.</span><span className="text-gray-300">{bm.ref}</span></div>}
                            </div>
                          </div>
                          <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3">
                            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-2">Lado Mayor (GL)</p>
                            <div className="space-y-1 text-[11px] font-mono">
                              <div className="flex justify-between"><span className="text-gray-500">Fecha</span><span className="text-gray-200">{gl.date}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Monto</span><span className={cn("font-bold", gl.direction === "credit" ? "text-green-400" : "text-red-400")}>Gs. {gl.amount.toLocaleString("es-PY")}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Cuenta</span><span className="text-gray-300">{gl.accountCode}</span></div>
                              <div className="flex justify-between"><span className="text-gray-500">Partner</span><span className="text-gray-300 truncate ml-4">{gl.partnerName}</span></div>
                            </div>
                          </div>
                          <div className={cn("col-span-2 rounded-xl p-2 border text-[10px] flex items-center justify-between",
                            Math.abs(bm.amount - gl.amount) < 10
                              ? "bg-green-950/10 border-green-800/30 text-green-400"
                              : "bg-amber-950/10 border-amber-800/30 text-amber-400"
                          )}>
                            <span>Diferencia: Gs. {Math.abs(bm.amount - gl.amount).toLocaleString("es-PY")}</span>
                            <span className="font-semibold">{Math.abs(bm.amount - gl.amount) < 10 ? "✓ Cuadra perfectamente" : "⚠ Diferencia dentro de tolerancia"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unmatched */}
          {unmatchedBank.length > 0 && (
            <div className="bg-white dark:bg-gray-900/50 border border-orange-200 dark:border-orange-800/30 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" /> Sin Match — Banco ({unmatchedBank.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-800/50">
                {unmatchedBank.map((bm) => {
                  const isRegistering = registeringBmId === bm.id;
                  const aiSugg = aiSuggestions[bm.id];
                  return (
                    <div key={bm.id} className="p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">{bm.date}</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{bm.description}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-white">
                            Gs. {bm.amount.toLocaleString("es-PY")}
                          </span>
                          {/* AI Suggest Button */}
                          <button
                            onClick={() => handleAiSuggest(bm)}
                            disabled={aiLoadingId === bm.id}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-md transition-colors no-tap-highlight border border-purple-800/30"
                          >
                            {aiLoadingId === bm.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                            {aiLoadingId === bm.id ? "IA..." : "Sugerir"}
                          </button>
                          {!isRegistering ? (
                            <button
                              onClick={() => {
                                setRegisteringBmId(bm.id);
                                setExpenseDesc(bm.description);
                                setExpenseAccount("5.1.10");
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-md transition-colors no-tap-highlight border border-blue-800/30"
                            >
                              <CreditCard className="h-3 w-3" /> Registrar Gasto
                            </button>
                          ) : (
                            <span className="text-xs text-blue-400 font-medium animate-pulse">Registrando...</span>
                          )}
                        </div>
                      </div>

                      {isRegistering && (
                        <div className="bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/80 rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                                Cuenta de Gasto / Comisión
                              </label>
                              <select
                                value={expenseAccount}
                                onChange={(e) => setExpenseAccount(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="5.1.10">5.1.10 - Gastos Bancarios</option>
                                <option value="5.1.09">5.1.09 - Comisiones Bancarias</option>
                                <option value="5.1.12">5.1.12 - Intereses Financieros</option>
                                <option value="5.1.06">5.1.06 - Servicios Públicos</option>
                                <option value="5.1.05">5.1.05 - Alquileres Pagados</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                                Descripción del Asiento
                              </label>
                              <input
                                type="text"
                                value={expenseDesc}
                                onChange={(e) => setExpenseDesc(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Concepto del gasto"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-800/40">
                            <button
                              onClick={() => setRegisteringBmId(null)}
                              className="px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleRegisterExpense(bm)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[11px] font-semibold shadow-sm transition-colors"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Registrar y Conciliar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* AI suggestion result */}
                      {aiSugg && (
                        <div className="bg-purple-950/20 border border-purple-800/30 rounded-xl p-3 space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Brain className="h-3.5 w-3.5 text-purple-400" />
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Sugerencia del Copiloto IA</span>
                          </div>
                          <p className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-wrap">{aiSugg}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={() => setStep("import")} className="px-4 py-2.5 text-sm text-gray-500 no-tap-highlight">
              ← Volver
            </button>
            <button onClick={handleFinish}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium no-tap-highlight">
              Finalizar Conciliación
            </button>
          </div>
        </>
      )}

      {step === "done" && (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Conciliación Completada</h2>
            <p className="text-sm text-gray-500 mt-1">Banco GNB — Mayo 2026</p>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-sm">
            <div><p className="text-gray-400 text-xs">Matches</p><p className="font-bold text-green-600">{confirmedCount}</p></div>
            <div><p className="text-gray-400 text-xs">Sin match</p><p className="font-bold text-orange-600">{unmatchedBank.length}</p></div>
            <div><p className="text-gray-400 text-xs">Diferencia</p><p className="font-bold text-gray-900 dark:text-white">Gs. 0</p></div>
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { setStep("import"); setCsvText(""); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium no-tap-highlight">
              Nueva Conciliación
            </button>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 rounded-lg text-sm font-medium no-tap-highlight">
              <Download className="h-4 w-4 inline mr-1" /> Exportar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-gray-400 uppercase">{title}</span>
        <Icon className={cn("h-3.5 w-3.5", color)} />
      </div>
      <p className={cn("text-xl font-bold", color)}>{value}</p>
    </div>
  );
}
