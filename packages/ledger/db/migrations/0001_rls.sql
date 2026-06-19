-- RLS Policies for InteliCont
-- Multi-tenant isolation by entity_id
-- Run after initial schema migration

-- 1. Helper function: get current entity_id from session variable
-- The middleware sets 'app.entity_id' via set_config() on each request
CREATE OR REPLACE FUNCTION public.get_current_entity_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN NULLIF(current_setting('app.entity_id', true), '')::uuid;
END;
$$;

-- 1b. Helper: set entity context for RLS (called via RPC from Server Actions)
CREATE OR REPLACE FUNCTION public.set_entity_context(entity_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.entity_id', entity_uuid::text, true);
END;
$$;

-- 2. Helper: check if user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true) IS NOT NULL
      OR auth.role() = 'authenticated';
END;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- TABLES WITH DIRECT entity_id
-- ════════════════════════════════════════════════════════════════════════════

-- entities table is special: users see entities they have access to
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY entities_select ON entities FOR SELECT USING (
  is_authenticated()
);
CREATE POLICY entities_insert ON entities FOR INSERT WITH CHECK (
  is_authenticated()
);
CREATE POLICY entities_update ON entities FOR UPDATE USING (
  is_authenticated()
);

-- fiscal_periods
ALTER TABLE fiscal_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY fiscal_periods_select ON fiscal_periods FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY fiscal_periods_insert ON fiscal_periods FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY fiscal_periods_update ON fiscal_periods FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY fiscal_periods_delete ON fiscal_periods FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- chart_of_accounts
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY coa_select ON chart_of_accounts FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY coa_insert ON chart_of_accounts FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY coa_update ON chart_of_accounts FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY coa_delete ON chart_of_accounts FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- accounts (through coa relationship)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY accounts_select ON accounts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chart_of_accounts coa
    WHERE coa.id = accounts.coa_id
    AND coa.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY accounts_insert ON accounts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM chart_of_accounts coa
    WHERE coa.id = accounts.coa_id
    AND coa.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY accounts_update ON accounts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM chart_of_accounts coa
    WHERE coa.id = accounts.coa_id
    AND coa.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY accounts_delete ON accounts FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM chart_of_accounts coa
    WHERE coa.id = accounts.coa_id
    AND coa.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);

-- cost_centers
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY cost_centers_select ON cost_centers FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY cost_centers_insert ON cost_centers FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY cost_centers_update ON cost_centers FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY cost_centers_delete ON cost_centers FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- journal_entries
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_entries_select ON journal_entries FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY journal_entries_insert ON journal_entries FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY journal_entries_update ON journal_entries FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY journal_entries_delete ON journal_entries FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- journal_lines (through journal_entries relationship)
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY journal_lines_select ON journal_lines FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM journal_entries je
    WHERE je.id = journal_lines.entry_id
    AND je.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY journal_lines_insert ON journal_lines FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM journal_entries je
    WHERE je.id = journal_lines.entry_id
    AND je.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY journal_lines_update ON journal_lines FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM journal_entries je
    WHERE je.id = journal_lines.entry_id
    AND je.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY journal_lines_delete ON journal_lines FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM journal_entries je
    WHERE je.id = journal_lines.entry_id
    AND je.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);

-- partners
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY partners_select ON partners FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY partners_insert ON partners FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY partners_update ON partners FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY partners_delete ON partners FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- tax_documents
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_documents_select ON tax_documents FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY tax_documents_insert ON tax_documents FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY tax_documents_update ON tax_documents FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY tax_documents_delete ON tax_documents FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- tax_document_lines
ALTER TABLE tax_document_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY tax_document_lines_select ON tax_document_lines FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tax_documents td
    WHERE td.id = tax_document_lines.document_id
    AND td.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY tax_document_lines_insert ON tax_document_lines FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tax_documents td
    WHERE td.id = tax_document_lines.document_id
    AND td.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY tax_document_lines_update ON tax_document_lines FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tax_documents td
    WHERE td.id = tax_document_lines.document_id
    AND td.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY tax_document_lines_delete ON tax_document_lines FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tax_documents td
    WHERE td.id = tax_document_lines.document_id
    AND td.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);

-- retentions
ALTER TABLE retentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY retentions_select ON retentions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tax_documents td
    WHERE td.id = retentions.document_id
    AND td.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY retentions_insert ON retentions FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tax_documents td
    WHERE td.id = retentions.document_id
    AND td.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY retentions_update ON retentions FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tax_documents td
    WHERE td.id = retentions.document_id
    AND td.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY retentions_delete ON retentions FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tax_documents td
    WHERE td.id = retentions.document_id
    AND td.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);

-- bank_accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_accounts_select ON bank_accounts FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY bank_accounts_insert ON bank_accounts FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY bank_accounts_update ON bank_accounts FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY bank_accounts_delete ON bank_accounts FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- bank_movements (through bank_accounts)
ALTER TABLE bank_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_movements_select ON bank_movements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = bank_movements.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY bank_movements_insert ON bank_movements FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = bank_movements.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY bank_movements_update ON bank_movements FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = bank_movements.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY bank_movements_delete ON bank_movements FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = bank_movements.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);

-- bank_statements
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY bank_statements_select ON bank_statements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = bank_statements.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY bank_statements_insert ON bank_statements FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = bank_statements.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY bank_statements_update ON bank_statements FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = bank_statements.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY bank_statements_delete ON bank_statements FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = bank_statements.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);

-- reconciliations
ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY reconciliations_select ON reconciliations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = reconciliations.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY reconciliations_insert ON reconciliations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = reconciliations.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY reconciliations_update ON reconciliations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = reconciliations.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);
CREATE POLICY reconciliations_delete ON reconciliations FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM bank_accounts ba
    WHERE ba.id = reconciliations.bank_account_id
    AND ba.entity_id = get_current_entity_id()
  ) AND is_authenticated()
);

-- closing_checklists
ALTER TABLE closing_checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY closing_checklists_select ON closing_checklists FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY closing_checklists_insert ON closing_checklists FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY closing_checklists_update ON closing_checklists FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY closing_checklists_delete ON closing_checklists FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- audit_events
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_events_select ON audit_events FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY audit_events_insert ON audit_events FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY audit_events_update ON audit_events FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY audit_events_delete ON audit_events FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- ai_decisions
ALTER TABLE ai_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_decisions_select ON ai_decisions FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY ai_decisions_insert ON ai_decisions FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY ai_decisions_update ON ai_decisions FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY ai_decisions_delete ON ai_decisions FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);

-- memberships (user-entity assignments)
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY memberships_select ON memberships FOR SELECT USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY memberships_insert ON memberships FOR INSERT WITH CHECK (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY memberships_update ON memberships FOR UPDATE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
CREATE POLICY memberships_delete ON memberships FOR DELETE USING (
  entity_id = get_current_entity_id() AND is_authenticated()
);
