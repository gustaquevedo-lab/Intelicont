# Reglas fiscales Paraguay — InteliCont

Fuente de verdad. Versionar cada cambio normativo con effective_from.

## Regímenes
IVA_GRAL → forms 104, 106
IRE_GRAL → 500v3
IRE_SIMPLE → 501v2
IRE_RESIMPLE → 502
IRP → 120, 120v4
INR → 525
IDU → 526
EXPORTADOR → 515, 516

## IVA
Tasas 10%, 5%, exento. Imputación por RG90 (NC vincula a su factura origen). Libro IVA separado ventas/compras. Crédito fiscal solo si vinculado a actividad gravada. Validar timbrado y RUC antes de aceptar crédito.

## Retenciones (motor configurable)
RET_IVA: base = total IVA, tasas 30/70/100% según designación.
RET_IRE: renta presunta, tasas variables.
RET_IRP: honorarios profesionales, escala.
RET_INR: pagos al exterior, tasas por tipo.
Cada regla: appliesIf, base, rate, cap?, certificateRequired, dueDate. Configurable por entidad y proveedor.

## Formularios
104/106 IVA mensual. 500v3 IRE Gral anual. 501v2 IRE Simple anual. 502 IRE ReSimple anual. 120/120v4 IRP anual con rubros. 515/516 Exportador. 525 retenciones INR mensual. 526 IDU por distribución.

## Libros electrónicos
Hechauka registro mensual de comprobantes. Aranduka aplicativo. Tesaka retenciones. 955/956 registros mensual/anual. Cada exportador es módulo aparte con tests vs muestras oficiales SET.

## Calendario
Tabla tax_calendar(entity_id, regime, period, due_date) autogenerada por terminación de RUC. Notificaciones 7/3/1 días antes.

## Validaciones
1. RUC válido (DV) y activo.
2. Timbrado vigente al momento de la operación.
3. CDC SIFEN bien formado (44 dígitos).
4. Coherencia de tasas IVA con totales.
5. NC no supera saldo de factura origen.
6. Período de imputación IVA según RG90.

## Cierre fiscal
Ajuste por inflación, revalúo de bienes, diferencia de cambio, provisión IRE, provisión IRP empleados, conciliación contable-fiscal. Output: pre-DJ del formulario con drill-down a asientos.
