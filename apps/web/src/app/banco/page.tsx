"use client";

import { useState } from "react";
import {
  CreditCard,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { FeatureGate } from "@/app/_components/feature-gate";
import { cn } from "@/lib/utils";

type ConciliacionStatus = "conciliado" | "pendiente" | "diferencia";

interface Movimiento {
  id: string;
  fecha: string;
  descripcion: string;
  referencia: string;
  monto: number;
  tipo: "ingreso" | "egreso";
  status: ConciliacionStatus;
  asientoId?: string;
  banco: string;
}

const MOCK_MOVIMIENTOS: Movimiento[] = [
  {
    id: "1",
    fecha: "2026-05-01",
    descripcion: "Transferencia Tecnología Asunción SRL",
    referencia: "TXN-20260501-001",
    monto: 16500000,
    tipo: "ingreso",
    status: "conciliado",
    asientoId: "JE-001235",
    banco: "Banco Galicia",
  },
  {
    id: "2",
    fecha: "2026-05-02",
    descripcion: "Pago ANDE - Factura 45892",
    referencia: "PAG-20260502-045",
    monto: 850000,
    tipo: "egreso",
    status: "conciliado",
    asientoId: "JE-001236",
    banco: "Banco Galicia",
  },
  {
    id: "3",
    fecha: "2026-05-03",
    descripcion: "Cheque 001-234 a ImportEste",
    referencia: "CHQ-001-000234",
    monto: 11000000,
    tipo: "egreso",
    status: "pendiente",
    banco: "Banco Itau",
  },
  {
    id: "4",
    fecha: "2026-05-05",
    descripcion: "Depósito AgroGuaraní",
    referencia: "DEP-20260505-012",
    monto: 7000000,
    tipo: "ingreso",
    status: "pendiente",
    banco: "Banco Galicia",
  },
  {
    id: "5",
    fecha: "2026-05-06",
    descripcion: "Comisión bancaria mensual",
    referencia: "COM-202605",
    monto: 45000,
    tipo: "egreso",
    status: "diferencia",
    banco: "Banco Itau",
  },
];

const BANCOS = ["Todos", "Banco Galicia", "Banco Itau", "Banco Nacional"];

export default function ConciliacionPage() {
  const authStoreSelectedEntity = useAuthStore((state) => state.selectedEntity);

  if (authStoreSelectedEntity?.features && !authStoreSelectedEntity.features.bankApi) {
    return (
      <FeatureGate
        feature="bankApi"
        title="API Bancaria Desactivada"
        description="La conciliación bancaria y la sincronización con entidades bancarias como Itaú o GNB están desactivadas en tu plan actual. Habilítalo en el panel superadmin."
      >
        <div />
      </FeatureGate>
    );
  }

  const [search, setSearch] = useState("");
  const [banco, setBanco] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = MOCK_MOVIMIENTOS.filter((m) => {
    const matchesSearch =
      m.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      m.referencia.toLowerCase().includes(search.toLowerCase());
    const matchesBanco = banco === "Todos" || m.banco === banco;
    const matchesStatus = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesBanco && matchesStatus;
  });

  const totalIngresos = MOCK_MOVIMIENTOS.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
  const totalEgresos = MOCK_MOVIMIENTOS.filter((m) => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0);
  const conciliados = MOCK_MOVIMIENTOS.filter((m) => m.status === "conciliado").length;
  const pendientes = MOCK_MOVIMIENTOS.filter((m) => m.status === "pendiente").length;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-white">Conciliación Bancaria</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Conciliá movimientos bancarios con asientos contables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors border border-gray-700">
            <RefreshCw className="h-4 w-4" />
            Sincronizar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-4 w-4 text-green-400" />
            <span className="text-gray-500 text-xs">Total Ingresos</span>
          </div>
          <p className="text-green-400 font-mono text-lg tabular-nums font-bold">₲ {totalIngresos.toLocaleString("es-PY")}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-red-400" />
            <span className="text-gray-500 text-xs">Total Egresos</span>
          </div>
          <p className="text-red-400 font-mono text-lg tabular-nums font-bold">₲ {totalEgresos.toLocaleString("es-PY")}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            <span className="text-gray-500 text-xs">Conciliados</span>
          </div>
          <p className="text-white text-lg font-bold">{conciliados} <span className="text-gray-500 text-sm font-normal">/ {MOCK_MOVIMIENTOS.length}</span></p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-400" />
            <span className="text-gray-500 text-xs">Pendientes</span>
          </div>
          <p className="text-yellow-400 text-lg font-bold">{pendientes}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por descripción o referencia..."
              className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-gray-500"
            />
          </div>
          <select
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {BANCOS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">Todos</option>
            <option value="conciliado">Conciliados</option>
            <option value="pendiente">Pendientes</option>
            <option value="diferencia">Diferencias</option>
          </select>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-800/50">
          {filtered.map((mov) => (
            <div
              key={mov.id}
              className="flex items-center justify-between p-4 hover:bg-gray-800/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  mov.tipo === "ingreso" ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  {mov.tipo === "ingreso" ? (
                    <ArrowDownLeft className="h-5 w-5 text-green-400" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{mov.descripcion}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-xs font-mono">{mov.referencia}</span>
                    <span className="text-gray-600 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{mov.fecha}</span>
                    <span className="text-gray-600 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{mov.banco}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className={cn(
                    "font-mono text-sm tabular-nums font-medium",
                    mov.tipo === "ingreso" ? "text-green-400" : "text-red-400"
                  )}>
                    {mov.tipo === "ingreso" ? "+" : "-"} ₲ {mov.monto.toLocaleString("es-PY")}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      mov.status === "conciliado" && "bg-green-500/10 text-green-400",
                      mov.status === "pendiente" && "bg-yellow-500/10 text-yellow-400",
                      mov.status === "diferencia" && "bg-red-500/10 text-red-400"
                    )}>
                      {mov.status === "conciliado" && "✓ Conciliado"}
                      {mov.status === "pendiente" && "⏳ Pendiente"}
                      {mov.status === "diferencia" && "⚠ Diferencia"}
                    </span>
                  </div>
                  {mov.asientoId && (
                    <p className="text-gray-500 text-xs mt-0.5 font-mono">{mov.asientoId}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-800 text-gray-500 text-xs">
          {filtered.length} de {MOCK_MOVIMIENTOS.length} movimientos
        </div>
      </div>
    </div>
  );
}
