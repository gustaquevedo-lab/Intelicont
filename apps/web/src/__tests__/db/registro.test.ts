// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type RegistroModule = typeof import("@ledger/db/registro");
type AppRouter = typeof import("@/trpc").appRouter;

const FIXTURE = readFileSync(path.resolve(__dirname, "../../__fixtures__/sifen/fac_024-004-0049994.xml"), "utf-8");

describe.skipIf(!process.env.TEST_ADMIN_URL)("registro de comprobantes 955 (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let registro: RegistroModule;
  let appRouter: AppRouter;
  let user: string, outsider: string, e1: string, expense: string;
  const prevUrl = process.env.DATABASE_URL;
  const caller = (userId = user) => appRouter.createCaller({ userId, requestId: "t", idempotencyKey: crypto.randomUUID() });

  const manual = (o: { direction: "received" | "issued"; number: string; issueDate: string; gravado10: number }) =>
    caller()["tax-documents"].createManual({
      entityId: e1, docCode: 109, timbrado: "12345678", condition: "cash", gravado5: 0, exento: 0, total: o.gravado10,
      imputaIva: true, imputaIre: false, imputaIrp: false, concept: "Prueba",
      partner: { ruc: "80005427-0", legalName: "Contraparte S.A." },
      ...(o.direction === "received" ? { expenseAccountId: expense } : {}),
      ...o,
    });

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    user = await mkUser("u@x.test");
    outsider = await mkUser("o@x.test");
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    registro = await import("@ledger/db/registro");
    appRouter = (await import("@/trpc")).appRouter;
    // The fixture's receiver RUC.
    e1 = (await caller().entities.create({ ruc: "1234567-9", legalName: "Cliente de Prueba", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    await caller(outsider).entities.create({ ruc: "80014066-4", legalName: "Otra", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" });
    for (const m of [8, 9]) await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, 2026, ${m}, 'open') on conflict do nothing`;
    expense = (await t.owner`select a.id from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${e1} and a.code = '5.1.04'`)[0].id;

    // August: the electronic fixture (received), a manual purchase and a manual sale. September: one more sale.
    await caller()["tax-documents"].ingestXml({ entityId: e1, direction: "received", xml: FIXTURE });
    await manual({ direction: "received", number: "001-001-0000010", issueDate: "2026-08-09", gravado10: 1_100_000 });
    await manual({ direction: "issued", number: "001-001-0000011", issueDate: "2026-08-20", gravado10: 2_200_000 });
    await manual({ direction: "issued", number: "001-001-0000012", issueDate: "2026-09-01", gravado10: 3_300_000 });
  }, 180_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("getRegistroDocs returns the documents of the month with RUC without DV and flags electronic ones", async () => {
    const r = await db.withTenant(user, () => registro.getRegistroDocs(e1, 2026, 8));
    expect(r.entityRuc).toBe("1234567");
    expect(r.docs).toHaveLength(3);
    expect(r.docs.filter((d) => d.isElectronic)).toHaveLength(1);
    expect(r.docs.every((d) => d.issueDate.startsWith("2026-08-") && !d.counterpartyId?.includes("-"))).toBe(true);
    const purchase = r.docs.find((d) => d.number === "001-001-0000010");
    expect(purchase).toMatchObject({
      side: "compras", docCode: 109, counterpartyIdType: 11, counterpartyId: "80005427", counterpartyName: "Contraparte S.A.",
      issueDate: "2026-08-09", timbrado: "12345678", gravado10: 1_100_000, gravado5: 0, exento: 0, total: 1_100_000,
      condition: "cash", foreignCurrency: false, imputaIva: true, imputaIre: false, imputaIrp: false, noImputa: false, isElectronic: false,
    });
    expect(r.docs.find((d) => d.number === "001-001-0000011")).toMatchObject({ side: "ventas", total: 2_200_000 });
  });

  it("registroPreview excludes the electronic fixture and counts the manual documents", async () => {
    const r = await caller().fiscal.registroPreview({ entityId: e1, year: 2026, month: 8 });
    expect(r.excluded).toEqual({ electronic: 1 });
    expect(r.counts).toEqual({ ventas: 1, compras: 1 });
    expect(r.errors).toEqual([]);
    expect(r.files).toEqual([{ name: "1234567_REG_082026_V0001", rows: 2, part: 1 }]);
    const sep = await caller().fiscal.registroPreview({ entityId: e1, year: 2026, month: 9 });
    expect(sep).toMatchObject({ counts: { ventas: 1, compras: 0 }, excluded: { electronic: 0 } });
    // A document without Registro data (a receipt: no Tabla 4 code, no partner) is reported, not exported.
    const [{ id }] = await t.owner`insert into tax_documents (entity_id, direction, doc_type, number, issue_date, total, condition)
      values (${e1}, 'received', 'receipt', 'R-1', '2026-10-05', 1000, 'cash') returning id`;
    const oct = await caller().fiscal.registroPreview({ entityId: e1, year: 2026, month: 10 });
    expect(oct.files).toEqual([]);
    expect(oct.errors).toEqual([{ documentId: id, side: "compras", number: "R-1", issueDate: "2026-10-05", entryId: null, message: expect.stringMatching(/no admitido/) }]);
  });

  it("registroPreview rejects an entity the user cannot see", async () => {
    await expect(caller(outsider).fiscal.registroPreview({ entityId: e1, year: 2026, month: 8 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
