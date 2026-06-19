export type ObligationType = "iva" | "ire" | "irp" | "inr" | "idu" | "dnit" | "municipal" | "sifen" | "hechauka" | "rg90";
export type ObligationStatus = "pending" | "upcoming" | "completed" | "overdue";
export type Urgency = "normal" | "soon" | "urgent" | "overdue";

export interface FiscalObligation {
  id: string;
  title: string;
  description: string;
  type: ObligationType;
  dueDate: string;
  entity: string;
  status: ObligationStatus;
  urgency: Urgency;
  amount?: number;
  currency?: string;
 rucEnding?: number[];
  period: string;
  completedAt?: string;
}

const OBLIGATION_LABELS: Record<ObligationType, string> = {
  iva: "IVA",
  ire: "IRE",
  irp: "IRP",
  inr: "INR",
  idu: "IDU",
  dnit: "DNIT",
  municipal: "Municipal",
  sifen: "SIFEN",
  hechauka: "Hechauka",
  rg90: "RG90",
};

const OBLIGATION_COLORS: Record<ObligationType, string> = {
  iva: "text-blue-500 dark:text-blue-400",
  ire: "text-emerald-500 dark:text-emerald-400",
  irp: "text-purple-500 dark:text-purple-400",
  inr: "text-orange-500 dark:text-orange-400",
  idu: "text-yellow-500 dark:text-yellow-400",
  dnit: "text-red-500 dark:text-red-400",
  municipal: "text-cyan-500 dark:text-cyan-400",
  sifen: "text-indigo-500 dark:text-indigo-400",
  hechauka: "text-pink-500 dark:text-pink-400",
  rg90: "text-amber-500 dark:text-amber-400",
};

const URGENCY_COLORS: Record<Urgency, string> = {
  normal: "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700",
  soon: "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20",
  urgent: "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
  overdue: "bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/30",
};

const URGENCY_BADGE: Record<Urgency, string> = {
  normal: "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400",
  soon: "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  urgent: "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
  overdue: "bg-red-200 dark:bg-red-500/30 text-red-700 dark:text-red-300 font-semibold",
};

const URGENCY_LABEL: Record<Urgency, string> = {
  normal: "Normal",
  soon: "Próximo",
  urgent: "Urgente",
  overdue: "Vencido",
};

export function getObligationLabel(type: ObligationType) { return OBLIGATION_LABELS[type]; }
export function getObligationColor(type: ObligationType) { return OBLIGATION_COLORS[type]; }
export function getUrgencyBorder(urgency: Urgency) { return URGENCY_COLORS[urgency]; }
export function getUrgencyBadge(urgency: Urgency) { return URGENCY_BADGE[urgency]; }
export function getUrgencyLabel(urgency: Urgency) { return URGENCY_LABEL[urgency]; }

