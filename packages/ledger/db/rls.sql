-- ============================================================
-- InteliCont — Row Level Security (RLS)
-- Supabase Postgres 16
--
-- Fase 1 (dev): políticas permisivas con service_role.
-- Fase 2 (auth): reemplazar con auth.uid() + claims por entityId.
--
-- Run: Supabase SQL Editor → New query → paste → Run
-- ============================================================

-- ── Habilitar RLS en todas las tablas ──────────────────────

ALTER TABLE entities           ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_periods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines      ENABLE ROW LEVEL SECURITY;


-- ── Políticas de desarrollo (service_role bypass) ──────────
-- El service_role ya bypasea RLS por defecto en Supabase.
-- Estas políticas permiten acceso total al rol "authenticated"
-- durante el desarrollo. En producción se reemplazarán por
-- políticas basadas en auth.uid() + tabla de membresías.

-- entities
CREATE POLICY "dev_all_entities"
  ON entities FOR ALL
  USING (true)
  WITH CHECK (true);

-- fiscal_periods
CREATE POLICY "dev_all_fiscal_periods"
  ON fiscal_periods FOR ALL
  USING (true)
  WITH CHECK (true);

-- chart_of_accounts
CREATE POLICY "dev_all_chart_of_accounts"
  ON chart_of_accounts FOR ALL
  USING (true)
  WITH CHECK (true);

-- accounts
CREATE POLICY "dev_all_accounts"
  ON accounts FOR ALL
  USING (true)
  WITH CHECK (true);

-- journal_entries
CREATE POLICY "dev_all_journal_entries"
  ON journal_entries FOR ALL
  USING (true)
  WITH CHECK (true);

-- journal_lines
CREATE POLICY "dev_all_journal_lines"
  ON journal_lines FOR ALL
  USING (true)
  WITH CHECK (true);


-- ── TODO Fase 2: políticas multi-tenant reales ────────────
-- Cuando se implemente auth (Bloque 2 del roadmap), reemplazar
-- las políticas anteriores con algo así:
--
-- CREATE TABLE entity_memberships (
--   user_id    uuid REFERENCES auth.users(id),
--   entity_id  uuid REFERENCES entities(id),
--   role       text CHECK (role IN ('owner','admin','accountant','viewer')),
--   PRIMARY KEY (user_id, entity_id)
-- );
--
-- DROP POLICY "dev_all_entities" ON entities;
-- CREATE POLICY "tenant_entities" ON entities FOR ALL
--   USING (
--     id IN (
--       SELECT entity_id FROM entity_memberships
--       WHERE user_id = auth.uid()
--     )
--   );
-- (Repetir para las demás tablas filtrando por entity_id)
-- ─────────────────────────────────────────────────────────
