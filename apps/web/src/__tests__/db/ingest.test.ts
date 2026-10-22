// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mod11Dv } from "@intelicont/ledger/fiscal-py";
import { parseSifenDE } from "@intelicont/ledger/sifen";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

type DbModule = typeof import("@ledger/db/index");
type RepoModule = typeof import("@ledger/db/repository");
type UseCases = typeof import("@ledger/src/usecases");

const FIXTURE = readFileSync(path.resolve(__dirname, "../../__fixtures__/sifen/fac_024-004-0049994.xml"), "utf-8");
const FIXTURE_CDC = "01800140664024004004999422026080911264669314";

/** The fixture with a distinct (valid) CDC, so each test owns its document. */
const variant = (seed: number, xml = FIXTURE) => {
  const body = FIXTURE_CDC.slice(0, 34) + String(seed).padStart(9, "0");
  return xml.replace(FIXTURE_CDC, body + mod11Dv(body));
};
const cdcOf = (xml: string) => /Id="(\d{44})"/.exec(xml)![1];

describe.skipIf(!process.env.TEST_ADMIN_URL)("ingestDocument (real Postgres)", () => {
  let t: TestDb;
  let db: DbModule;
  let repo: RepoModule;
  let uc: UseCases;
  let user: string, outsider: string, e1: string, e2: string;
  const prevUrl = process.env.DATABASE_URL;
  const as = <T>(userId: string, fn: () => Promise<T>) => db.withTenant(userId, fn);
  const ingest = (xml: string, entityId = e1, userId = user) => as(userId, () => uc.ingestDocument(entityId, "received", xml));
  const count = async (q: Promise<{ n: string }[]>) => Number((await q)[0].n);

  beforeAll(async () => {
    t = await createTestDb();
    const mkUser = async (email: string) =>
      (await t.owner`insert into users (name, email, two_factor_enabled) values (${email}, ${email}, true) returning id`)[0].id as string;
    user = await mkUser("u@x.test");
    outsider = await mkUser("o@x.test");
    // e1's RUC is the fixture's (anonymized) receiver.
    e1 = (await t.owner`insert into entities (ruc, legal_name) values ('1234567-9', 'Cliente de Prueba') returning id`)[0].id;
    e2 = (await t.owner`insert into entities (ruc, legal_name) values ('80011112-5', 'E2') returning id`)[0].id;
    await t.owner`insert into memberships (user_id, entity_id, role) values (${user}, ${e1}, 'admin'), (${outsider}, ${e2}, 'admin')`;
    // The fixture's timbrado, registered and valid on its issue date (2026-08-09).
    await t.owner`insert into timbrados (entity_id, number, valid_from, valid_to, establishment, point, doc_code)
      values (${e1}, '16284685', '2023-03-16', '2027-03-15', '024', '004', 109)`;
    process.env.DATABASE_URL = t.appUrl;
    vi.resetModules();
    db = await import("@ledger/db/index");
    repo = await import("@ledger/db/repository");
    uc = await import("@ledger/src/usecases");
  }, 120_000);

  afterAll(async () => {
    process.env.DATABASE_URL = prevUrl;
    await (db?.getDb() as unknown as { $client?: { end(o: object): Promise<void> } })?.$client?.end({ timeout: 2 });
    await t?.drop();
  });

  it("fixture XML creates the document, 2 lines and an audit event", async () => {
    const res = await ingest(FIXTURE);
    expect(res).toEqual({ ok: true, value: { documentId: expect.any(String), duplicate: false, warnings: [] } });
    if (!res.ok) return;
    const id = res.value.documentId;
    const [doc] = await t.owner`select * from tax_documents where id = ${id}`;
    expect(doc).toMatchObject({
      entity_id: e1, direction: "received", doc_type: "invoice", number: "024-004-0049994", timbrado: "16284685",
      cdc: FIXTURE_CDC, condition: "cash", status: "pending", sifen_status: "validated", currency_code: "PYG",
      gravado_10: "58000", gravado_5: "0", exento: "0", iva_10: "5273", iva_5: "0", total: "58000",
      is_electronic: true, doc_code: 109, counterparty_id_type: 11, imputa_iva: true,
    });
    expect(doc.issue_date).toBeTruthy();
    expect(doc.partner_id).toBeTruthy();
    const lines = await t.owner`select item_code, description, quantity, unit_price, iva_rate, amount from tax_document_lines where document_id = ${id} order by amount`;
    expect(lines).toEqual([
      { item_code: "9450", description: "Recargo12Mil", quantity: "1.0000", unit_price: "12000", iva_rate: 10, amount: "12000" },
      { item_code: "9827", description: "CboMcMeltDoMd", quantity: "1.0000", unit_price: "46000", iva_rate: 10, amount: "46000" },
    ]);
    const ev = await t.owner`select * from audit_events where action = 'tax_document.ingested' and target_id = ${id}`;
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ entity_id: e1, actor_id: user, target_type: "tax_document" });
    expect(ev[0].after).toEqual({ cdc: FIXTURE_CDC, number: "024-004-0049994", total: 58000 });
  });

  it("the same XML twice returns the same documentId without duplicating", async () => {
    const xml = variant(2);
    const first = await ingest(xml);
    const second = await ingest(xml);
    if (!first.ok || !second.ok) throw new Error("expected ok");
    expect(first.value.duplicate).toBe(false);
    expect(second.value).toEqual({ documentId: first.value.documentId, duplicate: true, warnings: [] });
    expect(await count(t.owner`select count(*) n from tax_documents where cdc = ${cdcOf(xml)}`)).toBe(1);
    expect(await count(t.owner`select count(*) n from tax_document_lines where document_id = ${first.value.documentId}`)).toBe(2);
    expect(await count(t.owner`select count(*) n from audit_events where target_id = ${first.value.documentId}`)).toBe(1);
  });

  it("two concurrent identical uploads create one document and one audit event", async () => {
    const xml = variant(3);
    const results = await Promise.all([ingest(xml), ingest(xml)]);
    const values = results.map((r) => {
      if (!r.ok) throw new Error(r.error);
      return r.value;
    });
    expect(values[0].documentId).toBe(values[1].documentId);
    expect(values.map((v) => v.duplicate).sort()).toEqual([false, true]);
    expect(await count(t.owner`select count(*) n from tax_documents where cdc = ${cdcOf(xml)}`)).toBe(1);
    expect(await count(t.owner`select count(*) n from tax_document_lines where document_id = ${values[0].documentId}`)).toBe(2);
    expect(await count(t.owner`select count(*) n from audit_events where target_id = ${values[0].documentId}`)).toBe(1);
  });

  it("an issuer RUC with a bad check digit is rejected", async () => {
    const xml = variant(4).replace("<dDVEmi>4</dDVEmi>", "<dDVEmi>5</dDVEmi>");
    const res = await ingest(xml);
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/RUC del emisor inválido/) });
    expect(await count(t.owner`select count(*) n from tax_documents where cdc = ${cdcOf(xml)}`)).toBe(0);
  });

  it("a malformed XML returns Err", async () => {
    const res = await ingest("<rDE><DE Id='1'><gTimb></rDE>");
    expect(res).toEqual({ ok: false, error: expect.stringMatching(/^XML SIFEN inválido: /) });
  });

  it("iva10 inconsistent with the gross produces a warning", async () => {
    const xml = variant(6).replace("<dIVA10>5273.00000000</dIVA10>", "<dIVA10>5000.00000000</dIVA10>");
    const res = await ingest(xml);
    if (!res.ok) throw new Error(res.error);
    expect(res.value.duplicate).toBe(false);
    expect(res.value.warnings).toEqual([expect.stringMatching(/IVA 10%/)]);
  });

  it("total different from the sum of lines produces a warning", async () => {
    const xml = variant(7).replace("<dTotGralOpe>58000.00000000</dTotGralOpe>", "<dTotGralOpe>60000.00000000</dTotGralOpe>");
    const res = await ingest(xml);
    if (!res.ok) throw new Error(res.error);
    expect(res.value.warnings).toContainEqual(expect.stringMatching(/suma de las líneas/));
    expect(await count(t.owner`select count(*) n from tax_documents where id = ${res.value.documentId}`)).toBe(1);
  });

  it("timbrado outside a registered validity is rejected", async () => {
    await t.owner`insert into timbrados (entity_id, number, valid_from, valid_to, establishment, point, doc_code)
      values (${e1}, '87654321', '2020-01-01', '2020-12-31', '024', '004', 109)`;
    const xml = variant(8).replace("<dNumTim>16284685</dNumTim>", "<dNumTim>87654321</dNumTim>");
    const res = await ingest(xml);
    expect(res).toEqual({ ok: false, error: "Timbrado fuera de vigencia" });
    expect(await count(t.owner`select count(*) n from tax_documents where cdc = ${cdcOf(xml)}`)).toBe(0);
    expect(await count(t.owner`select count(*) n from audit_events where action = 'tax_document.ingested' and after->>'cdc' = ${cdcOf(xml)}`)).toBe(0);
  });

  it("timbrado with no registered row produces a warning", async () => {
    const xml = variant(9).replace("<dNumTim>16284685</dNumTim>", "<dNumTim>11112222</dNumTim>");
    const res = await ingest(xml);
    if (!res.ok) throw new Error(res.error);
    expect(res.value.warnings).toEqual(["Timbrado no registrado: no se pudo validar su vigencia"]);
  });

  it("a document addressed to another RUC produces a warning", async () => {
    const xml = variant(10).replace("<dRucRec>1234567<", "<dRucRec>80011112<").replace("<dDVRec>9<", "<dDVRec>5<");
    const res = await ingest(xml);
    if (!res.ok) throw new Error(res.error);
    expect(res.value.warnings).toEqual([expect.stringMatching(/otro RUC.*80011112-5/)]);
  });

  it("partner is created from the issuer and reused on the second document", async () => {
    const a = await ingest(variant(11));
    const b = await ingest(variant(12));
    if (!a.ok || !b.ok) throw new Error("expected ok");
    const partners = await t.owner`select id, kind, ruc, dv_ruc, legal_name, country from partners where entity_id = ${e1} and ruc = '80014066'`;
    expect(partners).toEqual([{ id: expect.any(String), kind: "supplier", ruc: "80014066", dv_ruc: "4", legal_name: "SERVICIOS RAPIDOS DEL PARAGUAY S.A.", country: "PRY" }]);
    const docs = await t.owner`select partner_id from tax_documents where id in ${t.owner([a.value.documentId, b.value.documentId])}`;
    expect(docs.map((d) => d.partner_id)).toEqual([partners[0].id, partners[0].id]);
  });

  it("ingest stores the parsed SifenDocument in metadata.sifen", async () => {
    const xml = variant(13);
    const res = await ingest(xml);
    if (!res.ok) throw new Error(res.error);
    const parsed = parseSifenDE(xml);
    if (!parsed.ok) throw new Error(parsed.error);
    const [doc] = await t.owner`select metadata from tax_documents where id = ${res.value.documentId}`;
    expect(doc.metadata).toEqual({ sifen: parsed.value });
  });

  it("documents ingested by another entity are not visible", async () => {
    const xml = variant(14);
    const mine = await ingest(xml);
    if (!mine.ok) throw new Error(mine.error);
    expect(await as(outsider, () => repo.getTaxDocuments(e1))).toEqual([]);
    expect(await as(outsider, () => repo.getTaxDocument(mine.value.documentId))).toBeUndefined();
    // Ingesting into an entity the user is not a member of fails; its own entity gets its own copy.
    expect(await ingest(xml, e1, outsider)).toEqual({ ok: false, error: "Empresa no encontrada" });
    const theirs = await ingest(xml, e2, outsider);
    if (!theirs.ok) throw new Error(theirs.error);
    expect(theirs.value.duplicate).toBe(false);
    expect(theirs.value.documentId).not.toBe(mine.value.documentId);
    expect((await as(user, () => repo.getTaxDocuments(e1))).map((d) => d.id)).not.toContain(theirs.value.documentId);
  });
});
