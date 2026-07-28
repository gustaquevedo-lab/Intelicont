"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSuperadminTenantsAction,
  getSuperadminUsersAction,
  createTenantAction,
  updateTenantCommercialsAction,
  resetUserPasswordAction
} from "@/lib/actions";
import {
  Building2, Users, Search, ToggleLeft, ToggleRight, Check,
  Plus, DollarSign, Key, RefreshCw, Info, AlertCircle, Sparkles,
  Shield, UserCheck, CheckCircle2, X, Briefcase, User, Zap, Globe, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tenant = {
  id: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
  entityType: string | null;
  plan: string;
  features: any; // Record<string, boolean>
  mrr: number;
  status: string | null;
  tenantType: "STUDIO" | "TAXPAYER";
  studioId: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: any;
};

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: any;
};

const PLAN_DEFAULTS: Record<string, { mrr: number; features: Record<string, boolean> }> = {
  starter: {
    mrr: 180000,
    features: { sifenSync: false, aiTripleImputation: false, cgrReports: false, bankApi: false, multiUser: false }
  },
  pro: {
    mrr: 385000,
    features: { sifenSync: true, aiTripleImputation: true, cgrReports: false, bankApi: true, multiUser: true }
  },
  inhouse: {
    mrr: 440000,
    features: { sifenSync: true, aiTripleImputation: true, cgrReports: true, bankApi: true, multiUser: true }
  },
  enterprise: {
    mrr: 650000,
    features: { sifenSync: true, aiTripleImputation: true, cgrReports: true, bankApi: true, multiUser: true }
  }
};

