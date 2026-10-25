CREATE TABLE "copilot_conversaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid NOT NULL,
	"user_id" uuid,
	"titulo" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "copilot_mensajes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversacion_id" uuid NOT NULL,
	"rol" varchar(20) NOT NULL,
	"contenido" text NOT NULL,
	"contexto_usado" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "copilot_conversaciones" ADD CONSTRAINT "copilot_conversaciones_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_conversaciones" ADD CONSTRAINT "copilot_conversaciones_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "copilot_mensajes" ADD CONSTRAINT "copilot_mensajes_conversacion_id_copilot_conversaciones_id_fk" FOREIGN KEY ("conversacion_id") REFERENCES "public"."copilot_conversaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "copilot_conversaciones_entity_id_idx" ON "copilot_conversaciones" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "copilot_mensajes_conversacion_id_idx" ON "copilot_mensajes" USING btree ("conversacion_id");