"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  FileText,
  Receipt,
  Download,
  Filter,
  Calendar,
  Building2,
  Search,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  Hash,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type LibroTab = "iva_compras" | "iva_ventas" | "diario" | "mayor" | "sumas_saldos";

interface IVAEntry {
  id: string;
  fecha: string;
  numero: string;
  tipo: "factura" | "nc" | "nd" | "recibo";
  ruc: string;
  nombre: string;
  gravado10: number;
  gravado5: number;
  exento: number;
  iva10: number;
  iva5: number;
  total: number;
  cdc?: string;
}

interface DiarioEntry {
  id: string;
  fecha: string;
  numero: string;
  cuenta: string;
  nombreCuenta: string;
  debito: number;
  credito: number;
  descripcion: string;
  origen: string;
}

interface MayorAccount {
  code: string;
  name: string;
  nature: "asset" | "liability" | "equity" | "income" | "expense";
  openingBalance: number;
  entries: {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
  closingBalance: number;
}

const NATURE_LABELS: Record<string, string> = {
  asset: "Activo",
  liability: "Pasivo",
  equity: "Patrimonio",
  income: "Ingreso",
  expense: "Gasto",
};

const NATURE_COLORS: Record<string, string> = {
  asset: "text-emerald-600 dark:text-emerald-400",
  liability: "text-red-600 dark:text-red-400",
  equity: "text-blue-600 dark:text-blue-400",
  income: "text-green-600 dark:text-green-400",
  expense: "text-orange-600 dark:text-orange-400",
};

// Mock IVA Compras
const MOCK_COMPRAS: IVAEntry[] = [
  { id: "c1", fecha: "2026-05-01", numero: "001-001-00234", tipo: "factura", ruc: "80012345-1", nombre: "Importadora del Este S.A.", gravado10: 10000000, gravado5: 0, exento: 0, iva10: 1000000, iva5: 0, total: 11000000, cdc: "8001234510010010023402605010000000112345678" },
  { id: "c2", fecha: "2026-05-03", numero: "002-001-00089", tipo: "factura", ruc: "4567890-1", nombre: "Servicios Contables Del Paraguay", gravado10: 2000000, gravado5: 0, exento: 500000, iva10: 200000, iva5: 0, total: 2700000 },
  { id: "c3", fecha: "2026-05-05", numero: "001-001-00056", tipo: "nc", ruc: "1234567-8", nombre: "Distribuciones Ñandutí S.A.", gravado10: -500000, gravado5: 0, exento: 0, iva10: -50000, iva5: 0, total: -550000, cdc: "123456780010010005602605000000000112345678901" },
  { id: "c4", fecha: "2026-05-08", numero: "001-001-01123", tipo: "factura", ruc: "9876543-2", nombre: "Agropecuaria Guaraní", gravado10: 3000000, gravado5: 1500000, exento: 0, iva10: 300000, iva5: 75000, total: 4875000 },
  { id: "c5", fecha: "2026-05-12", numero: "001-001-01145", tipo: "factura", ruc: "80012345-1", nombre: "Importadora del Este S.A.", gravado10: 8500000, gravado5: 0, exento: 0, iva10: 850000, iva5: 0, total: 9350000, cdc: "8001234510010010114502605120000000112345678" },
];

// Mock IVA Ventas
const MOCK_VENTAS: IVAEntry[] = [
  { id: "v1", fecha: "2026-05-02", numero: "001-001-00345", tipo: "factura", ruc: "80023456-2", nombre: "Tecnología Asunción SRL", gravado10: 15000000, gravado5: 0, exento: 0, iva10: 1500000, iva5: 0, total: 16500000, cdc: "8002345610010010034502605020000000112345678" },
  { id: "v2", fecha: "2026-05-06", numero: "001-001-00346", tipo: "factura", ruc: "9876543-2", nombre: "Agropecuaria Guaraní", gravado10: 5000000, gravado5: 0, exento: 2000000, iva10: 500000, iva5: 0, total: 7000000 },
  { id: "v3", fecha: "2026-05-10", numero: "001-001-00347", tipo: "factura", ruc: "80023456-2", nombre: "Tecnología Asunción SRL", gravado10: 12000000, gravado5: 3000000, exento: 0, iva10: 1200000, iva5: 150000, total: 16350000, cdc: "8002345610010010034702605100000000112345678" },
  { id: "v4", fecha: "2026-05-15", numero: "001-001-00012", tipo: "nc", ruc: "9876543-2", nombre: "Agropecuaria Guaraní", gravado10: -1000000, gravado5: 0, exento: 0, iva10: -100000, iva5: 0, total: -1100000 },
];

// Mock Diario
const MOCK_DIARIO: DiarioEntry[] = [
  { id: "d1", fecha: "2026-05-01", numero: "JE-001", cuenta: "1.1.03.001", nombreCuenta: "Mercaderías en Depósito", debito: 10000000, credito: 0, descripcion: "Compra mercadería gravada", origen: "XML SIFEN" },
  { id: "d2", fecha: "2026-05-01", numero: "JE-001", cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 1000000, credito: 0, descripcion: "IVA 10% compra", origen: "XML SIFEN" },
  { id: "d3", fecha: "2026-05-01", numero: "JE-001", cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 0, credito: 11000000, descripcion: "Proveedor: ImportEste", origen: "XML SIFEN" },
  { id: "d4", fecha: "2026-05-02", numero: "JE-002", cuenta: "2.1.01", nombreCuenta: "Cuentas a Cobrar Clientes", debito: 16500000, credito: 0, descripcion: "Venta Factura 001-001-00345", origen: "XML SIFEN" },
  { id: "d5", fecha: "2026-05-02", numero: "JE-002", cuenta: "4.1.01", nombreCuenta: "Ventas de Mercaderías", debito: 0, credito: 15000000, descripcion: "Venta gravada 10%", origen: "XML SIFEN" },
  { id: "d6", fecha: "2026-05-02", numero: "JE-002", cuenta: "2.1.02", nombreCuenta: "IVA Débito Fiscal", debito: 0, credito: 1500000, descripcion: "IVA 10% venta", origen: "XML SIFEN" },
  { id: "d7", fecha: "2026-05-03", numero: "JE-003", cuenta: "5.1.04", nombreCuenta: "Honorarios Profesionales", debito: 2000000, credito: 0, descripcion: "Honorarios contador", origen: "Manual" },
  { id: "d8", fecha: "2026-05-03", numero: "JE-003", cuenta: "5.1.05", nombreCuenta: "Otros Gastos", debito: 500000, credito: 0, descripcion: "Gastos varios", origen: "Manual" },
  { id: "d9", fecha: "2026-05-03", numero: "JE-003", cuenta: "1.1.01.002", nombreCuenta: "Banco Continental", debito: 0, credito: 2500000, descripcion: "Pago transferencia", origen: "Manual" },
  { id: "d10", fecha: "2026-05-05", numero: "JE-004", cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 550000, credito: 0, descripcion: "NC 001-001-00056", origen: "XML SIFEN" },
  { id: "d11", fecha: "2026-05-05", numero: "JE-004", cuenta: "1.1.03.001", nombreCuenta: "Mercaderías en Depósito", debito: 0, credito: 500000, descripcion: "Devolución mercadería", origen: "XML SIFEN" },
  { id: "d12", fecha: "2026-05-05", numero: "JE-004", cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 0, credito: 50000, descripcion: "Ajuste IVA crédito", origen: "XML SIFEN" },
];

// Mock Mayor
const MOCK_MAYOR: MayorAccount[] = [
  {
    code: "1.1.01.002",
    name: "Banco Continental Cta. Cte.",
    nature: "asset",
    openingBalance: 65000000,
    entries: [
      { date: "2026-05-01", description: "Saldo anterior", debit: 0, credit: 0, balance: 65000000 },
      { date: "2026-05-02", description: "Cobro Factura 001-001-00300", debit: 8500000, credit: 0, balance: 73500000 },
      { date: "2026-05-03", description: "Pago honorarios JE-003", debit: 0, credit: 2500000, balance: 71000000 },
      { date: "2026-05-05", description: "Pago proveedores", debit: 0, credit: 5600000, balance: 65400000 },
      { date: "2026-05-10", description: "Cobro Factura 001-001-00320", debit: 12000000, credit: 0, balance: 77400000 },
    ],
    closingBalance: 77400000,
  },
  {
    code: "2.1.01",
    name: "Cuentas a Pagar Proveedores",
    nature: "liability",
    openingBalance: 45000000,
    entries: [
      { date: "2026-05-01", description: "Compra ImportEste JE-001", debit: 0, credit: 11000000, balance: 56000000 },
      { date: "2026-05-05", description: "NC Ñandutí JE-004", debit: 550000, credit: 0, balance: 55450000 },
      { date: "2026-05-10", description: "Pago a proveedores", debit: 8000000, credit: 0, balance: 47450000 },
    ],
    closingBalance: 47450000,
  },
  {
    code: "4.1.01",
    name: "Ventas de Mercaderías Gravadas 10%",
    nature: "income",
    openingBalance: 0,
    entries: [
      { date: "2026-05-02", description: "Venta TechAsu JE-002", debit: 0, credit: 15000000, balance: -15000000 },
      { date: "2026-05-06", description: "Venta AgroGuarani JE-005", debit: 0, credit: 5000000, balance: -20000000 },
      { date: "2026-05-10", description: "Venta TechAsu JE-006", debit: 0, credit: 12000000, balance: -32000000 },
      { date: "2026-05-15", description: "NC AgroGuarani JE-007", debit: 1000000, credit: 0, balance: -31000000 },
    ],
    closingBalance: -31000000,
  },
  {
    code: "5.1.01",
    name: "Costo de Mercaderías Vendidas",
    nature: "expense",
    openingBalance: 0,
    entries: [
      { date: "2026-05-02", description: "Costo venta TechAsu", debit: 8500000, credit: 0, balance: 8500000 },
      { date: "2026-05-06", description: "Costo venta AgroGuarani", debit: 3200000, credit: 0, balance: 11700000 },
      { date: "2026-05-10", description: "Costo venta TechAsu", debit: 6800000, credit: 0, balance: 18500000 },
    ],
    closingBalance: 18500000,
  },
];

export default function LibrosPage() {
  const [activeLibro, setActiveLibro] = useState<LibroTab>("iva_compras");
  const [periodo, setPeriodo] = useState("2026-05");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMayorAccount, setSelectedMayorAccount] = useState<MayorAccount | null>(null);

