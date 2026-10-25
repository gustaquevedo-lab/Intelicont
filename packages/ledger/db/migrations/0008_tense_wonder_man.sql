CREATE TABLE "errores_plataforma" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fingerprint" varchar(64) NOT NULL,
	"tipo_error" varchar(100) NOT NULL,
	"mensaje" text NOT NULL,
	"path" varchar(500) NOT NULL,
	"metodo" varchar(10) NOT NULL,
	"status_code" integer DEFAULT 500 NOT NULL,
	"stacktrace" text NOT NULL,
	"contexto_json" text,
	"entity_id" uuid,
	"usuario_email" varchar(200),
	"ocurrencias" integer DEFAULT 1 NOT NULL,
	"primera_vez" timestamp with time zone DEFAULT now() NOT NULL,
	"ultima_vez" timestamp with time zone DEFAULT now() NOT NULL,
	"resuelto" boolean DEFAULT false NOT NULL,
	"resuelto_en" timestamp with time zone,
	"notas_resolucion" text
);
--> statement-breakpoint
CREATE TABLE "retenciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
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
	"tax_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "plan" varchar(50) DEFAULT 'starter';--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "features_override_json" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "debe_cambiar_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "errores_plataforma" ADD CONSTRAINT "errores_plataforma_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retenciones" ADD CONSTRAINT "retenciones_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retenciones" ADD CONSTRAINT "retenciones_tax_document_id_tax_documents_id_fk" FOREIGN KEY ("tax_document_id") REFERENCES "public"."tax_documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "errores_plataforma_fingerprint_idx" ON "errores_plataforma" USING btree ("fingerprint");--> statement-breakpoint
CREATE INDEX "errores_plataforma_resuelto_idx" ON "errores_plataforma" USING btree ("resuelto");