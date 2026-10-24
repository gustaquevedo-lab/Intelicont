-- Persisted fiscal calendar (W10): one row per entity/obligation/period with its due date.
-- obligation: '104' Formulario IVA mensual, '955' Registro de Comprobantes mensual (period 'YYYY-MM');
-- '956' (anual, period 'YYYY') is allowed but not generated in the slice.
-- source 'rule' = computed by @intelicont/ledger/tax-calendar (UNVERIFIED RUC-termination formula).
--
-- APPLY NOTE: migrations never name roles. After migrating the real DB, if the runtime role has no
-- default privileges on new tables, run once:
--   GRANT SELECT, INSERT, UPDATE ON tax_calendar TO <runtime role>;
CREATE TABLE "tax_calendar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"obligation" text NOT NULL,
	"period" text NOT NULL,
	"due_date" date NOT NULL,
	"source" text DEFAULT 'rule' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "tax_calendar_entity_obligation_period_uq" UNIQUE("entity_id","obligation","period"),
	CONSTRAINT "tax_calendar_obligation_check" CHECK ("tax_calendar"."obligation" IN ('104','955','956'))
);
--> statement-breakpoint
ALTER TABLE "tax_calendar" ADD CONSTRAINT "tax_calendar_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint

ALTER TABLE "tax_calendar" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "tax_calendar"
  USING (entity_id = ANY (app_entity_ids()))
  WITH CHECK (entity_id = ANY (app_entity_ids()));
