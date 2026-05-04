# GitHub Issues (Backlog to GitHub)

Este documento convierte las historias del backlog en issues listos para pegar en GitHub. Cada sección describe un issue con descripción, criterios de aceptación, dependencias y estimación.

---

### FND-01: Foundations — Create monorepo scaffolding
- Description: Establecer la estructura base del monorepo, tooling, linting y scripts para desarrollo temprano.
- Acceptance criteria:
- Estructura de repo por módulos (apps/*, packages/*, backlog/*).
- Scripts de build/test/lint en root.
- Configuración de lint y TS; pre-commit configurado.
- Dependencies: -
- Estimate: 5-8d

---

### FND-02: Foundations — DB + multi-tenant (Postgres + RLS)
- Description: Configurar la base de datos con esquemas núcleo y RBAC/RLS para multi-tenant.
- Acceptance criteria:
- Esquemas: entities, fiscal_periods, chart_of_accounts, accounts, journal_entries, journal_lines, etc.
- RLS habilitado y políticas básicas para evitar acceso cruzado.
- Tests de aislamiento entre entidades.
- Dependencies: FND-01
- Estimate: 5-7d

---

### FND-03: Foundations — Context by request (entity_id, user_id)
- Description: Implementar middleware/contexto por request que inyecte entity_id y user_id en el contexto de cada operación.
- Acceptance criteria:
- Contexto accesible en handlers/routers; RBAC aplicado.
- Tests de contexto correcto.
- Dependencies: FND-02
- Estimate: 3-5d

---

### FND-04: Foundations — Auth & Roles (Supabase Auth)
- Description: Configurar Auth y perfiles (roles) para multi-tenant.
- Acceptance criteria:
- Registro/login; asignación de roles; asociación a entidades.
- Tests de permisos por rol.
- Dependencies: FND-02, FND-03
- Estimate: 4-6d

---

### FND-05: Foundations — Frontend skeleton (Next.js + tRPC)
- Description: Skeleton de frontend con App Router y boundary para tRPC.
- Acceptance criteria:
- Estructura minimalista con login y navegación básica.
- Conexión tipada a APIs (stub).
- Dependencies: FND-04
- Estimate: 4-6d

---

### FND-06: Foundations — IA skeleton (interfaces)
- Description: Definir interfaces para ingestDocument, suggestAccount y proposeReconciliation; permitir swap de IA.
- Acceptance criteria:
- Interfaces definidas; proveedor IA por defecto (fake/free).
- Documentation de swap de IA sin cambios de dominio.
- Dependencies: FND-05
- Estimate: 3-4d

---

### FND-07: Foundations — Outbox & Idempotency
- Description: Implementar Outbox pattern y Idempotency-Key para mutadores.
- Acceptance criteria:
- Mutadores son idempotentes; eventos de outbox generados y entregados.
- Dependencies: FND-02, MVP-CORE (cuando exista)
- Estimate: 4-6d

---

### FND-08: Foundations — Observability
- Description: Configurar Sentry y PostHog; logs estructurados.
- Acceptance criteria:
- Logs con requestId/entityId/userId; dashboards básicos.
- Dependencies: FND-05
- Estimate: 3-4d

---

### FND-09: Foundations — Documentation & onboarding
- Description: Documentación de arranque, guía de desarrollo y normas.
- Acceptance criteria:
- README actualizado; guía de desarrollo y convenciones.
- Dependencies: FND-01
- Estimate: 2-3d

---

### MVP-CORE-01: MVP Core — Onboarding multi-tenant
- Description: Flujo para crear empresa, régimen, periodo y seed COA PY.
- Acceptance criteria:
- Admin crea empresa, configura periodo y se aplica seed COA PY.
- Multi-tenant context activo.
- Dependencies: FND-02, FND-04
- Estimate: 6-8d

---

### MVP-CORE-02: MVP Core — Seed COA PY
- Description: Seed data de plan de cuentas PY en core.
- Acceptance criteria:
- COA PY existente y válida; validaciones de integridad.
- Dependencies: MVP-CORE-01
- Estimate: 3-4d

---

### MVP-CORE-03: MVP Core — Ingesta XML SIFEN (parser)
- Description: Parser básico de XML SIFEN y mapeo a journal_entries/journal_lines.
- Acceptance criteria:
- XML de ejemplo parseado correctamente, asientos generados balanceados.
- Dependencies: MVP-CORE-02
- Estimate: 7-10d

---

### MVP-CORE-04: MVP Core — Propuesta IA (revisión humana)
- Description: IA genera propuestas y UI de revisión con score y rationale.
- Acceptance criteria:
- Propuestas IA con score y rationale visibles; humano puede aprobar/rechazar.
- Dependencies: MVP-CORE-03, FND-06
- Estimate: 6-8d

---

### MVP-CORE-05: MVP Core — Publicación de asientos (Idempotency)
- Description: Publicar asientos con Idempotency-Key; balance por moneda/base.
- Acceptance criteria:
- Asientos publicados correctamente; idempotente; sumas balanceadas.
- Dependencies: MVP-CORE-04
- Estimate: 5-7d

---

### MVP-CORE-06: MVP Core — Libros contables
- Description: Libro IVA, Diario, Mayor (consultas básicas).
- Acceptance criteria:
- Consultas de libros disponibles y correctas en MVP.
- Dependencies: MVP-CORE-05
- Estimate: 6-8d

---

### MVP-CORE-07: MVP Core — Formularios fiscales iniciales
- Description: Generación/validación de 104/106, 500v3, 501v2, 502, 515/516, 525, 526.
- Acceptance criteria:
- Formularios generados en escenarios MVP; validaciones básicas.
- Dependencies: MVP-CORE-06
- Estimate: 8-12d

---

### MVP-CORE-08: MVP Core — Hechauka y dashboard de obligaciones
- Description: Hechauka mensual y dashboard de obligaciones.
- Acceptance criteria:
- Hechauka generado y visible; dashboard muestra obligaciones/vencimientos.
- Dependencies: MVP-CORE-07
- Estimate: 5-7d

---

### IA-EP-01: IA — ai_decisions model
- Description: Crear esquema ai_decisions y almacenamiento de decisiones IA.
- Acceptance criteria:
- Estructura de ai_decisions creada y poblable.
- Dependencies: FND-06
- Estimate: 3-4d

---

### IA-EP-02: IA — Bucle de aprendizaje (feedback humano)
- Description: Definir flujo para incorporar feedback humano y mejoras IA.
- Acceptance criteria:
- Proceso para actualizar scores basados en aprobaciones/rechazos.
- Dependencies: IA-EP-01
- Estimate: 4-6d

---

### IA-EP-03: IA — UI de revisión de IA
- Description: Pantalla para revisar propuestas IA con razonamientos y fuentes.
- Acceptance criteria:
- UI funcional; registrar decisiones.
- Dependencies: MVP-CORE-04
- Estimate: 5-7d

---

### SEC-01: Seguridad — RBAC y pruebas de acceso
- Description: Definir roles, permisos y tests de RBAC/RLS.
- Acceptance criteria:
- Tests de acceso entre entidades; permisos correctos.
- Dependencies: FND-03
- Estimate: 4-6d

---

### SEC-02: Compliance — Validaciones must-have (timbrado, SIFEN, DNIT)
- Description: Incorporar validaciones y tests para timbrado, CDC SIFEN y DNIT.
- Acceptance criteria:
- Tests end-to-end que cubren validaciones críticas.
- Dependencies: MVP-CORE-07
- Estimate: 6-8d

---

### SEC-03: Auditoría — Auditoría y reversión
- Description: audit_events; soporte para reversalOf y versionOf.
- Acceptance criteria:
- Registro de auditoría para cambios; soporte de reversión de asientos.
- Dependencies: MVP-CORE-05
- Estimate: 4-6d

---

### OBS-01: Observabilidad — Monitoreo y dashboards
- Description: Dashboards básicos con Sentry + PostHog; métricas clave.
- Acceptance criteria:
- Dashboards disponibles en staging/producción; logs visibles.
- Dependencies: FND-08
- Estimate: 3-5d

---

### OBS-02: CI/CD y quality gates
- Description: Pipeline CI con lint/typecheck/tests; despliegue a GitHub Pages / Vercel.
- Acceptance criteria:
- Checks obligatorios en PRs; build y test pasan.
- Dependencies: OBS-01, FND-05
- Estimate: 4-6d

---

### OBS-03: Documentación MVP
- Description: Documentación de arquitectura, guías de despliegue.
- Acceptance criteria:
- README actualizado; guías de despliegue para frontend y backend.
- Dependencies: FND-01
- Estimate: 2-4d

---

### REL-01: Release — Versionado de API y crecimiento
- Description: Política de versiones y migración.
- Acceptance criteria:
- Roadmap de versiones; ruta de migración definida.
- Dependencies: MVP-CORE
- Estimate: 3-5d

---

### REL-02: Release — Pruebas E2E y rendimiento
- Description: Plan de pruebas E2E y rendimiento para crecimiento.
- Acceptance criteria:
- Plan de pruebas E2E documentado; escenarios críticos cubiertos.
- Dependencies: REL-01
- Estimate: 4-6d

---

### REL-03: Release — Plan de escalabilidad operativa
- Description: Estrategia de escalabilidad y migración futura.
- Acceptance criteria:
- Documento de escalabilidad con criterios de activación.
- Dependencies: REL-02
- Estimate: 2-4d
