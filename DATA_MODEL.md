# Modelo de datos — InteliCont

snake_case en DB. UUIDs. timestamptz. Money: numeric(20,4) + currency_code char(3).

## Núcleo

### entities
id, group_id?, ruc unique, legal_name, trade_name, tax_regimes text[] (IVA_GRAL, IRE_GRAL, IRE_SIMPLE, IRE_RESIMPLE, IRP, INR, IDU, EXPORTADOR), base_currency default PYG, created_at, updated_at.

### fiscal_periods
id, entity_id, year, month, status (open, closing, closed, reopened), closed_at, closed_by.

### chart_of_accounts
id, entity_id, kind (fiscal_py, niif, eef, mgmt), name.

### accounts
id, coa_id, code, name, nature (asset/liability/equity/income/expense), parent_id?, allows_posting, cost_center_required, tax_mappings jsonb, eef_line_id?.

### journal_entries (INMUTABLE posteado)
id, entity_id, period_id, date, number, source (manual/sales/purchase/payment/collection/bank/depreciation/fx_adjustment/payroll/import), source_ref, description, status (draft/posted/reversed), posted_at, posted_by, reversal_of?, version_of?, metadata jsonb.

### journal_lines
id, entry_id, account_id, debit, credit, currency_code, fx_rate, amount_base, cost_center_id?, partner_id?, tax_document_id?, description.

INVARIANTE: por entry_id, sum(debit) == sum(credit) por moneda y por moneda base.

## Fiscal

### tax_documents
id, entity_id, direction (issued/received), doc_type (invoice/credit_note/debit_note/receipt/self_invoice/remito/import), number, timbrado, cdc, issue_date, partner_id, currency_code, fx_rate, condition (cash/credit), status, sifen_status, totals (gravado_10/gravado_5/exento/iva_10/iva_5/total), iva_book_period?, journal_entry_id?.

### tax_document_lines
id, document_id, item_code, description, quantity, unit_price, iva_rate, rubro_ire, rubro_irp, inciso_iva, account_id, amount.

### retentions
id, document_id, retention_type (iva/ire/irp/inr), base, rate, amount, certificate_number, withheld_at.

### partners
id, entity_id, kind (customer/supplier/both), ruc, legal_name, trade_name, contacts jsonb, default_payment_terms, default_account_id, retention_profile, country.

## Bancos
bank_accounts (id, entity_id, bank, account_number, currency, gl_account_id).
bank_movements (id, account_id, date, amount, direction, ref, description, source).
bank_statements (id, account_id, period, file_ref, parsed_at).
reconciliations (id, account_id, gl_movement_id, bank_movement_id, status, score, matched_by, matched_at).

## Activos fijos
fixed_assets (id, entity_id, code, name, category, purchase_doc_id, purchase_date, cost, residual, life_months, method, status).
depreciation_schedules (id, asset_id, period_id, amount, journal_entry_id).
asset_revaluations (id, asset_id, date, coefficient, new_cost).

## Ops
closing_checklists (id, entity_id, period_id, status, items jsonb).
audit_events (id, entity_id, actor_id, action, target_type, target_id, before, after, reason, created_at).
ai_decisions (id, entity_id, kind, input, output, confidence, accepted, accepted_by, created_at).

## Usuarios
Supabase Auth + profiles. memberships (user_id, entity_id, role: admin/accountant/assistant/auditor/client, permissions jsonb).
