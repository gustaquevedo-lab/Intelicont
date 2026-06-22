CREATE TABLE "ai_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doc_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100),
	"confidence" numeric(4, 3),
	"reasoning" text,
	"proposal_json" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bank_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"check_number" varchar(50) NOT NULL,
	"amount" numeric(20, 4) NOT NULL,
	"check_type" varchar(20) DEFAULT 'vista',
	"issue_date" timestamp with time zone DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"payee_name" text NOT NULL,
	"payment_order_id" uuid,
	"status" varchar(20) DEFAULT 'issued'
);
--> statement-breakpoint
CREATE TABLE "import_clearance_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clearance_id" uuid NOT NULL,
	"tax_document_id" uuid NOT NULL,
	"allocated_amount" numeric(20, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_clearances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"clearance_number" varchar(50) NOT NULL,
	"date" timestamp NOT NULL,
	"fob_value" numeric(20, 4) NOT NULL,
	"freight_value" numeric(20, 4) DEFAULT '0',
	"insurance_value" numeric(20, 4) DEFAULT '0',
	"customs_tax" numeric(20, 4) DEFAULT '0',
	"iva_aduana" numeric(20, 4) DEFAULT '0',
	"total_gasto_local" numeric(20, 4) DEFAULT '0',
	"status" varchar(20) DEFAULT 'draft'
);
--> statement-breakpoint
CREATE TABLE "payment_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"number" varchar(50) NOT NULL,
	"partner_id" uuid,
	"total_amount" numeric(20, 4) NOT NULL,
	"payment_method" varchar(30) NOT NULL,
	"bank_account_id" uuid,
	"journal_entry_id" uuid,
	"status" varchar(20) DEFAULT 'draft'
);
--> statement-breakpoint
CREATE TABLE "petty_cash_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reimbursement_id" uuid,
	"fund_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"partner_name" text NOT NULL,
	"partner_ruc" varchar(20) NOT NULL,
	"invoice_number" varchar(20) NOT NULL,
	"total" numeric(20, 4) NOT NULL,
	"iva_10" numeric(20, 4) DEFAULT '0',
	"iva_5" numeric(20, 4) DEFAULT '0',
	"exento" numeric(20, 4) DEFAULT '0',
	"gl_account_id" uuid
);
--> statement-breakpoint
CREATE TABLE "petty_cash_funds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"name" text NOT NULL,
	"custodian" text NOT NULL,
	"max_amount" numeric(20, 4) NOT NULL,
	"gl_account_id" uuid,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "petty_cash_reimbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fund_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"total_amount" numeric(20, 4) NOT NULL,
	"journal_entry_id" uuid,
	"status" varchar(20) DEFAULT 'pending'
);
--> statement-breakpoint
ALTER TABLE "ai_proposals" ADD CONSTRAINT "ai_proposals_doc_id_tax_documents_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."tax_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_checks" ADD CONSTRAINT "bank_checks_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_checks" ADD CONSTRAINT "bank_checks_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_checks" ADD CONSTRAINT "bank_checks_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "public"."payment_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_clearance_expenses" ADD CONSTRAINT "import_clearance_expenses_clearance_id_import_clearances_id_fk" FOREIGN KEY ("clearance_id") REFERENCES "public"."import_clearances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_clearance_expenses" ADD CONSTRAINT "import_clearance_expenses_tax_document_id_tax_documents_id_fk" FOREIGN KEY ("tax_document_id") REFERENCES "public"."tax_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_clearances" ADD CONSTRAINT "import_clearances_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_expenses" ADD CONSTRAINT "petty_cash_expenses_reimbursement_id_petty_cash_reimbursements_id_fk" FOREIGN KEY ("reimbursement_id") REFERENCES "public"."petty_cash_reimbursements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_expenses" ADD CONSTRAINT "petty_cash_expenses_fund_id_petty_cash_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."petty_cash_funds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_expenses" ADD CONSTRAINT "petty_cash_expenses_gl_account_id_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_funds" ADD CONSTRAINT "petty_cash_funds_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_funds" ADD CONSTRAINT "petty_cash_funds_gl_account_id_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash_reimbursements" ADD CONSTRAINT "petty_cash_reimbursements_fund_id_petty_cash_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."petty_cash_funds"("id") ON DELETE cascade ON UPDATE no action;