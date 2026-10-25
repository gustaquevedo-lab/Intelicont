import { router, protectedProcedure, z } from "../trpc";
import { getEntities } from "@ledger/db/repository";
import { dueDateFor, daysLeft } from "@intelicont/ledger/tax-calendar";
import { tenantDb } from "@ledger/db/index";
import * as schema from "@ledger/db/schema";
import { count, eq, and, sql } from "drizzle-orm";

export const accountingFirmRouter = router({
  portfolioStatus: protectedProcedure
    .input(
      z.object({
        year: z.number().int().optional(),
        month: z.number().int().min(1).max(12).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const currentYear = input?.year ?? now.getFullYear();
      const currentMonth = input?.month ?? now.getMonth() + 1;
      const todayStr = now.toISOString().slice(0, 10);

      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const entities = await getEntities();

      const portfolio = await Promise.all(
        entities.map(async (ent) => {
          let dueDate = "";
          let days = 0;
          try {
            dueDate = dueDateFor(prevYear, prevMonth, ent.ruc);
            days = daysLeft(dueDate, todayStr);
          } catch {
            dueDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-15`;
            days = daysLeft(dueDate, todayStr);
          }

          let status: "ok" | "warning" | "overdue" = "ok";
          if (days < 0) status = "overdue";
          else if (days <= 3) status = "warning";

          let docsCount = 0;
          try {
            const startDate = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
            const [res] = await tenantDb((db) =>
              db
                .select({ total: count() })
                .from(schema.taxDocuments)
                .where(
                  and(
                    eq(schema.taxDocuments.entityId, ent.id),
                    sql`${schema.taxDocuments.issueDate} >= ${startDate}`
                  )
                )
            );
            docsCount = Number(res?.total ?? 0);
          } catch {
            docsCount = 0;
          }

          return {
            id: ent.id,
            ruc: ent.ruc,
            legalName: ent.legalName,
            tradeName: ent.tradeName,
            plan: ent.plan,
            role: (ent as any).role ?? "admin",
            period: `${prevYear}-${String(prevMonth).padStart(2, "0")}`,
            dueDate,
            daysLeft: days,
            status,
            documentsCount: docsCount,
            ivaStatus: docsCount > 0 ? ("ready" as const) : ("pending" as const),
            rg90Status: docsCount > 0 ? ("generated" as const) : ("pending" as const),
          };
        })
      );

      portfolio.sort((a, b) => a.daysLeft - b.daysLeft);

      return {
        summary: {
          totalClients: portfolio.length,
          overdue: portfolio.filter((p) => p.status === "overdue").length,
          warning: portfolio.filter((p) => p.status === "warning").length,
          ok: portfolio.filter((p) => p.status === "ok").length,
        },
        clients: portfolio,
      };
    }),
});
