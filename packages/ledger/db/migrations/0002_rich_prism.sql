CREATE TABLE "fixed_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"tax_document_id" uuid,
	"code" varchar(50) NOT NULL,
	"name" text NOT NULL,
	"serial_number" varchar(100),
	"adquisition_date" date NOT NULL,
	"cost_value" numeric(20, 4) NOT NULL,
	"useful_life_months" integer NOT NULL,
	"depreciated_value" numeric(20, 4) DEFAULT '0',
	"gl_account_id" uuid,
	"depreciation_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"sku" varchar(50),
	"stock_actual" numeric(20, 4) DEFAULT '0' NOT NULL,
	"costo_promedio" numeric(20, 4) DEFAULT '0' NOT NULL,
	"gl_account_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stock_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"tax_document_id" uuid,
	"type" varchar(20) NOT NULL,
	"quantity" numeric(20, 4) NOT NULL,
	"unit_price" numeric(20, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "ai_provider" varchar(50) DEFAULT 'gemini' NOT NULL;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "ai_api_key" text;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_tax_document_id_tax_documents_id_fk" FOREIGN KEY ("tax_document_id") REFERENCES "public"."tax_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_gl_account_id_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fixed_assets" ADD CONSTRAINT "fixed_assets_depreciation_account_id_accounts_id_fk" FOREIGN KEY ("depreciation_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_gl_account_id_accounts_id_fk" FOREIGN KEY ("gl_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transactions" ADD CONSTRAINT "stock_transactions_tax_document_id_tax_documents_id_fk" FOREIGN KEY ("tax_document_id") REFERENCES "public"."tax_documents"("id") ON DELETE set null ON UPDATE no action;