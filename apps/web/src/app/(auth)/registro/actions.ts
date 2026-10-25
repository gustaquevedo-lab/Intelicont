"use server";

import { registerSelfServiceTenant, type RegisterSelfServiceInput } from "@/lib/registration-service";

export async function registerTenantAction(data: {
  ruc: string;
  legalName: string;
  adminEmail: string;
  password: string;
  adminName?: string;
  tradeName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await registerSelfServiceTenant(data);
    if (!result.success) {
      return { success: false, error: result.error || "No se pudo completar el registro" };
    }
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error inesperado al procesar la solicitud",
    };
  }
}