  const tabs: { id: LibroTab; label: string; shortLabel: string; icon: any }[] = [
    { id: "iva_compras", label: "IVA Compras", shortLabel: "Compras", icon: Receipt },
    { id: "iva_ventas", label: "IVA Ventas", shortLabel: "Ventas", icon: FileText },
    { id: "diario", label: "Libro Diario", shortLabel: "Diario", icon: BookOpen },
    { id: "mayor", label: "Libro Mayor", shortLabel: "Mayor", icon: Hash },
    { id: "sumas_saldos", label: "Sumas y Saldos", shortLabel: "S&S", icon: FileSpreadsheet },
  ];

  const comprasTotales = useMemo(() =>
    MOCK_COMPRAS.reduce((acc, e) => ({
      gravado10: acc.gravado10 + e.gravado10,
      gravado5: acc.gravado5 + e.gravado5,
      exento: acc.exento + e.exento,
      iva10: acc.iva10 + e.iva10,
      iva5: acc.iva5 + e.iva5,
      total: acc.total + e.total,
    }), { gravado10: 0, gravado5: 0, exento: 0, iva10: 0, iva5: 0, total: 0 }),
  []);

  const ventasTotales = useMemo(() =>
    MOCK_VENTAS.reduce((acc, e) => ({
      gravado10: acc.gravado10 + e.gravado10,
      gravado5: acc.gravado5 + e.gravado5,
      exento: acc.exento + e.exento,
      iva10: acc.iva10 + e.iva10,
      iva5: acc.iva5 + e.iva5,
      total: acc.total + e.total,
    }), { gravado10: 0, gravado5: 0, exento: 0, iva10: 0, iva5: 0, total: 0 }),
  []);

