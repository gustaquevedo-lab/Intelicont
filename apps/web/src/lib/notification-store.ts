"use client";

import { create } from "zustand";

export interface Notification {
  id: string;
  type: "iva" | "ire" | "irp" | "hechauka" | "sifen" | "retencion" | "timbrado" | "cierre";
  title: string;
  description: string;
  entityId: string;
  entityName: string;
  dueDate: string;
  daysLeft: number;
  urgency: "critical" | "warning" | "info";
  read: boolean;
  action?: { label: string; href: string };
}

function generateNotifications(): Notification[] {
  const now = new Date("2026-05-05");
  const e1 = "e1";
  const e2 = "e2";
  const e3 = "e3";

  return [
    {
      id: "n1", type: "iva", entityId: e1, entityName: "Importadora del Este",
      title: "IVA — Formulario 104", description: "Declaración jurada de IVA mensual",
      dueDate: "2026-05-12", daysLeft: 7, urgency: "critical", read: false,
      action: { label: "Preparar Form. 104", href: "/fiscal/formulario-104" },
    },
    {
      id: "n2", type: "sifen", entityId: e1, entityName: "Importadora del Este",
      title: "3 documentos SIFEN pendientes", description: "XML recibidos sin asiento generado",
      dueDate: "2026-05-08", daysLeft: 3, urgency: "warning", read: false,
      action: { label: "Revisar Bandeja", href: "/sifen/historial" },
    },
    {
      id: "n3", type: "ire", entityId: e2, entityName: "Tecnología Asunción",
      title: "IRE — Formulario 1301", description: "Declaración jurada de IRE mensual",
      dueDate: "2026-05-15", daysLeft: 10, urgency: "warning", read: false,
      action: { label: "Ver Calendario", href: "/calendario" },
    },
    {
      id: "n4", type: "hechauka", entityId: e1, entityName: "Importadora del Este",
      title: "Hechauka — Libro Electrónico", description: "Presentación mensual RG 90/2021",
      dueDate: "2026-05-25", daysLeft: 20, urgency: "info", read: false,
      action: { label: "Descargar CSV", href: "/fiscal/hechauka" },
    },
    {
      id: "n5", type: "timbrado", entityId: e3, entityName: "Distribuciones Ñandutí",
      title: "Timbrado por vencer", description: "Timbrado 12345678 vence en 15 días",
      dueDate: "2026-05-20", daysLeft: 15, urgency: "warning", read: false,
      action: { label: "Gestionar", href: "/sifen" },
    },
    {
      id: "n6", type: "retencion", entityId: e1, entityName: "Importadora del Este",
      title: "Retenciones IRP por pagar", description: "Retenciones efectuadas en el mes",
      dueDate: "2026-05-20", daysLeft: 15, urgency: "info", read: false,
    },
    {
      id: "n7", type: "cierre", entityId: e1, entityName: "Importadora del Este",
      title: "Cierre mensual abril 2026 pendiente", description: "Completar checklist de cierre",
      dueDate: "2026-05-10", daysLeft: 5, urgency: "warning", read: true,
      action: { label: "Cerrar Período", href: "/reportes" },
    },
    {
      id: "n8", type: "iva", entityId: e3, entityName: "Distribuciones Ñandutí",
      title: "IVA vence mañana", description: "Último día para presentar DJ IVA",
      dueDate: "2026-05-06", daysLeft: 1, urgency: "critical", read: false,
      action: { label: "Urgente — Presentar", href: "/fiscal/formulario-104" },
    },
    {
      id: "n9", type: "sifen", entityId: e1, entityName: "Importadora del Este",
      title: "Error validación SIFEN", description: "Factura 001-001-01123 — RUC emisor no coincide",
      dueDate: "2026-05-08", daysLeft: 3, urgency: "critical", read: false,
      action: { label: "Corregir", href: "/sifen/historial" },
    },
  ];
}

interface NotificationStore {
  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  getUnreadCount: () => number;
  getCriticalCount: () => number;
  getUpcomingThisWeek: () => Notification[];
  getByEntity: (entityId: string) => Notification[];
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: generateNotifications(),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

  getCriticalCount: () =>
    get().notifications.filter((n) => n.urgency === "critical" && !n.read).length,

  getUpcomingThisWeek: () =>
    get().notifications.filter((n) => n.daysLeft <= 7 && !n.read),

  getByEntity: (entityId) =>
    get().notifications.filter((n) => n.entityId === entityId),
}));
