# Rebanada vertical fiscal PY — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que un contador inicie sesión, suba un XML SIFEN, apruebe un asiento propuesto y obtenga Libro IVA, Form 104 y el archivo de Registro de Comprobantes (955), todo con datos reales de la base.

**Architecture:** Se reutiliza lo existente (`withTenant`, `repository.ts`, `fiscal-py.ts`, `retentions-engine.ts`). Se corrigen los cimientos defectuosos (dinero, RUC/CDC, parser XML), se agrega identidad con membresías sobre el mismo Postgres con RLS ya activo, y se cablean las pantallas del alcance a tRPC. El front corre en `dev-server` (Coolify), junto a Postgres y Ollama.

**Tech Stack:** Next.js 15, tRPC 11, Drizzle + postgres-js, Postgres 16 (RLS + triggers), Better Auth (contraseña + TOTP), `fast-xml-parser`, `fflate`, Ollama (`qwen2.5`), Vitest, Playwright, pino.

**Spec:** `docs/superpowers/specs/2026-10-21-vertical-slice-fiscal-py-design.md`

## Global Constraints

- Modo de trabajo **ponytail**: el cambio más chico que resuelve todo; reutilizar antes de crear; sin dependencias para pocas líneas; lógica no trivial lleva test; atajos con límite llevan `// shortcut: <límite>, <cuándo mejorar>`.
- Código y comentarios en inglés, UI en español. camelCase en TS, snake_case en DB, tablas plural_snake. Conventional Commits, PR chico por tarea.
- **Dinero = entero en la unidad mínima de su moneda** (PYG exponente 0). `bigint` en DB, `number` entero en TS validado con `Number.isSafeInteger`. Prohibido `parseFloat` y decimales en el flujo contable. `fx_rate` y cantidades siguen `numeric`.
- IVA sobre importes con IVA incluido: `iva10 = round(gravado10 / 11)`, `iva5 = round(gravado5 / 21)`.
- Doble partida exacta por moneda; libro inmutable (triggers de `0001`); toda mutación escribe `audit_events` en la misma transacción; mutaciones exigen `Idempotency-Key`.
- RLS por `entity_id` vía `app.entity_ids`; el rol `intelicont_app` no es dueño de las tablas y no puede borrar.
- Auth: email + contraseña + TOTP (obligatorio para admins). **Sin magic links ni SMTP.**
- IA: **solo modelos locales** (Ollama en `dev-server`, puerto 11434). Reglas primero; sin proveedor remoto. Nunca se postea sin aprobación humana.
- RUC: módulo 11 de la DNIT (pesos 2 a 11 de derecha a izquierda; resto 0 o 1 → DV 0, si no 11 − resto).
- Registro de Comprobantes: `<RUC sin DV>_REG_MMAAAA_XXXXX.zip`, UTF-8, sin títulos, ≤ 5.000 filas por archivo, montos enteros, fechas `dd/mm/aaaa`, **sin comprobantes electrónicos SIFEN**.
- Tests: cobertura ≥ 90 % en `packages/ledger/src` (fiscal-py, usecases) y `retentions-engine`. Tests de BD corren contra Postgres real (`TEST_ADMIN_URL`).
- Fixture real: `apps/web/src/__fixtures__/sifen/fac_024-004-0049994.xml` (anonimizar receptor).

## Review Focus

1. Montos del XML con decimales (`12000.00000000`, IVA por ítem `1090.909`) → totales enteros coherentes (total 58.000 = base 52.727 + IVA 5.273). Test en T5.
2. El mismo XML (mismo CDC) subido dos veces no crea dos comprobantes ni dos asientos. Test en T14.
3. Llamada tRPC sin sesión, o de un usuario sin membresía en esa empresa → 401/vacío, nunca datos de otra empresa. Test en T8.
4. Razón social con `;`, comillas o tildes, y más de 5.000 comprobantes → el archivo sigue siendo válido y se parte en `V0001`, `V0002`. Test en T19.
5. Ollama caído, lento (> 20 s) o con JSON inválido → propuesta por reglas y aviso en la UI, sin error al usuario. Test en T15.
6. Fecha del XML cerca de medianoche no cambia de día por zona horaria (`2026-08-09T23:59:59` → `09/08/2026`). Test en T5 y T19.

---

### Task 1: Baseline y higiene del repositorio

**Files:** Modify `.gitignore`; track `pnpm-lock.yaml`; commits agrupados del trabajo hoy sin versionar.

- [ ] **Step 1:** En `.gitignore` agregar `.env*.local`, `*.pem`, `.superpowers/` y **quitar** `pnpm-lock.yaml` (CI usa `--frozen-lockfile`). Verificar: `git check-ignore apps/web/.env.local` imprime la ruta.
- [ ] **Step 2:** Crear rama `feat/vertical-slice`. Hacer commits por área (`chore: ignore local env`, `feat(db): drizzle postgres + RLS + immutability`, `feat(web): prototype UI`, `docs: specs and plan`). Verificar: `git status --short` vacío y `git ls-files | grep -c env.local` = 0.
- [ ] **Step 3:** `pnpm install --frozen-lockfile && pnpm test` pasa (77 tests).

### Task 2: Arnés de BD y tests permanentes de aislamiento/inmutabilidad