  const diarioTotals = useMemo(() => ({
    debito: MOCK_DIARIO.reduce((s, e) => s + e.debito, 0),
    credito: MOCK_DIARIO.reduce((s, e) => s + e.credito, 0),
    entries: MOCK_DIARIO.length,
  }), []);

  const filteredCompras = useMemo(() =>
    MOCK_COMPRAS.filter((e) =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.numero.includes(search) ||
      e.ruc.includes(search)
    ), [search]);

  const filteredVentas = useMemo(() =>
    MOCK_VENTAS.filter((e) =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.numero.includes(search) ||
      e.ruc.includes(search)
    ), [search]);

  const diarioByDate = useMemo(() => {
    const groups: Record<string, DiarioEntry[]> = {};
    const sorted = [...MOCK_DIARIO].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.numero.localeCompare(b.numero));
    sorted.forEach((e) => {
      const key = `${e.fecha}|${e.numero}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  }, []);

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Libros Contables</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Libro IVA, Diario, Mayor y Sumas y Saldos — {periodo}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-2.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
          />
          <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-1.5 flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveLibro(tab.id); setSelectedMayorAccount(null); setSearch(""); }}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all flex-1 justify-center min-w-[60px] sm:min-w-[120px] no-tap-highlight",
                activeLibro === tab.id
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* IVA Compras */}
      {activeLibro === "iva_compras" && (
        <LibroIVA
          entries={filteredCompras}
          totals={comprasTotales}
          direction="compras"
          search={search}
          onSearch={setSearch}
        />
      )}

      {/* IVA Ventas */}
      {activeLibro === "iva_ventas" && (
        <LibroIVA
          entries={filteredVentas}
          totals={ventasTotales}
          direction="ventas"
          search={search}
          onSearch={setSearch}
        />
      )}

      {/* Libro Diario */}
      {activeLibro === "diario" && (
        <LibroDiario
          entriesByDate={diarioByDate}
          totals={diarioTotals}
        />
      )}

      {/* Libro Mayor */}
      {activeLibro === "mayor" && !selectedMayorAccount && (
        <LibroMayorList
          accounts={MOCK_MAYOR}
          onSelect={(acc) => setSelectedMayorAccount(acc)}
        />
      )}
      {activeLibro === "mayor" && selectedMayorAccount && (
        <LibroMayorDetail
          account={selectedMayorAccount}
          onBack={() => setSelectedMayorAccount(null)}
        />
      )}

      {/* Sumas y Saldos */}
      {activeLibro === "sumas_saldos" && <SumasYSaldos />}
    </div>
  );
}

// IVA Book Component
function LibroIVA({ entries, totals, direction, search, onSearch }: { entries: IVAEntry[]; totals: any; direction: string; search: string; onSearch: (s: string) => void }) {
  return (
    <>
      {/* Totals */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <h3 className="text-gray-900 dark:text-white text-sm font-medium mb-3">
          Resumen IVA {direction === "compras" ? "Compras" : "Ventas"}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <TotalItem label="Gravado 10%" value={totals.gravado10} />
          <TotalItem label="Gravado 5%" value={totals.gravado5} />
          <TotalItem label="Exento" value={totals.exento} />
          <TotalItem label={`IVA 10% ${direction === "compras" ? "Crédito" : "Débito"}`} value={totals.iva10} highlight={direction === "ventas"} />
          <TotalItem label={`IVA 5% ${direction === "compras" ? "Crédito" : "Débito"}`} value={totals.iva5} />
          <TotalItem label="Total" value={totals.total} bold />
        </div>
      </div>

      {/* Entries */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar por nombre, RUC o número..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
            />
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                <th className="text-left py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Fecha</th>
                <th className="text-left py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Comprobante</th>
                <th className="text-left py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">RUC</th>
                <th className="text-left py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Nombre</th>
                <th className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Grav. 10%</th>
                <th className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Grav. 5%</th>
                <th className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Exento</th>
                <th className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">IVA 10%</th>
                <th className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{e.fecha}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-gray-700 dark:text-gray-300">{e.numero}</span>
                      {e.tipo === "nc" && <span className="text-[9px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">NC</span>}
                      {e.tipo === "nd" && <span className="text-[9px] px-1 py-0.5 rounded bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">ND</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-gray-500 dark:text-gray-400">{e.ruc}</td>
                  <td className="py-2.5 px-3 text-gray-900 dark:text-gray-200">{e.nombre}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {e.gravado10.toLocaleString("es-PY")}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {e.gravado5.toLocaleString("es-PY")}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {e.exento.toLocaleString("es-PY")}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {e.iva10.toLocaleString("es-PY")}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums font-medium">₲ {e.total.toLocaleString("es-PY")}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <td className="py-2.5 px-3" colSpan={4}>
                  <span className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide text-[10px]">TOTALES ({entries.length} registros)</span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {totals.gravado10.toLocaleString("es-PY")}</td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {totals.gravado5.toLocaleString("es-PY")}</td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {totals.exento.toLocaleString("es-PY")}</td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {totals.iva10.toLocaleString("es-PY")}</td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums font-bold">₲ {totals.total.toLocaleString("es-PY")}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800/50">
          {entries.map((e) => (
            <div key={e.id} className="p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">{e.numero}</span>
                  {e.tipo === "nc" && <span className="text-[9px] px-1 py-0.5 rounded bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">NC</span>}
                </div>
                <span className="font-mono text-xs font-medium text-gray-900 dark:text-white tabular-nums">₲ {e.total.toLocaleString("es-PY")}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-xs">{e.nombre}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                <span>{e.fecha}</span>
                <span>·</span>
                <span className="font-mono">{e.ruc}</span>
              </div>
            </div>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="p-8 sm:p-12 text-center">
            <Receipt className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron registros</p>
          </div>
        )}
      </div>
    </>
  );
}

// Libro Diario Component
function LibroDiario({ entriesByDate, totals }: { entriesByDate: Record<string, DiarioEntry[]>; totals: { debito: number; credito: number; entries: number } }) {
  const dates = Object.keys(entriesByDate).sort();

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="text-gray-900 dark:text-white text-sm font-medium">Libro Diario</h3>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{totals.entries} líneas en {dates.length} asientos</p>
        </div>
        <div className={cn(
          "flex items-center gap-3 text-xs font-mono",
          Math.abs(totals.debito - totals.credito) < 0.01 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          <span>D ₲ {totals.debito.toLocaleString("es-PY")}</span>
          <span className="text-gray-400">=</span>
          <span>C ₲ {totals.credito.toLocaleString("es-PY")}</span>
          {Math.abs(totals.debito - totals.credito) < 0.01 && (
            <span className="hidden sm:inline text-green-500">✓</span>
          )}
        </div>
      </div>

      {dates.map((key) => {
        const [fecha, numero] = key.split("|");
        const entries = entriesByDate[key];
        const entryTotal = entries.reduce((s, e) => s + e.debito, 0);

        return (
          <div key={key} className="border-b border-gray-100 dark:border-gray-800/50 last:border-b-0">
            {/* Entry Header */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-900/80">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">{fecha}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs font-mono">{numero}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  entries[0]?.origen === "XML SIFEN" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                  "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                )}>{entries[0]?.origen}</span>
              </div>
              <span className="font-mono text-xs text-gray-500 dark:text-gray-400 tabular-nums">₲ {entryTotal.toLocaleString("es-PY")}</span>
            </div>

            {/* Entry Lines */}
            <div className="divide-y divide-gray-50 dark:divide-gray-800/30">
              {entries.map((e) => (
                <div key={e.id} className="px-4 sm:px-6 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[10px] sm:text-xs text-purple-500 dark:text-purple-400 w-20 sm:w-24 shrink-0">{e.cuenta}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{e.nombreCuenta}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{e.descripcion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {e.debito > 0 && <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">D {e.debito.toLocaleString("es-PY")}</span>}
                      {e.credito > 0 && <span className="font-mono text-xs text-red-600 dark:text-red-400 tabular-nums">C {e.credito.toLocaleString("es-PY")}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {dates.length === 0 && (
        <div className="p-8 sm:p-12 text-center">
          <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No hay asientos en este período</p>
        </div>
      )}
    </div>
  );
}

// Libro Mayor List
function LibroMayorList({ accounts, onSelect }: { accounts: MayorAccount[]; onSelect: (acc: MayorAccount) => void }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-gray-900 dark:text-white text-sm font-medium">Libro Mayor</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Seleccioná una cuenta para ver movimientos</p>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
        {accounts.map((acc) => (
          <button
            key={acc.code}
            onClick={() => onSelect(acc)}
            className="w-full flex items-center gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors text-left no-tap-highlight"
          >
            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <Hash className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{acc.code}</span>
                <span className={cn("text-[10px]", NATURE_COLORS[acc.nature])}>{NATURE_LABELS[acc.nature]}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm truncate">{acc.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn(
                "font-mono text-sm tabular-nums font-medium",
                acc.closingBalance > 0 ? "text-emerald-600 dark:text-emerald-400" :
                acc.closingBalance < 0 ? "text-red-600 dark:text-red-400" :
                "text-gray-500"
              )}>
                ₲ {Math.abs(acc.closingBalance).toLocaleString("es-PY")}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{acc.entries.length} mov.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Libro Mayor Detail
function LibroMayorDetail({ account, onBack }: { account: MayorAccount; onBack: () => void }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs mb-2 transition-colors no-tap-highlight"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </button>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-medium">{account.code}</span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", NATURE_COLORS[account.nature])}>{NATURE_LABELS[account.nature]}</span>
        </div>
        <h3 className="text-gray-900 dark:text-white text-sm font-semibold mt-0.5">{account.name}</h3>
      </div>

      {/* Opening/Closing */}
      <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 border-b border-gray-100 dark:border-gray-800/50">
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2.5">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">Saldo Anterior</span>
          <p className="font-mono text-sm text-gray-700 dark:text-gray-300 tabular-nums">₲ {account.openingBalance.toLocaleString("es-PY")}</p>
        </div>
        <div className={cn(
          "rounded-lg p-2.5",
          account.closingBalance > 0 ? "bg-emerald-50 dark:bg-emerald-500/10" :
          account.closingBalance < 0 ? "bg-red-50 dark:bg-red-500/10" :
          "bg-gray-50 dark:bg-gray-800/30"
        )}>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">Saldo Actual</span>
          <p className={cn(
            "font-mono text-sm tabular-nums",
            account.closingBalance > 0 ? "text-emerald-600 dark:text-emerald-400" :
            account.closingBalance < 0 ? "text-red-600 dark:text-red-400" :
            "text-gray-700 dark:text-gray-300"
          )}>
            ₲ {Math.abs(account.closingBalance).toLocaleString("es-PY")}
          </p>
        </div>
      </div>

      {/* Entries */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
        {account.entries.map((e, i) => (
          <div key={i} className="px-3 sm:px-4 py-2.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">{e.date}</span>
                  {i === 0 && <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">Apertura</span>}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-xs truncate">{e.description}</p>
              </div>
              <div className="text-right shrink-0 ml-2">
                <div className="flex items-center gap-2 text-xs font-mono">
                  {e.debit > 0 && <span className="text-emerald-600 dark:text-emerald-400">D {e.debit.toLocaleString("es-PY")}</span>}
                  {e.credit > 0 && <span className="text-red-600 dark:text-red-400">C {e.credit.toLocaleString("es-PY")}</span>}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums mt-0.5">
                  Saldo: ₲ {e.balance.toLocaleString("es-PY")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sumas y Saldos
function SumasYSaldos() {
  const rows = [
    { code: "1.1.01.001", name: "Caja Principal PYG", nature: "asset" as const, opening: 3245600, debit: 5000000, credit: 2100000, closing: 6145600 },
    { code: "1.1.01.002", name: "Banco Continental Cta. Cte.", nature: "asset" as const, opening: 65000000, debit: 20500000, credit: 8100000, closing: 77400000 },
    { code: "1.1.03.001", name: "Mercaderías en Depósito", nature: "asset" as const, opening: 50000000, debit: 10000000, credit: 500000, closing: 59500000 },
    { code: "1.1.06", name: "IVA Crédito Fiscal", nature: "asset" as const, opening: 2500000, debit: 1000000, credit: 50000, closing: 3450000 },
    { code: "2.1.01", name: "Cuentas a Pagar Proveedores", nature: "liability" as const, opening: 45000000, debit: 8550000, credit: 11000000, closing: 47450000 },
    { code: "2.1.02", name: "IVA Débito Fiscal", nature: "liability" as const, opening: 1500000, debit: 0, credit: 1500000, closing: 3000000 },
    { code: "4.1.01", name: "Ventas de Mercaderías Gravadas 10%", nature: "income" as const, opening: 0, debit: 1000000, credit: 32000000, closing: 31000000 },
    { code: "5.1.01", name: "Costo de Mercaderías Vendidas", nature: "expense" as const, opening: 0, debit: 18500000, credit: 0, closing: 18500000 },
    { code: "5.1.04", name: "Honorarios Profesionales", nature: "expense" as const, opening: 0, debit: 2000000, credit: 0, closing: 2000000 },
  ];

  const totals = rows.reduce((acc, r) => ({
    opening: acc.opening + r.opening,
    debit: acc.debit + r.debit,
    credit: acc.credit + r.credit,
    closing: acc.closing + r.closing,
  }), { opening: 0, debit: 0, credit: 0, closing: 0 });

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-gray-900 dark:text-white text-sm font-medium">Sumas y Saldos</h3>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Resumen de movimientos por cuenta</p>
      </div>

      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
              <th className="text-left py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Cuenta</th>
              <th className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Saldo Anterior</th>
              <th className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Suma Débito</th>
              <th className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Suma Crédito</th>
              <th className="text-right py-2.5 px-3 text-gray-500 font-medium uppercase tracking-wide">Saldo Actual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
            {rows.map((r) => (
              <tr key={r.code} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-600 dark:text-blue-400">{r.code}</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate">{r.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {r.opening.toLocaleString("es-PY")}</td>
                <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">₲ {r.debit.toLocaleString("es-PY")}</td>
                <td className="py-2.5 px-3 text-right font-mono text-red-600 dark:text-red-400 tabular-nums">₲ {r.credit.toLocaleString("es-PY")}</td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums font-medium">₲ {r.closing.toLocaleString("es-PY")}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide text-[10px]">TOTALES</td>
              <td className="py-2.5 px-3 text-right font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {totals.opening.toLocaleString("es-PY")}</td>
              <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">₲ {totals.debit.toLocaleString("es-PY")}</td>
              <td className="py-2.5 px-3 text-right font-mono text-red-600 dark:text-red-400 tabular-nums">₲ {totals.credit.toLocaleString("es-PY")}</td>
              <td className="py-2.5 px-3 text-right font-mono text-gray-900 dark:text-white tabular-nums font-bold">₲ {totals.closing.toLocaleString("es-PY")}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile */}
      <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800/50">
        {rows.map((r) => (
          <div key={r.code} className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{r.code}</span>
              <span className="text-gray-700 dark:text-gray-300 text-xs truncate">{r.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-gray-400">Saldo Ant.</span>
                <p className="font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {r.opening.toLocaleString("es-PY")}</p>
              </div>
              <div>
                <span className="text-gray-400">Débito</span>
                <p className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">₲ {r.debit.toLocaleString("es-PY")}</p>
              </div>
              <div>
                <span className="text-gray-400">Crédito</span>
                <p className="font-mono text-red-600 dark:text-red-400 tabular-nums">₲ {r.credit.toLocaleString("es-PY")}</p>
              </div>
              <div>
                <span className="text-gray-400">Saldo Act.</span>
                <p className="font-mono text-gray-900 dark:text-white tabular-nums font-medium">₲ {r.closing.toLocaleString("es-PY")}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/80">
          <span className="text-gray-500 dark:text-gray-400 text-[10px] font-medium uppercase tracking-wide">Totales</span>
          <div className="grid grid-cols-2 gap-2 text-xs mt-1">
            <span className="font-mono text-gray-600 dark:text-gray-400 tabular-nums">₲ {totals.opening.toLocaleString("es-PY")}</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">₲ {totals.debit.toLocaleString("es-PY")}</span>
            <span className="font-mono text-red-600 dark:text-red-400 tabular-nums">₲ {totals.credit.toLocaleString("es-PY")}</span>
            <span className="font-mono text-gray-900 dark:text-white tabular-nums font-bold">₲ {totals.closing.toLocaleString("es-PY")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TotalItem({ label, value, bold = false, highlight = false }: { label: string; value: number; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2.5">
      <p className="text-gray-400 dark:text-gray-500 text-[10px] mb-0.5">{label}</p>
      <p className={cn(
        "font-mono tabular-nums",
        bold ? "text-gray-900 dark:text-white font-bold text-sm" :
        highlight ? "text-blue-600 dark:text-blue-400 text-xs sm:text-sm" :
        "text-gray-600 dark:text-gray-400 text-xs sm:text-sm"
      )}>
        ₲ {value.toLocaleString("es-PY")}
      </p>
    </div>
  );
}
