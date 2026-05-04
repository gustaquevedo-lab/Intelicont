# InteliCont — Contexto para Claude Code

## Visión
SaaS de contabilidad para Paraguay, AI-first, API-first. Reemplazo superior a Expert360.
Núcleo del ecosistema Inteli*: integra con InteliAudit (auditoría), Sueldok (RRHH/nómina) e InteliMarket (ERP).
Cliente objetivo: estudio contable PY que opera N empresas de PYMEs.

## Reglas inquebrantables
1. Doble partida estricta: todo JournalEntry suma débito = crédito por moneda.
2. Libro inmutable: nunca UPDATE/DELETE sobre JournalEntry posteado. Correcciones vía contra-asiento (reversalOf) o ajuste (versionOf).
3. Multi-tenant por entityId con Postgres RLS.
4. Períodos cerrados bloqueados, salvo flag allowRetroactive con auditoría.
5. Todo cambio queda en audit_events con who/what/when/why.
6. Cumplimiento PY no negociable: validar timbrado, CDC SIFEN, RUC y calendario DNIT.
7. IA siempre con humano en el loop: sugerencias con score y razón, usuario aprueba.
8. Idempotency-Key en endpoints mutadores.
9. Money: numeric(20,4) en DB, Decimal en TS. Moneda explícita.
10. Tests >= 90% en core/ledger, fiscal-py y banking.

## Stack default
- Monorepo Turborepo + pnpm
- Next.js 15 + React 19 + TypeScript estricto + shadcn/ui + Tailwind + TanStack Query + Zustand
- tRPC dentro del mismo Next
- Postgres 16 (Supabase) + Drizzle ORM + RLS
- Supabase Auth (email + magic link + 2FA)
- Inngest o Trigger.dev para jobs
- Supabase Storage para evidencias/XML/KuDE
- Anthropic API (Claude Sonnet) para IA
- Sentry + PostHog + pino

## Convenciones
- Código y comentarios en inglés, UI en español.
- camelCase en TS, snake_case en DB, tablas plural_snake.
- Estructura por feature: src/modules/<feature>/{api, domain, infra, ui}.
- Result<T, E> para errores de dominio.
- Conventional Commits, PRs pequeños.

## Comandos
pnpm install
pnpm dev
pnpm db:migrate
pnpm db:seed
pnpm test
pnpm test:e2e
pnpm lint && pnpm typecheck

## Glosario PY
SET/DNIT autoridad fiscal. RUC registro único. Timbrado autorización fiscal del comprobante. CDC código de control 44 dígitos SIFEN. KuDE representación gráfica. SIFEN sistema de facturación electrónica. Hechauka libro electrónico mensual. Aranduka aplicativo SET. Tesaka retenciones. IVA 10/5/exento. IRE renta empresarial (Gral/Simple/ReSimple). IRP renta personal. INR no residentes. IDU dividendos. RG90 conciliación de comprobantes electrónicos.

## Orden de lectura
1. docs/PRD.md
2. docs/ARCHITECTURE.md
3. docs/DATA_MODEL.md
4. docs/FISCAL_PY_RULES.md
5. docs/API_CONTRACTS.md
6. docs/INTEGRATIONS.md
7. docs/UX_PRINCIPLES.md
8. docs/SECURITY.md
9. docs/ROADMAP.md
10. docs/BACKLOG.md

## Forma de trabajo
- No avances al siguiente ticket sin que el actual esté merged y verde.
- Antes de codear: confirmá entendimiento y proponé plan corto.
- Si falta una decisión técnica, preguntá, no asumas.
