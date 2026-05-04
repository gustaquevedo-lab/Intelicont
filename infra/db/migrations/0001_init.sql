-- 0001_init.sql: Initial database schema for Intelicont core
-- Multi-tenant base: entities and ledger structures

-- Entities (tenants)
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruc VARCHAR(20) UNIQUE NOT NULL,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  tax_regimes TEXT[],
  base_currency VARCHAR(3) NOT NULL DEFAULT 'PYG',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fiscal periods
CREATE TABLE fiscal_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  closed_at TIMESTAMPTZ,
  closed_by UUID
);

-- Chart of accounts
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  kind VARCHAR(50) NOT NULL,
  name TEXT NOT NULL
);

-- Accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coa_id UUID REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  nature VARCHAR(20),
  parent_id UUID,
  allows_posting BOOLEAN DEFAULT TRUE,
  cost_center_required BOOLEAN DEFAULT FALSE,
  tax_mappings JSONB,
  eef_line_id VARCHAR(50)
);

-- Journal entries (immutable once posted)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
  period_id UUID REFERENCES fiscal_periods(id) ON DELETE SET NULL,
  date TIMESTAMPTZ NOT NULL,
  number VARCHAR(100),
  source VARCHAR(50),
  source_ref VARCHAR(100),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  posted_at TIMESTAMPTZ,
  posted_by UUID,
  reversal_of UUID,
  version_of UUID,
  metadata JSONB
);

-- Journal lines
CREATE TABLE journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  debit NUMERIC(20,4) DEFAULT 0,
  credit NUMERIC(20,4) DEFAULT 0,
  currency_code VARCHAR(3) NOT NULL,
  fx_rate NUMERIC(20,6) DEFAULT 1,
  amount_base NUMERIC(20,4) DEFAULT 0,
  cost_center_id UUID,
  partner_id UUID,
  tax_document_id UUID,
  description TEXT
);

-- Balance invariant (debito == credito per entry and per currency)
CREATE FUNCTION repo_journal_balance() RETURNS trigger AS $$
DECLARE bal NUMERIC;
BEGIN
  SELECT COALESCE(SUM(debit),0) - COALESCE(SUM(credit),0) INTO bal
  FROM journal_lines jl
  WHERE jl.entry_id = NEW.entry_id;
  IF bal <> 0 THEN
    RAISE EXCEPTION 'Unbalanced journal entry: %', NEW.entry_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_balance
AFTER INSERT OR UPDATE OR DELETE ON journal_lines
FOR EACH ROW EXECUTE FUNCTION repo_journal_balance();
