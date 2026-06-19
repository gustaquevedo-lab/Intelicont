"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Send, FileText, QrCode, CheckCircle2, Copy, Download,
  TrendingUp, Calculator, Building2, Calendar, Plus, ArrowRight,
  Receipt, Sparkles, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generateInvoiceData, generateQRData } from "@/lib/cdc-generator";
import { validateRuc } from "@intelicont/ledger/fiscal-py";

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  ivaRate: 10 | 5 | 0;
  total: number;
}

const initialLine = (): InvoiceLine => ({
  id: Math.random().toString(36).slice(2, 8),
  description: "",
  quantity: 1,
  unitPrice: 0,
  ivaRate: 10,
  total: 0,
});

export default function EmitirFacturaPage() {
  const [rucCliente, setRucCliente] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [condicion, setCondicion] = useState<"contado" | "credito">("credito");
  const [lines, setLines] = useState<InvoiceLine[]>([initialLine()]);
  const [fecha] = useState(new Date().toISOString().split("T")[0]);
  const [emitida, setEmitida] = useState<{
    cdc: string; numero: string; qrData: string;
  } | null>(null);

  const updateLine = (id: string, field: keyof InvoiceLine, value: any) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === "quantity" || field === "unitPrice") {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      })
    );
  };

  const addLine = () => setLines((prev) => [...prev, initialLine()]);
  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const subtotalGravado10 = lines.filter((l) => l.ivaRate === 10).reduce((s, l) => s + l.total, 0);
  const subtotalGravado5 = lines.filter((l) => l.ivaRate === 5).reduce((s, l) => s + l.total, 0);
  const subtotalExento = lines.filter((l) => l.ivaRate === 0).reduce((s, l) => s + l.total, 0);
  const iva10 = Math.round(subtotalGravado10 * 0.10);
  const iva5 = Math.round(subtotalGravado5 * 0.05);
  const total = subtotalGravado10 + subtotalGravado5 + subtotalExento + iva10 + iva5;

  const rucValidation = rucCliente ? validateRuc(rucCliente) : null;

  const handleEmitir = () => {
    const data = generateInvoiceData({
      rucEmisor: "80012345",
      dvEmisor: "1",
      tipoDocumento: 1,
      establecimiento: "001",
      puntoEmision: "001",
      numeroDocumento: String(Math.floor(Math.random() * 9000000) + 1000000),
      fecha,
    });

    const qrData = generateQRData(data.cdc, "80012345-1", total, fecha);
    setEmitida({ ...data, qrData });
  };

  if (emitida) {
    return (
      <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4">
        <div className="text-center py-8">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Factura Emitida</h1>
          <p className="text-gray-500 text-sm mt-1">Factura Electrónica SIFEN</p>
        </div>

        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400 text-[10px]">Número</span><p className="font-mono font-bold text-gray-900 dark:text-white">{emitida.numero}</p></div>
            <div><span className="text-gray-400 text-[10px]">Fecha</span><p className="text-gray-900 dark:text-white">{fecha}</p></div>
            <div className="col-span-2"><span className="text-gray-400 text-[10px]">CDC</span><p className="font-mono text-xs text-gray-600 dark:text-gray-400 break-all">{emitida.cdc}</p></div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400 text-[10px]">Emisor</span><p className="text-gray-900 dark:text-white">Importadora del Este S.A.</p></div>
            <div><span className="text-gray-400 text-[10px]">RUC Emisor</span><p className="font-mono text-gray-900 dark:text-white">80012345-1</p></div>
            <div><span className="text-gray-400 text-[10px]">Cliente</span><p className="text-gray-900 dark:text-white">{nombreCliente}</p></div>
            <div><span className="text-gray-400 text-[10px]">RUC Cliente</span><p className="font-mono text-gray-900 dark:text-white">{rucCliente}</p></div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="rounded-lg bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-800/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Total</span>
              <span className="text-xl font-bold font-mono text-green-600 dark:text-green-400">Gs. {total.toLocaleString("es-PY")}</span>
            </div>
          </div>

          {/* QR Code placeholder */}
          <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
            <div className="text-center">
              <QrCode className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-[10px] text-gray-400">QR SIFEN</p>
              <button
                onClick={() => navigator.clipboard.writeText(emitida.qrData)}
                className="mt-1 text-[10px] text-blue-500 hover:text-blue-400 flex items-center gap-1 mx-auto"
              >
                <Copy className="h-3 w-3" /> Copiar enlace QR
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setEmitida(null)}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium no-tap-highlight"
            >
              Nueva Factura
            </button>
            <Link
              href="/sifen"
              className="flex items-center justify-center gap-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium no-tap-highlight"
            >
              <FileText className="h-4 w-4" /> Historial
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Emitir Factura Electrónica</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Generar factura SIFEN con CDC, QR y timbrado</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
            Timbrado: 12345678
          </span>
        </div>
      </div>

      {/* Client Data */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">Datos del Cliente</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">RUC</label>
            <input
              value={rucCliente}
              onChange={(e) => setRucCliente(e.target.value)}
              placeholder="80012345-1"
              className={cn(
                "w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight",
                rucCliente && rucValidation && !rucValidation.valid ? "border-red-300 dark:border-red-800" : "border-gray-200 dark:border-gray-700"
              )}
            />
            {rucCliente && rucValidation && !rucValidation.valid && (
              <p className="text-[10px] text-red-500 mt-0.5">{rucValidation.errors[0]}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Razón Social</label>
            <input
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="text-xs text-gray-400">Condición:</span>
          {[
            { value: "contado", label: "Contado" },
            { value: "credito", label: "Crédito" },
          ].map((c) => (
            <button
              key={c.value}
              onClick={() => setCondicion(c.value as typeof condicion)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-colors no-tap-highlight",
                condicion === c.value
                  ? "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Lines */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">Detalle</h2>
          </div>
          <button onClick={addLine} className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 no-tap-highlight">
            <Plus className="h-3 w-3" /> Agregar línea
          </button>
        </div>

        <div className="space-y-2">
          {lines.map((line) => (
            <div key={line.id} className="flex items-center gap-2">
              <input
                value={line.description}
                onChange={(e) => updateLine(line.id, "description", e.target.value)}
                placeholder="Descripción"
                className="flex-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 no-tap-highlight"
              />
              <input
                type="number"
                value={line.quantity || ""}
                onChange={(e) => updateLine(line.id, "quantity", parseFloat(e.target.value) || 0)}
                placeholder="Cant"
                className="w-14 px-2 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500/50 no-tap-highlight"
              />
              <input
                type="number"
                value={line.unitPrice || ""}
                onChange={(e) => updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                placeholder="P.U."
                className="w-20 px-2 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white text-right focus:outline-none focus:ring-1 focus:ring-blue-500/50 no-tap-highlight"
              />
              <select
                value={line.ivaRate}
                onChange={(e) => updateLine(line.id, "ivaRate", parseInt(e.target.value))}
                className="w-16 px-1 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-900 dark:text-white focus:outline-none no-tap-highlight"
              >
                <option value={10}>10%</option>
                <option value={5}>5%</option>
                <option value={0}>Ex</option>
              </select>
              <span className="w-24 text-right font-mono text-xs text-gray-700 dark:text-gray-300">
                Gs. {line.total.toLocaleString("es-PY")}
              </span>
              {lines.length > 1 && (
                <button onClick={() => removeLine(line.id)} className="p-1 text-gray-400 hover:text-red-500 no-tap-highlight">
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="space-y-1 text-sm max-w-xs ml-auto">
          <div className="flex justify-between"><span className="text-gray-400">Subtotal Grav. 10%</span><span className="font-mono text-gray-700 dark:text-gray-300">Gs. {subtotalGravado10.toLocaleString("es-PY")}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Subtotal Grav. 5%</span><span className="font-mono text-gray-700 dark:text-gray-300">Gs. {subtotalGravado5.toLocaleString("es-PY")}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Subtotal Exento</span><span className="font-mono text-gray-700 dark:text-gray-300">Gs. {subtotalExento.toLocaleString("es-PY")}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">IVA 10%</span><span className="font-mono text-gray-700 dark:text-gray-300">Gs. {iva10.toLocaleString("es-PY")}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">IVA 5%</span><span className="font-mono text-gray-700 dark:text-gray-300">Gs. {iva5.toLocaleString("es-PY")}</span></div>
          <hr className="border-gray-100 dark:border-gray-800" />
          <div className="flex justify-between font-bold"><span className="text-gray-900 dark:text-white">Total</span><span className="font-mono text-gray-900 dark:text-white">Gs. {total.toLocaleString("es-PY")}</span></div>
        </div>
      </div>

      {/* Emit Button */}
      <div className="flex justify-end gap-3">
        <Link href="/sifen" className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 no-tap-highlight">
          Cancelar
        </Link>
        <button
          onClick={handleEmitir}
          disabled={!rucCliente || !nombreCliente || total <= 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-40 transition-colors no-tap-highlight"
        >
          <Send className="h-4 w-4" />
          Emitir Factura Electrónica
        </button>
      </div>
    </div>
  );
}
