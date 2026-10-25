import { describe, it, expect, beforeEach } from "vitest";
import {
  getSubscriptionPlans,
  createPaymentOrder,
  listPaymentOrders,
  approvePaymentOrder,
  rejectPaymentOrder,
  resetSubscriptionMockStore,
  getBankTransferDetails,
} from "../lib/subscription-service";

describe("Subscription & SIPAP B2B Service", () => {
  beforeEach(() => {
    resetSubscriptionMockStore();
  });

  it("should return official subscription plans and official bank details", () => {
    const plans = getSubscriptionPlans();
    expect(plans.length).toBeGreaterThanOrEqual(4);
    expect(plans.map((p) => p.id)).toContain("pro");
    expect(plans.map((p) => p.id)).toContain("inhouse");
    expect(plans.map((p) => p.id)).toContain("enterprise");

    const bank = getBankTransferDetails();
    expect(bank.banco).toBe("Banco Itaú Paraguay S.A.");
    expect(bank.ruc).toBe("80112345-1");
    expect(bank.cuenta).toBeDefined();
  });

  it("should create a pending payment order with valid receipt reference", async () => {
    const order = await createPaymentOrder({
      entityId: "ent-123",
      entityName: "Estudio Fiscal SA",
      plan: "pro",
      billingCycle: "mensual",
      amountGs: 385000,
      comprobanteRef: "TRF-987654321",
      bancoOrigen: "Banco Continental",
      notas: "Pago por SIPAP desde app Continental",
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe("pending_verification");
    expect(order.entityId).toBe("ent-123");
    expect(order.comprobanteRef).toBe("TRF-987654321");
  });

  it("should reject creating payment order if required fields are missing", async () => {
    await expect(
      createPaymentOrder({
        entityId: "ent-123",
        entityName: "Estudio Fiscal SA",
        plan: "pro",
        billingCycle: "mensual",
        amountGs: 385000,
        comprobanteRef: "", // empty
      })
    ).rejects.toThrow("comprobante");
  });

  it("should list payment orders and filter by entity or status", async () => {
    await createPaymentOrder({
      entityId: "ent-1",
      entityName: "Empresa 1",
      plan: "pro",
      billingCycle: "mensual",
      amountGs: 385000,
      comprobanteRef: "REF-001",
    });

    await createPaymentOrder({
      entityId: "ent-2",
      entityName: "Empresa 2",
      plan: "inhouse",
      billingCycle: "mensual",
      amountGs: 440000,
      comprobanteRef: "REF-002",
    });

    const all = await listPaymentOrders();
    expect(all).toHaveLength(2);

    const filtered = await listPaymentOrders({ entityId: "ent-1" });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.entityId).toBe("ent-1");
  });

  it("should approve a pending order and extend vigencia", async () => {
    const order = await createPaymentOrder({
      entityId: "ent-1",
      entityName: "Empresa 1",
      plan: "pro",
      billingCycle: "mensual",
      amountGs: 385000,
      comprobanteRef: "REF-001",
    });

    const approved = await approvePaymentOrder(order.id, "superadmin@intelicont.com.py");
    expect(approved.status).toBe("approved");
    expect(approved.approvedBy).toBe("superadmin@intelicont.com.py");
    expect(approved.vigenciaHasta).toBeDefined();
  });

  it("should reject an invalid payment order", async () => {
    const order = await createPaymentOrder({
      entityId: "ent-1",
      entityName: "Empresa 1",
      plan: "pro",
      billingCycle: "mensual",
      amountGs: 385000,
      comprobanteRef: "REF-FALSO",
    });

    const rejected = await rejectPaymentOrder(order.id, "Comprobante no coincide con extracto bancario");
    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectionReason).toBe("Comprobante no coincide con extracto bancario");
  });
});
