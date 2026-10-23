// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type AppRouter = typeof import("@/trpc").appRouter;

const FIXTURE = readFileSync(path.resolve(__dirname, "../../__fixtures__/sifen/fac_024-004-0049994.xml"), "utf-8");

describe.skipIf(!process.env.TEST_ADMIN_URL)("form 104 from the Libro IVA (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let appRouter: AppRouter;
  let user: string, outsider: string, e1: string;
  let expense: string;
  const prevUrl = process.env.DATABASE_URL;
  const prevProvider = process.env.AI_PROVIDER;
  const caller = (userId = user) => appRouter.createCaller({ userId, requestId: "t", idempotencyKey: crypto.randomUUID() });
  const iva = (side: "compras" | "ventas", month: number) => caller().reports.libroIva({ entityId: e1, year: 2026, month, side });
  const f104 = (month: number) => caller().fiscal.form104({ entityId: e1, year: 2026, month });

  const manual = (o: { direction: "received" | "issued"; docCode: number; number: string; issueDate: string; gravado10: number; relatedNumber?: string }) =>
    caller()["tax-documents"].createManual({
      entityId: e1, timbrado: "12345678", condition: "cash", gravado5: 0, exento: 0, total: o.gravado10,
      imputaIva: true, imputaIre: false, imputaIrp: false, concept: "Prueba",
      partner: { ruc: "80014066-4", legalName: "Contraparte" },
      ...(o.direction === "received" ? { expenseAccountId: expense } : {}),
      ...(o.relatedNumber ? { relatedTimbrado: "12345678" } : {}),
      ...o,
    });

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    user = await mkUser("u@x.test");
    outsider = await mkUser("o@x.test");
    process.env.DATABASE_URL = t.appUrl;
    process.env.AI_PROVIDER = "rules";
    vi.resetModules();
    db = await import("@ledger/db/index");
    appRouter = (await import("@/trpc")).appRouter;
    // The fixture's receiver RUC.
    e1 = (await caller().entities.create({ ruc: "1234567-9", legalName: "Cliente de Prueba", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    await caller(outsider).entities.create({ ruc: "80014066-4", legalName: "Otra", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" });
    for (const m of [8, 9]) await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, 2026, ${m}, 'open') on conflict do nothing`;
    expense = (await t.owner`select a.id from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${e1} and a.code = '5.1.04'`)[0].id;

    // August: the fixture as a received document (58.000, IVA 5.273) and an issued sale of 11.000.000 (IVA 1.000.000).
    const docs = caller()["tax-documents"];
    const { documentId } = await docs.ingestXml({ entityId: e1, direction: "received", xml: FIXTURE });
    const { decisionId } = await docs.suggestEntry({ documentId });
    await docs.approveEntry({ documentId, decisionId });
    await manual({ direction: "issued", docCode: 109, number: "001-001-0000001", issueDate: "2026-08-10", gravado10: 11_000_000 });

    // September: sale + credit note, purchase + credit note.
    await manual({ direction: "issued", docCode: 109, number: "001-001-0000002", issueDate: "2026-09-10", gravado10: 11_000_000 });
    await manual({ direction: "issued", docCode: 110, number: "001-001-0000003", issueDate: "2026-09-12", gravado10: 2_200_000, relatedNumber: "001-001-0000002" });
    await manual({ direction: "received", docCode: 109, number: "001-001-0000004", issueDate: "2026-09-15", gravado10: 5_500_000 });
    await manual({ direction: "received", docCode: 110, number: "001-001-0000005", issueDate: "2026-09-16", gravado10: 1_100_000, relatedNumber: "001-001-0000004" });
  }, 180_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    process.env.AI_PROVIDER = prevProvider;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("form104 credit equals the Libro IVA compras IVA", async () => {
    const r = await f104(8);
    const book = (await iva("compras", 8)).totals;
    expect(r.creditoFiscal).toBe(5_273);
    expect(r.creditoFiscal).toBe(book.iva10 + book.iva5);
    expect(r.compras).toMatchObject({ gravado10: 58_000, iva10: 5_273, base10: 52_727, total: 58_000 });
  });

  it("form104 debit equals the Libro IVA ventas IVA", async () => {
    const r = await f104(8);
    const book = (await iva("ventas", 8)).totals;
    expect(r.debitoFiscal).toBe(1_000_000);
    expect(r.debitoFiscal).toBe(book.iva10 + book.iva5);
    expect(r.ventas).toMatchObject({ gravado10: 11_000_000, iva10: 1_000_000, base10: 10_000_000 });
    expect(r.period).toEqual({ year: 2026, month: 8 });
  });

  it("form104 applies credit note signs and matches the Libro IVA totals", async () => {
    const r = await f104(9);
    const [v, c] = [(await iva("ventas", 9)).totals, (await iva("compras", 9)).totals];
    expect(r.ventas).toMatchObject({ ...v, base10: v.gravado10 - v.iva10, base5: 0 });
    expect(r.compras).toMatchObject({ ...c, base10: c.gravado10 - c.iva10, base5: 0 });
    expect(r.debitoFiscal).toBe(800_000); // 1.000.000 - 200.000
    expect(r.creditoFiscal).toBe(400_000); // 500.000 - 100.000
  });

  it("form104 saldo is debit minus credit", async () => {
    expect((await f104(9)).saldo).toBe(400_000);
    const aug = await f104(8);
    expect(aug.saldo).toBe(1_000_000 - 5_273);
    expect(aug.saldo).toBe(aug.debitoFiscal - aug.creditoFiscal);
  });

  it("form104 for a month without documents is zero", async () => {
    const r = await f104(10);
    expect(r).toMatchObject({ debitoFiscal: 0, creditoFiscal: 0, saldo: 0 });
    expect(r.ventas.total).toBe(0);
    expect(r.compras.base10).toBe(0);
  });

  it("form104 rejects an entity the user cannot see", async () => {
    await expect(caller(outsider).fiscal.form104({ entityId: e1, year: 2026, month: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
