"use server";

import { revalidatePath } from "next/cache";
import {
  getSubscriptionPlans,
  getBankTransferDetails,
  createPaymentOrder,
  listPaymentOrders,
  type CreatePaymentOrderInput,
  type SubscriptionPlan,
  type BankTransferDetails,
  type PaymentOrder,
} from "@/lib/subscription-service";

export async function getSubscriptionDataAction(entityId?: string): Promise<{
  plans: SubscriptionPlan[];
  bankDetails: BankTransferDetails;
  orders: PaymentOrder[];
}> {
  const plans = getSubscriptionPlans();
  const bankDetails = getBankTransferDetails();
  const orders = entityId ? await listPaymentOrders({ entityId }) : [];
  return { plans, bankDetails, orders };
}

export async function submitPaymentOrderAction(
  input: CreatePaymentOrderInput
): Promise<{ success: boolean; order?: PaymentOrder; error?: string }> {
  try {
    const order = await createPaymentOrder(input);
    revalidatePath("/suscripcion");
    revalidatePath("/superadmin");
    return { success: true, order };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al registrar el comprobante de pago",
    };
  }
}
