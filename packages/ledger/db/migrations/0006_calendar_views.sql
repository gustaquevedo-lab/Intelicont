-- Books as SQL views over the base (D11): Libro Diario, Libro Mayor and Libro IVA, with drill-down ids.
-- SECURITY: a view runs with its OWNER's privileges by default and the owner (migrator) bypasses RLS, so
-- every view here is `security_invoker = true` (PG >= 15): the caller's RLS on the base tables applies.
-- entry_date: journal_entries.date stores the Asunción calendar date as UTC midnight (see todayInAsuncion
-- and the use cases: `new Date("YYYY-MM-DD")`), so the calendar date is read back at UTC.
--
-- APPLY NOTE: migrations never name roles. After migrating the real DB, if the runtime role has no
-- default privileges on new relations, run once:
--   GRANT SELECT ON v_diario, v_mayor, v_libro_iva TO <runtime role>;
CREATE VIEW v_diario WITH (security_invoker = true) AS
SELECT
  je.entity_id,
  je.id AS entry_id,
  jl.id AS line_id,
  je.number AS entry_number,
  (je.date AT TIME ZONE 'UTC')::date AS entry_date,
  je.posted_at,
  je.source,
  je.description AS entry_description,
  jl.account_id,
  a.code AS account_code,
  a.name AS account_name,
  jl.debit,
  jl.credit,
  jl.currency_code,
  jl.description AS line_description,
  jl.partner_id,
  jl.tax_document_id,
  je.reversal_of
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.entry_id
JOIN accounts a ON a.id = jl.account_id
WHERE je.status = 'posted';
--> statement-breakpoint
-- Running balance over the whole history, so a date filter applied afterwards keeps the carried balance.
CREATE VIEW v_mayor WITH (security_invoker = true) AS
SELECT
  d.*,
  a.nature,
  sum(d.debit - d.credit) OVER (
    PARTITION BY d.entity_id, d.account_id, d.currency_code
    ORDER BY d.entry_date, d.entry_number, d.line_id
  ) AS balance
FROM v_diario d
JOIN accounts a ON a.id = d.account_id;
--> statement-breakpoint
-- Amounts are the stored (unsigned) values; reports apply `sign` (-1 for credit notes).
-- total_only: Tabla 4 codes registered by total only (101, 104, 105, 112) without a gravado/exento split.
CREATE VIEW v_libro_iva WITH (security_invoker = true) AS
SELECT
  td.entity_id,
  td.id AS document_id,
  td.journal_entry_id AS entry_id,
  CASE td.direction WHEN 'issued' THEN 'ventas' ELSE 'compras' END AS side,
  td.issue_date,
  extract(year FROM td.issue_date)::int AS year,
  extract(month FROM td.issue_date)::int AS month,
  td.doc_code,
  td.doc_type,
  td.number,
  td.timbrado,
  td.cdc,
  CASE WHEN p.dv_ruc IS NULL THEN p.ruc ELSE p.ruc || '-' || p.dv_ruc END AS counterparty_ruc,
  p.legal_name AS counterparty_name,
  coalesce(td.gravado_10, 0) AS gravado10,
  coalesce(td.gravado_5, 0) AS gravado5,
  coalesce(td.exento, 0) AS exento,
  coalesce(td.iva_10, 0) AS iva10,
  coalesce(td.iva_5, 0) AS iva5,
  td.total,
  CASE WHEN td.doc_type = 'credit_note' OR td.doc_code = 110 THEN -1 ELSE 1 END AS sign,
  td.is_electronic,
  (coalesce(td.doc_code, 0) IN (101, 104, 105, 112)
    AND coalesce(td.gravado_10, 0) = 0 AND coalesce(td.gravado_5, 0) = 0 AND coalesce(td.exento, 0) = 0
    AND td.total > 0) AS total_only
FROM tax_documents td
LEFT JOIN partners p ON p.id = td.partner_id
WHERE td.imputa_iva;
