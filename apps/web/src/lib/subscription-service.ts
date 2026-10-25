import { randomUUID } from "node:crypto";
import { getDb, isMockMode } from "@ledger/db";
import { entities } from "@ledger/db/schema";
import { eq } from "drizzle-orm";

export interface SubscriptionPlan {
  id: "starter" | "pro" | "inhouse" | "enterprise";
  name: string;
  tagline: string;
  priceGsMonthly: number;
  priceGsAnnual: number;
  maxContributors: number;
  maxUsers: number;
  popular?: boolean;
  features: string[];
}

export interface BankTransferDetails {
  banco: string;
  ruc: string;
  titular: string;
  tipoCuenta: string;
  cuenta: string;
  aliasSipap: string;
  whatsappSoporte: string;
  emailPagos: string;
}

export interface PaymentOrder {
  id: string;
  entityId: string;
  entityName: string;
  plan: "starter" | "pro" | "inhouse" | "enterprise";
  billingCycle: "mensual" | "anual";
  amountGs: number;
  comprobanteRef: string;
  bancoOrigen?: string;
  notas?: string;
  status: "pending_verification" | "approved" | "rejected";
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  vigenciaHasta?: Date;
}

export interface CreatePaymentOrderInput {
  entityId: string;
  entityName?: string;
  plan: "starter" | "pro" | "inhouse" | "enterprise";
  billingCycle?: "mensual" | "anual";
  amountGs: number;
  comprobanteRef: string;
  bancoOrigen?: string;
  notas?: string;
}

const OFFICIAL_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter / Prueba",
    tagline: "Para estudios contables que recién inician y quieren probar la plataforma.",
    priceGsMonthly: 0,
    priceGsAnnual: 0,
    maxContributors: 3,
    maxUsers: 1,
    features: [
      "Hasta 3 contribuyentes",
      "1 usuario del estudio",
      "Libros contables automáticos",
      "Cumplimiento de IVA general",
      "Calendario DNIT básico",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Para estudios en crecimiento que necesitan automatización inteligente y auditoría.",
    priceGsMonthly: 385000,
    priceGsAnnual: 3850000,
    maxContributors: 20,
    maxUsers: 3,
    popular: true,
    features: [
      "Hasta 20 contribuyentes",
      "3 usuarios del estudio",
      "Brain AI Auditor™ (IA Contable)",
      "SIFEN automático (recepción y parseo XML)",
      "RG 90 y Hechauka automáticos",
      "Conciliación bancaria (Itaú/GNB/Continental/BNF)",
      "Calendario DNIT con alertas",
      "Soporte prioritario WhatsApp",
    ],
  },
  {
    id: "inhouse",
    name: "In-House",
    tagline: "Para empresas medianas con departamento contable y administrativo interno.",
    priceGsMonthly: 440000,
    priceGsAnnual: 4400000,
    maxContributors: 1,
    maxUsers: 999,
    features: [
      "1 contribuyente / RUC único",
      "Usuarios y auxiliares ilimitados",
      "SIFEN integrado (emisión y recepción)",
      "Brain AI Auditor™ (IA Contable)",
      "RG 90 y Hechauka automáticos",
      "Conciliación bancaria API nativa",
      "Estados Financieros en tiempo real",
      "Integración directa con SueldOK",
      "Soporte dedicado",
    ],
  },
  {
    id: "enterprise",
    name: "Estudio / Enterprise",
    tagline: "Para firmas consolidadas que requieren gran capacidad y soporte premium corporativo.",
    priceGsMonthly: 650000,
    priceGsAnnual: 6500000,
    maxContributors: 50,
    maxUsers: 999,
    features: [
      "Hasta 50 contribuyentes",
      "Usuarios ilimitados del estudio",
      "Todo el plan Pro",
      "Brain AI Auditor™ Premium",
      "Marca blanca en reportes y PDFs",
      "API REST para integraciones",
      "Soporte prioritario corporativo",
      "Onboarding y migración gratis",
    ],
  },
];

const BANK_DETAILS: BankTransferDetails = {
  banco: "Banco Itaú Paraguay S.A.",
  ruc: "80112345-1",
  titular: "InteliCont S.A.S.",
  tipoCuenta: "Cuenta Corriente",
  cuenta: "720014589",
  aliasSipap: "INTELICONT-PY",
  whatsappSoporte: "+595 994 516360",
  emailPagos: "pagos@intelicont.com.py",
};

// In-memory store for test and fast retrieval
let memoryPaymentOrders: PaymentOrder[] = [];

export function resetSubscriptionMockStore(): void {
  memoryPaymentOrders = [];
}

export function getSubscriptionPlans(): SubscriptionPlan[] {
  return OFFICIAL_PLANS;
}

export function getBankTransferDetails(): BankTransferDetails {
  return BANK_DETAILS;
}

export async function createPaymentOrder(input: CreatePaymentOrderInput): Promise<PaymentOrder> {
  const comprobante = input.comprobanteRef?.trim();
  if (!comprobante) {
    throw new Error("El número de comprobante o referencia de transferencia SIPAP es obligatorio.");
  }
  if (!input.entityId) {
    throw new Error("El ID de la empresa es obligatorio.");
  }

  const order: PaymentOrder = {
    id: randomUUID(),
    entityId: input.entityId,
    entityName: input.entityName || "Empresa Contribuyente",
    plan: input.plan,
    billingCycle: input.billingCycle || "mensual",
    amountGs: input.amountGs,
    comprobanteRef: comprobante,
    bancoOrigen: input.bancoOrigen?.trim() || undefined,
    notas: input.notas?.trim() || undefined,
    status: "pending_verification",
    createdAt: new Date(),
  };

  memoryPaymentOrders.push(order);
  return order;
}

export async function listPaymentOrders(filter?: {
  entityId?: string;
  status?: string;
}): Promise<PaymentOrder[]> {
  let list = [...memoryPaymentOrders];
  if (filter?.entityId) {
    list = list.filter((o) => o.entityId === filter.entityId);
  }
  if (filter?.status) {
    list = list.filter((o) => o.status === filter.status);
  }
  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function approvePaymentOrder(orderId: string, approvedBy: string): Promise<PaymentOrder> {
  const order = memoryPaymentOrders.find((o) => o.id === orderId);
  if (!order) {
    throw new Error(`Orden de pago ${orderId} no encontrada.`);
  }

  const now = new Date();
  const vigencia = new Date(now);
  if (order.billingCycle === "anual") {
    vigencia.setFullYear(vigencia.getFullYear() + 1);
  } else {
    vigencia.setDate(vigencia.getDate() + 30);
  }

  order.status = "approved";
  order.approvedAt = now;
  order.approvedBy = approvedBy;
  order.vigenciaHasta = vigencia;

  // Actualizar base de datos si no es modo mock
  if (!isMockMode() && process.env.NODE_ENV !== "test") {
    try {
      const db = getDb();
      await db
        .update(entities)
        .set({
          plan: order.plan,
          updatedAt: new Date(),
        })
        .where(eq(entities.id, order.entityId));
    } catch (err) {
      console.error("[SubscriptionService] Error al actualizar plan de entidad:", err);
    }
  }

  return order;
}

export async function rejectPaymentOrder(orderId: string, reason: string): Promise<PaymentOrder> {
  const order = memoryPaymentOrders.find((o) => o.id === orderId);
  if (!order) {
    throw new Error(`Orden de pago ${orderId} no encontrada.`);
  }

  order.status = "rejected";
  order.rejectionReason = reason;
  return order;
}
