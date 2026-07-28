import { ReactNode } from "react";
import {
  BookOpen, LayoutDashboard, Upload, Clock, Send, Inbox, FileText,
  PlusCircle, Eye, GitBranch, FolderTree, Package, Users, Landmark,
  Wallet, TrendingUp, BookMarked, Calculator, Receipt, Ticket,
  Lock, BarChart3, Calendar, FileSearch, Settings, Shield, Keyboard,
  AlertTriangle, HelpCircle, Building2, Sparkles, ArrowRight,
  CheckCircle2, CreditCard, Globe, DollarSign, Search, Bell, User,
  ChevronDown, FileUp, X, Zap
} from "lucide-react";

export interface ManualSection {
  id: string;
  group: string;
  groupIcon: ReactNode;
  title: string;
  icon: ReactNode;
  content: ReactNode;
}

const icon = (Icon: any, className = "h-4 w-4") => <Icon className={className} />;

const Tip = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start gap-2.5 bg-blue-950/30 border border-blue-900/30 rounded-xl p-4 text-sm">
    <Sparkles className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
    <div className="text-blue-200">{children}</div>
  </div>
);

const Warning = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start gap-2.5 bg-amber-950/30 border border-amber-900/30 rounded-xl p-4 text-sm">
    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
    <div className="text-amber-200">{children}</div>
  </div>
);

