import { router, superadminProcedure, protectedProcedure, z } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
  createTenantAtomic,
  createUserWithLimits,
  cambiarPasswordUsuario,
  impersonateTenant,
  getSystemVitals,
  getSuperadminStats,
} from "@/lib/superadmin-service";
import { getErroresPlataforma, resolverErrorPlataforma } from "@/lib/error-tracker";
import { getDb, isMockMode, withTenant } from "@ledger/db";
import { entities, users } from "@ledger/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const superadminRouter = router({
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) return { isSuperadmin: false };
    if (isMockMode() || process.env.NODE_ENV === "test") return { isSuperadmin: true };
    const allowedRaw = process.env.SUPERADMIN_EMAILS ?? "";
    const allowed = allowedRaw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (allowed.length === 0) return { isSuperadmin: false };
    return withTenant(ctx.userId, async (db) => {
      const rows = await db.execute<{ email: string }>(sql`select email from users where id = ${ctx.userId}`);
      const email = rows[0]?.email?.toLowerCase() ?? "";
      return { isSuperadmin: allowed.includes(email) };
    });
  }),

  stats: superadminProcedure.query(async () => {
    return getSuperadminStats();
  }),

  vitals: superadminProcedure.query(async () => {
    return getSystemVitals();
  }),

  tenants: superadminProcedure.query(async () => {
    if (isMockMode() || process.env.NODE_ENV === "test") {
      return [
        {
          id: "00000000-0000-0000-0000-000000000001",
          ruc: "80012345-6",
          legalName: "Importadora del Este S.A.",
          tradeName: "Este Importaciones",
          plan: "pro",
          featuresOverrideJson: null,
          status: "active",
          createdAt: new Date().toISOString(),
        },
      ];
    }
    const db = getDb();
    const rows = await db.select().from(entities).orderBy(desc(entities.createdAt));
    return rows.map((e) => ({
      id: e.id,
      ruc: e.ruc,
      legalName: e.legalName,
      tradeName: e.tradeName,
      plan: e.plan || "starter",
      featuresOverrideJson: e.featuresOverrideJson,
      status: e.status || "active",
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt),
    }));
  }),

  users: superadminProcedure.query(async () => {
    if (isMockMode() || process.env.NODE_ENV === "test") {
      return [
        {
          id: "user-1",
          email: "admin@intelicont.com.py",
          name: "SuperAdmin InteliCont",
          debeCambiarPassword: false,
          createdAt: new Date().toISOString(),
        },
      ];
    }
    const db = getDb();
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      debeCambiarPassword: u.debeCambiarPassword ?? false,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : String(u.createdAt),
    }));
  }),

  createTenantAtomic: superadminProcedure
    .input(
      z.object({
        ruc: z.string().min(5),
        legalName: z.string().min(3),
        tradeName: z.string().optional(),
        adminEmail: z.string().email(),
        adminName: z.string().optional(),
        plan: z.string().default("starter"),
        featuresOverride: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createTenantAtomic(input);
    }),

  createUser: superadminProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        email: z.string().email(),
        name: z.string().optional(),
        role: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await createUserWithLimits(input);
      if (!res.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: res.error });
      }
      return res;
    }),

  updateTenantOverrides: superadminProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        plan: z.string().optional(),
        featuresOverrideJson: z.string().nullable().optional(),
        status: z.enum(["active", "inactive", "closed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (isMockMode() || process.env.NODE_ENV === "test") {
        return { success: true };
      }
      const db = getDb();
      await db
        .update(entities)
        .set({
          ...(input.plan && { plan: input.plan }),
          ...(input.featuresOverrideJson !== undefined && { featuresOverrideJson: input.featuresOverrideJson }),
          ...(input.status && { status: input.status }),
          updatedAt: new Date(),
        })
        .where(eq(entities.id, input.entityId));
      return { success: true };
    }),

  impersonate: superadminProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const superAdminEmail = (ctx as any).user?.email || "superadmin@intelicont.com.py";
      const res = await impersonateTenant({
        entityId: input.entityId,
        superAdminEmail,
      });
      if (!res.success) {
        throw new TRPCError({ code: "NOT_FOUND", message: res.error });
      }
      return res;
    }),

  errores: superadminProcedure
    .input(
      z
        .object({
          resuelto: z.boolean().optional(),
          limit: z.number().int().min(1).max(200).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return getErroresPlataforma(input);
    }),

  resolverError: superadminProcedure
    .input(
      z.object({
        errorId: z.string().uuid(),
        notas: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await resolverErrorPlataforma(input.errorId, input.notas);
      if (!res) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Incidente no encontrado" });
      }
      return res;
    }),

  changePassword: superadminProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        passwordActual: z.string(),
        passwordNueva: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      const res = await cambiarPasswordUsuario(input);
      if (!res.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: res.error });
      }
      return res;
    }),
});
