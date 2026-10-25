"use client";

import { useState } from "react";
import { Users, Plus, Search, Edit, X } from "lucide-react";
import { validateRuc } from "@intelicont/ledger/fiscal-py";
import type { RetentionProfile } from "@intelicont/ledger/retentions";
import { api } from "@/trpc/client";
import { useAuthStore } from "@/lib/auth-store";
import { useIdempotencyKey, usePartners } from "@/lib/trpc-hooks";
import { cn } from "@/lib/utils";

type Kind = "customer" | "supplier" | "both";
const KIND_LABEL: Record<Kind, string> = { customer: "Cliente", supplier: "Proveedor", both: "Ambos" };
const emptyForm = { kind: "customer" as Kind, ruc: "", legalName: "", tradeName: "", country: "PRY", terms: "30", email: "", phone: "", address: "" };
type Form = typeof emptyForm;
type Partner = NonNullable<ReturnType<typeof usePartners>["data"]>[number];

/** Withholding profile form: IVA rate as a fraction ("0.3"), IRE/IRP rates in percent ("3"); "" = none. */
type RetForm = { ivaRate: "" | "0.3" | "0.7" | "1"; ivaMin: string; ireRate: string; ireMin: string; irpRate: string; irpMin: string };
const pct = (rate?: number) => (rate === undefined ? "" : String(Math.round(rate * 10000) / 100));
function retFormOf(p: RetentionProfile | null | undefined): RetForm {
  return {
    ivaRate: p?.iva ? (String(p.iva.rate) as RetForm["ivaRate"]) : "", ivaMin: p?.iva?.minimum ? String(p.iva.minimum) : "",
    ireRate: pct(p?.ire?.rate), ireMin: p?.ire?.minimum ? String(p.ire.minimum) : "",
    irpRate: pct(p?.irp?.rate), irpMin: p?.irp?.minimum ? String(p.irp.minimum) : "",
  };
}
/** null when no tax is configured; an error message when a value is out of range. */
function profileOf(f: RetForm): RetentionProfile | null | string {
  const min = (v: string) => (v.trim() === "" ? undefined : Number(v));
  const out: RetentionProfile = {};
  const mins = [f.ivaMin, f.ireMin, f.irpMin].map(min);
  if (mins.some((m) => m !== undefined && !(Number.isSafeInteger(m) && m >= 0))) return "El mínimo debe ser un entero no negativo";
  if (f.ivaRate) out.iva = { rate: Number(f.ivaRate) as 0.3 | 0.7 | 1, ...(mins[0] !== undefined && { minimum: mins[0] }) };
  for (const [k, rate, m] of [["ire", f.ireRate, mins[1]], ["irp", f.irpRate, mins[2]]] as const) {
    if (rate.trim() === "") continue;
    const r = Number(rate) / 100;
    if (!(r > 0 && r <= 1)) return `La tasa de ${k.toUpperCase()} debe estar entre 0 y 100 %`;
    out[k] = { rate: r, ...(m !== undefined && { minimum: m }) };
  }
  return Object.keys(out).length > 0 ? out : null;
}

