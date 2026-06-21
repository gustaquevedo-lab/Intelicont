"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/use-user";
import { useEntity } from "@/hooks/use-entity";
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowLeft,
  RotateCcw,
  Edit3,
  Eye,
  X,
  Filter,
  AlertTriangle,
  Trash2,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKey } from "@/lib/use-keyboard-shortcuts";

type AsientoEstado = "Borrador" | "Posteado" | "Revertido";
type AsientoOrigen = "XML SIFEN" | "Manual" | "Conciliación" | "Reversión" | "Ajuste";

interface LineaAsiento {
  cuenta: string;
  nombreCuenta: string;
  debito: number;
  credito: number;
  descripcion: string;
}

interface Asiento {
  id: string;
  numero: string;
  fecha: string;
  empresa: string;
  origen: AsientoOrigen;
  estado: AsientoEstado;
  descripcion: string;
  total: number;
  lineas: LineaAsiento[];
  sugerenciaIA?: boolean;
  revertidoDe?: string;
  posteadoAt?: string;
}

const MOCK_LINEAS: Record<string, LineaAsiento[]> = {
  "JE-001": [
    { cuenta: "1.2.01", nombreCuenta: "Mercaderías", debito: 10000000, credito: 0, descripcion: "Compra mercadería gravada 10%" },
    { cuenta: "1.1.06", nombreCuenta: "IVA Crédito Fiscal", debito: 1000000, credito: 0, descripcion: "IVA 10% compra" },
    { cuenta: "5.1.10", nombreCuenta: "Otros Gastos", debito: 4500000, credito: 0, descripcion: "Gastos de flete" },
    { cuenta: "2.1.01", nombreCuenta: "Cuentas a Pagar Proveedores", debito: 0, credito: 15500000, descripcion: "Proveedor: ImportEste" },
  ],
  "JE-002": [
    { cuenta: "5.1.04", nombreCuenta: "Honorarios Profesionales", debito: 2500000, credito: 0, descripcion: "Honorarios contador" },
    { cuenta: "1.1.02", nombreCuenta: "Banco Galicia Cta. Cte.", debito: 0, credito: 2500000, descripcion: "Pago transferencia" },
  ],
  "JE-003": [
    { cuenta: "1.1.05", nombreCuenta: "Cuentas a Cobrar Clientes", debito: 8920000, credito: 0, descripcion: "Venta Factura 002-445" },
    { cuenta: "4.1.01", nombreCuenta: "Ventas de Mercaderías", debito: 0, credito: 8109091, descripcion: "Venta gravada" },
    { cuenta: "2.1.02", nombreCuenta: "IVA Débito Fiscal", debito: 0, credito: 810909, descripcion: "IVA 10% venta" },
  ],
};