**Files:** Create `packages/ledger/db/test-db.ts`, `apps/web/src/__tests__/db/rls-ledger.test.ts`; Modify `apps/web/package.json` (script `test:db`).

**Interfaces:**
- Produces: `createTestDb(): Promise<TestDb>` con `TestDb = { owner: Sql; app: Sql; scoped<T>(entityIds: string[], fn: (tx: Sql) => Promise<T>, settings?: Record<string,string>): Promise<T>; drop(): Promise<void> }`.

- [ ] **Step 1:** Implementar `createTestDb` con `TEST_ADMIN_URL` (rol **no superusuario** `intelicont_testadmin` con `CREATEDB CREATEROLE`, base `postgres`; vive en `apps/web/.env.test.local`, ignorado por git): crea base `ic_test_<rand>` (dueña: el propio testadmin), aplica `packages/ledger/db/migrations` con el migrator de Drizzle como dueño, crea el rol `t_app_<rand>` con contraseña aleatoria y otorga a `t_app` `SELECT, INSERT, UPDATE` (más `DELETE` solo donde T6 lo pida). `drop()` elimina base y rol. No toca los roles reales `intelicont_*`.
- [ ] **Step 2:** Portar los 31 casos de `/private/tmp/.../scratchpad/rls-test.cjs` a Vitest (`// @vitest-environment node`, `describe.skipIf(!process.env.TEST_ADMIN_URL)`). Nombres de test iguales a los de PASS/FAIL del script: p. ej. `no scope -> entities empty`, `post unbalanced blocked`, `UPDATE posted entry blocked`, `retroactive post allowed + audit event written`.
- [ ] **Step 3:** Ejecutar con el túnel abierto (`ssh -N -L 5440:127.0.0.1:5440 dev-server@dev-server`) y `TEST_ADMIN_URL` definido en `apps/web/.env.test.local`: `pnpm --filter @intelicont/web test:db` → 31 pasan; la base temporal desaparece (`\l` no la lista).
- [ ] **Step 4:** Commit `test(db): permanent RLS and ledger immutability suite`.

### Task 3: Dinero entero (W0, migración `0002_money_integer`)

**Files:** Create `packages/ledger/db/migrations/0002_money_integer.sql`, `packages/core/src/money.ts`; Modify `packages/ledger/db/schema.ts`, `seed.ts`, `repository.ts`, `packages/ledger/src/fiscal-py.ts`, `apps/web/src/lib/retentions-engine.ts`, `apps/web/src/lib/actions.ts`, tests existentes.

**Interfaces:**
- Produces además `packages/core/src/result.ts`: `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`, `ok(v)`, `err(e)`; `packages/core` queda cableado como `@intelicont/core` (dependencia workspace en `apps/web` y `packages/ledger`, alias en `vitest.config.ts`, `paths` en `tsconfig.json`).
- Produces (`packages/core/src/money.ts`): `assertMoney(n: number): number` (lanza si no es entero seguro) y `ivaFromGross(gross: number, rate: 10 | 5): number`; `fiscal-py` re-exporta `ivaFromGross`.

- [ ] **Step 1: Tests primero** (`apps/web/src/__tests__/money.test.ts`): `ivaFromGross(58000,10)===5273`, `ivaFromGross(11000000,10)===1000000`, `ivaFromGross(105000,5)===5000`, `assertMoney(1.5)` lanza, `assertMoney(2**53)` lanza. Ejecutar: FAIL.
- [ ] **Step 2:** Implementar ambas funciones (redondeo `Math.round`; `shortcut: límite 2^53 Gs`).
- [ ] **Step 3:** Migración: `ALTER COLUMN ... TYPE bigint USING round(col)::bigint` en `journal_lines(debit, credit, amount_base)`, `tax_documents(gravado_10, gravado_5, exento, iva_10, iva_5, total)`, `tax_document_lines(unit_price, amount)`, `retentions(base, amount)`, `bank_movements(amount)`. Actualizar `schema.ts` con `bigint({ mode: "number" })`; ajustar seed (`10000000`, sin `.0000`).
- [ ] **Step 4:** Reemplazar `parseFloat`/tolerancia 0,01 en `actions.ts` y `retentions-engine.ts` por enteros exactos (`assertMoney`); `calculateTaxFromTotal/FromBase` usan `ivaFromGross`.
- [ ] **Step 5:** Agregar a la suite de T2: un test que inserta línea con `debit=1000` y verifica tipo `bigint` en `information_schema.columns`. Verificar: `pnpm test` y `pnpm test:db` verdes; `grep -rn "parseFloat" apps/web/src/lib apps/web/src/trpc packages/ledger` sin resultados en el flujo contable.
- [ ] **Step 6:** Commit `feat(money): integer money end to end`.

### Task 4: RUC y CDC con módulo 11 estándar

**Files:** Modify `packages/ledger/src/fiscal-py.ts`, `apps/web/src/lib/cdc-generator.ts`; Test `apps/web/src/__tests__/fiscal-py.test.ts`.

**Interfaces:**
- Produces: `mod11Dv(digits: string): number` (exportada desde `fiscal-py`); `validateRuc` valida DV para cuerpos de 6 a 8 dígitos (personas físicas y jurídicas); `validateCDC` y `validateCDCStructure` verifican el DV del dígito 44 con `mod11Dv(primeros 43)`.

