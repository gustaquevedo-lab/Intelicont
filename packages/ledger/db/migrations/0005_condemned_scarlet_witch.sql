CREATE TYPE "public"."entity_type" AS ENUM('COMMERCIAL', 'NON_PROFIT_NGO', 'NON_PROFIT_PUBLIC', 'ASSOCIATION');--> statement-breakpoint
CREATE TABLE "global_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"donor_name" text NOT NULL,
	"grant_code" varchar(50),
	"total_budget" numeric(20, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'PYG' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount" numeric(20, 4) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"receipt_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pgn_expense_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"group_code" varchar(20) NOT NULL,
	CONSTRAINT "pgn_expense_objects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" varchar(50) NOT NULL,
	"budget" numeric(20, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"number" varchar(100) NOT NULL,
	"issue_date" date NOT NULL,
	"total" numeric(20, 4) NOT NULL,
	"partner_ruc" varchar(20) NOT NULL,
	"partner_name" text NOT NULL,
	"payment_method" varchar(30) NOT NULL,
	"bank_account_id" uuid,
	"journal_entry_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"active_entity_id" uuid,
	"user_agent" text,
	"ip_address" varchar(45),
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"name" text,
	"avatar_url" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"magic_token" text,
	"magic_token_expires_at" timestamp with time zone,
	"reset_token" text,
	"reset_token_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "actor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_events" ALTER COLUMN "target_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "entity_type" "entity_type" DEFAULT 'COMMERCIAL';--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "plan" varchar(50) DEFAULT 'starter' NOT NULL;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "features" jsonb DEFAULT '{"sifenSync":true,"aiTripleImputation":true,"cgrReports":false}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "mrr" integer DEFAULT 180000 NOT NULL;--> statement-breakpoint
ALTER TABLE "grants" ADD CONSTRAINT "grants_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_document_id_tax_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."tax_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_grant_id_grants_id_fk" FOREIGN KEY ("grant_id") REFERENCES "public"."grants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");