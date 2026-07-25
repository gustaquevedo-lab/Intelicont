# Roadmap de Implementación — InteliCont & Especialización ESFL

Este roadmap consolida la evolución de **InteliCont** incorporando el vertical estratégico de **Entidades Sin Fines de Lucro (ESFL)** en Paraguay (Fundaciones, ONGs, Clubes, Asociaciones, Entidades con Fondos Públicos PGN / CGR) y el camino definitivo para la **Salida a Producción**.

---

## 🏛️ Fase 1: Arquitectura Multitenant & Especialización ESFL (Meses 1 - 2)

### 1.1 Redefinición del Core Ledger para Doble Entorno (Comercial vs ESFL)
- [x] **Data Model Extension:**
  - `entities.entity_type`: `COMMERCIAL` | `NON_PROFIT_NGO` | `NON_PROFIT_PUBLIC` | `ASSOCIATION`.
  - Creación de tablas `projects`, `grants` (convenios) y `project_budget_lines` para control de ejecución de donantes/estado.
  - Tabla de referencia del **Clasificador Presupuestario PGN / CGR (Objetos del Gasto)**.
- [ ] **Plan de Cuentas Nivel ESFL (Seed PY):**
  - Incorporar el Plan de Cuentas estandarizado para Organizaciones Sin Fines de Lucro (cuentas de Fondo Institucional, Patrimonio Social, Aportes/Donaciones Exoneradas).
- [ ] **Motor de Proporcionalidad de IVA (RG90 Exentas/Parciales):**
  - Tratamiento del IVA Crédito Fiscal: prorrateo automático a gasto en actividades exoneradas.

### 1.2 IA Inteligente para Ingesta SIFEN en ESFL
- [x] **Triple Imputación con Claude (Anthropic API):**
  - 1. Cuenta Contable (`5.1.02.01 Capacitaciones`)
  - 2. Tratamiento Fiscal (`Exento` / `Prorrateado` / `Agente Retención`)
  - 3. Proyecto Donante + Objeto del Gasto PGN (`OG 210 Pasajes y Viáticos`)
- [x] **Validación de Reglas de Convenio/Donante:**
  - Alerta de tope de gastos o ítems no elegibles según el convenio.

---

## 🚀 Fase 2: Módulo de Rendición de Cuentas & Fondos Públicos (Meses 2 - 3)

### 2.1 Rendición CGR / MEF (Contraloría General de la República)
- [x] Exportador de **Formulario de Rendición de Cuentas PGN** en 1-click.
- [x] Matriz de Trazabilidad: `CDC SIFEN` → `Asiento Contable` → `Objeto del Gasto PGN` → `Orden de Pago / Bancos`.

### 2.2 Estados Financieros de Entidades Sin Fines de Lucro
- [ ] **Estado de Variación del Patrimonio Neto / Ingresos y Gastos** (Superávit/Déficit en vez de Pérdidas y Ganancias).
- [ ] **Estado de Origen y Aplicación de Fondos** (Exigido por auditorías internacionales y donantes).

---

## 🚂 Fase 3: Migración a Railway + Infraestructura de Producción (Mes 3)

### 3.1 Transición Supabase → Railway (Full Ownership)
- [x] **PostgreSQL en Railway:**
  - Provisionamiento de PostgreSQL 16 de alta disponibilidad (HA) con backups automáticos en Railway y migración de esquemas efectuada.
- [x] **Migración de Autenticación & Storage:**
  - Sustituir Supabase Auth por **Lucia Auth / NextAuth (Auth.js)** o **Clerk** corriendo sobre PostgreSQL propio.
  - Migrar Supabase Storage a **AWS S3 / Cloudflare R2** para los adjuntos XML y comprobantes SIFEN.
- [x] **Workers & Background Jobs:**
  - Iniciar cluster de **Trigger.dev / Inngest** en Railway para procesar XMLs masivos y jobs de Hechauka en background.

### 3.2 Seguridad y Performance
- [ ] Conexión vía **Prisma / Drizzle ORM** a través de **PgBouncer** / Connection Pooler en Railway.
- [ ] Configuración de dominios, SSL y variables de entorno por staging/production en Railway.

---

## 🎯 Fase 4: Cierre Fiscal PY + Testing e2e (Mes 4)

### 4.1 Cobertura Tributaria Paraguay (Comercial + ESFL)
- [ ] **Libros Electrónicos:** Hechauka (RG90), Libro IVA Compras/Ventas.
- [ ] **Formularios DNIT/SET:**
  - Formulario 104 (IVA).
  - Formulario 500v3 (IRE General) / 501v2 (IRE Simple).
  - Formulario de Declaración Jurada para ESFL Exoneradas.

### 4.2 Verificación y Cobertura de Tests
- [x] Tests unitarios y de integración en `@intelicont/ledger` con Vitest ($\ge 90\%$ cobertura).
- [x] Suite e2e en **Playwright**: Flujo completo de Ingesta XML SIFEN → Asiento IA → Libro IVA → Reporte CGR.

---

## 🏁 Fase 5: Salida a Producción & Onboarding de Estudios y ONGs (Mes 5)

- [x] **Despliegue Final en Railway + Vercel (o Railway All-in-One):**
  - Next.js 15 en Vercel / Railway Edge + PostgreSQL / Workers en Railway.
- [x] **Monitoreo & Observabilidad:**
  - Integración con **Sentry** (errores) y **PostHog** (analytics de uso en la app).
- [x] **Beta Privada:**
  - Lanzamiento controlado con 3 Estudios Contables y 2 ONGs/Fundaciones de referencia en Paraguay.