- [ ] **Step 1: Tests primero.** RUC válidos: `80144114-5`, `80005427-0`, `80120610-3`, `80014066-4`, `4631314-1`. Inválidos: `80144114-4`, `4631314-2`. CDC válido `01800140664024004004999422026080911264669314`; con último dígito cambiado, inválido. `80150377-9` (confirmado por Gustavo) también válido; `80150477-9` inválido (DV esperado 5). Ejecutar: FAIL.
- [ ] **Step 2:** Implementar `mod11Dv` (resto ≤ 1 → 0, si no 11 − resto) y usarla en los tres validadores; eliminar `calculateRucCheckDigit` y el cálculo propio de `cdc-generator.ts`.
- [ ] **Step 3:** Verificar `pnpm test` verde (ajustar vectores previos que dependían del algoritmo erróneo; el seed `80012345-1` pasa a `80012345-0`, actualizar `seed.ts` y fixtures).
- [ ] **Step 4:** Commit `fix(fiscal): DNIT mod-11 for RUC and CDC`.

### Task 5: Parser SIFEN v150 real (servidor)

**Files:** Create `apps/web/src/__fixtures__/sifen/fac_024-004-0049994.xml` (copia anonimizada del XML real: receptor con nombre, email y RUC de prueba con DV válido), `packages/ledger/src/sifen.ts`; Modify `apps/web/src/lib/sifen-parser.ts` (delegar), `apps/web/package.json` (`fast-xml-parser`); Test `apps/web/src/__tests__/sifen.test.ts` con `// @vitest-environment node`.

**Interfaces:**
- Produces: `parseSifenDE(xml: string): Result<SifenDocument, string>` con `SifenDocument = { cdc: string; docType: "invoice"|"credit_note"|"debit_note"|"self_invoice"|"remito"; timbrado: string; number: string /* ###-###-####### */; issueDate: string /* YYYY-MM-DD */; currency: string; condition: "cash"|"credit"; issuer: { ruc: string; dv: number; name: string }; receiver: { ruc: string; dv: number; name: string }; gravado10: number; gravado5: number; exento: number; iva10: number; iva5: number; total: number; lines: { code: string; description: string; quantity: number; unitPrice: number; amount: number; ivaRate: 10|5|0 }[]; isElectronic: true }`.

- [ ] **Step 1: Test primero** con el fixture: `cdc` `01800140664024004004999422026080911264669314`; `timbrado` `16284685`; `number` `024-004-0049994`; `issueDate` `2026-08-09`; `currency` `PYG`; `condition` `cash`; `issuer` `{ruc:"80014066",dv:4,name:"SERVICIOS RAPIDOS DEL PARAGUAY S.A."}`; `gravado10` 58000, `iva10` 5273, `total` 58000; 2 líneas con `amount` 12000 y 46000. Caso extra: `2026-08-09T23:59:59` → `issueDate` `2026-08-09` (cadena, sin `Date`). Caso: XML inválido → `Err`. Ejecutar: FAIL.
- [ ] **Step 2:** Implementar con `fast-xml-parser` leyendo las etiquetas reales (`dNumTim`, `dEst`, `dPunExp`, `dNumDoc`, `dFeEmiDE`, `cMoneOpe`, `iCondOpe`, `dRucEm`, `dDVEmi`, `dNomEmi`, `dRucRec`, `dDVRec`, `dNomRec`, `gCamItem`, `dSub10`, `dSub5`, `dSubExe`, `dIVA10`, `dIVA5`, `dTotGralOpe`, `iTiDE`). Montos con `Math.round`. `shortcut: solo tipos de DE 1 (factura), 4 (autofactura), 5/6 (NC/ND), 7 (remito); otros devuelven Err`.
- [ ] **Step 3:** `sifen-parser.ts` pasa a usar `parseSifenDE`; quitar `DOMParser`. Actualizar `sifen/page.tsx` si cambia la forma. Verificar: tests de T5 verdes y `grep -rn DOMParser apps/web/src` sin resultados.
- [ ] **Step 4:** Commit `feat(sifen): real v150 parser, server-side`.

### Task 6: Identidad en BD (migración `0003_identity`)

**Files:** Create `packages/ledger/db/migrations/0003_identity.sql`; Modify `schema.ts`, `packages/ledger/db/test-db.ts`; Test `apps/web/src/__tests__/db/identity.test.ts`.

**Interfaces:**
- Produces: tablas de Better Auth (`users`, `sessions`, `accounts_auth`, `verifications`, `two_factors`; nombres según el generador del CLI), `memberships(user_id, entity_id, role, permissions jsonb, primary key (user_id, entity_id))`, `app_user_id() returns uuid`, `create_entity(p_ruc text, p_legal_name text, p_trade_name text, p_tax_regimes text[], p_base_currency text) returns uuid` (SECURITY DEFINER).

- [ ] **Step 1: Tests primero:** `usuario A no ve membresías de B`; `create_entity crea empresa y membresía admin del usuario de app.user_id`; `create_entity sin app.user_id falla`; tras crear, la empresa es visible en esa misma transacción (la función suma el id a `app.entity_ids`); `rol app no puede insertar en entities directamente`.
- [ ] **Step 2:** Generar el esquema de Better Auth con su CLI y volcarlo a `schema.ts` + migración; agregar `memberships` con RLS `user_id = app_user_id()`; `create_entity` valida el DV del RUC con la misma regla (T4) en SQL o lo delega al llamador (`shortcut: validación de RUC solo en TS`). El arnés otorga `DELETE` a `t_app` sobre las tablas de sesión.
- [ ] **Step 3:** Verificar `pnpm test:db` verde. Commit `feat(db): identity, memberships, create_entity`.

