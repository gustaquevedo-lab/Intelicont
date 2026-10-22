# InteliCont — SaaS Contable AI-First para Paraguay

Plataforma contable inteligente para estudios contables en Paraguay. Carga facturas electrónicas SIFEN, genera asientos contables con IA, y cumple con las normativas de SET/DNIT.

## 🚀 Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 15 + React 19 + TypeScript + Tailwind + shadcn/ui |
| **API** | tRPC (type-safe, full-stack) |
| **Base de datos** | PostgreSQL 16 + Drizzle ORM + RLS (Supabase) |
| **Auth** | Supabase Auth (email + magic link + 2FA) |
| **Jobs** | Inngest / Trigger.dev |
| **IA** | Anthropic API (Claude Sonnet) |
| **Deploy** | Vercel |

## 📦 Estructura

```
intelicont/
├── apps/
│   └── web/              # Next.js frontend + API tRPC
├── packages/
│   └── ledger/           # Dominio contable, schema DB, seed
├── docs/                 # Documentación
└── backlog/              # Epics y tareas
```

## 🛠️ Desarrollo

### Prerequisitos

- Node.js 20+
- pnpm
- PostgreSQL (Supabase recomendado)

### Setup

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp apps/web/.env.example apps/web/.env.local

# Generar migraciones
pnpm db:generate

# Ejecutar migraciones (requiere DATABASE_URL)
pnpm db:migrate

# Seed de datos de ejemplo
pnpm db:seed

# Iniciar desarrollo
pnpm dev
```

### Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Iniciar servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm db:generate` | Generar migraciones Drizzle |
| `pnpm db:migrate` | Ejecutar migraciones |
| `pnpm db:push` | Push directo al schema (dev) |
| `pnpm db:seed` | Seed de datos de ejemplo |
| `pnpm db:studio` | Abrir Drizzle Studio |

## 📋 Características

### ✅ Implementadas
- **Dashboard** con resumen de empresas, obligaciones y asientos
- **Carga SIFEN** — Drag & drop de XML de facturas electrónicas
- **Parser XML SIFEN** — Extrae CDC, timbrado, montos, IVA, datos del emisor
- **Asiento inteligente** — Sugerencia automática de débito/crédito basado en tipo de documento
- **Asientos contables** — Creación manual con validación de partida doble en tiempo real
- **Calendario Fiscal** — Vencimientos DNIT/SET con estado y multas
- **Calculadora de Impuestos** — IVA, IRE, IRP y retenciones
- **Libros Contables** — Libro IVA Compras/Ventas con totales
- **Clientes/Proveedores** — Gestión de terceros con RUC, retenciones, saldos
- **Configuración** — Empresa, contabilidad, fiscal, usuarios, seguridad
- **Sidebar responsive** — Navegación con indicador de AI
- **Dark mode** — Diseño profesional oscuro

### 🚧 En progreso
- Persistencia real en PostgreSQL (modo simulación activo)
- Autenticación con Supabase Auth
- tRPC routers completos
- Integración SIFEN API
- Libros Diario y Mayor
- Conciliación bancaria
- Reportes fiscales automáticos

## 🇵🇾 Cumplimiento Fiscal Paraguay

- **IVA** 10% / 5% / Exento — Form. 703
- **IRE** Impuesto a la Renta Empresarial — Form. 1301
- **IRP** Impuesto a la Renta Personal — Form. 115
- **SIFEN** Facturación electrónica SET/DNIT
- **Hechauka** Libro electrónico mensual
- **Timbrado** Autorización fiscal del comprobante
- **CDC** Código de control 44 dígitos

## 📄 Licencia

Propietario — InteliCont 2026
