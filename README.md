# InteliCont — SaaS Contable AI-First para Paraguay

Plataforma contable inteligente para estudios contables en Paraguay. Carga facturas electrónicas SIFEN, genera asientos contables con IA local, valida timbrados/RUC y emite libros contables oficiales y el Registro de Comprobantes (RG 90, Obligación 955) de la DNIT.

## 🚀 Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui |
| **API** | tRPC v11 (type-safe end-to-end, middleware de logging, mascarado de errores internos con `requestId`) |
| **Base de datos** | PostgreSQL 16 propio + Drizzle ORM + postgres-js + RLS (Row-Level Security) fail-closed |
| **Auth** | Better Auth (email + contraseña + TOTP obligatorio para administradores, sin magic links) |
| **IA** | Ollama local (`qwen2.5:7b` en servidor propio; fallback a reglas determinísticas; humano en el loop) |
| **Logging** | Pino (redacción de PII/valores SQL con `safeErrorInfo`) |
| **Despliegue** | Servidor propio (`dev-server` vía Coolify / Docker); Vercel solo para previews estáticos |

## 📦 Estructura del Monorepo

```
intelicont/
├── apps/
│   └── web/                   # Frontend Next.js 15, API routes y tRPC handlers
├── packages/
│   ├── core/                  # Dinero entero (Money/assertMoney), Result<T, E>, utilitarios puros
│   └── ledger/                # Schema Drizzle, migraciones, usecases contables y lógica fiscal PY
├── infra/                     # Configuraciones de despliegue y scripts de backup
├── docs/                      # Documentación de arquitectura, modelo, API y reglas fiscales
└── .superpowers/              # Ledgers y planes de implementación SDD
```

## 🛠️ Desarrollo Local

### Prerequisitos

- Node.js ≥ 22
- pnpm 12.14+ (configurado vía `packageManager` en `package.json`)
- Acceso a PostgreSQL 16 (vía túnel SSH al contenedor `intelicont-pg` en el dev-server, puerto local `5440`)
- Ollama local (opcional para desarrollo; fallback automático a reglas)

### Setup

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp apps/web/.env.example apps/web/.env.local
# Configurar DATABASE_URL apuntando al puerto del túnel (e.g. postgresql://intelicont_app:***@localhost:5440/intelicont)
# Generar BETTER_AUTH_SECRET con: openssl rand -base64 32

# 3. Para tests con base de datos efímera (test:db, test:cov, test:e2e):
# Configurar TEST_ADMIN_URL en apps/web/.env.test.local con rol con permisos CREATEDB (intelicont_testadmin)

# 4. Ejecutar migraciones
pnpm db:migrate

# 5. Cargar datos iniciales de prueba (empresa seed, plan de cuentas)
pnpm db:seed

# 6. Crear el primer usuario administrador con 2FA
pnpm auth:create-user

# 7. Iniciar servidor de desarrollo
pnpm dev
```

### Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Iniciar servidor Next.js en modo desarrollo |
| `pnpm build` | Compilar la aplicación para producción |
| `pnpm lint` | Ejecutar ESLint en todo el monorepo (`apps/web`, `packages/ledger`, `packages/core`) |
| `pnpm test` | Ejecutar pruebas unitarias puras con Vitest |
| `pnpm test:db` | Pruebas de integración con base de datos efímera aislada (`TEST_ADMIN_URL`) |
| `pnpm test:cov` | Cobertura de pruebas completa (requiere `TEST_ADMIN_URL`) |
| `pnpm test:e2e` | Pruebas E2E con Playwright sobre servidor y base de prueba |
| `pnpm db:migrate` | Aplicar migraciones Drizzle pendientes a la base de datos configurada |
| `pnpm db:seed` | Poblar datos iniciales y plan de cuentas estándar |
| `pnpm auth:create-user` | Crear usuario inicial en Better Auth con contraseña y enrolamiento TOTP |

## 📋 Estado del Proyecto ("Qué funciona hoy")

### ✅ Implementado y probado
- **Autenticación y 2FA**: Inicio de sesión con correo y contraseña; enrolamiento y verificación obligatoria de TOTP para administradores (en páginas y en endpoints tRPC).
- **Aislamiento Multi-Tenant**: RLS estricto en Postgres con sesión de usuario y membresías (`withTenant`/`tenantDb`).
- **Empresas**: Gestión de entidades con RUC válido (validación Módulo 11 paraguayo).
- **Carga de Facturas SIFEN**: Subida de XML electrónico, validación de CDC y timbrado, extracción de importes e impuestos.
- **Asistente de Contabilización (IA + Reglas)**: Sugerencias contables de partida doble basadas en reglas fiscales con apoyo de Ollama (`qwen2.5:7b`), revisión humana y aprobación atómica.
- **Asientos Contables**: Creación manual validada en moneda local (enteros Gs.), inmutabilidad en base de datos mediante triggers, reversión estricta de asientos (`reverseEntry`).
- **Auditoría Append-Only**: Registro exhaustivo en `audit_events` con usuario, acción, estado anterior/posterior y justificación.
- **Libros Contables**: Libro Diario, Libro Mayor y Balance de Sumas y Saldos a partir de vistas SQL con `security_invoker`.
- **Libro IVA y Formulario 104**: Liquidación mensual de IVA Débito/Crédito y formulario resumen fiscal.
- **Registro de Comprobantes (RG 90 / Obligación 955)**: Generación y descarga directa en `.zip` de los archivos mensuales de compras y ventas para la DNIT (Marangatu).
- **Calendario Fiscal**: Cálculo automático de vencimientos por terminación de RUC.
- **Idempotencia**: Prevención de duplicados en mutaciones mediante encabezado `Idempotency-Key` (UUID).

### 🟡 Vista previa (datos de ejemplo / fuera del slice vertical)
*Las siguientes vistas están marcadas con banner de vista previa y ocultas por defecto (activables en Configuración):*
- Conciliación Bancaria (`/banco`)
- Historial SIFEN / Emisión (`/sifen/historial`, `/sifen/emitir`)
- Cuentas Corrientes, Cobros y Pagos (`/cuentas-corrientes`, `/cobros-pagos`)
- Cierre Mensual y Checklist (`/cierre`)
- Activos Fijos y Depreciación (`/activos`)
- Multimoneda y Tipos de Cambio (`/multimoneda`)
- Portal del Cliente (`/portal`)
- Formularios tributarios adicionales (`/fiscal/formularios`)

### ⬜ Pendiente
- Despliegue automatizado en `dev-server` mediante Coolify (Docker standalone) y backups periódicos programados.
- SIFEN en tiempo real (recepción directa vía API Webhook de DNIT).
- Cuentas en moneda extranjera y tipos de cambio multi-divisa.

## 🇵🇾 Cumplimiento Fiscal Paraguay

- **IVA** 10% / 5% / Exento — Liquidación y Formulario 104 mensual.
- **Registro de Comprobantes (RG 90)** — Obligación 955 (mensual compras/ventas) en formato texto `.zip`.
- **SIFEN** — Validación de documentos electrónicos, CDC (44 dígitos, dígito verificador mod 11).
- **Retenciones Tesaka** — Cálculo de retenciones de IVA, IRE e IRP con soporte de perfiles por proveedor.
- **Timbrado** — Validación de fechas de vigencia y numeración oficial de comprobantes.

## 📄 Licencia

Propietario — InteliCont 2026
