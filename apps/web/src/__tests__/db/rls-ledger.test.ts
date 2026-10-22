// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type Sql, type TestDb } from "../../../../../packages/ledger/db/test-db";

describe.skipIf(!process.env.TEST_ADMIN_URL)("RLS + ledger immutability (real Postgres)", () => {
  let t: TestDb;
  let eA: string, eB: string;
  let a1: string, a2: string, accB: string;
  let perA: string, perB: string, perClosed: string;
  let okId: string;
  const actor = "11111111-1111-1111-1111-111111111111";

  const draft = async (tx: Sql, o: { entity?: string; period?: string } = {}) =>
    (await tx`insert into journal_entries (entity_id, period_id, date, number) values (${o.entity ?? eA}, ${o.period ?? perA}, now(), ${"T-" + Math.random()}) returning id`)[0].id as string;
  const line = (tx: Sql, id: string, acc: string, d: number, c: number, cur = "PYG") =>
    tx`insert into journal_lines (entry_id, account_id, debit, credit, currency_code) values (${id}, ${acc}, ${d}, ${c}, ${cur})`;
  const post = (tx: Sql, id: string) => tx`update journal_entries set status='posted' where id=${id}`;
  const postedEntry = (amount = 100) =>
    t.scoped([eA], async (tx) => {
      const id = await draft(tx);
      await line(tx, id, a1, amount, 0);
      await line(tx, id, a2, 0, amount);
      await post(tx, id);
      return id;
    });
  const closedDraft = async (tx: Sql) => {
    const id = await draft(tx, { period: perClosed });
    await line(tx, id, a1, 7, 0);
    await line(tx, id, a2, 0, 7);
    return id;
  };

  beforeAll(async () => {
    t = await createTestDb();
    const M = t.owner;
    eA = (await M`insert into entities (ruc, legal_name) values ('80000001-1','Empresa A') returning id`)[0].id;
    const coaA = (await M`insert into chart_of_accounts (entity_id, kind, name) values (${eA},'x','A') returning id`)[0].id;
    [a1, a2] = (
      await M`insert into accounts (coa_id, code, name, nature) values (${coaA},'1','CajaA','asset'),(${coaA},'2','CapitalA','equity') returning id, code`
    )
      .sort((x, y) => (x.code < y.code ? -1 : 1))
      .map((r) => r.id);
    perA = (await M`insert into fiscal_periods (entity_id, year, month, status) values (${eA},2026,4,'open') returning id`)[0].id;
    eB = (await M`insert into entities (ruc, legal_name) values ('80099999-9','Empresa B') returning id`)[0].id;
    const coaB = (await M`insert into chart_of_accounts (entity_id, kind, name) values (${eB},'x','B') returning id`)[0].id;
    accB = (await M`insert into accounts (coa_id, code, name, nature) values (${coaB},'1','CajaB','asset') returning id`)[0].id;
    perB = (await M`insert into fiscal_periods (entity_id, year, month, status) values (${eB},2026,5,'open') returning id`)[0].id;
    perClosed = (await M`insert into fiscal_periods (entity_id, year, month, status) values (${eA},2025,1,'closed') returning id`)[0].id;
    okId = await postedEntry();
  }, 120_000);

  afterAll(async () => {
    await t?.drop();
  }, 60_000);

  describe("RLS", () => {
    it("no scope -> entities empty", async () => {
      expect(await t.scoped([], (tx) => tx`select * from entities`)).toHaveLength(0);
    });
    it("scope A -> sees only A", async () => {
      const rows = await t.scoped([eA], (tx) => tx`select id from entities`);
      expect(rows.map((r) => r.id)).toEqual([eA]);
    });
    it("scope A -> cannot see B's accounts", async () => {
      expect(await t.scoped([eA], (tx) => tx`select id from accounts where id=${accB}`)).toHaveLength(0);
    });
    it("scope A+B -> sees both", async () => {
      expect(await t.scoped([eA, eB], (tx) => tx`select id from entities`)).toHaveLength(2);
    });
    it("insert into B under scope A blocked", async () => {
      await expect(
        t.scoped([eA], (tx) => tx`insert into partners (entity_id, kind, ruc, legal_name) values (${eB},'customer','1-1','x')`),
      ).rejects.toThrow(/row-level security/);
    });
    it("no scope -> journal_lines empty", async () => {
      expect(await t.scoped([], (tx) => tx`select * from journal_lines`)).toHaveLength(0);
    });
  });

  describe("Posting rules", () => {
    it("insert as posted blocked", async () => {
      await expect(
        t.scoped([eA], (tx) => tx`insert into journal_entries (entity_id, period_id, date, status) values (${eA},${perA},now(),'posted')`),
      ).rejects.toThrow(/inserted as draft/);
    });
    it("post with 1 line blocked", async () => {
      await expect(
        t.scoped([eA], async (tx) => {
          const id = await draft(tx);
          await line(tx, id, a1, 10, 0);
          await post(tx, id);
        }),
      ).rejects.toThrow(/at least 2 lines/);
    });
    it("post unbalanced blocked", async () => {
      await expect(
        t.scoped([eA], async (tx) => {
          const id = await draft(tx);
          await line(tx, id, a1, 10, 0);
          await line(tx, id, a2, 0, 9);
          await post(tx, id);
        }),
      ).rejects.toThrow(/not balanced/);
    });
    it("balanced in PYG but not USD blocked", async () => {
      await expect(
        t.scoped([eA], async (tx) => {
          const id = await draft(tx);
          await line(tx, id, a1, 10, 0);
          await line(tx, id, a2, 0, 10);
          await line(tx, id, a1, 5, 0, "USD");
          await line(tx, id, a2, 0, 4, "USD");
          await post(tx, id);
        }),
      ).rejects.toThrow(/not balanced/);
    });
    it("line with both debit and credit blocked", async () => {
      await expect(
        t.scoped([eA], async (tx) => {
          const id = await draft(tx);
          await line(tx, id, a1, 5, 5);
        }),
      ).rejects.toThrow(/one_side/);
    });
    it("line with account from other entity blocked", async () => {
      await expect(
        t.scoped([eA, eB], async (tx) => {
          const id = await draft(tx);
          await line(tx, id, accB, 5, 0);
        }),
      ).rejects.toThrow(/does not belong/);
    });
    it("post without period blocked", async () => {
      await expect(
        t.scoped([eA], async (tx) => {
          const id = (await tx`insert into journal_entries (entity_id, date) values (${eA}, now()) returning id`)[0].id;
          await line(tx, id, a1, 5, 0);
          await line(tx, id, a2, 0, 5);
          await post(tx, id);
        }),
      ).rejects.toThrow(/period is required/);
    });
    it("post in other entity's period blocked", async () => {
      await expect(
        t.scoped([eA, eB], async (tx) => {
          const id = await draft(tx, { period: perB });
          await line(tx, id, a1, 5, 0);
          await line(tx, id, a2, 0, 5);
          await post(tx, id);
        }),
      ).rejects.toThrow(/does not belong/);
    });
    it("balanced entry posts, posted_at set", async () => {
      const id = await postedEntry(50);
      const [p] = await t.owner`select status, posted_at from journal_entries where id=${id}`;
      expect(p.status).toBe("posted");
      expect(p.posted_at).toBeTruthy();
    });
  });

  describe("Immutability", () => {
    it("UPDATE posted entry blocked", async () => {
      await expect(t.scoped([eA], (tx) => tx`update journal_entries set description='x' where id=${okId}`)).rejects.toThrow(/cannot be modified/);
    });
    it("DELETE posted entry blocked (owner too)", async () => {
      await expect(t.owner`delete from journal_entries where id=${okId}`).rejects.toThrow(/cannot be deleted/);
    });
    it("INSERT line into posted entry blocked", async () => {
      await expect(t.scoped([eA], (tx) => line(tx, okId, a1, 1, 0))).rejects.toThrow(/lines are immutable/);
    });
    it("UPDATE line of posted entry blocked", async () => {
      await expect(t.scoped([eA], (tx) => tx`update journal_lines set debit=1 where entry_id=${okId} and debit>0`)).rejects.toThrow(/lines are immutable/);
    });
    it("DELETE line of posted entry blocked (owner)", async () => {
      await expect(t.owner`delete from journal_lines where entry_id=${okId}`).rejects.toThrow(/lines are immutable/);
    });
    it("cascade delete of entity with posted entries blocked", async () => {
      await expect(t.owner`delete from entities where id=${eA}`).rejects.toThrow(/cannot be deleted|immutable/);
    });
    it("TRUNCATE journal_entries blocked", async () => {
      await expect(t.owner`truncate journal_entries cascade`).rejects.toThrow(/append-only/);
    });
    it("mark posted as reversed blocked", async () => {
      await expect(t.owner`update journal_entries set status='reversed' where id=${okId}`).rejects.toThrow(/cannot be modified/);
    });
  });

  describe("Reversal / version", () => {
    it("reversal entry posts", async () => {
      const target = await postedEntry(30);
      const revId = await t.scoped([eA], async (tx) => {
        const id = (await tx`insert into journal_entries (entity_id, period_id, date, reversal_of) values (${eA},${perA},now(),${target}) returning id`)[0].id;
        await line(tx, id, a1, 0, 30);
        await line(tx, id, a2, 30, 0);
        await post(tx, id);
        return id;
      });
      expect(!!revId).toBe(true);
    });
    it("second reversal of same entry blocked", async () => {
      const target = await postedEntry(20);
      await t.scoped([eA], (tx) => tx`insert into journal_entries (entity_id, period_id, date, reversal_of) values (${eA},${perA},now(),${target})`);
      await expect(
        t.scoped([eA], (tx) => tx`insert into journal_entries (entity_id, period_id, date, reversal_of) values (${eA},${perA},now(),${target})`),
      ).rejects.toThrow(/reversal_of_uq|duplicate/);
    });
    it("reversal of a draft blocked", async () => {
      await expect(
        t.scoped([eA], async (tx) => {
          const d = await draft(tx);
          await tx`insert into journal_entries (entity_id, period_id, date, reversal_of) values (${eA},${perA},now(),${d})`;
        }),
      ).rejects.toThrow(/posted entry/);
    });
  });

  describe("Closed period", () => {
    it("post into closed period blocked", async () => {
      await expect(t.scoped([eA], async (tx) => post(tx, await closedDraft(tx)))).rejects.toThrow(/period is closed/);
    });
    it("retroactive flag without actor/reason blocked", async () => {
      await expect(
        t.scoped([eA], async (tx) => post(tx, await closedDraft(tx)), { "app.allow_retroactive": "on" }),
      ).rejects.toThrow(/requires app.actor_id/);
    });
    it("retroactive post allowed + audit event written", async () => {
      const retroId = await t.scoped(
        [eA],
        async (tx) => {
          const id = await closedDraft(tx);
          await post(tx, id);
          return id;
        },
        { "app.allow_retroactive": "on", "app.actor_id": actor, "app.retro_reason": "ajuste auditoria" },
      );
      const [aud] = await t.owner`select action, reason, target_id from audit_events where target_id=${retroId}`;
      expect(aud).toBeTruthy();
      expect(aud.action).toBe("journal_entry.post_retroactive");
      expect(aud.reason).toBe("ajuste auditoria");
    });
  });

  describe("Audit append-only", () => {
    it("audit_events UPDATE blocked", async () => {
      await expect(t.owner`update audit_events set reason='x'`).rejects.toThrow(/append-only/);
    });
    it("audit_events DELETE blocked", async () => {
      await expect(t.owner`delete from audit_events`).rejects.toThrow(/append-only/);
    });
  });

  describe("cross-entity line references (0004)", () => {
    // Written by the OWNER connection (bypasses RLS): only the trigger can stop it, FKs do not check entity.
    const ownerLine = async (col: "partner_id" | "tax_document_id" | "cost_center_id", ref: string) => {
      const id = await draft(t.owner);
      await t.owner`insert into journal_lines ${t.owner({ entry_id: id, account_id: a1, debit: 1, credit: 0, currency_code: "PYG", [col]: ref })}`;
    };
    const partnerOf = async (entity: string) =>
      (await t.owner`insert into partners (entity_id, kind, ruc, legal_name) values (${entity}, 'supplier', ${String(Math.floor(Math.random() * 1e7))}, 'P') returning id`)[0].id as string;
    it("line with a partner of another entity is rejected by the DB", async () => {
      await expect(ownerLine("partner_id", await partnerOf(eB))).rejects.toThrow(/Partner .* does not belong/);
      await expect(ownerLine("partner_id", await partnerOf(eA))).resolves.toBeUndefined();
    });
    it("line with a tax document of another entity is rejected by the DB", async () => {
      const doc = (entity: string) => t.owner`insert into tax_documents (entity_id, direction, doc_type, number, issue_date, total) values (${entity}, 'received', 'invoice', '001-001-0000001', '2026-04-01', 0) returning id`;
      await expect(ownerLine("tax_document_id", (await doc(eB))[0].id)).rejects.toThrow(/Tax document .* does not belong/);
      await expect(ownerLine("tax_document_id", (await doc(eA))[0].id)).resolves.toBeUndefined();
    });
    it("line with a cost center of another entity is rejected by the DB", async () => {
      const cc = (entity: string) => t.owner`insert into cost_centers (entity_id, code, name) values (${entity}, 'CC', 'Centro') returning id`;
      await expect(ownerLine("cost_center_id", (await cc(eB))[0].id)).rejects.toThrow(/Cost center .* does not belong/);
      await expect(ownerLine("cost_center_id", (await cc(eA))[0].id)).resolves.toBeUndefined();
    });
  });

  describe("integer money (0002)", () => {
    it("money columns are bigint; fx_rate stays numeric", async () => {
      const cols = await t.owner`select table_name, column_name, data_type from information_schema.columns
        where table_schema='public' and (table_name, column_name) in (
          ('journal_lines','debit'),('journal_lines','credit'),('journal_lines','amount_base'),('journal_lines','fx_rate'),
          ('tax_documents','total'),('tax_documents','iva_10'),('retentions','amount'),('bank_movements','amount'))`;
      const type = (tbl: string, col: string) => cols.find((c) => c.table_name === tbl && c.column_name === col)?.data_type;
      for (const [tbl, col] of [["journal_lines", "debit"], ["journal_lines", "credit"], ["journal_lines", "amount_base"],
        ["tax_documents", "total"], ["tax_documents", "iva_10"], ["retentions", "amount"], ["bank_movements", "amount"]])
        expect(type(tbl, col), `${tbl}.${col}`).toBe("bigint");
      expect(type("journal_lines", "fx_rate")).toBe("numeric");
    });
    it("nonneg / one-side CHECKs survive the type change", async () => {
      await expect(t.scoped([eA], async (tx) => line(tx, await draft(tx), a1, -5, 0))).rejects.toThrow(/journal_lines_nonneg/);
      await expect(t.scoped([eA], async (tx) => line(tx, await draft(tx), a1, 5, 5))).rejects.toThrow(/journal_lines_one_side/);
    });
  });
});
