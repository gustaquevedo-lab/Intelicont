# InteliCont — API & Arquitectura

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui |
| State | Zustand (stores), TanStack React Query (server state) |
| API | tRPC v11 (typesafe RPC) |
| DB | Postgres 16 via Supabase, Drizzle ORM |
| Auth | Supabase Auth (mock en MVP) |
| Jobs | Inngest / Trigger.dev (pendiente) |
| IA | Provider swappeable: rule-based (default), Anthropic, opencode |
| Tests | Vitest (unitarios), Playwright (E2E) |
| CI/CD | GitHub Actions → Vercel |

## Estructura

```
apps/web/
  src/
    app/           # Next.js App Router (pages)
      (auth)/      # Login, register
      api/trpc/    # tRPC HTTP handler
      asientos/    # Journal entries
      sifen/       # SIFEN upload + bandeja
      fiscal/      # Form 104, Hechauka
      cuentas/     # Chart of accounts
      terceros/    # Partners CRUD
      libros/      # Accounting books
      banco/       # Bank reconciliation
      calendario/  # Fiscal calendar
      reportes/    # Reports
      configuracion/ # User settings
    components/    # Shared UI components
    lib/           # Business logic, stores, utilities
    trpc/          # tRPC router + client
  e2e/             # Playwright tests
packages/
  ledger/          # Core domain logic
    db/            # Drizzle schema, repository, mock
    src/           # Domain types, fiscal-py rules
```

## API tRPC

### `entities`
| Procedure | Input | Output |
|---|---|---|
| `list` | — | `Entity[]` |
| `get` | `{ id }` | `Entity` |

### `accounts`
| Procedure | Input | Output |
|---|---|---|
| `list` | `{ entityId }` | `Account[]` |
| `tree` | `{ entityId }` | `AccountTree[]` |

### `journal-entries`
| Procedure | Input | Output |
|---|---|---|
| `list` | `{ entityId, limit? }` | `JournalEntry[]` |
| `get` | `{ id }` | `JournalEntry + lines` |
| `getLines` | `{ entryId }` | `JournalLine[]` |
| `create` | `{ entityId, date, lineas[], ... }` | `{ id }` |
| `reverse` | `{ entryId }` | `{ id }` |

### `tax-documents`
| Procedure | Input | Output |
|---|---|---|
| `list` | `{ entityId }` | `TaxDocument[]` |
| `pending` | `{ entityId }` | `TaxDocument[]` |
| `get` | `{ id }` | `TaxDocument` |
| `getLines` | `{ documentId }` | `TaxDocumentLine[]` |

### `partners`
| Procedure | Input | Output |
|---|---|---|
| `list` | `{ entityId }` | `Partner[]` |
| `get` | `{ id }` | `Partner` |

### `bank`
| Procedure | Input | Output |
|---|---|---|
| `movements` | `{ bankAccountId }` | `BankMovement[]` |
| `reconciliations` | `{ bankAccountId }` | `Reconciliation[]` |

### `fiscal`
| Procedure | Input | Output |
|---|---|---|
| `periods` | `{ entityId }` | `FiscalPeriod[]` |
| `currentPeriod` | `{ entityId }` | `FiscalPeriod` |
| `vencimientoIva` | `{ year, month, ruc }` | `{ date, label }` |
| `vencimientoHechauka` | `{ year, month }` | `{ date, label }` |

### `reports`
| Procedure | Input | Output |
|---|---|---|
| `ivaSummary` | `{ entityId, year, month }` | IVA débito/crédito |
| `fiscalResume` | `{ entityId }` | Resumen 6 meses |
| `trialBalance` | `{ entityId }` | Sumas y saldos |

## Modelo de Datos

19 tablas en Postgres (ver `packages/ledger/db/schema.ts`):

- **Core**: entities, fiscal_periods, chart_of_accounts, accounts, cost_centers, journal_entries, journal_lines
- **Fiscal**: tax_documents, tax_document_lines, retentions
- **Partners**: partners
- **Banking**: bank_accounts, bank_movements, bank_statements, reconciliations
- **Ops**: closing_checklists, audit_events, ai_decisions

## Estados SIFEN

```
pending → reviewing → approved → posted
  ↓          ↓
rejected   error
```

## Comandos

```bash
pnpm dev          # Next.js dev server
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright E2E
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm db:migrate   # Drizzle migrations
pnpm db:seed      # Seed database
```
