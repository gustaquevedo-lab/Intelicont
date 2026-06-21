ALTER TABLE "accounts" ADD COLUMN "admits_fx_adjustment" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "non_deductible_ire" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD COLUMN "document_origen_id" uuid;--> statement-breakpoint
ALTER TABLE "tax_documents" ADD CONSTRAINT "tax_documents_document_origen_id_tax_documents_id_fk" FOREIGN KEY ("document_origen_id") REFERENCES "public"."tax_documents"("id") ON DELETE set null ON UPDATE no action;