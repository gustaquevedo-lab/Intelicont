// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type AppRouter = typeof import("@/trpc").appRouter;
type Caller = ReturnType<AppRouter["createCaller"]>;
type ManualInput = Parameters<Caller["tax-documents"]["createManual"]>[0];

describe.skipIf(!process.env.TEST_ADMIN_URL)("manual tax documents with withholdings (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let appRouter: AppRouter;
  let user: string, outsider: string, e1: string;
  let withProfile: string, noProfile: string, expense: string;
  let seq = 1;
  const prevUrl = process.env.DATABASE_URL;
  const caller = (userId = user, idempotencyKey: string = crypto.randomUUID()) => appRouter.createCaller({ userId, requestId: "t", idempotencyKey });
  const docs = (userId = user, key?: string) => caller(userId, key)["tax-documents"];
  const count = async (q: Promise<{ n: string }[]>) => Number((await q)[0].n);
  const nextNumber = () => `001-001-${String(seq++).padStart(7, "0")}`;

  /** Purchase of 11.000.000 IVA included (IVA 1.000.000) on credit, dated in the open period 09/2026. */
  const input = (over: Partial<ManualInput> = {}): ManualInput => ({
    entityId: e1,
    direction: "received",
    docCode: 109,
    partnerId: withProfile,
    timbrado: "12345678",
    number: nextNumber(),
    issueDate: "2026-09-15",
    condition: "credit",
    gravado10: 11_000_000,
    gravado5: 0,
    exento: 0,
    total: 11_000_000,
    imputaIva: true,
    imputaIre: true,
    imputaIrp: false,
    expenseAccountId: expense,
    concept: "Honorarios de septiembre",
    ...over,
  });

  /** [account code, debit, credit] of an entry, in line order of insertion amount. */
  const entryLines = async (entryId: string) => (await t.owner`
    select a.code, l.debit::bigint::text as debit, l.credit::bigint::text as credit, l.account_id
    from journal_lines l join accounts a on a.id = l.account_id where l.entry_id = ${entryId}`)
    .map((r) => [r.code as string, Number(r.debit), Number(r.credit)] as const)
    .sort((a, b) => b[1] - a[1] || b[2] - a[2]);

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    user = await mkUser("u@x.test");
    outsider = await mkUser("o@x.test");
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    appRouter = (await import("@/trpc")).appRouter;
    // Default chart of accounts (+ current period) from entities.create.
    e1 = (await caller().entities.create({ ruc: "80011111-7", legalName: "Estudio Uno", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" })).id;
    await caller(outsider).entities.create({ ruc: "80144114-5", legalName: "Otra", taxRegimes: ["IVA_GRAL"], baseCurrency: "PYG" });
    await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e1}, 2026, 9, 'open')`;
    expense = (await t.owner`select a.id from accounts a join chart_of_accounts c on c.id = a.coa_id
      where c.entity_id = ${e1} and a.code = '5.1.04'`)[0].id;
    withProfile = (await caller().partners.create({ entityId: e1, kind: "supplier", ruc: "80014066-4", legalName: "Proveedor Agente" })).id;
    await caller().partners.update({ id: withProfile, retentionProfile: { iva: { rate: 0.3 } } });
    noProfile = (await caller().partners.create({ entityId: e1, kind: "supplier", ruc: "80005427-0", legalName: "Proveedor Sin Perfil" })).id;
  }, 120_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("createManual stores the document, the retention rows and a posted entry with the retention line", async () => {
    const i = input();
    const { documentId, entryId } = await docs().createManual(i);
    const [doc] = await t.owner`select * from tax_documents where id = ${documentId}`;
    expect(doc).toMatchObject({
      entity_id: e1, direction: "received", doc_type: "invoice", number: i.number, timbrado: "12345678", partner_id: withProfile,
      condition: "credit", status: "posted", gravado_10: "11000000", iva_10: "1000000", iva_5: "0", total: "11000000",
      journal_entry_id: entryId,
    });
    expect(doc.metadata).toEqual({ manual: true, concept: "Honorarios de septiembre" });
    const lines = await t.owner`select description, quantity, unit_price, iva_rate, amount from tax_document_lines where document_id = ${documentId}`;
    expect(lines).toEqual([{ description: "Honorarios de septiembre", quantity: "1.0000", unit_price: "11000000", iva_rate: 10, amount: "11000000" }]);
    const ret = await t.owner`select retention_type, base, rate, amount, certificate_number, to_char(withheld_at, 'YYYY-MM-DD') as withheld_at from retentions where document_id = ${documentId}`;
    expect(ret).toEqual([{ retention_type: "iva", base: "1000000", rate: "30.00", amount: "300000", certificate_number: null, withheld_at: "2026-09-15" }]);
    const [entry] = await t.owner`select status, source, source_ref, to_char(date at time zone 'UTC', 'YYYY-MM-DD') as d from journal_entries where id = ${entryId}`;
    expect(entry).toEqual({ status: "posted", source: "purchase", source_ref: i.number, d: "2026-09-15" });
    expect(await entryLines(entryId)).toEqual([
      ["5.1.04", 10_000_000, 0],
      ["1.1.04", 1_000_000, 0],
      ["2.1.01", 0, 10_700_000],
      ["2.1.03", 0, 300_000],
    ]);
    const ev = await t.owner`select actor_id, target_type from audit_events where action = 'tax_document.created_manual' and target_id = ${documentId}`;
    expect(ev).toEqual([{ actor_id: user, target_type: "tax_document" }]);
  });

  it("createManual without a retention profile has no retention rows and no retention line", async () => {
    const { documentId, entryId } = await docs().createManual(input({ partnerId: noProfile }));
    expect(await count(t.owner`select count(*) n from retentions where document_id = ${documentId}`)).toBe(0);
    expect(await entryLines(entryId)).toEqual([
      ["5.1.04", 10_000_000, 0],
      ["1.1.04", 1_000_000, 0],
      ["2.1.01", 0, 11_000_000],
    ]);
  });

  it("previewManual matches what createManual posts", async () => {
    const i = input({ condition: "cash", gravado5: 2_100_000, total: 13_100_000 });
    const preview = await docs().previewManual(i);
    expect(preview).toMatchObject({ iva10: 1_000_000, iva5: 100_000, totalRetentions: 330_000, netPayable: 12_770_000 });
    expect(preview.retentions).toEqual([expect.objectContaining({ type: "iva", base: 1_100_000, rate: 0.3, amount: 330_000, unverified: false })]);
    const { documentId, entryId } = await docs().createManual(i);
    const posted = await t.owner`select account_id, debit::bigint::text as debit, credit::bigint::text as credit from journal_lines where entry_id = ${entryId}`;
    const norm = (ls: { accountId: string | null; debit: number; credit: number }[]) =>
      ls.map((l) => `${l.accountId}|${l.debit}|${l.credit}`).sort();
    expect(norm(posted.map((l) => ({ accountId: l.account_id, debit: Number(l.debit), credit: Number(l.credit) })))).toEqual(norm(preview.lines));
    const ret = await t.owner`select retention_type, base, amount from retentions where document_id = ${documentId}`;
    expect(ret.map((r) => [r.retention_type, Number(r.base), Number(r.amount)])).toEqual(preview.retentions.map((r) => [r.type, r.base, r.amount]));
    // Cash purchase: the counterpart is Caja for total - retentions.
    expect(preview.lines.find((l) => l.accountCode.startsWith("1.1.01"))).toMatchObject({ credit: 12_770_000 });
  });

  it("createManual rejects a total different from the sum of the amounts", async () => {
    const i = input({ total: 11_000_001 });
    await expect(docs().createManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/total/i) });
    await expect(docs().previewManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await count(t.owner`select count(*) n from tax_documents where number = ${i.number}`)).toBe(0);
    // A total-only code with a split still needs total = sum.
    await expect(docs().createManual(input({ docCode: 104, total: 11_000_001 }))).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/total/i) });
  });

  it("createManual rejects a credit note without a related document", async () => {
    const i = input({ docCode: 110 });
    await expect(docs().createManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/comprobante asociado/i) });
    expect(await count(t.owner`select count(*) n from tax_documents where number = ${i.number}`)).toBe(0);
    const ok = await docs().createManual(input({ docCode: 110, partnerId: noProfile, relatedNumber: "001-001-0000001", relatedTimbrado: "12345678" }));
    const [doc] = await t.owner`select doc_type, doc_code, related_number, related_timbrado from tax_documents where id = ${ok.documentId}`;
    expect(doc).toEqual({ doc_type: "credit_note", doc_code: 110, related_number: "001-001-0000001", related_timbrado: "12345678" });
    // A purchase credit note reverses the purchase: the supplier is debited.
    expect((await entryLines(ok.entryId))[0]).toEqual(["2.1.01", 11_000_000, 0]);
  });

  it("createManual rejects a document with no tax obligation selected", async () => {
    const i = input({ imputaIva: false, imputaIre: false, imputaIrp: false });
    await expect(docs().createManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/obligación/i) });
    expect(await count(t.owner`select count(*) n from tax_documents where number = ${i.number}`)).toBe(0);
    const noImputa = await docs().createManual(input({ imputaIva: false, imputaIre: false, imputaIrp: false, noImputa: true, partnerId: noProfile }));
    expect((await t.owner`select no_imputa from tax_documents where id = ${noImputa.documentId}`)[0].no_imputa).toBe(true);
  });

  it("createManual validates the counterparty RUC check digit", async () => {
    const i = input({ partnerId: undefined, partner: { ruc: "80120610-4", legalName: "Mal DV" } });
    await expect(docs().createManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/RUC/) });
    await expect(docs().previewManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/RUC/) });
    expect(await count(t.owner`select count(*) n from partners where ruc = '80120610'`)).toBe(0);
  });

  it("a manual document is not electronic and carries doc_code, counterparty id type and imputations", async () => {
    const inline = await docs().createManual(input({ partnerId: undefined, partner: { ruc: "80120610-3", legalName: "Nuevo Proveedor SA" }, imputaIrp: true }));
    const [doc] = await t.owner`select d.*, p.ruc, p.dv_ruc, p.legal_name, p.kind from tax_documents d join partners p on p.id = d.partner_id where d.id = ${inline.documentId}`;
    expect(doc).toMatchObject({
      is_electronic: false, cdc: null, doc_code: 109, counterparty_id_type: 11,
      imputa_iva: true, imputa_ire: true, imputa_irp: true, no_imputa: false, foreign_currency: false,
      ruc: "80120610", dv_ruc: "3", legal_name: "Nuevo Proveedor SA", kind: "supplier",
    });
    // Find-or-create: the same RUC again reuses the partner.
    const again = await docs().createManual(input({ partnerId: undefined, partner: { ruc: "80120610-3", legalName: "Otro nombre" } }));
    expect((await t.owner`select partner_id from tax_documents where id = ${again.documentId}`)[0].partner_id).toBe(doc.partner_id);
    // A cédula without DV is counterparty id type 12.
    const ci = await docs().createManual(input({ partnerId: undefined, partner: { ruc: "1234567", legalName: "Persona Física" }, foreignCurrency: true }));
    expect((await t.owner`select counterparty_id_type, foreign_currency from tax_documents where id = ${ci.documentId}`)[0])
      .toEqual({ counterparty_id_type: 12, foreign_currency: true });
    // A foreign partner is 17 (identificación tributaria).
    const foreign = (await caller().partners.create({ entityId: e1, kind: "supplier", ruc: "30712345678", legalName: "Proveedor Argentino", country: "ARG" })).id;
    const fx = await docs().createManual(input({ partnerId: foreign }));
    expect((await t.owner`select counterparty_id_type from tax_documents where id = ${fx.documentId}`)[0].counterparty_id_type).toBe(17);
  });

  it("createManual in a month without an open period fails and leaves nothing", async () => {
    const before = await count(t.owner`select count(*) n from audit_events`);
    const i = input({ issueDate: "2025-03-10", partnerId: undefined, partner: { ruc: "80150477-5", legalName: "Sin Período" } });
    await expect(docs().createManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST", message: "No hay período abierto para 03/2025" });
    expect(await count(t.owner`select count(*) n from tax_documents where number = ${i.number}`)).toBe(0);
    expect(await count(t.owner`select count(*) n from partners where ruc = '80150477'`)).toBe(0);
    expect(await count(t.owner`select count(*) n from audit_events`)).toBe(before);
    // Before 2021 only credit documents are accepted (Registro rule).
    await expect(docs().createManual(input({ issueDate: "2020-12-31", condition: "cash" }))).rejects.toMatchObject({ message: expect.stringMatching(/2021/) });
  });

  it("two concurrent identical manual documents create one", async () => {
    const i = input();
    const results = await Promise.allSettled([docs().createManual(i), docs().createManual(i)]);
    expect(results.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ code: "BAD_REQUEST", message: "Comprobante duplicado" });
    expect(await count(t.owner`select count(*) n from tax_documents where number = ${i.number}`)).toBe(1);
    expect(await count(t.owner`select count(*) n from journal_entries where source_ref = ${i.number}`)).toBe(1);
    // Inline partner variant: the partner is found-or-created once, the document once.
    const j = input({ partnerId: undefined, partner: { ruc: "80000001-3", legalName: "Concurrente" } });
    const r2 = await Promise.allSettled([docs().createManual(j), docs().createManual(j)]);
    expect(r2.map((r) => r.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect(await count(t.owner`select count(*) n from partners where ruc = '80000001'`)).toBe(1);
    expect(await count(t.owner`select count(*) n from tax_documents where number = ${j.number}`)).toBe(1);
  });

  it("createManual is idempotent with the same key", async () => {
    const i = input();
    const key = crypto.randomUUID();
    const a = await docs(user, key).createManual(i);
    const b = await docs(user, key).createManual(i);
    expect(b).toEqual(a);
    expect(await count(t.owner`select count(*) n from tax_documents where number = ${i.number}`)).toBe(1);
    // A new key with the same body is a duplicate document, not a replay.
    await expect(docs().createManual(i)).rejects.toMatchObject({ message: "Comprobante duplicado" });
  });

  it("partners.update validates the retention profile and null removes it", async () => {
    const id = (await caller().partners.create({ entityId: e1, kind: "supplier", ruc: "80000003-0", legalName: "Perfil" })).id;
    await expect(caller().partners.update({ id, retentionProfile: { iva: { rate: 0.5 } } as never })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await caller().partners.update({ id, retentionProfile: { iva: { rate: 0.7, minimum: 100_000 }, ire: { rate: 0.03 } } });
    expect((await t.owner`select retention_profile from partners where id = ${id}`)[0].retention_profile).toEqual({ iva: { rate: 0.7, minimum: 100_000 }, ire: { rate: 0.03 } });
    await caller().partners.update({ id, retentionProfile: null });
    expect((await t.owner`select retention_profile from partners where id = ${id}`)[0].retention_profile).toBeNull();
  });

  it("a manual document has no SIFEN status", async () => {
    const { documentId } = await docs().createManual(input({ partnerId: noProfile }));
    const [doc] = await t.owner`select sifen_status, is_electronic from tax_documents where id = ${documentId}`;
    expect(doc).toEqual({ sifen_status: null, is_electronic: false });
  });

  it("withholding is never credited to an asset account", async () => {
    // An asset with a lower code whose name also says "Retenciones" (withholdings suffered).
    const [{ coa_id: coa }] = await t.owner`select a.coa_id from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${e1} limit 1`;
    const [{ id: asset }] = await t.owner`insert into accounts (coa_id, code, name, nature, allows_posting) values (${coa}, '1.1.00', 'Retenciones de IVA sufridas', 'asset', true) returning id`;
    const preview = await docs().previewManual(input());
    expect(preview.lines.some((l) => l.accountId === asset)).toBe(false);
    const { entryId } = await docs().createManual(input());
    expect(await count(t.owner`select count(*) n from journal_lines where entry_id = ${entryId} and account_id = ${asset}`)).toBe(0);
    expect((await entryLines(entryId)).find((l) => l[2] === 300_000)?.[0]).toBe("2.1.03"); // Retenciones por Pagar (liability)
  });

  it("createManual fails when the chart has no liability account for withholdings", async () => {
    const e3 = (await t.owner`insert into entities (ruc, legal_name) values ('80000004-8', 'Sin Retenciones') returning id`)[0].id as string;
    await t.owner`insert into memberships (user_id, entity_id, role) values (${user}, ${e3}, 'admin')`;
    const coa = (await t.owner`insert into chart_of_accounts (entity_id, kind, name) values (${e3}, 'fiscal_py', 'PC') returning id`)[0].id;
    const accts = await t.owner`insert into accounts (coa_id, code, name, nature, allows_posting) values
      (${coa}, '1.1.00', 'Retenciones de IVA sufridas', 'asset', true), (${coa}, '1.1.04', 'IVA Crédito Fiscal', 'asset', true),
      (${coa}, '2.1.01', 'Proveedores', 'liability', true), (${coa}, '5.1.04', 'Honorarios', 'expense', true) returning id, code`;
    await t.owner`insert into fiscal_periods (entity_id, year, month, status) values (${e3}, 2026, 9, 'open')`;
    const sup = (await caller().partners.create({ entityId: e3, kind: "supplier", ruc: "80014066-4", legalName: "Agente" })).id;
    await caller().partners.update({ id: sup, retentionProfile: { iva: { rate: 0.3 } } });
    const i = input({ entityId: e3, partnerId: sup, expenseAccountId: accts.find((a) => a.code === "5.1.04")!.id });
    const preview = await docs().previewManual(i);
    expect(preview.notes).toEqual(["Falta la cuenta de Retenciones por Pagar en el plan de cuentas"]);
    expect(preview.lines.find((l) => l.credit === 300_000)?.accountId).toBeNull();
    await expect(docs().createManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Falta la cuenta de Retenciones por Pagar en el plan de cuentas" });
    expect(await count(t.owner`select count(*) n from tax_documents where entity_id = ${e3}`)).toBe(0);
  });

  it("total-only code with IVA split books the IVA", async () => {
    const res = await docs().createManual(input({ docCode: 104, partnerId: noProfile, gravado10: 1_100_000, exento: 0, total: 1_100_000 }));
    expect(res.warnings).toEqual([]);
    const [doc] = await t.owner`select doc_code, gravado_10, iva_10, exento, total from tax_documents where id = ${res.documentId}`;
    expect(doc).toEqual({ doc_code: 104, gravado_10: "1100000", iva_10: "100000", exento: "0", total: "1100000" });
    expect(await entryLines(res.entryId)).toEqual([["5.1.04", 1_000_000, 0], ["1.1.04", 100_000, 0], ["2.1.01", 0, 1_100_000]]);
  });

  it("total-only code without a split books no IVA and warns", async () => {
    const i = input({ docCode: 105, partnerId: noProfile, gravado10: undefined, gravado5: undefined, exento: undefined, total: 50_000 });
    const preview = await docs().previewManual(i);
    expect(preview.warnings).toEqual(["Sin discriminación de IVA: se contabiliza sin IVA"]);
    expect(preview).toMatchObject({ iva10: 0, iva5: 0 });
    const res = await docs().createManual(i);
    expect(res.warnings).toEqual(["Sin discriminación de IVA: se contabiliza sin IVA"]);
    const [doc] = await t.owner`select gravado_10, gravado_5, exento, iva_10, iva_5, total from tax_documents where id = ${res.documentId}`;
    expect(doc).toEqual({ gravado_10: "0", gravado_5: "0", exento: "0", iva_10: "0", iva_5: "0", total: "50000" });
    expect(await entryLines(res.entryId)).toEqual([["5.1.04", 50_000, 0], ["2.1.01", 0, 50_000]]);
  });

  it("unsupported Registro codes are rejected", async () => {
    for (const docCode of [106, 107, 112]) {
      const i = input({ docCode });
      await expect(docs().createManual(i), String(docCode)).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Este tipo de comprobante todavía no se puede cargar manualmente" });
      await expect(docs().previewManual(i), String(docCode)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
  });

  it("expenseAccountId of a liability account is rejected", async () => {
    const [{ id: liability }] = await t.owner`select a.id from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${e1} and a.code = '2.1.01'`;
    await expect(docs().createManual(input({ expenseAccountId: liability }))).rejects.toMatchObject({ code: "BAD_REQUEST", message: expect.stringMatching(/Cuenta de gasto inválida/) });
    const [{ id: income }] = await t.owner`select a.id from accounts a join chart_of_accounts c on c.id = a.coa_id where c.entity_id = ${e1} and a.code = '4.1.01'`;
    await expect(docs().previewManual(input({ expenseAccountId: income }))).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("a user of another entity cannot create or preview for this entity", async () => {
    const i = input();
    await expect(docs(outsider).previewManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Empresa no encontrada" });
    await expect(docs(outsider).createManual(i)).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Empresa no encontrada" });
    // Nor with an inline partner.
    const inline = input({ partnerId: undefined, partner: { ruc: "80000002-1", legalName: "Ajeno" } });
    await expect(docs(outsider).createManual(inline)).rejects.toMatchObject({ message: "Empresa no encontrada" });
    expect(await count(t.owner`select count(*) n from tax_documents where number in (${i.number}, ${inline.number})`)).toBe(0);
    expect(await count(t.owner`select count(*) n from partners where ruc = '80000002'`)).toBe(0);
  });
});
