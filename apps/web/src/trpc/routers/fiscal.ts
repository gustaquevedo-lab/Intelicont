import { router, protectedProcedure, z } from "../trpc";
import { getFiscalPeriods, getOpenPeriod } from "@ledger/db/repository";
import { getLibroIva } from "@ledger/db/reports";
import { buildForm104 } from "@intelicont/ledger/form104";
import { assertVisible } from "./reports";
import { getRegistroDocs } from "@ledger/db/registro";
import { buildRegistro } from "@intelicont/ledger/registro";
import { getVencimientoIVA } from "@intelicont/ledger/fiscal-py";
import { ensureCalendar, getCalendarMonth, getUpcoming } from "@ledger/db/calendar";
import { daysLeft, levelFor, previousPeriod, shiftPeriod, todayInAsuncionISO } from "@intelicont/ledger/tax-calendar";
import { isMockMode } from "@ledger/db/index";
import { lookupTaxpayer, verifyTimbrado } from "@/lib/fiscal-lookup-service";

const period = {
  entityId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
};

export const fiscalRouter = router({
  periods: protectedProcedure
    .input(z.object({ entityId: z.string().uuid() }))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
      return getFiscalPeriods(input.entityId);
    }),

  currentPeriod: protectedProcedure
    .input(z.object({ entityId: z.string().uuid() }))
    .query(async ({ input }) => {
      await assertVisible(input.entityId);
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

  /** Obligations due within `days` (or overdue) with their 7/3/1 notice level. `today` is the Asunción date, computed here. */
  upcoming: protectedProcedure
    .input(z.object({ entityId: z.string().uuid(), days: z.number().int().min(1).max(60).default(7) }))
    .query(async ({ input }) => {
      const today = todayInAsuncionISO();
      if (isMockMode()) return { today, items: [] };
      await assertVisible(input.entityId);
      // Previous 3 periods plus the current and next 2, so recently skipped periods get rows (overdue = not filed).
      const from = shiftPeriod(Number(today.slice(0, 4)), Number(today.slice(5, 7)), -3);
      await ensureCalendar(input.entityId, from.year, from.month, 6);
      return { today, items: await getUpcoming(input.entityId, input.days, today) };
    }),

  /** Obligations whose due date falls in the month, with days left from today (Asunción). */
  calendarMonth: protectedProcedure
    .input(z.object(period))
    .query(async ({ input }) => {
      const today = todayInAsuncionISO();
      if (isMockMode()) return { today, items: [] };
      await assertVisible(input.entityId);
      // Previous 3 + next 3 periods from today, plus the period whose filing falls due in the month being viewed.
      const from = shiftPeriod(Number(today.slice(0, 4)), Number(today.slice(5, 7)), -3);
      await ensureCalendar(input.entityId, from.year, from.month, 6);
      const viewed = previousPeriod(input.year, input.month);
      await ensureCalendar(input.entityId, viewed.year, viewed.month, 1);
      const rows = await getCalendarMonth(input.entityId, input.year, input.month);
      return { today, items: rows.map((r) => ({ ...r, daysLeft: daysLeft(r.dueDate, today), level: levelFor(daysLeft(r.dueDate, today)) })) };
    }),

  /** Fast taxpayer lookup against official DNIT RUC database (2M+) and National Padrón (5M+) */
  lookupTaxpayer: protectedProcedure
    .input(z.object({ document: z.string().min(1) }))
    .query(async ({ input }) => {
      return lookupTaxpayer(input.document);
    }),

  /** Verifies timbrado format, validity dates, and expiration */
  verifyTimbrado: protectedProcedure
    .input(
      z.object({
        timbrado: z.string(),
        validFrom: z.string().optional(),
        validTo: z.string().optional(),
        issueDate: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return verifyTimbrado(input.timbrado, input);
    }),
});
