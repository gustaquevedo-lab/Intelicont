import { TRPCError } from "@trpc/server";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { router, protectedProcedure, z } from "../trpc";
import { getEntity } from "@ledger/db/repository";
import { tenantDb, isMockMode } from "@ledger/db/index";
import * as schema from "@ledger/db/schema";

export const MAX_AUDIT_LIMIT = 500;

export const auditRouter = router({
  /** Entity audit trail, newest first, with the actor's name (`null` = system). RLS already scopes rows; an invisible entity is an explicit FORBIDDEN. */
  list: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      targetType: z.string().optional(),
      targetId: z.string().uuid().optional(),
      action: z.string().optional(),
      limit: z.number().int().min(1).default(100).transform((n) => Math.min(n, MAX_AUDIT_LIMIT)),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      if (isMockMode()) return { events: [] };
      if (!(await getEntity(input.entityId))) throw new TRPCError({ code: "FORBIDDEN", message: "Empresa no accesible" });
      const a = schema.auditEvents;
      const where: SQL[] = [eq(a.entityId, input.entityId)];
      if (input.targetType) where.push(eq(a.targetType, input.targetType));
      if (input.targetId) where.push(eq(a.targetId, input.targetId));
      if (input.action) where.push(eq(a.action, input.action));
      const rows = await tenantDb((db) =>
        db.select({
          id: a.id, createdAt: a.createdAt, action: a.action, targetType: a.targetType, targetId: a.targetId,
          reason: a.reason, before: a.before, after: a.after,
          actorId: schema.users.id, actorName: schema.users.name, actorEmail: schema.users.email,
        })
          .from(a)
          .leftJoin(schema.users, eq(schema.users.id, a.actorId))
          .where(and(...where))
          .orderBy(desc(a.createdAt), desc(a.id))
          .limit(input.limit)
          .offset(input.offset),
      );
      return {
        events: rows.map(({ actorId, actorName, actorEmail, ...e }) => ({
          ...e,
          actor: actorId ? { id: actorId, name: actorName!, email: actorEmail! } : null,
        })),
      };
    }),
});
