# Backlog — Fase 1 (MVP)

## Épica 1: Setup
T-001 Monorepo Turborepo con apps/web y packages/{core, ledger, ui, config}.
T-002 TS estricto, ESLint, Prettier, Vitest, Playwright.
T-003 Supabase (DB+Auth+Storage), Drizzle, migraciones base.
T-004 Auth + middleware multi-tenant (X-Entity-Id, RLS).
T-005 Layout Next 15, shadcn/ui, dark mode, switcher de empresa.

## Épica 2: Core ledger
T-010 Esquema entities, fiscal_periods, chart_of_accounts, accounts.
T-011 Esquema journal_entries (inmutable), journal_lines, triggers anti-update.
T-012 Use case postJournalEntry (doble partida, período abierto).
T-013 Use case reverseJournalEntry.
T-014 Repos Drizzle + tests >=90%.
T-015 tRPC /journal-entries + REST /v1/journal-entries.
T-016 UI grilla de asientos con atajos teclado.

## Épica 3: Plan de cuentas y partners
T-020 Seed plan de cuentas PY (CONPLA referencial).
T-021 CRUD partners con validación RUC.
T-022 UI árbol de cuentas con drill-down.

## Épica 4: Tax documents + IA
T-030 Esquema tax_documents, tax_document_lines, retentions.
T-031 Cliente Anthropic + parser XML SIFEN.
T-032 Use case ingestTaxDocument (XML/PDF/imagen).
T-033 UI bandeja de comprobantes con propuestas IA.
T-034 Validaciones: timbrado, CDC, RUC, IVA.
T-035 Carga manual con motor de retenciones.

## Épica 5: Libros y formularios
T-040 Libro Diario, Mayor, Sumas y Saldos.
T-041 Libro IVA con RG90.
T-042 Formulario 104.
T-043 Exportador Hechauka (CSV SET) con tests vs muestras.

## Épica 6: Dashboard
T-050 tax_calendar autogenerado por terminación de RUC.
T-051 Dashboard con obligaciones y KPIs.
T-052 Notificaciones 7/3/1 días.

## DoD
Código + tests + types verdes. PR pequeño mergeado. Docs actualizados. Demo manual o e2e Playwright.
