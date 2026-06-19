"use client";

import { useState, useEffect, useMemo } from "react";
import { X, AlertTriangle, CheckCircle2, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartAccount, AccountNature } from "@/lib/chart-of-accounts";
import { getNatureLabel, getNatureBg, getNatureColor, findAccountByCode, flattenTree } from "@/lib/chart-of-accounts";

interface AccountModalProps {
  open: boolean;
  mode: "create" | "edit";
  accounts: ChartAccount[];
  editingAccount: ChartAccount | null;
  onClose: () => void;
  onSave: (account: ChartAccount) => void;
}

const NATURE_OPTIONS: { value: AccountNature; label: string }[] = [
  { value: "asset", label: "Activo" },
  { value: "liability", label: "Pasivo" },
  { value: "equity", label: "Patrimonio Neto" },
  { value: "income", label: "Ingreso" },
  { value: "expense", label: "Gasto" },
];

const TAX_OPTIONS = [
  { value: "iva_10", label: "IVA 10%" },
  { value: "iva_5", label: "IVA 5%" },
  { value: "iva_exento", label: "IVA Exento" },
  { value: "iva_debito", label: "IVA Débito Fiscal" },
  { value: "iva_credito", label: "IVA Crédito Fiscal" },
  { value: "ire_general", label: "IRE General" },
  { value: "ire_simple", label: "IRE Simple" },
  { value: "irp", label: "IRP" },
  { value: "inr", label: "INR" },
];

export function AccountModal({ open, mode, accounts, editingAccount, onClose, onSave }: AccountModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nature, setNature] = useState<AccountNature>("asset");
  const [parentCode, setParentCode] = useState<string>("");
  const [allowsPosting, setAllowsPosting] = useState(true);
  const [active, setActive] = useState(true);
  const [currency, setCurrency] = useState("PYG");
  const [taxMappings, setTaxMappings] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const flatAccounts = useMemo(() => flattenTree(accounts), [accounts]);

  useEffect(() => {
    if (open && mode === "edit" && editingAccount) {
      setCode(editingAccount.code);
      setName(editingAccount.name);
      setNature(editingAccount.nature);
      setParentCode(editingAccount.parentCode || "");
      setAllowsPosting(editingAccount.allowsPosting);
      setActive(editingAccount.active);
      setCurrency(editingAccount.currency);
      setTaxMappings(editingAccount.taxMappings || []);
    } else if (open && mode === "create") {
      setCode("");
      setName("");
      setNature("asset");
      setParentCode("");
      setAllowsPosting(true);
      setActive(true);
      setCurrency("PYG");
      setTaxMappings([]);
    }
    setErrors({});
  }, [open, mode, editingAccount]);

  const availableParents = useMemo(() => {
    return flatAccounts.filter((a) => a.code !== code);
  }, [flatAccounts, code]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = "El código es requerido";
    } else if (!/^[\d.]+$/.test(code)) {
      newErrors.code = "Solo números y puntos (ej: 1.1.02.001)";
    } else if (mode === "create") {
      const existing = findAccountByCode(accounts, code);
      if (existing) {
        newErrors.code = "Ya existe una cuenta con este código";
      }
    }

    if (!name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: editingAccount?.id || code,
      code,
      name,
      nature,
      parentCode: parentCode || null,
      allowsPosting,
      balance: editingAccount?.balance || 0,
      currency,
      active,
      taxMappings: taxMappings.length > 0 ? taxMappings : undefined,
    });
  };

  const toggleTax = (tax: string) => {
    setTaxMappings((prev) =>
      prev.includes(tax) ? prev.filter((t) => t !== tax) : [...prev, tax]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[5vh] sm:pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-gray-900 dark:text-white text-sm font-semibold">
              {mode === "create" ? "Nueva Cuenta" : "Editar Cuenta"}
            </h2>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
              {mode === "create" ? "Agregar al plan de cuentas" : "Modificar datos de la cuenta"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors no-tap-highlight"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Code + Nature row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 font-medium">
                Código <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="1.1.01"
                className={cn(
                  "w-full px-2.5 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono",
                  errors.code ? "border-red-300 dark:border-red-500/30" : "border-gray-200 dark:border-gray-700"
                )}
              />
              {errors.code && (
                <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {errors.code}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 font-medium">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Caja y Bancos"
                className={cn(
                  "w-full px-2.5 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                  errors.name ? "border-red-300 dark:border-red-500/30" : "border-gray-200 dark:border-gray-700"
                )}
              />
              {errors.name && (
                <p className="text-red-500 dark:text-red-400 text-[10px] mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {errors.name}
                </p>
              )}
            </div>
          </div>

          {/* Nature */}
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
              Naturaleza
            </label>
            <div className="flex flex-wrap gap-1.5">
              {NATURE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNature(opt.value)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border no-tap-highlight",
                    nature === opt.value
                      ? cn(getNatureBg(opt.value), getNatureColor(opt.value), "border-current")
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parent + Currency row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 font-medium">
                Cuenta Padre
              </label>
              <select
                value={parentCode}
                onChange={(e) => setParentCode(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
              >
                <option value="">— Ninguna (nivel raíz) —</option>
                {availableParents.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.code} — {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1 font-medium">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
              >
                <option value="PYG">PYG — Guaraní</option>
                <option value="USD">USD — Dólar</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
              <div className={cn(
                "h-5 w-8 rounded-full transition-colors relative shrink-0",
                allowsPosting ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
              )}>
                <div className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                  allowsPosting ? "left-3.5" : "left-0.5"
                )} />
              </div>
              <div>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Permite Imputación</span>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Cuenta analítica</p>
              </div>
              <input
                type="checkbox"
                checked={allowsPosting}
                onChange={(e) => setAllowsPosting(e.target.checked)}
                className="sr-only"
              />
            </label>
            <label className="flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
              <div className={cn(
                "h-5 w-8 rounded-full transition-colors relative shrink-0",
                active ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              )}>
                <div className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                  active ? "left-3.5" : "left-0.5"
                )} />
              </div>
              <div>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">Activa</span>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Visible en el sistema</p>
              </div>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="sr-only"
              />
            </label>
          </div>

          {/* Tax Mappings */}
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
              Mapeo Fiscal (opcional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAX_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTax(opt.value)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border no-tap-highlight",
                    taxMappings.includes(opt.value)
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors no-tap-highlight"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors no-tap-highlight"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {mode === "create" ? "Crear Cuenta" : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
