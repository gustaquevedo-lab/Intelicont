import { router, protectedProcedure, z } from "../trpc";
import { getFiscalPeriods, getOpenPeriod } from "@ledger/db/repository";
import { getLibroIva } from "@ledger/db/reports";
import { buildForm104 } from "@intelicont/ledger/form104";
import { assertVisible } from "./reports";
import { getRegistroDocs } from "@ledger/db/registro";
import { buildRegistro } from "@intelicont/ledger/registro";
import { getVencimientoIVA } from "@intelicont/ledger/fiscal-py";

const period = {
  entityId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
};

export const fiscalRouter = router({
  periods: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      return getFiscalPeriods(input.entityId);
    }),

  currentPeriod: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      return getOpenPeriod(input.entityId);
    }),

  /** Form 104 summary; built from the same getLibroIva as reports.libroIva so both always agree. */
  form104: protectedProcedure
    .input(z.object(period))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
      const [ventas, compras] = await Promise.all([
        getLibroIva(input.entityId, input.year, input.month, "ventas"),
        getLibroIva(input.entityId, input.year, input.month, "compras"),
      ]);
      return { period: { year: input.year, month: input.month }, ...buildForm104(ventas.totals, compras.totals) };
    }),

  vencimientoIva: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number(), ruc: z.string() }))
    .query(async ({ input }) => {
      const date = getVencimientoIVA(input.year, input.month, input.ruc);
      return { date: date.toISOString(), label: date.toLocaleDateString("es-PY") };
    }),

  /** Registro de Comprobantes (obligación 955) for the month: the files' names and row counts, errors and exclusions; the .zip comes from /api/registro. */
  registroPreview: protectedProcedure
    .input(z.object(period))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
      const { docs, entityRuc } = await getRegistroDocs(input.entityId, input.year, input.month);
      const r = buildRegistro({ ruc: entityRuc, year: input.year, month: input.month, docs });
      const byId = new Map(docs.map((d) => [d.documentId, d]));
      return {
        files: r.files.map((f, i) => ({ name: f.name, rows: f.rows, part: i + 1 })),
        errors: r.errors.map((e) => {
          const d = byId.get(e.documentId);
          return { ...e, side: d?.side ?? null, number: d?.number ?? "", issueDate: d?.issueDate ?? "", entryId: d?.entryId ?? null };
        }),
        excluded: r.excluded, counts: r.counts,
      };
    }),
});
