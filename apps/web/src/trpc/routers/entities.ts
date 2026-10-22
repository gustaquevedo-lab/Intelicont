import { TRPCError } from "@trpc/server";
import { validateRuc } from "@intelicont/ledger/fiscal-py";
import { router, protectedProcedure, z } from "../trpc";
import { getEntities, getEntity, createEntityWithChart } from "@ledger/db/repository";
import { PY_CHART_OF_ACCOUNTS, flattenTree } from "@/lib/chart-of-accounts";

export const TAX_REGIMES = ["IVA_GRAL", "IRE_GRAL", "IRE_SIMPLE", "IRE_RESIMPLE", "IRP", "INR", "IDU", "EXPORTADOR"] as const;

const createInput = z.object({
  ruc: z.string().trim(),
  legalName: z.string().trim().min(1, "La razón social es obligatoria"),
  tradeName: z.string().trim().optional(),
  taxRegimes: z.array(z.enum(TAX_REGIMES)).min(1, "Seleccioná al menos un régimen"),
  baseCurrency: z.string().length(3),
});

/** Current year/month in Paraguay. shortcut: zone hardcoded; per-entity timezone is not modelled. */
function currentPeriod(now = new Date()) {
  const [year, month] = now.toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }).split("-").map(Number);
  return { year, month };
}

function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export const entitiesRouter = router({
  list: protectedProcedure.query(async () => {
    const entities = await getEntities();
    return entities.map((e) => ({
      id: e.id,
      ruc: e.ruc,
      legalName: e.legalName,
      tradeName: e.tradeName,
      taxRegimes: e.taxRegimes,
      baseCurrency: e.baseCurrency,
      status: e.status,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const entity = await getEntity(input.id);
      if (!entity) throw new Error("Entity not found");
      return entity;
    }),

  create: protectedProcedure.input(createInput).mutation(async ({ input }) => {
    const check = validateRuc(input.ruc);
    if (!check.valid || !/^\d{6,8}-\d$/.test(input.ruc)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: check.errors[0] ?? "RUC inválido" });
    }
    try {
      const id = await createEntityWithChart(input, flattenTree(PY_CHART_OF_ACCOUNTS), currentPeriod());
      return { id };
    } catch (err) {
      if (isUniqueViolation(err)) throw new TRPCError({ code: "CONFLICT", message: "Ya existe una empresa con ese RUC" });
      throw err;
    }
  }),
});
