CREATE TYPE "public"."membership_role" AS ENUM('admin', 'accountant', 'assistant', 'auditor', 'client');--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"entity_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'accountant' NOT NULL,
	"invited_by" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "memberships_user_entity_unique" UNIQUE("user_id","entity_id")
);
--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memberships_entity_id_idx" ON "memberships" USING btree ("entity_id");