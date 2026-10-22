import { TRPCError } from "@trpc/server";
import { validateRuc } from "@intelicont/ledger/fiscal-py";
import { router, protectedProcedure, z } from "../trpc";
import { idempotentProcedure } from "../idempotent";
import { getEntities, getEntity, createEntityWithChart } from "@ledger/db/repository";
import { PY_CHART_OF_ACCOUNTS, flattenTree } from "@/lib/chart-of-accounts";
import { isUniqueViolation } from "@ledger/db/index";

export const TAX_REGIMES = ["IVA_GRAL", "IRE_GRAL", "IRE_SIMPLE", "IRE_RESIMPLE", "IRP", "INR", "IDU", "EXPORTADOR"] as const;

const createInput = z.object({
  ruc: z.string().trim(),
  legalName: z.string().trim().min(1, "La razón social es obligatoria").max(200),
  tradeName: z.string().trim().max(200).optional().transform((v) => v || undefined),
  taxRegimes: z.array(z.enum(TAX_REGIMES)).min(1, "Seleccioná al menos un régimen"),
  baseCurrency: z.enum(["PYG", "USD"]),
});

/** Current year/month in Paraguay. shortcut: zone hardcoded; per-entity timezone is not modelled. */
function currentPeriod(now = new Date()) {
  const [year, month] = now.toLocaleDateString("en-CA", { timeZone: "America/Asuncion" }).split("-").map(Number);
  return { year, month };
}

export const isRucUniqueViolation = (err: unknown) => isUniqueViolation(err, "entities_ruc_unique");

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

  create: idempotentProcedure.input(createInput).mutation(async ({ input }) => {
    const check = validateRuc(input.ruc);
    if (!check.valid || !/^\d{6,8}-\d$/.test(input.ruc)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: check.errors[0] ?? "RUC inválido" });
    }
    try {
      const id = await createEntityWithChart(input, flattenTree(PY_CHART_OF_ACCOUNTS), currentPeriod());
      return { id };
    } catch (err) {
      if (isRucUniqueViolation(err)) throw new TRPCError({ code: "CONFLICT", message: "Ya existe una empresa con ese RUC" });
      // Do not leak SQL details to the client.
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No se pudo crear la empresa", cause: err });
    }
  }),
});
