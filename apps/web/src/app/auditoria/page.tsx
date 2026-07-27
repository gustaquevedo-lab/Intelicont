"use client";

import { useState, useMemo } from "react";
import {
  Shield, Search, Filter, Eye, Clock, User, FileText,
  ArrowRight, Calendar, ChevronDown, ChevronUp, Download,
  AlertCircle, CheckCircle2, Edit, Plus, Trash, Lock,
  Sparkles, X, Loader2, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import { runAiAuditAction } from "@/lib/actions";

interface AuditEvent {
  id: string;
  date: string;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  entity: string;
}

const MOCK_AUDIT: AuditEvent[] = [
  { id: "a1", date: "2026-05-12 14:23", actor: "Gustavo Admin", action: "create_journal", targetType: "journal_entry", targetId: "JE-007", description: "Creación de asiento desde XML SIFEN", before: null, after: { status: "posted", total: 11000000 }, entity: "Importadora del Este" },
  { id: "a2", date: "2026-05-12 10:15", actor: "Gustavo Admin", action: "approve_sifen", targetType: "tax_document", targetId: "TD-001", description: "Documento SIFEN aprobado y posteado", before: { status: "pending" }, after: { status: "posted" }, entity: "Importadora del Este" },
  { id: "a3", date: "2026-05-12 09:00", actor: "María Contadora", action: "upload_sifen", targetType: "tax_document", targetId: "TD-008", description: "Carga de XML SIFEN", before: null, after: { sifenStatus: "uploaded", total: 3850000 }, entity: "Tech Asunción" },
  { id: "a4", date: "2026-05-11 16:45", actor: "Gustavo Admin", action: "reverse_journal", targetType: "journal_entry", targetId: "JE-003", description: "Reversión de asiento por error en monto", before: { status: "posted" }, after: { status: "reversed" }, entity: "Importadora del Este" },
  { id: "a5", date: "2026-05-10 11:20", actor: "Gustavo Admin", action: "close_period", targetType: "fiscal_period", targetId: "2026-04", description: "Cierre del período abril 2026", before: { status: "open" }, after: { status: "closed" }, entity: "Importadora del Este" },
  { id: "a6", date: "2026-05-10 10:00", actor: "Sistema", action: "auto_depreciation", targetType: "journal_entry", targetId: "JE-DEP-05", description: "Depreciación automática mensual", before: null, after: { status: "posted" }, entity: "Importadora del Este" },
  { id: "a7", date: "2026-05-09 15:30", actor: "María Contadora", action: "update_partner", targetType: "partner", targetId: "P-005", description: "Actualización datos de proveedor", before: { nombre: "Agro Guaraní" }, after: { nombre: "Agropecuaria Guaraní" }, entity: "Importadora del Este" },
  { id: "a8", date: "2026-05-09 08:45", actor: "Gustavo Admin", action: "create_partner", targetType: "partner", targetId: "P-006", description: "Alta de nuevo cliente", before: null, after: { ruc: "3456789-0", nombre: "Comercial Paraguaya" }, entity: "Importadora del Este" },
  { id: "a9", date: "2026-05-08 14:00", actor: "Sistema", action: "sifen_error", targetType: "tax_document", targetId: "TD-005", description: "Error validación SIFEN: RUC emisor no coincide con timbrado", before: null, after: { status: "error" }, entity: "Importadora del Este" },
  { id: "a10", date: "2026-05-05 09:45", actor: "Gustavo Admin", action: "approve_sifen", targetType: "tax_document", targetId: "TD-004", description: "Nota de crédito aprobada y posteada", before: { status: "pending" }, after: { status: "posted" }, entity: "Importadora del Este" },
  { id: "a11", date: "2026-05-03 14:15", actor: "Gustavo Admin", action: "create_journal", targetType: "journal_entry", targetId: "JE-002", description: "Asiento de honorarios contables", before: null, after: { status: "posted" }, entity: "Importadora del Este" },
  { id: "a12", date: "2026-05-01 10:30", actor: "Gustavo Admin", action: "create_journal", targetType: "journal_entry", targetId: "JE-001", description: "Primer asiento del período", before: null, after: { status: "posted" }, entity: "Importadora del Este" },
];

const ACTION_LABELS: Record<string, string> = {
  create_journal: "Creación de Asiento",
  approve_sifen: "Aprobación SIFEN",
  upload_sifen: "Carga XML SIFEN",
  reverse_journal: "Reversión de Asiento",
  close_period: "Cierre de Período",
  auto_depreciation: "Depreciación Automática",
  update_partner: "Actualización Tercero",
  create_partner: "Alta de Tercero",
  sifen_error: "Error SIFEN",
};

const ACTION_COLORS: Record<string, string> = {
  create_journal: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  approve_sifen: "text-green-500 bg-green-50 dark:bg-green-500/10",
  upload_sifen: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
  reverse_journal: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
  close_period: "text-red-500 bg-red-50 dark:bg-red-500/10",
  auto_depreciation: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10",
  update_partner: "text-amber-500 bg-amber-50 dark:bg-amber-500/10",
  create_partner: "text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10",
  sifen_error: "text-red-500 bg-red-50 dark:bg-red-500/10",
};

const ACTION_ICONS: Record<string, any> = {
  create_journal: Plus,
  approve_sifen: CheckCircle2,
  upload_sifen: FileText,
  reverse_journal: Edit,
  close_period: Lock,
  auto_depreciation: Clock,
  update_partner: Edit,
  create_partner: Plus,
  sifen_error: AlertCircle,
};

export default function AuditTrailPage() {
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);

  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  // AI Auditor Modal states
  const [showAiAudit, setShowAiAudit] = useState(false);
  const [loadingAiAudit, setLoadingAiAudit] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<{
    score: string;
    summary: string;
    anomalies: Array<{ id: string; type: string; asiento: string; desc: string; correction: string }>;
  } | null>(null);

  const filtered = useMemo(() =>
    MOCK_AUDIT.filter((e) => {
      const s = search.toLowerCase();
      const matches = !s || e.description.toLowerCase().includes(s) || e.actor.toLowerCase().includes(s) || e.entity.toLowerCase().includes(s);
      const matchesAction = filterAction === "all" || e.action === filterAction;
      return matches && matchesAction;
    }),
    [search, filterAction]
  );

  async function handleTriggerAiAudit() {
    if (!selectedEntity?.id) return;
    setLoadingAiAudit(true);
    setShowAiAudit(true);
    setAiAuditResult(null);

    try {
      const res = await runAiAuditAction(selectedEntity.id);
      if (res.success) {
        setAiAuditResult({
          score: res.score || "A",
          summary: res.summary || "Auditoría ejecutada de manera exitosa.",
          anomalies: res.anomalies || []
        });
      } else {
        console.error("AI Audit error:", res.error);
      }
    } catch (err) {
      console.error("AI Audit failed:", err);
    } finally {
      setLoadingAiAudit(false);
    }
  }

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[9px] mb-1">
            <Shield className="h-3 w-3" />
            <span>Registro Contable Inmutable</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">Auditoría del Período</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Control de eventos de seguridad y clasificación fiscal.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTriggerAiAudit}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            <Sparkles className="h-4 w-4" /> Auditoría Inteligente IA
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <Download className="h-4 w-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Eventos", value: MOCK_AUDIT.length, color: "text-blue-500" },
          { label: "Asientos Creados", value: MOCK_AUDIT.filter(e => e.action === "create_journal").length, color: "text-emerald-500" },
          { label: "SIFEN Procesados", value: MOCK_AUDIT.filter(e => e.action.startsWith("sifen") || e.action.startsWith("approve_sifen")).length, color: "text-purple-500" },
          { label: "Hoy", value: MOCK_AUDIT.filter(e => e.date.startsWith("2026-05-12")).length, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3.5 shadow-sm">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{s.label}</span>
            <p className={cn("text-2xl font-black tracking-tight mt-0.5", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en auditoría..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2.5 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white no-tap-highlight outline-none font-semibold">
          <option value="all">Todas las acciones</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-1.5">
        {filtered.map((event) => {
          const Icon = ACTION_ICONS[event.action] || FileText;
          const isExpanded = expanded === event.id;

          return (
            <div key={event.id} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
              <div
                onClick={() => setExpanded(isExpanded ? null : event.id)}
                className="flex items-start gap-3 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/20 no-tap-highlight"
              >
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm", ACTION_COLORS[event.action] || "bg-gray-100")}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {ACTION_LABELS[event.action] || event.action}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">{event.entity}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{event.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1"><User className="h-3 w-3" />{event.actor}</span>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1"><Clock className="h-3 w-3" />{event.date}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">ID: {event.targetId}</span>
                  </div>
                </div>
                <button className="shrink-0 p-1">{isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}</button>
              </div>

              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {event.before && (
                      <div>
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Antes</span>
                        <pre className="mt-1 p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 font-mono text-[10px] text-gray-600 dark:text-gray-400 overflow-x-auto">
                          {JSON.stringify(event.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {event.after && (
                      <div>
                        <span className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Después</span>
                        <pre className="mt-1 p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 font-mono text-[10px] text-gray-600 dark:text-gray-400 overflow-x-auto">
                          {JSON.stringify(event.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  {!event.before && !event.after && (
                    <p className="text-xs text-gray-400">Sin datos de diff disponibles</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center text-xs text-gray-400 font-semibold">
        {filtered.length} de {MOCK_AUDIT.length} eventos — Todos los cambios son inmutables y auditables
      </div>

      {/* AI Auditor Modal */}
      {showAiAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-2xl w-full rounded-2xl p-6 space-y-6 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                  <Sparkles className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">InteliAudit™ Auditor</h3>
                  <p className="text-[10px] text-gray-500 font-bold">Análisis de Anomalías Fiscales y Contables</p>
                </div>
              </div>
              <button onClick={() => setShowAiAudit(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingAiAudit ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm text-gray-500 font-black animate-pulse">Gemini está analizando los asientos contables...</p>
              </div>
            ) : aiAuditResult ? (
              <div className="space-y-6">
                {/* Executive Score & Summary */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-gray-900 border border-slate-200/50 dark:border-gray-800">
                  <div className="h-14 w-14 shrink-0 rounded-xl bg-primary flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/20">
                    {aiAuditResult.score}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase text-gray-400">Score de Calidad Fiscal</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                      {aiAuditResult.summary}
                    </p>
                  </div>
                </div>

                {/* Anomalies List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-gray-400">Inconsistencias y Observaciones Detectadas</h4>
                  
                  {aiAuditResult.anomalies.length === 0 ? (
                    <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs font-black flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      No se detectaron inconsistencias en los asientos analizados. ¡Excelente precisión fiscal!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiAuditResult.anomalies.map((an, index) => (
                        <div
                          key={index}
                          className={cn(
                            "p-4 rounded-xl border space-y-2.5",
                            an.type === "danger"
                              ? "bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400"
                              : "bg-amber-500/5 border-amber-500/20 text-amber-700 dark:text-amber-400"
                          )}
                        >
                          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                            <span>Asiento: {an.asiento}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px]",
                              an.type === "danger" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                              {an.type === "danger" ? "Error Grave" : "Advertencia"}
                            </span>
                          </div>

                          <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-semibold">
                            {an.desc}
                          </p>

                          <div className="pt-2 border-t border-gray-200/50 dark:border-gray-800/50 flex items-start gap-1.5 text-xs text-gray-500">
                            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                            <p className="font-semibold">
                              <span className="font-bold text-gray-700 dark:text-gray-300">Sugerencia de Corrección:</span> {an.correction}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
