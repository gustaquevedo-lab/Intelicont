"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { skipToken } from "@tanstack/react-query";
import { CheckCircle2, FilePlus, Loader2 } from "lucide-react";
import { validateRuc } from "@intelicont/ledger/fiscal-py";
import { isSupportedInRegistro, TABLA_4 } from "@intelicont/ledger/registro-codes";
import { useAuthStore } from "@/lib/auth-store";
import { useIdempotencyKey, usePartners } from "@/lib/trpc-hooks";
import { api } from "@/trpc/client";
import { cn } from "@/lib/utils";

type Direction = "received" | "issued";
type Form = {
  direction: Direction;
  docCode: number;
  partyMode: "existing" | "new";
  partnerId: string;
  ruc: string;
  legalName: string;
  timbrado: string;
  number: string;
  issueDate: string;
  condition: "cash" | "credit";
  gravado10: string;
  gravado5: string;
  exento: string;
  total: string;
  imputaIva: boolean;
  imputaIre: boolean;
  imputaIrp: boolean;
  noImputa: boolean;
  foreignCurrency: boolean;
  relatedNumber: string;
  relatedTimbrado: string;
  expenseAccountId: string;
  concept: string;
};

/** Registro reports only the total for these codes; the IVA split stays optional for the accounting. */
const TOTAL_ONLY = new Set([101, 104, 105, 112]);
/** Registro exceptions not representable yet (no number / timbrado 0). */
const BLOCKED = new Set([106, 107, 112]);
const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD, local time
const emptyForm = (): Form => ({
  direction: "received", docCode: 109, partyMode: "existing", partnerId: "", ruc: "", legalName: "",
  timbrado: "", number: "", issueDate: today(), condition: "credit",
  gravado10: "", gravado5: "", exento: "", total: "",
  imputaIva: true, imputaIre: false, imputaIrp: false, noImputa: false, foreignCurrency: false,
  relatedNumber: "", relatedTimbrado: "", expenseAccountId: "", concept: "",
});

const gs = (n: number) => `₲ ${n.toLocaleString("es-PY")}`;
const digits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const amount = (v: string) => Number(v || "0");
/** 0010010000123 -> 001-001-0000123 while typing. */
function maskNumber(v: string) {
  const d = digits(v, 13);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6)].filter(Boolean).join("-");
}

