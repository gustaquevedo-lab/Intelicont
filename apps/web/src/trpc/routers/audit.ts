import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { router, protectedProcedure, z } from "../trpc";
import { getEntity } from "@ledger/db/repository";
import { tenantDb, isMockMode } from "@ledger/db/index";
import * as schema from "@ledger/db/schema";
import { isCalendarDate, CALENDAR_DATE_ERROR } from "@/lib/calendar-date";

const day = z.string().refine(isCalendarDate, CALENDAR_DATE_ERROR);
const TZ = sql.raw("'America/Asuncion'");

async function assertVisible(entityId: string) {
  if (!(await getEntity(entityId))) throw new TRPCError({ code: "FORBIDDEN", message: "Empresa no accesible" });
}

export const MAX_AUDIT_LIMIT = 500;

export const auditRouter = router({
  /** Entity audit trail, newest first, with the actor's name (`null` = system). RLS already scopes rows; an invisible entity is an explicit FORBIDDEN. */
  list: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      targetType: z.string().optional(),
      targetId: z.string().uuid().optional(),
      action: z.string().optional(),
      /** Asunción calendar days, inclusive: `from` = start of that day, `to` = end of that day. */
      from: day.optional(),
      to: day.optional(),
      limit: z.number().int().min(1).default(100).transform((n) => Math.min(n, MAX_AUDIT_LIMIT)),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      if (isMockMode()) return { events: [], total: 0 };
      await assertVisible(input.entityId);
      const a = schema.auditEvents;
      const where: SQL[] = [eq(a.entityId, input.entityId)];
      if (input.targetType) where.push(eq(a.targetType, input.targetType));
      if (input.targetId) where.push(eq(a.targetId, input.targetId));
      if (input.action) where.push(eq(a.action, input.action));
      if (input.from) where.push(sql`${a.createdAt} >= (${input.from}::date)::timestamp at time zone ${TZ}`);
      if (input.to) where.push(sql`${a.createdAt} < ((${input.to}::date + 1)::timestamp at time zone ${TZ})`);
      const [rows, [{ total }]] = await tenantDb(async (db) => [
        await db.select({
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
        await db.select({ total: sql<number>`count(*)::int` }).from(a).where(and(...where)),
      ] as const);
      return {
        total,
        events: rows.map(({ actorId, actorName, actorEmail, ...e }) => ({
          ...e,
          actor: actorId ? { id: actorId, name: actorName!, email: actorEmail! } : null,
        })),
      };
    }),

  /** Distinct actions recorded for the entity (complete select options regardless of paging). */
  actions: protectedProcedure
    .input(z.object({ entityId: z.string().uuid() }))
    .query(async ({ input }) => {
      if (isMockMode()) return { actions: [] as string[] };
      await assertVisible(input.entityId);
      const a = schema.auditEvents;
      const rows = await tenantDb((db) => db.selectDistinct({ action: a.action }).from(a).where(eq(a.entityId, input.entityId)).orderBy(asc(a.action)));
      return { actions: rows.map((r) => r.action) };
    }),
});
