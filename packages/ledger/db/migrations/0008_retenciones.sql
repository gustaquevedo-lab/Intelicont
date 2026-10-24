CREATE TABLE IF NOT EXISTS "retenciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL REFERENCES "entities"("id") ON DELETE cascade,
	"periodo_year" integer NOT NULL,
	"periodo_month" integer NOT NULL,
	"fecha" timestamp with time zone NOT NULL,
	"tercero_ruc" varchar(20) NOT NULL,
	"tercero_nombre" text NOT NULL,
	"doc_tipo" varchar(30) DEFAULT 'factura',
	"doc_numero" varchar(20),
	"monto_base" bigint NOT NULL,
	"tipo_retencion" varchar(50) NOT NULL,
	"tasa" numeric(6, 4) NOT NULL,
	"monto_retencion" bigint NOT NULL,
	"comprobante_ret" varchar(20),
	"status" varchar(20) DEFAULT 'borrador',
	"tax_document_id" uuid REFERENCES "tax_documents"("id") ON DELETE set null,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "retenciones" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'retenciones' AND policyname = 'retenciones_tenant_isolation'
  ) THEN
    CREATE POLICY "retenciones_tenant_isolation" ON "retenciones"
      AS RESTRICTIVE
      USING ("entity_id"::text = ANY (string_to_array(nullif(current_setting('app.entity_ids', true), ''), ',')));
  END IF;
END $$;