const StepList = ({ steps }: { steps: { title: string; body: ReactNode }[] }) => (
  <div className="space-y-3">
    {steps.map((s, i) => (
      <div key={i} className="flex items-start gap-3">
        <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 font-bold text-primary text-xs">
          {i + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm mb-1">{s.title}</p>
          <div className="text-gray-400 text-sm leading-relaxed">{s.body}</div>
        </div>
      </div>
    ))}
  </div>
);

const FieldTable = ({ fields }: { fields: { field: string; type: string; desc: string }[] }) => (
  <div className="overflow-hidden rounded-xl border border-gray-800">
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-gray-900/80">
          <th className="text-left p-3 font-semibold text-gray-300">Campo</th>
          <th className="text-left p-3 font-semibold text-gray-300">Tipo</th>
          <th className="text-left p-3 font-semibold text-gray-300">Descripción</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {fields.map((f, i) => (
          <tr key={i} className="hover:bg-gray-900/40">
            <td className="p-3 font-mono text-white">{f.field}</td>
            <td className="p-3 text-gray-400">{f.type}</td>
            <td className="p-3 text-gray-400">{f.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MockCard = ({ children, title }: { children: ReactNode; title?: string }) => (
  <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shadow-xl shadow-black/20">
    {title && (
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/50">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-gray-600">InteliCont</span>
      </div>
    )}
    <div className="p-4 text-sm leading-relaxed">{children}</div>
  </div>
);

const MockTopbar = () => (
  <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 rounded-t-xl">
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-3 py-1.5">
        <Search className="h-3 w-3 text-gray-500" />
        <span className="text-[10px] text-gray-500">Buscar...</span>
        <kbd className="text-[9px] text-gray-600 border border-gray-700 rounded px-1 ml-2">⌘K</kbd>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="bg-primary/20 border border-primary/30 text-primary rounded-lg px-3 py-1 text-[10px] font-semibold">
        Empresa ABC S.A.
      </div>
      <Bell className="h-3.5 w-3.5 text-gray-500" />
      <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
        <User className="h-3 w-3 text-primary" />
      </div>
    </div>
  </div>
);

const MockSidebarItem = ({ label, active }: { label: string; active?: boolean }) => (
  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] transition-colors ${active ? 'bg-primary/15 text-primary font-semibold' : 'text-gray-500 hover:text-gray-300'}`}>
    <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-primary' : 'bg-gray-700'}`} />
    {label}
  </div>
);

const MockBadge = ({ variant, children }: { variant: "green" | "yellow" | "red" | "blue" | "gray"; children: ReactNode }) => {
  const styles = {
    green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    yellow: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    red: "bg-red-500/15 text-red-400 border-red-500/20",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    gray: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold border ${styles[variant]}`}>
      {children}
    </span>
  );
};

const MockProgress = ({ value, max, label }: { value: number; max: number; label?: string }) => {
  const pct = Math.round((value / max) * 100);
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      {label && <div className="flex justify-between text-[10px]"><span className="text-gray-500">{label}</span><span className="text-gray-400">{pct}%</span></div>}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const MockStat = ({ label, value, sub, color = "text-white" }: { label: string; value: string; sub?: string; color?: string }) => (
  <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
    <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">{label}</p>
    <p className={`font-bold text-lg ${color}`}>{value}</p>
    {sub && <p className="text-gray-600 text-[10px] mt-1">{sub}</p>}
  </div>
);

const AppLink = ({ href, label }: { href: string; label: string }) => (
  <a
    href={href}
    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
  >
    {label}
    <ArrowRight className="h-3 w-3" />
  </a>
);

export const MANUAL_SECTIONS: ManualSection[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 1: INTRODUCCIÓN
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "que-es-intelicont",
    group: "Introducción",
    groupIcon: icon(BookOpen),
    title: "1. ¿Qué es InteliCont?",
    icon: icon(BookOpen),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          InteliCont es un <strong className="text-white">SaaS de contabilidad</strong> diseñado para el mercado paraguayo.
          Reemplaza sistemas tradicionales como Expert360 con una plataforma moderna, API-first, con inteligencia artificial
          integrada que automatiza la imputación contable de facturas electrónicas SIFEN.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Estudios Contables", desc: "Gestionan múltiples empresas cliente con usuarios internos" },
            { label: "Empresas Individuales", desc: "Una sola empresa con su propio equipo contable" },
            { label: "Auditores Externos", desc: "Acceso de solo lectura para fiscalización" },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
              <p className="font-semibold text-white text-sm mb-1">{item.label}</p>
              <p className="text-gray-400 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 border border-primary/20 rounded-xl p-5">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            {icon(Shield)} Principios Fundamentales
          </h4>
          <div className="space-y-3">
            {[
              ["Doble partida estricta", "Todo asiento debe tener débitos = créditos por moneda. El sistema valida automáticamente y NO permite postear asientos desbalanceados."],
              ["Libro inmutable", "Una vez posteado, un asiento NO se puede modificar ni eliminar. Las correcciones son vía contra-asiento (reversión) o ajuste (versión)."],
              ["Multi-tenant por entidad", "Cada empresa tiene su propio plan de cuentas, asientos y libros. Al cambiar de entidad en el selector, TODO el contexto cambia."],
              ["Cumplimiento PY", "Validación de RUC, Timbrado, CDC, cálculo de IVA 10%/5%, retenciones, Hechauka, RG90, formularios 104 y 501."],
              ["IA con humano en el loop", "El motor de IA sugiere asientos automáticos al importar SIFEN, con porcentaje de confianza. Siempre requiere aprobación humana."],
            ].map(([title, desc], i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white text-sm">{title}:</span>
                  <span className="text-gray-400 text-sm ml-1">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Tip>
          InteliCont forma parte del ecosistema <strong>Inteli*</strong> que incluye InteliAudit (auditoría),
          Sueldok (RRHH/nómina) e InteliMarket (ERP). Todos se integran automáticamente enviando asientos contables.
        </Tip>
      </div>
    ),
  },

  {
    id: "roles-permisos",
    group: "Introducción",
    groupIcon: icon(BookOpen),
    title: "2. Roles y Permisos",
    icon: icon(Shield),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Cada usuario puede tener diferentes roles en diferentes empresas. Un mismo usuario puede ser
          Administrador en una empresa y Contador en otra.
        </p>
        <FieldTable
          fields={[
            { field: "Administrador", type: "Acceso total", desc: "Configura la empresa, gestiona miembros, cierra períodos, ve auditoría" },
            { field: "Contador", type: "Operativa completa", desc: "Crea y postea asientos, genera libros, calcula impuestos" },
            { field: "Asistente", type: "Operativa limitada", desc: "Carga SIFEN, revisa comprobantes, consulta información" },
            { field: "Auditor", type: "Solo lectura", desc: "Acceso de solo lectura a toda la información" },
            { field: "Cliente", type: "Portal del cliente", desc: "Ve balances, estados financieros, descarga reportes" },
          ]}
        />
        <Warning>
          El rol <strong>Administrador</strong> puede reabrir períodos cerrados. Esta acción queda registrada en el audit log con el motivo.
        </Warning>
      </div>
    ),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 2: ACCESO Y NAVEGACIÓN
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "login",
    group: "Acceso y Navegación",
    groupIcon: icon(LayoutDashboard),
    title: "3. Inicio de Sesión",
    icon: icon(Lock),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El acceso a InteliCont es mediante <strong className="text-white">Magic Link</strong> (sin contraseña)
          o <strong className="text-white">Email + Contraseña</strong>. La pantalla de login se adapta a desktop y móvil.
        </p>

        <MockCard title="Pantalla de Login">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-sm mx-auto space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-primary font-bold text-sm">InteliCont</span>
              </div>
              <p className="text-gray-400 text-xs">Contabilidad Inteligente</p>
            </div>
            <div className="flex bg-gray-800 rounded-lg p-0.5">
              <button className="flex-1 text-[10px] py-1.5 rounded-md bg-primary text-white font-semibold">Magic Link</button>
              <button className="flex-1 text-[10px] py-1.5 rounded-md text-gray-500">Contraseña</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Email</label>
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300">admin@estudio.com.py</div>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Contraseña</label>
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300">••••••••</div>
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-primary to-primary/80 text-white text-xs font-semibold py-2.5 rounded-lg shadow-lg shadow-primary/20">
              Ingresar →
            </button>
            <p className="text-center text-[10px] text-gray-600">¿Olvidaste tu contraseña?</p>
          </div>
          <p className="text-center text-[10px] text-gray-600 mt-4">© 2026 IntelliHouse · RUC 80144114-5</p>
        </MockCard>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Modo Magic Link (recomendado)</h4>
          <StepList
            steps={[
              {
                title: "Ingrese su email",
                body: <>Escriba su correo electrónico (debe ser con el que fue invitado). El navegador valida el formato automáticamente.</>
              },
              {
                title: "Enviar enlace",
                body: <>Haga clic en <strong className="text-white">"Enviar enlace mágico"</strong> o presione Enter. El botón muestra un spinner mientras procesa.</>
              },
              {
                title: "Revise su email",
                body: <>Busque el correo de InteliCont (asunto: "Tu enlace para acceder a InteliCont"). Si no lo ve, revise la bandeja de spam. El enlace expira en 1 hora.</>
              },
              {
                title: "Haga clic en el enlace",
                body: <>Al hacer clic, se abre una nueva pestaña. El sistema verifica el token y lo redirige al Dashboard automáticamente.</>
              },
            ]}
          />
        </div>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Modo Contraseña</h4>
          <StepList
            steps={[
              {
                title: "Cambie al modo contraseña",
                body: <>Haga clic en <strong className="text-white">"Contraseña"</strong> en el toggle superior.</>
              },
              {
                title: "Ingrese credenciales",
                body: <>Complete email y contraseña. Use <strong className="text-white">"¿Olvidaste tu contraseña?"</strong> si no la recuerda.</>
              },
              {
                title: "Ingresar",
                body: <>Haga clic en <strong className="text-white">"Ingresar"</strong>. Si las credenciales son incorrectas, verá un mensaje de error rojo.</>
              },
            ]}
          />
        </div>

        <FieldTable
          fields={[
            { field: "Idle", type: "Formulario vacío", desc: "Botón activo. Ingrese email y envíe." },
            { field: "Loading", type: "Spinner en botón", desc: "Espere mientras se envía el enlace." },
            { field: "Success", type: "Mensaje verde", desc: "Enlace enviado. Revise su email." },
            { field: "Error", type: "Mensaje rojo", desc: "Corrija el error y reintente." },
          ]}
        />
      </div>
    ),
  },

  {
    id: "onboarding",
    group: "Acceso y Navegación",
    groupIcon: icon(LayoutDashboard),
    title: "4. Onboarding Inicial",
    icon: icon(Sparkles),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          La primera vez que accede al sistema, un asistente de configuración lo guía para dejar todo listo.
        </p>
        <StepList
          steps={[
            {
              title: "Bienvenida",
              body: <>Un modal de bienvenida explica las capacidades principales del sistema: importación SIFEN, contabilidad automatizada, IA, reportes fiscales.</>
            },
            {
              title: "Crear o unirse a un estudio",
              body: <>Si es el administrador, crea el estudio contable con RUC, razón social y datos de contacto. Si es invitado, selecciona el estudio al que fue invitado.</>
            },
            {
              title: "Primera empresa",
              body: <>Agregue al menos una empresa contribuyente con su RUC, régimen tributario (IRE General / Simple / Resimple) y plan de cuentas inicial.</>
            },
            {
              title: "Configurar SIFEN",
              body: <>Registre los timbrados activos de la empresa para habilitar la importación y emisión de comprobantes electrónicos.</>
            },
            {
              title: "¡Listo!",
              body: <>El Dashboard muestra los indicadores principales. Puede comenzar a cargar facturas o crear asientos manuales.</>
            },
          ]}
        />
        <Tip>
          Si omite el onboarding, puede acceder a la configuración desde <AppLink href="/configuracion" label="Configuración" /> en cualquier momento.
        </Tip>
      </div>
    ),
  },

  {
    id: "interfaz-principal",
    group: "Acceso y Navegación",
    groupIcon: icon(LayoutDashboard),
    title: "5. Interfaz Principal",
    icon: icon(LayoutDashboard),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          La interfaz se compone de cuatro elementos principales que se mantienen consistentes en todo el sistema.
        </p>
        <MockCard title="Estructura de la interfaz">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <MockTopbar />
            <div className="flex border-t border-gray-800">
              <div className="w-44 bg-gray-900/80 border-r border-gray-800 p-2 space-y-0.5">
                <MockSidebarItem label="Panel General" active />
                <MockSidebarItem label="Carga SIFEN" />
                <MockSidebarItem label="Historial SIFEN" />
                <MockSidebarItem label="Comprobantes" />
                <MockSidebarItem label="Empresas" />
                <div className="border-t border-gray-800 my-2" />
                <MockSidebarItem label="Asientos Contables" />
                <MockSidebarItem label="Plan de Cuentas" />
                <MockSidebarItem label="Libro IVA" />
                <MockSidebarItem label="Impuestos" />
                <MockSidebarItem label="Configuración" />
              </div>
              <div className="flex-1 p-4">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <MockStat label="Ingresos" value="Gs. 120.5M" color="text-emerald-400" />
                  <MockStat label="Gastos" value="Gs. 45.2M" color="text-red-400" />
                  <MockStat label="Efectivo" value="Gs. 32.8M" />
                </div>
                <div className="bg-gray-800/50 rounded-lg h-24 border border-gray-800 flex items-center justify-center text-[10px] text-gray-600">
                  Contenido principal del módulo seleccionado
                </div>
              </div>
            </div>
          </div>
        </MockCard>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: "Barra Superior (TopBar)", desc: "Contiene el buscador global (⌘K), selector de empresa, notificaciones, perfil de usuario y tema." },
            { title: "Barra Lateral (Sidebar)", desc: "Navegación principal del sistema. Agrupa los módulos en 5 categorías. Se puede colapsar (⌘B)." },
            { title: "Entity Switcher", desc: "Selector de empresa activa. Cambia todo el contexto: plan de cuentas, asientos, configuración." },
            { title: "Paleta de Comandos", desc: "Acceso rápido a cualquier módulo y acción con ⌘K. Escriba para filtrar resultados." },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
              <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
              <p className="text-gray-400 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  {
    id: "sidebar",
    group: "Acceso y Navegación",
    groupIcon: icon(LayoutDashboard),
    title: "6. Barra Lateral (Sidebar)",
    icon: icon(LayoutDashboard),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          La Sidebar es el menú de navegación principal. Contiene 5 grupos de módulos más el acceso al perfil.
          Se puede colapsar con <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">⌘B</kbd>.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {[
            { group: "Gestión Principal", items: "Panel General, Carga SIFEN, Historial SIFEN, Bandeja Comprobantes, Empresas", icon: LayoutDashboard },
            { group: "Contabilidad", items: "Asientos Contables, Plan de Cuentas, Libros Diarios/Mayores, Bienes de Uso, Cierre de Períodos, Estados Financieros, Clientes/Proveedores", icon: FileText },
            { group: "Tesorería y Finanzas", items: "Conciliación Bancaria, Caja Chica, Órdenes de Pago", icon: DollarSign },
            { group: "Gestión Fiscal", items: "Calendario Fiscal, Libro IVA / RG90, Liquidación Impuestos, Retenciones Tesaka, Timbrados", icon: Calculator },
            { group: "Soporte y Configuración", items: "Reportes, Auditoría, Mi Estudio, Manual de Usuario, Superadmin", icon: Settings },
          ].map((g, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <g.icon className="h-4 w-4 text-primary" />
                <p className="font-semibold text-white text-sm">{g.group}</p>
              </div>
              <p className="text-gray-400 text-xs">{g.items}</p>
            </div>
          ))}
        </div>
        <Tip>
          Use las teclas <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">G</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">[letra]</kbd> para navegar rápidamente entre módulos desde la paleta de comandos.
        </Tip>
      </div>
    ),
  },

  {
    id: "entity-switcher",
    group: "Acceso y Navegación",
    groupIcon: icon(LayoutDashboard),
    title: "7. Selector de Empresa",
    icon: icon(Building2),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El Entity Switcher en la TopBar permite cambiar entre empresas sin cerrar sesión.
          Al seleccionar una empresa, TODO el contexto cambia: plan de cuentas, asientos, saldos, configuración.
        </p>
        <MockCard title="Entity Switcher">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden max-w-xs shadow-xl shadow-black/30">
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-900/80">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">Empresa activa</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Empresa ABC S.A.</p>
                    <p className="text-[10px] text-gray-500">RUC: 8.014.411-5</p>
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </div>
            </div>
            <div className="px-2 py-2 space-y-0.5">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider px-2 py-1">Cambiar a</p>
              {[
                { name: "Distribuidora XYZ S.A.", ruc: "8.012.345-6", active: false },
                { name: "Importaciones del Sur", ruc: "8.023.456-7", active: false },
                { name: "Comercial Norte S.R.L.", ruc: "8.034.567-8", active: false },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                  <div className="h-6 w-6 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center">
                    <Building2 className="h-3 w-3 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-300 truncate">{e.name}</p>
                    <p className="text-[9px] text-gray-600">RUC: {e.ruc}</p>
                  </div>
                </div>
              ))}
              <div className="px-2 py-2 mt-1 border-t border-gray-800">
                <button className="text-[10px] text-primary font-semibold flex items-center gap-1">
                  <PlusCircle className="h-3 w-3" /> Agregar empresa
                </button>
              </div>
            </div>
          </div>
        </MockCard>
        <StepList
          steps={[
            { title: "Abra el selector", body: <>Haga clic en el nombre de la empresa actual en la TopBar, o use <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">⌘E</kbd>.</> },
            { title: "Seleccione la empresa", body: <>Aparece una lista de todas las empresas que gestiona. La activa tiene un ícono de check. Haga clic en la que desee usar.</> },
            { title: "Contexto actualizado", body: <>La interfaz se recarga con los datos de la empresa seleccionada: dashboard, asientos, cuentas, todo cambia.</> },
          ]}
        />
      </div>
    ),
  },

  {
    id: "command-palette",
    group: "Acceso y Navegación",
    groupIcon: icon(LayoutDashboard),
    title: "8. Paleta de Comandos (⌘K)",
    icon: icon(Keyboard),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          La paleta de comandos es el acceso más rápido a cualquier funcionalidad del sistema.
          Se abre con <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">⌘K</kbd> y permite buscar módulos y acciones.
        </p>
        <MockCard title="Paleta de Comandos">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden max-w-lg mx-auto shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <Search className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-400 flex-1">Buscar módulos y acciones...</span>
              <kbd className="text-[9px] text-gray-600 border border-gray-700 rounded px-1.5 py-0.5">ESC</kbd>
            </div>
            <div className="px-2 py-2 max-h-64 overflow-y-auto">
              <p className="text-[9px] text-gray-600 uppercase tracking-wider px-2 py-1.5 font-semibold">Módulos</p>
              {[
                { label: "Panel General", shortcut: "GD", icon: LayoutDashboard },
                { label: "Carga SIFEN", shortcut: "GS", icon: Upload },
                { label: "Asientos Contables", shortcut: "GA", icon: FileText },
                { label: "Plan de Cuentas", shortcut: "GP", icon: FolderTree },
                { label: "Empresas", shortcut: "GE", icon: Building2 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors group">
                  <item.icon className="h-3.5 w-3.5 text-gray-500 group-hover:text-primary" />
                  <span className="text-xs text-gray-300 flex-1">{item.label}</span>
                  <div className="flex gap-0.5">
                    {item.shortcut.split("").map((k, j) => (
                      <kbd key={j} className="text-[9px] text-gray-600 border border-gray-700 rounded px-1 bg-gray-800/50">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-800 mt-1 pt-1">
                <p className="text-[9px] text-gray-600 uppercase tracking-wider px-2 py-1.5 font-semibold">Acciones</p>
                {["Nuevo asiento contable", "Importar comprobantes SIFEN", "Generar Libro IVA"].map((action, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                    <Zap className="h-3.5 w-3.5 text-amber-500/60" />
                    <span className="text-xs text-gray-400">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MockCard>
        <Tip>
          También puede usar <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">G</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">[letra]</kbd> para navegación rápida: <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">G</kbd><kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">D</kbd> = Dashboard, <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">G</kbd><kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">A</kbd> = Asientos.
        </Tip>
      </div>
    ),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 3: GESTIÓN PRINCIPAL
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    group: "Gestión Principal",
    groupIcon: icon(LayoutDashboard),
    title: "9. Dashboard",
    icon: icon(LayoutDashboard),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El Dashboard es la página principal que se muestra al iniciar sesión. Proporciona una visión general
          del estado financiero de la empresa activa con indicadores clave y accesos directos.
        </p>
        <MockCard title="Panel General">
          <div className="space-y-4">
            <MockTopbar />
            <div className="bg-gray-900 rounded-b-xl border border-gray-800 border-t-0 p-4 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <MockStat label="Ingresos" value="Gs. 120.5M" sub="↑ 12% vs ant." color="text-emerald-400" />
                <MockStat label="Gastos" value="Gs. 45.2M" sub="↑ 3% vs ant." color="text-red-400" />
                <MockStat label="Efectivo" value="Gs. 32.8M" sub="3 cuentas" color="text-white" />
                <MockStat label="IVA Crédito" value="Gs. 305K" sub="Acumulado" color="text-blue-400" />
              </div>
              <div className="bg-gray-800/50 rounded-xl border border-gray-800 p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Ingresos vs Gastos — 2026</p>
                <div className="flex items-end gap-1 h-20">
                  {[30, 45, 35, 55, 40, 65, 50, 70, 45, 80, 60, 75].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-0.5">
                      <div className="bg-emerald-500/30 rounded-t" style={{ height: `${h * 0.6}px` }} />
                      <div className="bg-red-500/30 rounded-b" style={{ height: `${h * 0.3}px` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-gray-600 mt-2">
                  <span>Ene</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dic</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-xl border border-gray-800 p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Últimos asientos</p>
                  {[
                    { desc: "Pago proveedor ABC", monto: "Gs. 6.105.000", badge: "green" as const },
                    { desc: "Factura venta XYZ", monto: "Gs. 3.450.000", badge: "green" as const },
                    { desc: "Ajuste tipo cambio", monto: "Gs. 250.000", badge: "yellow" as const },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                      <span className="text-[11px] text-gray-300">{e.desc}</span>
                      <MockBadge variant={e.badge}>{e.monto}</MockBadge>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-800/50 rounded-xl border border-gray-800 p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Accesos rápidos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {["Cargar SIFEN", "Nuevo Asiento", "Libro IVA", "Conciliar"].map((a, i) => (
                      <button key={i} className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold py-2 rounded-lg hover:bg-primary/20 transition-colors">{a}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </MockCard>
      </div>
    ),
  },

  {
    id: "empresas",
    group: "Gestión Principal",
    groupIcon: icon(LayoutDashboard),
    title: "10. Empresas",
    icon: icon(Building2),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El módulo Empresas administra los contribuyentes (clientes) que el estudio contable gestiona.
          Cada empresa tiene su propio contexto contable independiente.
        </p>
        <FieldTable
          fields={[
            { field: "RUC", type: "Texto con validación", desc: "Formato paraguayo X.XXX.XXX-X con dígito verificador" },
            { field: "Razón Social", type: "Texto", desc: "Nombre legal completo de la empresa" },
            { field: "Nombre Comercial", type: "Texto opcional", desc: "Nombre de fantasía si difiere del legal" },
            { field: "Régimen", type: "Select", desc: "IRE General / IRE Simple / IRE Resimple / ESFL" },
            { field: "Dirección", type: "Texto", desc: "Dirección fiscal del contribuyente" },
            { field: "Teléfono / Email", type: "Texto", desc: "Datos de contacto" },
            { field: "Estado", type: "Select", desc: "Activo / Inactivo" },
            { field: "Plan de Cuentas", type: "Automático", desc: "Se genera según el régimen tributario" },
          ]}
        />
        <StepList
          steps={[
            { title: "Ir a Empresas", body: <>Haga clic en <strong className="text-white">Empresas</strong> en la Sidebar (Gestión Principal).</> },
            { title: "Agregar empresa", body: <>Haga clic en <strong className="text-white">"+ Nuevo"</strong>. Complete el RUC — el sistema valida el formato y dígito verificador en tiempo real.</> },
            { title: "Completar datos", body: <>Ingrese razón social, régimen tributario, dirección y contacto. Seleccione el plan de cuentas inicial.</> },
            { title: "Guardar", body: <>La empresa aparece inmediatamente en el selector de empresas y en la lista. Ya puede comenzar a operar.</> },
          ]}
        />
      </div>
    ),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 4: SIFEN
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "sifen-carga",
    group: "SIFEN",
    groupIcon: icon(Upload),
    title: "11. SIFEN — Carga de Facturas",
    icon: icon(Upload),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El módulo SIFEN permite importar comprobantes electrónicos desde archivos XML descargados del
          portal SIFEN de la SET/DNIT, o sincronizar automáticamente vía API.
        </p>
        <MockCard title="Carga SIFEN — Asistente de importación">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-700 hover:border-primary/50 rounded-xl p-8 text-center transition-colors cursor-pointer bg-gray-900/50">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 mb-3">
                <FileUp className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">Arrastre sus archivos XML aquí</p>
              <p className="text-[11px] text-gray-500">o haga clic para seleccionar · XML SIFEN · Hasta 50 archivos</p>
            </div>
            <div className="space-y-2">
              {[
                { name: "001-001-0001234.xml", size: "3.2 KB", status: "ok" },
                { name: "001-001-0001235.xml", size: "2.8 KB", status: "ok" },
                { name: "001-001-0001236.xml", size: "4.1 KB", status: "loading" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2.5">
                  <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-gray-300 truncate">{f.name}</p>
                    <p className="text-[9px] text-gray-600">{f.size}</p>
                  </div>
                  {f.status === "ok" ? (
                    <MockBadge variant="green">✓ Válido</MockBadge>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-primary">Procesando</span>
                    </div>
                  )}
                  <button className="text-gray-600 hover:text-gray-400"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <span className="text-[11px] text-gray-500">2 archivos válidos · 1 procesando</span>
              <button className="bg-primary text-white text-[11px] font-semibold px-4 py-2 rounded-lg shadow-lg shadow-primary/20">
                Importar 2 archivos
              </button>
            </div>
          </div>
        </MockCard>
        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Paso a paso</h4>
          <StepList
            steps={[
              { title: "Acceda a Carga SIFEN", body: <>En la Sidebar, Gestión Principal → <strong className="text-white">Carga SIFEN</strong>.</> },
              { title: "Seleccione archivos", body: <>Arrastre los XML directamente al área punteada, o haga clic para abrir el selector de archivos. Puede cargar hasta 50 archivos simultáneamente.</> },
              { title: "Revise los archivos", body: <>Cada archivo cargado aparece con su nombre y tamaño. Los archivos válidos muestran check verde. Si hay errores, se marcan en rojo con descripción del problema.</> },
              { title: "Importar", body: <>Haga clic en <strong className="text-white">"Importar"</strong>. El sistema procesa cada XML, extrae los datos fiscales, identifica al emisor y prepara una sugerencia de asiento.</> },
              { title: "Resultado", body: <>Los comprobantes importados aparecen en la Bandeja de Comprobantes con estado "Pendiente" listos para revisión y contabilización.</> },
            ]}
          />
        </div>
        <Tip>
          La sincronización automática vía API SIFEN está disponible. Configure las credenciales en <AppLink href="/configuracion" label="Configuración → Integraciones" />.
        </Tip>
      </div>
    ),
  },

  {
    id: "sifen-historial",
    group: "SIFEN",
    groupIcon: icon(Upload),
    title: "12. SIFEN — Historial",
    icon: icon(Clock),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El Historial SIFEN muestra todos los comprobantes importados con su estado de procesamiento.
          Desde aquí puede aprobar, rechazar, o ver el detalle de cada comprobante.
        </p>
        <MockCard title="Historial SIFEN">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                <Search className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-[11px] text-gray-500">Buscar por CDC, factura, proveedor...</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Todos</span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900/80 text-[9px] text-gray-600 uppercase tracking-wider font-semibold">
                <div className="col-span-3">Documento</div>
                <div className="col-span-3">Proveedor</div>
                <div className="col-span-2">Fecha</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-2 text-right">Estado</div>
              </div>
              {[
                { doc: "001-001-012345", prov: "Dist. ABC S.A.", fecha: "03/07/2026", total: "Gs. 6.105.000", status: "green" as const, label: "Contabilizado" },
                { doc: "001-004-067890", prov: "Ferretería XYZ", fecha: "02/07/2026", total: "Gs. 2.350.000", status: "yellow" as const, label: "Pendiente" },
                { doc: "001-001-054321", prov: "Tigo S.A.", fecha: "28/06/2026", total: "Gs. 850.000", status: "red" as const, label: "Error" },
                { doc: "001-003-098765", prov: "Petrobras PY", fecha: "25/06/2026", total: "Gs. 1.200.000", status: "blue" as const, label: "Analizando" },
              ].map((r, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                  <div className="col-span-3 font-mono text-[11px] text-white">{r.doc}</div>
                  <div className="col-span-3 text-[11px] text-gray-300 truncate">{r.prov}</div>
                  <div className="col-span-2 text-[11px] text-gray-500">{r.fecha}</div>
                  <div className="col-span-2 text-[11px] text-gray-300 text-right font-mono">{r.total}</div>
                  <div className="col-span-2 text-right"><MockBadge variant={r.status}>{r.label}</MockBadge></div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-600">
              <span>Mostrando 1-4 de 47 comprobantes</span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700">←</button>
                <button className="px-2 py-1 rounded bg-primary text-white">1</button>
                <button className="px-2 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700">2</button>
                <button className="px-2 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700">3</button>
                <button className="px-2 py-1 rounded bg-gray-800 text-gray-400 hover:bg-gray-700">→</button>
              </div>
            </div>
          </div>
        </MockCard>
        <FieldTable
          fields={[
            { field: "Documento", type: "Texto", desc: "Número de factura (001-001-XXXXX) o CDC" },
            { field: "Proveedor", type: "Texto", desc: "Nombre del emisor del comprobante" },
            { field: "Fecha", type: "Fecha", desc: "Fecha de emisión del comprobante" },
            { field: "Total", type: "Monto", desc: "Importe total del documento" },
            { field: "Estado", type: "Badge", desc: "Contabilizado / Pendiente / Error / Analizando" },
            { field: "JE", type: "Enlace", desc: "Número del asiento contable vinculado (si existe)" },
          ]}
        />
      </div>
    ),
  },

  {
    id: "sifen-emitir",
    group: "SIFEN",
    groupIcon: icon(Upload),
    title: "13. SIFEN — Emitir Comprobantes",
    icon: icon(Send),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Emite comprobantes electrónicos directamente desde InteliCont. Soporta Factura Electrónica,
          Nota de Crédito, Nota de Débito y Autofactura.
        </p>
        <MockCard title="SIFEN — Emitir Comprobantes">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {["Factura Electrónica", "Nota de Crédito", "Nota de Débito", "Autofactura"].map((t, i) => (
                <button key={i} className={`text-[10px] py-2 rounded-lg border font-semibold transition-colors ${i === 0 ? 'bg-primary/15 border-primary/30 text-primary' : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'}`}>{t}</button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Timbrado</label>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono">12345678</div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Punto de expedición</label>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono">001-001</div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500">Fecha de emisión</label>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300">27/07/2026</div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500">Cliente / Proveedor</label>
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-gray-300">Distribuidora ABC S.A. — RUC: 8.012.345-6</span>
                <button className="bg-primary/15 text-primary text-[10px] font-semibold px-2 py-1 rounded-md">Nuevo</button>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-gray-800 text-[9px] text-gray-600 uppercase font-semibold">
                <div className="col-span-2">Descripción</div>
                <div className="text-center">Cant.</div>
                <div className="text-right">P. Unitario</div>
                <div className="text-right">Total</div>
              </div>
              {[
                { desc: "Servicio de consultoría", cant: 1, precio: "Gs. 5.000.000", total: "Gs. 5.000.000", iva: "10%" },
                { desc: "Material de oficina", cant: 10, precio: "Gs. 55.000", total: "Gs. 550.000", iva: "10%" },
                { desc: "Flete internacional", cant: 1, precio: "Gs. 850.000", total: "Gs. 850.000", iva: "Exento" },
              ].map((item, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-gray-800 last:border-0 text-[11px]">
                  <div className="col-span-2 text-gray-300">{item.desc}</div>
                  <div className="text-center text-gray-400">{item.cant}</div>
                  <div className="text-right text-gray-300 font-mono">{item.precio}</div>
                  <div className="text-right text-gray-300 font-mono">{item.total}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
              <div className="text-[10px] text-gray-500 space-y-0.5">
                <p>Exenta: Gs. 850.000 · Base 10%: Gs. 5.550.000 · IVA 10%: Gs. 555.000</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500">Total</p>
                <p className="text-lg font-bold text-white">Gs. 6.955.000</p>
              </div>
            </div>
          </div>
        </MockCard>
        <StepList
          steps={[
            { title: "Seleccione tipo", body: <>Elija entre Factura Electrónica, Nota de Crédito, Nota de Débito o Autofactura.</> },
            { title: "Datos del comprobante", body: <>Complete timbrado (8 dígitos, validación automática), punto de expedición, número correlativo y fecha de emisión.</> },
            { title: "Seleccione cliente", body: <>Busque el tercero por nombre o RUC. Si no existe, créelo desde el botón "Nuevo".</> },
            { title: "Agregue items", body: <>Cada item requiere: descripción, cantidad, precio unitario y tasa de IVA (10%, 5% o Exento). El subtotal se calcula automáticamente.</> },
            { title: "Revise totales", body: <>El sistema muestra subtotales por tasa de IVA y el total general. Verifique antes de emitir.</> },
            { title: "Emita el comprobante", body: <>Haga clic en <strong className="text-white">"Emitir"</strong>. El sistema firma digitalmente, genera el CDC y registra el comprobante.</> },
          ]}
        />
        <Warning>
          Si la moneda es USD, el tipo de cambio se autocompleta con la cotización del día pero puede ajustarse manualmente.
        </Warning>
      </div>
    ),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 5: CONTABILIDAD
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "comprobantes-bandeja",
    group: "Contabilidad",
    groupIcon: icon(FileText),
    title: "14. Bandeja de Comprobantes",
    icon: icon(Inbox),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          La bandeja de comprobantes es la cola de procesamiento donde los documentos SIFEN esperan
          clasificación, revisión y conversión a asientos contables. Es el centro de comando diario del contador.
        </p>
        <MockCard title="Bandeja de Comprobantes">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">Pendientes</span>
                  <MockBadge variant="yellow">4</MockBadge>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">Contabilizados</span>
                  <MockBadge variant="green">23</MockBadge>
                </div>
              </div>
              <button className="bg-gradient-to-r from-primary to-primary/80 text-white text-[11px] font-semibold px-3 py-2 rounded-lg shadow-lg shadow-primary/20 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> IA Sugerir todos
              </button>
            </div>
            <div className="space-y-2">
              {[
                { doc: "001-001-012345", prov: "Distribuidora ABC S.A.", monto: "Gs. 6.105.000", ruc: "80012345-6", status: "yellow" as const, label: "Pendiente", hasAI: true },
                { doc: "001-004-067890", prov: "Ferretería XYZ", monto: "Gs. 2.350.000", ruc: "80123456-7", status: "yellow" as const, label: "Pendiente", hasAI: false },
                { doc: "001-003-098765", prov: "Petrobras PY S.A.", monto: "Gs. 1.200.000", ruc: "80234567-8", status: "yellow" as const, label: "Pendiente", hasAI: false },
                { doc: "001-002-034567", prov: "Papelería Central", monto: "Gs. 450.000", ruc: "80345678-9", status: "green" as const, label: "Contabilizado", hasAI: false, je: "JE-2026-044" },
              ].map((c, i) => (
                <div key={i} className={`bg-gray-900 border border-gray-800 rounded-xl p-3 ${c.status === 'green' ? 'opacity-70' : ''}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="font-mono text-[11px] text-white">{c.doc}</span>
                      <MockBadge variant={c.status}>{c.label}</MockBadge>
                    </div>
                    <span className="text-[11px] text-gray-300 font-semibold">{c.monto}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-gray-500">
                      {c.prov} · RUC: {c.ruc}
                      {c.je && <span className="ml-2 text-primary">📎 {c.je}</span>}
                    </div>
                    {c.status !== "green" && (
                      <div className="flex items-center gap-1.5">
                        {c.hasAI && <MockBadge variant="blue">🤖 IA lista</MockBadge>}
                        <button className="bg-primary/15 text-primary text-[10px] font-semibold px-2 py-1 rounded-md">Sugerir asiento</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MockCard>
        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Flujo de trabajo diario</h4>
          <StepList
            steps={[
              { title: "Revise pendientes", body: <>Entre a la bandeja. Los comprobantes sin procesar aparecen primero con estado 🟡 Pendiente.</> },
              { title: "Sugerencia IA", body: <>Haga clic en <strong className="text-white">"Sugerir asiento"</strong>. La IA analiza el comprobante y propone cuentas de débito y crédito.</> },
              { title: "Revise la sugerencia", body: <>En el modal, vea la confianza de la IA (%), las cuentas sugeridas y el razonamiento. Si está correcto, apruebe. Si no, edite antes de aprobar.</> },
              { title: "Contabilizado", body: <>El comprobante pasa a ✅ Contabilizado y se vincula al asiento generado. Ya afecta saldos contables.</> },
            ]}
          />
        </div>
        <Tip>
          Use el botón <strong className="text-white">"IA Sugerir todos"</strong> para procesar por lote todos los pendientes. La IA sugiere asientos para cada uno en paralelo.
        </Tip>
      </div>
    ),
  },

  {
    id: "asientos-listado",
    group: "Contabilidad",
    groupIcon: icon(FileText),
    title: "15. Asientos — Listado",
    icon: icon(FileText),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El listado de asientos es el Libro Diario de la empresa. Muestra todos los asientos contables
          registrados con su fecha, número, descripción y totales.
        </p>
        <MockCard title="Asientos Contables — Listado">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                <Search className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-[11px] text-gray-500">Buscar por descripción, número...</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Julio 2026</span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </div>
              <button className="bg-primary text-white text-[11px] font-semibold px-3 py-2 rounded-lg">+ Nuevo</button>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900/80 text-[9px] text-gray-600 uppercase tracking-wider font-semibold">
                <div className="col-span-2">Nro.</div>
                <div className="col-span-2">Fecha</div>
                <div className="col-span-4">Descripción</div>
                <div className="col-span-2 text-right">Debe</div>
                <div className="col-span-2 text-right">Haber</div>
              </div>
              {[
                { nro: "JE-2026-045", fecha: "27/07/2026", desc: "Pago factura 001-001-012345 — Dist. ABC S.A.", debe: "6.105.000", haber: "6.105.000", status: "green" as const },
                { nro: "JE-2026-044", fecha: "25/07/2026", desc: "Factura venta — Cliente XYZ S.A.", debe: "3.450.000", haber: "3.450.000", status: "green" as const },
                { nro: "JE-2026-043", fecha: "20/07/2026", desc: "Ajuste tipo cambio USD/PYG", debe: "250.000", haber: "250.000", status: "green" as const },
                { nro: "JE-2026-042", fecha: "18/07/2026", desc: "Pago servicios públicos julio", debe: "1.850.000", haber: "1.850.000", status: "green" as const },
                { nro: "JE-2026-041", fecha: "15/07/2026", desc: "Depreciación mensual activos fijos", debe: "3.500.000", haber: "3.500.000", status: "green" as const },
              ].map((a, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="col-span-2 font-mono text-[11px] text-primary">{a.nro}</div>
                  <div className="col-span-2 text-[11px] text-gray-500">{a.fecha}</div>
                  <div className="col-span-4 text-[11px] text-gray-300 truncate">{a.desc}</div>
                  <div className="col-span-2 text-[11px] text-gray-300 text-right font-mono">{a.debe}</div>
                  <div className="col-span-2 text-[11px] text-gray-300 text-right font-mono">{a.haber}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-600">
              <span>Mostrando 1-5 de 22 asientos · Julio 2026</span>
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 rounded bg-gray-800 text-gray-400">←</button>
                <button className="px-2 py-1 rounded bg-primary text-white">1</button>
                <button className="px-2 py-1 rounded bg-gray-800 text-gray-400">2</button>
                <button className="px-2 py-1 rounded bg-gray-800 text-gray-400">→</button>
              </div>
            </div>
          </div>
        </MockCard>
        <FieldTable
          fields={[
            { field: "Nro.", type: "ID correlativo", desc: "Formato: JE-2026-NNN (correlativo por año-empresa)" },
            { field: "Fecha", type: "Fecha", desc: "Fecha contable del asiento" },
            { field: "Descripción", type: "Texto", desc: "Explicación breve de la operación" },
            { field: "Debe", type: "Monto", desc: "Suma total del debe (formateado)" },
            { field: "Haber", type: "Monto", desc: "Suma total del haber (formateado)" },
            { field: "Estado", type: "Badge", desc: "Borrador / Posteado / Reversado / Ajuste" },
          ]}
        />
      </div>
    ),
  },

  {
    id: "asientos-nuevo",
    group: "Contabilidad",
    groupIcon: icon(FileText),
    title: "16. Asientos — Nuevo Asiento",
    icon: icon(PlusCircle),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El formulario de nuevo asiento permite registrar transacciones contables manuales.
          Es la herramienta fundamental del contador.
        </p>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Datos generales</h4>
          <FieldTable
            fields={[
              { field: "Fecha", type: "Date picker", desc: "Fecha contable. No puede estar en período cerrado" },
              { field: "Moneda", type: "Radio PYG/USD", desc: "Moneda base. Todas las líneas en esta moneda" },
              { field: "Tipo de cambio", type: "Number", desc: "Solo si USD. Se autocompleta" },
              { field: "Descripción", type: "Texto", desc: "Obligatorio. Explica la operación" },
              { field: "Tipo", type: "Select", desc: "Ordinario / Ajuste / Apertura / Cierre / Reversión" },
              { field: "Origen", type: "Select", desc: "Manual / SIFEN / Sueldok / InteliMarket / InteliAudit" },
              { field: "Referencia", type: "Texto", desc: "Vínculo opcional a factura o documento externo" },
            ]}
          />
        </div>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Líneas del asiento</h4>
          <MockCard title="Grilla de líneas">
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-3 py-1.5 text-[9px] text-gray-600 uppercase tracking-wider font-semibold">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Cuenta</div>
                <div className="col-span-3 text-right">Débito</div>
                <div className="col-span-3 text-right">Crédito</div>
              </div>
              {[
                { num: 1, cuenta: "1.01.001 — Caja General", debe: "6.105.000", haber: "" },
                { num: 2, cuenta: "2.01.001 — Proveedores Nacionales", debe: "", haber: "6.105.000" },
              ].map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                  <div className="col-span-1 text-[11px] text-gray-500">{l.num}</div>
                  <div className="col-span-5 text-[11px] text-white font-mono">{l.cuenta}</div>
                  <div className="col-span-3 text-right">
                    {l.debe ? <span className="text-[11px] text-emerald-400 font-mono font-semibold">{l.debe}</span> : <span className="text-[11px] text-gray-700">—</span>}
                  </div>
                  <div className="col-span-3 text-right">
                    {l.haber ? <span className="text-[11px] text-red-400 font-mono font-semibold">{l.haber}</span> : <span className="text-[11px] text-gray-700">—</span>}
                  </div>
                </div>
              ))}
              <button className="w-full border border-dashed border-gray-700 hover:border-primary/50 rounded-lg py-2 text-[11px] text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-1">
                <PlusCircle className="h-3 w-3" /> Agregar línea
              </button>
              <div className="flex justify-between items-center pt-2 border-t border-gray-800 px-1">
                <span className="text-[11px] text-gray-500">Total 2 líneas</span>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span>Debe: <span className="text-emerald-400 font-semibold">6.105.000</span></span>
                  <span>Haber: <span className="text-red-400 font-semibold">6.105.000</span></span>
                  <MockBadge variant="green">✓ Cuadra</MockBadge>
                </div>
              </div>
            </div>
          </MockCard>
        </div>

        <StepList
          steps={[
            { title: "Complete datos generales", body: <>Fecha, moneda, descripción clara (ej: "Pago factura 001-001-012345 — Dist. ABC S.A.") y tipo de asiento.</> },
            { title: "Agregue la primera línea", body: <>Busque la cuenta por código o nombre en el autocomplete. Ingrese el monto en débito o crédito (nunca ambos).</> },
            { title: "Balancee el asiento", body: <>Agregue líneas hasta que la suma de débitos = créditos. El sistema muestra la diferencia en tiempo real. Debe ser 0 para postear.</> },
            { title: "Postee o guarde", body: <>Haga clic en <strong className="text-white">"Postear asiento"</strong> para hacerlo definitivo (inmodificable) o <strong className="text-white">"Guardar borrador"</strong> para terminarlo después.</> },
          ]}
        />

        <Warning>
          El asiento debe estar balanceado (débito = crédito) para poder postearlo. El sistema muestra la diferencia en rojo si no cuadra. Revise las líneas antes de postear.
        </Warning>

        <Tip>
          Atajos útiles: <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">Enter</kbd> agrega nueva línea, <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">Ctrl+Enter</kbd> postea el asiento, <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-white text-xs">↑↓</kbd> navega entre líneas.
        </Tip>
      </div>
    ),
  },

  {
    id: "asientos-detalle",
    group: "Contabilidad",
    groupIcon: icon(FileText),
    title: "17. Asientos — Detalle y Reversión",
    icon: icon(Eye),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El detalle del asiento muestra toda la información de una entrada contable. Desde aquí
          se pueden realizar acciones como reversión y ajuste.
        </p>
        <MockCard title="Detalle de asiento">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-primary font-bold">JE-2026-045</span>
                  <MockBadge variant="green">Posteado</MockBadge>
                </div>
                <p className="text-xs text-gray-400">Pago factura 001-001-012345 — Distribuidora ABC S.A.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="bg-amber-500/15 text-amber-400 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1">
                  <GitBranch className="h-3 w-3" /> Reversar
                </button>
                <button className="bg-gray-800 text-gray-400 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-gray-700 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Exportar PDF
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-gray-500">
              <span>Fecha: <span className="text-gray-300">27/07/2026</span></span>
              <span>Moneda: <span className="text-gray-300">PYG</span></span>
              <span>Creado por: <span className="text-gray-300">admin@estudio.com.py</span></span>
              <span>27/07/2026 14:32</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900/80 text-[9px] text-gray-600 uppercase tracking-wider font-semibold">
                <div className="col-span-5">Cuenta</div>
                <div className="col-span-3 text-right">Débito</div>
                <div className="col-span-3 text-right">Crédito</div>
                <div className="col-span-1" />
              </div>
              {[
                { cuenta: "5.01.001 — Compras Mercaderías", debe: "5.550.000", haber: "" },
                { cuenta: "3.03.001 — IVA Crédito Fiscal", debe: "555.000", haber: "" },
                { cuenta: "2.01.001 — Proveedores Nacionales", debe: "", haber: "6.105.000" },
              ].map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-gray-800 last:border-0">
                  <div className="col-span-5 text-[11px] text-gray-300 font-mono">{l.cuenta}</div>
                  <div className="col-span-3 text-right">
                    {l.debe ? <span className="text-[11px] text-emerald-400 font-mono">{l.debe}</span> : <span className="text-[11px] text-gray-700">—</span>}
                  </div>
                  <div className="col-span-3 text-right">
                    {l.haber ? <span className="text-[11px] text-red-400 font-mono">{l.haber}</span> : <span className="text-[11px] text-gray-700">—</span>}
                  </div>
                  <div className="col-span-1" />
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-900/80 border-t border-gray-700">
                <div className="col-span-5 text-[11px] text-gray-500 font-semibold">TOTAL</div>
                <div className="col-span-3 text-right text-[11px] text-emerald-400 font-mono font-bold">6.105.000</div>
                <div className="col-span-3 text-right text-[11px] text-red-400 font-mono font-bold">6.105.000</div>
                <div className="col-span-1" />
              </div>
            </div>
          </div>
        </MockCard>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Reversión (contra-asiento)</h4>
          <StepList
            steps={[
              { title: "Abra el detalle", body: <>Haga clic en cualquier asiento del listado para ver su detalle completo.</> },
              { title: "Inicie reversión", body: <>Haga clic en <strong className="text-white">"Reversar"</strong>. Aparece un modal de confirmación.</> },
              { title: "Indique el motivo", body: <>Escriba la razón de la reversión (obligatorio). Queda registrado en el audit log.</> },
              { title: "Confirme", body: <>El sistema crea un nuevo asiento con todas las líneas invertidas (débitos ↔ créditos). El original cambia a estado "Reversado".</> },
            ]}
          />
        </div>

        <Warning>
          Una vez posteado, un asiento NO se puede modificar ni eliminar. La reversión crea un nuevo asiento que anula los efectos del original. Ambos quedan visibles en el libro diario.
        </Warning>
      </div>
    ),
  },

  {
    id: "plan-cuentas",
    group: "Contabilidad",
    groupIcon: icon(FileText),
    title: "18. Plan de Cuentas",
    icon: icon(FolderTree),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El Plan de Cuentas es el catálogo jerárquico de cuentas contables. Sigue la estructura
          DNIT paraguaya con 4 niveles y soporta importación por lote.
        </p>
        <MockCard title="Plan de Cuentas — Árbol">
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
              <Search className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-[11px] text-gray-500">Buscar por código o nombre...</span>
            </div>
            <div className="space-y-1 text-[11px]">
              {[
                { code: "1", name: "Activo", indent: 0, color: "text-blue-400", bold: true },
                { code: "1.01", name: "Activo Corriente", indent: 1, color: "text-blue-400/70" },
                { code: "1.01.001", name: "Caja General", indent: 2, color: "text-gray-300", saldo: "Gs. 4.250.000" },
                { code: "1.01.002", name: "Banco Nacional", indent: 2, color: "text-gray-300", saldo: "Gs. 28.550.000" },
                { code: "1.01.003", name: "Clientes", indent: 2, color: "text-gray-300", saldo: "Gs. 45.230.000", active: true },
                { code: "1.02", name: "Activo No Corriente", indent: 1, color: "text-blue-400/70" },
                { code: "1.02.001", name: "Inmuebles", indent: 2, color: "text-gray-300", saldo: "Gs. 180.000.000" },
                { code: "2", name: "Pasivo", indent: 0, color: "text-red-400", bold: true },
                { code: "2.01", name: "Pasivo Corriente", indent: 1, color: "text-red-400/70" },
                { code: "2.01.001", name: "Proveedores Nacionales", indent: 2, color: "text-gray-300", saldo: "Gs. 12.300.000" },
                { code: "2.01.002", name: "IVA Débito Fiscal", indent: 2, color: "text-gray-300", saldo: "Gs. 250.000" },
              ].map((c, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${c.active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-gray-800/50'}`} style={{ paddingLeft: `${(c.indent + 1) * 12}px` }}>
                  {!c.bold && <div className="h-px w-3 bg-gray-700 shrink-0" />}
                  <span className={`font-mono ${c.color} ${c.bold ? 'font-bold' : ''}`}>{c.code}</span>
                  <span className={`${c.color} ${c.bold ? 'font-semibold' : ''}`}>{c.name}</span>
                  {c.saldo && <span className="ml-auto text-[10px] text-gray-500 font-mono">{c.saldo}</span>}
                </div>
              ))}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-white font-semibold">1.01.003 — Clientes</p>
                <p className="text-[10px] text-gray-500">Tipo: Activo · Naturaleza: Deudora · Moneda: PYG</p>
              </div>
              <span className="text-sm font-bold text-white font-mono">Gs. 45.230.000</span>
            </div>
          </div>
        </MockCard>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Estructura jerárquica</h4>
          <FieldTable
            fields={[
              { field: "Nivel 1", type: "X", desc: "Grupo: 1 Activo, 2 Pasivo, 3 Patrimonio, 4 Ingresos, 5 Egresos..." },
              { field: "Nivel 2", type: "X.XX", desc: "Subgrupo: 1.01 Activo Corriente" },
              { field: "Nivel 3", type: "X.XX.XXX", desc: "Rubro: 1.01.001 Caja" },
              { field: "Nivel 4", type: "X.XX.XXX.XX", desc: "Subrubro (opcional). Solo este nivel acepta movimientos" },
            ]}
          />
        </div>

        <StepList
          steps={[
            { title: "Crear cuenta", body: <>Seleccione la cuenta padre en el árbol y haga clic en <strong className="text-white">"+ Nueva cuenta"</strong>. Complete código, nombre, moneda y si acepta movimientos.</> },
            { title: "Importar por lote", body: <>Use <strong className="text-white">"Importar"</strong> para cargar un archivo CSV/Excel con la plantilla oficial. El sistema valida y previsualiza antes de importar.</> },
          ]}
        />
      </div>
    ),
  },

  {
    id: "activos-fijos",
    group: "Contabilidad",
    groupIcon: icon(FileText),
    title: "19. Activos Fijos",
    icon: icon(Package),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Gestiona los activos fijos (bienes de uso) de la empresa con cálculo automático de depreciación
          lineal y generación de asientos contables.
        </p>
        <MockCard title="Activos Fijos">
          <div className="space-y-3">
            {[
              { cod: "ACT-001", nombre: "Notebook Dell Latitude 5540", tipo: "Equipo", fecha: "15/01/2026", costo: "Gs. 8.500.000", vidaUtil: 4, depreciacion: "25%", valorNeto: "Gs. 6.375.000", cuentaActivo: "1.02.003", cuentaDepr: "1.02.004" },
              { cod: "ACT-002", nombre: "Toyota Hilux 2.8 CDI 4x4", tipo: "Vehículo", fecha: "01/03/2025", costo: "Gs. 280.000.000", vidaUtil: 5, depreciacion: "20%", valorNeto: "Gs. 212.800.000", cuentaActivo: "1.02.001", cuentaDepr: "1.02.002" },
              { cod: "ACT-003", nombre: "Aire Acondicionado Inverter", tipo: "Equipo", fecha: "10/06/2026", costo: "Gs. 4.200.000", vidaUtil: 10, depreciacion: "10%", valorNeto: "Gs. 4.025.000", cuentaActivo: "1.02.003", cuentaDepr: "1.02.004" },
            ].map((a, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-white font-semibold">{a.nombre}</span>
                        <span className="text-[9px] text-gray-600 font-mono">{a.cod}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{a.tipo} · Adquirido: {a.fecha}</span>
                    </div>
                  </div>
                  <MockBadge variant="green">En uso</MockBadge>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[10px]">
                  <div>
                    <p className="text-gray-600">Costo</p>
                    <p className="text-gray-300 font-mono font-semibold">{a.costo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Deprec. ({a.depreciacion}/año)</p>
                    <p className="text-gray-300 font-mono">{a.vidaUtil} años</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Valor Neto</p>
                    <p className="text-white font-mono font-bold">{a.valorNeto}</p>
                  </div>
                </div>
                <MockProgress value={75} max={100} label="Vida útil" />
              </div>
            ))}
          </div>
        </MockCard>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Registrar activo</h4>
          <StepList
            steps={[
              { title: "Datos del activo", body: <>Nombre, tipo (inmueble/vehículo/equipo), fecha de adquisición y costo sin IVA.</> },
              { title: "Vida útil", body: <>Defina los años de vida útil. El sistema calcula el % anual (100%/vida_útil).</> },
              { title: "Cuentas contables", body: <>Seleccione la cuenta de activo y la cuenta de depreciación acumulada en el plan de cuentas.</> },
              { title: "Guardar", body: <>El activo aparece en el listado con estado "En uso".</> },
            ]}
          />
        </div>

        <div>
          <h4 className="font-semibold text-white text-sm mb-3">Depreciación mensual</h4>
          <StepList
            steps={[
              { title: "Seleccione período", body: <>Haga clic en <strong className="text-white">"Depreciar"</strong>. Elija el mes a depreciar.</> },
              { title: "Revise el cálculo", body: <>Depreciación del mes = (Costo × % anual) / 12. El sistema muestra el asiento propuesto.</> },
              { title: "Confirmar", body: <>El sistema crea automáticamente el asiento de depreciación y actualiza el valor del activo.</> },
            ]}
          />
        </div>
      </div>
    ),
  },

  {
    id: "terceros",
    group: "Contabilidad",
    groupIcon: icon(FileText),
    title: "20. Terceros",
    icon: icon(Users),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Catálogo de personas y empresas con las que la empresa se relaciona comercialmente:
          clientes, proveedores, empleados, etc.
        </p>
        <MockCard title="Terceros">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                <Search className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-[11px] text-gray-500">Buscar por RUC, nombre...</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Todos</span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </div>
              <button className="bg-primary text-white text-[11px] font-semibold px-3 py-2 rounded-lg">+ Nuevo</button>
            </div>
            <div className="space-y-2">
              {[
                { nombre: "Distribuidora ABC S.A.", ruc: "8.012.345-6", tipo: "Proveedor", direccion: "Av. Eusebio Ayala 567, Asunción", saldo: "Gs. 12.300.000", tipoColor: "blue" as const },
                { nombre: "Cliente XYZ S.A.", ruc: "8.023.456-7", tipo: "Cliente", direccion: "Av. Mariscal López 1234, Asunción", saldo: "Gs. 6.105.000", tipoColor: "green" as const },
                { nombre: "Ferretería XYZ S.R.L.", ruc: "8.034.567-8", tipo: "Proveedor", direccion: "Barrio San Roque, Luque", saldo: "Gs. 2.350.000", tipoColor: "blue" as const },
                { nombre: "Estudio ABC S.A.", ruc: "8.045.678-9", tipo: "Cliente", direccion: "Shopping del Sol, Piso 3", saldo: "Gs. 1.800.000", tipoColor: "green" as const },
              ].map((t, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-[11px] text-white font-semibold">{t.nombre}</p>
                        <p className="text-[10px] text-gray-500 font-mono">RUC: {t.ruc}</p>
                      </div>
                    </div>
                    <MockBadge variant={t.tipoColor}>{t.tipo}</MockBadge>
                  </div>
                  <div className="flex items-center justify-between ml-10">
                    <p className="text-[10px] text-gray-500">{t.direccion}</p>
                    <span className="text-[11px] text-gray-300 font-mono font-semibold">{t.saldo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MockCard>

        <FieldTable
          fields={[
            { field: "Tipo", type: "Radio", desc: "Cliente / Proveedor / Ambos / Empleado / Otro" },
            { field: "RUC", type: "Texto validado", desc: "Formato PY con dígito verificador" },
            { field: "Razón Social", type: "Texto", desc: "Nombre completo (obligatorio)" },
            { field: "Dirección", type: "Texto", desc: "Calle, número, ciudad" },
            { field: "Teléfono / Email", type: "Texto", desc: "Datos de contacto" },
            { field: "Estado", type: "Select", desc: "Activo / Inactivo" },
            { field: "Moneda", type: "Select", desc: "PYG / USD por defecto" },
          ]}
        />
      </div>
    ),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 6: TESORERÍA Y FINANZAS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "bancos",
    group: "Tesorería y Finanzas",
    groupIcon: icon(DollarSign),
    title: "21. Bancos y Conciliación",
    icon: icon(Landmark),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Administra las cuentas bancarias de la empresa y realiza la conciliación bancaria mensual
          para verificar que los saldos contables coincidan con los extractos bancarios.
        </p>
        <MockCard title="Conciliación Bancaria">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" />
                <span className="text-xs text-white font-semibold">Banco Nacional del Paraguay — Cta. 1234567890</span>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="text-gray-500">Saldo Libro: <span className="text-white font-mono font-semibold">Gs. 45.230.000</span></span>
                <span className="text-gray-500">Saldo Banco: <span className="text-white font-mono font-semibold">Gs. 45.500.000</span></span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-800 bg-blue-500/5">
                  <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Libro Contable</p>
                </div>
                {[
                  { fecha: "01/07", desc: "Depósito efectivo", monto: "Gs. 2.000.000", ok: true },
                  { fecha: "05/07", desc: "Cheque #12345", monto: "Gs. 1.500.000", ok: true },
                  { fecha: "10/07", desc: "Transferencia proveedor", monto: "Gs. 270.000", ok: false },
                  { fecha: "15/07", desc: "Comisión bancaria", monto: "Gs. 35.000", ok: true },
                ].map((m, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 border-b border-gray-800 last:border-0 ${m.ok ? '' : 'bg-amber-500/5'}`}>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${m.ok ? 'border-emerald-500 bg-emerald-500/20' : 'border-amber-500'}`}>
                      {m.ok && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-300 truncate">{m.desc}</p>
                      <p className="text-[9px] text-gray-600">{m.fecha}</p>
                    </div>
                    <span className="text-[10px] text-gray-300 font-mono">{m.monto}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-800 bg-purple-500/5">
                  <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">Extracto Bancario</p>
                </div>
                {[
                  { fecha: "01/07", desc: "Depósito efectivo", monto: "Gs. 2.000.000", ok: true },
                  { fecha: "05/07", desc: "Cheque #12345", monto: "Gs. 1.500.000", ok: true },
                  { fecha: "08/07", desc: "Comisión mantenimiento", monto: "Gs. 85.000", ok: false },
                  { fecha: "15/07", desc: "Comisión bancaria", monto: "Gs. 35.000", ok: true },
                ].map((m, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 border-b border-gray-800 last:border-0 ${m.ok ? '' : 'bg-amber-500/5'}`}>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${m.ok ? 'border-emerald-500 bg-emerald-500/20' : 'border-amber-500'}`}>
                      {m.ok && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-300 truncate">{m.desc}</p>
                      <p className="text-[9px] text-gray-600">{m.fecha}</p>
                    </div>
                    <span className="text-[10px] text-gray-300 font-mono">{m.monto}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span className="text-[11px] text-amber-400 font-semibold">Diferencia: Gs. 355.000</span>
                <span className="text-[10px] text-gray-500">(2 movimientos sin conciliar)</span>
              </div>
              <button className="bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-emerald-500/20">Confirmar conciliación</button>
            </div>
          </div>
        </MockCard>

        <StepList
          steps={[
            { title: "Cargar extracto", body: <>Seleccione la cuenta bancaria y cargue el extracto en formato CSV u OFX. El sistema importa los movimientos automáticamente.</> },
            { title: "Coincidencias automáticas", body: <>El sistema sugiere matches por monto y fecha. Marque con ✓ los que coinciden. Los que no, quedan señalados como diferencias.</> },
            { title: "Resolver diferencias", body: <>Para movimientos en libro sin banco (flotantes) o en banco sin libro (comisiones), agregue asientos de ajuste.</> },
            { title: "Confirmar", body: <>Cuando la diferencia sea 0, haga clic en <strong className="text-white">"Confirmar conciliación"</strong>. Queda registrada con usuario y fecha.</> },
          ]}
        />
      </div>
    ),
  },

  {
    id: "caja-chica",
    group: "Tesorería y Finanzas",
    groupIcon: icon(DollarSign),
    title: "22. Caja Chica",
    icon: icon(Wallet),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Gestiona fondos fijos de caja chica con registro de gastos y reposiciones automáticas
          que generan asientos contables.
        </p>
        <MockCard title="Caja Chica">
          <div className="space-y-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <span className="text-sm text-white font-bold">Caja Chica General</span>
                  <MockBadge variant="green">Activo</MockBadge>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">Saldo disponible</p>
                  <p className="text-lg font-bold text-white font-mono">Gs. 800.000 <span className="text-xs text-gray-500 font-normal">/ Gs. 2.000.000</span></p>
                </div>
              </div>
              <MockProgress value={800000} max={2000000} label="Nivel de fondo" />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/80">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Últimos movimientos</p>
              </div>
              {[
                { fecha: "27/07/2026", desc: "Café y snacks reunión", monto: "-Gs. 45.000", cat: "Alimentos", saldo: "Gs. 800.000", tipo: "gasto" },
                { fecha: "25/07/2026", desc: "Refrigerios oficina", monto: "-Gs. 120.000", cat: "Alimentos", saldo: "Gs. 845.000", tipo: "gasto" },
                { fecha: "20/07/2026", desc: "Reposición de fondo", monto: "+Gs. 1.000.000", cat: "Reposición", saldo: "Gs. 965.000", tipo: "repo" },
                { fecha: "18/07/2026", desc: "Impresiones y papelería", monto: "-Gs. 85.000", cat: "Oficina", saldo: "Gs. 1.965.000", tipo: "gasto" },
                { fecha: "15/07/2026", desc: "Taxi reunión cliente", monto: "-Gs. 35.000", cat: "Transporte", saldo: "Gs. 2.050.000", tipo: "gasto" },
              ].map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-800 last:border-0 text-[11px]">
                  <div className="col-span-2 text-gray-500">{m.fecha}</div>
                  <div className="col-span-3 text-gray-300 truncate">{m.desc}</div>
                  <div className="col-span-2"><MockBadge variant={m.tipo === "repo" ? "green" : "gray"}>{m.cat}</MockBadge></div>
                  <div className={`col-span-2 text-right font-mono font-semibold ${m.tipo === "repo" ? 'text-emerald-400' : 'text-red-400'}`}>{m.monto}</div>
                  <div className="col-span-3 text-right font-mono text-gray-400">{m.saldo}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-primary text-white text-[11px] font-semibold px-3 py-2 rounded-lg flex-1">Registrar gasto</button>
              <button className="bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold px-3 py-2 rounded-lg border border-emerald-500/20 flex-1">Reponer fondo</button>
            </div>
          </div>
        </MockCard>

        <StepList
          steps={[
            { title: "Registrar gasto", body: <>Haga clic en <strong className="text-white">"Registrar gasto"</strong>. Complete fecha, concepto, monto, beneficiario (opcional) y categoría.</> },
            { title: "Reponer fondo", body: <>Cuando el saldo llegue a un mínimo, haga clic en <strong className="text-white">"Reponer fondo"</strong>. El sistema calcula el monto a reponer y genera el asiento contable automático.</> },
          ]}
        />
      </div>
    ),
  },

  {
    id: "tesoreria",
    group: "Tesorería y Finanzas",
    groupIcon: icon(DollarSign),
    title: "23. Tesorería",
    icon: icon(TrendingUp),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El módulo de tesorería provee una visión global del flujo de efectivo con proyección a 30 días
          y alertas de vencimientos próximos.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Ingresos del mes", value: "Gs. 120.500.000", color: "text-green-400" },
            { label: "Egresos del mes", value: "Gs. 98.200.000", color: "text-red-400" },
            { label: "Saldo operativo", value: "Gs. 22.300.000", color: "text-white" },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs">{item.label}</p>
              <p className={`font-bold text-sm ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>
        <MockCard title="Próximos vencimientos (7 días)">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <MockStat label="Ingresos mes" value="Gs. 120.5M" color="text-emerald-400" />
              <MockStat label="Egresos mes" value="Gs. 98.2M" color="text-red-400" />
              <MockStat label="Saldo operativo" value="Gs. 22.3M" />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/80">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Vencimientos próximos</p>
              </div>
              {[
                { fecha: "28/07/2026", desc: "Pago Proveedor XYZ", monto: "Gs. 6.105.000", prioridad: "red" as const, label: "Vence mañana" },
                { fecha: "30/07/2026", desc: "Sueldos personal julio", monto: "Gs. 25.000.000", prioridad: "yellow" as const, label: "3 días" },
                { fecha: "31/07/2026", desc: "IVA Formulario 104 (Junio)", monto: "Gs. 4.500.000", prioridad: "yellow" as const, label: "4 días" },
                { fecha: "05/08/2026", desc: "Alquiler oficina agosto", monto: "Gs. 8.500.000", prioridad: "gray" as const, label: "9 días" },
                { fecha: "15/08/2026", desc: "Anticipo IRE Q3", monto: "Gs. 3.200.000", prioridad: "gray" as const, label: "19 días" },
              ].map((v, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-gray-800 last:border-0">
                  <div className="col-span-2 text-[11px] text-gray-300 font-mono">{v.fecha}</div>
                  <div className="col-span-4 text-[11px] text-gray-300">{v.desc}</div>
                  <div className="col-span-2 text-right text-[11px] text-gray-300 font-mono font-semibold">{v.monto}</div>
                  <div className="col-span-4 text-right"><MockBadge variant={v.prioridad}>{v.label}</MockBadge></div>
                </div>
              ))}
            </div>
          </div>
        </MockCard>
      </div>
    ),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 7: GESTIÓN FISCAL
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "libro-iva",
    group: "Gestión Fiscal",
    groupIcon: icon(Calculator),
    title: "24. Libro IVA",
    icon: icon(BookMarked),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El Libro IVA registra todas las operaciones de compra y venta con desglose de IVA.
          Es obligatorio para la presentación del Formulario 104.
        </p>
        <MockCard title="Libro IVA">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-800 bg-emerald-500/5 flex items-center justify-between">
                  <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Compras — IVA Crédito</p>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Gs. 605.000</span>
                </div>
                {[
                  { prov: "Dist. ABC S.A.", base10: "5.550.000", base5: "—", iva: "555.000" },
                  { prov: "Farmacia XYZ", base10: "—", base5: "1.000.000", iva: "50.000" },
                ].map((c, i) => (
                  <div key={i} className="grid grid-cols-4 gap-1 px-3 py-2 border-b border-gray-800 last:border-0 text-[10px]">
                    <div className="text-gray-300 truncate">{c.prov}</div>
                    <div className="text-right text-gray-400 font-mono">{c.base10}</div>
                    <div className="text-right text-gray-400 font-mono">{c.base5}</div>
                    <div className="text-right text-gray-300 font-mono font-semibold">{c.iva}</div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-800 bg-red-500/5 flex items-center justify-between">
                  <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">Ventas — IVA Débito</p>
                  <span className="text-[10px] text-red-400 font-mono font-bold">Gs. 300.000</span>
                </div>
                {[
                  { client: "Cliente XYZ S.A.", base10: "3.000.000", iva: "300.000" },
                ].map((v, i) => (
                  <div key={i} className="grid grid-cols-3 gap-1 px-3 py-2 border-b border-gray-800 last:border-0 text-[10px]">
                    <div className="text-gray-300 truncate">{v.client}</div>
                    <div className="text-right text-gray-400 font-mono">{v.base10}</div>
                    <div className="text-right text-gray-300 font-mono font-semibold">{v.iva}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-r from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">IVA Débito: <span className="text-red-400 font-mono">Gs. 300.000</span></span>
                <span className="text-gray-500">IVA Crédito: <span className="text-emerald-400 font-mono">Gs. 605.000</span></span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500">Saldo a favor</p>
                <p className="text-sm font-bold text-emerald-400 font-mono">Gs. 305.000</p>
              </div>
            </div>
          </div>
        </MockCard>
        <div className="bg-gradient-to-r from-gray-900 to-gray-950 border border-gray-800 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">IVA Débito - IVA Crédito:</span>
            <span className="text-green-400 font-bold">Gs. 0 (Crédito fiscal: Gs. 305.000)</span>
          </div>
        </div>
        <Tip>
          Exporte el Libro IVA en formato Hechauka (CSV) para importar directamente en el aplicativo Aranduka de la SET/DNIT.
        </Tip>
      </div>
    ),
  },

  {
    id: "impuestos",
    group: "Gestión Fiscal",
    groupIcon: icon(Calculator),
    title: "25. Impuestos",
    icon: icon(Calculator),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Centraliza la generación y presentación de declaraciones juradas: IVA (Formulario 104),
          IRE (Formulario 501), IRP (Formulario 400) e IDU (Formulario 250).
        </p>
        <MockCard title="Declaraciones disponibles">
          <div className="space-y-3">
            {[
              { form: "Formulario 104", impuesto: "IVA", monto: "Gs. 0 (Crédito fiscal: Gs. 305.000)", vence: "15/08/2026", estado: "red" as const, estadoLabel: "No presentado" },
              { form: "Formulario 501", impuesto: "IRE General", monto: "Gs. 2.450.000", vence: "31/08/2026", estado: "red" as const, estadoLabel: "No presentado" },
              { form: "Formulario 120", impuesto: "Retenciones", monto: "Gs. 180.000", vence: "15/08/2026", estado: "yellow" as const, estadoLabel: "Pendiente" },
              { form: "Formulario 400", impuesto: "IRP", monto: "Gs. 0", vence: "30/09/2026", estado: "gray" as const, estadoLabel: "Próximo" },
            ].map((d, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-[11px] text-white font-semibold">{d.form} — {d.impuesto}</p>
                      <p className="text-[10px] text-gray-500">Monto: <span className="text-gray-300 font-mono">{d.monto}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <MockBadge variant={d.estado}>{d.estadoLabel}</MockBadge>
                    <p className="text-[10px] text-gray-500 mt-1">Vence: <span className="text-gray-300">{d.vence}</span></p>
                  </div>
                </div>
                {d.estado !== "gray" && (
                  <div className="flex justify-end">
                    <button className="bg-primary/15 text-primary text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-primary/20 flex items-center gap-1">
                      Declarar <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </MockCard>

        <StepList
          steps={[
            { title: "Seleccione el impuesto", body: <>Haga clic en <strong className="text-white">"Declarar"</strong> en el formulario deseado (104, 501, etc.).</> },
            { title: "Revise valores", body: <>El sistema precarga los datos del Libro IVA o del balance. Verifique cada línea del formulario.</> },
            { title: "Presente", body: <>Haga clic en <strong className="text-white">"Presentar declaración"</strong>. Si hay monto a pagar, el sistema redirige al pago. Si es cero o saldo a favor, queda presentado.</> },
            { title: "Descargue comprobante", body: <>El sistema genera un comprobante de presentación. Puede descargar el PDF para presentar físicamente si es necesario.</> },
          ]}
        />
      </div>
    ),
  },

  {
    id: "tesaka",
    group: "Gestión Fiscal",
    groupIcon: icon(Calculator),
    title: "26. Retenciones Tesaka",
    icon: icon(Receipt),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Tesaka gestiona las retenciones de IVA, IRE, IRP e INR. Calcula automáticamente
          los porcentajes según las reglas fiscales paraguayas y genera certificados.
        </p>
        <FieldTable
          fields={[
            { field: "IVA 50%", type: "50% del IVA", desc: "Facturas de servicios en general. Tasa efectiva: 2.5% o 5%" },
            { field: "IVA 100%", type: "100% del IVA", desc: "Facturas del Estado, ONGs, organismos internacionales" },
            { field: "IRE General", type: "1.5%", desc: "Servicios personales, honorarios profesionales" },
            { field: "IRE Simple", type: "1%", desc: "Pequeños contribuyentes" },
            { field: "IRE Resimple", type: "0.5%", desc: "Microcontribuyentes" },
            { field: "IRP", type: "Escala 0-10%", desc: "Honorarios profesionales, servicios personales" },
            { field: "INR", type: "15%", desc: "Servicios del exterior" },
          ]}
        />

        <StepList
          steps={[
            { title: "Seleccione tipo", body: <>Elija el tipo de retención (IVA 50%, IRE, IRP, etc.).</> },
            { title: "Seleccione proveedor", body: <>Busque el proveedor en el autocomplete de terceros.</> },
            { title: "Seleccione factura", body: <>Elija la factura que origina la retención. El sistema calcula automáticamente base, tasa e importe.</> },
            { title: "Registre", body: <>Confirme la retención. El sistema genera el registro, el certificado PDF y el asiento contable correspondiente.</> },
          ]}
        />
      </div>
    ),
  },

  {
    id: "timbrados",
    group: "Gestión Fiscal",
    groupIcon: icon(Calculator),
    title: "27. Timbrados",
    icon: icon(Ticket),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Controla los timbrados fiscales: vigencia, cantidad de facturas usadas, alertas de vencimiento.
        </p>
        <MockCard title="Timbrados">
          <div className="space-y-3">
            {[
              { num: "12345678", tipo: "Factura Electrónica", punto: "001-001", desde: "01/01/2026", hasta: "31/12/2026", usado: 1234, total: 5000 },
              { num: "87654321", tipo: "Nota de Crédito", punto: "001-001", desde: "01/01/2026", hasta: "31/12/2026", usado: 45, total: 500 },
            ].map((t, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-[11px] text-white font-semibold font-mono">{t.num}</p>
                      <p className="text-[10px] text-gray-500">{t.tipo} · Exp: {t.punto}</p>
                    </div>
                  </div>
                  <MockBadge variant={t.usado / t.total > 0.8 ? "red" : "green"}>{t.usado / t.total > 0.8 ? "Alerta" : "Vigente"}</MockBadge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] mb-3">
                  <div>
                    <p className="text-gray-600">Vigencia</p>
                    <p className="text-gray-300">{t.desde} → {t.hasta}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Comprobantes</p>
                    <p className="text-gray-300 font-mono">{t.usado.toLocaleString()} / {t.total.toLocaleString()}</p>
                  </div>
                </div>
                <MockProgress value={t.usado} max={t.total} label="Uso del timbrado" />
              </div>
            ))}
          </div>
        </MockCard>
        <Tip>
          El sistema muestra alertas automáticas cuando un timbrado está por vencer (&lt;30 días) o supera el 80% de uso.
        </Tip>
      </div>
    ),
  },

  {
    id: "calendario-fiscal",
    group: "Gestión Fiscal",
    groupIcon: icon(Calculator),
    title: "28. Calendario Fiscal",
    icon: icon(Calendar),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Muestra las fechas de vencimiento de todas las obligaciones fiscales según el cronograma DNIT.
          Cada vencimiento tiene un enlace directo al módulo de impuestos.
        </p>
        <MockCard title="Calendario Fiscal">
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-sm text-white font-bold">Julio 2026</p>
              <div className="grid grid-cols-7 gap-1 mt-2 text-[10px]">
                {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d, i) => (
                  <div key={i} className="text-center text-gray-600 py-1">{d}</div>
                ))}
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const hasEvent = [15, 31].includes(day);
                  const isToday = day === 27;
                  return (
                    <div key={i} className={`text-center py-1.5 rounded-lg transition-colors ${isToday ? 'bg-primary text-white font-bold' : hasEvent ? 'bg-amber-500/15 text-amber-400 font-semibold' : 'text-gray-500 hover:bg-gray-800'}`}>
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/80">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Obligaciones del mes</p>
              </div>
              {[
                { dia: 15, desc: "IVA — Formulario 104 (Junio)", estado: "Vence hoy", color: "red" as const },
                { dia: 15, desc: "Retenciones — Formulario 120 (Junio)", estado: "Pendiente", color: "yellow" as const },
                { dia: 31, desc: "IRE — Anticipo Q3 (Julio)", estado: "15 días restantes", color: "gray" as const },
              ].map((e, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-gray-800 last:border-0">
                  <div className="col-span-1 text-[11px] font-mono text-gray-300 font-semibold">{e.dia}</div>
                  <div className="col-span-7 text-[11px] text-gray-300">{e.desc}</div>
                  <div className="col-span-4 text-right"><MockBadge variant={e.color}>{e.estado}</MockBadge></div>
                </div>
              ))}
            </div>
          </div>
        </MockCard>
      </div>
    ),
  },

  {
    id: "rg90",
    group: "Gestión Fiscal",
    groupIcon: icon(Calculator),
    title: "29. RG90",
    icon: icon(FileSearch),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          La RG90 (Resolución General 90) es la conciliación de comprobantes electrónicos exigida por la SET/DNIT.
          El sistema genera automáticamente el archivo CSV para su presentación.
        </p>
        <MockCard title="RG90 — Conciliación de Comprobantes Electrónicos">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white font-semibold">Período:</span>
                <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-[11px] text-gray-300">Julio 2026</div>
              </div>
              <button className="bg-primary text-white text-[11px] font-semibold px-3 py-2 rounded-lg">Generar RG90</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-800 bg-emerald-500/5 flex items-center justify-between">
                  <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Emitidos</p>
                  <MockBadge variant="green">23 docs</MockBadge>
                </div>
                <div className="p-2 space-y-1">
                  {["001-001-012345 — Dist. ABC — Gs. 6.105.000", "001-004-067890 — Ferretería XYZ — Gs. 2.350.000", "001-003-098765 — Petrobras — Gs. 1.200.000"].map((d, i) => (
                    <div key={i} className="text-[10px] text-gray-400 font-mono px-2 py-1 rounded bg-gray-800/50 truncate">{d}</div>
                  ))}
                  <p className="text-[9px] text-gray-600 text-center">+ 20 más</p>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-800 bg-blue-500/5 flex items-center justify-between">
                  <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Recibidos</p>
                  <MockBadge variant="blue">47 docs</MockBadge>
                </div>
                <div className="p-2 space-y-1">
                  {["001-001-054321 — Tigo — Gs. 850.000", "001-002-034567 — Papelería — Gs. 450.000", "001-005-011111 — ANDE — Gs. 1.800.000"].map((d, i) => (
                    <div key={i} className="text-[10px] text-gray-400 font-mono px-2 py-1 rounded bg-gray-800/50 truncate">{d}</div>
                  ))}
                  <p className="text-[9px] text-gray-600 text-center">+ 44 más</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-emerald-300">Conciliación completa — Sin inconsistencias detectadas</span>
            </div>
            <button className="w-full bg-gray-900 border border-gray-800 text-gray-300 text-[11px] font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
              Descargar archivo RG90 (CSV) <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </MockCard>
        <StepList
          steps={[
            { title: "Seleccione período", body: <>Elija el mes a reportar.</> },
            { title: "Genere RG90", body: <>Haga clic en <strong className="text-white">"Generar RG90"</strong>. El sistema recopila todos los comprobantes SIFEN del período en dos listas: emitidos y recibidos.</> },
            { title: "Verifique inconsistencias", body: <>Use <strong className="text-white">"Verificar inconsistencias"</strong> para encontrar comprobantes faltantes o errores.</> },
            { title: "Descargue", body: <>Haga clic en <strong className="text-white">"Descargar archivo RG90"</strong> (CSV). El archivo se importa directamente al aplicativo Aranduka de la SET.</> },
          ]}
        />
        <Warning>
          La RG90 debe presentarse mensualmente. No hacerlo puede generar multas. Configure recordatorios en el Calendario Fiscal.
        </Warning>
      </div>
    ),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 8: CIERRE Y ESTADOS
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "cierre-periodos",
    group: "Cierre y Estados",
    groupIcon: icon(BarChart3),
    title: "30. Cierre de Períodos",
    icon: icon(Lock),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El cierre de períodos bloquea un mes contable para garantizar la inmutabilidad del libro.
          Una vez cerrado, no se pueden crear ni modificar asientos en ese período.
        </p>
        <MockCard title="Cierre de Períodos — 2026">
          <div className="space-y-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900/80 text-[9px] text-gray-600 uppercase tracking-wider font-semibold">
                <div>Mes</div>
                <div>Estado</div>
                <div className="text-center">Asientos</div>
                <div className="text-center">Libro IVA</div>
                <div className="text-right">Acción</div>
              </div>
              {[
                { mes: "Enero", estado: "Cerrado", badge: "green" as const, asientos: 12, iva: true },
                { mes: "Febrero", estado: "Cerrado", badge: "green" as const, asientos: 18, iva: true },
                { mes: "Marzo", estado: "Cerrado", badge: "green" as const, asientos: 15, iva: true },
                { mes: "Abril", estado: "Cerrado", badge: "green" as const, asientos: 20, iva: true },
                { mes: "Mayo", estado: "Cerrado", badge: "green" as const, asientos: 16, iva: true },
                { mes: "Junio", estado: "Cerrado", badge: "green" as const, asientos: 22, iva: true },
                { mes: "Julio", estado: "Abierto", badge: "yellow" as const, asientos: 8, iva: false, current: true },
              ].map((p, i) => (
                <div key={i} className={`grid grid-cols-5 gap-2 px-3 py-2.5 border-b border-gray-800 last:border-0 ${p.current ? 'bg-primary/5' : 'hover:bg-gray-800/50'}`}>
                  <div className={`text-[11px] ${p.current ? 'text-primary font-semibold' : 'text-gray-300'}`}>{p.mes}</div>
                  <div><MockBadge variant={p.badge}>{p.estado}</MockBadge></div>
                  <div className="text-center text-[11px] text-gray-400 font-mono">{p.asientos}</div>
                  <div className="text-center">
                    {p.iva ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-gray-600 mx-auto" />
                    )}
                  </div>
                  <div className="text-right">
                    {p.current ? (
                      <button className="bg-primary/15 text-primary text-[10px] font-semibold px-2 py-1 rounded-md border border-primary/20">Cerrar mes</button>
                    ) : (
                      <button className="text-[10px] text-gray-600 hover:text-gray-400">Verificar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MockCard>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
          <h4 className="font-semibold text-white text-sm mb-2">Requisitos para cerrar un período</h4>
          <div className="space-y-1.5 text-xs text-gray-400">
            {["✅ Libro IVA generado", "✅ Retenciones registradas", "✅ Balance de sumas y saldos cuadra", "✅ Depreciaciones del mes calculadas", "✅ No hay asientos en borrador"].map((r, i) => (
              <p key={i}>{r}</p>
            ))}
          </div>
        </div>

        <Warning>
          Solo los <strong>Administradores</strong> pueden reabrir un período cerrado. La reapertura queda registrada en el audit log con el motivo. Todos los asientos retroactivos se marcan con el flag allowRetroactive.
        </Warning>
      </div>
    ),
  },

  {
    id: "estados-financieros",
    group: "Cierre y Estados",
    groupIcon: icon(BarChart3),
    title: "31. Estados Financieros",
    icon: icon(BarChart3),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Genera los estados contables obligatorios: Balance de Sumas y Saldos, Balance General,
          Estado de Resultados, Flujo de Efectivo y Evolución Patrimonial.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: "Balance Sumas y Saldos", desc: "Lista cuentas con saldos deudores y acreedores. Debe = Haber" },
            { name: "Balance General", desc: "Activo = Pasivo + Patrimonio Neto. Situación patrimonial" },
            { name: "Estado de Resultados", desc: "Ingresos - Egresos = Resultado del período" },
            { name: "Flujo de Efectivo", desc: "Movimiento de efectivo: operativo, inversión, financiación" },
          ].map((item, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
              <p className="font-semibold text-white text-sm">{item.name}</p>
              <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
        <Tip>
          Los estados se generan automáticamente con los asientos posteados. Exporte en Excel, PDF o CSV. Use la función de impresión para copias físicas.
        </Tip>
      </div>
    ),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 9: CONFIGURACIÓN Y SOPORTE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "configuracion",
    group: "Configuración y Soporte",
    groupIcon: icon(Settings),
    title: "32. Configuración",
    icon: icon(Settings),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El módulo de configuración centraliza todos los ajustes de la empresa activa:
          datos generales, preferencias, integraciones y miembros del equipo.
        </p>
        <div className="space-y-3">
          {[
            { title: "General", items: "Nombre, RUC, dirección, teléfono, email, logo, régimen tributario, actividad económica" },
            { title: "Preferencias", items: "Moneda por defecto, formato de fecha, idioma, zona horaria, decimales, notificaciones" },
            { title: "Integraciones", items: "API Key, webhook URL, conexiones con Sueldok, InteliMarket, InteliAudit" },
            { title: "Miembros del equipo", items: "Lista de usuarios con rol, estado y último acceso. Invitar, editar rol, desactivar, eliminar" },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
              <p className="font-semibold text-white text-sm mb-1">{s.title}</p>
              <p className="text-gray-400 text-xs">{s.items}</p>
            </div>
          ))}
        </div>
        <StepList
          steps={[
            { title: "Invitar miembro", body: <>Vaya a "Miembros del equipo", haga clic en <strong className="text-white">"+ Invitar miembro"</strong>. Ingrese email y seleccione rol. El invitado recibe un magic link por email.</> },
            { title: "Cambiar configuración", body: <>Modifique los datos necesarios y haga clic en <strong className="text-white">"Guardar cambios"</strong>. Los cambios se aplican inmediatamente.</> },
          ]}
        />
      </div>
    ),
  },

  {
    id: "auditoria",
    group: "Configuración y Soporte",
    groupIcon: icon(Settings),
    title: "33. Auditoría",
    icon: icon(Shield),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          El módulo de auditoría registra todos los cambios del sistema en un libro inmutable (append-only).
          Cada evento guarda quién, qué, cuándo, por qué y el estado anterior/nuevo.
        </p>
        <MockCard title="Registro de auditoría">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2">
                <Search className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-[11px] text-gray-500">Buscar por usuario, acción, entidad...</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
                <span className="text-[11px] text-gray-400">Últimos 7 días</span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-800 bg-gray-900/80 text-[9px] text-gray-600 uppercase tracking-wider font-semibold">
                <div className="col-span-3">Fecha / Hora</div>
                <div className="col-span-3">Usuario</div>
                <div className="col-span-2">Acción</div>
                <div className="col-span-2">Entidad</div>
                <div className="col-span-2 text-right">Detalle</div>
              </div>
              {[
                { fecha: "27/07 14:33:22", user: "admin@estudio.com.py", accion: "POSTEAR", entidad: "JE-2026-045", badge: "green" as const },
                { fecha: "27/07 14:30:01", user: "admin@estudio.com.py", accion: "LOGIN", entidad: "Session", badge: "blue" as const },
                { fecha: "27/07 11:15:44", user: "contador@estudio.com.py", accion: "CREAR", entidad: "Tercero", badge: "blue" as const },
                { fecha: "26/07 17:45:12", user: "admin@estudio.com.py", accion: "UPDATE", entidad: "Empresa", badge: "yellow" as const },
                { fecha: "26/07 16:30:00", user: "admin@estudio.com.py", accion: "CERRAR_PERI", entidad: "Julio 2026", badge: "yellow" as const },
                { fecha: "26/07 10:15:33", user: "contador@estudio.com.py", accion: "IMPORTAR", entidad: "SIFEN (3 docs)", badge: "blue" as const },
                { fecha: "25/07 09:00:00", user: "admin@estudio.com.py", accion: "REVERSAR", entidad: "JE-2026-040", badge: "red" as const },
              ].map((e, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors cursor-pointer">
                  <div className="col-span-3 text-[10px] text-gray-500 font-mono">{e.fecha}</div>
                  <div className="col-span-3 text-[10px] text-gray-300 truncate">{e.user}</div>
                  <div className="col-span-2"><MockBadge variant={e.badge}>{e.accion}</MockBadge></div>
                  <div className="col-span-2 text-[10px] text-gray-400 truncate">{e.entidad}</div>
                  <div className="col-span-2 text-right">
                    <button className="text-[10px] text-primary hover:text-primary/80">Ver JSON</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MockCard>
        <FieldTable
          fields={[
            { field: "Filtros", type: "Por usuario, acción, entidad, fecha", desc: "Busque eventos específicos" },
            { field: "Detalle", type: "JSON expandible", desc: "Metadatos: estado anterior, nuevo, IP, user-agent" },
            { field: "Exportación", type: "CSV", desc: "Descargue para análisis externo" },
            { field: "Retención", type: "5 años", desc: "Obligatorio por normas fiscales PY" },
          ]}
        />
      </div>
    ),
  },

  // ──────────────────────────────────────────────────────────────────────────
  // GRUPO 10: REFERENCIA
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "glosario",
    group: "Referencia",
    groupIcon: icon(BookOpen),
    title: "34. Glosario PY",
    icon: icon(BookOpen),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Glosario de términos fiscales y contables paraguayos utilizados en el sistema.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ["SET", "Subsecretaría de Estado de Tributación (ahora DNIT)"],
            ["DNIT", "Dirección Nacional de Ingresos Tributarios"],
            ["RUC", "Registro Único del Contribuyente (X.XXX.XXX-X)"],
            ["Timbrado", "Autorización fiscal de 8 dígitos para emitir comprobantes"],
            ["CDC", "Código de Control de 44 dígitos del SIFEN"],
            ["SIFEN", "Sistema de Facturación Electrónica Nacional"],
            ["KuDE", "Representación gráfica del comprobante (PDF)"],
            ["Hechauka", "Libro Electrónico mensual (guaraní: 'registro')"],
            ["Tesaka", "Sistema de retenciones (guaraní: 'retención')"],
            ["IVA 10%", "Impuesto al Valor Agregado — tasa general"],
            ["IVA 5%", "Impuesto al Valor Agregado — tasa diferenciada"],
            ["IRE", "Impuesto a la Renta Empresarial (Form. 501)"],
            ["IRP", "Impuesto a la Renta Personal (Form. 400)"],
            ["INR", "Impuesto a la Renta de No Residentes"],
            ["IDU", "Impuesto a los Dividendos y Utilidades"],
            ["RG90", "Resolución General 90 — conciliación de comprobantes"],
            ["Formulario 104", "Declaración de IVA"],
            ["Formulario 120", "Declaración de Retenciones"],
            ["Formulario 501", "Declaración de IRE"],
            ["Aranduka", "Aplicativo SET para libros (guaraní: 'libro')"],
          ].map(([term, def], i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
              <p className="font-semibold text-white text-xs">{term}</p>
              <p className="text-gray-400 text-[11px] mt-0.5">{def}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  {
    id: "troubleshooting",
    group: "Referencia",
    groupIcon: icon(BookOpen),
    title: "35. Solución de Problemas",
    icon: icon(AlertTriangle),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Problemas comunes y sus soluciones.
        </p>
        <div className="space-y-4">
          {[
            {
              title: "Login",
      items: [
              ["No recibo el magic link", "Verifique bandeja de spam. Si pasaron 5 min, solicite otro."],
              ["El enlace expiró", "Solicite un nuevo enlace desde la pantalla de login."],
              ["Email no registrado", "Contacte al administrador para verificar el email correcto."],
              ],
            },
            {
              title: "SIFEN",
              items: [
              ["Factura no aparece al importar", "El CDC ya fue importado. Busque en el historial."],
              ["Error timbrado inválido", "Verifique el timbrado en el módulo Timbrados."],
              ["IA no sugiere asiento", "Cree el asiento manualmente en Asientos."],
              ],
            },
            {
              title: "Asientos",
              items: [
              ["No puedo postear", "El asiento no está balanceado (débito ≠ crédito). Revise las líneas."],
              ["Período cerrado", "Cambie la fecha o solicite al admin que reabra el período."],
              ["Quiero eliminar un asiento posteado", "No es posible (libro inmutable). Cree un contra-asiento."],
              ],
            },
            {
              title: "Cierre",
              items: [
              ["No puedo cerrar el mes", "Vea la lista de requisitos en el modal de error y resuélvalos."],
              ["El balance no cuadra", "Genere el balance de sumas y saldos para identificar el problema."],
              ],
            },
          ].map((cat, i) => (
            <div key={i}>
              <h4 className="font-semibold text-white text-sm mb-2">{cat.title}</h4>
              <div className="space-y-1.5">
                {cat.items.map(([problem, solution], j) => (
                  <div key={j} className="flex items-start gap-2 bg-gray-900/40 border border-gray-800 rounded-lg p-3">
                    <span className="text-red-400 text-xs shrink-0 mt-0.5">●</span>
                    <div>
                      <p className="text-white text-xs font-medium">{problem}</p>
                      <p className="text-gray-400 text-[11px]">{solution}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">¿No encuentra su problema?</p>
          <p className="text-primary text-sm">soporte@intelicont.com.py | +595 981 123 456</p>
        </div>
      </div>
    ),
  },

  {
    id: "shortcuts",
    group: "Referencia",
    groupIcon: icon(BookOpen),
    title: "36. Atajos de Teclado",
    icon: icon(Keyboard),
    content: (
      <div className="space-y-5">
        <p className="text-gray-300 text-sm leading-relaxed">
          Atajos de teclado globales y específicos de cada módulo.
        </p>

        <div>
          <h4 className="font-semibold text-white text-sm mb-2">Globales</h4>
          <FieldTable
            fields={[
              { field: "⌘K / Ctrl+K", type: "Paleta de comandos", desc: "Buscar módulos y acciones" },
              { field: "⌘B / Ctrl+B", type: "Sidebar", desc: "Alternar barra lateral" },
              { field: "⌘E / Ctrl+E", type: "Empresa", desc: "Selector de empresa" },
              { field: "⌘, / Ctrl+,", type: "Configuración", desc: "Ir a Configuración" },
            ]}
          />
        </div>

        <div>
          <h4 className="font-semibold text-white text-sm mb-2">Navegación (desde paleta ⌘K)</h4>
          <FieldTable
            fields={[
              { field: "G + D", type: "Dashboard", desc: "Panel General" },
              { field: "G + A", type: "Asientos", desc: "Asientos Contables" },
              { field: "G + S", type: "SIFEN", desc: "Módulo SIFEN" },
              { field: "G + P", type: "Plan de Cuentas", desc: "Plan de Cuentas" },
              { field: "G + I", type: "Impuestos", desc: "Gestión Fiscal" },
              { field: "G + R", type: "Tesaka", desc: "Retenciones" },
            ]}
          />
        </div>

        <div>
          <h4 className="font-semibold text-white text-sm mb-2">Formulario de asiento</h4>
          <FieldTable
            fields={[
              { field: "Enter (último campo)", type: "Nueva línea", desc: "Agrega línea al asiento" },
              { field: "Ctrl+Enter", type: "Postear", desc: "Postea el asiento directamente" },
              { field: "↑ / ↓", type: "Navegar", desc: "Entre líneas del asiento" },
              { field: "Tab", type: "Siguiente campo", desc: "Navega entre campos" },
            ]}
          />
        </div>
      </div>
    ),
  },
];