### Task 7: Better Auth, login con 2FA, middleware y procedimientos protegidos

**Files:** Create `apps/web/src/lib/auth.ts`, `apps/web/src/app/api/auth/[...all]/route.ts`; Modify `apps/web/src/app/(auth)/login/page.tsx`, `apps/web/src/middleware.ts`, `apps/web/src/trpc/trpc.ts`, `apps/web/src/app/api/trpc/[trpc]/route.ts`, `apps/web/package.json`; Delete `apps/web/src/lib/supabase/*`, `apps/web/src/lib/auth-store.ts` (mocks), dependencias `@supabase/*`; Test `apps/web/e2e/auth.spec.ts`.

**Interfaces:**
- Produces: `auth` (instancia Better Auth, adapter Drizzle, plugin `twoFactor`, email+contraseña, sin verificación de email); `getSession(headers): Promise<{ userId: string } | null>`; en tRPC `Context = { userId?: string; requestId: string }` y `protectedProcedure` que lanza `UNAUTHORIZED` sin `userId`.

- [ ] **Step 1: Test e2e primero:** sin sesión `GET /asientos` redirige a `/login`; login con usuario de prueba entra; admin sin TOTP configurado es forzado a configurarlo. Script `scripts/create-admin.ts` (crea usuario por CLI; también sirve para restablecer contraseñas).
- [ ] **Step 2:** Implementar según la documentación vigente de Better Auth (verificarla al implementar). Middleware: sin cookie de sesión → `/login` (excepto `/login`, `/api/auth`, `/api/health`). Todos los routers tRPC existentes pasan de `publicProcedure` a `protectedProcedure`, salvo `health`.
- [ ] **Step 3:** Verificar e2e verde y `pnpm test`. Commit `feat(auth): better-auth with password + TOTP`.

### Task 8: Alcance de tenant desde la sesión

**Files:** Modify `packages/ledger/db/index.ts`, `apps/web/src/trpc/trpc.ts`, `apps/web/.env.local`/`.env.example` (quitar `DEV_ENTITY_IDS`); Test `apps/web/src/__tests__/db/tenant.test.ts`.

**Interfaces:**
- Consumes: `memberships`, `app_user_id()` (T6), `Context.userId` (T7).
- Produces: `withTenant<T>(userId: string, fn: (db: Db) => Promise<T>): Promise<T>` (punto de entrada; los routers y los server actions de `actions.ts` lo usan, estos últimos obteniendo `userId` con un helper `requireUser()` basado en `headers()`) y `tenantDb<T>(fn): Promise<T>` (uso interno de `repository.ts`/usecases: reutiliza la transacción del contexto y **lanza** si no hay contexto, fail-closed) — abre transacción, fija `app.user_id`, lee `memberships` y fija `app.entity_ids`; `setTenantResolver` y `DEV_ENTITY_IDS` eliminados. Las funciones de `repository.ts` reciben el `Db` o usan el `AsyncLocalStorage` existente dentro de `withTenant`; los routers envuelven cada procedimiento con `ctx.userId`.

- [ ] **Step 1: Tests primero:** usuario A con membresía en E1 ve solo E1; usuario sin membresías ve vacío; llamada sin sesión → `UNAUTHORIZED`; `app.user_id` queda fijado (lo lee `audited` en T11).
- [ ] **Step 2:** Implementar y adaptar routers. Verificar: `grep -rn DEV_ENTITY_IDS .` sin resultados; `pnpm test:db` y e2e verdes.
- [ ] **Step 3:** Commit `feat(tenant): scope from session memberships`.

### Task 9: Empresas, plan de cuentas y períodos persistentes

**Files:** Modify `apps/web/src/trpc/routers/entities.ts`, `accounts.ts`, `apps/web/src/app/empresas/page.tsx`, `apps/web/src/app/cuentas/page.tsx`, `packages/ledger/db/repository.ts`; Reuse `apps/web/src/lib/chart-of-accounts.ts` como semilla.

**Interfaces:**
- Produces: `entities.create({ ruc, legalName, tradeName?, taxRegimes: string[], baseCurrency }) → { id }` (llama `create_entity`, crea COA `fiscal_py` con cuentas seed y el período del mes actual `open`); `entities.list`, `accounts.tree`.

- [ ] **Step 1: Tests primero (BD):** crear empresa con RUC de DV inválido → error; con RUC válido → existen COA, cuentas seed y 1 período abierto; recargar (`entities.list`) conserva los datos.
- [ ] **Step 2:** Implementar; reemplazar el store local de `empresas` y `cuentas` por tRPC (TanStack Query). El selector de empresa activa (`Cmd+E`) sigue en Zustand pero con ids reales.
- [ ] **Step 3:** Verificar tests y navegación manual. Commit `feat(entities): persistent companies, chart of accounts, periods`.

### Task 10: Terceros persistentes con RUC validado

**Files:** Modify `routers/partners.ts`, `app/terceros/page.tsx` (hoy 13 líneas), `repository.ts`.