const mockAsientos: Asiento[] = [
  { id: "JE-001", numero: "001-2026", fecha: "2026-05-01", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Posteado", descripcion: "Compra mercadería Factura 001-233", total: 15500000, lineas: MOCK_LINEAS["JE-001"] || [], sugerenciaIA: true, posteadoAt: "2026-05-01 10:30" },
  { id: "JE-002", numero: "002-2026", fecha: "2026-05-02", empresa: "Tech Asunción", origen: "Manual", estado: "Posteado", descripcion: "Pago honorarios profesionales", total: 2500000, lineas: MOCK_LINEAS["JE-002"] || [], posteadoAt: "2026-05-02 14:15" },
  { id: "JE-003", numero: "003-2026", fecha: "2026-05-03", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Borrador", descripcion: "Venta Factura 002-445", total: 8920000, lineas: MOCK_LINEAS["JE-003"] || [], sugerenciaIA: true },
  { id: "JE-004", numero: "004-2026", fecha: "2026-05-04", empresa: "Ñandutí Dist.", origen: "Conciliación", estado: "Posteado", descripcion: "Conciliación bancaria Mayo", total: 5600000, lineas: [
    { cuenta: "1.1.02", nombreCuenta: "Banco Galicia", debito: 5600000, credito: 0, descripcion: "Depósito identificado" },
    { cuenta: "1.1.05", nombreCuenta: "Cuentas a Cobrar", debito: 0, credito: 5600000, descripcion: "Cancelación factura pendiente" },
  ], posteadoAt: "2026-05-04 09:00" },
  { id: "JE-005", numero: "005-2026", fecha: "2026-05-05", empresa: "Frigocentral", origen: "XML SIFEN", estado: "Borrador", descripcion: "Retención IVA proveedor", total: 1230000, lineas: [], sugerenciaIA: true },
  { id: "JE-006", numero: "REV-001", fecha: "2026-05-06", empresa: "Tech Asunción", origen: "Reversión", estado: "Posteado", descripcion: "Reversión asiento JE-002 (error imputación)", total: 2500000, lineas: [
    { cuenta: "1.1.02", nombreCuenta: "Banco Galicia", debito: 2500000, credito: 0, descripcion: "Contra-asiento JE-002" },
    { cuenta: "5.1.04", nombreCuenta: "Honorarios", debito: 0, credito: 2500000, descripcion: "Reversión honorarios" },
  ], revertidoDe: "JE-002", posteadoAt: "2026-05-06 11:20" },
  { id: "JE-007", numero: "006-2026", fecha: "2026-05-07", empresa: "Guaraní Consult.", origen: "Manual", estado: "Posteado", descripcion: "Ajuste por inflación Mayo", total: 890000, lineas: [], posteadoAt: "2026-05-07 16:45" },
  { id: "JE-008", numero: "007-2026", fecha: "2026-05-08", empresa: "Importadora del Este", origen: "XML SIFEN", estado: "Borrador", descripcion: "Nota de Crédito 001-089", total: 1250000, lineas: [], sugerenciaIA: true },
];

export default function AsientosPage() {
  const router = useRouter();
  const { user } = useUser();
  const { selectedEntity } = useEntity(user?.id);

  const activeEmpresaName = selectedEntity?.legalName || selectedEntity?.tradeName || "";

  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroOrigen, setFiltroOrigen] = useState<string>("todos");
  const [periodoDesde, setPeriodoDesde] = useState("2026-05-01");
  const [periodoHasta, setPeriodoHasta] = useState("2026-05-31");
  const [selectedAsiento, setSelectedAsiento] = useState<Asiento | null>(null);
  const [showRevertConfirm, setShowRevertConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [asientos, setAsientos] = useState(mockAsientos);
  const [listIndex, setListIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const asientosFiltrados = useMemo(() => {
    return asientos.filter((a) => {
      const matchesSearch =
        a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.numero.includes(searchTerm) ||
        a.empresa.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filtroEstado === "todos" || a.estado === filtroEstado;
      const matchesOrigen = filtroOrigen === "todos" || a.origen === filtroOrigen;
      
      // Filter mock data by active company context if one is set
      const matchesEmpresa = !activeEmpresaName || 
        a.empresa.toLowerCase().includes(activeEmpresaName.toLowerCase()) || 
        activeEmpresaName.toLowerCase().includes(a.empresa.toLowerCase());
        
      const matchesFecha = a.fecha >= periodoDesde && a.fecha <= periodoHasta;
      return matchesSearch && matchesEstado && matchesOrigen && matchesEmpresa && matchesFecha;
    });
  }, [asientos, searchTerm, filtroEstado, filtroOrigen, activeEmpresaName, periodoDesde, periodoHasta]);

  const stats = useMemo(() => ({
    total: asientos.length,
    posteados: asientos.filter((a) => a.estado === "Posteado").length,
    borradores: asientos.filter((a) => a.estado === "Borrador").length,
    revertidos: asientos.filter((a) => a.estado === "Revertido").length,
    totalMonto: asientos.filter((a) => a.estado === "Posteado").reduce((s, a) => s + a.total, 0),
  }), [asientos]);

  useKey("n", () => router.push("/asientos/nuevo"), true);
  useKey("/", () => searchInputRef.current?.focus(), true);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setListIndex((prev) => Math.min(prev + 1, asientosFiltrados.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setListIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && asientosFiltrados[listIndex]) {
        e.preventDefault();
        setSelectedAsiento(asientosFiltrados[listIndex]);
      } else if (e.key === "Escape") {
        setSelectedAsiento(null);
        setShowRevertConfirm(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [asientosFiltrados, listIndex, router]);

  const handleRevert = (id: string) => {
    const asiento = asientos.find((a) => a.id === id);
    if (!asiento) return;

    const newReversal: Asiento = {
      id: `REV-${Date.now().toString().slice(-6)}`,
      numero: `REV-${String(stats.revertidos + 1).padStart(3, "0")}`,
      fecha: new Date().toISOString().split("T")[0],
      empresa: asiento.empresa,
      origen: "Reversión",
      estado: "Posteado",
      descripcion: `Reversión de ${asiento.numero} — ${asiento.descripcion}`,
      total: asiento.total,
      lineas: asiento.lineas.map((l) => ({
        ...l,
        debito: l.credito,
        credito: l.debito,
        descripcion: `Contra-asiento ${asiento.numero}`,
      })),
      revertidoDe: id,
      posteadoAt: new Date().toISOString(),
    };

    setAsientos((prev) => [
      ...prev.map((a) => a.id === id ? { ...a, estado: "Revertido" as AsientoEstado } : a),
      newReversal,
    ]);
    setShowRevertConfirm(null);
    if (selectedAsiento?.id === id) {
      setSelectedAsiento({ ...asiento, estado: "Revertido" });
    }
  };

  const handleDelete = (id: string) => {
    setAsientos((prev) => prev.filter((a) => a.id !== id));
    if (selectedAsiento?.id === id) setSelectedAsiento(null);
  };

  const activeFiltersCount = [
    filtroEstado !== "todos",
    filtroOrigen !== "todos",
  ].filter(Boolean).length;

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">Asientos Contables</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Gestión del libro diario — {stats.posteados} posteados, {stats.borradores} borradores</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <Link
            href="/asientos/nuevo"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors no-tap-highlight"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Asiento</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard title="Total" value={stats.total.toString()} icon={FileText} />
        <StatCard title="Posteados" value={stats.posteados.toString()} icon={CheckCircle2} color="text-green-500 dark:text-green-400" />
        <StatCard title="Borradores" value={stats.borradores.toString()} icon={Clock} color="text-yellow-500 dark:text-yellow-400" />
        <StatCard title="Revertidos" value={stats.revertidos.toString()} icon={RotateCcw} color="text-red-500 dark:text-red-400" />
        <StatCard title="Monto Total" value={`₲ ${(stats.totalMonto / 1000000).toFixed(1)}M`} icon={ArrowUpRight} color="text-gray-900 dark:text-white" />
      </div>

      {/* Search + Filters Toggle */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por número, descripción o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors border no-tap-highlight",
              showFilters || activeFiltersCount > 0
                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400"
                : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="h-5 w-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Estado</label>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="w-full px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight">
                <option value="todos">Todos</option>
                <option value="Borrador">Borrador</option>
                <option value="Posteado">Posteado</option>
                <option value="Revertido">Revertido</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Origen</label>
              <select value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)} className="w-full px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight">
                <option value="todos">Todos</option>
                <option value="XML SIFEN">XML SIFEN</option>
                <option value="Manual">Manual</option>
                <option value="Conciliación">Conciliación</option>
                <option value="Reversión">Reversión</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Empresa Activa</label>
              <div className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-semibold truncate">
                {activeEmpresaName || "Cargando..."}
              </div>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-1">Período</label>
              <div className="flex items-center gap-1.5">
                <input type="date" value={periodoDesde} onChange={(e) => setPeriodoDesde(e.target.value)} className="flex-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight" />
                <span className="text-gray-400 text-xs">—</span>
                <input type="date" value={periodoHasta} onChange={(e) => setPeriodoHasta(e.target.value)} className="flex-1 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 no-tap-highlight" />
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                <button
                  onClick={() => {
                    setFiltroEstado("todos");
                    setFiltroOrigen("todos");
                    setPeriodoDesde("2026-05-01");
                    setPeriodoHasta("2026-05-31");
                  }}
                  className="text-xs text-blue-500 dark:text-blue-400 hover:underline no-tap-highlight"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* List */}
        <div className={cn("lg:col-span-3", selectedAsiento && "lg:col-span-2")}>
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {/* Table Header (desktop) */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
              <div className="col-span-1">N°</div>
              <div className="col-span-2">Fecha</div>
              <div className="col-span-3">Descripción</div>
              <div className="col-span-1">Origen</div>
              <div className="col-span-1">Estado</div>
              <div className="col-span-2 text-right">Monto</div>
              <div className="col-span-1" />
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {asientosFiltrados.map((asiento, idx) => (
                <div
                  key={asiento.id}
                  className={cn(
                    "p-3 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer no-tap-highlight",
                    selectedAsiento?.id === asiento.id && "bg-blue-50 dark:bg-blue-500/5",
                    idx === listIndex && !selectedAsiento && "ring-1 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5"
                  )}
                  onClick={() => {
                    setListIndex(idx);
                    setSelectedAsiento(selectedAsiento?.id === asiento.id ? null : asiento);
                  }}
                >
                  {/* Mobile layout */}
                  <div className="sm:hidden">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-white text-sm font-mono font-medium">{asiento.numero}</span>
                        <StatusBadge estado={asiento.estado} />
                      </div>
                      <span className="font-mono text-sm text-gray-900 dark:text-white tabular-nums font-medium">₲ {asiento.total.toLocaleString("es-PY")}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs truncate mb-1">{asiento.descripcion}</p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{asiento.fecha}</span>
                      <span>·</span>
                      <span>{asiento.empresa}</span>
                      {asiento.sugerenciaIA && (
                        <>
                          <span>·</span>
                          <span className="text-purple-500 dark:text-purple-400 flex items-center gap-0.5"><Sparkles className="h-3 w-3" /> IA</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden sm:contents">
                    <div className="col-span-1 font-mono text-xs text-gray-900 dark:text-white">{asiento.numero}</div>
                    <div className="col-span-2 text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {asiento.fecha}
                    </div>
                    <div className="col-span-3 min-w-0">
                      <p className="text-xs text-gray-900 dark:text-white truncate">{asiento.descripcion}</p>
                      <p className="text-[10px] text-gray-400 truncate">{asiento.empresa}</p>
                    </div>
                    <div className="col-span-1">
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        asiento.origen === "XML SIFEN" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
                        asiento.origen === "Manual" && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                        asiento.origen === "Reversión" && "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
                        asiento.origen === "Conciliación" && "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                      )}>{asiento.origen}</span>
                    </div>
                    <div className="col-span-1"><StatusBadge estado={asiento.estado} /></div>
                    <div className="col-span-2 text-right font-mono text-xs text-gray-900 dark:text-white tabular-nums">₲ {asiento.total.toLocaleString("es-PY")}</div>
                    <div className="col-span-1 flex items-center justify-end gap-1">
                      {asiento.sugerenciaIA && <Sparkles className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAsiento(selectedAsiento?.id === asiento.id ? null : asiento); }}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors no-tap-highlight"
                      >
                        <Eye className="h-3.5 w-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {asientosFiltrados.length === 0 && (
              <div className="p-8 sm:p-12 text-center">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No se encontraron asientos</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Probá ajustando los filtros</p>
              </div>
            )}

            <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 text-xs flex items-center justify-between">
              <span>{asientosFiltrados.length} de {asientos.length} asientos</span>
              <span className="hidden sm:flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">j/k</kbd> navegar</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">↵</kbd> ver</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">n</kbd> nuevo</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 font-mono bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">/</kbd> buscar</span>
              </span>
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedAsiento && (
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden sticky top-20">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-900 dark:text-white text-sm font-medium">Detalle del Asiento</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-mono">{selectedAsiento.numero}</p>
                </div>
                <button
                  onClick={() => setSelectedAsiento(null)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors no-tap-highlight"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              <div className="p-3 sm:p-4 space-y-3">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <MetaItem label="Fecha" value={selectedAsiento.fecha} />
                  <MetaItem label="Empresa" value={selectedAsiento.empresa} />
                  <MetaItem label="Origen" value={selectedAsiento.origen} />
                  <MetaItem label="Estado" value={selectedAsiento.estado} />
                  {selectedAsiento.posteadoAt && (
                    <MetaItem label="Posteado" value={selectedAsiento.posteadoAt} />
                  )}
                  {selectedAsiento.revertidoDe && (
                    <MetaItem label="Revierte" value={selectedAsiento.revertidoDe} />
                  )}
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm">{selectedAsiento.descripcion}</p>

                {/* Lines */}
                {selectedAsiento.lineas.length > 0 && (
                  <div>
                    <h4 className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wide mb-2">Líneas</h4>
                    <div className="space-y-1">
                      {selectedAsiento.lineas.map((linea, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-purple-500 dark:text-purple-400 font-mono text-[10px]">{linea.cuenta}</span>
                            <span className="text-gray-700 dark:text-gray-300 text-xs truncate">{linea.nombreCuenta}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-gray-400 truncate">{linea.descripcion}</span>
                            <div className="flex gap-2 ml-2 shrink-0">
                              {linea.debito > 0 && <span className="font-mono text-green-600 dark:text-green-400 tabular-nums">D {linea.debito.toLocaleString("es-PY")}</span>}
                              {linea.credito > 0 && <span className="font-mono text-red-600 dark:text-red-400 tabular-nums">C {linea.credito.toLocaleString("es-PY")}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Totals */}
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Total</span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white tabular-nums">₲ {selectedAsiento.total.toLocaleString("es-PY")}</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-3 space-y-2">
                  <h4 className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wide mb-2">Acciones</h4>
                  {selectedAsiento.estado === "Borrador" && (
                    <button className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs transition-colors no-tap-highlight">
                      <CheckCircle2 className="h-4 w-4" />
                      Publicar Asiento
                    </button>
                  )}
                  {selectedAsiento.estado === "Posteado" && !showRevertConfirm && (
                    <button
                      onClick={() => setShowRevertConfirm(selectedAsiento.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs transition-colors no-tap-highlight"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Revertir Asiento
                    </button>
                  )}
                  {showRevertConfirm === selectedAsiento.id && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-red-600 dark:text-red-400 text-xs">
                          ¿Revertir este asiento? Se creará un contra-asiento con débitos y créditos invertidos.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRevert(selectedAsiento.id)}
                          className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-colors no-tap-highlight"
                        >
                          Confirmar Reversión
                        </button>
                        <button
                          onClick={() => setShowRevertConfirm(null)}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                  {selectedAsiento.estado === "Borrador" && (
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight">
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(selectedAsiento.id)}
                        className="p-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors border border-red-200 dark:border-red-500/20 no-tap-highlight"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs transition-colors border border-gray-200 dark:border-gray-700 no-tap-highlight">
                    <Copy className="h-3.5 w-3.5" />
                    Duplicar Asiento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-gray-500 dark:text-gray-400" }: { title: string; value: string; icon: any; color?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-3 sm:p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wide">{title}</span>
        <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", color)} />
      </div>
      <p className={cn("text-lg sm:text-xl lg:text-2xl font-bold", color)}>{value}</p>
    </div>
  );
}

function StatusBadge({ estado }: { estado: AsientoEstado }) {
  return (
    <span className={cn(
      "inline-flex px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium",
      estado === "Posteado" ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20" :
      estado === "Borrador" ? "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20" :
      "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20"
    )}>
      {estado}
    </span>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-gray-400 text-[10px]">{label}</span>
      <p className="text-gray-700 dark:text-gray-300 text-xs truncate">{value}</p>
    </div>
  );
}
