// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TABLA_4 } from "@intelicont/ledger/registro-codes";
import { createTestDb, type TestDb } from "../../../../../packages/ledger/db/test-db";

describe.skipIf(!process.env.TEST_ADMIN_URL)("Registro de Comprobantes schema (real Postgres)", () => {
  let t: TestDb;
  let eA: string, eB: string, pA: string, pB: string, accB: string, jeB: string, perB: string;
  const CDC = "0".repeat(44);

  const doc = (entity: string, o: { cdc?: string | null; code?: number | null; partner?: string | null; je?: string | null; per?: string | null } = {}) =>
    t.owner`insert into tax_documents (entity_id, direction, doc_type, number, issue_date, total, cdc, doc_code, partner_id, journal_entry_id, iva_book_period)
      values (${entity}, 'issued', 'invoice', ${"N-" + Math.random()}, now(), 100, ${o.cdc ?? null}, ${o.code ?? null}, ${o.partner ?? null}, ${o.je ?? null}, ${o.per ?? null}) returning id`;

  beforeAll(async () => {
    t = await createTestDb();
    const M = t.owner;
    eA = (await M`insert into entities (ruc, legal_name) values ('80000001-1','A') returning id`)[0].id;
    eB = (await M`insert into entities (ruc, legal_name) values ('80099999-9','B') returning id`)[0].id;
    pA = (await M`insert into partners (entity_id, kind, ruc, legal_name) values (${eA},'customer','1-1','PA') returning id`)[0].id;
    pB = (await M`insert into partners (entity_id, kind, ruc, legal_name) values (${eB},'customer','2-2','PB') returning id`)[0].id;
    const coaB = (await M`insert into chart_of_accounts (entity_id, kind, name) values (${eB},'x','B') returning id`)[0].id;
    accB = (await M`insert into accounts (coa_id, code, name, nature) values (${coaB},'1','CajaB','asset') returning id`)[0].id;
    perB = (await M`insert into fiscal_periods (entity_id, year, month, status) values (${eB},2026,5,'open') returning id`)[0].id;
    jeB = (await M`insert into journal_entries (entity_id, period_id, date, number) values (${eB},${perB},now(),'T-1') returning id`)[0].id;
  }, 120_000);

  afterAll(async () => {
    await t?.drop();
  }, 60_000);

  it("duplicate (entity_id, cdc) is rejected", async () => {
    await doc(eA, { cdc: CDC });
    await expect(doc(eA, { cdc: CDC })).rejects.toThrow(/tax_documents_entity_cdc_uq/);
  });

  it("same cdc in different entities is allowed", async () => {
    await doc(eA, { cdc: "1".repeat(44) });
    await expect(doc(eB, { cdc: "1".repeat(44) })).resolves.toBeDefined();
  });

  it("documents without cdc are not constrained", async () => {
    await doc(eA);
    await expect(doc(eA)).resolves.toBeDefined();
  });

  it("doc_code outside Tabla 4 is rejected", async () => {
    await expect(doc(eA, { code: 113 })).rejects.toThrow(/doc_code/);
    await expect(doc(eA, { code: 109 })).resolves.toBeDefined();
  });

  it("SQL doc_code CHECK matches TABLA_4", async () => {
    const rows = await t.owner`select conrelid::regclass::text as tbl, pg_get_constraintdef(oid) as def from pg_constraint
      where contype = 'c' and conname in ('tax_documents_doc_code_check', 'timbrados_doc_code_check')`;
    expect(rows).toHaveLength(2);
    const expected = Object.keys(TABLA_4).map(Number).sort((a, b) => a - b);
    for (const r of rows) {
      const nums = [...(r.def as string).matchAll(/\b(\d{3})\b/g)].map((m) => Number(m[1])).sort((a, b) => a - b);
      expect(nums, r.tbl).toEqual(expected);
    }
  });

  it("timbrados are isolated by entity", async () => {
    const ins = (e: string, n: string) =>
      t.scoped([e], (tx) => tx`insert into timbrados (entity_id, number, valid_from, valid_to, establishment, point, doc_code) values (${e}, ${n}, '2026-01-01', '2026-12-31', '001', '001', 109)`);
    await ins(eA, "12345678");
    await ins(eB, "87654321");
    const rows = await t.scoped([eA], (tx) => tx`select number from timbrados`);
    expect(rows.map((r) => r.number)).toEqual(["12345678"]);
    await expect(ins(eB, "11111111").then(() => t.scoped([eA], (tx) => tx`insert into timbrados (entity_id, number, valid_from, valid_to, establishment, point, doc_code) values (${eB}, '1', '2026-01-01', '2026-12-31', '001', '001', 109)`))).rejects.toThrow(/row-level security/);
  });

  it("timbrado partner of another entity is rejected", async () => {
    await expect(
      t.owner`insert into timbrados (entity_id, partner_id, number, valid_from, valid_to, establishment, point, doc_code) values (${eA}, ${pB}, '22222222', '2026-01-01', '2026-12-31', '001', '001', 109)`,
    ).rejects.toThrow(/does not belong/);
  });

  it("tax document with a partner of another entity is rejected", async () => {
    await expect(doc(eA, { partner: pB })).rejects.toThrow(/does not belong/);
    await expect(doc(eA, { partner: pA })).resolves.toBeDefined();
  });

  it("tax document line with an account of another entity is rejected", async () => {
    const id = (await doc(eA))[0].id;
    await expect(
      t.owner`insert into tax_document_lines (document_id, unit_price, amount, account_id) values (${id}, 1, 1, ${accB})`,
    ).rejects.toThrow(/does not belong/);
    await expect(t.owner`insert into tax_document_lines (document_id, unit_price, amount) values (${id}, 1, 1)`).resolves.toBeDefined();
  });

  it("tax document journal entry of another entity is rejected", async () => {
    await expect(doc(eA, { je: jeB })).rejects.toThrow(/does not belong/);
    await expect(doc(eA, { per: perB })).rejects.toThrow(/does not belong/);
  });
});