/** Debounced copy of a value (the preview query follows the form with a short delay). */
function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export default function ManualDocumentPage() {
  const entity = useAuthStore((s) => s.selectedEntity);
  const entityId = entity?.id ?? "";
  const { data: partners = [] } = usePartners(entityId);
  const accountsQuery = api.accounts.list.useQuery({ entityId }, { enabled: !!entityId });
  const expenseAccounts = (accountsQuery.data ?? []).filter((a) => a.allowsPosting && a.nature === "expense");
  const [form, setForm] = useState<Form>(emptyForm);
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const [saved, setSaved] = useState<{ documentId: string; entryId: string; warnings: string[] } | null>(null);
  const [taxpayerBadge, setTaxpayerBadge] = useState<{ text: string; color: string } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const trpcUtils = api.useUtils();

  const handleLookupTaxpayer = async (rawDoc?: string) => {
    const doc = (rawDoc ?? form.ruc).trim();
    if (!doc || doc.length < 4) return;
    setIsLookingUp(true);
    try {
      const res = await trpcUtils.client.fiscal.lookupTaxpayer.query({ document: doc });
      if (res && res.legalName) {
        set({ legalName: res.legalName, ruc: res.ruc });
        if (res.source === "dnit_oficial") {
          const isActivo = res.status === "ACTIVO";
          setTaxpayerBadge({
            text: `DNIT Oficial: ${res.status}`,
            color: isActivo ? "text-emerald-400 bg-emerald-950/60 border-emerald-800" : "text-amber-400 bg-amber-950/60 border-amber-800",
          });
        } else if (res.source === "padron_nacional") {
          setTaxpayerBadge({
            text: `Padrón Nacional: C.I. Verificada (DV: ${res.dv})`,
            color: "text-blue-400 bg-blue-950/60 border-blue-800",
          });
        }
      } else {
        setTaxpayerBadge({
          text: "Sin registro en DNIT / Padrón",
          color: "text-gray-400 bg-gray-800 border-gray-700",
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
      e.currentTarget.requestSubmit();
      return;
    }
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      const target = e.target as HTMLInputElement;
      if (target.placeholder?.includes("80000000")) {
        handleLookupTaxpayer(target.value);
      }
      e.preventDefault();
      const inputs = Array.from(e.currentTarget.querySelectorAll("input:not([disabled]), select:not([disabled])")) as HTMLElement[];
      const currentIndex = inputs.indexOf(target);
      if (currentIndex > -1 && currentIndex + 1 < inputs.length) {
        inputs[currentIndex + 1].focus();
      }
    }
  };

  // One Idempotency-Key per form lifetime, renewed after success (Task 12 pattern).
  const idem = useIdempotencyKey();
  const create = api["tax-documents"].createManual.useMutation({
    trpc: idem.trpc,
    onSuccess: (r) => {
      setSaved(r);
      idem.renew();
    },
  });

  const side = form.direction === "received" ? "compras" : "ventas";
  const codes = Object.keys(TABLA_4).map(Number).filter((c) => isSupportedInRegistro(c, side));
  const totalOnly = TOTAL_ONLY.has(form.docCode);
  const isNote = form.docCode === 110 || form.docCode === 111;
  const split = amount(form.gravado10) + amount(form.gravado5) + amount(form.exento);
  const withoutSplit = totalOnly && split === 0;
  const total = withoutSplit ? amount(form.total) : split;
  const rucError = form.partyMode === "new" && form.ruc ? validateRuc(form.ruc).errors[0] : undefined;
  const selected = partners.find((p) => p.id === form.partnerId);
  const parties = partners.filter((p) => p.kind === "both" || p.kind === (form.direction === "received" ? "supplier" : "customer"));

  const input = useMemo(() => {
    const party = form.partyMode === "existing"
      ? (form.partnerId ? { partnerId: form.partnerId } : null)
      : (form.ruc && form.legalName.trim() && !rucError ? { partner: { ruc: form.ruc.trim(), legalName: form.legalName.trim() } } : null);
    if (!entityId || !party || form.timbrado.length !== 8 || form.number.length !== 15 || !form.issueDate || total <= 0) return null;
    return {
      entityId,
      direction: form.direction,
      docCode: form.docCode,
      ...party,
      timbrado: form.timbrado,
      number: form.number,
      issueDate: form.issueDate,
      condition: form.condition,
      gravado10: amount(form.gravado10),
      gravado5: amount(form.gravado5),
      exento: amount(form.exento),
      total,
      imputaIva: form.imputaIva,
      imputaIre: form.imputaIre,
      imputaIrp: form.imputaIrp,
      ...(form.direction === "received" && form.noImputa && { noImputa: true }),
      ...(form.foreignCurrency && { foreignCurrency: true }),
      ...(isNote && { relatedNumber: form.relatedNumber || undefined, relatedTimbrado: form.relatedTimbrado || undefined }),
      ...(form.direction === "received" && form.expenseAccountId && { expenseAccountId: form.expenseAccountId }),
      ...(form.concept.trim() && { concept: form.concept.trim() }),
    };
  }, [entityId, form, total, isNote, rucError]);

  const debounced = useDebounced(input, 400);
  const preview = api["tax-documents"].previewManual.useQuery(saved || !debounced ? skipToken : debounced, { retry: false });

  if (!entity) {
    return (
      <div className="p-12 text-center">
        <FilePlus className="h-12 w-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Seleccioná una empresa para cargar comprobantes</p>
      </div>
    );
  }

  const reset = () => {
    setForm(emptyForm());
    setSaved(null);
    create.reset();
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold text-white">Comprobante manual</h1>
        <p className="text-gray-400 text-sm mt-0.5">Comprobante no electrónico de {entity.legalName}, con retenciones y asiento</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form
          aria-label="Comprobante manual"
          onKeyDown={handleFormKeyDown}
          className="lg:col-span-3 bg-gray-900/50 border border-gray-800 rounded-xl p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (input && !saved) create.mutate(input);
          }}
        >
          <div className="md:col-span-2 flex gap-2" role="group" aria-label="Operación">
            {(["received", "issued"] as const).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={form.direction === d}
                onClick={() => set({ direction: d, partnerId: "", docCode: 109, noImputa: false, expenseAccountId: "" })}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium border", form.direction === d ? "bg-blue-600 border-blue-500 text-white" : "bg-gray-800 border-gray-700 text-gray-300")}
              >
                {d === "received" ? "Compras" : "Ventas"}
              </button>
            ))}
          </div>

          <label className={labelCls}>
            Tipo de comprobante
            <select value={form.docCode} onChange={(e) => set({ docCode: Number(e.target.value) })} className={inputCls}>
              {codes.map((c) => (
                <option key={c} value={c} disabled={BLOCKED.has(c)}>
                  {c} — {TABLA_4[c].name}{BLOCKED.has(c) ? " (todavía no se puede cargar manualmente)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            Condición
            <select value={form.condition} onChange={(e) => set({ condition: e.target.value as Form["condition"] })} className={inputCls}>
              <option value="credit">Crédito</option>
              <option value="cash">Contado</option>
            </select>
          </label>

          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="font-medium">{form.direction === "received" ? "Proveedor" : "Cliente"}</span>
              <label className="flex items-center gap-1.5"><input type="radio" checked={form.partyMode === "existing"} onChange={() => set({ partyMode: "existing" })} /> Existente</label>
              <label className="flex items-center gap-1.5"><input type="radio" checked={form.partyMode === "new"} onChange={() => set({ partyMode: "new" })} /> Nuevo (RUC / C.I.)</label>
            </div>
            {form.partyMode === "existing" ? (
              <>
                <select aria-label="Tercero" value={form.partnerId} onChange={(e) => set({ partnerId: e.target.value })} className={inputCls}>
                  <option value="">Elegí un tercero…</option>
                  {parties.map((p) => <option key={p.id} value={p.id}>{p.legalName} ({p.rucDisplay})</option>)}
                </select>
                {selected && form.direction === "received" && (
                  <p className="text-xs text-gray-500">{selected.retentionProfile ? "Tiene perfil de retención configurado." : "Sin perfil de retención: no se retiene."}</p>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>RUC o C.I.</span>
                    {isLookingUp && <span className="text-[11px] text-blue-400 animate-pulse">Consultando DNIT...</span>}
                  </div>
                  <div className="relative mt-1">
                    <input
                      placeholder="80000000-0 o C.I."
                      value={form.ruc}
                      onChange={(e) => set({ ruc: e.target.value.trim() })}
                      onBlur={() => handleLookupTaxpayer()}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => handleLookupTaxpayer()}
                      disabled={isLookingUp}
                      className="absolute right-1.5 top-1.5 px-2 py-1 text-[11px] font-medium bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded border border-blue-500/30"
                    >
                      Buscar
                    </button>
                  </div>
                  {taxpayerBadge && (
                    <div className="mt-1">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border font-medium", taxpayerBadge.color)}>
                        {taxpayerBadge.text}
                      </span>
                    </div>
                  )}
                  {rucError && <p role="alert" className="mt-1 text-xs text-red-400">{rucError}</p>}
                </div>
                <Field label="Razón social / Nombre" value={form.legalName} onChange={(v) => set({ legalName: v })} />
              </div>
            )}
          </div>

          <div>
            <Field label="Timbrado" placeholder="12345678" value={form.timbrado} onChange={(v) => set({ timbrado: digits(v, 8) })} />
            {form.timbrado.length > 0 && form.timbrado.length < 8 && (
              <p className="mt-1 text-[11px] text-amber-400">⚠️ Requiere 8 dígitos numéricos ({form.timbrado.length}/8)</p>
            )}
            {form.timbrado.length === 8 && (
              <p className="mt-1 text-[11px] text-emerald-400">✅ Estructura válida (8 dígitos DNIT)</p>
            )}
          </div>
          <Field label="Número" placeholder="001-001-0000001" value={form.number} onChange={(v) => set({ number: maskNumber(v) })} />
          <Field label="Fecha" type="date" value={form.issueDate} onChange={(v) => set({ issueDate: v })} />
          <div />

          {isNote && (
            <>
              <Field label="Comprobante asociado" placeholder="001-001-0000001" value={form.relatedNumber} onChange={(v) => set({ relatedNumber: maskNumber(v) })} />
              <Field label="Timbrado asociado" placeholder="12345678" value={form.relatedTimbrado} onChange={(v) => set({ relatedTimbrado: digits(v, 8) })} />
            </>
          )}

          <MoneyField label="Gravado 10 % (IVA incluido)" value={form.gravado10} onChange={(v) => set({ gravado10: v })} />
          <MoneyField label="Gravado 5 % (IVA incluido)" value={form.gravado5} onChange={(v) => set({ gravado5: v })} />
          <MoneyField label="Exento" value={form.exento} onChange={(v) => set({ exento: v })} />
          {withoutSplit ? (
            <MoneyField label="Total" value={form.total} onChange={(v) => set({ total: v })} />
          ) : (
            <div className={labelCls}>
              Total
              <p aria-label="Total" className="mt-1 px-3 py-2 bg-gray-800/50 border border-gray-800 rounded-lg text-sm text-white">{gs(total)}</p>
            </div>
          )}
          {totalOnly && (
            <p className="md:col-span-2 -mt-2 text-xs text-gray-500">
              Este tipo se informa en el Registro solo por el total. Si cargás gravado/exento se discrimina el IVA; si los dejás en cero, ingresá el total y se contabiliza sin IVA.
            </p>
          )}

          <fieldset className="md:col-span-2 flex flex-wrap gap-4 text-sm text-gray-300">
            <legend className="mb-1 font-medium">Imputa a</legend>
            {([["imputaIva", "IVA"], ["imputaIre", "IRE"], ["imputaIrp", "IRP-RSP"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-1.5">
                <input type="checkbox" checked={form[k]} disabled={form.noImputa} onChange={(e) => set({ [k]: e.target.checked })} /> {l}
              </label>
            ))}
            {form.direction === "received" && (
              <label className="flex items-center gap-1.5">
                <input type="checkbox" checked={form.noImputa} onChange={(e) => set({ noImputa: e.target.checked, ...(e.target.checked && { imputaIva: false, imputaIre: false, imputaIrp: false }) })} /> No imputa
              </label>
            )}
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={form.foreignCurrency} onChange={(e) => set({ foreignCurrency: e.target.checked })} /> Moneda extranjera
            </label>
          </fieldset>

          {form.direction === "received" && (
            <label className={labelCls}>
              Cuenta de gasto
              <select value={form.expenseAccountId} onChange={(e) => set({ expenseAccountId: e.target.value })} className={inputCls}>
                <option value="">Automática (según reglas)</option>
                {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
              </select>
            </label>
          )}
          <Field label="Concepto" value={form.concept} onChange={(v) => set({ concept: v })} />

          {create.error && <p role="alert" className="md:col-span-2 text-sm text-red-400">{create.error.message}</p>}
          {saved ? (
            <div role="status" className="md:col-span-2 flex flex-wrap items-center gap-3 p-3 rounded-lg bg-green-900/20 border border-green-800 text-sm text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Comprobante guardado y asiento contabilizado</span>
              {saved.warnings.map((w) => <span key={w} className="text-yellow-500">{w}</span>)}
              <Link href="/asientos" className="underline">Ver asientos</Link>
              <button type="button" onClick={reset} className="underline">Cargar otro</button>
            </div>
          ) : null}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={!input || create.isPending || !!saved}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar y contabilizar
            </button>
          </div>
        </form>

        <section aria-label="Vista previa" className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-xl p-4 lg:p-6 space-y-4 h-fit">
          <h2 className="text-sm font-medium text-white">Vista previa</h2>
          {!debounced ? (
            <p className="text-sm text-gray-500">Completá tercero, timbrado, número, fecha y montos para ver la vista previa.</p>
          ) : preview.error ? (
            <p role="alert" className="text-sm text-red-400">{preview.error.message}</p>
          ) : !preview.data ? (
            <p className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Calculando…</p>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-gray-400">IVA 10 %</dt><dd className="text-right text-white">{gs(preview.data.iva10)}</dd>
                <dt className="text-gray-400">IVA 5 %</dt><dd className="text-right text-white">{gs(preview.data.iva5)}</dd>
              </dl>
              <div>
                <h3 className="text-xs font-medium text-gray-400 mb-1">Retenciones</h3>
                {preview.data.retentions.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin retenciones</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {preview.data.retentions.map((r) => (
                      <li key={r.type} className="flex justify-between gap-2">
                        <span className="text-gray-300">
                          {r.concept} {Math.round(r.rate * 10000) / 100} % sobre {gs(r.base)}
                          {r.unverified && <span className="block text-xs text-yellow-500">tasa configurada por el usuario</span>}
                        </span>
                        <span className="text-white">{gs(r.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-y-1 text-sm border-t border-gray-800 pt-2">
                <dt className="text-gray-400">Total retenido</dt><dd className="text-right text-white">{gs(preview.data.totalRetentions)}</dd>
                <dt className="text-gray-400">{form.direction === "received" ? "Neto a pagar" : "Neto a cobrar"}</dt>
                <dd aria-label="Neto" className="text-right text-white font-medium">{gs(preview.data.netPayable)}</dd>
              </dl>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-800">
                    <th className="py-1 font-medium">Cuenta</th>
                    <th className="py-1 font-medium text-right">Debe</th>
                    <th className="py-1 font-medium text-right">Haber</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {preview.data.lines.map((l, i) => (
                    <tr key={i}>
                      <td className="py-1 text-gray-300">{l.accountCode} {l.accountName ?? <span className="text-red-400">(falta la cuenta)</span>}</td>
                      <td className="py-1 text-right text-white">{l.debit ? gs(l.debit) : ""}</td>
                      <td className="py-1 text-right text-white">{l.credit ? gs(l.credit) : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.data.notes.map((n) => <p key={n} className="text-xs text-red-400">{n}</p>)}
              {preview.data.warnings.map((w) => <p key={w} className="text-xs text-yellow-500">{w}</p>)}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const labelCls = "block text-sm font-medium text-gray-300";
const inputCls = "mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50";

function Field({ label, placeholder, type = "text", value, onChange }: { label: string; placeholder?: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className={labelCls}>
      {label}
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </label>
  );
}

/** Integer guaraníes: keeps digits only, shows thousands separators. */
function MoneyField({ label, value, onChange }: { label: string; value: string; onChange: (digits: string) => void }) {
  return (
    <label className={labelCls}>
      {label}
      <input
        inputMode="numeric"
        placeholder="0"
        value={value ? Number(value).toLocaleString("es-PY") : ""}
        onChange={(e) => onChange(digits(e.target.value, 15))}
        className={inputCls}
      />
    </label>
  );
}
