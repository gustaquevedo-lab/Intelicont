CREATE TYPE "public"."account_nature" AS ENUM('asset', 'liability', 'equity', 'income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."bank_movement_direction" AS ENUM('credit', 'debit');--> statement-breakpoint
CREATE TYPE "public"."checklist_status" AS ENUM('open', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."doc_condition" AS ENUM('cash', 'credit');--> statement-breakpoint
CREATE TYPE "public"."doc_direction" AS ENUM('issued', 'received');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('invoice', 'credit_note', 'debit_note', 'receipt', 'self_invoice', 'remito', 'import');--> statement-breakpoint
CREATE TYPE "public"."entity_status" AS ENUM('active', 'inactive', 'closed');--> statement-breakpoint
CREATE TYPE "public"."fiscal_period_status" AS ENUM('open', 'closing', 'closed', 'reopened');--> statement-breakpoint
CREATE TYPE "public"."journal_entry_status" AS ENUM('draft', 'posted', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."journal_source" AS ENUM('manual', 'sales', 'purchase', 'payment', 'collection', 'bank', 'depreciation', 'fx_adjustment', 'payroll', 'import', 'sifen');--> statement-breakpoint
CREATE TYPE "public"."partner_kind" AS ENUM('customer', 'supplier', 'both');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('pending', 'matched', 'flagged', 'manual');--> statement-breakpoint
CREATE TYPE "public"."retention_type" AS ENUM('iva', 'ire', 'irp', 'inr');--> statement-breakpoint
CREATE TYPE "public"."sifen_status" AS ENUM('pending_upload', 'uploaded', 'validated', 'rejected', 'processing');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coa_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"nature" "account_nature",
	"parent_id" uuid,
	"allows_posting" boolean DEFAULT true,
	"cost_center_required" boolean DEFAULT false,
	"tax_mappings" jsonb,
	"eef_line_id" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "ai_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" varchar(100) NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"confidence" integer,
	"accepted" boolean DEFAULT false,
	"accepted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(100) NOT NULL,
	"target_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" varchar(50) NOT NULL,
	"currency_code" varchar(3) DEFAULT 'PYG',
	"gl_account_id" uuid,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "bank_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount" numeric(20, 4) NOT NULL,
	"direction" "bank_movement_direction" NOT NULL,
	"ref" varchar(200),
	"description" text,
	"source" varchar(50) DEFAULT 'manual'
);
--> statement-breakpoint
CREATE TABLE "bank_statements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"file_ref" varchar(500),
	"parsed_at" timestamp with time zone,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "chart_of_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" varchar(50) NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closing_checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"status" "checklist_status" DEFAULT 'open',
	"items" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ruc" varchar(20) NOT NULL,
	"legal_name" text NOT NULL,
	"trade_name" text,
	"tax_regimes" text[],
	"base_currency" varchar(3) DEFAULT 'PYG' NOT NULL,
	"status" "entity_status" DEFAULT 'active',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "entities_ruc_unique" UNIQUE("ruc")
);
--> statement-breakpoint
CREATE TABLE "fiscal_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"status" "fiscal_period_status" DEFAULT 'open',
	"closed_at" timestamp with time zone,
	"closed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"period_id" uuid,
	"date" timestamp with time zone NOT NULL,
	"number" varchar(100),
	"source" "journal_source" DEFAULT 'manual',
	"source_ref" varchar(100),
	"description" text,
	"status" "journal_entry_status" DEFAULT 'draft',
	"posted_at" timestamp with time zone,
	"posted_by" uuid,
	"reversal_of" uuid,
	"version_of" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"debit" numeric(20, 4) DEFAULT '0' NOT NULL,
	"credit" numeric(20, 4) DEFAULT '0' NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"fx_rate" numeric(20, 6) DEFAULT '1',
	"amount_base" numeric(20, 4) DEFAULT '0',
	"cost_center_id" uuid,
	"partner_id" uuid,
	"tax_document_id" uuid,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" "partner_kind" NOT NULL,
	"ruc" varchar(20) NOT NULL,
	"legal_name" text NOT NULL,
	"trade_name" text,
	"contacts" jsonb,
	"default_payment_terms" integer DEFAULT 30,
	"default_account_id" uuid,
	"retention_profile" jsonb,
	"country" varchar(3) DEFAULT 'PRY',
	"dv_ruc" varchar(2),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "partners_entity_id_ruc_unique" UNIQUE("entity_id","ruc")
);
--> statement-breakpoint
CREATE TABLE "reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"gl_transaction_id" uuid,
	"bank_movement_id" uuid,
	"status" "reconciliation_status" DEFAULT 'pending',
	"score" numeric(5, 2),
	"matched_by" varchar(50) DEFAULT 'manual',
	"matched_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "retentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"retention_type" "retention_type" NOT NULL,
	"base" numeric(20, 4) NOT NULL,
	"rate" numeric(5, 2) NOT NULL,
	"amount" numeric(20, 4) NOT NULL,
	"certificate_number" varchar(100),
	"withheld_at" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_document_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"item_code" varchar(100),
	"description" text,
	"quantity" numeric(20, 4) DEFAULT '1',
	"unit_price" numeric(20, 4) NOT NULL,
	"iva_rate" integer DEFAULT 10,
	"rubro_ire" integer,
	"rubro_irp" integer,
	"inciso_iva" integer,
	"account_id" uuid,
	"amount" numeric(20, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"direction" "doc_direction" NOT NULL,
	"doc_type" "doc_type" NOT NULL,
	"number" varchar(100) NOT NULL,
	"timbrado" varchar(20),
	"cdc" varchar(44),
	"issue_date" date NOT NULL,
	"partner_id" uuid,
	"currency_code" varchar(3) DEFAULT 'PYG',
	"fx_rate" numeric(20, 6) DEFAULT '1',
	"condition" "doc_condition" DEFAULT 'credit',
	"status" varchar(50) DEFAULT 'pending',
	"sifen_status" "sifen_status" DEFAULT 'pending_upload',
	"gravado_10" numeric(20, 4) DEFAULT '0',
	"gravado_5" numeric(20, 4) DEFAULT '0',
	"exento" numeric(20, 4) DEFAULT '0',
	"iva_10" numeric(20, 4) DEFAULT '0',
	"iva_5" numeric(20, 4) DEFAULT '0',
	"total" numeric(20, 4) NOT NULL,
	"iva_book_period" uuid,
	"journal_entry_id" uuid,
	"metadata" jsonb,
	"uploaded_at" timestamp with time zone DEFAULT now(),
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_coa_id_chart_of_accounts_id_fk" FOREIGN KEY ("coa_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_decisions" ADD CONSTRAINT "ai_decisions_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_gl_account_id_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_movements" ADD CONSTRAINT "bank_movements_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statements" ADD CONSTRAINT "bank_statements_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chart_of_accounts" ADD CONSTRAINT "chart_of_accounts_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closing_checklists" ADD CONSTRAINT "closing_checklists_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "closing_checklists" ADD CONSTRAINT "closing_checklists_period_id_fiscal_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_periods" ADD CONSTRAINT "fiscal_periods_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_period_id_fiscal_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."fiscal_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_entry_id_journal_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_tax_document_id_tax_documents_id_fk" FOREIGN KEY ("tax_document_id") REFERENCES "public"."tax_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_default_account_id_accounts_id_fk" FOREIGN KEY ("default_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_bank_movement_id_bank_movements_id_fk" FOREIGN KEY ("bank_movement_id") REFERENCES "public"."bank_movements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retentions" ADD CONSTRAINT "retentions_document_id_tax_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."tax_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_document_lines" ADD CONSTRAINT "tax_document_lines_document_id_tax_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."tax_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_document_lines" ADD CONSTRAINT "tax_document_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_iva_book_period_fiscal_periods_id_fk" FOREIGN KEY ("iva_book_period") REFERENCES "public"."fiscal_periods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE set null ON UPDATE no action;