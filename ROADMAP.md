# Roadmap — InteliCont

## Fase 1 — MVP fiscal PY (meses 1-3)
Setup monorepo, auth, multi-tenant RLS. Modelo: entities, fiscal_periods, chart_of_accounts, accounts, journal_entries, journal_lines, partners, tax_documents. Plan de cuentas seed PY. Casos de uso: postJournalEntry, reverseJournalEntry, libros Diario/Mayor/Sumas y Saldos. Ingesta XML SIFEN con IA. Carga manual con retenciones. Libro IVA, formulario 104, exportador Hechauka. Dashboard.

## Fase 2 — AR/AP, Bancos, Activos (meses 4-6)
Cuenta corriente clientes/proveedores, anticipos, cuotas. Cobros y pagos con asientos. Bancos con matching IA. Activos fijos con depreciación.

## Fase 3 — EEFF, Reporting, Cierre (meses 7-8)
Plan EEFF + enlaces. BG, ER, FE, EVP. Closing checklist con validaciones. Reportes drill-down. Formularios 500v3, 120v4.

## Fase 4 — Integraciones Inteli* (meses 9-10)
Webhooks outbox firmados. Sueldok → asientos. InteliMarket → facturas/inventario. InteliAudit → snapshot/findings.

## Fase 5 — NIIF, Consolidación, BI (meses 11-12)
Doble libro fiscal/NIIF. Consolidación de grupos. Dashboards configurables. NL-query. Portal cliente PYME.

## Transversales
Tests >= 90% en core/ledger, fiscal-py, banking. Sentry + PostHog desde fase 1. OpenAPI auto-generado.
