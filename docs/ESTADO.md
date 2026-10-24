# Estado de Implementación — InteliCont

Matriz de funcionalidades implementadas y verificadas en la rama `feat/vertical-slice` respecto al PRD y Roadmap del proyecto.

---

## 📊 Matriz de Funcionalidades

Leyenda:
* ✅ **Implementado y probado**: Código completo, verificado con tests unitarios, de integración en BD y/o E2E.
* 🟡 **Parcial / No verificado**: Funcionalidad presente pero con componentes en modo simulación, dependiente de validación externa, o con UI marcada como vista previa.
* ⬜ **Pendiente**: Fuera del alcance de la rebanada vertical actual.

| Módulo / Funcionalidad | Roadmap / Epic | Estado | Evidencia (Archivos / Tests) |
|---|---|:---:|---|
| **Autenticación con Email y Contraseña** | FND-01 / W1 | ✅ | `apps/web/src/lib/auth.ts`, `apps/web/e2e/auth.spec.ts` |
| **2FA / TOTP Obligatorio para Admins** | FND-01 / W1 | ✅ | `apps/web/src/lib/auth-guard.ts`, `apps/web/src/trpc/trpc.ts:75-86`, `apps/web/e2e/auth.spec.ts` |
| **Aislamiento Multi-Tenant (RLS)** | FND-02 / W2 | ✅ | `packages/ledger/db/schema.ts` (0001/0003), `apps/web/src/__tests__/db/rls-ledger.test.ts` |
| **Membresías y Roles por Empresa** | FND-02 / W2 | ✅ | `packages/ledger/db/repository.ts:ensureMembership`, `apps/web/src/trpc/routers/entities.ts` |
| **Gestión de Empresas (CRUD + RUC)** | FND-03 / W3 | ✅ | `apps/web/src/app/empresas/page.tsx`, `apps/web/src/__tests__/db/entities.test.ts` |
| **Plan de Cuentas Jerárquico** | MVP-CORE-01 / W3 | ✅ | `apps/web/src/app/cuentas/page.tsx`, `apps/web/src/trpc/routers/accounts.ts`, `seed.ts` |
| **Terceros (Clientes / Proveedores)** | MVP-CORE-02 / W3 | ✅ | `apps/web/src/app/terceros/page.tsx`, `apps/web/src/__tests__/db/partners.test.ts` |
| **Inmutabilidad de Asientos Posteados** | MVP-CORE-03 / W4 | ✅ | Triggers DB en `0001_rls_ledger_immutability.sql`, `apps/web/src/__tests__/db/journal-entries.test.ts` |
| **Doble Partida y Dinero Entero** | MVP-CORE-03 / W0 | ✅ | `packages/core/src/money.ts`, trigger DB de balance, `apps/web/src/__tests__/money.test.ts` |
| **Asientos Manuales Reales** | MVP-CORE-03 / W4 | ✅ | `apps/web/src/app/asientos/nuevo/page.tsx`, `apps/web/src/trpc/routers/journal-entries.ts:create` |
| **Reversión de Asientos Contables** | MVP-CORE-03 / W4 | ✅ | `packages/ledger/src/usecases/reverse-entry.ts`, `apps/web/src/app/asientos/page.tsx` |
| **Auditoría Append-Only (`audit_events`)** | FND-04 / W4 | ✅ | `packages/ledger/src/usecases/audited.ts`, `apps/web/src/app/auditoria/page.tsx` |
| **Idempotencia en Mutaciones** | FND-02 / W5 | ✅ | `apps/web/src/trpc/idempotent.ts`, `packages/ledger/db/idempotency.ts`, `idempotency.test.ts` |
| **Carga e Ingesta de XML SIFEN** | SIFEN-01 / W6 | ✅ | `packages/ledger/src/sifen.ts`, `apps/web/src/app/sifen/page.tsx`, `sifen-parser.test.ts` |
| **Validaciones Fiscales (RUC mod 11, CDC)**| FISC-01 / W6 | ✅ | `packages/ledger/src/fiscal-py.ts`, `apps/web/src/__tests__/fiscal-py.test.ts` |
| **Sugerencias Contables IA + Reglas** | AI-01 / W6 | ✅ | `packages/ledger/src/ai/suggest-entry.ts`, `apps/web/src/trpc/routers/tax-documents.ts:suggestEntry` |
| **Aprobación Humana de Comprobantes** | AI-01 / W6 | ✅ | `packages/ledger/src/usecases/approve-suggestion.ts`, `tax-documents.approveEntry` |
| **Carga de Comprobantes Manuales** | FISC-02 / W7 | ✅ | `apps/web/src/app/documentos/nuevo/page.tsx`, `tax-documents.createManual` |
| **Motor de Retenciones (IVA / IRE / IRP)** | FISC-03 / W7 | 🟡 | `packages/ledger/src/retentions.ts` *(Tasas IRE/IRP requieren validación jurídica)* |
| **Libros Contables (Diario, Mayor, Sumas)**| REP-01 / W8 | ✅ | Vistas SQL `v_diario`/`v_mayor` (`0006`), `apps/web/src/app/libros/page.tsx` |
| **Libro IVA Compras y Ventas** | FISC-04 / W8 | ✅ | Vista SQL `v_libro_iva`, `apps/web/src/app/libros/page.tsx:LibroIvaTab` |
| **Liquidación IVA (Formulario 104)** | FISC-05 / W9 | ✅ | `packages/ledger/src/form104.ts`, `apps/web/src/app/fiscal/formulario-104/page.tsx` |
| **Registro de Comprobantes 955 (ZIP)** | FISC-06 / W9 | 🟡 | `packages/ledger/src/registro-comprobantes.ts`, `GET /api/registro/...` *(Delimitador pendiente de importación real)* |
| **Calendario Fiscal DNIT** | FISC-07 / W10 | 🟡 | `packages/ledger/src/tax-calendar.ts`, `apps/web/src/app/calendario/page.tsx` *(Regla de vencimiento unificada)* |
| **Logging Seguro y Enmascaramiento** | OPS-01 / W11 | ✅ | `apps/web/src/lib/logger.ts:safeErrorInfo`, `apps/web/src/trpc/trpc.ts:errorFormatter` |
| **CI con Gates de Lint, Tests y DB** | OPS-02 / W12 | 🟡 | `.github/workflows/ci.yml`, `eslint.config.mjs` *(Pendiente ejecución remota en GitHub)* |
| **Conciliación Bancaria** | BNK-01 | 🟡 | Pantalla `/banco` en modo Vista Previa con datos de ejemplo |
| **Cierre Mensual y Checklist** | OPS-03 | 🟡 | Pantalla `/cierre` en modo Vista Previa con datos de ejemplo |
| **Activos Fijos y Depreciación** | AST-01 | ⬜ | Oculto / No implementado |
| **Multimoneda y Diferencia de Cambio** | FX-01 | ⬜ | Oculto / No implementado |
| **Portal del Cliente** | PORT-01 | 🟡 | Pantalla `/portal` en modo Vista Previa |
| **Despliegue dev-server (Coolify/Docker)** | OPS-04 / T24 | ⬜ | Pendiente de configuración en Task 24 |
| **Backups Automatizados (`pg_dump`)** | OPS-05 / T24 | ⬜ | Pendiente de configuración en Task 24 |

