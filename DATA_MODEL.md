# Modelo de Datos — InteliCont

Convención: Nombres en `snake_case` en PostgreSQL, identificadores UUID (`defaultRandom()`), marcas de tiempo `timestamptz`.

## 💰 Manejo de Dinero y Moneda
- **Dinero**: `bigint` en base de datos representando la unidad mínima de la moneda (para PYG sin decimales: ₲ 1.000 = `1000`; para monedas con decimales: centavos). En TypeScript se procesa como enteros seguros (`assertMoney`).
- **Tasas de Cambio / Coeficientes**: `numeric(12, 4)` exclusivamente para tipos de cambio (`fx_rate`).

---

## 🏛️ Núcleo Contable

### `entities`
Empresas u organizaciones gestionadas en el sistema.
- `id` (uuid, PK)
- `ruc` (varchar(20), unique, validado con Módulo 11)
- `legal_name` (text, not null)
- `trade_name` (text)
- `tax_regimes` (text[])
- `base_currency` (varchar(3), default 'PYG')
- `status` (entity_status: active, inactive, closed)
- `created_at`, `updated_at` (timestamptz)

### `fiscal_periods`
Períodos contables y fiscales mensuales.
- `id` (uuid, PK), `entity_id` (uuid, FK)
- `year` (int), `month` (int)
- `status` (fiscal_period_status: open, closing, closed, reopened)
- `closed_at`, `closed_by`

### `chart_of_accounts` & `accounts`
Plan de cuentas contables.
- `accounts`: `id` (uuid, PK), `entity_id` (uuid, FK), `code` (varchar), `name` (text), `nature` (account_nature: asset, liability, equity, income, expense), `parent_id` (uuid, FK opcional), `allows_posting` (boolean), `cost_center_required` (boolean), `tax_mappings` (jsonb).

### `journal_entries` (Inmutable)
Asientos contables posteados. Protegidos por trigger en base de datos que rechaza `UPDATE` y `DELETE`.
- `id` (uuid, PK), `entity_id` (uuid, FK), `period_id` (uuid, FK)
- `date` (date), `number` (text), `source` (journal_source)
- `description` (text), `status` (journal_entry_status: draft, posted, reversed)
- `posted_at`, `posted_by`
- `reversal_of` (uuid, FK a journal_entries para contra-asientos)
- `version_of` (uuid, FK para ajustes)
- `metadata` (jsonb)

### `journal_lines`
Líneas de débito y crédito asociadas a un asiento.
- `id` (uuid, PK), `entry_id` (uuid, FK)
- `account_id` (uuid, FK)
- `debit` (bigint, not null, default 0)
- `credit` (bigint, not null, default 0)
- `currency_code` (varchar(3), default 'PYG')
- `fx_rate` (numeric)
- `amount_base` (bigint)
- `partner_id` (uuid, FK opcional)
- `tax_document_id` (uuid, FK opcional)
- `cost_center_id` (uuid, FK opcional)
- `description` (text)
- *Invariante*: Por cada asiento, `sum(debit) == sum(credit)` por moneda. Verificado por trigger de consistencia.

---

## 🧾 Fiscal y Comprobantes

### `tax_documents`
Comprobantes tributarios (electrónicos SIFEN o manuales no electrónicos).
- `id` (uuid, PK), `entity_id` (uuid, FK)
- `direction` (doc_direction: issued, received)
- `doc_type` (doc_type: invoice, credit_note, debit_note, receipt, self_invoice, remito, import)
- `doc_code` (varchar(3), código numérico según Tabla 4 DNIT, ej. '109' para factura)
- `number` (varchar), `timbrado` (varchar)
- `cdc` (varchar(44), único por entidad: constraint `unique (entity_id, cdc)`)
- `is_electronic` (boolean, true si proviene de SIFEN)
- `issue_date` (date), `partner_id` (uuid, FK)
- `counterparty_id_type` (int, tipo de identificación DNIT: 11 RUC, 12 Cédula, etc.)
- `condition` (doc_condition: cash, credit)
- `currency_code` (varchar(3)), `foreign_currency` (boolean)
- `status` (text), `sifen_status` (sifen_status, nulo en documentos manuales)
- Totales (`bigint`): `gravado_10`, `gravado_5`, `exento`, `iva_10`, `iva_5`, `total`
- Imputaciones RG 90: `imputa_iva` (bool), `imputa_ire` (bool), `imputa_irp` (bool), `no_imputa` (bool)
- Documentos asociados: `related_doc_number`, `related_timbrado`, `related_cdc`
- `journal_entry_id` (uuid, FK a journal_entries una vez contabilizado)
- `metadata` (jsonb, almacena el `sifen` parseado completo)

