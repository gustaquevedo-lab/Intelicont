# PRD — InteliCont

## Problema
Estudios contables PY usan sistemas legacy (Expert360 líder) con UX 2010s, sin IA, sin API, carga manual masiva y conciliación 100% manual.

## Usuarios
- Contador del estudio (primario): opera 10-200 empresas.
- Asistente contable.
- Cliente PYME (portal limitado).
- Auditor externo (vía InteliAudit).

## Jobs to be done
1. Cargar comprobantes en segundos con asiento sugerido por IA.
2. Conciliar bancos automáticamente.
3. Cerrar el mes con checklist asistido.
4. Presentar formularios DNIT sin salir del sistema.
5. Operar N empresas con permisos granulares.
6. Entregar EEFF (PY local + NIIF) trazables.
7. Handoff a InteliAudit con un click.

## Métricas (12 meses)
- Carga por comprobante <= 5 seg.
- Matching bancario automático >= 85%.
- Cierre mensual -60% horas.
- NPS contador >= 60.
- 0 errores DNIT en fiscalizaciones.

## MVP
1. Crear empresa, régimen tributario, períodos, plan de cuentas seed PY.
2. Ingestar XML SIFEN → propuesta IA → aprobar → postear.
3. Carga manual con motor de retenciones.
4. Libro IVA, Diario, Mayor.
5. Formularios 104/106 y 500v3.
6. Hechauka mensual.
7. Dashboard con obligaciones y vencimientos.

## No-MVP
Consolidación, NIIF completa, portal cliente PYME, BI configurable, multi-país.

## Diferenciadores vs Expert360
AI-first ingestion, API pública, cierre como checklist viva, doble libro fiscal/NIIF, event-sourced, UX teclado-first.
