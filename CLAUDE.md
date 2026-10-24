# InteliCont — Contexto para AI Assistants

## Visión
SaaS de contabilidad para Paraguay, AI-first, API-first. Reemplazo superior a Expert360.
Núcleo del ecosistema Inteli*: integra con InteliAudit (auditoría), Sueldok (RRHH/nómina) e InteliMarket (ERP).
Cliente objetivo: estudio contable PY que opera N empresas de PYMEs.

## Reglas inquebrantables
1. Doble partida estricta: todo JournalEntry suma débito = crédito por moneda.
2. Libro inmutable: nunca UPDATE/DELETE sobre JournalEntry posteado. Correcciones vía contra-asiento (reversalOf) o ajuste (versionOf).
3. Multi-tenant por entityId con Postgres RLS (app.entity_ids / app.user_id).
4. Períodos cerrados bloqueados, salvo flag allowRetroactive con auditoría.
5. Todo cambio queda en audit_events con who/what/when/why (append-only).
6. Cumplimiento PY no negociable: validar timbrado, CDC SIFEN (DV mod 11), RUC y calendario DNIT.
7. IA local con humano en el loop: sugerencias con score y razón, usuario aprueba. Modelos locales (Ollama). NUNCA E/S externa ni llamadas de red/LLM dentro de transacciones withTenant.
8. Idempotency-Key obligatoria (UUID) en endpoints mutadores (idempotentProcedure).
9. Dinero entero: bigint en DB (unidad mínima; PYG sin decimales). Sin floats.
10. Tests >= 90% en core/ledger, fiscal-py y usecases críticos.

## Stack
- Monorepo Turborepo + pnpm 12.14 + Node >= 22
- Next.js 15 + React 19 + TypeScript estricto + shadcn/ui + Tailwind + TanStack Query + Zustand
- tRPC v11 (tipado de punta a punta, logging y mascarado de errores internos con requestId)
- PostgreSQL 16 propio + Drizzle ORM + postgres-js + RLS fail-closed
- Better Auth (email + contraseña + TOTP obligatorio para admins; sin magic links)
- Ollama para IA local (qwen2.5:7b default; fallback a reglas determinísticas)
- Pino para logging estructurado sin datos sensibles (safeErrorInfo)

## Convenciones
- Código y comentarios en inglés, UI en español.
- camelCase en TS, snake_case en DB, tablas plural_snake.
- Estructura: packages/ledger (dominio, db, usecases), packages/core (money, result), apps/web.
- Transacciones y RLS: usar `withTenant(userId, fn)` en entry points (routers/actions) y `tenantDb(fn)` en repositorios internos.
- Migraciones: nunca nombrar roles fijos; vistas con `security_invoker = true`.
- Result<T, E> para errores de dominio en packages/core.
- Conventional Commits, PRs pequeños.

## Comandos
```bash
pnpm dev                 # Servidor Next.js dev
pnpm build               # Build de producción
pnpm lint                # ESLint monorepo
pnpm test                # Vitest unit tests
pnpm test:db             # Tests contra base de datos efímera (requiere TEST_ADMIN_URL)
pnpm test:cov            # Cobertura de tests
pnpm test:e2e            # Playwright E2E
pnpm db:migrate          # Drizzle migrations
pnpm db:seed             # Seed de datos
pnpm auth:create-user    # Crear usuario admin inicial
```

## Glosario PY
SET/DNIT autoridad fiscal. RUC registro único (mod 11). Timbrado autorización fiscal. CDC código de control 44 dígitos SIFEN. KuDE representación gráfica. SIFEN facturación electrónica. Registro de Comprobantes (resolución 90, obligaciones 955/956 mensual/anual; reemplaza Hechauka). Form 104/106 IVA. Form 500v3 IRE Gral. Form 120 IRP. Retenciones Tesaka (IVA 30/70/100%, IRE, IRP).

## Forma de trabajo
- No avances al siguiente ticket sin que el actual esté merged y verde.
- Antes de codear: confirmá entendimiento y proponé plan corto.
- Si falta una decisión técnica, preguntá, no asumas.