---

## ⚠️ Aspectos No Verificados y Limitaciones Identificadas

1. **Delimitador del Registro de Comprobantes (Obligación 955)**:
   * Implementado con `;` y fin de línea `\n`. Falta realizar una importación real de prueba en el portal Marangatu para ratificar si rechaza o acepta esta variante.
2. **Tablas de Retención IRE e IRP**:
   * El motor calcula retenciones basándose en los perfiles explícitos del proveedor, pero las tablas de alícuotas automáticas por rubro requieren homologación con un asesor contable paraguayo.
3. **Calendario de Vencimientos DNIT**:
   * Se calculan los días de vencimiento basados en el último dígito del RUC (base día 10), trasladando fines de semana al lunes, pero no se cruza contra la tabla de feriados nacionales móviles oficial de la DNIT.
4. **Rendimiento de Ollama en CPU**:
   * En dev-server sobre CPU, el modelo `qwen2.5:7b` tiene una latencia de 15 a 78 segundos. El sistema prioriza el camino de reglas cuando el grado de certeza es alto (≥ 0.8).
5. **Enrolamiento TOTP**:
   * El setup del segundo factor muestra la clave secreta y la URL `otpauth://`, sin renderizar código QR visualmente (requiere agregar dependencia gráfica si se desea).
6. **Ejecución Remota de CI**:
   * El workflow de GitHub Actions fue unificado para correr pnpm 12.14, Postgres y Playwright, pero no ha sido ejecutado en los runners remotos de GitHub todavía.
