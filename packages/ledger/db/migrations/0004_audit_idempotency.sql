-- Idempotency keys (D4) + journal_lines_guard hardening (cross-entity line references).
--
-- APPLY NOTE: migrations never name roles. After migrating the real DB, if the runtime role has no
-- default privileges on new tables, run once:
--   GRANT SELECT, INSERT, UPDATE ON idempotency_keys TO <runtime role>;
-- idempotency_keys has no entity column: it is user-scoped (app_user_id()), like memberships.
CREATE TABLE "idempotency_keys" (
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"key" text NOT NULL,
	"request_hash" text NOT NULL,
	"response" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "idempotency_keys_user_id_endpoint_key_pk" PRIMARY KEY("user_id","endpoint","key")
);
--> statement-breakpoint
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "idempotency_keys" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY user_isolation ON "idempotency_keys" FOR ALL
  USING (user_id = app_user_id()) WITH CHECK (user_id = app_user_id());
--> statement-breakpoint

-- journal_lines_guard: same rules as 0001, plus partner / tax document / cost center of the line must
-- belong to the entry's entity. FKs bypass RLS, so without this a line could point at another tenant's row.
-- Invoker rights: under RLS a foreign row is invisible (NULL entity) and is rejected the same way.
CREATE OR REPLACE FUNCTION journal_lines_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  e_id uuid;
  e_status journal_entry_status;
  e_entity uuid;
  a_entity uuid;
  r_entity uuid;
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

    IF NEW.partner_id IS NOT NULL THEN
      SELECT entity_id INTO r_entity FROM partners WHERE id = NEW.partner_id;
      IF r_entity IS DISTINCT FROM e_entity THEN
        RAISE EXCEPTION 'Partner % does not belong to the entity of journal entry %', NEW.partner_id, e_id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;

    IF NEW.tax_document_id IS NOT NULL THEN
      SELECT entity_id INTO r_entity FROM tax_documents WHERE id = NEW.tax_document_id;
      IF r_entity IS DISTINCT FROM e_entity THEN
        RAISE EXCEPTION 'Tax document % does not belong to the entity of journal entry %', NEW.tax_document_id, e_id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;

    IF NEW.cost_center_id IS NOT NULL THEN
      SELECT entity_id INTO r_entity FROM cost_centers WHERE id = NEW.cost_center_id;
      IF r_entity IS DISTINCT FROM e_entity THEN
        RAISE EXCEPTION 'Cost center % does not belong to the entity of journal entry %', NEW.cost_center_id, e_id
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$;
