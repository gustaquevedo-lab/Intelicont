"use client";

import { useState, useMemo } from "react";
import {
  CreditCard, TrendingUp, TrendingDown, Clock, AlertCircle,
  Search, Filter, ArrowUp, ArrowDown, DollarSign,
  Download, Plus, Eye, Building2, Calendar, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "clientes" | "proveedores";

interface CuentaCorriente {
  id: string;
  partner: string;
  ruc: string;
  tipo: "cliente" | "proveedor";
  saldoActual: number;
  vencido30: number;
  vencido60: number;
  vencido90: number;
  ultimaOperacion: string;
  ultimoPago: string | null;
  facturas: FacturaItem[];
}

interface FacturaItem {
  id: string;
  numero: string;
  fecha: string;
  vencimiento: string;
  monto: number;
  saldo: number;
  estado: "pagado" | "pendiente" | "vencido";
  diasVencido: number;
}

const MOCK_CC: CuentaCorriente[] = [
  {
    id: "cc1", partner: "Importadora del Este S.A.", ruc: "80012345-1", tipo: "proveedor",
    saldoActual: -11000000, vencido30: -5500000, vencido60: -5500000, vencido90: 0,
    ultimaOperacion: "2026-05-01", ultimoPago: "2026-04-15",
    facturas: [
      { id: "f1", numero: "001-001-00234", fecha: "2026-05-01", vencimiento: "2026-05-31", monto: 11000000, saldo: 11000000, estado: "pendiente", diasVencido: 0 },
      { id: "f2", numero: "001-001-00100", fecha: "2026-04-10", vencimiento: "2026-04-30", monto: 5500000, saldo: 5500000, estado: "vencido", diasVencido: 5 },
      { id: "f3", numero: "001-001-00101", fecha: "2026-04-10", vencimiento: "2026-04-30", monto: 5500000, saldo: 5500000, estado: "vencido", diasVencido: 5 },
    ],
  },
  {
    id: "cc2", partner: "Tecnología Asunción SRL", ruc: "80023456-2", tipo: "proveedor",
    saldoActual: -16500000, vencido30: -16500000, vencido60: 0, vencido90: 0,
    ultimaOperacion: "2026-05-02", ultimoPago: null,
    facturas: [
      { id: "f4", numero: "001-001-00345", fecha: "2026-05-02", vencimiento: "2026-06-01", monto: 16500000, saldo: 16500000, estado: "pendiente", diasVencido: 0 },
    ],
  },
  {
    id: "cc3", partner: "Servicios Contables Del Paraguay", ruc: "4567890-1", tipo: "proveedor",
    saldoActual: -2737500, vencido30: 0, vencido60: -2737500, vencido90: 0,
    ultimaOperacion: "2026-05-03", ultimoPago: null,
    facturas: [
      { id: "f5", numero: "002-001-00089", fecha: "2026-05-03", vencimiento: "2026-06-02", monto: 2750000, saldo: 2737500, estado: "pendiente", diasVencido: 0 },
    ],
  },
  {
    id: "cc4", partner: "Comercial Paraguaya S.A.", ruc: "3456789-0", tipo: "cliente",
    saldoActual: 6050000, vencido30: 0, vencido60: 0, vencido90: 0,
    ultimaOperacion: "2026-05-10", ultimoPago: null,
    facturas: [
      { id: "f6", numero: "001-001-00001", fecha: "2026-05-10", vencimiento: "2026-06-09", monto: 6050000, saldo: 6050000, estado: "pendiente", diasVencido: 0 },
    ],
  },
  {
    id: "cc5", partner: "Distribuciones Ñandutí S.A.", ruc: "1234567-8", tipo: "proveedor",
    saldoActual: 550000, vencido30: 0, vencido60: 0, vencido90: 0,
    ultimaOperacion: "2026-05-05", ultimoPago: null,
    facturas: [
      { id: "f7", numero: "001-001-00056", fecha: "2026-05-05", vencimiento: "2026-06-04", monto: -550000, saldo: -550000, estado: "pendiente", diasVencido: 0 },
    ],
  },
];

export default function CuentasCorrientesPage() {
  const [tab, setTab] = useState<Tab>("proveedores");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const items = useMemo(() =>
    MOCK_CC.filter((c) => c.tipo === (tab === "proveedores" ? "proveedor" : "cliente"))
      .filter((c) =>
        c.partner.toLowerCase().includes(search.toLowerCase()) ||
        c.ruc.includes(search)
      ),
    [tab, search]
  );

  const totalAPagar = useMemo(() =>
    MOCK_CC.filter((c) => c.tipo === "proveedor").reduce((s, c) => s + Math.abs(Math.min(0, c.saldoActual)), 0),
    []
  );
  const totalACobrar = useMemo(() =>
    MOCK_CC.filter((c) => c.tipo === "cliente").reduce((s, c) => s + Math.max(0, c.saldoActual), 0),
    []
  );
  const vencido = useMemo(() =>
    MOCK_CC.reduce((s, c) => s + Math.abs(Math.min(0, c.vencido30 + c.vencido60 + c.vencido90)), 0),
    []
  );

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Cuentas Corrientes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Cuentas por Cobrar y Pagar — Aging</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm font-medium no-tap-highlight">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPI title="Total a Pagar" value={`Gs. ${(totalAPagar / 1000000).toFixed(1)}M`} icon={TrendingDown} color="red" />
        <KPI title="Total a Cobrar" value={`Gs. ${(totalACobrar / 1000000).toFixed(1)}M`} icon={TrendingUp} color="green" />
        <KPI title="Vencido" value={`Gs. ${(vencido / 1000000).toFixed(1)}M`} icon={AlertCircle} color="yellow" />
        <KPI title="Partners" value={MOCK_CC.length.toString()} icon={Building2} color="blue" />
      </div>

      {/* Aging Summary */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Aging de Saldos</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AgingBar label="Corriente" amount={Math.abs(items.reduce((s, c) => {
            const corriente = Math.abs(c.saldoActual) - Math.abs(c.vencido30 + c.vencido60 + c.vencido90);
            return s + Math.max(0, corriente);
          }, 0))} color="bg-green-500" />
          <AgingBar label="1-30 días" amount={Math.abs(items.reduce((s, c) => s + c.vencido30, 0))} color="bg-yellow-500" />
          <AgingBar label="31-60 días" amount={Math.abs(items.reduce((s, c) => s + c.vencido60, 0))} color="bg-orange-500" />
          <AgingBar label="+60 días" amount={Math.abs(items.reduce((s, c) => s + c.vencido90, 0))} color="bg-red-500" />
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        <button onClick={() => setTab("proveedores")} className={cn("px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight", tab === "proveedores" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500")}>
          <TrendingDown className="h-3.5 w-3.5 inline mr-1.5" />Proveedores
        </button>
        <button onClick={() => setTab("clientes")} className={cn("px-4 py-2 rounded-lg text-sm font-medium no-tap-highlight", tab === "clientes" ? "bg-white dark:bg-gray-700 shadow-sm" : "text-gray-500")}>
          <TrendingUp className="h-3.5 w-3.5 inline mr-1.5" />Clientes
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o RUC..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {items.map((cc) => (
          <div key={cc.id} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div
              onClick={() => setExpanded(expanded === cc.id ? null : cc.id)}
              className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/20 no-tap-highlight"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  cc.tipo === "cliente" ? "bg-green-50 dark:bg-green-500/10" : "bg-red-50 dark:bg-red-500/10"
                )}>
                  <CreditCard className={cn("h-5 w-5", cc.tipo === "cliente" ? "text-green-500" : "text-red-500")} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cc.partner}</p>
                  <p className="text-[10px] text-gray-400 font-mono">RUC: {cc.ruc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <p className={cn("text-sm font-bold font-mono tabular-nums",
                    cc.saldoActual < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  )}>
                    Gs. {Math.abs(cc.saldoActual).toLocaleString("es-PY")}
                  </p>
                  <p className="text-[10px] text-gray-400">{cc.facturas.length} facturas</p>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                  cc.vencido90 > 0 ? "bg-red-50 dark:bg-red-500/10 text-red-600" :
                  cc.vencido60 > 0 ? "bg-orange-50 dark:bg-orange-500/10 text-orange-600" :
                  cc.vencido30 > 0 ? "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600" :
                  "bg-green-50 dark:bg-green-500/10 text-green-600"
                )}>
                  {cc.vencido90 > 0 && <AlertCircle className="h-3 w-3" />}
                  {cc.vencido90 > 0 ? "+60d" : cc.vencido60 > 0 ? "31-60d" : cc.vencido30 > 0 ? "1-30d" : "Corriente"}
                </div>
              </div>
            </div>

            {expanded === cc.id && (
              <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="text-left py-1.5 px-2 text-[10px] text-gray-400 font-medium">Número</th>
                        <th className="text-left py-1.5 px-2 text-[10px] text-gray-400 font-medium">Fecha</th>
                        <th className="text-left py-1.5 px-2 text-[10px] text-gray-400 font-medium">Vencimiento</th>
                        <th className="text-right py-1.5 px-2 text-[10px] text-gray-400 font-medium">Monto</th>
                        <th className="text-right py-1.5 px-2 text-[10px] text-gray-400 font-medium">Saldo</th>
                        <th className="text-center py-1.5 px-2 text-[10px] text-gray-400 font-medium">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cc.facturas.map((f) => (
                        <tr key={f.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/20">
                          <td className="py-1.5 px-2 font-mono text-gray-900 dark:text-white">{f.numero}</td>
                          <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400">{f.fecha}</td>
                          <td className="py-1.5 px-2 text-gray-600 dark:text-gray-400">{f.vencimiento}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {Math.abs(f.monto).toLocaleString("es-PY")}</td>
                          <td className="py-1.5 px-2 text-right font-mono text-gray-700 dark:text-gray-300">Gs. {Math.abs(f.saldo).toLocaleString("es-PY")}</td>
                          <td className="py-1.5 px-2 text-center">
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
                              f.estado === "pagado" && "bg-green-50 dark:bg-green-500/10 text-green-600",
                              f.estado === "pendiente" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600",
                              f.estado === "vencido" && "bg-red-50 dark:bg-red-500/10 text-red-600",
                            )}>
                              {f.estado === "vencido" ? `Vencido (${f.diasVencido}d)` : f.estado === "pagado" ? "Pagado" : "Pendiente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function KPI({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  const colors: Record<string, string> = {
    red: "text-red-500 bg-red-50 dark:bg-red-500/10",
    green: "text-green-500 bg-green-50 dark:bg-green-500/10",
    yellow: "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10",
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  };
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{title}</span>
        <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", colors[color])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function AgingBar({ label, amount, color }: { label: string; amount: number; color: string }) {
  const maxAmount = 25000000;
  const pct = Math.min(100, (amount / maxAmount) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-mono text-gray-700 dark:text-gray-300">Gs. {(amount / 1000000).toFixed(1)}M</span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