function daysUntil(dateStr: string): number {
  const today = new Date("2026-05-04");
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgency(dueDate: string, status: ObligationStatus): Urgency {
  if (status === "overdue" || status === "completed") return status === "completed" ? "normal" : "overdue";
  const days = daysUntil(dueDate);
  if (days < 0) return "overdue";
  if (days <= 3) return "urgent";
  if (days <= 7) return "soon";
  return "normal";
}

export function getFiscalObligations(): FiscalObligation[] {
  const now = "2026-05-04";

  return [
    {
      id: "ob-1",
      title: "IVA 104 — Mayo 2026",
      description: "Declaración y pago del IVA del período Abril 2026. Formulario 104.",
      type: "iva",
      dueDate: "2026-05-12",
      entity: "Importadora del Este",
      status: "pending",
      urgency: "urgent",
      amount: 12456700,
      currency: "PYG",
      rucEnding: [1, 2],
      period: "Abril 2026",
    },
    {
      id: "ob-2",
      title: "IVA 104 — Mayo 2026",
      description: "Declaración y pago del IVA del período Abril 2026.",
      type: "iva",
      dueDate: "2026-05-14",
      entity: "Tech Asunción",
      status: "upcoming",
      urgency: "soon",
      amount: 8234500,
      currency: "PYG",
      rucEnding: [9, 0],
      period: "Abril 2026",
    },
    {
      id: "ob-3",
      title: "RG90 — Abril 2026",
      description: "Conciliación de comprobantes electrónicos emitidos y recibidos.",
      type: "rg90",
      dueDate: "2026-05-15",
      entity: "Importadora del Este",
      status: "upcoming",
      urgency: "soon",
      period: "Abril 2026",
    },
    {
      id: "ob-4",
      title: "IRE General — Ejercicio 2025",
      description: "Declaración jurada del Impuesto a la Renta Empresarial. Vencimiento por RUC terminado en 3.",
      type: "ire",
      dueDate: "2026-05-31",
      entity: "Importadora del Este",
      status: "upcoming",
      urgency: "normal",
      amount: 234567800,
      currency: "PYG",
      rucEnding: [3],
      period: "Ejercicio 2025",
    },
    {
      id: "ob-5",
      title: "IRP — Ejercicio 2025",
      description: "Declaración del Impuesto a la Renta de Personas Físicas.",
      type: "irp",
      dueDate: "2026-06-30",
      entity: "Estudio Contable PY",
      status: "upcoming",
      urgency: "normal",
      period: "Ejercicio 2025",
    },
    {
      id: "ob-6",
      title: "Retención IVA — Abril 2026",
      description: "Retención del 10% sobre compras gravadas a proveedores no inscriptos.",
      type: "iva",
      dueDate: "2026-05-08",
      entity: "Frigocentral",
      status: "pending",
      urgency: "urgent",
      amount: 1230000,
      currency: "PYG",
      period: "Abril 2026",
    },
    {
      id: "ob-7",
      title: "Hechauka — Abril 2026",
      description: "Libro electrónico de compras y ventas. Exportar CSV para DNIT.",
      type: "hechauka",
      dueDate: "2026-05-20",
      entity: "Importadora del Este",
      status: "upcoming",
      urgency: "normal",
      period: "Abril 2026",
    },
    {
      id: "ob-8",
      title: "Timbrado por vencer",
      description: "Renovar timbrado de facturas — Autorización N° 4523-2026.",
      type: "dnit",
      dueDate: "2026-05-25",
      entity: "Ñandutí Dist.",
      status: "upcoming",
      urgency: "normal",
      period: "Mayo 2026",
    },
    {
      id: "ob-9",
      title: "SIFEN — Documentos pendientes",
      description: "3 facturas de compra sin procesar en el sistema SIFEN.",
      type: "sifen",
      dueDate: "2026-05-10",
      entity: "Tech Asunción",
      status: "pending",
      urgency: "urgent",
      period: "Mayo 2026",
    },
    {
      id: "ob-10",
      title: "Patente Municipal — 2026",
      description: "Pago de patente comercial municipal para Asunción.",
      type: "municipal",
      dueDate: "2026-04-30",
      entity: "Guaraní Consult.",
      status: "overdue",
      urgency: "overdue",
      amount: 850000,
      currency: "PYG",
      period: "Anual 2026",
    },
    {
      id: "ob-11",
      title: "IVA 104 — Abril 2026",
      description: "Declaración y pago del IVA del período Marzo 2026.",
      type: "iva",
      dueDate: "2026-04-15",
      entity: "Importadora del Este",
      status: "completed",
      urgency: "normal",
      amount: 11234500,
      currency: "PYG",
      period: "Marzo 2026",
      completedAt: "2026-04-12",
    },
    {
      id: "ob-12",
      title: "IDU — Dividendos Q1 2026",
      description: "Impuesto a los Dividendos — Distribución de utilidades primer trimestre.",
      type: "idu",
      dueDate: "2026-05-30",
      entity: "Importadora del Este",
      status: "upcoming",
      urgency: "normal",
      amount: 4500000,
      currency: "PYG",
      period: "Q1 2026",
    },
    {
      id: "ob-13",
      title: "INR — No Residentes",
      description: "Retención a pagos a personas físicas o jurídicas del exterior.",
      type: "inr",
      dueDate: "2026-05-18",
      entity: "Tech Asunción",
      status: "upcoming",
      urgency: "normal",
      amount: 2100000,
      currency: "PYG",
      period: "Abril 2026",
    },
  ];
}

export function getRucEndingDeadline(rucEnding: number, obligation: string): number {
  const map: Record<string, number[]> = {
    "iva": [12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
    "ire": [15, 20, 25, 30, 5, 10, 15, 20, 25, 31],
  };
  const deadlines = map[obligation] || [];
  return deadlines[rucEnding % 10] || 15;
}

export function getCalendarStats(obligations: FiscalObligation[]) {
  return {
    total: obligations.length,
    pending: obligations.filter((o) => o.status === "pending" || o.status === "upcoming").length,
    urgent: obligations.filter((o) => o.urgency === "urgent").length,
    overdue: obligations.filter((o) => o.urgency === "overdue").length,
    completed: obligations.filter((o) => o.status === "completed").length,
    totalAmount: obligations
      .filter((o) => o.status !== "completed" && o.amount)
      .reduce((s, o) => s + (o.amount || 0), 0),
  };
}
