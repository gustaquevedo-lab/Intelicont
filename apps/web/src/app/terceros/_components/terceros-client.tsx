"use client";

import { useState, useTransition, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Search, X, Edit, Loader2,
  CheckCircle2, AlertCircle, ChevronDown,
  Mail, Phone, MapPin, MoreHorizontal, PowerOff, Power,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { validateRUC } from "@/lib/ruc";
import type { TerceroRow } from "../actions";
import { createTercero, updateTercero, toggleTerceroActive } from "../actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const KIND_LABEL: Record<string, string> = {
  cliente:   "Cliente",
  proveedor: "Proveedor",
  ambos:     "Cliente/Proveedor",
};

const KIND_BADGE: Record<string, string> = {
  cliente:   "bg-blue-50 text-blue-700 border-blue-200",
  proveedor: "bg-violet-50 text-violet-700 border-violet-200",
  ambos:     "bg-teal-50 text-teal-700 border-teal-200",
};

const AVATAR_COLORS = [
  "from-blue-500 to-blue-700", "from-violet-500 to-violet-700",
  "from-teal-500 to-cyan-600", "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600", "from-indigo-500 to-indigo-700",
];

function getAvatarColor(name: string) {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface FormProps {
  initial?:  TerceroRow;
  entities:  Array<{ id: string; legalName: string }>;
  onClose:   () => void;
  onSuccess: (t: TerceroRow) => void;
}

function TerceroForm({ initial, entities, onClose, onSuccess }: FormProps) {
  const formRef                      = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError]    = useState<string | null>(null);
  const [rucError,  setRucError]     = useState<string | null>(null);
  const [success,   setSuccess]      = useState(false);

  const isEdit = Boolean(initial);

  function handleRucChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (v.length < 3) { setRucError(null); return; }
    const r = validateRUC(v);
    setRucError(r.valid ? null : (r.error ?? null));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setFormError(null);

    startTransition(async () => {
      const result = isEdit
        ? await updateTercero(initial!.id, formData)
        : await createTercero(formData);

      if (!result.ok) {
        setFormError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSuccess({ ...result.data, entityName: initial?.entityName ?? entities.find((e) => e.id === result.data.entityId)?.legalName ?? "" } as TerceroRow);
          onClose();
        }, 500);
      }
    });
  }

  return (
    <div className="card p-5 lg:p-6 animate-in">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-gray-900 dark:text-white text-base">
          {isEdit ? "Editar Tercero" : "Nuevo Tercero"}
        </h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Empresa */}
        {!isEdit && (
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Empresa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select name="entityId" required defaultValue="" className="appearance-none input-field pr-8">
                <option value="" disabled>Seleccioná la empresa</option>
                {entities.map((e) => <option key={e.id} value={e.id}>{e.legalName}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Nombre */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
            Nombre / Razón Social <span className="text-red-500">*</span>
          </label>
          <input name="name" type="text" defaultValue={initial?.name ?? ""} placeholder="Empresa o persona" required className="input-field" />
        </div>

        {/* RUC */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">RUC</label>
          <input
            name="ruc" type="text" defaultValue={initial?.ruc ?? ""}
            placeholder="80144114-5 (opcional)"
            onChange={handleRucChange}
            className={cn("input-field", rucError && "border-red-400 focus:ring-red-400")}
          />
          {rucError && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {rucError}</p>}
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Tipo</label>
          <div className="relative">
            <select name="kind" defaultValue={initial?.kind ?? "ambos"} className="appearance-none input-field pr-8">
              <option value="cliente">Cliente</option>
              <option value="proveedor">Proveedor</option>
              <option value="ambos">Cliente / Proveedor</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Email</label>
          <input name="email" type="email" defaultValue={initial?.email ?? ""} placeholder="contacto@empresa.com.py" className="input-field" />
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Teléfono</label>
          <input name="phone" type="text" defaultValue={initial?.phone ?? ""} placeholder="0981-000000" className="input-field" />
        </div>

        {/* Dirección */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Dirección</label>
          <input name="address" type="text" defaultValue={initial?.address ?? ""} placeholder="Calle, número, ciudad" className="input-field" />
        </div>

        {/* Notas */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Notas</label>
          <textarea name="notes" rows={2} defaultValue={initial?.notes ?? ""} placeholder="Condiciones de pago, observaciones..." className="input-field resize-none" />
        </div>

        {/* Feedback */}
        {formError && (
          <div className="md:col-span-2 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{formError}</p>
          </div>
        )}
        {success && (
          <div className="md:col-span-2 flex items-center gap-2 p-3 rounded-xl bg-secondary-50 border border-secondary-200">
            <CheckCircle2 className="h-4 w-4 text-secondary" />
            <p className="text-secondary-dark text-sm font-medium">{isEdit ? "Tercero actualizado" : "Tercero creado"}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <button type="button" onClick={onClose} className="btn-ghost" disabled={isPending}>Cancelar</button>
          <button type="submit" className="btn-secondary" disabled={isPending || !!rucError}>
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
              : isEdit ? <><Edit className="h-4 w-4" /> Guardar</> : <><Plus className="h-4 w-4" /> Crear</>}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialData: TerceroRow[];
  entities:    Array<{ id: string; legalName: string }>;
  dbError?:    string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TercerosClient({ initialData, entities, dbError }: Props) {
  const router = useRouter();

  const [data,        setData]        = useState<TerceroRow[]>(initialData);
  const [showCreate,  setShowCreate]  = useState(false);
  const [editTarget,  setEditTarget]  = useState<TerceroRow | null>(null);
  const [searchTerm,  setSearchTerm]  = useState("");
  const [filterKind,  setFilterKind]  = useState("todos");
  const [filterEntity,setFilterEntity]= useState("todos");
  const [menuOpenId,  setMenuOpenId]  = useState<string | null>(null);
  const [, startTransition]           = useTransition();

  const filtered = data.filter((t) => {
    const q   = searchTerm.toLowerCase();
    const mQ  = !q || t.name.toLowerCase().includes(q) || (t.ruc ?? "").includes(q) || (t.email ?? "").toLowerCase().includes(q);
    const mK  = filterKind   === "todos" || t.kind   === filterKind;
    const mE  = filterEntity === "todos" || t.entityId === filterEntity;
    return mQ && mK && mE;
  });

  const stats = [
    { label: "Total",       value: data.length,                                          color: "text-primary"    },
    { label: "Clientes",    value: data.filter((t) => t.kind === "cliente"  || t.kind === "ambos").length, color: "text-blue-600"   },
    { label: "Proveedores", value: data.filter((t) => t.kind === "proveedor"|| t.kind === "ambos").length, color: "text-violet-600" },
  ];

  function handleSaved(tercero: TerceroRow) {
    setData((prev) => {
      const exists = prev.find((t) => t.id === tercero.id);
      if (exists) return prev.map((t) => t.id === tercero.id ? tercero : t);
      return [tercero, ...prev];
    });
    router.refresh();
  }

  function handleToggleActive(t: TerceroRow) {
    setMenuOpenId(null);
    startTransition(async () => {
      const result = await toggleTerceroActive(t.id, !t.isActive);
      if (result.ok) {
        setData((prev) => prev.map((x) => x.id === t.id ? { ...x, isActive: !t.isActive } : x));
        router.refresh();
      }
    });
  }

  return (
    <div className="page-container" onClick={() => setMenuOpenId(null)}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title text-2xl lg:text-3xl">Terceros</h1>
          <p className="section-subtitle">Clientes y proveedores del estudio</p>
        </div>
        <button onClick={() => { setShowCreate(true); setEditTarget(null); }} className="btn-secondary text-sm">
          <Plus className="h-4 w-4" /> Nuevo Tercero
        </button>
      </div>

      {/* DB Error */}
      {dbError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">{dbError}</p>
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
        <TerceroForm entities={entities} onClose={() => setShowCreate(false)} onSuccess={handleSaved} />
      )}

      {/* Edit form */}
      {editTarget && (
        <TerceroForm initial={editTarget} entities={entities} onClose={() => setEditTarget(null)} onSuccess={handleSaved} />
      )}

      {/* List */}
      <div className="card-flat overflow-hidden">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 p-4 border-b border-gray-100 dark:border-slate-700 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" placeholder="Buscar por nombre, RUC o email..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 py-2"
            />
          </div>

          {/* Kind filter */}
          <div className="flex gap-1.5">
            {[["todos","Todos"],["cliente","Clientes"],["proveedor","Proveedores"],["ambos","Ambos"]].map(([k,l]) => (
              <button key={k} onClick={() => setFilterKind(k)}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap",
                  filterKind === k ? "bg-primary text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                )}>{l}</button>
            ))}
          </div>

          {/* Entity filter */}
          {entities.length > 1 && (
            <div className="relative">
              <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}
                className="appearance-none input-field py-2 pr-8 text-xs cursor-pointer">
                <option value="todos">Todas las empresas</option>
                {entities.map((e) => <option key={e.id} value={e.id}>{e.legalName}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {filtered.map((t) => (
            <div key={t.id} className={cn("flex flex-col sm:flex-row sm:items-center justify-between p-4 table-row-hover gap-3", !t.isActive && "opacity-60")}>
              {/* Left */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold shadow-sm bg-gradient-to-br", getAvatarColor(t.name))}>
                  {getInitials(t.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-900 dark:text-white text-sm font-bold truncate">{t.name}</span>
                    <span className={cn("inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold border", KIND_BADGE[t.kind ?? "ambos"])}>
                      {KIND_LABEL[t.kind ?? "ambos"]}
                    </span>
                    {!t.isActive && <span className="badge-gray text-xs">Inactivo</span>}
                  </div>

                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {t.ruc && <span className="text-xs text-gray-500 font-mono">RUC {t.ruc}</span>}
                    {t.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="h-3 w-3" /> {t.email}
                      </span>
                    )}
                    {t.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone className="h-3 w-3" /> {t.phone}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-0.5">{t.entityName}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 pl-13 sm:pl-0" onClick={(ev) => ev.stopPropagation()}>
                <button onClick={() => { setEditTarget(t); setShowCreate(false); }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-primary transition-colors">
                  <Edit className="h-3.5 w-3.5" />
                </button>

                <div className="relative">
                  <button onClick={() => setMenuOpenId(menuOpenId === t.id ? null : t.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-400 transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                  {menuOpenId === t.id && (
                    <div className="absolute right-0 top-8 z-20 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 text-sm">
                      <button onClick={() => handleToggleActive(t)}
                        className={cn("flex items-center gap-2.5 w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 text-left font-medium",
                          t.isActive ? "text-amber-600" : "text-secondary")}>
                        {t.isActive ? <><PowerOff className="h-3.5 w-3.5" /> Desactivar</> : <><Power className="h-3.5 w-3.5" /> Activar</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-medium">
                {data.length === 0 ? "Todavía no hay terceros — creá el primero" : "Sin resultados para ese filtro"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
