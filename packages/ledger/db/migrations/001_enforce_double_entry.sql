-- ============================================================================
-- Migration 001: Enforce double-entry bookkeeping at the DB level
-- Apply in Supabase SQL Editor: Dashboard → SQL Editor → paste & run
-- ============================================================================

-- ─── Trigger function: validate balance when an entry is POSTED ─────────────
-- Fires BEFORE UPDATE on journal_entries.
-- Validates: sum(debit) = sum(credit) when status transitions draft → posted.
-- Prevents: any modification of already-posted entries (use reversal instead).

CREATE OR REPLACE FUNCTION enforce_double_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_debit  NUMERIC;
  v_credit NUMERIC;
BEGIN
  -- ── Immutability: block edits on posted entries ──────────────────────────
  IF OLD.status = 'posted' AND NEW.status NOT IN ('reversed') THEN
    RAISE EXCEPTION
      'IMMUTABLE: Los asientos posteados no se pueden modificar. '
      'Usá un contra-asiento (reversalOf) para corregir. entry_id=%', OLD.id;
  END IF;

  -- ── Double-entry: validate balance when going draft → posted ─────────────
  IF NEW.status = 'posted' AND OLD.status = 'draft' THEN
    SELECT
      COALESCE(SUM(debit::NUMERIC),  0),
      COALESCE(SUM(credit::NUMERIC), 0)
    INTO v_debit, v_credit
    FROM journal_lines
    WHERE entry_id = NEW.id;

    IF v_debit = 0 AND v_credit = 0 THEN
      RAISE EXCEPTION
        'DOUBLE_ENTRY: El asiento no tiene líneas o todos los montos son cero. entry_id=%', NEW.id;
    END IF;

    IF ABS(v_debit - v_credit) > 0.0001 THEN
      RAISE EXCEPTION
        'DOUBLE_ENTRY: Doble partida no cumplida. '
        'Débito=₲% ≠ Crédito=₲%. entry_id=%',
        v_debit, v_credit, NEW.id;
    END IF;

    -- Stamp posted_at if not set
    IF NEW.posted_at IS NULL THEN
      NEW.posted_at := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ─── Attach the trigger ──────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS enforce_double_entry ON journal_entries;

CREATE TRIGGER enforce_double_entry
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION enforce_double_entry();

-- ─── Verify it's active ──────────────────────────────────────────────────────
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'journal_entries'
  AND trigger_name = 'enforce_double_entry';
