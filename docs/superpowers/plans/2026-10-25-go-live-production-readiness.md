# Go-Live Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar y desplegar los módulos críticos faltantes para el lanzamiento comercial de InteliCont: Auto-Registro instantáneo (`/registro`), Emails Transaccionales (Resend/fallback), Recuperación de contraseñas (`/olvide-password`), Suscripciones B2B con SIPAP/QR (`/suscripcion`) y Aprobación en SuperAdmin.

**Architecture:** 
- Frontend Next.js 15 con componentes React + Tailwind para `/registro`, `/olvide-password` y `/suscripcion`.
- Backend con servicios modulares en `apps/web/src/lib` (`email-service.ts`, `registration-service.ts`, `subscription-service.ts`) expuestos vía Server Actions y tRPC.
- Persistencia relacional en PostgreSQL / Drizzle ORM con fallbacks deterministas para desarrollo y test.
- Enlace directo de los CTAs de la landing a `/registro` para convertir visitantes en clientes de prueba en 1 minuto.

**Architecture Diagram:**

```mermaid
graph TD
    subgraph "Landing & Conversión"
        A[Landing Page CTA 'Empezar gratis'] -->|Link directo| B[/registro Onboarding Instantáneo]
        C[Login Page] -->|Link 'Crear cuenta'| B
    end

    subgraph "Backend Services"
        B -->|Alta atómica| D[registration-service.ts]
        D -->|Crea Tenant Trial 14d| E[entities table]
        D -->|Crea Admin User| F[users table]
        D -->|Email Bienvenida| G[email-service.ts Resend/Fallback]
        H[/olvide-password] -->|Reset Token| G
    end

    subgraph "Suscripción B2B"
        I[/suscripcion Tenant] -->|Carga comprobante SIPAP| J[subscription-service.ts]
        J -->|Solicitud pendiente| K[Consola SuperAdmin /superadmin]
        K -->|Aprobar en 1-click| E
    end
```

**Tech Stack:** Next.js 15, React 19, TypeScript, TailwindCSS, Drizzle ORM, tRPC v11, Better-Auth, Resend API / Node console fallback.

**Spec:** [docs/superpowers/specs/2026-10-25-go-live-production-readiness-design.md](file:///Users/gustaquevedo/Library/CloudStorage/OneDrive-Personal/Dev/Intelicont/docs/superpowers/specs/2026-10-25-go-live-production-readiness-design.md)

## Global Constraints
- Row-Level Security (RLS) y aislamiento estricto por `entityId` en todos los nuevos endpoints.
- Compatibilidad dual: Base de datos real PostgreSQL + Mock mode in-memory para tests unitarios ultrarrápidos.
- Zero dependencias pesadas innecesarias (respetar directriz Ponytail).
- 100% de la suite de tests en verde antes de cada commit.

---

### Task 1: Servicio de Email Transaccional y Recuperación de Contraseñas

**Files:**
- Create: `apps/web/src/lib/email-service.ts`
- Create: `apps/web/src/__tests__/email-service.test.ts`
- Create: `apps/web/src/app/(auth)/olvide-password/page.tsx`
- Modify: `apps/web/src/app/(auth)/login/page.tsx`

**Interfaces:**
- Produces: `sendWelcomeEmail(to, name, entityName, trialDays): Promise<{ success: boolean; id?: string }>`
- Produces: `sendPasswordResetEmail(to, resetUrl): Promise<{ success: boolean; id?: string }>`
- Produces: `sendFiscalAlertEmail(to, entityName, obligation, dueDate): Promise<{ success: boolean; id?: string }>`

- [x] **Step 1: Escribir el test unitario para email-service**
- [x] **Step 2: Ejecutar test y verificar que falla (Red)**
- [x] **Step 3: Implementar email-service.ts con Resend y fallback a consola**
- [x] **Step 4: Ejecutar test y verificar que pasa (Green)**
- [x] **Step 5: Crear página /olvide-password y enlazar en login/page.tsx**
- [x] **Step 6: Commit de Task 1**

---

### Task 2: Auto-Registro Instantáneo de Tenants (`/registro`)

**Files:**
- Create: `apps/web/src/lib/registration-service.ts`
- Create: `apps/web/src/__tests__/registration-service.test.ts`
- Create: `apps/web/src/app/(auth)/registro/page.tsx`
- Modify: `apps/web/src/middleware.ts` (añadir `/registro` y `/olvide-password` a `PUBLIC_PAGES`)
- Modify: `apps/web/public/landing/index.html` (apuntar botones "Empezar gratis" a `/registro`)
- Modify: `apps/web/src/app/(auth)/login/page.tsx` (añadir enlace "¿No tenés cuenta? Registrate gratis")

**Interfaces:**
- Produces: `registerSelfServiceTenant({ ruc, legalName, adminEmail, password, adminName? }): Promise<{ success: boolean; entity?: any; user?: any; error?: string }>`

- [x] **Step 1: Escribir test unitario para registration-service**
- [x] **Step 2: Ejecutar test y verificar que falla (Red)**
- [x] **Step 3: Implementar registration-service.ts (alta atómica con plan starter trial 14d)**
- [x] **Step 4: Ejecutar test y verificar que pasa (Green)**
- [x] **Step 5: Crear página /registro con diseño premium y validación RUC**
- [x] **Step 6: Actualizar middleware.ts, landing/index.html y login/page.tsx**
- [x] **Step 7: Commit de Task 2**

---

### Task 3: Gestión de Suscripciones B2B y Pagos SIPAP / QR

**Files:**
- Create: `apps/web/src/lib/subscription-service.ts`
- Create: `apps/web/src/__tests__/subscription-service.test.ts`
- Create: `apps/web/src/app/suscripcion/page.tsx`
- Modify: `apps/web/src/app/superadmin/page.tsx` (pestaña/sección de solicitudes de renovación SIPAP)
- Modify: `apps/web/src/app/superadmin/actions.ts`

**Interfaces:**
- Produces: `createPaymentOrder({ entityId, plan, amountGs, comprobanteRef, notas? }): Promise<{ success: boolean; order?: any }>`
- Produces: `listPendingOrders(): Promise<any[]>`
- Produces: `approvePaymentOrder(orderId, approvedBy): Promise<{ success: boolean }>`

- [x] **Step 1: Escribir test unitario para subscription-service**
- [x] **Step 2: Ejecutar test y verificar que falla (Red)**
- [x] **Step 3: Implementar subscription-service.ts**
- [x] **Step 4: Ejecutar test y verificar que pasa (Green)**
- [x] **Step 5: Crear página /suscripcion con planes, datos bancarios y carga de comprobante**
- [x] **Step 6: Integrar sección de aprobación de pagos en /superadmin**
- [x] **Step 7: Commit de Task 3**

---

### Task 4: Verificación Integral de Suite, Build y Despliegue

**Files:**
- Test: Todas las suites de prueba (`pnpm test`)
- Build: Compilación de producción (`next build`)
- Git: Sincronización y commit en `origin/main`

- [x] **Step 1: Ejecutar toda la suite de pruebas del monorepo (250+ tests)**
- [x] **Step 2: Ejecutar compilación de producción de Next.js (next build)**
- [x] **Step 3: Commit final consolidado y push a origin/main**
- [x] **Step 4: Resumen final de entrega con evidencia y <!-- GOAL_COMPLETE -->**
