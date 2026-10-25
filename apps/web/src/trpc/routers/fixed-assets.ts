import { router, protectedProcedure, z } from "../trpc";
import { assertVisible } from "./reports";
import { tenantDb } from "@ledger/db/index";
import * as schema from "@ledger/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  calculateAssetDepreciation,
  CATEGORY_USEFUL_LIFE_MONTHS,
  type FixedAssetCategory,
} from "@intelicont/ledger/fixed-assets";

export const fixedAssetsRouter = router({
  categories: protectedProcedure.query(() => {
    return Object.entries(CATEGORY_USEFUL_LIFE_MONTHS).map(([key, val]) => ({
      key: key as FixedAssetCategory,
      ...val,
    }));
  }),

  list: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      revaluationCoefficient: z.number().positive().optional().default(1.0),
    }))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
      let rows: any[] = [];
      try {
        rows = await tenantDb((db) =>
          db.select().from(schema.fixedAssets)
            .where(eq(schema.fixedAssets.entityId, input.entityId))
            .orderBy(desc(schema.fixedAssets.purchaseDate))
        );
      } catch {
        rows = [];
      }

      return rows.map((r) => {
        const dep = calculateAssetDepreciation({
          initialCost: Number(r.initialCost),
          residualValue: Number(r.residualValue),
          purchaseDate: r.purchaseDate,
          usefulLifeMonths: r.usefulLifeMonths,
          asOfDate: input.asOfDate,
          revaluationCoefficient: input.revaluationCoefficient,
        });

        return {
          id: r.id,
          code: r.code,
          name: r.name,
          category: r.category,
          purchaseDate: r.purchaseDate,
          cost: Number(r.initialCost),
          residualValue: Number(r.residualValue),
          usefulLifeMonths: r.usefulLifeMonths,
          method: r.depreciationMethod,
          status: dep.isFullyDepreciated ? "depreciated" : r.status,
          monthlyDepreciation: dep.monthlyDepreciation,
          annualDepreciation: dep.annualDepreciation,
          accumulatedDepreciation: dep.accumulatedDepreciation,
          netBookValue: dep.netBookValue,
          revaluedCost: dep.revaluedCost,
          assetAccountId: r.assetAccountId,
          depreciationAccountId: r.depreciationAccountId,
          accumulatedAccountId: r.accumulatedAccountId,
        };
      });
    }),

  create: protectedProcedure
    .input(z.object({
      entityId: z.string().uuid(),
      code: z.string().min(1).max(50),
      name: z.string().min(1).max(250),
      category: z.enum(["furniture", "vehicles", "machinery", "computers", "buildings", "tools", "installations", "other"]),
      purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      initialCost: z.number().int().positive(),
      residualValue: z.number().int().nonnegative().optional().default(0),
      usefulLifeMonths: z.number().int().positive().optional(),
      assetAccountId: z.string().uuid().optional(),
      depreciationAccountId: z.string().uuid().optional(),
      accumulatedAccountId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input }) => {
      await assertVisible(input.entityId);
      const defaultLife = CATEGORY_USEFUL_LIFE_MONTHS[input.category].months;
      const usefulLifeMonths = input.usefulLifeMonths ?? defaultLife;

      const [created] = await tenantDb((db) =>
        db.insert(schema.fixedAssets).values({
          entityId: input.entityId,
          code: input.code,
          name: input.name,
          category: input.category,
          purchaseDate: input.purchaseDate,
          initialCost: input.initialCost,
          residualValue: input.residualValue,
          usefulLifeMonths,
          depreciationMethod: "linear",
          assetAccountId: input.assetAccountId ?? null,
          depreciationAccountId: input.depreciationAccountId ?? null,
          accumulatedAccountId: input.accumulatedAccountId ?? null,
          status: "active",
        }).returning()
      );

      return created;
    }),
});
