"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  FileText,
  Building2,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createAsiento } from "@/lib/actions";

interface Linea {
  id: string;
  cuenta: string;
  cuentaNombre: string;
  descripcion: string;
  debito: string;
  credito: string;
}

const CUENTAS_MOCK = [
  { code: "1.1.01", name: "Caja" },
  { code: "1.1.02", name: "Banco Galicia Cta. Cte." },
  { code: "1.1.03", name: "Banco Itau Cta. Cte." },
  { code: "1.1.05", name: "Cuentas a Cobrar Clientes" },
  { code: "1.1.06", name: "IVA Crédito Fiscal" },
  { code: "1.1.07", name: "IVA Crédito Fiscal 5%" },
  { code: "1.2.01", name: "Mercaderías" },
  { code: "1.2.02", name: "Rodado" },
  { code: "1.2.03", name: "Mobiliario y Útiles" },
  { code: "1.2.04", name: "Equipo de Computación" },
  { code: "2.1.01", name: "Cuentas a Pagar Proveedores" },
  { code: "2.1.02", name: "IVA Débito Fiscal" },
  { code: "2.1.03", name: "IVA Débito Fiscal 5%" },
  { code: "2.1.05", name: "Retenciones a Pagar" },
  { code: "2.1.06", name: "IRE a Pagar" },
  { code: "3.1.01", name: "Capital Social" },
  { code: "3.1.02", name: "Reserva Legal" },
  { code: "3.1.03", name: "Resultados Acumulados" },
  { code: "3.1.04", name: "Resultado del Ejercicio" },
  { code: "4.1.01", name: "Ventas de Mercaderías" },
  { code: "4.1.02", name: "Prestación de Servicios" },
  { code: "4.1.03", name: "Otros Ingresos" },
  { code: "5.1.01", name: "Costo de Mercaderías Vendidas" },
  { code: "5.1.02", name: "Sueldos y Salarios" },
  { code: "5.1.03", name: "Seguridad Social" },
  { code: "5.1.04", name: "Honorarios Profesionales" },
  { code: "5.1.05", name: "Alquileres" },
  { code: "5.1.06", name: "Servicios Públicos" },
  { code: "5.1.07", name: "Depreciación de Rodado" },
  { code: "5.1.08", name: "Depreciación de Equipo de Computación" },
  { code: "5.1.09", name: "Gastos Financieros" },
  { code: "5.1.10", name: "Otros Gastos" },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function formatGs(value: string) {
  const num = parseFloat(value);
  if (isNaN(num)) return "";
  return num.toLocaleString("es-PY");
}

export default function NuevoAsientoPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [descripcion, setDescripcion] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([
    { id: uid(), cuenta: "", cuentaNombre: "", descripcion: "", debito: "", credito: "" },
    { id: uid(), cuenta: "", cuentaNombre: "", descripcion: "", debito: "", credito: "" },
  ]);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);

  const totals = useMemo(() => {
    let totalDebito = 0;
    let totalCredito = 0;
    lineas.forEach((l) => {
      totalDebito += parseFloat(l.debito) || 0;
      totalCredito += parseFloat(l.credito) || 0;
    });
    return { totalDebito, totalCredito, balanced: Math.abs(totalDebito - totalCredito) < 0.01 };
  }, [lineas]);

  const addLinea = () => {
    setLineas([...lineas, { id: uid(), cuenta: "", cuentaNombre: "", descripcion: "", debito: "", credito: "" }]);
  };

  const removeLinea = (id: string) => {
    if (lineas.length <= 2) return;
    setLineas(lineas.filter((l) => l.id !== id));
  };

  const updateLinea = (id: string, field: keyof Linea, value: string) => {
    setLineas(
      lineas.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === "debito" && parseFloat(value) > 0) updated.credito = "";
        if (field === "credito" && parseFloat(value) > 0) updated.debito = "";
        return updated;
      })
    );
  };

  const selectCuenta = (lineaId: string, code: string, name: string) => {
    setLineas(lineas.map((l) => (l.id === lineaId ? { ...l, cuenta: code, cuentaNombre: name } : l)));
    setShowSuggestions(null);
  };

  const handleSugerenciaIA = () => {
    setDescripcion("Compra mercadería con IVA 10%");
    setLineas([
      { id: uid(), cuenta: "1.2.01", cuentaNombre: "Mercaderías", descripcion: "Compra mercadería gravada 10%", debito: "10000000", credito: "" },
      { id: uid(), cuenta: "1.1.06", cuentaNombre: "IVA Crédito Fiscal", descripcion: "IVA 10% compra", debito: "1000000", credito: "" },
      { id: uid(), cuenta: "2.1.01", cuentaNombre: "Cuentas a Pagar Proveedores", descripcion: "Compra a crédito", debito: "", credito: "11000000" },
    ]);
  };

  const handlePublicar = () => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createAsiento({
        entityId: empresa,
        periodId: "",
        date: fecha,
        descripcion,
        lineas: lineas
          .filter((l) => l.cuenta)
          .map((l) => ({
            accountId: l.cuenta,
            debit: l.debito || "0",
            credit: l.credito || "0",
            currencyCode: "PYG",
            description: l.descripcion,
          })),
      });

      if (result.success) {
        setFeedback({ type: "success", message: result.message });
        setTimeout(() => router.push("/asientos"), 1500);
      } else {
        setFeedback({ type: "error", message: result.message });
      }
    });
  };

  const isComplete = descripcion && empresa && totals.balanced && totals.totalDebito > 0;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="/asientos" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </a>
          <div>
            <h1 className="text-xl lg:text-2xl font-semibold text-white">Nuevo Asiento</h1>
            <p className="text-gray-400 text-sm mt-0.5">Crear asiento contable con doble partida</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSugerenciaIA}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-600/20 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Sugerir con IA
          </button>
          <button
            disabled={!isComplete || isPending}
            onClick={handlePublicar}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              isComplete && !isPending
                ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            )}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isPending ? "Guardando..." : "Publicar Asiento"}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          "flex items-center gap-2 p-4 rounded-xl border animate-in",
          feedback.type === "success"
            ? "bg-green-900/10 border-green-800/50 text-green-400"
            : "bg-red-900/10 border-red-800/50 text-red-400"
        )}>
          {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span className="text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Balance Indicator */}
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl border transition-colors",
        totals.balanced && totals.totalDebito > 0
          ? "bg-green-900/10 border-green-800/50"
          : "bg-gray-900/50 border-gray-800"
      )}>
        {totals.balanced && totals.totalDebito > 0 ? (
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0" />
        )}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wide">Total Débitos</span>
              <p className="text-white font-semibold tabular-nums">₲ {formatGs(totals.totalDebito.toString())}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wide">Total Créditos</span>
              <p className="text-white font-semibold tabular-nums">₲ {formatGs(totals.totalCredito.toString())}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              totals.balanced && totals.totalDebito > 0
                ? "bg-green-900/30 text-green-400"
                : "bg-yellow-900/30 text-yellow-400"
            )}>
              {totals.balanced && totals.totalDebito > 0 ? "✓ Balanceado" : "⚠ Desbalanceado"}
            </span>
            {totals.totalDebito > 0 && !totals.balanced && (
              <span className="text-xs text-yellow-400">
                Diferencia: ₲ {formatGs(Math.abs(totals.totalDebito - totals.totalCredito).toString())}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Header Fields */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1.5">
              <Calendar className="h-3.5 w-3.5 text-gray-500" />
              Fecha *
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1.5">
              <Building2 className="h-3.5 w-3.5 text-gray-500" />
              Empresa *
            </label>
            <select
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Seleccionar empresa</option>
              <option value="mock-1">Importadora del Este S.A.</option>
              <option value="mock-2">Tecnología Asunción SRL</option>
              <option value="mock-3">Distribuciones Ñandutí SA</option>
              <option value="mock-4">Consultora Guaraní SRL</option>
              <option value="mock-5">Frigorífico Central SA</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-gray-500" />
              Descripción *
            </label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Compra mercadería Factura 001-233"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
      </div>

      {/* Lines Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-3 px-4 text-gray-500 text-xs font-medium uppercase tracking-wider w-10">#</th>
                <th className="text-left py-3 px-4 text-gray-500 text-xs font-medium uppercase tracking-wider min-w-[220px]">Cuenta</th>
                <th className="text-left py-3 px-4 text-gray-500 text-xs font-medium uppercase tracking-wider min-w-[180px]">Descripción</th>
                <th className="text-right py-3 px-4 text-gray-500 text-xs font-medium uppercase tracking-wider w-40">Débito</th>
                <th className="text-right py-3 px-4 text-gray-500 text-xs font-medium uppercase tracking-wider w-40">Crédito</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {lineas.map((linea, idx) => (
                <tr key={linea.id} className="hover:bg-gray-800/20 transition-colors group">
                  <td className="py-2 px-4 text-gray-600 font-mono text-xs">{idx + 1}</td>
                  <td className="py-2 px-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowSuggestions(showSuggestions === linea.id ? null : linea.id)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
                          linea.cuenta
                            ? "text-white bg-gray-800/50 border border-gray-700"
                            : "text-gray-500 bg-gray-800/30 border border-gray-700/50 hover:border-gray-600"
                        )}
                      >
                        {linea.cuenta ? (
                          <span>
                            <span className="text-blue-400 font-mono">{linea.cuenta}</span>{" "}
                            <span className="text-gray-400">{linea.cuentaNombre}</span>
                          </span>
                        ) : (
                          "Seleccionar cuenta"
                        )}
                      </button>
                      {showSuggestions === linea.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(null)} />
                          <div className="absolute z-20 top-full left-0 mt-1 w-80 max-h-64 overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50">
                            <div className="p-2 border-b border-gray-800">
                              <p className="text-gray-400 text-xs">Plan de cuentas</p>
                            </div>
                            {CUENTAS_MOCK.map((c) => (
                              <button
                                key={c.code}
                                onClick={() => selectCuenta(linea.id, c.code, c.name)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition-colors"
                              >
                                <span className="text-blue-400 font-mono text-xs">{c.code}</span>{" "}
                                <span className="text-gray-300">{c.name}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      value={linea.descripcion}
                      onChange={(e) => updateLinea(linea.id, "descripcion", e.target.value)}
                      placeholder="Detalle de la línea"
                      className="w-full px-3 py-1.5 bg-gray-800/30 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      value={linea.debito}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        updateLinea(linea.id, "debito", val);
                      }}
                      placeholder="0"
                      className="w-full text-right px-3 py-1.5 bg-gray-800/30 border border-gray-700/50 rounded-lg text-sm text-white font-mono tabular-nums placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500/50"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input
                      type="text"
                      value={linea.credito}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        updateLinea(linea.id, "credito", val);
                      }}
                      placeholder="0"
                      className="w-full text-right px-3 py-1.5 bg-gray-800/30 border border-gray-700/50 rounded-lg text-sm text-white font-mono tabular-nums placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => removeLinea(linea.id)}
                      disabled={lineas.length <= 2}
                      className="p-1.5 hover:bg-red-900/20 hover:text-red-400 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-gray-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-700 bg-gray-800/50">
                <td colSpan={3} className="py-3 px-4 text-right text-gray-400 font-medium">
                  TOTALES
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={cn("font-mono font-bold text-lg tabular-nums", totals.balanced ? "text-green-400" : "text-white")}>
                    ₲ {formatGs(totals.totalDebito.toString())}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={cn("font-mono font-bold text-lg tabular-nums", totals.balanced ? "text-green-400" : "text-white")}>
                    ₲ {formatGs(totals.totalCredito.toString())}
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={addLinea}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar línea
          </button>
        </div>
      </div>

      {/* Validation Messages */}
      {!empresa && (
        <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/10 border border-yellow-800/30 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Selecciona una empresa para continuar
        </div>
      )}
      {!descripcion && (
        <div className="flex items-center gap-2 text-sm text-yellow-400 bg-yellow-900/10 border border-yellow-800/30 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Agrega una descripción al asiento
        </div>
      )}
      {totals.totalDebito > 0 && !totals.balanced && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/10 border border-red-800/30 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          El asiento está desbalanceado. Diferencia: ₲ {formatGs(Math.abs(totals.totalDebito - totals.totalCredito).toString())}
        </div>
      )}
    </div>
  );
}
