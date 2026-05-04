# Arquitectura — InteliCont

## Estilo
Monorepo Turborepo. Modular monolith por features. Hexagonal por módulo (domain/application/infra/ui). Event sourcing acotado al ledger. CQRS suave (vistas materializadas para reportes).

## Estructura
apps/
  web/        # Next.js (UI + tRPC)
  jobs/       # workers Inngest/Trigger
packages/
  core/       # Money, Period, Tenant
  ledger/
  fiscal-py/
  ar-ap/
  banking/
  assets/
  reporting/
  ai/
  ops/        # cierre, audit-events, checklist
  integrations/
  ui/
  config/

## Capas por módulo
- domain/: entidades, VOs, invariantes, errores. Cero deps externas.
- application/: casos de uso.
- infra/: adaptadores (Drizzle, Anthropic, Supabase Storage, SIFEN client).
- api/: routers tRPC + REST + webhooks.
- ui/: componentes y páginas.

## Patrones
Result types. Saga para flujos largos (cierre, exportadores). Outbox para webhooks. Idempotency-Key. Domain events: journal.posted, journal.reversed, period.closed.

## Multi-tenant
Tabla entities. Cada tabla de negocio con entity_id NOT NULL. RLS activo. Middleware setea app.entity_id y app.user_id por request.

## IA
Servicio ai/ con ingestDocument, suggestAccount, proposeReconciliation. Cada propuesta retorna { value, confidence, rationale, sources[] }. Almacenar prompt/respuesta/decisión en ai_decisions.

## Observabilidad
Logs estructurados con requestId/entityId/userId. Sentry + PostHog. Métricas: tiempo de posteo, latencia IA, tasa de matching.
