"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSuperadminTenantsAction,
  getSuperadminUsersAction,
  getSuperadminStatsAction,
  getSystemVitalsAction,
  getErroresPlataformaAction,
  createTenantAtomicAction,
  createUserInTenantAction,
  updateTenantCommercialsAction,
  impersonateTenantAction,
  resolverErrorAction,
  resetUserPasswordAction,
  getPaymentOrdersAction,
  approvePaymentOrderAction,
  rejectPaymentOrderAction,
} from "./actions";
import {
  Building2, Users, Search, ToggleLeft, ToggleRight, Check,
  Plus, DollarSign, Key, RefreshCw, Info, AlertCircle, Sparkles,
  Shield, UserCheck, CheckCircle2, X, Briefcase, User, Zap, Globe, FileText,
  Activity, Server, Database, Cpu, HardDrive, Copy, ExternalLink, Lock, CheckSquare,
  CreditCard, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { generarReporteMarkdown } from "@/lib/error-report";

export default function SuperAdminConsolePage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<"firmas" | "usuarios" | "errores" | "vitals" | "pagos">("firmas");
  const [tenantSearch, setTenantSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Modals
  const [showCreateTenantModal, setShowCreateTenantModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState<any | null>(null);
  const [selectedErrorForDetail, setSelectedErrorForDetail] = useState<any | null>(null);
  const [resolvingNotes, setResolvingNotes] = useState("");

  // Revealed Credential Card
  const [revealedCredential, setRevealedCredential] = useState<{
    email: string;
    passwordTemporal: string;
    entityName: string;
  } | null>(null);

  // Form State: New Tenant
  const [newTenant, setNewTenant] = useState({
    ruc: "",
    legalName: "",
    tradeName: "",
    adminEmail: "",
    adminName: "",
    plan: "pro",
    maxUsuarios: 5,
    maxClientes: 50,
    tieneIa: true,
  });

  // Form State: New User
  const [newUser, setNewUser] = useState({
    entityId: "",
    email: "",
    name: "",
    role: "collaborator",
  });

  // Queries
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: () => getSuperadminStatsAction(),
  });

  const { data: vitals, refetch: refetchVitals, isLoading: loadingVitals } = useQuery({
    queryKey: ["superadmin-vitals"],
    queryFn: () => getSystemVitalsAction(),
  });

  const { data: tenants = [], refetch: refetchTenants } = useQuery({
    queryKey: ["superadmin-tenants"],
    queryFn: () => getSuperadminTenantsAction(),
  });

  const { data: usersList = [], refetch: refetchUsers } = useQuery({
    queryKey: ["superadmin-users"],
    queryFn: () => getSuperadminUsersAction(),
  });

  const { data: errores = [], refetch: refetchErrores } = useQuery({
    queryKey: ["superadmin-errores"],
    queryFn: () => getErroresPlataformaAction(),
  });

  const { data: paymentOrders = [], refetch: refetchPagos } = useQuery({
    queryKey: ["superadmin-pagos"],
    queryFn: () => getPaymentOrdersAction(),
  });

  const approvePaymentMutation = useMutation({
    mutationFn: (orderId: string) => approvePaymentOrderAction(orderId),
    onSuccess: (res: any) => {
      if (res.success) {
        addToast({
          type: "success",
          title: "Pago SIPAP Aprobado",
          message: "Plan activado y vigencia extendida correctamente.",
        });
        queryClient.invalidateQueries({ queryKey: ["superadmin-pagos"] });
        queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
        queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
      }
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      rejectPaymentOrderAction(orderId, reason),
    onSuccess: (res: any) => {
      if (res.success) {
        addToast({
          type: "info",
          title: "Pago Rechazado",
          message: "La orden ha sido marcada como rechazada.",
        });
        queryClient.invalidateQueries({ queryKey: ["superadmin-pagos"] });
      }
    },
  });

  // Mutations
  const createTenantMutation = useMutation({
    mutationFn: createTenantAtomicAction,
    onSuccess: (res: any) => {
      if (res.success && res.user && res.passwordTemporal && res.entity) {
        setRevealedCredential({
          email: res.user.email,
          passwordTemporal: res.passwordTemporal,
          entityName: res.entity.legalName,
        });
        setShowCreateTenantModal(false);
        queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
        queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
        addToast({
          type: "success",
          title: "Tenant Creado Exitosamente",
          message: `Firma ${res.entity.legalName} dada de alta con administrador inicial.`,
        });
      } else {
        addToast({
          type: "error",
          title: "Error al crear tenant",
          message: res.error || "Ocurrió un error inesperado",
        });
      }
    },
  });

  const createUserMutation = useMutation({
    mutationFn: createUserInTenantAction,
    onSuccess: (res: any) => {
      if (res.success && res.user && res.passwordTemporal) {
        setRevealedCredential({
          email: res.user.email,
          passwordTemporal: res.passwordTemporal,
          entityName: "Usuario Directo",
        });
        setShowCreateUserModal(false);
        queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
        queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
        addToast({
          type: "success",
          title: "Usuario Creado",
          message: `Usuario ${res.user.email} creado con contraseña temporal.`,
        });
      } else {
        addToast({
          type: "error",
          title: "Error de Límites de Plan",
          message: res.error || "No se pudo crear el usuario",
        });
      }
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: (entityId: string) => impersonateTenantAction(entityId),
    onSuccess: (res: any) => {
      if (res.success && res.token) {
        localStorage.setItem("impersonation_token", res.token);
        localStorage.setItem("impersonated_tenant_id", res.targetEntity?.id || "");
        addToast({
          type: "info",
          title: "Impersonación Activada",
          message: `Iniciando sesión como ${res.targetUser?.email || "Admin"} en ${res.targetEntity?.legalName}`,
        });
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      }
    },
  });

  const resolverErrorMutation = useMutation({
    mutationFn: ({ id, notas }: { id: string; notas: string }) => resolverErrorAction(id, notas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-errores"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-stats"] });
      setSelectedErrorForDetail(null);
      setResolvingNotes("");
      addToast({
        type: "success",
        title: "Incidente Resuelto",
        message: "El error ha sido marcado como solucionado.",
      });
    },
  });

  const updateOverridesMutation = useMutation({
    mutationFn: (data: { entityId: string; plan?: string; featuresOverrideJson?: string }) =>
      updateTenantCommercialsAction(data.entityId, { plan: data.plan, featuresOverrideJson: data.featuresOverrideJson }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superadmin-tenants"] });
      setSelectedTenantForEdit(null);
      addToast({
        type: "success",
        title: "Límites y Plan Actualizados",
        message: "Los cambios se aplicaron inmediatamente.",
      });
    },
  });

  const copyToClipboard = (text: string, label: string = "Copiado al portapapeles") => {
    navigator.clipboard.writeText(text);
    addToast({
      type: "info",
      title: label,
      message: "Listo para usar.",
    });
  };

  const filteredTenants = tenants.filter(
    (t: any) =>
      t.legalName.toLowerCase().includes(tenantSearch.toLowerCase()) ||
      t.ruc.toLowerCase().includes(tenantSearch.toLowerCase())
  );

  const filteredUsers = usersList.filter(
    (u: any) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Consola de Operaciones SuperAdmin
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gobernanza global multi-tenant, telemetría Sentry-Lite, límites de planes e infraestructura
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchStats();
              refetchVitals();
              refetchTenants();
              refetchUsers();
              refetchErrores();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={cn("h-4 w-4", loadingVitals && "animate-spin")} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase font-medium">Tenants Totales</span>
            <Building2 className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-2">
            {stats?.totalTenants ?? tenants.length}
          </p>
          <span className="text-[11px] text-green-500 font-medium">
            {stats?.activeTenants ?? tenants.length} activos
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase font-medium">Directorio Usuarios</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-2">
            {stats?.totalUsers ?? usersList.length}
          </p>
          <span className="text-[11px] text-gray-400 font-medium">Cuentas habilitadas</span>
        </div>

        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase font-medium">Errores 5xx Pendientes</span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 mt-2">
            {stats?.pendingErrorsCount ?? errores.filter((e) => !e.resuelto).length}
          </p>
          <span className="text-[11px] text-red-500 font-medium">Sentry-Lite Telemetría</span>
        </div>

        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase font-medium">Salud Infraestructura</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
            {vitals?.database.status === "healthy" ? "100%" : "Degradado"}
          </p>
          <span className="text-[11px] text-gray-400 font-medium">Postgres {vitals?.database.latencyMs}ms</span>
        </div>
      </div>

      {/* Revealed Credential Card (Alert Modal / Card) */}
      {revealedCredential && (
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-blue-900/40 border border-indigo-500/30 rounded-xl p-4 sm:p-5 shadow-lg relative">
          <button
            onClick={() => setRevealedCredential(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <Key className="h-5 w-5 text-indigo-400 shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-semibold text-white">
                Credencial Generada para: {revealedCredential.entityName}
              </h3>
              <p className="text-xs text-gray-300">
                El usuario tiene marcado <span className="font-semibold text-amber-300">primer login obligatorio</span> y deberá cambiar su clave al ingresar.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-950/80 p-3 rounded-lg border border-gray-800 font-mono text-xs">
                <div>
                  <span className="text-gray-400 text-[10px] block">Email:</span>
                  <span className="text-white font-medium">{revealedCredential.email}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] block">Contraseña Temporal:</span>
                  <span className="text-emerald-400 font-bold">{revealedCredential.passwordTemporal}</span>
                </div>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    `Acceso a InteliCont:\nURL: https://app.intelicont.com.py/login\nEmail: ${revealedCredential.email}\nContraseña temporal: ${revealedCredential.passwordTemporal}`,
                    "Credenciales copiadas para enviar al cliente"
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar Credenciales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("firmas")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "firmas"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          Tenants (Firmas) ({tenants.length})
        </button>
        <button
          onClick={() => setActiveTab("usuarios")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "usuarios"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          Directorio Global ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab("errores")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
            activeTab === "errores"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          Sentry-Lite (5xx)
          {errores.filter((e) => !e.resuelto).length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold">
              {errores.filter((e) => !e.resuelto).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("vitals")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === "vitals"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          System Vitals
        </button>
        <button
          onClick={() => setActiveTab("pagos")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
            activeTab === "pagos"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <CreditCard className="w-4 h-4" />
          Pagos SIPAP
          {paymentOrders.filter((p: any) => p.status === "pending_verification").length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold">
              {paymentOrders.filter((p: any) => p.status === "pending_verification").length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TENANTS (FIRMAS) */}
      {activeTab === "firmas" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por RUC o Razón Social..."
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs outline-none"
              />
            </div>
            <button
              onClick={() => setShowCreateTenantModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4" /> Alta de Nueva Firma
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Razón Social / RUC</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Plan</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Overrides Cuotas</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Acciones Operativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {filteredTenants.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 dark:text-white">{t.legalName}</p>
                      <span className="font-mono text-gray-400 text-[11px]">{t.ruc}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                        t.plan === "enterprise" ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" :
                        t.plan === "inhouse" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" :
                        t.plan === "pro" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      )}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500 text-[11px]">
                      {t.featuresOverrideJson ? (
                        <span className="text-indigo-600 dark:text-indigo-400">Custom ({t.featuresOverrideJson})</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => impersonateMutation.mutate(t.id)}
                        disabled={impersonateMutation.isPending}
                        className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                        title="Impersonar este tenant con vista completa de cliente"
                      >
                        <ExternalLink className="h-3 w-3" /> Impersonar
                      </button>
                      <button
                        onClick={() => setSelectedTenantForEdit(t)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                      >
                        Editar Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECTORIO GLOBAL DE USUARIOS */}
      {activeTab === "usuarios" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuario por email o nombre..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs outline-none"
              />
            </div>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium shadow-sm transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="h-4 w-4" /> Agregar Usuario a Firma
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Email / Usuario</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Primer Login</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Fecha Alta</th>
                  <th className="text-right px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">
                      {u.email}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {u.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {u.debeCambiarPassword ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          Debe Cambiar Clave
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300">
                          Clave Activa
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("es-PY")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={async () => {
                          const newPass = "Tmp-" + Math.random().toString(36).slice(2, 8) + "!";
                          await resetUserPasswordAction(u.id, newPass);
                          setRevealedCredential({
                            email: u.email,
                            passwordTemporal: newPass,
                            entityName: "Reset Password",
                          });
                        }}
                        className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
                      >
                        <Key className="h-3 w-3" /> Resetear Clave
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SENTRY-LITE (ERRORES 5XX) */}
      {activeTab === "errores" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Incidentes de Plataforma No Controlados (Deduplicados SHA-256)
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Agrupación determinista por tipo de error y línea de código. Haz clic para inspeccionar o copiar para el Agente AI.
                </p>
              </div>
            </div>

            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Tipo de Error & Mensaje</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Endpoint</th>
                  <th className="text-center px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Ocurrencias</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Última Vez</th>
                  <th className="text-left px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-[10px] text-gray-500 uppercase font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {errores.length > 0 ? (
                  errores.map((err) => (
                    <tr
                      key={err.id}
                      onClick={() => setSelectedErrorForDetail(err)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-red-600 dark:text-red-400">
                            {err.tipoError}
                          </span>
                          <span className="text-gray-400 text-[10px] font-mono truncate max-w-[100px]">
                            #{err.fingerprint.slice(0, 8)}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 truncate max-w-sm mt-0.5">
                          {err.mensaje}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-500">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{err.metodo}</span> {err.path}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[11px] bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                          x{err.ocurrencias}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">
                        {new Date(err.ultimaVez).toLocaleTimeString("es-PY")}
                      </td>
                      <td className="px-4 py-3">
                        {err.resuelto ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resuelto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-red-500 font-semibold">
                            <AlertCircle className="h-3.5 w-3.5" /> Abierto
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(generarReporteMarkdown(err), "Reporte copiado para Agente AI");
                          }}
                          className="px-2.5 py-1 text-xs rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 font-medium"
                        >
                          <Copy className="h-3 w-3" /> Reporte AI
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-xs">
                      No hay incidentes 5xx registrados en la plataforma.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM VITALS */}
      {activeTab === "vitals" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database */}
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Base de Datos PostgreSQL</h3>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  {vitals?.database.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                <span>Latencia Round-Trip:</span>
                <span className="text-gray-900 dark:text-white font-bold">{vitals?.database.latencyMs} ms</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-2">
                {vitals?.database.details}
              </p>
            </div>

            {/* AI Ollama */}
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Motor de Inferencia AI Local</h3>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  {vitals?.ai.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                <span>Modelo Primario:</span>
                <span className="text-gray-900 dark:text-white font-bold">{vitals?.ai.model}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-2">
                {vitals?.ai.details} ({vitals?.ai.latencyMs}ms)
              </p>
            </div>

            {/* Cache Fiscal */}
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Caché Fiscal & Cotizaciones</h3>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  {vitals?.cacheFiscal.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {vitals?.cacheFiscal.details}
              </p>
            </div>

            {/* Storage */}
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Almacenamiento Standalone</h3>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  {vitals?.storage.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {vitals?.storage.details}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PAGOS Y SUSCRIPCIONES SIPAP */}
      {activeTab === "pagos" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Gestión de Pagos SIPAP & Suscripciones
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Verificación manual y aprobación atómica de comprobantes de transferencia bancaria
              </p>
            </div>
            <button
              onClick={() => refetchPagos()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Actualizar
            </button>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            {paymentOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No hay órdenes de pago registradas por el momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 uppercase font-bold border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Firma / Contribuyente</th>
                      <th className="py-3 px-4">Plan</th>
                      <th className="py-3 px-4">Monto</th>
                      <th className="py-3 px-4">Comprobante SIPAP</th>
                      <th className="py-3 px-4">Banco Origen</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paymentOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="py-3 px-4 font-mono">
                          {new Date(order.createdAt).toLocaleDateString("es-PY")}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {order.entityName}
                          </div>
                          {order.notas && (
                            <div className="text-[10px] text-gray-400 truncate max-w-xs">{order.notas}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 uppercase font-bold text-blue-600 dark:text-blue-400">
                          {order.plan} ({order.billingCycle})
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          Gs. {order.amountGs?.toLocaleString("es-PY")}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {order.comprobanteRef}
                          </span>
                        </td>
                        <td className="py-3 px-4">{order.bancoOrigen || "SIPAP"}</td>
                        <td className="py-3 px-4">
                          {order.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Aprobado
                            </span>
                          ) : order.status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                              <X className="w-3 h-3" /> Rechazado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {order.status === "pending_verification" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => approvePaymentMutation.mutate(order.id)}
                                disabled={approvePaymentMutation.isPending}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-sm transition cursor-pointer"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() =>
                                  rejectPaymentMutation.mutate({
                                    orderId: order.id,
                                    reason: "Comprobante no acreditado en cuenta bancaria",
                                  })
                                }
                                disabled={rejectPaymentMutation.isPending}
                                className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-medium rounded-lg transition cursor-pointer"
                              >
                                Rechazar
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">Verificado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ALTA ATÓMICA DE NUEVA FIRMA */}
      {showCreateTenantModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" /> Alta Atómica de Firma (Tenant)
              </h3>
              <button onClick={() => setShowCreateTenantModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-500 block mb-1">RUC:</label>
                  <input
                    type="text"
                    placeholder="80012345-6"
                    value={newTenant.ruc}
                    onChange={(e) => setNewTenant({ ...newTenant, ruc: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-gray-500 block mb-1">Plan de Licencia:</label>
                  <select
                    value={newTenant.plan}
                    onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="starter">Starter PyME (Gs. 180.000)</option>
                    <option value="pro">Pro Estudio (Gs. 385.000)</option>
                    <option value="inhouse">In-House Corp (Gs. 440.000)</option>
                    <option value="enterprise">Enterprise Holding (Gs. 650.000)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-500 block mb-1">Razón Social:</label>
                <input
                  type="text"
                  placeholder="Ej: Estudio Contable Asunción S.A."
                  value={newTenant.legalName}
                  onChange={(e) => setNewTenant({ ...newTenant, legalName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Administrador Inicial:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 block mb-1">Email Administrador:</label>
                    <input
                      type="email"
                      placeholder="admin@estudio.com.py"
                      value={newTenant.adminEmail}
                      onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">Nombre Completo:</label>
                    <input
                      type="text"
                      placeholder="Lic. Mario González"
                      value={newTenant.adminName}
                      onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Overrides de Cuota (Opcional):</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 block mb-1">Límite Usuarios:</label>
                    <input
                      type="number"
                      value={newTenant.maxUsuarios}
                      onChange={(e) => setNewTenant({ ...newTenant, maxUsuarios: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">Límite Clientes:</label>
                    <input
                      type="number"
                      value={newTenant.maxClientes}
                      onChange={(e) => setNewTenant({ ...newTenant, maxClientes: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setShowCreateTenantModal(false)}
                className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  createTenantMutation.mutate({
                    ruc: newTenant.ruc,
                    legalName: newTenant.legalName,
                    tradeName: newTenant.tradeName,
                    adminEmail: newTenant.adminEmail,
                    adminName: newTenant.adminName,
                    plan: newTenant.plan,
                    featuresOverride: {
                      max_usuarios: newTenant.maxUsuarios,
                      max_clientes: newTenant.maxClientes,
                      tiene_ia: newTenant.tieneIa,
                    },
                  })
                }
                disabled={!newTenant.ruc || !newTenant.legalName || !newTenant.adminEmail || createTenantMutation.isPending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
              >
                {createTenantMutation.isPending ? "Generando Alta..." : "Crear Firma y Administrador"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR USUARIO A FIRMA */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" /> Nuevo Usuario en Firma
              </h3>
              <button onClick={() => setShowCreateUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 block mb-1">Firma / Tenant:</label>
                <select
                  value={newUser.entityId}
                  onChange={(e) => setNewUser({ ...newUser, entityId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                >
                  <option value="">Seleccione Firma...</option>
                  {tenants.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.legalName} ({t.ruc}) - Plan {t.plan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-500 block mb-1">Email del Colaborador:</label>
                <input
                  type="email"
                  placeholder="colaborador@estudio.com.py"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="text-gray-500 block mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  placeholder="Ej: Lic. Ana Duarte"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => createUserMutation.mutate(newUser)}
                disabled={!newUser.entityId || !newUser.email || createUserMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
              >
                {createUserMutation.isPending ? "Validando Límites..." : "Crear Usuario"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DE ERROR SENTRY-LITE */}
      {selectedErrorForDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-red-500 text-xs font-bold uppercase tracking-wider block">
                  Incidente 5xx • #{selectedErrorForDetail.fingerprint.slice(0, 12)}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedErrorForDetail.tipoError}: {selectedErrorForDetail.mensaje}
                </h3>
              </div>
              <button onClick={() => setSelectedErrorForDetail(null)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg text-xs font-mono">
              <div>
                <span className="text-gray-400 block text-[10px]">Endpoint:</span>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {selectedErrorForDetail.metodo} {selectedErrorForDetail.path}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Ocurrencias:</span>
                <span className="text-red-500 font-bold">{selectedErrorForDetail.ocurrencias} veces</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Usuario:</span>
                <span className="text-gray-300 truncate block">{selectedErrorForDetail.usuarioEmail || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Estado:</span>
                <span className={cn("font-bold", selectedErrorForDetail.resuelto ? "text-green-500" : "text-red-500")}>
                  {selectedErrorForDetail.resuelto ? "Resuelto" : "Pendiente"}
                </span>
              </div>
            </div>

            {/* Stacktrace */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Stacktrace de Error:</span>
              <pre className="p-3 bg-gray-950 text-gray-300 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48 border border-gray-800">
                {selectedErrorForDetail.stacktrace}
              </pre>
            </div>

            {/* Context */}
            {selectedErrorForDetail.contextoJson && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Contexto Sanitizado:</span>
                <pre className="p-3 bg-gray-950 text-gray-400 rounded-lg text-[11px] font-mono overflow-x-auto max-h-32 border border-gray-800">
                  {JSON.stringify(JSON.parse(selectedErrorForDetail.contextoJson), null, 2)}
                </pre>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() =>
                  copyToClipboard(
                    generarReporteMarkdown(selectedErrorForDetail),
                    "Reporte Markdown copiado para el Agente AI"
                  )
                }
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm w-full sm:w-auto justify-center"
              >
                <Copy className="h-4 w-4" /> 📋 Copiar Reporte para Agente AI
              </button>

              {!selectedErrorForDetail.resuelto && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Nota de solución..."
                    value={resolvingNotes}
                    onChange={(e) => setResolvingNotes(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none w-full sm:w-48"
                  />
                  <button
                    onClick={() =>
                      resolverErrorMutation.mutate({
                        id: selectedErrorForDetail.id,
                        notas: resolvingNotes || "Resuelto por SuperAdmin",
                      })
                    }
                    disabled={resolverErrorMutation.isPending}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
                  >
                    Marcar Resuelto
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PLAN / OVERRIDES */}
      {selectedTenantForEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Editar Licencia: {selectedTenantForEdit.legalName}
              </h3>
              <button onClick={() => setSelectedTenantForEdit(null)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 block mb-1">Plan Base:</label>
                <select
                  value={selectedTenantForEdit.plan}
                  onChange={(e) => setSelectedTenantForEdit({ ...selectedTenantForEdit, plan: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none cursor-pointer"
                >
                  <option value="starter">Starter PyME</option>
                  <option value="pro">Pro Estudio</option>
                  <option value="inhouse">In-House Corp</option>
                  <option value="enterprise">Enterprise Holding</option>
                </select>
              </div>

              <div>
                <label className="text-gray-500 block mb-1">Overrides JSON (Cuotas Personalizadas):</label>
                <textarea
                  rows={4}
                  value={selectedTenantForEdit.featuresOverrideJson || ""}
                  onChange={(e) =>
                    setSelectedTenantForEdit({ ...selectedTenantForEdit, featuresOverrideJson: e.target.value })
                  }
                  placeholder='{"max_usuarios": 20, "max_clientes": 100, "tiene_ia": true}'
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-[11px] outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setSelectedTenantForEdit(null)}
                className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  updateOverridesMutation.mutate({
                    entityId: selectedTenantForEdit.id,
                    plan: selectedTenantForEdit.plan,
                    featuresOverrideJson: selectedTenantForEdit.featuresOverrideJson || null,
                  })
                }
                disabled={updateOverridesMutation.isPending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
