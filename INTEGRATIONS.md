# Integraciones — Ecosistema Inteli*

## Sueldok
Cierre de nómina → evento payroll.closed → InteliCont propone JournalEntry con sueldos por centro de costo, IPS empleador/empleado, retenciones IRP (alimentan 120v4), provisiones aguinaldo/vacaciones, pagos pendientes.
Endpoint: POST /v1/integrations/sueldok/payroll-closed.
Drill-down: cada línea enlaza al recibo en Sueldok.

## InteliAudit
period.closed con snapshot firmado (hash + saldos + papeles) → InteliAudit arma muestreo.
Devuelve hallazgos vía POST /v1/integrations/inteliaudit/findings → tareas en checklist.
Snapshot read-only: GET /v1/snapshots/:periodId con HMAC.

## InteliMarket
Ventas/compras/stock como TaxDocuments con CDC SIFEN. Costo de mercadería e inventario generan asientos automáticos.
Endpoints: POST /v1/integrations/intelimarket/invoice-issued, POST /v1/integrations/intelimarket/inventory-adjustment.

## Contratos
CloudEvents 1.0 + firma HMAC. Schemas versionados en packages/integrations/contracts.
