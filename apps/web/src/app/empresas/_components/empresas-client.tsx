"use client";

import { useState, useTransition, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Plus, Search, Filter,
  Edit, AlertTriangle, X,
  Loader2, CheckCircle2, AlertCircle,
  Power, PowerOff, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Entity } from "@/lib/db/schema";
import { createEmpresa, updateEmpresa, setEmpresaStatus } from "../actions";
import { validateRUC } from "@/lib/ruc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-amber-500 to-orange-600",
  "from-secondary to-secondary-dark",
  "from-cyan-500 to-teal-600",
  "from-primary to-primary-dark",
  "from-rose-500 to-pink-600",
  "from-indigo-500 to-indigo-700",
];

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function getColor(ruc: string): string {
  const hash = ruc.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const STATUS_LABEL: Record<string, string> = {
  active:   "Activa",
  inactive: "Inactiva",
  closed:   "Cerrada",
};

const STATUS_CLASS: Record<string, string> = {
  active:   "badge-green",
  inactive: "badge-yellow",
  closed:   "badge-gray",
};

const REGIMES = [
  "IVA General / IRE General",
  "IVA General / IRE Simple",
  "ReSimple",
  "Exportador / IVA General",
  "IRE General",
  "IRE Simple",
];

// ─── Form (create + edit) ──────────────────────────────────────────────────────

interface EmpresaFormProps {
  initial?:  Entity;
  onClose:   () => void;
  onSuccess: (e: Entity) => void;
}

function EmpresaForm({ initial, onClose, onSuccess }: EmpresaFormProps) {
  const formRef                   = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [rucError,  setRucError]  = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const isEdit = Boolean(initial);

  function handleRucChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.length < 3) { setRucError(null); return; }
    const r = validateRUC(val);
    setRucError(r.valid ? null : (r.error ?? null));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const rucVal = (formData.get("ruc") as string) ?? "";
    const rucCheck = validateRUC(rucVal);
    if (!rucCheck.valid) { setRucError(rucCheck.error ?? "RUC inválido"); return; }

    setFormError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateEmpresa(initial!.id, formData)
        : await createEmpresa(formData);

      if (!result.ok) {
        setFormError(result.error);
      } else {
        setSuccess(true);
        formRef.current?.reset();
        setRucError(null);
        setTimeout(() => {
          onSuccess(result.data);
          onClose();
          setSuccess(false);
        }, 600);
      }
    });
  }

  return (
    <div className="card p-5 lg:p-6 animate-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-gray-900 dark:text-white text-base">
          {isEdit ? "Editar Empresa" : "Nueva Empresa"}
        </h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* RUC */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
            RUC <span className="text-red-500">*</span>
          </label>
          <input
            name="ruc"
            type="text"
            defaultValue={initial?.ruc ?? ""}
            placeholder="80144114-5"
            required
            onChange={handleRucChange}
            className={cn("input-field", rucError && "border-red-400 focus:ring-red-400")}
          />
          {rucError && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {rucError}
            </p>
          )}
        </div>

        {/* Razón Social */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
            Razón Social <span className="text-red-500">*</span>
          </label>
          <input
            name="legalName"
            type="text"
            defaultValue={initial?.legalName ?? ""}
            placeholder="Empresa S.A."
            required
            className="input-field"
          />
        </div>

        {/* Nombre Comercial */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
            Nombre Comercial
          </label>
          <input
            name="tradeName"
            type="text"
            defaultValue={initial?.tradeName ?? ""}
            placeholder="Nombre comercial"
            className="input-field"
          />
        </div>

        {/* Régimen */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
            Régimen Tributario <span className="text-red-500">*</span>
          </label>
          <select
            name="taxRegimes"
            required
            defaultValue={initial?.taxRegimes?.join(" / ") ?? ""}
            className="input-field"
          >
            <option value="">Seleccioná el régimen</option>
            {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Feedback */}
        {formError && (
          <div className="md:col-span-2 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400 text-sm">{formError}</p>
          </div>
        )}
        {success && (
          <div className="md:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200">
            <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
            <p className="text-secondary-dark dark:text-secondary-300 text-sm font-medium">
              {isEdit ? "Empresa actualizada" : "Empresa creada correctamente"}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={isPending}>
            Cancelar
          </button>
          <button type="submit" className="btn-secondary" disabled={isPending || !!rucError}>
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
              : isEdit
                ? <><Edit className="h-4 w-4" /> Guardar Cambios</>
                : <><Plus className="h-4 w-4" /> Crear Empresa</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Entity[];
  dbError?:    string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function EmpresasClient({ initialData, dbError }: Props) {
  const router = useRouter();

  const [data,        setData]        = useState<Entity[]>(initialData);
  const [showCreate,  setShowCreate]  = useState(false);
  const [editTarget,  setEditTarget]  = useState<Entity | null>(null);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [menuOpenId,  setMenuOpenId]  = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [, startStatusTransition]     = useTransition();

  const filtered = data.filter((e) => {
    const q = searchTerm.toLowerCase();
    return (
      e.legalName.toLowerCase().includes(q) ||
      e.ruc.includes(q) ||
      (e.tradeName?.toLowerCase().includes(q) ?? false)
    );
  });

  const stats = [
    { label: "Total",     value: data.length,                                      color: "text-primary"   },
    { label: "Activas",   value: data.filter((e) => e.status === "active").length, color: "text-secondary" },
    { label: "Inactivas", value: data.filter((e) => e.status !== "active").length, color: "text-amber-600" },
  ];

  // Inline update after create/edit (avoids full round-trip until router.refresh)
  function handleSaved(entity: Entity) {
    setData((prev) => {
      const exists = prev.find((e) => e.id === entity.id);
      if (exists) return prev.map((e) => e.id === entity.id ? entity : e);
      return [...prev, entity].sort((a, b) => a.legalName.localeCompare(b.legalName));
    });
    router.refresh();
  }

  function handleStatusChange(empresa: Entity, newStatus: "active" | "inactive" | "closed") {
    setMenuOpenId(null);
    setStatusError(null);
    startStatusTransition(async () => {
      const result = await setEmpresaStatus(empresa.id, newStatus);
      if (result.ok) {
        setData((prev) =>
          prev.map((e) => e.id === empresa.id ? { ...e, status: newStatus } : e)
        );
        router.refresh();
      } else {
        setStatusError(result.error);
      }
    });
  }

  return (
    <div className="page-container" onClick={() => setMenuOpenId(null)}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Empresas</h1>
          <p className="section-subtitle">Gestión de contribuyentes del estudio</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditTarget(null); }}
          className="btn-secondary text-sm"
        >
          <Plus className="h-4 w-4" />
          Nueva Empresa
        </button>
      </div>

      {/* Banners */}
      {dbError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 dark:text-amber-300 text-sm font-semibold">Base de datos no disponible</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">{dbError}</p>
          </div>
        </div>
      )}
      {statusError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {statusError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card-flat p-4 text-center">
            <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && !editTarget && (
        <EmpresaForm
          onClose={() => setShowCreate(false)}
          onSuccess={handleSaved}
        />
      )}

      {/* Edit form */}
      {editTarget && (
        <EmpresaForm
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={handleSaved}
        />
      )}

      {/* List */}
      <div className="card-flat overflow-hidden">
        {/* Search */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar empresa por nombre o RUC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 py-2"
            />
          </div>
          <button className="btn-ghost shrink-0 py-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
          <span className="col-span-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Empresa</span>
          <span className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Régimen</span>
          <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</span>
          <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Acciones</span>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {filtered.map((empresa) => (
            <div
              key={empresa.id}
              className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 px-5 py-3.5 table-row-hover"
            >
              {/* Avatar + name */}
              <div className="sm:col-span-5 flex items-center gap-3 min-w-0">
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm bg-gradient-to-br",
                  getColor(empresa.ruc)
                )}>
                  {getInitials(empresa.legalName)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{empresa.legalName}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {empresa.tradeName && empresa.tradeName !== empresa.legalName
                      ? empresa.tradeName
                      : empresa.legalName.split(" ")[0]}
                    <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                    RUC {empresa.ruc}
                  </p>
                </div>
              </div>

              {/* Régimen */}
              <div className="sm:col-span-3 hidden sm:block">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                  {empresa.taxRegimes?.join(" / ") ?? "—"}
                </span>
              </div>

              {/* Estado */}
              <div className="sm:col-span-2">
                <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-semibold", STATUS_CLASS[empresa.status ?? "active"] ?? "badge-gray")}>
                  {STATUS_LABEL[empresa.status ?? "active"] ?? empresa.status}
                </span>
              </div>

              {/* Actions */}
              <div className="sm:col-span-2 flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                <button
                  title="Editar"
                  onClick={() => { setEditTarget(empresa); setShowCreate(false); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-primary"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>

                {/* Status menu */}
                <div className="relative">
                  <button
                    title="Más opciones"
                    onClick={() => setMenuOpenId(menuOpenId === empresa.id ? null : empresa.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>

                  {menuOpenId === empresa.id && (
                    <div className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 text-sm">
                      {empresa.status !== "active" && (
                        <button
                          onClick={() => handleStatusChange(empresa, "active")}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-left text-secondary font-medium"
                        >
                          <Power className="h-3.5 w-3.5" /> Activar empresa
                        </button>
                      )}
                      {empresa.status === "active" && (
                        <button
                          onClick={() => handleStatusChange(empresa, "inactive")}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-left text-amber-600 font-medium"
                        >
                          <PowerOff className="h-3.5 w-3.5" /> Dar de baja
                        </button>
                      )}
                      {empresa.status !== "closed" && (
                        <button
                          onClick={() => handleStatusChange(empresa, "closed")}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-left text-red-600 font-medium border-t border-gray-100 dark:border-slate-700 mt-1"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> Cerrar empresa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Building2 className="h-12 w-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">
                {dbError
                  ? "Configurá la base de datos para ver las empresas"
                  : searchTerm
                    ? "No se encontraron empresas con ese criterio"
                    : "Todavía no hay empresas — creá la primera"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