**Interfaces:** Produces `partners.create({ entityId, kind, ruc, legalName, ... }) → { id }`, `partners.list`, `partners.update` (único por `(entity_id, ruc)`).

- [ ] **Step 1: Tests primero:** RUC con DV inválido → error; duplicado en la misma empresa → error; el mismo RUC en otra empresa → permitido; usuario de E2 no lista terceros de E1.
- [ ] **Step 2:** Implementar tRPC + página (tabla + modal), reutilizando `validateRuc` (T4). Commit `feat(partners): persistent partners with RUC validation`.

### Task 11: Auditoría automática y casos de uso de posteo/reversión

**Files:** Create `packages/ledger/db/audit.ts`, `packages/ledger/src/usecases/post-entry.ts`, `reverse-entry.ts`; Modify `repository.ts` (quitar `createPostedEntry` → usecase), `actions.ts`, `routers/journal-entries.ts`; Test `apps/web/src/__tests__/db/usecases.test.ts`.

**Interfaces:**
- Produces: `audited<T>(db: Db, ev: { entityId: string; action: string; targetType: string; targetId?: string; before?: unknown; after?: unknown; reason?: string }, fn: () => Promise<T>): Promise<T>` (inserta en `audit_events` con `actor_id = app.user_id` en la misma transacción); `postEntry(input: PostEntryInput): Promise<Result<JournalEntry, string>>`; `reverseEntry(entryId: string, reason: string): Promise<Result<JournalEntry, string>>`.

- [ ] **Step 1: Tests primero:** `postEntry` desbalanceado → `Err` con el mensaje del trigger; posteo exitoso deja 1 fila `journal_entry.posted` con `actor_id`; `reverseEntry` crea asiento con líneas invertidas, `reversal_of`, estado `posted` y evento `journal_entry.reversed`; **segunda reversión** del mismo asiento → `Err`; reversión en período cerrado sin flag → `Err`; test de cobertura que recorre los usecases mutadores y falla si alguno no emite evento.
- [ ] **Step 2:** Implementar; el estado "reversado" en la UI se deriva de la existencia del contra-asiento (consulta). Reemplazar el stub `reverse` del router.
- [ ] **Step 3:** Verificar cobertura ≥ 90 % en `usecases`. Commit `feat(ledger): audited post/reverse use cases`.

### Task 12: Idempotencia (migración `0004_audit_idempotency`)

**Files:** Create `0004_audit_idempotency.sql`, `apps/web/src/trpc/idempotent.ts`; Modify `trpc.ts`, `apps/web/src/lib/trpc-hooks.ts`; Test `apps/web/src/__tests__/db/idempotency.test.ts`.

**Interfaces:** Produces tabla `idempotency_keys(user_id, endpoint, key, request_hash, response jsonb, created_at, primary key (user_id, endpoint, key))` y `idempotentProcedure = protectedProcedure.use(...)` que exige el encabezado `Idempotency-Key`.

- [ ] **Step 1: Tests primero:** misma clave y mismo cuerpo → devuelve la primera respuesta y existe 1 asiento; misma clave con cuerpo distinto → 422; sin clave → 400; dos llamadas concurrentes con la misma clave → 1 asiento.
- [ ] **Step 2:** Implementar (insertar clave primero con `ON CONFLICT DO NOTHING`; el cliente genera un UUID por intento de UI). Aplicar a todos los procedures mutadores. Commit `feat(api): idempotency keys`.

### Task 13: Columnas del Registro de Comprobantes y timbrados (migración `0005`)

**Files:** Create `0005_registro_comprobantes.sql`; Modify `schema.ts`; Test `apps/web/src/__tests__/db/documents-schema.test.ts`.

**Interfaces:** Produces en `tax_documents`: `doc_code int` (Tabla 4: 101–112, 201–211), `counterparty_id_type int` (Tabla 3), `imputa_iva/imputa_ire/imputa_irp/no_imputa boolean`, `foreign_currency boolean`, `related_number varchar(20)`, `related_timbrado varchar(8)`, `is_electronic boolean`, índice único `(entity_id, cdc) where cdc is not null`; tabla `timbrados(id, entity_id, partner_id null, number varchar(8), valid_from date, valid_to date, establishment, point, doc_code int)` con RLS por `entity_id`.

- [ ] **Step 1: Tests primero:** duplicado `(entity_id, cdc)` → violación única; `timbrados` aislada por empresa.
- [ ] **Step 2:** Migración + `schema.ts` (también sincronizar `journal_entries.status notNull` y FKs de `reversal_of/version_of` ya existentes solo en SQL). Commit `feat(db): registro de comprobantes columns and timbrados`.

### Task 14: Ingesta de XML SIFEN (validar, deduplicar, guardar)

**Files:** Create `packages/ledger/src/usecases/ingest-document.ts`; Modify `routers/tax-documents.ts` (`ingestXml`), `app/sifen/page.tsx`; Test `apps/web/src/__tests__/db/ingest.test.ts`.

**Interfaces:**
- Consumes: `parseSifenDE` (T5), `validateRuc`/`validateCDC` (T4), `timbrados` (T13).
- Produces: `ingestDocument(entityId: string, direction: "received"|"issued", xml: string): Promise<Result<{ documentId: string; warnings: string[] }, string>>`.

