import type { CalendarLevel } from "@intelicont/ledger/tax-calendar";

/** Display helpers for the persisted fiscal calendar (`fiscal.upcoming` / `fiscal.calendarMonth`). */

export const OBLIGATION_NAME: Record<string, string> = {
  "104": "Formulario 104 — IVA mensual",
  "955": "Registro de Comprobantes (955)",
  "956": "Formulario 956 — anual",
};

/** Where the obligation is prepared. shortcut: the pages do not take the period from the URL yet. */
export const OBLIGATION_HREF: Record<string, string> = {
  "104": "/fiscal/formulario-104",
  "955": "/fiscal/registro-comprobantes",
};

export const dueLabel = (iso: string) => iso.split("-").reverse().join("/");

/** "Vence en 7 días", "Vence hoy", "Vencido hace 2 días". */
export function noticeLabel(daysLeft: number): string {
  if (daysLeft < 0) return `Vencido hace ${-daysLeft} ${daysLeft === -1 ? "día" : "días"}`;
  if (daysLeft === 0) return "Vence hoy";
  if (daysLeft === 1) return "Vence mañana";
  return `Vence en ${daysLeft} días`;
}

export const LEVEL_BADGE: Record<CalendarLevel | "none", string> = {
  overdue: "bg-red-200 dark:bg-red-500/30 text-red-700 dark:text-red-300",
  "1": "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
  "3": "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400",
  "7": "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  none: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};
