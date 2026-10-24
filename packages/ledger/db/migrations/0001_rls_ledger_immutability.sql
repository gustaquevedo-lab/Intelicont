-- Tenant isolation (RLS by entity_id) + ledger immutability + double-entry enforcement.
--
-- Tenant scope comes from the transaction-local setting `app.entity_ids`
-- (comma-separated entity UUIDs), set by the app via set_config(..., true).
-- Unset/empty scope sees nothing (fail closed). The table owner (migrations/seed)
-- is NOT forced through RLS; the runtime role must not own these tables.

-- ─── Tenant helper ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION app_entity_ids() RETURNS uuid[]
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    string_to_array(NULLIF(current_setting('app.entity_ids', true), ''), ',')::uuid[],
    ARRAY[]::uuid[]
  )
$$;
--> statement-breakpoint

-- ─── RLS: tables with entity_id ───────────────────────────────────────────

ALTER TABLE "entities" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "entities"
  USING (id = ANY (app_entity_ids()))
  WITH CHECK (id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "fiscal_periods" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "fiscal_periods"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "chart_of_accounts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "chart_of_accounts"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "cost_centers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "cost_centers"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "journal_entries" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "journal_entries"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "partners" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "partners"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "tax_documents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "tax_documents"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "bank_accounts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "bank_accounts"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "closing_checklists" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "closing_checklists"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "audit_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "audit_events"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

ALTER TABLE "ai_decisions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "ai_decisions"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

-- ─── RLS: child tables (scoped through the parent, whose RLS also applies) ─

ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "accounts"
  USING (EXISTS (SELECT 1 FROM chart_of_accounts p WHERE p.id = accounts.coa_id))
  WITH CHECK (EXISTS (SELECT 1 FROM chart_of_accounts p WHERE p.id = accounts.coa_id));
--> statement-breakpoint

ALTER TABLE "journal_lines" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "journal_lines"
  USING (EXISTS (SELECT 1 FROM journal_entries p WHERE p.id = journal_lines.entry_id))
  WITH CHECK (EXISTS (SELECT 1 FROM journal_entries p WHERE p.id = journal_lines.entry_id));
--> statement-breakpoint

ALTER TABLE "tax_document_lines" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "tax_document_lines"
  USING (EXISTS (SELECT 1 FROM tax_documents p WHERE p.id = tax_document_lines.document_id))
  WITH CHECK (EXISTS (SELECT 1 FROM tax_documents p WHERE p.id = tax_document_lines.document_id));
--> statement-breakpoint

ALTER TABLE "retentions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "retentions"
  USING (EXISTS (SELECT 1 FROM tax_documents p WHERE p.id = retentions.document_id))
  WITH CHECK (EXISTS (SELECT 1 FROM tax_documents p WHERE p.id = retentions.document_id));
--> statement-breakpoint

ALTER TABLE "bank_movements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "bank_movements"
  USING (EXISTS (SELECT 1 FROM bank_accounts p WHERE p.id = bank_movements.bank_account_id))
  WITH CHECK (EXISTS (SELECT 1 FROM bank_accounts p WHERE p.id = bank_movements.bank_account_id));
--> statement-breakpoint

ALTER TABLE "bank_statements" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "bank_statements"
  USING (EXISTS (SELECT 1 FROM bank_accounts p WHERE p.id = bank_statements.bank_account_id))
  WITH CHECK (EXISTS (SELECT 1 FROM bank_accounts p WHERE p.id = bank_statements.bank_account_id));
--> statement-breakpoint

ALTER TABLE "reconciliations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "reconciliations"
  USING (EXISTS (SELECT 1 FROM bank_accounts p WHERE p.id = reconciliations.bank_account_id))
  WITH CHECK (EXISTS (SELECT 1 FROM bank_accounts p WHERE p.id = reconciliations.bank_account_id));
--> statement-breakpoint

-- ─── Integrity constraints ────────────────────────────────────────────────

ALTER TABLE "journal_entries" ALTER COLUMN "status" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "journal_entries"
  ADD CONSTRAINT journal_entries_reversal_of_fk FOREIGN KEY (reversal_of) REFERENCES journal_entries (id),
  ADD CONSTRAINT journal_entries_version_of_fk FOREIGN KEY (version_of) REFERENCES journal_entries (id),
  ADD CONSTRAINT journal_entries_reversal_xor_version CHECK (reversal_of IS NULL OR version_of IS NULL);
--> statement-breakpoint
-- An entry can be reversed at most once.
CREATE UNIQUE INDEX journal_entries_reversal_of_uq ON journal_entries (reversal_of) WHERE reversal_of IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "journal_lines"
  ADD CONSTRAINT journal_lines_nonneg CHECK (debit >= 0 AND credit >= 0),
  ADD CONSTRAINT journal_lines_one_side CHECK (debit = 0 OR credit = 0);
--> statement-breakpoint

-- ─── journal_entries: immutability + posting validation ───────────────────

CREATE OR REPLACE FUNCTION journal_entries_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  ref_id uuid;
  ref_entity uuid;
  ref_status journal_entry_status;
  p_entity uuid;
  p_status fiscal_period_status;
  n_lines int;
  n_unbalanced int;
  n_no_posting int;
  actor text;
  why text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status IN ('posted', 'reversed') THEN
      RAISE EXCEPTION 'Journal entry % is % and cannot be deleted: the ledger is immutable', OLD.id, OLD.status
        USING ERRCODE = 'restrict_violation';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('posted', 'reversed') THEN
      RAISE EXCEPTION 'Journal entry % is % and cannot be modified: post a reversal (reversal_of) or an adjustment (version_of)', OLD.id, OLD.status
        USING ERRCODE = 'restrict_violation';
    END IF;
    IF NEW.status = 'reversed' THEN
      RAISE EXCEPTION 'Entries are never flagged as reversed; a reversal is a new entry with reversal_of'
        USING ERRCODE = 'restrict_violation';
    END IF;
    IF NEW.entity_id <> OLD.entity_id THEN
      RAISE EXCEPTION 'Journal entry % cannot change entity', OLD.id USING ERRCODE = 'restrict_violation';
    END IF;
  ELSE
    -- INSERT: entries are born as drafts; lines are added; then the entry is posted.
    IF NEW.status <> 'draft' THEN
      RAISE EXCEPTION 'Journal entries must be inserted as draft and posted after their lines exist'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- reversal_of / version_of must point to a posted entry of the same entity.
  FOREACH ref_id IN ARRAY ARRAY[NEW.reversal_of, NEW.version_of] LOOP
    IF ref_id IS NOT NULL THEN
      SELECT entity_id, status INTO ref_entity, ref_status FROM journal_entries WHERE id = ref_id;
      IF ref_entity IS DISTINCT FROM NEW.entity_id OR ref_status IS DISTINCT FROM 'posted' THEN
        RAISE EXCEPTION 'reversal_of/version_of % must reference a posted entry of the same entity', ref_id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END LOOP;

  IF NEW.status = 'posted' THEN
    -- Fiscal period: required, same entity, not closed (unless retroactive + audited).
    IF NEW.period_id IS NULL THEN
      RAISE EXCEPTION 'A fiscal period is required to post journal entry %', NEW.id USING ERRCODE = 'check_violation';
    END IF;
    SELECT entity_id, status INTO p_entity, p_status FROM fiscal_periods WHERE id = NEW.period_id;
    IF p_entity IS DISTINCT FROM NEW.entity_id THEN
      RAISE EXCEPTION 'Fiscal period does not belong to the entry entity' USING ERRCODE = 'check_violation';
    END IF;
    IF p_status = 'closed' THEN
      IF COALESCE(current_setting('app.allow_retroactive', true), '') <> 'on' THEN
        RAISE EXCEPTION 'Fiscal period is closed: cannot post journal entry %', NEW.id USING ERRCODE = 'check_violation';
      END IF;
      actor := NULLIF(current_setting('app.actor_id', true), '');
      why := NULLIF(current_setting('app.retro_reason', true), '');
      IF actor IS NULL OR why IS NULL THEN
        RAISE EXCEPTION 'Retroactive posting requires app.actor_id and app.retro_reason for the audit trail'
          USING ERRCODE = 'check_violation';
      END IF;
      INSERT INTO audit_events (entity_id, actor_id, action, target_type, target_id, after, reason)
      VALUES (NEW.entity_id, actor::uuid, 'journal_entry.post_retroactive', 'journal_entry', NEW.id,
              jsonb_build_object('period_id', NEW.period_id), why);
    END IF;

    -- Double entry: >= 2 lines, debit = credit per currency, non-zero.
    SELECT count(*) INTO n_lines FROM journal_lines WHERE entry_id = NEW.id;
    IF n_lines < 2 THEN
      RAISE EXCEPTION 'Journal entry % needs at least 2 lines to be posted', NEW.id USING ERRCODE = 'check_violation';
    END IF;
    SELECT count(*) INTO n_unbalanced FROM (
      SELECT currency_code FROM journal_lines WHERE entry_id = NEW.id
      GROUP BY currency_code
      HAVING sum(debit) <> sum(credit) OR sum(debit) = 0
    ) s;
    IF n_unbalanced > 0 THEN
      RAISE EXCEPTION 'Journal entry % is not balanced (debit <> credit) in at least one currency', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
    SELECT count(*) INTO n_no_posting
      FROM journal_lines l JOIN accounts a ON a.id = l.account_id
      WHERE l.entry_id = NEW.id AND a.allows_posting IS NOT TRUE;
    IF n_no_posting > 0 THEN
      RAISE EXCEPTION 'Journal entry % uses accounts that do not allow posting', NEW.id USING ERRCODE = 'check_violation';
    END IF;

    NEW.posted_at := COALESCE(NEW.posted_at, now());
  END IF;

  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER journal_entries_guard
  BEFORE INSERT OR UPDATE OR DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION journal_entries_guard();
--> statement-breakpoint

-- ─── journal_lines: only editable while the entry is a draft ──────────────

CREATE OR REPLACE FUNCTION journal_lines_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  e_id uuid;
  e_status journal_entry_status;
  e_entity uuid;
  a_entity uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.entry_id <> OLD.entry_id THEN
    RAISE EXCEPTION 'A journal line cannot move to another entry' USING ERRCODE = 'restrict_violation';
  END IF;

  e_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.entry_id ELSE NEW.entry_id END;
  SELECT status, entity_id INTO e_status, e_entity FROM journal_entries WHERE id = e_id;

  -- Parent not visible: being cascade-deleted, or FK will reject the insert.
  IF e_status IS NULL THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF e_status <> 'draft' THEN
    RAISE EXCEPTION 'Journal entry % is % : its lines are immutable', e_id, e_status
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF TG_OP <> 'DELETE' THEN
    SELECT c.entity_id INTO a_entity
      FROM accounts a JOIN chart_of_accounts c ON c.id = a.coa_id
      WHERE a.id = NEW.account_id;
    IF a_entity IS DISTINCT FROM e_entity THEN
      RAISE EXCEPTION 'Account % does not belong to the entity of journal entry %', NEW.account_id, e_id
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER journal_lines_guard
  BEFORE INSERT OR UPDATE OR DELETE ON journal_lines
  FOR EACH ROW EXECUTE FUNCTION journal_lines_guard();
--> statement-breakpoint

-- ─── Append-only: audit_events, and no TRUNCATE of the ledger ─────────────

CREATE OR REPLACE FUNCTION append_only_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not allowed', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION append_only_guard();
--> statement-breakpoint
CREATE TRIGGER audit_events_no_truncate
  BEFORE TRUNCATE ON audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION append_only_guard();
--> statement-breakpoint
CREATE TRIGGER journal_entries_no_truncate
  BEFORE TRUNCATE ON journal_entries
  FOR EACH STATEMENT EXECUTE FUNCTION append_only_guard();
--> statement-breakpoint
CREATE TRIGGER journal_lines_no_truncate
  BEFORE TRUNCATE ON journal_lines
  FOR EACH STATEMENT EXECUTE FUNCTION append_only_guard();