- [ ] **Step 1: Tests primero:** fixture válido → crea `tax_documents` + 2 `tax_document_lines`, `is_electronic = true`, montos enteros; **mismo XML dos veces** → segundo devuelve el mismo `documentId` sin duplicar; RUC con DV inválido → `Err`; `iva10` que no cuadra con `round(gravado10/11)` → warning; timbrado vencido a la fecha de la operación → warning (o error si hay `timbrados` cargado y no vigente); XML de otro receptor distinto de la empresa → warning.
- [ ] **Step 2:** Implementar con `audited` (T11). Guardar el `SifenDocument` completo en `tax_documents.metadata.sifen` (lo consume T15). Subida múltiple en la página (varios archivos). Commit `feat(documents): ingest SIFEN XML with validation and dedupe`.

### Task 15: IA local y aprobación de asientos

**Files:** Create `packages/ledger/src/ai/provider.ts`, `ollama.ts`; Modify `apps/web/src/lib/ai-provider.ts` (re-export), `routers/tax-documents.ts` (`suggestEntry`, `approveEntry`), `app/sifen/page.tsx`; env `OLLAMA_URL`, `OLLAMA_MODEL`; Test `apps/web/src/__tests__/ai.test.ts`.

**Interfaces:**
- Produces: `interface AIProvider { suggestEntry(doc: SifenDocument, accounts: AccountRef[]): Promise<Suggestion> }`, `Suggestion = { lines: { accountId: string; debit: number; credit: number; description: string }[]; confidence: number /* 0..1 */; rationale: string; sources: string[]; provider: "rules" | "ollama" }`, `RuleBasedProvider`, `OllamaProvider({ url, model, timeoutMs = 20000 })`, `suggestWithFallback(doc, accounts): Promise<Suggestion>` (reglas primero; Ollama solo si `confidence < 0.8`).

- [ ] **Step 1: Tests primero** (fetch simulado): reglas con confianza ≥ 0.8 no llaman a Ollama; baja confianza → llama a `/api/chat` con `format: "json"` y valida la respuesta con zod; **timeout, error de red y JSON inválido** → devuelve el resultado por reglas con `rationale` que lo indica; el asiento sugerido siempre balancea (si no, se descarta y se usa reglas).
- [ ] **Step 2:** Implementar; guardar cada propuesta en `ai_decisions` (input, output, confianza) y marcar `accepted/acceptedBy` al aprobar; `approveEntry` llama `postEntry` (T11) y setea `tax_documents.journal_entry_id`. UI: mostrar confianza, razón, fuentes y botones Aprobar/Editar/Rechazar.
- [ ] **Step 3:** Medir latencia con `qwen2.5:3b` y `qwen2.5:7b` sobre el fixture en `dev-server` y registrar el resultado en el PR (decide el modelo por defecto). Commit `feat(ai): local Ollama provider with rule-based fallback`.

### Task 16: Comprobante manual con retenciones

**Files:** Modify `apps/web/src/lib/retentions-engine.ts`, `routers/tax-documents.ts` (`createManual`), `app/asientos/nuevo/page.tsx` o nueva `app/documentos/nuevo/page.tsx`; Test `apps/web/src/__tests__/retentions-engine.test.ts`.

**Interfaces:** Consumes `calculateRetentions(params)` y `getRetentionJournalLines(...)` existentes (ahora con enteros, T3). Produces `taxDocuments.createManual({ entityId, doc, retentions? }) → { documentId, entryId? }`.

- [ ] **Step 1: Tests primero:** compra de 11.000.000 a proveedor con perfil de retención IVA 30 % → retención calculada entera, línea de "Retenciones a Pagar" en el asiento y filas en `retentions`; sin perfil → sin retención; monto bajo el mínimo → sin retención.
- [ ] **Step 2:** Cablear el motor al alta manual (los comprobantes manuales llevan `doc_code`, `counterparty_id_type`, imputaciones y `is_electronic = false`, que consume T19) y verificar cobertura ≥ 90 % del motor. Commit `feat(documents): manual entry with withholding engine`.

### Task 17: Libros reales (migración `0006_calendar_views`, parte vistas)

**Files:** Create `0006_calendar_views.sql`, `routers/reports.ts` (`diario`, `mayor`, `sumasSaldos`, `libroIva`); Modify `app/libros/page.tsx` (quitar `MOCK_*`), `app/reportes/page.tsx`; Test `apps/web/src/__tests__/db/books.test.ts`.

**Interfaces:** Produces vistas `v_diario`, `v_mayor`, `v_sumas_saldos`, `v_libro_iva` (filtradas por RLS) y tRPC `reports.libroIva({ entityId, year, month, side: "compras"|"ventas" }) → { rows: { documentId: string; entryId: string|null; date: string; number: string; counterparty: string; gravado10: number; gravado5: number; exento: number; iva10: number; iva5: number; total: number }[]; totals: {...} }`.

- [ ] **Step 1: Tests primero:** con el fixture ingestado y posteado, `libroIva` compras de agosto 2026 = 1 fila (58.000 / 5.273); sumas y saldos balancea (debe = haber); usuario de otra empresa ve vacío; cada fila trae `entryId` para el drill-down.
- [ ] **Step 2:** Implementar vistas y routers; las páginas muestran datos reales con enlaces al asiento y al comprobante. Commit `feat(books): real journal, ledger, trial balance, VAT book`.

