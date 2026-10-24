import {
  LayoutDashboard, Building2, FileText, BookOpen, Users, Settings, Calculator, Calendar, FileCode, FilePlus,
  CreditCard, BarChart3, Hash, ShieldCheck, ClipboardList, Landmark, Coins, Globe, Upload, FolderOpen, Lock, Wallet, Receipt, Scale,
  type LucideIcon,
} from "lucide-react";

/** `preview`: the page still runs on example data (out of the vertical slice); hidden unless "Mostrar módulos en vista previa" is on. */
export type NavItem = {
  path: string; label: string; icon: LucideIcon; preview?: boolean; highlight?: boolean;
  /** Command-palette extras. */
  keywords?: string[]; shortcut?: string;
};
export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Gestión Principal",
    items: [
      { path: "/", icon: LayoutDashboard, label: "Panel General", shortcut: "G D", keywords: ["inicio", "home", "dashboard"] },
      { path: "/sifen", icon: FileCode, label: "Carga SIFEN", highlight: true, keywords: ["factura", "electrónica", "cargar", "xml"] },
      { path: "/sifen/historial", icon: FileCode, label: "Historial SIFEN", preview: true, keywords: ["factura", "historial", "documentos"] },
      { path: "/empresas", icon: Building2, label: "Empresas", shortcut: "G E", keywords: ["compañía", "entidad"] },
    ],
  },
  {
    title: "Contabilidad",
    items: [
      { path: "/asientos", icon: FileText, label: "Asientos Contables", shortcut: "G A", keywords: ["journal", "entrada", "ledger"] },
      { path: "/documentos/nuevo", icon: FilePlus, label: "Comprobante manual", keywords: ["factura", "compra", "venta"] },
      { path: "/cuentas", icon: Hash, label: "Plan de Cuentas", shortcut: "G C", keywords: ["cuenta", "chart", "árbol", "estructura"] },
      { path: "/libros", icon: BookOpen, label: "Libros", keywords: ["diario", "mayor", "iva"] },
      { path: "/terceros", icon: Users, label: "Clientes / Proveedores", keywords: ["partner", "contacto", "persona"] },
      { path: "/auditoria", icon: ShieldCheck, label: "Auditoría", keywords: ["bitácora", "eventos", "cambios"] },
      { path: "/documentos", icon: FolderOpen, label: "Documentos", preview: true },
      { path: "/importar", icon: Upload, label: "Importar Datos", preview: true },
      { path: "/activos", icon: Landmark, label: "Activos Fijos", preview: true },
      { path: "/cierre", icon: Lock, label: "Cierre Mensual", preview: true },
      { path: "/multimoneda", icon: Globe, label: "Multimoneda", preview: true },
    ],
  },
  {
    title: "Finanzas y Fiscal",
    items: [
      { path: "/timbrados", icon: Receipt, label: "Timbrados", keywords: ["timbrado", "factura", "vencimiento", "establecimiento"] },
      { path: "/tesaka", icon: FileText, label: "Tesaka (Retenciones)", keywords: ["tesaka", "retención", "retenciones", "formulario 120"] },
      { path: "/calendario", icon: Calendar, label: "Calendario Fiscal", keywords: ["vencimiento", "fecha", "obligación"] },
      { path: "/fiscal/formulario-104", icon: Calculator, label: "Formulario 104", keywords: ["iva", "declaración", "liquidación"] },
      { path: "/fiscal/registro-comprobantes", icon: ClipboardList, label: "Registro de Comprobantes", keywords: ["955", "compras", "ventas"] },
      { path: "/banco", icon: CreditCard, label: "Conciliación Bancaria", preview: true, keywords: ["banco", "movimientos", "conciliar"] },
      { path: "/cobros-pagos", icon: Wallet, label: "Cobros y Pagos", preview: true },
      { path: "/cuentas-corrientes", icon: Coins, label: "Cuentas Corrientes", preview: true },
      { path: "/rg90", icon: Scale, label: "RG 90", preview: true },
      { path: "/impuestos", icon: Receipt, label: "Impuestos", preview: true, keywords: ["iva", "ire", "retención"] },
      { path: "/fiscal/formularios", icon: FileText, label: "Formularios DNIT", preview: true },
      { path: "/reportes", icon: BarChart3, label: "Reportes", preview: true, keywords: ["informe", "estadística"] },
      { path: "/portal", icon: Globe, label: "Portal del Cliente", preview: true },
    ],
  },
  {
    title: "Configuración",
    items: [
      { path: "/configuracion", icon: Settings, label: "Mi Estudio", shortcut: ",", keywords: ["configuración", "settings", "tema", "preferencias"] },
      { path: "/manual", icon: BookOpen, label: "Manual de Usuario", keywords: ["manual", "guía", "ayuda", "documentación", "tutorial"] },
    ],
  },
];

/** Real sub-pages that live under a preview path. */
const REAL_PATHS = ["/documentos/nuevo"];

/** Pages that still run on example data but are not (or should not be) in the nav. */
const PREVIEW_ONLY_ROUTES = ["/sifen/emitir"];

export const PREVIEW_ROOTS = [...NAV_GROUPS.flatMap((g) => g.items).filter((i) => i.preview).map((i) => i.path), ...PREVIEW_ONLY_ROUTES];

/** True for a preview page or any sub-page of one (`/banco/conciliacion`, `/reportes/eeff`), except the real sub-pages. */
export function isPreviewPath(pathname: string): boolean {
  if (REAL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return PREVIEW_ROOTS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Groups with their visible items; preview items only when the flag is on. Empty groups are dropped. */
export function visibleNavGroups(showPreview: boolean): NavGroup[] {
  return NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => showPreview || !i.preview) }))
    .filter((g) => g.items.length > 0);
}
