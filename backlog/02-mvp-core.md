# MVP Core Contable

Objetivo
- Desplegar el flujo contable núcleo para Paraguay: onboarding multi-tenant, seed COA PY, ingestión XML SIFEN, IA de propuesta y posteo, libros y formularios básicos.

Entregables
- Onboarding multi-tenant: creación de empresa, régimen, periodo; seed de COA PY.
- Ingesta XML SIFEN: parser básico, mapeo a journal_entries/journal_lines.
- Propuesta IA para asientos y revisión humana.
- Mutadores con Idempotency-Key y posting de asientos.
- Libros: Libro IVA, Diario, Mayor (consultas básicas).
- Formularios iniciales: 104/106, 500v3, 501v2, 502, 515/516, 525, 526.
- Hechauka mensual (muestras) y dashboard de obligaciones.

Historias (sugeridas)
- MVP-CORE-01: Onboarding multi-tenant y seed COA.
- MVP-CORE-02: Ingesta XML SIFEN y mapeo a asientos.
- MVP-CORE-03: Propuesta IA y revisión humana.
- MVP-CORE-04: Publicación de asientos (Idempotency-Key).
- MVP-CORE-05: Libros contables y consultas.
- MVP-CORE-06: Formularios fiscales iniciales.
- MVP-CORE-07: Hechauka y dashboard de obligaciones.

Criterios de aceptación
- Los flujos de onboarding funcionan y se crean entidades/periodos correctamente.
- La ingestión SIFEN produce asientos balanceados y registrables.
- Las propuestas IA pueden ser revisadas y aceptadas/rechazadas por humanos.
- Los mutadores son idempotentes y generan eventos para el outbox.
- Los libros y formularios pueden generar salidas en escenarios MVP.
- El Hechauka y dashboard muestran datos de ejemplo.

Notas
- Mantener la complejidad de IA como placeholder para MVP; swap de IA futura sin cambios de dominio.