export default function SuperadminPage() {
  const queryClient = useQueryClient();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<"studios" | "taxpayers" | "users">("studios");

  // Search states
  const [tenantSearch, setTenantSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Selected entities for editing
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Password reset state
  const [resettingUser, setResettingUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // New Studio / Taxpayer Modal states
  const [showCreateStudioModal, setShowCreateStudioModal] = useState(false);
  const [showCreateTaxpayerModal, setShowCreateTaxpayerModal] = useState(false);

  const [newStudio, setNewStudio] = useState({
    ruc: "",
    legalName: "",
    tradeName: "",
    plan: "pro",
    mrr: 385000,
    contactEmail: "",
    contactPhone: "",
    features: {
      sifenSync: true,
      aiTripleImputation: true,
      cgrReports: false,
      bankApi: true,
      multiUser: true
    } as Record<string, boolean>
  });

  const [newTaxpayer, setNewTaxpayer] = useState({
    ruc: "",
    legalName: "",
    tradeName: "",
    entityType: "COMMERCIAL" as "COMMERCIAL" | "NON_PROFIT_NGO" | "NON_PROFIT_PUBLIC" | "ASSOCIATION",
    studioId: ""
  });

  // Queries
  const { data: tenants = [], isLoading: loadingTenants } = useQuery<Tenant[]>({
    queryKey: ["superadmin-tenants"],
    queryFn: getSuperadminTenantsAction
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery<UserRecord[]>({
    queryKey: ["superadmin-users"],
    queryFn: getSuperadminUsersAction
  });

  // Mutations
  const updateCommercialsMutation = useMutation({
    mutationFn: (args: { entityId: string; data: any }) =>
      updateTenantCommercialsAction(args.entityId, args.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
    }
  });

  const createTenantMutation = useMutation({
    mutationFn: (data: any) => createTenantAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
      setShowCreateStudioModal(false);
      setShowCreateTaxpayerModal(false);
      // Reset forms
      setNewStudio({
        ruc: "",
        legalName: "",
        tradeName: "",
        plan: "pro",
        mrr: 385000,
        contactEmail: "",
        contactPhone: "",
        features: {
          sifenSync: true,
          aiTripleImputation: true,
          cgrReports: false,
          bankApi: true,
          multiUser: true
        }
      });
      setNewTaxpayer({
        ruc: "",
        legalName: "",
        tradeName: "",
        entityType: "COMMERCIAL",
        studioId: ""
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (args: { userId: string; pass: string }) =>
      resetUserPasswordAction(args.userId, args.pass),
    onSuccess: () => {
      setResetSuccess(true);
      setNewPassword("");
      setTimeout(() => {
        setResetSuccess(false);
        setResettingUser(null);
      }, 2000);
    }
  });

  // Computed lists
  const studios = tenants.filter(t => t.tenantType === "STUDIO");
  const taxpayers = tenants.filter(t => t.tenantType === "TAXPAYER");

  const filteredStudios = studios.filter(s => {
    const q = tenantSearch.toLowerCase();
    return (
      s.legalName.toLowerCase().includes(q) ||
      s.ruc.includes(q) ||
      (s.tradeName && s.tradeName.toLowerCase().includes(q))
    );
  });

  const filteredTaxpayers = taxpayers.filter(t => {
    const q = tenantSearch.toLowerCase();
    return (
      t.legalName.toLowerCase().includes(q) ||
      t.ruc.includes(q) ||
      (t.tradeName && t.tradeName.toLowerCase().includes(q))
    );
  });

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q))
    );
  });

  const selectedTenant = tenants.find(t => t.id === selectedTenantId) || null;

  // Toggle feature for tenant
  function handleToggleFeature(featureKey: string) {
    if (!selectedTenant) return;
    const currentFeatures = selectedTenant.features || {};
    const updatedFeatures = {
      ...currentFeatures,
      [featureKey]: !currentFeatures[featureKey]
    };
    updateCommercialsMutation.mutate({
      entityId: selectedTenant.id,
      data: { features: updatedFeatures }
    });
  }

  // Change plan for tenant
  function handlePlanChange(newPlan: string) {
    if (!selectedTenant) return;
    const planPrices: Record<string, number> = {
      starter: 180000,
      pro: 385000,
      inhouse: 440000,
      enterprise: 650000
    };
    updateCommercialsMutation.mutate({
      entityId: selectedTenant.id,
      data: {
        plan: newPlan,
        mrr: planPrices[newPlan] || 0
      }
    });
  }

  // Change tenant status
  function handleStatusChange(newStatus: "active" | "inactive" | "closed") {
    if (!selectedTenant) return;
    updateCommercialsMutation.mutate({
      entityId: selectedTenant.id,
      data: { status: newStatus }
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in no-theme-transition">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
            <Shield className="h-3.5 w-3.5" />
            <span>SaaS Control Center</span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Superadmin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Gestión global de base de datos de Estudios Contables, Contribuyentes Asociados y Planes de Suscripción.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateStudioModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white hover:bg-primary-dark transition-all rounded-xl text-sm font-black shadow-xl shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            Crear Estudio Contable
          </button>
          <button
            onClick={() => setShowCreateTaxpayerModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-800 text-white hover:bg-gray-700 transition-all border border-gray-700/50 rounded-xl text-sm font-black"
          >
            <Plus className="h-4 w-4" />
            Registrar Contribuyente
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-gray-500">Estudios Contables</span>
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <h4 className="text-3xl font-black text-gray-900 dark:text-white">{studios.length}</h4>
          <p className="text-xs font-semibold text-gray-400 mt-1">Clientes de la plataforma</p>
        </div>

        <div className="card rounded-2xl p-6 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-gray-500">Contribuyentes</span>
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
          <h4 className="text-3xl font-black text-gray-900 dark:text-white">{taxpayers.length}</h4>
          <p className="text-xs font-semibold text-gray-400 mt-1">Empresas contables activas</p>
        </div>

        <div className="card rounded-2xl p-6 bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-gray-500">Usuarios Registrados</span>
            <Users className="h-5 w-5 text-emerald-500" />
          </div>
          <h4 className="text-3xl font-black text-gray-900 dark:text-white">{users.length}</h4>
          <p className="text-xs font-semibold text-gray-400 mt-1">Cuentas creadas</p>
        </div>

        <div className="card rounded-2xl p-6 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-gray-500">MRR Consolidado</span>
            <DollarSign className="h-5 w-5 text-amber-500" />
          </div>
          <h4 className="text-3xl font-black text-gray-900 dark:text-white">
            Gs. {studios.reduce((sum, t) => sum + (t.mrr || 0), 0).toLocaleString("es-PY")}
          </h4>
          <p className="text-xs font-semibold text-gray-400 mt-1">Facturación de Estudios</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-gray-200/50 dark:border-gray-800/50">
        <button
          onClick={() => { setActiveTab("studios"); setSelectedTenantId(null); }}
          className={cn(
            "px-6 py-3 text-sm font-black border-b-2 transition-all uppercase tracking-wider",
            activeTab === "studios"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          Estudios Contables ({studios.length})
        </button>
        <button
          onClick={() => { setActiveTab("taxpayers"); setSelectedTenantId(null); }}
          className={cn(
            "px-6 py-3 text-sm font-black border-b-2 transition-all uppercase tracking-wider",
            activeTab === "taxpayers"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          Contribuyentes ({taxpayers.length})
        </button>
        <button
          onClick={() => { setActiveTab("users"); setSelectedTenantId(null); }}
          className={cn(
            "px-6 py-3 text-sm font-black border-b-2 transition-all uppercase tracking-wider",
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          Usuarios ({users.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "studios" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar estudios por RUC, Razón Social..."
                value={tenantSearch}
                onChange={e => setTenantSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-semibold outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="card rounded-2xl overflow-hidden divide-y divide-gray-200/30 dark:divide-gray-800/30">
              {filteredStudios.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-semibold">
                  No se encontraron estudios contables.
                </div>
              ) : (
                filteredStudios.map(s => {
                  const contribuyentesAsociados = taxpayers.filter(t => t.studioId === s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedTenantId(s.id)}
                      className={cn(
                        "p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/5",
                        selectedTenantId === s.id && "bg-primary/5 dark:bg-primary/10 border-l-4 border-primary"
                      )}
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white">
                          {s.legalName}
                        </h4>
                        <p className="text-xs text-gray-500 font-semibold">
                          RUC: {s.ruc} | Contribuyentes: <span className="text-blue-500 font-bold">{contribuyentesAsociados.length}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {s.plan}
                        </span>
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                          s.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {s.status || "active"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Edit Studio Panel */}
          <div className="lg:col-span-4">
            {selectedTenant && selectedTenant.tenantType === "STUDIO" ? (
              <div className="card rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">
                      {selectedTenant.legalName}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      RUC: {selectedTenant.ruc}
                    </p>
                  </div>
                </div>

                {/* Plan Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Plan de Suscripción</label>
                  <select
                    value={selectedTenant.plan}
                    onChange={e => handlePlanChange(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                  >
                    <option value="starter">Starter (Gs. 180.000)</option>
                    <option value="pro">Pro (Gs. 385.000)</option>
                    <option value="inhouse">InHouse / ESFL (Gs. 440.000)</option>
                    <option value="enterprise">Enterprise (Gs. 650.000)</option>
                  </select>
                </div>

                {/* Contact email/phone */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Email Administrativo</label>
                  <input
                    type="email"
                    value={selectedTenant.contactEmail || ""}
                    onChange={e => updateCommercialsMutation.mutate({ entityId: selectedTenant.id, data: { contactEmail: e.target.value } })}
                    className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Teléfono</label>
                  <input
                    type="text"
                    value={selectedTenant.contactPhone || ""}
                    onChange={e => updateCommercialsMutation.mutate({ entityId: selectedTenant.id, data: { contactPhone: e.target.value } })}
                    className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold"
                  />
                </div>

                {/* Status Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Estado de Cuenta</label>
                  <select
                    value={selectedTenant.status || "active"}
                    onChange={e => handleStatusChange(e.target.value as any)}
                    className="w-full py-2.5 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="closed">Suspendido</option>
                  </select>
                </div>

                {/* Contribuyentes list */}
                <div className="pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
                  <label className="text-[10px] font-black uppercase text-gray-400 block mb-2">Contribuyentes Vinculados</label>
                  <div className="space-y-1 max-h-[160px] overflow-y-auto">
                    {taxpayers.filter(t => t.studioId === selectedTenant.id).map(ct => (
                      <div key={ct.id} className="p-2 bg-gray-50 dark:bg-gray-800/40 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300">
                        {ct.legalName} <span className="text-[9px] text-gray-500 font-mono block">RUC: {ct.ruc}</span>
                      </div>
                    ))}
                    {taxpayers.filter(t => t.studioId === selectedTenant.id).length === 0 && (
                      <p className="text-xs text-gray-500 italic">Ningún contribuyente asignado.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card rounded-2xl p-8 text-center text-gray-400 font-semibold border-dashed border-2">
                Seleccioná un estudio contable de la lista para gestionar datos comerciales o ver sus contribuyentes.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "taxpayers" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar contribuyentes por RUC, Razón Social..."
                value={tenantSearch}
                onChange={e => setTenantSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-semibold outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="card rounded-2xl overflow-hidden divide-y divide-gray-200/30 dark:divide-gray-800/30">
              {filteredTaxpayers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-semibold">
                  No se encontraron contribuyentes registrados.
                </div>
              ) : (
                filteredTaxpayers.map(t => {
                  const estudio = studios.find(s => s.id === t.studioId);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTenantId(t.id)}
                      className={cn(
                        "p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/5",
                        selectedTenantId === t.id && "bg-primary/5 dark:bg-primary/10 border-l-4 border-primary"
                      )}
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white">
                          {t.legalName}
                        </h4>
                        <p className="text-xs text-gray-500 font-semibold">
                          RUC: {t.ruc} | Tipo: {t.entityType || "COMMERCIAL"}
                        </p>
                        {estudio && (
                          <p className="text-[10px] text-gray-400 font-bold">
                            Gestionado por: <span className="text-primary">{estudio.legalName}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                          t.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {t.status || "active"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Edit Taxpayer Panel */}
          <div className="lg:col-span-4">
            {selectedTenant && selectedTenant.tenantType === "TAXPAYER" ? (
              <div className="card rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">
                      {selectedTenant.legalName}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      RUC: {selectedTenant.ruc}
                    </p>
                  </div>
                </div>

                {/* Features Toggles */}
                <div className="space-y-4 pt-2">
                  <label className="text-[10px] font-black uppercase text-gray-400">Características de Módulo</label>
                  
                  <div className="space-y-3">
                    <FeatureToggleRow
                      label="Sincronización SIFEN"
                      desc="Ingesta directa desde servidores SET"
                      active={!!selectedTenant.features?.sifenSync}
                      onToggle={() => handleToggleFeature("sifenSync")}
                    />
                    <FeatureToggleRow
                      label="Triple Imputación IA"
                      desc="Autoclasificación con Gemini"
                      active={!!selectedTenant.features?.aiTripleImputation}
                      onToggle={() => handleToggleFeature("aiTripleImputation")}
                    />
                    <FeatureToggleRow
                      label="Reportes CGR"
                      desc="Módulo ESFL Contraloría"
                      active={!!selectedTenant.features?.cgrReports}
                      onToggle={() => handleToggleFeature("cgrReports")}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="card rounded-2xl p-8 text-center text-gray-400 font-semibold border-dashed border-2">
                Seleccioná un contribuyente del listado para modificar sus toggles de features.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Users */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios por email o nombre..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-semibold outline-none focus:border-primary transition-all"
            />
          </div>

          <div className="card rounded-2xl overflow-hidden divide-y divide-gray-200/30 dark:divide-gray-800/30">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-semibold">
                No se encontraron usuarios.
              </div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-black text-gray-900 dark:text-white">
                      {u.name || "Usuario Sin Nombre"}
                    </h4>
                    <p className="text-xs text-gray-500 font-semibold">{u.email}</p>
                  </div>

                  <button
                    onClick={() => setResettingUser(u)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-all"
                  >
                    <Key className="h-3 w-3" />
                    Resetear Contraseña
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-md w-full rounded-2xl p-6 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 dark:text-white">Resetear Contraseña</h3>
              <button onClick={() => setResettingUser(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Vas a cambiar la contraseña para el usuario <span className="font-bold text-gray-700 dark:text-gray-300">{resettingUser.email}</span>.
            </p>

            {resetSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-black flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Contraseña modificada exitosamente.
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Nueva Contraseña..."
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none focus:border-primary"
                />
                <button
                  onClick={() => resetPasswordMutation.mutate({ userId: resettingUser.id, pass: newPassword })}
                  disabled={!newPassword}
                  className="w-full py-2.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-wider"
                >
                  Confirmar Reinicio
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Studio Modal */}
      {showCreateStudioModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 max-w-4xl w-full rounded-2xl shadow-2xl p-6 lg:p-8 space-y-6 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Crear Nuevo Estudio Contable</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configurá la suscripción, información fiscal y habilitá los módulos correspondientes.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateStudioModal(false)} 
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Basic Information */}
              <div className="space-y-5">
                <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Información Básica</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">RUC del Estudio *</label>
                    <input
                      type="text"
                      placeholder="Ej: 80012345-1"
                      value={newStudio.ruc}
                      onChange={e => setNewStudio(prev => ({ ...prev, ruc: e.target.value }))}
                      className="w-full py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Nombre Comercial</label>
                    <input
                      type="text"
                      placeholder="Ej: Estudio Contable G&A"
                      value={newStudio.tradeName}
                      onChange={e => setNewStudio(prev => ({ ...prev, tradeName: e.target.value }))}
                      className="w-full py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    placeholder="Ej: Estudio García & Asociados Sociedad Simple"
                    value={newStudio.legalName}
                    onChange={e => setNewStudio(prev => ({ ...prev, legalName: e.target.value }))}
                    className="w-full py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Email de Contacto</label>
                    <input
                      type="email"
                      placeholder="ejemplo@estudio.com"
                      value={newStudio.contactEmail}
                      onChange={e => setNewStudio(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300">Teléfono</label>
                    <input
                      type="text"
                      placeholder="0981 123456"
                      value={newStudio.contactPhone}
                      onChange={e => setNewStudio(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Plan Selection Cards */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Plan del Cliente</h4>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                      Gs. {(newStudio.mrr).toLocaleString("es-PY")} / mes
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "starter", name: "Starter", price: "Gs. 180.000", desc: "Microestudios" },
                      { key: "pro", name: "Pro", price: "Gs. 385.000", desc: "Estudios Activos" },
                      { key: "inhouse", name: "InHouse / ESFL", price: "Gs. 440.000", desc: "Organizaciones" },
                      { key: "enterprise", name: "Enterprise", price: "Gs. 650.000", desc: "Grandes Firmas" },
                    ].map(p => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          const config = PLAN_DEFAULTS[p.key];
                          setNewStudio(prev => ({
                            ...prev,
                            plan: p.key,
                            mrr: config.mrr,
                            features: { ...config.features }
                          }));
                        }}
                        className={cn(
                          "flex flex-col text-left p-3 rounded-xl border transition-all hover:scale-[1.01]",
                          newStudio.plan === p.key
                            ? "border-primary bg-primary/5 dark:bg-primary/10 dark:border-primary/60"
                            : "border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 hover:bg-gray-100/50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <span className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                          {p.name}
                          {p.key === "pro" && (
                            <span className="text-[9px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded font-black uppercase">
                              Popular
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-primary font-bold mt-1">{p.price}</span>
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 font-medium">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Feature Toggles */}
              <div className="space-y-5">
                <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-wider">Features del Tenant (Control de Módulos)</h4>

                <div className="space-y-3.5">
                  {[
                    {
                      key: "sifenSync",
                      name: "Facturación Electrónica SIFEN",
                      desc: "Integración directa de comprobantes (Kuatia/SIFEN) para importación de compras y ventas.",
                      icon: Zap,
                      color: "text-amber-500 bg-amber-500/10"
                    },
                    {
                      key: "aiTripleImputation",
                      name: "Cerebro Contable IA (Gemini)",
                      desc: "Imputación inteligente automática en Libro IVA, Cuenta de Resultados y Balance General.",
                      icon: Sparkles,
                      color: "text-indigo-500 bg-indigo-500/10"
                    },
                    {
                      key: "cgrReports",
                      name: "Convenios & Proyectos (ESFL)",
                      desc: "Módulo presupuestario con clasificadores PGN/CGR para ONGs y Asociaciones del Paraguay.",
                      icon: FileText,
                      color: "text-emerald-500 bg-emerald-500/10"
                    },
                    {
                      key: "bankApi",
                      name: "API de Conciliación Bancaria",
                      desc: "Conexión automática de extractos y emparejamiento inteligente de movimientos con facturas.",
                      icon: Globe,
                      color: "text-blue-500 bg-blue-500/10"
                    },
                    {
                      key: "multiUser",
                      name: "Acceso Multiusuario y Roles",
                      desc: "Roles jerárquicos de auxiliares y auditores con trazabilidad y logs de seguridad.",
                      icon: Users,
                      color: "text-rose-500 bg-rose-500/10"
                    }
                  ].map(feat => {
                    const IconComp = feat.icon;
                    const isEnabled = !!newStudio.features[feat.key];
                    return (
                      <div 
                        key={feat.key} 
                        onClick={() => setNewStudio(prev => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            [feat.key]: !prev.features[feat.key]
                          }
                        }))}
                        className={cn(
                          "flex items-start justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all hover:bg-gray-50/50 dark:hover:bg-slate-800/40",
                          isEnabled 
                            ? "border-primary/20 bg-primary/[0.01] dark:bg-primary/[0.02]" 
                            : "border-gray-150 dark:border-slate-800 bg-transparent opacity-85"
                        )}
                      >
                        <div className="flex gap-3 pr-2">
                          <div className={cn("h-8 w-8 rounded-lg shrink-0 flex items-center justify-center", feat.color)}>
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-950 dark:text-white">{feat.name}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed font-medium">{feat.desc}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-1",
                            isEnabled ? "bg-primary" : "bg-gray-200 dark:bg-slate-700"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              isEnabled ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
              <button
                onClick={() => setShowCreateStudioModal(false)}
                className="px-5 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => createTenantMutation.mutate({ ...newStudio, tenantType: "STUDIO" })}
                disabled={!newStudio.ruc || !newStudio.legalName || createTenantMutation.isPending}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white hover:bg-primary-dark transition-all rounded-xl text-xs font-black shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none"
              >
                {createTenantMutation.isPending ? "Creando..." : "Crear Estudio Contable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Taxpayer Modal */}
      {showCreateTaxpayerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="card max-w-lg w-full rounded-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 dark:text-white">Registrar Empresa Contribuyente</h3>
              <button onClick={() => setShowCreateTaxpayerModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">RUC *</label>
                  <input
                    type="text"
                    placeholder="Ej: 80012345-1"
                    value={newTaxpayer.ruc}
                    onChange={e => setNewTaxpayer(prev => ({ ...prev, ruc: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Tipo de Entidad</label>
                  <select
                    value={newTaxpayer.entityType}
                    onChange={e => setNewTaxpayer(prev => ({ ...prev, entityType: e.target.value as any }))}
                    className="w-full py-2.5 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                  >
                    <option value="COMMERCIAL">Comercial (IRE Gral/Simple)</option>
                    <option value="NON_PROFIT_NGO">ONG / Sin Fines de Lucro</option>
                    <option value="ASSOCIATION">Asociación</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Razón Social *</label>
                <input
                  type="text"
                  placeholder="Ej: Importadora del Este S.A."
                  value={newTaxpayer.legalName}
                  onChange={e => setNewTaxpayer(prev => ({ ...prev, legalName: e.target.value }))}
                  className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Estudio Contable Encargado *</label>
                <select
                  value={newTaxpayer.studioId}
                  onChange={e => setNewTaxpayer(prev => ({ ...prev, studioId: e.target.value }))}
                  className="w-full py-2.5 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                >
                  <option value="">-- Seleccionar Estudio Contable --</option>
                  {studios.map(s => (
                    <option key={s.id} value={s.id}>{s.legalName} ({s.ruc})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => createTenantMutation.mutate({ ...newTaxpayer, tenantType: "TAXPAYER", plan: "starter", mrr: 0 })}
                disabled={!newTaxpayer.ruc || !newTaxpayer.legalName || !newTaxpayer.studioId}
                className="w-full py-3 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                Registrar Contribuyente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureToggleRow({ label, desc, active, onToggle }: {
  label: string; desc: string; active: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200/50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
      <div>
        <h5 className="text-xs font-black text-gray-900 dark:text-white">{label}</h5>
        <p className="text-[10px] text-gray-400 font-semibold">{desc}</p>
      </div>

      <button onClick={onToggle} className="text-gray-400 hover:text-primary transition-all">
        {active ? (
          <ToggleRight className="h-7 w-7 text-primary" />
        ) : (
          <ToggleLeft className="h-7 w-7 text-gray-300 dark:text-gray-700" />
        )}
      </button>
    </div>
  );
}