export default function TercerosPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const { data: partners = [], isLoading } = usePartners(entity?.id ?? "");
  const utils = api.useUtils();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"" | Kind>("");
  const [modal, setModal] = useState<{ editing: Partner | null } | null>(null);

  const filtered = partners.filter((p) => {
    const q = search.toLowerCase();
    return (
      (!kindFilter || p.kind === kindFilter) &&
      (p.legalName.toLowerCase().includes(q) || p.rucDisplay.includes(q) || (p.tradeName ?? "").toLowerCase().includes(q))
    );
  });

  if (!entity) {
    return (
      <div className="p-12 text-center">
        <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Seleccioná una empresa para ver sus clientes y proveedores</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-white">Clientes y Proveedores</h1>
          <p className="text-gray-400 text-sm mt-0.5">Terceros de {entity.legalName}</p>
        </div>
        <button onClick={() => setModal({ editing: null })} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo tercero</span>
        </button>
      </div>

      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-gray-800 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              aria-label="Buscar tercero"
              placeholder="Buscar por nombre o RUC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <select
            aria-label="Filtrar por tipo"
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as "" | Kind)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300"
          >
            <option value="">Todos</option>
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
          </select>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-800">
              <th className="p-3 font-medium">Razón social</th>
              <th className="p-3 font-medium">RUC</th>
              <th className="p-3 font-medium">Tipo</th>
              <th className="p-3 font-medium hidden md:table-cell">Contacto</th>
              <th className="p-3 font-medium hidden sm:table-cell">Plazo</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="p-3">
                  <p className="text-white font-medium">{p.legalName}</p>
                  {p.tradeName && <p className="text-gray-500 text-xs">{p.tradeName}</p>}
                </td>
                <td className="p-3 text-gray-300">{p.rucDisplay}</td>
                <td className="p-3">
                  <span className={cn("inline-flex px-2 py-1 rounded-full text-xs font-medium border", p.kind === "customer" ? "bg-green-900/30 text-green-400 border-green-800" : p.kind === "supplier" ? "bg-blue-900/30 text-blue-400 border-blue-800" : "bg-purple-900/30 text-purple-400 border-purple-800")}>
                    {KIND_LABEL[p.kind]}
                  </span>
                </td>
                <td className="p-3 text-gray-400 text-xs hidden md:table-cell">{[p.contacts?.email, p.contacts?.phone].filter(Boolean).join(" · ")}</td>
                <td className="p-3 text-gray-400 hidden sm:table-cell">{p.defaultPaymentTerms} días</td>
                <td className="p-3 text-right">
                  <button aria-label={`Editar ${p.legalName}`} onClick={() => setModal({ editing: p })} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                    <Edit className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No se encontraron terceros</p>
          </div>
        )}
      </div>

      {modal && (
        <PartnerModal
          entityId={entity.id}
          editing={modal.editing}
          onClose={() => setModal(null)}
          onSaved={async () => {
            await utils.partners.list.invalidate();
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function PartnerModal({ entityId, editing, onClose, onSaved }: { entityId: string; editing: Partner | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<Form>(
    editing
      ? { kind: editing.kind, ruc: editing.rucDisplay, legalName: editing.legalName, tradeName: editing.tradeName ?? "", country: editing.country ?? "PRY", terms: String(editing.defaultPaymentTerms ?? 30), email: editing.contacts?.email ?? "", phone: editing.contacts?.phone ?? "", address: editing.contacts?.address ?? "" }
      : emptyForm,
  );
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [taxpayerBadge, setTaxpayerBadge] = useState<{ text: string; color: string; source: string } | null>(null);

  // The modal is one user action: its key lives as long as the modal (closed on success).
  const idem = useIdempotencyKey();
  const trpcUtils = api.useUtils();
  const create = api.partners.create.useMutation({ trpc: idem.trpc, onSuccess: onSaved });
  const update = api.partners.update.useMutation({ trpc: idem.trpc, onSuccess: onSaved });
  const mutation = editing ? update : create;
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const rucError = !editing && form.ruc && form.country === "PRY" ? validateRuc(form.ruc).errors[0] : undefined;
  const contacts = { email: form.email, phone: form.phone, address: form.address };
  const [ret, setRetState] = useState<RetForm>(() => retFormOf(editing?.retentionProfile));
  // Only an edited profile is sent: an untouched stored profile is never overwritten.
  const [retDirty, setRetDirty] = useState(false);
  const setRet = (r: RetForm) => {
    setRetState(r);
    setRetDirty(true);
  };
  const profile = profileOf(ret);
  const profileError = retDirty && typeof profile === "string" ? profile : undefined;

  const handleLookup = async (docToSearch?: string) => {
    const doc = (docToSearch ?? form.ruc).trim();
    if (!doc || doc.length < 4 || form.country !== "PRY") return;
    setIsLookingUp(true);
    try {
      const res = await trpcUtils.client.fiscal.lookupTaxpayer.query({ document: doc });
      if (res && res.legalName) {
        setForm((f) => ({
          ...f,
          legalName: res.legalName,
          tradeName: f.tradeName || (res.source === "dnit_oficial" ? res.legalName : f.tradeName),
          ruc: res.ruc,
          ...(res.city ? { address: f.address || (res.department ? `${res.city}, ${res.department}` : res.city) } : {}),
        }));
        if (res.source === "dnit_oficial") {
          const isActivo = res.status === "ACTIVO";
          setTaxpayerBadge({
            text: `DNIT Oficial: ${res.status}`,
            color: isActivo ? "text-emerald-400 bg-emerald-950/60 border-emerald-800" : "text-amber-400 bg-amber-950/60 border-amber-800",
            source: "dnit",
          });
        } else if (res.source === "padron_nacional") {
          setTaxpayerBadge({
            text: `Padrón Nacional: C.I. Verificada (DV: ${res.dv})`,
            color: "text-blue-400 bg-blue-950/60 border-blue-800",
            source: "padron",
          });
        }
      } else {
        setTaxpayerBadge({
          text: "Sin registro en DNIT / Padrón",
          color: "text-gray-400 bg-gray-800 border-gray-700",
          source: "none",
        });
      }
    } catch (e) {
      console.warn("Lookup error:", e);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      const formEl = e.currentTarget;
      formEl.requestSubmit();
      return;
    }
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      const target = e.target as HTMLInputElement;
      if (target.name === "ruc" && !editing) {
        handleLookup(target.value);
      }
      e.preventDefault();
      const inputs = Array.from(e.currentTarget.querySelectorAll("input:not([disabled]), select:not([disabled])")) as HTMLElement[];
      const currentIndex = inputs.indexOf(target);
      if (currentIndex > -1 && currentIndex + 1 < inputs.length) {
        inputs[currentIndex + 1].focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-label={editing ? "Editar tercero" : "Nuevo tercero"} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 rounded-xl p-4 lg:p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-white">{editing ? "Editar tercero" : "Nuevo tercero"}</h2>
            <span className="text-[11px] text-gray-500 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700/60">
              DNIT 2.02M + Padrón 5.06M
            </span>
          </div>
          <button aria-label="Cerrar" onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onKeyDown={handleFormKeyDown}
          onSubmit={(e) => {
            e.preventDefault();
            const terms = Number(form.terms);
            if (editing) {
              if (retDirty && typeof profile === "string") return;
              update.mutate({
                id: editing.id, kind: form.kind, legalName: form.legalName, tradeName: form.tradeName, defaultPaymentTerms: terms, contacts,
                ...(retDirty && typeof profile !== "string" && { retentionProfile: profile }),
              });
            } else {
              create.mutate({ entityId, kind: form.kind, ruc: form.ruc, legalName: form.legalName, tradeName: form.tradeName, country: form.country, defaultPaymentTerms: terms, contacts });
            }
          }}
        >
          <label className="block text-sm font-medium text-gray-300">
            Tipo
            <select value={form.kind} onChange={(e) => set({ kind: e.target.value as Kind })} className={inputCls}>
              {(Object.keys(KIND_LABEL) as Kind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </label>
          <Field label="País (ISO-3)" value={form.country} disabled={!!editing} onChange={(v) => set({ country: v.toUpperCase().slice(0, 3) })} />
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-300">
                RUC o Cédula <span className="text-red-400">*</span>
              </label>
              {isLookingUp && <span className="text-xs text-blue-400 animate-pulse">Consultando DNIT...</span>}
            </div>
            <div className="relative mt-1">
              <input
                name="ruc"
                type="text"
                placeholder="80000000-0 o C.I."
                required
                disabled={!!editing}
                value={form.ruc}
                autoFocus={!editing}
                onChange={(e) => set({ ruc: e.target.value })}
                onBlur={() => handleLookup()}
                className={inputCls}
              />
              {!editing && (
                <button
                  type="button"
                  onClick={() => handleLookup()}
                  disabled={isLookingUp}
                  className="absolute right-1.5 top-1.5 px-2 py-1 text-[11px] font-medium bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded border border-blue-500/30 transition-colors"
                >
                  Verificar
                </button>
              )}
            </div>
            {taxpayerBadge && (
              <div className="mt-1.5">
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border font-medium", taxpayerBadge.color)}>
                  {taxpayerBadge.text}
                </span>
              </div>
            )}
            {rucError && <p role="alert" className="mt-1 text-xs text-red-400">{rucError}</p>}
          </div>
          <Field label="Razón social (o Nombre completo)" required value={form.legalName} onChange={(v) => set({ legalName: v })} />
          <Field label="Nombre comercial / Fantasía" value={form.tradeName} onChange={(v) => set({ tradeName: v })} />
          <Field label="Plazo de pago (días)" type="number" value={form.terms} onChange={(v) => set({ terms: v })} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => set({ email: v })} />
          <Field label="Teléfono" value={form.phone} onChange={(v) => set({ phone: v })} />
          <div className="md:col-span-2"><Field label="Dirección / Ciudad" value={form.address} onChange={(v) => set({ address: v })} /></div>
          {editing && (
            <fieldset className="md:col-span-2 border border-gray-800 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <legend className="px-1 text-sm font-medium text-gray-300">Perfil de retención</legend>
              <p className="md:col-span-2 text-xs text-gray-500">Sin perfil no se calcula ninguna retención. El mínimo es el total del comprobante desde el que se retiene.</p>
              <label className="block text-sm font-medium text-gray-300">
                Retención de IVA
                <select aria-label="Retención de IVA" value={ret.ivaRate} onChange={(e) => setRet({ ...ret, ivaRate: e.target.value as RetForm["ivaRate"] })} className={inputCls}>
                  <option value="">No retiene</option>
                  <option value="0.3">30 %</option>
                  <option value="0.7">70 %</option>
                  <option value="1">100 %</option>
                </select>
              </label>
              <Field label="Mínimo IVA (Gs.)" type="number" value={ret.ivaMin} disabled={!ret.ivaRate} onChange={(v) => setRet({ ...ret, ivaMin: v })} />
              <Field label="Tasa IRE (%)" type="number" placeholder="no retiene" value={ret.ireRate} onChange={(v) => setRet({ ...ret, ireRate: v })} />
              <Field label="Mínimo IRE (Gs.)" type="number" value={ret.ireMin} onChange={(v) => setRet({ ...ret, ireMin: v })} />
              <Field label="Tasa IRP (%)" type="number" placeholder="no retiene" value={ret.irpRate} onChange={(v) => setRet({ ...ret, irpRate: v })} />
              <Field label="Mínimo IRP (Gs.)" type="number" value={ret.irpMin} onChange={(v) => setRet({ ...ret, irpMin: v })} />
              <p className="md:col-span-2 text-xs text-yellow-500">Tasas de IRE/IRP no verificadas: se aplica la tasa que configures.</p>
              {profileError && <p role="alert" className="md:col-span-2 text-xs text-red-400">{profileError}</p>}
            </fieldset>
          )}
          {mutation.error && <p role="alert" className="md:col-span-2 text-sm text-red-400">{mutation.error.message}</p>}
          <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-800">
            <span className="text-[11px] text-gray-500 hidden sm:inline">
              ⌨️ <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Enter</kbd> siguiente campo · <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Ctrl+Enter</kbd> guardar
            </span>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm border border-gray-700">Cancelar</button>
              <button type="submit" disabled={mutation.isPending || !!rucError || (!!editing && !!profileError)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
                {editing ? "Guardar cambios" : "Crear tercero"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = "mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50";

function Field({ label, placeholder, type = "text", required = false, disabled = false, autoFocus = false, value, onChange }: { label: string; placeholder?: string; type?: string; required?: boolean; disabled?: boolean; autoFocus?: boolean; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm font-medium text-gray-300">
      {label} {required && <span className="text-red-400">*</span>}
      <input type={type} placeholder={placeholder} required={required} disabled={disabled} autoFocus={autoFocus} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  );
}
