CREATE TYPE "public"."tenant_type" AS ENUM('STUDIO', 'TAXPAYER');--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "tenant_type" "tenant_type" DEFAULT 'TAXPAYER' NOT NULL;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "studio_id" uuid;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_studio_id_entities_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."entities"("id") ON DELETE set null ON UPDATE no action;