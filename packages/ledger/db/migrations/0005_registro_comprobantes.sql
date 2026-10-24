-- Registro de Comprobantes columns on tax_documents + timbrados (D8, D9).
-- journal_entries.status NOT NULL and the reversal_of/version_of FKs already exist in the DB (0001);
-- schema.ts was only synced to them, so they are not repeated here.
--
-- APPLY NOTE: migrations never name roles. After migrating the real DB, if the runtime role has no
-- default privileges on new tables, run once:
--   GRANT SELECT, INSERT, UPDATE ON timbrados TO <runtime role>;
CREATE TABLE "timbrados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"partner_id" uuid,
	"number" varchar(8) NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date NOT NULL,
	"establishment" varchar(3) NOT NULL,
	"point" varchar(3) NOT NULL,
	"doc_code" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "timbrados_entity_number_est_point_code_uq" UNIQUE("entity_id","number","establishment","point","doc_code"),
	CONSTRAINT "timbrados_doc_code_check" CHECK (doc_code IN (101,102,103,104,105,106,107,108,109,110,111,112,201,202,203,204,205,206,207,208,209,210,211)),
	CONSTRAINT "timbrados_valid_range_check" CHECK ("timbrados"."valid_to" >= "timbrados"."valid_from")
);
--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "doc_code" integer;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "counterparty_id_type" integer;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "imputa_iva" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "imputa_ire" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "imputa_irp" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "no_imputa" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "foreign_currency" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "related_number" varchar(20);--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "related_timbrado" varchar(8);--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "is_electronic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "timbrados" ADD CONSTRAINT "timbrados_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timbrados" ADD CONSTRAINT "timbrados_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tax_documents_entity_cdc_uq" ON "tax_documents" USING btree ("entity_id","cdc") WHERE "tax_documents"."cdc" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_doc_code_check" CHECK (doc_code IS NULL OR doc_code IN (101,102,103,104,105,106,107,108,109,110,111,112,201,202,203,204,205,206,207,208,209,210,211));--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_counterparty_id_type_check" CHECK ("tax_documents"."counterparty_id_type" IS NULL OR "tax_documents"."counterparty_id_type" BETWEEN 11 AND 17);
--> statement-breakpoint

ALTER TABLE "timbrados" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "timbrados"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
--> statement-breakpoint

-- FKs bypass RLS, so a row could point at another tenant's data. These guards (invoker rights: a foreign
-- row is invisible under RLS and is rejected the same way) require same-entity references.
CREATE OR REPLACE FUNCTION tax_documents_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  r_entity uuid;
BEGIN
  IF NEW.partner_id IS NOT NULL THEN
    SELECT entity_id INTO r_entity FROM partners WHERE id = NEW.partner_id;
    IF r_entity IS DISTINCT FROM NEW.entity_id THEN
      RAISE EXCEPTION 'Partner % does not belong to the entity of the tax document', NEW.partner_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.journal_entry_id IS NOT NULL THEN
    SELECT entity_id INTO r_entity FROM journal_entries WHERE id = NEW.journal_entry_id;
    IF r_entity IS DISTINCT FROM NEW.entity_id THEN
      RAISE EXCEPTION 'Journal entry % does not belong to the entity of the tax document', NEW.journal_entry_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  IF NEW.iva_book_period IS NOT NULL THEN
    SELECT entity_id INTO r_entity FROM fiscal_periods WHERE id = NEW.iva_book_period;
    IF r_entity IS DISTINCT FROM NEW.entity_id THEN
      RAISE EXCEPTION 'Fiscal period % does not belong to the entity of the tax document', NEW.iva_book_period
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER tax_documents_guard BEFORE INSERT OR UPDATE ON tax_documents
  FOR EACH ROW EXECUTE FUNCTION tax_documents_guard();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION timbrados_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  r_entity uuid;
BEGIN
  IF NEW.partner_id IS NOT NULL THEN
    SELECT entity_id INTO r_entity FROM partners WHERE id = NEW.partner_id;
    IF r_entity IS DISTINCT FROM NEW.entity_id THEN
      RAISE EXCEPTION 'Partner % does not belong to the entity of the timbrado', NEW.partner_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER timbrados_guard BEFORE INSERT OR UPDATE ON timbrados
  FOR EACH ROW EXECUTE FUNCTION timbrados_guard();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION tax_document_lines_guard() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  d_entity uuid;
  a_entity uuid;
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    SELECT entity_id INTO d_entity FROM tax_documents WHERE id = NEW.document_id;
    SELECT c.entity_id INTO a_entity
      FROM accounts a JOIN chart_of_accounts c ON c.id = a.coa_id
      WHERE a.id = NEW.account_id;
    IF a_entity IS DISTINCT FROM d_entity THEN
      RAISE EXCEPTION 'Account % does not belong to the entity of tax document %', NEW.account_id, NEW.document_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER tax_document_lines_guard BEFORE INSERT OR UPDATE ON tax_document_lines
  FOR EACH ROW EXECUTE FUNCTION tax_document_lines_guard();
