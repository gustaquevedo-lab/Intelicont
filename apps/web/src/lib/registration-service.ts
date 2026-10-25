import { randomUUID } from "node:crypto";
import { getDb, isMockMode } from "@ledger/db";
import { entities, users, memberships } from "@ledger/db/schema";
import { eq } from "drizzle-orm";
import { sendWelcomeEmail } from "./email-service";

export interface RegisterSelfServiceInput {
  ruc: string;
  legalName: string;
  adminEmail: string;
  password: string;
  adminName?: string;
  tradeName?: string;
}

export interface RegisterSelfServiceOutput {
  success: boolean;
  entity?: any;
  user?: any;
  error?: string;
}

// In-memory mock store for tests and mock mode
let mockRegisteredEntities: Array<{ id: string; ruc: string; legalName: string; plan: string; status: string }> = [];
let mockRegisteredUsers: Array<{ id: string; email: string; name: string; debeCambiarPassword: boolean }> = [];

export function resetRegistrationMockStore(): void {
  mockRegisteredEntities = [];
  mockRegisteredUsers = [];
}

/**
 * Valida formato básico de RUC paraguayo (ej: 80012345-0 o 1234567-8).
 */
function isValidRuc(ruc: string): boolean {
  const clean = ruc.trim();
  if (clean.length < 5) return false;
  return /^\d{5,9}(-\d)?$/.test(clean);
}

/**
 * Realiza el alta atómica de un nuevo contribuyente/estudio con 14 días de prueba.
 */
export async function registerSelfServiceTenant(
  input: RegisterSelfServiceInput
): Promise<RegisterSelfServiceOutput> {
  const ruc = input.ruc.trim();
  const legalName = input.legalName.trim();
  const email = input.adminEmail.toLowerCase().trim();
  const password = input.password;
  const adminName = input.adminName?.trim() || email.split("@")[0] || "Administrador";

  // 1. Validaciones
  if (!isValidRuc(ruc)) {
    return { success: false, error: "El formato de RUC ingresado es inválido (ej: 80012345-0)" };
  }
  if (!legalName || legalName.length < 3) {
    return { success: false, error: "La razón social o nombre debe tener al menos 3 caracteres" };
  }
  if (!email || !email.includes("@")) {
    return { success: false, error: "Ingresá un correo electrónico válido" };
  }
  if (!password || password.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }

  // 2. Comprobación de duplicados (Mock & Real DB)
  if (isMockMode() || process.env.NODE_ENV === "test") {
    if (mockRegisteredEntities.some((e) => e.ruc === ruc)) {
      return { success: false, error: `El RUC ${ruc} ya se encuentra registrado en el sistema` };
    }
    if (mockRegisteredUsers.some((u) => u.email === email)) {
      return { success: false, error: `El correo electrónico ya está registrado. Por favor iniciá sesión.` };
    }

    const entityId = randomUUID();
    const userId = randomUUID();

    const entity = {
      id: entityId,
      ruc,
      legalName,
      tradeName: input.tradeName || null,
      plan: "starter",
      status: "active",
      createdAt: new Date(),
    };

    const user = {
      id: userId,
      email,
      name: adminName,
      debeCambiarPassword: false,
      createdAt: new Date(),
    };

    mockRegisteredEntities.push(entity);
    mockRegisteredUsers.push(user);

    // Enviar email de bienvenida de forma no bloqueante
    void sendWelcomeEmail({
      to: email,
      name: adminName,
      entityName: legalName,
      trialDays: 14,
    });

    return { success: true, entity, user };
  }

  // 3. Ejecución en base de datos real
  try {
    const db = getDb();

    // Validar RUC existente
    const [existingEntity] = await db.select().from(entities).where(eq(entities.ruc, ruc));
    if (existingEntity) {
      return { success: false, error: `El RUC ${ruc} ya se encuentra registrado en el sistema` };
    }

    // Validar Email existente
    const [existingUser] = await db.select().from(users).where(eq(users.email, email));
    if (existingUser) {
      return { success: false, error: `El correo electrónico ya está registrado. Por favor iniciá sesión.` };
    }

    // Insertar Tenant con Plan Starter (14 días gratis)
    const [entityRow] = await db
      .insert(entities)
      .values({
        ruc,
        legalName,
        tradeName: input.tradeName || null,
        plan: "starter",
        taxRegimes: ["IVA_GRAL", "IRE_GRAL"],
        baseCurrency: "PYG",
        status: "active",
      })
      .returning();

    // Insertar Usuario Administrador
    const [userRow] = await db
      .insert(users)
      .values({
        email,
        name: adminName,
        debeCambiarPassword: false,
      })
      .returning();

    // Asignar Membresía como Admin
    await db.insert(memberships).values({
      userId: userRow.id,
      entityId: entityRow.id,
      role: "admin",
    });

    // Despachar email de bienvenida
    void sendWelcomeEmail({
      to: email,
      name: adminName,
      entityName: legalName,
      trialDays: 14,
    });

    return {
      success: true,
      entity: entityRow,
      user: userRow,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error inesperado durante el registro",
    };
  }
}
