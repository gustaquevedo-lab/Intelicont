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
  Shield, UserCheck, CheckCircle2, X
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
  createdAt: any;
};

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  createdAt: any;
};

export default function SuperadminPage() {
  const queryClient = useQueryClient();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<"tenants" | "users">("tenants");

  // Search states
  const [tenantSearch, setTenantSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Selected Tenant for editing
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Password reset state
  const [resettingUser, setResettingUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // New Tenant Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    ruc: "",
    legalName: "",
    tradeName: "",
    entityType: "COMMERCIAL" as "COMMERCIAL" | "NON_PROFIT_NGO" | "NON_PROFIT_PUBLIC" | "ASSOCIATION",
    plan: "starter",
    mrr: 180000
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
      setShowCreateModal(false);
      setNewTenant({
        ruc: "",
        legalName: "",
        tradeName: "",
        entityType: "COMMERCIAL",
        plan: "starter",
        mrr: 180000
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

  // Computed / Filtered lists
  const filteredTenants = tenants.filter(t => {
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
            Gestión global de base de datos de Tenants, Planes de Precios, Características de IA y Cuentas de Usuarios.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white hover:bg-primary-dark transition-all rounded-xl text-sm font-black shadow-xl shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          Crear Nueva Empresa
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase text-gray-500">Empresas Activas</span>
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h4 className="text-3xl font-black text-gray-900 dark:text-white">{tenants.length}</h4>
          <p className="text-xs font-semibold text-gray-400 mt-1">Aprovisionados en Railway</p>
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
            Gs. {tenants.reduce((sum, t) => sum + (t.mrr || 0), 0).toLocaleString("es-PY")}
          </h4>
          <p className="text-xs font-semibold text-gray-400 mt-1">Facturación mensual estimada</p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-gray-200/50 dark:border-gray-800/50">
        <button
          onClick={() => setActiveTab("tenants")}
          className={cn(
            "px-6 py-3 text-sm font-black border-b-2 transition-all uppercase tracking-wider",
            activeTab === "tenants"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          Empresas / Contribuyentes
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "px-6 py-3 text-sm font-black border-b-2 transition-all uppercase tracking-wider",
            activeTab === "users"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          )}
        >
          Usuarios
        </button>
      </div>

      {/* Tab: Tenants */}
      {activeTab === "tenants" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List of Tenants */}
          <div className="lg:col-span-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por RUC, Nombre Legal o Nombre de Fantasía..."
                value={tenantSearch}
                onChange={e => setTenantSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-semibold outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="card rounded-2xl overflow-hidden divide-y divide-gray-200/30 dark:divide-gray-800/30">
              {filteredTenants.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-semibold">
                  No se encontraron empresas.
                </div>
              ) : (
                filteredTenants.map(t => (
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
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {t.plan}
                      </span>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                        t.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      )}>
                        {t.status || "active"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Edit Tenant side panel */}
          <div className="lg:col-span-4">
            {selectedTenant ? (
              <div className="card rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white">
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

                {/* Features Toggles */}
                <div className="space-y-4 pt-2 border-t border-gray-200/50 dark:border-gray-800/50">
                  <label className="text-[10px] font-black uppercase text-gray-400">Características Habilitadas</label>
                  
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
                Seleccioná una empresa del listado para modificar planes, toggles de features y estado comercial.
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

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-lg w-full rounded-2xl p-6 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 dark:text-white">Crear Nueva Empresa</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">RUC</label>
                  <input
                    type="text"
                    placeholder="Ej: 80012345-1"
                    value={newTenant.ruc}
                    onChange={e => setNewTenant(prev => ({ ...prev, ruc: e.target.value }))}
                    className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Tipo de Entidad</label>
                  <select
                    value={newTenant.entityType}
                    onChange={e => setNewTenant(prev => ({ ...prev, entityType: e.target.value as any }))}
                    className="w-full py-2.5 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                  >
                    <option value="COMMERCIAL">Comercial (IRE Gral/Simple)</option>
                    <option value="NON_PROFIT_NGO">ONG / Sin Fines de Lucro</option>
                    <option value="ASSOCIATION">Asociación</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Razón Social</label>
                <input
                  type="text"
                  placeholder="Ej: Importadora del Este S.A."
                  value={newTenant.legalName}
                  onChange={e => setNewTenant(prev => ({ ...prev, legalName: e.target.value }))}
                  className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">Nombre de Fantasía (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: El Este Comercial"
                  value={newTenant.tradeName}
                  onChange={e => setNewTenant(prev => ({ ...prev, tradeName: e.target.value }))}
                  className="w-full py-2 px-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-semibold outline-none"
                />
              </div>

              <button
                onClick={() => createTenantMutation.mutate(newTenant)}
                disabled={!newTenant.ruc || !newTenant.legalName}
                className="w-full py-3 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                Crear Empresa Contribuyente
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