### Task 18: Formulario 104

**Files:** Modify `routers/fiscal.ts` (`form104`), `app/fiscal/formulario-104/page.tsx`; Test `apps/web/src/__tests__/db/form104.test.ts`.

**Interfaces:** Consumes `reports.libroIva` (T17). Produces `fiscal.form104({ entityId, year, month }) → { debitoFiscal: number; creditoFiscal: number; saldo: number; ventas: Totals; compras: Totals }`.

- [ ] **Step 1: Tests primero:** `form104.creditoFiscal === libroIva(compras).totals.iva10 + iva5` y `debitoFiscal` análogo para ventas, para un mes con compras y ventas; mes sin movimientos → ceros.
- [ ] **Step 2:** Implementar reutilizando las vistas (sin recalcular a mano); quitar `hechauka.ts` como fuente de datos de la página. Commit `feat(fiscal): form 104 from VAT book`.

### Task 19: Registro de Comprobantes 955 (archivo `.zip`)

**Files:** Create `packages/ledger/src/registro-comprobantes.ts`, `apps/web/src/app/api/registro/[entityId]/[period]/route.ts`, `apps/web/src/app/fiscal/registro-comprobantes/page.tsx`; Delete `apps/web/src/lib/hechauka.ts` y `app/fiscal/hechauka`; Modify `apps/web/package.json` (`fflate`); Test `apps/web/src/__tests__/registro-comprobantes.test.ts`.

**Interfaces:**
- Produces: `buildRegistro(input: { ruc: string; year: number; month: number; docs: RegistroDoc[] }): { files: { name: string; csv: string }[]; errors: { documentId: string; message: string }[] }`; `zipRegistro(files): Uint8Array`. `RegistroDoc` incluye `docCode`, `side: "ventas"|"compras"`, contraparte, fecha `YYYY-MM-DD`, timbrado, número, gravados, exento, total, condición, imputaciones, asociado y `isElectronic`.

- [ ] **Step 1: Tests primero (filas exactas del PDF, delimitador `;`):** ventas → `1;11;80024627;MINISTERIO DE HACIENDA;109;05/05/2021;11138251;001-002-0000250;3630000;0;0;3630000;1;N;S;N;N;;`; compras → `2;11;80024627;MINISTERIO DE HACIENDA;109;05/05/2021;11223369;001-002-0000250;100000;0;0;100000;1;N;S;S;N;N;;`. Nombre de archivo `80000000_REG_012021_V0001`. Documentos con `isElectronic` **excluidos**. Total ≠ suma de montos → `errors`. Nota de crédito (110) sin comprobante asociado → `errors`. Fecha anterior a 01/01/2021 de contado → `errors`. 5.001 filas → dos archivos `V0001` y `V0002`. Razón social con `;` o `"` → saneada (se reemplaza el delimitador por espacio). Fecha `2026-08-09` → `09/08/2026` sin `Date`.
- [ ] **Step 2:** Implementar; `const DELIMITER = ";" // shortcut: el PDF dice comas pero sus ejemplos usan ';', confirmar con importación real en Marangatu`. Ruta de descarga y página con vista previa de errores.
- [ ] **Step 3:** Prueba manual: importar el `.zip` generado en Marangatu (ambiente de prueba) y anotar el resultado en el PR; ajustar `DELIMITER` si corresponde. Commit `feat(fiscal): registro de comprobantes 955 exporter`.

### Task 20: Calendario fiscal y avisos

**Files:** Create `0007_tax_calendar.sql` (tabla `tax_calendar`; no se edita una migración ya aplicada), `apps/web/src/lib/fiscal-calendar.ts`, `routers/fiscal.ts` (`upcoming`), `app/calendario/page.tsx`, `components/top-bar.tsx`; Test `apps/web/src/__tests__/fiscal-calendar.test.ts`.

**Interfaces:** Produces `tax_calendar(entity_id, regime, period, due_date)` generado al crear empresa y cada mes; `fiscal.upcoming({ entityId, days }) → { regime, period, dueDate, daysLeft, level: "7"|"3"|"1" }[]`.

- [ ] **Step 1: Tests primero:** vencimiento IVA según último dígito del RUC (reutilizar `getVencimientoIVA`); `upcoming` a 7, 3 y 1 días devuelve el nivel correcto; aislado por empresa.
- [ ] **Step 2:** Implementar y mostrar avisos reales en la campana. Commit `feat(calendar): persisted tax calendar and 7/3/1 notices`.

### Task 21: Logs estructurados

**Files:** Create `apps/web/src/lib/logger.ts`; Modify `trpc.ts`, `api/trpc/[trpc]/route.ts`; Test `apps/web/src/__tests__/logger.test.ts`.

**Interfaces:** Produces `logger` (pino) y `Context.requestId`; cada línea de procedure incluye `requestId`, `userId`, `entityId` (si hay), `path`, `durationMs`.

- [ ] **Step 1:** Test: un procedure que lanza error produce una línea JSON con `requestId` y sin datos sensibles (contraseñas, claves). **Step 2:** Implementar. Commit `feat(obs): structured logs with request context`.

### Task 22: CI con gates reales

**Files:** Modify `.github/workflows/ci.yml`, `apps/web/vitest.config.ts`, `apps/web/package.json`.