### `tax_document_lines`
Detalle de ítems del comprobante.
- `id` (uuid, PK), `document_id` (uuid, FK), `description` (text), `quantity` (numeric), `unit_price` (bigint), `iva_rate` (int), `amount` (bigint).

### `timbrados`
Registro de timbrados fiscales autorizados para compras y ventas.
- `id` (uuid, PK), `entity_id` (uuid, FK), `partner_id` (uuid, FK opcional), `timbrado` (varchar), `valid_from` (date), `valid_to` (date).

### `tax_calendar`
Vencimientos tributarios calculados para la entidad.
- `id` (uuid, PK), `entity_id` (uuid, FK), `tax_type` (text), `period` (text), `due_date` (date), `status` (text).

### `retentions`
Retenciones impositivas aplicadas a documentos.
- `id` (uuid, PK), `document_id` (uuid, FK), `retention_type` (retention_type: iva, ire, irp, inr), `base` (bigint), `rate` (numeric), `amount` (bigint), `certificate_number` (text).

### `partners`
Clientes y proveedores.
- `id` (uuid, PK), `entity_id` (uuid, FK), `kind` (customer, supplier, both), `ruc` (text), `legal_name` (text), `retention_profile` (jsonb).

---

## 👥 Identidad y Acceso (Better Auth + Membresías)

### `users`
Usuarios del sistema.
- `id` (uuid, PK), `name` (text), `email` (text, unique), `email_verified` (boolean), `two_factor_enabled` (boolean).

### `sessions`
Sesiones activas.
- `id` (uuid, PK), `user_id` (uuid, FK a users), `token` (text, unique), `expires_at` (timestamptz).

### `auth_accounts` & `verifications` & `two_factors`
Tablas de soporte de Better Auth para contraseñas hasheadas y secretos TOTP.

### `memberships`
Asociación multi-tenant entre usuarios y entidades con control de acceso por roles.
- `id` (uuid, PK), `user_id` (uuid, FK a users), `entity_id` (uuid, FK a entities), `role` (text: 'admin', 'accountant', 'assistant', etc.).
- Protegido por RLS estricto que restringe qué registros de membresía puede consultar cada usuario.

---

## 🛡️ Control Operativo e Idempotencia

### `idempotency_keys`
Garantía de ejecución única en mutaciones.
- `id` (uuid, PK), `user_id` (uuid, not null), `endpoint` (text), `key` (varchar(36)), `request_hash` (text), `response_body` (jsonb), `created_at` (timestamptz).
- Constraint: `unique (user_id, endpoint, key)`.

### `audit_events`
Bitácora de auditoría append-only para trazabilidad y cumplimiento tributario.
- `id` (uuid, PK), `entity_id` (uuid, FK), `actor_id` (uuid), `action` (text), `target_type` (text), `target_id` (uuid), `before` (jsonb), `after` (jsonb), `reason` (text), `created_at` (timestamptz).

### `ai_decisions`
Registro de propuestas contables generadas por IA y su aceptación/rechazo humano.
- `id` (uuid, PK), `entity_id` (uuid, FK), `kind` (text), `input` (jsonb), `output` (jsonb), `confidence` (numeric), `accepted` (boolean), `accepted_by` (uuid).

---

## 👁️ Vistas SQL (`security_invoker = true`)

1. **`v_diario`**: Proyección consolidada del Libro Diario que une `journal_entries` y `journal_lines` con nombres de cuenta y datos de terceros.
2. **`v_mayor`**: Agrupación del Libro Mayor calculando sumas de débitos y créditos con saldos progresivos.
3. **`v_libro_iva`**: Consolidación fiscal para liquidación de IVA Compras y Ventas, calculando bases y débitos/créditos a partir de `tax_documents`.

---

## 🚧 Módulos No Implementados (Pendientes)
- **Activos Fijos y Depreciación** (`fixed_assets`, `depreciation_schedules`, `asset_revaluations`): No implementados en la rebanada vertical actual.
- **Conciliación Bancaria Avanzada** (`bank_accounts`, `bank_movements`, `reconciliations`): En estado de vista previa simulada.
