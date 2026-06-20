"use client";

import { useState, useMemo } from "react";
import {
  Building2, Users, Cpu, Clock, CheckCircle2, AlertCircle,
  Search, Shield, ToggleLeft, ToggleRight, Check, Play,
  Plus, DollarSign, ArrowRight, UserCheck, ShieldAlert,
  Zap, Calendar, HelpCircle, Key, RefreshCw, Sliders, Info,
  ChevronRight, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuthStore, Entity } from "@/lib/auth-store";

type Tenant = Entity;

export default function SuperadminPage() {
  const { availableEntities, updateTenants } = useAuthStore();
  const tenants = availableEntities;
  
  const setTenants = (updater: Tenant[] | ((prev: Tenant[]) => Tenant[])) => {
    const next = typeof updater === "function" ? updater(tenants) : updater;
    updateTenants(next);
  };
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>("t1");
  const [activeTab, setActiveTab] = useState<"tenants" | "settings">("tenants");

  // Global Superadmin configuration
  const [maintenance, setMaintenance] = useState(false);
  const [apiLimitWarning, setApiLimitWarning] = useState(false);
  const [degustationPeriod, setDegustationPeriod] = useState(7);

  // Selected Tenant computed properties
  const selectedTenant = useMemo(() =>
    tenants.find(t => t.id === selectedTenantId) || null,
    [tenants, selectedTenantId]
  );

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        t.legalName.toLowerCase().includes(q) ||
        t.ruc.includes(q) ||
        (t.tradeName && t.tradeName.toLowerCase().includes(q));

      const matchesPlan = filterPlan === "all" || t.plan === filterPlan;
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [tenants, search, filterPlan, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const active = tenants.filter(t => t.status === "active").length;
    const trial = tenants.filter(t => t.status === "trial").length;
    const mrr = tenants.reduce((sum, t) => sum + (t.status === "active" ? t.mrr : 0), 0);
    const usersCount = tenants.reduce((sum, t) => sum + t.users.length, 0);
    return { active, trial, mrr, usersCount };
  }, [tenants]);

  // Action: Toggle a feature for a tenant
  function toggleTenantFeature(feature: keyof Tenant["features"]) {
    if (!selectedTenantId) return;
    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        return {
          ...t,
          features: {
            ...t.features,
            [feature]: !t.features[feature]
          }
        };
      }
      return t;
    }));
  }

  // Action: Change plan for tenant
  function handlePlanChange(newPlan: Tenant["plan"]) {
    if (!selectedTenantId) return;
    const planPrices: Record<Tenant["plan"], number> = {
      starter: 180000,
      pro: 385000,
      inhouse: 440000,
      enterprise: 650000,
      corporativo: 0
    };

    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        return {
          ...t,
          plan: newPlan,
          mrr: planPrices[newPlan]
        };
      }
      return t;
    }));
  }

  // Action: Adjust Trial Days
  function handleExtendTrial(days: number) {
    if (!selectedTenantId) return;
    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        return {
          ...t,
          status: t.status === "suspended" ? "trial" : t.status,
          trialDaysTotal: t.trialDaysTotal + days,
          trialDaysLeft: t.trialDaysLeft + days
        };
      }
      return t;
    }));
  }

  // Action: Enable Superior Plan Degustation
  function handleDegustation() {
    if (!selectedTenantId || !selectedTenant) return;
    // Upgrade starter -> pro, pro -> enterprise
    let targetPlan: Tenant["plan"] = selectedTenant.plan;
    if (selectedTenant.plan === "starter") targetPlan = "pro";
    else if (selectedTenant.plan === "pro") targetPlan = "enterprise";

    handlePlanChange(targetPlan);
    handleExtendTrial(degustationPeriod);
  }

  // Action: Change status (Active / Suspended)
  function toggleTenantStatus() {
    if (!selectedTenantId || !selectedTenant) return;
    const targetStatus: Tenant["status"] = selectedTenant.status === "active" ? "suspended" : "active";
    setTenants(prev => prev.map(t => {
      if (t.id === selectedTenantId) {
        return {
          ...t,
          status: targetStatus
        };
      }
      return t;
    }));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* SaaS Admin Banner */}
      <div className="bg-gradient-to-r from-[#104c91] to-[#0a2244] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[#00a651] font-black uppercase tracking-wider text-[10px] mb-2 bg-[#00a651]/15 px-2.5 py-1 rounded-full w-fit">
              <Shield className="h-3 w-3" />
              <span>Consola Superadmin de Control SaaS</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">InteliCont SaaS Control Hub</h1>
            <p className="text-blue-100/70 text-sm mt-1">Supervisión en tiempo real de contribuyentes, licencias y capas de Inteligencia Artificial.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab("tenants")} 
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === "tenants" ? "bg-[#00a651] text-white shadow-lg shadow-[#00a651]/20" : "bg-white/10 text-white hover:bg-white/15")}
            >
              Directorio Tenants
            </button>
            <button 
              onClick={() => setActiveTab("settings")} 
              className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === "settings" ? "bg-[#00a651] text-white shadow-lg shadow-[#00a651]/20" : "bg-white/10 text-white hover:bg-white/15")}
            >
              Ajustes SaaS Globales
            </button>
          </div>
        </div>
      </div>

      {/* global KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Tenants Activos" value={stats.active.toString()} sub="Excluye trials y suspendidos" icon={Building2} variant="primary" />
        <KpiCard title="MRR Consolidado" value={`Gs. ${stats.mrr.toLocaleString("es-PY")}`} sub="Facturación activa mensual" icon={DollarSign} variant="success" />
        <KpiCard title="Usuarios Totales" value={stats.usersCount.toString()} sub="Cuentas activas mapeadas" icon={Users} variant="accent" />
        <KpiCard title="Consumo Gemini Free" value="4.2 req/min" sub="Capa gratuita (Límite: 15 RPM)" icon={Cpu} variant="neutral" progress={28} />
      </div>

      {activeTab === "tenants" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Tenant Search, filters and list */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Filtering bar */}
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  placeholder="Buscar tenant por RUC, razón social..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={filterPlan} 
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="all">Todos los Planes</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="inhouse">In-House</option>
                  <option value="enterprise">Estudio / Enterprise</option>
                  <option value="corporativo">Corporativo</option>
                </select>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Activos</option>
                  <option value="trial">En Demo</option>
                  <option value="suspended">Suspendidos</option>
                </select>
              </div>
            </div>

            {/* Tenant directory list */}
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Razón Social / RUC</th>
                      <th className="text-left px-4 py-3">Plan</th>
                      <th className="text-left px-4 py-3">Usuarios</th>
                      <th className="text-left px-4 py-3">Estado / Licencia</th>
                      <th className="text-right px-4 py-3">MRR</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                    {filteredTenants.length > 0 ? (
                      filteredTenants.map((t) => (
                        <tr 
                          key={t.id} 
                          onClick={() => setSelectedTenantId(t.id)}
                          className={cn(
                            "hover:bg-gray-50 dark:hover:bg-gray-800/20 cursor-pointer transition-colors",
                            selectedTenantId === t.id && "bg-primary-50/40 dark:bg-[#104c91]/10"
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900 dark:text-white">{t.legalName}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">RUC {t.ruc} {t.tradeName && `· ${t.tradeName}`}</div>
                          </td>
                          <td className="px-4 py-3 capitalize">
                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border",
                              t.plan === "starter" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-200",
                              t.plan === "pro" && "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200",
                              t.plan === "inhouse" && "bg-purple-50 dark:bg-purple-500/10 text-purple-600 border-purple-200",
                              t.plan === "enterprise" && "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-200",
                              t.plan === "corporativo" && "bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200"
                            )}>
                              {t.plan === "enterprise" ? "Estudio / Ent" : t.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-semibold">{t.users.length}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {t.status === "trial" ? (
                              <div className="space-y-1 max-w-[100px]">
                                <div className="flex justify-between text-[9px] text-gray-400 font-bold">
                                  <span>Demo</span>
                                  <span>{t.trialDaysLeft}d rest.</span>
                                </div>
                                <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(t.trialDaysLeft / t.trialDaysTotal) * 100}%` }} />
                                </div>
                              </div>
                            ) : (
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold",
                                t.status === "active" ? "bg-green-50 dark:bg-green-500/10 text-green-600" : "bg-red-50 dark:bg-red-500/10 text-red-600"
                              )}>
                                {t.status === "active" ? "Activo" : "Suspendido"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                            {t.mrr > 0 ? `₲ ${t.mrr.toLocaleString("es-PY")}` : "Gs. 0"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          Ningún tenant coincide con el filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Active Tenant Management Panel */}
          <div className="lg:col-span-4">
            {selectedTenant ? (
              <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 lg:p-6 space-y-6 shadow-xl sticky top-6">
                
                {/* Panel Header */}
                <div className="pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{selectedTenant.legalName}</h2>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">RUC {selectedTenant.ruc}</p>
                    </div>
                    <button 
                      onClick={toggleTenantStatus}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors",
                        selectedTenant.status === "active" 
                          ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200" 
                          : "bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                      )}
                    >
                      {selectedTenant.status === "active" ? "Suspender" : "Activar"}
                    </button>
                  </div>
                </div>

                {/* Tab: Users inside Tenant */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Usuarios Registrados ({selectedTenant.users.length})</h3>
                    <UserCheck className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800/30 overflow-hidden">
                    {selectedTenant.users.map((u, i) => (
                      <div key={i} className="p-3 text-xs flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{u.email}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{u.role} · Visto: {u.lastLogin}</p>
                        </div>
                        <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                          u.status === "active" && "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500",
                          u.status === "invited" && "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500",
                          u.status === "suspended" && "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500"
                        )}>
                          {u.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tab: Feature Toggles */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Funcionalidades Habilitadas</h3>
                    <Sliders className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="space-y-2.5">
                    <FeatureToggle 
                      label="Emisión / Recepción SIFEN" 
                      desc="Conexión de comprobantes con la DNIT"
                      active={selectedTenant.features.sifen} 
                      onToggle={() => toggleTenantFeature("sifen")}
                    />
                    <FeatureToggle 
                      label="Brain AI Auditor™" 
                      desc="Sugerencias de asientos por Gemini"
                      active={selectedTenant.features.brainAi} 
                      onToggle={() => toggleTenantFeature("brainAi")}
                    />
                    <FeatureToggle 
                      label="API Bancaria Nativa" 
                      desc="Conciliación con Itaú y GNB"
                      active={selectedTenant.features.bankApi} 
                      onToggle={() => toggleTenantFeature("bankApi")}
                    />
                    <FeatureToggle 
                      label="Multi-usuario Avanzado" 
                      desc="Más de 3 contadores asociados"
                      active={selectedTenant.features.multiUser} 
                      onToggle={() => toggleTenantFeature("multiUser")}
                    />
                  </div>
                </div>

                {/* Tab: Subscription & Trial Adjustments */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Plan Suscripción</label>
                    <select 
                      value={selectedTenant.plan} 
                      onChange={(e) => handlePlanChange(e.target.value as Tenant["plan"])}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none"
                    >
                      <option value="starter">Starter — Gs. 180.000 / mes</option>
                      <option value="pro">Pro — Gs. 385.000 / mes</option>
                      <option value="inhouse">In-House — Gs. 440.000 / mes</option>
                      <option value="enterprise">Estudio / Enterprise — Gs. 650.000 / mes</option>
                      <option value="corporativo">Corporativo — Consultar / Custom</option>
                    </select>
                  </div>

                  {/* Demo/Degustation Panel */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Ajustes de Degustación / Trials</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleExtendTrial(7)} 
                        className="flex-1 py-1.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-[10px] font-bold text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100/50"
                      >
                        +7 días Demo
                      </button>
                      <button 
                        onClick={() => handleExtendTrial(14)} 
                        className="flex-1 py-1.5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-[10px] font-bold text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100/50"
                      >
                        +14 días Demo
                      </button>
                    </div>

                    <button 
                      onClick={handleDegustation}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/15"
                    >
                      <Sparkles className="h-3 w-3" /> Degustar Plan Superior (+{degustationPeriod}d)
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-dashed border-gray-300 dark:border-gray-800 rounded-2xl p-8 text-center text-gray-500">
                Seleccioná un tenant del directorio para administrar sus licencias, usuarios y habilitar degustaciones.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* SaaS global settings view */
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ajustes Globales del Sistema</h2>
            <p className="text-xs text-gray-500 mt-1">Preferencias para toda la plataforma contable.</p>
          </div>

          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Modo Mantenimiento Global</h4>
                <p className="text-[10px] text-gray-500">Muestra una pantalla de espera y bloquea el acceso a todas las bases de datos.</p>
              </div>
              <button 
                onClick={() => setMaintenance(!maintenance)}
                className="focus:outline-none"
              >
                {maintenance ? <ToggleRight className="h-9 w-9 text-red-500" /> : <ToggleLeft className="h-9 w-9 text-gray-400" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Alerta Límite de Gemini (Free Tier)</h4>
                <p className="text-[10px] text-gray-500">Muestra una barra de advertencia si la cuota del API gratuita sobrepasa 10 RPM.</p>
              </div>
              <button 
                onClick={() => setApiLimitWarning(!apiLimitWarning)}
                className="focus:outline-none"
              >
                {apiLimitWarning ? <ToggleRight className="h-9 w-9 text-[#00a651]" /> : <ToggleLeft className="h-9 w-9 text-gray-400" />}
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Duración de Degustaciones (días)</label>
              <div className="flex gap-2">
                {[5, 7, 10, 14].map((d) => (
                  <button 
                    key={d} 
                    onClick={() => setDegustationPeriod(d)}
                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg border transition-all",
                      degustationPeriod === d 
                        ? "bg-[#104c91] text-white border-[#104c91]" 
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                    )}
                  >
                    {d} días
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 flex gap-3">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">Nota del Entorno de Desarrollo</h4>
                <p className="text-[10px] text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
                  Las claves de API configuradas aquí impactan los buckets de prueba de Supabase y el motor contable simulado local. En producción, la configuración se consolida a través del panel de variables de entorno de Vercel.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function KpiCard({ title, value, sub, icon: Icon, variant, progress }: {
  title: string; value: string; sub: string; icon: any;
  variant: "primary" | "success" | "accent" | "neutral";
  progress?: number;
}) {
  const styles = {
    primary: "from-[#104c91]/20 to-[#104c91]/5 text-[#104c91] border-[#104c91]/20 dark:border-[#104c91]/10",
    success: "from-[#00a651]/20 to-[#00a651]/5 text-[#00a651] border-[#00a651]/20 dark:border-[#00a651]/10",
    accent: "from-purple-500/20 to-purple-500/5 text-purple-600 border-purple-500/20 dark:border-purple-500/10",
    neutral: "from-zinc-500/10 to-zinc-500/5 text-zinc-500 border-zinc-200 dark:border-zinc-800",
  };

  return (
    <div className={cn(
      "bg-white dark:bg-gray-900/50 border rounded-2xl p-5 relative overflow-hidden group hover:scale-[1.01] hover:shadow-xl transition-all duration-300",
      "bg-gradient-to-br", styles[variant]
    )}>
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</span>
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shadow-md",
            variant === "primary" && "bg-[#104c91] text-white",
            variant === "success" && "bg-[#00a651] text-white",
            variant === "accent" && "bg-purple-500 text-white",
            variant === "neutral" && "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          )}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div>
          <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight font-mono">{value}</h4>
          <p className="text-[10px] text-gray-400 font-bold mt-1">{sub}</p>
        </div>

        {progress !== undefined && (
          <div className="space-y-1 pt-1">
            <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#00a651] rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureToggle({ label, desc, active, onToggle }: {
  label: string; desc: string; active: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/10 border border-gray-100 dark:border-gray-800 rounded-xl">
      <div className="min-w-0">
        <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">{label}</h4>
        <p className="text-[9px] text-gray-400 mt-0.5 truncate">{desc}</p>
      </div>
      <button onClick={onToggle} className="focus:outline-none shrink-0 ml-2">
        {active ? (
          <ToggleRight className="h-8 w-8 text-[#00a651]" />
        ) : (
          <ToggleLeft className="h-8 w-8 text-gray-400" />
        )}
      </button>
    </div>
  );
}
