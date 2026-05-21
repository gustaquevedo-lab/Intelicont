"use client";

import { useState, useTransition, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Plus, Search, Filter,
  MoreHorizontal, Edit, AlertTriangle, X,
  Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Entity } from "@/lib/db/schema";
import { createEmpresa } from "../actions";
import { validateRUC } from "@/lib/ruc";

// ─── Avatar helpers ───────────────────────────────────────────────────────────

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
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function getColor(ruc: string): string {
  const hash = ruc.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Status label map ─────────────────────────────────────────────────────────

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

// ─── REGIMES available ────────────────────────────────────────────────────────

const REGIMES = [
  "IVA General / IRE General",
  "IVA General / IRE Simple",
  "ReSimple",
  "Exportador / IVA General",
  "IRE General",
  "IRE Simple",
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialData: Entity[];
  dbError?:    string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmpresasClient({ initialData, dbError }: Props) {
  const router    = useRouter();
  const formRef   = useRef<HTMLFormElement>(null);

  const [showForm,    setShowForm]    = useState(false);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [isPending,   startTransition] = useTransition();
  const [formError,   setFormError]   = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [rucError,    setRucError]    = useState<string | null>(null);

  // ── Client-side search filter (no round-trip) ──────────────────────────────
  const filtered = initialData.filter((e) => {
    const q = searchTerm.toLowerCase();
    return (
      e.legalName.toLowerCase().includes(q) ||
      e.ruc.includes(q) ||
      (e.tradeName?.toLowerCase().includes(q) ?? false)
    );
  });

  // ── RUC live validation ────────────────────────────────────────────────────
  function handleRucChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.length < 3) { setRucError(null); return; }
    const result = validateRUC(val);
    setRucError(result.valid ? null : (result.error ?? null));
  }

  // ── Form submit ────────────────────────────────────────────────────────────
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Client-side RUC pre-check before server round-trip
    const rucVal = (formData.get("ruc") as string) ?? "";
    const rucCheck = validateRUC(rucVal);
    if (!rucCheck.valid) {
      setRucError(rucCheck.error ?? "RUC inválido");
      return;
    }

    setFormError(null);
    setFormSuccess(false);

    startTransition(async () => {
      const result = await createEmpresa(formData);
      if (!result.ok) {
        setFormError(result.error);
      } else {
        setFormSuccess(true);
        formRef.current?.reset();
        setRucError(null);
        // Refresh server component data
        setTimeout(() => {
          setShowForm(false);
          setFormSuccess(false);
          router.refresh();
        }, 800);
      }
    });
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    { label: "Total",      value: initialData.length,                                color: "text-primary"    },
    { label: "Activas",    value: initialData.filter((e) => e.status === "active").length,  color: "text-secondary"  },
    { label: "Inactivas",  value: initialData.filter((e) => e.status !== "active").length,  color: "text-amber-600"  },
  ];

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Empresas</h1>
          <p className="section-subtitle">Gestión de contribuyentes del estudio</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(null); setFormSuccess(false); }}
          className={showForm ? "btn-ghost" : "btn-secondary text-sm"}
        >
          <Plus className="h-4 w-4" />
          Nueva Empresa
        </button>
      </div>

      {/* DB error banner */}
      {dbError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 dark:text-amber-300 text-sm font-semibold">Base de datos no configurada</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">{dbError}</p>
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card-flat p-4 text-center">
            <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New empresa form */}
      {showForm && (
        <div className="card p-5 lg:p-6 animate-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 dark:text-white">Nueva Empresa</h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
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
                placeholder="80144114-5"
                required
                onChange={handleRucChange}
                className={cn(
                  "input-field",
                  rucError && "border-red-400 dark:border-red-600 focus:ring-red-400"
                )}
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
              <input name="legalName" type="text" placeholder="Empresa S.A." required className="input-field" />
            </div>

            {/* Nombre Comercial */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Nombre Comercial
              </label>
              <input name="tradeName" type="text" placeholder="Nombre comercial" className="input-field" />
            </div>

            {/* Régimen */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Régimen Tributario <span className="text-red-500">*</span>
              </label>
              <select name="taxRegimes" required className="input-field">
                <option value="">Seleccioná el régimen</option>
                {REGIMES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Feedback messages */}
            {formError && (
              <div className="md:col-span-2 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400 text-sm">{formError}</p>
              </div>
            )}
            {formSuccess && (
              <div className="md:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800/50">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0" />
                <p className="text-secondary-dark dark:text-secondary-300 text-sm font-medium">Empresa creada correctamente</p>
              </div>
            )}

            {/* Actions */}
            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" disabled={isPending}>
                Cancelar
              </button>
              <button type="submit" className="btn-secondary" disabled={isPending || !!rucError}>
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
                ) : (
                  <><Plus className="h-4 w-4" /> Crear Empresa</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="card-flat overflow-hidden">
        {/* Search & filters */}
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
                    {empresa.tradeName ?? empresa.legalName.split(" ")[0]}
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
              <div className="sm:col-span-2 flex items-center gap-2">
                <span className={STATUS_CLASS[empresa.status ?? "active"] ?? "badge-gray"}>
                  {STATUS_LABEL[empresa.status ?? "active"] ?? empresa.status}
                </span>
              </div>

              {/* Actions */}
              <div className="sm:col-span-2 flex items-center justify-end gap-1">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-primary">
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-400">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Building2 className="h-12 w-12 text-gray-200 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">
                {dbError
                  ? "Conectá la base de datos para ver las empresas"
                  : searchTerm
                    ? "No se encontraron empresas con ese criterio"
                    : "Aún no hay empresas registradas — creá la primera"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
