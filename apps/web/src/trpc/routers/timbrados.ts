import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, z } from "../trpc";
import { idempotentProcedure } from "../idempotent";
import { tenantDb } from "@ledger/db/index";
import { timbrados, entities } from "@ledger/db/schema";
import { eq, and, desc } from "drizzle-orm";

function toUrgency(daysLeft: number): "ok" | "warn" | "critical" | "expired" {
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 15) return "critical";
  if (daysLeft <= 60) return "warn";
  return "ok";
}

export const timbradosRouter = router({
  list: protectedProcedure
    .input(z.object({ entityId: z.string().uuid().optional() }))
    .query(async ({ input }) => {
      return tenantDb(async (db) => {
        const now = new Date();
        const conditions = input.entityId ? [eq(timbrados.entityId, input.entityId)] : [];

        const rows = await db
          .select({
            id: timbrados.id,
            entityId: timbrados.entityId,
            entityName: entities.legalName,
            number: timbrados.number,
            establishment: timbrados.establishment,
            point: timbrados.point,
            docCode: timbrados.docCode,
            validFrom: timbrados.validFrom,
            validTo: timbrados.validTo,
            createdAt: timbrados.createdAt,
          })
          .from(timbrados)
          .innerJoin(entities, eq(timbrados.entityId, entities.id))
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(timbrados.validTo));

        return rows.map((r) => {
          const hasta = new Date(String(r.validTo));
          const desde = new Date(String(r.validFrom));
          const daysLeft = Math.floor((hasta.getTime() - now.getTime()) / 86_400_000);
          return {
            id: r.id,
            entityId: r.entityId,
            entityName: r.entityName,
            numero: r.number,
            establecimiento: r.establishment,
            puntoEmision: r.point,
            docCode: r.docCode,
            tipo: r.docCode === 1 ? "factura" : r.docCode === 4 ? "autofactura" : r.docCode === 5 ? "nota_credito" : "documento",
            validoDesde: desde.toISOString().split("T")[0],
            validoHasta: hasta.toISOString().split("T")[0],
            daysLeft,
            urgency: toUrgency(daysLeft),
          };
        });
      });
    }),

  create: idempotentProcedure
    .input(
      z.object({
        entityId: z.string().uuid(),
        numero: z.string().trim().regex(/^\d{8}$/, "El timbrado debe tener 8 dígitos"),
        establecimiento: z.string().trim().regex(/^\d{3}$/, "Establecimiento debe tener 3 dígitos").default("001"),
        puntoEmision: z.string().trim().regex(/^\d{3}$/, "Punto de emisión debe tener 3 dígitos").default("001"),
        docCode: z.number().int().default(1),
        validoDesde: z.string(),
        validoHasta: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const desde = new Date(input.validoDesde);
      const hasta = new Date(input.validoHasta);
      if (hasta <= desde) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La fecha hasta debe ser posterior a la fecha desde" });
      }

      return tenantDb(async (db) => {
        try {
          const [row] = await db
            .insert(timbrados)
            .values({
              entityId: input.entityId,
              number: input.numero,
              establishment: input.establecimiento,
              point: input.puntoEmision,
              docCode: input.docCode,
              validFrom: input.validoDesde,
              validTo: input.validoHasta,
            })
            .returning();

          return { id: row.id };
        } catch (err) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "No se pudo registrar el timbrado. Verificá que no esté duplicado.",
            cause: err,
          });
        }
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return tenantDb(async (db) => {
        await db.delete(timbrados).where(eq(timbrados.id, input.id));
        return { success: true };
      });
    }),
});