- [ ] **Step 1:** Lint sin `|| true`; `typecheck`; `test` con cobertura v8 y umbral 90 % en `packages/ledger/src/**` y `retentions-engine.ts`; job `db-tests` con servicio `postgres:16` y `TEST_ADMIN_URL`; job `e2e` con Playwright que levanta la app y corre `slice.spec.ts`; `pnpm install --frozen-lockfile` (el lockfile ya está versionado, T1).
- [ ] **Step 2:** Abrir PR de prueba y verificar que fallan los tres gates cuando se rompe a propósito un test, un lint y la cobertura. Commit `ci: real lint, coverage, db and e2e gates`.

### Task 23: Honestidad de UI y documentación

**Files:** Modify `apps/web/src/components/sidebar.tsx`, páginas fuera de alcance (banner "Vista previa"), `README.md`, `docs/API.md`, `CLAUDE.md`, `DATA_MODEL.md`, `FISCAL_PY_RULES.md`, `docs/STARTUP.md`.

- [ ] **Step 1:** Config de navegación con `preview: true` para `activos, banco, cierre, cobros-pagos, cuentas-corrientes, rg90, multimoneda, portal, auditoria, documentos, importar, impuestos` (ocultas por defecto, visibles con un interruptor en Configuración); cada una muestra un aviso "Vista previa — datos de ejemplo".
- [ ] **Step 2:** Documentar: dinero entero (regla 9 de `CLAUDE.md` y `DATA_MODEL.md`), modelos locales de IA (nueva regla en `CLAUDE.md`), Registro de Comprobantes en lugar de Hechauka (`FISCAL_PY_RULES.md`), formularios 104/106/500v3/120 (no 703/1301/115), auth sin magic link, despliegue en `dev-server`. Verificar con un `grep -rn "Supabase\|Hechauka\|703\|1301" README.md docs CLAUDE.md` revisado a mano. Commit `docs: align with approved spec`.

### Task 24: Despliegue en `dev-server` (Coolify) y backups

**Files:** Create `apps/web/Dockerfile`, `infra/deploy/README.md`, `infra/backup/pg-backup.sh` + unidad systemd/cron; Modify `apps/web/next.config.mjs` (`output: "standalone"`).

- [ ] **Step 1:** `Dockerfile` multi-etapa para pnpm monorepo. Colocar `intelicont-pg` y la app en la red `intelicont-net`; `DATABASE_URL` apunta a `intelicont-pg:5432` con el rol `intelicont_app`; `OLLAMA_URL=http://host.docker.internal:11434` (`extra_hosts`). Crear la app en Coolify (repositorio GitHub ya conectado), variables de entorno, health check `/api/health`. Dominio: el que indique Gustavo; mientras tanto la IP de Tailscale. Verificar: `curl http://<host>/api/health` → `ok` y login funciona desde el Mac.
- [ ] **Step 2:** Verificar desde el contenedor que Ollama responde (`curl $OLLAMA_URL/api/tags`); si el firewall lo bloquea, abrir solo para la red Docker.
- [ ] **Step 3:** Backups: `pg_dump -Fc` diario a `/var/backups/intelicont` (retención 14 días) más copia fuera del servidor al destino que elija Gustavo; prueba de restauración en una base descartable documentada en `infra/backup/README.md`. Commit `ops: deploy and backups on dev-server`.

### Task 25: E2E de la rebanada

**Files:** Create `apps/web/e2e/slice.spec.ts`.

- [ ] **Step 1:** Un solo test que recorre los 8 pasos del §2 del spec sobre una base descartable: login con 2FA, crear empresa con el RUC del receptor anonimizado del fixture (T5), subir el fixture XML, aprobar la propuesta (Ollama simulado → reglas), ver Libro IVA (58.000 / 5.273), Form 104 igual al libro, descargar el `.zip` del Registro (que **no** contiene el comprobante electrónico: se agrega además una compra manual no electrónica y es la que aparece), revertir el asiento y ver los dos eventos en auditoría.
- [ ] **Step 2:** Verificar que corre en CI (T22) y en local: `pnpm test:e2e` verde. Commit `test(e2e): vertical slice end to end`.

---

## Self-review (hecha contra el spec)

- Cobertura: D1→T6–T7, D2→T6/T8, D3→T11, D4→T12, D5→T15, D6→T3, D7→T11/T14 (casos de uso en `packages/ledger/src/usecases`; `shortcut`: los módulos `src/modules/*` del spec se crean solo si una pantalla lo necesita), D8→T4/T19, D9→T13/T14, D10→T11, D11→T17, D12→T24. W0–W13 mapeadas: W0→T3, W1→T7, W2→T6/T8, W3→T9/T10, W4→T11, W5→T12, W6→T5/T13–T15, W7→T16, W8→T17, W9→T18/T19, W10→T20, W11→T21, W12→T22, W13→T23.
- Tipos consistentes: `SifenDocument` (T5) lo usan T14 y T15; `Result<T, string>` es el de `packages/core`; `withTenant(userId, fn)` (T8) lo usan T9–T20; `audited` (T11) lo usan T14–T16.
- Pendientes que bloquean tareas: DV de `80150477-9` (T4, test en `skip`), dominio (T24), importación de prueba en Marangatu (T19 paso 3), XML de nota de crédito/crédito/moneda extranjera (mejoran T5/T14, no bloquean).
