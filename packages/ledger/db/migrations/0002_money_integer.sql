-- Money is an integer in the currency's minor unit (spec D6). fx_rate and quantity stay numeric.
-- journal_lines_nonneg / journal_lines_one_side CHECKs and the balance triggers (sum(debit) <> sum(credit))
-- keep working unchanged on bigint.
ALTER TABLE journal_lines
  ALTER COLUMN debit DROP DEFAULT,
  ALTER COLUMN credit DROP DEFAULT,
  ALTER COLUMN amount_base DROP DEFAULT;
ALTER TABLE journal_lines
  ALTER COLUMN debit TYPE bigint USING round(debit)::bigint,
  ALTER COLUMN credit TYPE bigint USING round(credit)::bigint,
  ALTER COLUMN amount_base TYPE bigint USING round(amount_base)::bigint;
ALTER TABLE journal_lines
  ALTER COLUMN debit SET DEFAULT 0,
  ALTER COLUMN credit SET DEFAULT 0,
  ALTER COLUMN amount_base SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE tax_documents
  ALTER COLUMN gravado_10 DROP DEFAULT,
  ALTER COLUMN gravado_5 DROP DEFAULT,
  ALTER COLUMN exento DROP DEFAULT,
  ALTER COLUMN iva_10 DROP DEFAULT,
  ALTER COLUMN iva_5 DROP DEFAULT;
ALTER TABLE tax_documents
  ALTER COLUMN gravado_10 TYPE bigint USING round(gravado_10)::bigint,
  ALTER COLUMN gravado_5 TYPE bigint USING round(gravado_5)::bigint,
  ALTER COLUMN exento TYPE bigint USING round(exento)::bigint,
  ALTER COLUMN iva_10 TYPE bigint USING round(iva_10)::bigint,
  ALTER COLUMN iva_5 TYPE bigint USING round(iva_5)::bigint,
  ALTER COLUMN total TYPE bigint USING round(total)::bigint;
ALTER TABLE tax_documents
  ALTER COLUMN gravado_10 SET DEFAULT 0,
  ALTER COLUMN gravado_5 SET DEFAULT 0,
  ALTER COLUMN exento SET DEFAULT 0,
  ALTER COLUMN iva_10 SET DEFAULT 0,
  ALTER COLUMN iva_5 SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE tax_document_lines
  ALTER COLUMN unit_price TYPE bigint USING round(unit_price)::bigint,
  ALTER COLUMN amount TYPE bigint USING round(amount)::bigint;
--> statement-breakpoint
ALTER TABLE retentions
  ALTER COLUMN base TYPE bigint USING round(base)::bigint,
  ALTER COLUMN amount TYPE bigint USING round(amount)::bigint;
--> statement-breakpoint
ALTER TABLE bank_movements
  ALTER COLUMN amount TYPE bigint USING round(amount)::bigint;
