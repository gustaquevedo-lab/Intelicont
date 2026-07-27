import { ReactNode } from "react";
import {
  BookOpen, LayoutDashboard, Upload, Clock, Send, Inbox, FileText,
  PlusCircle, Eye, GitBranch, FolderTree, Package, Users, Landmark,
  Wallet, TrendingUp, BookMarked, Calculator, Receipt, Ticket,
  Lock, BarChart3, Calendar, FileSearch, Settings, Shield, Keyboard,
  AlertTriangle, HelpCircle, Building2, Sparkles, ArrowRight,
  CheckCircle2, CreditCard, Globe, DollarSign
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
  <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
    {title && (
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/50">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-gray-600">InteliCont</span>
      </div>
    )}
    <div className="p-4 font-mono text-xs leading-relaxed">{children}</div>
  </div>
);

const Screenshot = ({ src, alt, caption }: { src: string; alt: string; caption?: string }) => (
  <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-800 bg-gray-900/50">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{caption || "InteliCont"}</span>
      <span className="text-[10px] text-gray-600">InteliCont</span>
    </div>
    <div className="p-2">
      <img src={src} alt={alt} className="w-full h-auto rounded-lg border border-gray-800" loading="lazy" />
    </div>
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

        <Screenshot
          src="/manual/00-login-filled.png"
          alt="Pantalla de inicio de sesión de InteliCont con campos de email y contraseña"
          caption="Pantalla de Login"
        />

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
        <Screenshot
          src="/manual/01-dashboard.png"
          alt="Vista principal de InteliCont mostrando TopBar, Sidebar y contenido del Dashboard"
          caption="Estructura de la interfaz"
        />
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
        <Screenshot
          src="/manual/01-dashboard.png"
          alt="Entity Switcher en la TopBar mostrando selector de empresa activa"
          caption="Entity Switcher"
        />
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
        <Screenshot
          src="/manual/01-dashboard.png"
          alt="Paleta de comandos (⌘K) de InteliCont"
          caption="Paleta de Comandos"
        />
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
        <Screenshot
          src="/manual/01-dashboard.png"
          alt="Dashboard principal de InteliCont con indicadores financieros"
          caption="Panel General"
        />
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
        <Screenshot
          src="/manual/03-sifen.png"
          alt="Módulo de carga de facturas SIFEN con área de arrastre de archivos XML"
          caption="Carga SIFEN — Asistente de importación"
        />
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
        <Screenshot
          src="/manual/04-sifen-historial.png"
          alt="Historial de comprobantes SIFEN con estados de procesamiento"
          caption="Historial SIFEN"
        />
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
        <Screenshot
          src="/manual/05-sifen-emitir.png"
          alt="Formulario de emisión de comprobantes electrónicos SIFEN"
          caption="SIFEN — Emitir Comprobantes"
        />
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
        <Screenshot
          src="/manual/06-comprobantes.png"
          alt="Bandeja de comprobantes con lista de documentos SIFEN pendientes"
          caption="Bandeja de Comprobantes"
        />
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
        <Screenshot
          src="/manual/07-asientos.png"
          alt="Listado de asientos contables (Libro Diario) con fechas, descripciones y montos"
          caption="Asientos Contables — Listado"
        />
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
          <Screenshot
            src="/manual/08-asientos-nuevo.png"
            alt="Formulario de nuevo asiento contable con grilla de líneas débito/crédito"
            caption="Grilla de líneas"
          />
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
        <Screenshot
          src="/manual/07-asientos.png"
          alt="Detalle de asiento contable con líneas débito/crédito y opciones de reversión"
          caption="Detalle de asiento"
        />

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
        <Screenshot
          src="/manual/09-cuentas.png"
          alt="Plan de Cuentas jerárquico con estructura DNIT paraguaya"
          caption="Plan de Cuentas — Árbol"
        />

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
        <Screenshot
          src="/manual/10-activos.png"
          alt="Listado de activos fijos con costos, depreciación y valores netos"
          caption="Activos Fijos"
        />

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
        <Screenshot
          src="/manual/11-terceros.png"
          alt="Catálogo de terceros con clientes y proveedores"
          caption="Terceros"
        />

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
        <Screenshot
          src="/manual/13-banco-conciliacion.png"
          alt="Herramienta de conciliación bancaria con movimientos del libro y del banco"
          caption="Conciliación Bancaria"
        />

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
        <Screenshot
          src="/manual/14-caja-chica.png"
          alt="Gestión de caja chica con saldo, gastos y reposiciones"
          caption="Caja Chica"
        />

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
        <Screenshot
          src="/manual/15-tesoreria.png"
          alt="Módulo de tesorería con flujo de efectivo y vencimientos"
          caption="Próximos vencimientos (7 días)"
        />
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
        <Screenshot
          src="/manual/16-libro-iva.png"
          alt="Libro IVA con compras (crédito fiscal) y ventas (débito fiscal)"
          caption="Libro IVA"
        />
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
        <Screenshot
          src="/manual/17-impuestos.png"
          alt="Formularios de impuestos: IVA 104, IRE 501 con estados y vencimientos"
          caption="Declaraciones disponibles"
        />

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
        <Screenshot
          src="/manual/19-timbrados.png"
          alt="Gestión de timbrados fiscales con vigencia y uso"
          caption="Timbrados"
        />
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
        <Screenshot
          src="/manual/22-calendario.png"
          alt="Calendario fiscal con fechas de vencimiento de obligaciones DNIT"
          caption="Calendario Fiscal"
        />
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
        <Screenshot
          src="/manual/23-rg90.png"
          alt="RG90 conciliación de comprobantes electrónicos SET/DNIT"
          caption="RG90"
        />
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
        <Screenshot
          src="/manual/20-cierre.png"
          alt="Cierre de períodos contables con estados abiertos y cerrados"
          caption="Cierre de Períodos — 2026"
        />

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
        <Screenshot
          src="/manual/25-auditoria.png"
          alt="Registro de auditoría con eventos, usuarios y acciones"
          caption="Registro de auditoría"
        />
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
