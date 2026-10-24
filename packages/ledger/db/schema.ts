import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  bigint,
  timestamp,
  jsonb,
  boolean,
  pgEnum,
  date,
  index,
  unique,
  primaryKey,
  check,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { TABLA_4 } from "../src/registro-codes";

// SQL list for the Tabla 4 CHECKs (migration 0005 hardcodes the same set; a unit test keeps them in sync).
const TABLA_4_SQL = Object.keys(TABLA_4).join(",");

// ─── Enums ────────────────────────────────────────────────────────────────

export const entityStatusEnum = pgEnum("entity_status", ["active", "inactive", "closed"]);
export const fiscalPeriodStatusEnum = pgEnum("fiscal_period_status", ["open", "closing", "closed", "reopened"]);
export const journalEntryStatusEnum = pgEnum("journal_entry_status", ["draft", "posted", "reversed"]);
export const accountNatureEnum = pgEnum("account_nature", ["asset", "liability", "equity", "income", "expense"]);
export const journalSourceEnum = pgEnum("journal_source", [
  "manual", "sales", "purchase", "payment", "collection",
  "bank", "depreciation", "fx_adjustment", "payroll", "import", "sifen",
]);
export const docDirectionEnum = pgEnum("doc_direction", ["issued", "received"]);
export const docTypeEnum = pgEnum("doc_type", [
  "invoice", "credit_note", "debit_note", "receipt", "self_invoice", "remito", "import",
]);
export const docConditionEnum = pgEnum("doc_condition", ["cash", "credit"]);
export const sifenStatusEnum = pgEnum("sifen_status", [
  "pending_upload", "uploaded", "validated", "rejected", "processing",
]);
export const partnerKindEnum = pgEnum("partner_kind", ["customer", "supplier", "both"]);
export const retentionTypeEnum = pgEnum("retention_type", ["iva", "ire", "irp", "inr"]);
export const bankMovementDirectionEnum = pgEnum("bank_movement_direction", ["credit", "debit"]);
export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "pending", "matched", "flagged", "manual",
]);
export const checklistStatusEnum = pgEnum("checklist_status", ["open", "in_progress", "done"]);

// ─── Core: Entities ───────────────────────────────────────────────────────

export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruc: varchar("ruc", { length: 20 }).notNull().unique(),
  legalName: text("legal_name").notNull(),
  tradeName: text("trade_name"),
  taxRegimes: text("tax_regimes").array(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("PYG"),
  status: entityStatusEnum("status").default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Identity (Better Auth tables + memberships) ──────────────────────────
// Property names are Better Auth's camelCase field names (the Drizzle adapter maps by property);
// columns are snake_case. Auth tables have no tenant RLS; memberships has user-scoped RLS (migration 0003).

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("sessions_user_id_idx").on(t.userId)]);

export const authAccounts = pgTable("auth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  password: text("password"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("auth_accounts_user_id_idx").on(t.userId)]);

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("verifications_identifier_idx").on(t.identifier)]);

export const twoFactors = pgTable("two_factors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  verified: boolean("verified").default(true),
  failedVerificationCount: integer("failed_verification_count").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
}, (t) => [index("two_factors_user_id_idx").on(t.userId), index("two_factors_secret_idx").on(t.secret)]);

export const memberships = pgTable("memberships", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(),
  permissions: jsonb("permissions").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.entityId] }),
  check("memberships_role_check", sql`${t.role} IN ('admin','accountant','assistant','auditor','client')`),
]);

// ─── Core: Fiscal Periods ─────────────────────────────────────────────────

export const fiscalPeriods = pgTable("fiscal_periods", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  status: fiscalPeriodStatusEnum("status").default("open"),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  closedBy: uuid("closed_by"),
});

// ─── Core: Chart of Accounts ──────────────────────────────────────────────

export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  kind: varchar("kind", { length: 50 }).notNull(),
  name: text("name").notNull(),
});

// ─── Core: Accounts ───────────────────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  coaId: uuid("coa_id").references(() => chartOfAccounts.id, { onDelete: "cascade" }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  name: text("name").notNull(),
  nature: accountNatureEnum("nature"),
  parentId: uuid("parent_id"),
  allowsPosting: boolean("allows_posting").default(true),
  costCenterRequired: boolean("cost_center_required").default(false),
  taxMappings: jsonb("tax_mappings"),
  eefLineId: varchar("eef_line_id", { length: 50 }),
});

// ─── Core: Cost Centers ───────────────────────────────────────────────────

export const costCenters = pgTable("cost_centers", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
});

// ─── Core: Journal Entries (IMMUTABLE once posted) ────────────────────────

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  periodId: uuid("period_id").references(() => fiscalPeriods.id, { onDelete: "set null" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  number: varchar("number", { length: 100 }),
  source: journalSourceEnum("source").default("manual"),
  sourceRef: varchar("source_ref", { length: 100 }),
  description: text("description"),
  status: journalEntryStatusEnum("status").default("draft").notNull(),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  postedBy: uuid("posted_by"),
  reversalOf: uuid("reversal_of").references((): AnyPgColumn => journalEntries.id),
  versionOf: uuid("version_of").references((): AnyPgColumn => journalEntries.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  check("journal_entries_reversal_xor_version", sql`${t.reversalOf} IS NULL OR ${t.versionOf} IS NULL`),
  uniqueIndex("journal_entries_reversal_of_uq").on(t.reversalOf).where(sql`${t.reversalOf} IS NOT NULL`),
]);

// ─── Core: Journal Lines ──────────────────────────────────────────────────

export const journalLines = pgTable("journal_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id").references(() => journalEntries.id, { onDelete: "cascade" }).notNull(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  debit: bigint("debit", { mode: "number" }).default(0).notNull(),
  credit: bigint("credit", { mode: "number" }).default(0).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  fxRate: numeric("fx_rate", { precision: 20, scale: 6 }).default("1"),
  amountBase: bigint("amount_base", { mode: "number" }).default(0),
  costCenterId: uuid("cost_center_id").references(() => costCenters.id, { onDelete: "set null" }),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  taxDocumentId: uuid("tax_document_id").references(() => taxDocuments.id, { onDelete: "set null" }),
  description: text("description"),
});

// ─── Partners (Clients / Suppliers) ───────────────────────────────────────

export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  kind: partnerKindEnum("kind").notNull(),
  ruc: varchar("ruc", { length: 20 }).notNull(),
  legalName: text("legal_name").notNull(),
  tradeName: text("trade_name"),
  contacts: jsonb("contacts"),
  defaultPaymentTerms: integer("default_payment_terms").default(30),
  defaultAccountId: uuid("default_account_id").references(() => accounts.id, { onDelete: "set null" }),
  retentionProfile: jsonb("retention_profile"),
  country: varchar("country", { length: 3 }).default("PRY"),
  dvRuc: varchar("dv_ruc", { length: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  entityRucIdx: unique().on(table.entityId, table.ruc),
}));

// ─── Fiscal: Tax Documents ────────────────────────────────────────────────

export const taxDocuments = pgTable("tax_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  direction: docDirectionEnum("direction").notNull(),
  docType: docTypeEnum("doc_type").notNull(),
  number: varchar("number", { length: 100 }).notNull(),
  timbrado: varchar("timbrado", { length: 20 }),
  cdc: varchar("cdc", { length: 44 }),
  issueDate: date("issue_date").notNull(),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  currencyCode: varchar("currency_code", { length: 3 }).default("PYG"),
  fxRate: numeric("fx_rate", { precision: 20, scale: 6 }).default("1"),
  condition: docConditionEnum("condition").default("credit"),
  status: varchar("status", { length: 50 }).default("pending"),
  sifenStatus: sifenStatusEnum("sifen_status").default("pending_upload"),
  gravado10: bigint("gravado_10", { mode: "number" }).default(0),
  gravado5: bigint("gravado_5", { mode: "number" }).default(0),
  exento: bigint("exento", { mode: "number" }).default(0),
  iva10: bigint("iva_10", { mode: "number" }).default(0),
  iva5: bigint("iva_5", { mode: "number" }).default(0),
  total: bigint("total", { mode: "number" }).notNull(),
  ivaBookPeriod: uuid("iva_book_period").references(() => fiscalPeriods.id, { onDelete: "set null" }),
  journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  // Registro de Comprobantes (Tabla 4 doc code, Tabla 3 counterparty id type)
  docCode: integer("doc_code"),
  counterpartyIdType: integer("counterparty_id_type"),
  imputaIva: boolean("imputa_iva").notNull().default(false),
  imputaIre: boolean("imputa_ire").notNull().default(false),
  imputaIrp: boolean("imputa_irp").notNull().default(false),
  noImputa: boolean("no_imputa").notNull().default(false),
  foreignCurrency: boolean("foreign_currency").notNull().default(false),
  relatedNumber: varchar("related_number", { length: 20 }),
  relatedTimbrado: varchar("related_timbrado", { length: 8 }),
  isElectronic: boolean("is_electronic").notNull().default(false),
}, (t) => [
  check("tax_documents_doc_code_check", sql.raw(`doc_code IS NULL OR doc_code IN (${TABLA_4_SQL})`)),
  check("tax_documents_counterparty_id_type_check", sql`${t.counterpartyIdType} IS NULL OR ${t.counterpartyIdType} BETWEEN 11 AND 17`),
  uniqueIndex("tax_documents_entity_cdc_uq").on(t.entityId, t.cdc).where(sql`${t.cdc} IS NOT NULL`),
]);

// ─── Fiscal: Timbrados ────────────────────────────────────────────────────

export const timbrados = pgTable("timbrados", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  number: varchar("number", { length: 8 }).notNull(),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to").notNull(),
  establishment: varchar("establishment", { length: 3 }).notNull(),
  point: varchar("point", { length: 3 }).notNull(),
  docCode: integer("doc_code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  check("timbrados_doc_code_check", sql.raw(`doc_code IN (${TABLA_4_SQL})`)),
  check("timbrados_valid_range_check", sql`${t.validTo} >= ${t.validFrom}`),
  unique("timbrados_entity_number_est_point_code_uq").on(t.entityId, t.number, t.establishment, t.point, t.docCode),
]);

// ─── Fiscal: Calendar ─────────────────────────────────────────────────────

/** Due dates per entity/obligation/period: '104' IVA form, '955' Registro de Comprobantes (monthly, period 'YYYY-MM'); '956' is annual (period 'YYYY'), not generated yet. */
export const taxCalendar = pgTable("tax_calendar", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  obligation: text("obligation").notNull(),
  period: text("period").notNull(),
  dueDate: date("due_date").notNull(),
  source: text("source").notNull().default("rule"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [
  check("tax_calendar_obligation_check", sql`${t.obligation} IN ('104','955','956')`),
  unique("tax_calendar_entity_obligation_period_uq").on(t.entityId, t.obligation, t.period),
]);

// ─── Fiscal: Retenciones (Tesaka) ──────────────────────────────────────────

export const retenciones = pgTable("retenciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  periodoYear: integer("periodo_year").notNull(),
  periodoMonth: integer("periodo_month").notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull(),
  terceroRuc: varchar("tercero_ruc", { length: 20 }).notNull(),
  terceroNombre: text("tercero_nombre").notNull(),
  docTipo: varchar("doc_tipo", { length: 30 }).default("factura"),
  docNumero: varchar("doc_numero", { length: 20 }),
  montoBase: bigint("monto_base", { mode: "number" }).notNull(),
  tipoRetencion: varchar("tipo_retencion", { length: 50 }).notNull(),
  tasa: numeric("tasa", { precision: 6, scale: 4 }).notNull(),
  montoRetencion: bigint("monto_retencion", { mode: "number" }).notNull(),
  comprobanteRet: varchar("comprobante_ret", { length: 20 }),
  status: varchar("status", { length: 20 }).default("borrador"),
  taxDocumentId: uuid("tax_document_id").references(() => taxDocuments.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Retencion = typeof retenciones.$inferSelect;
export type NewRetencion = typeof retenciones.$inferInsert;

// ─── Fiscal: Tax Document Lines ───────────────────────────────────────────

export const taxDocumentLines = pgTable("tax_document_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => taxDocuments.id, { onDelete: "cascade" }).notNull(),
  itemCode: varchar("item_code", { length: 100 }),
  description: text("description"),
  quantity: numeric("quantity", { precision: 20, scale: 4 }).default("1"),
  unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
  ivaRate: integer("iva_rate").default(10),
  rubroIre: integer("rubro_ire"),
  rubroIrp: integer("rubro_irp"),
  incisoIva: integer("inciso_iva"),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  amount: bigint("amount", { mode: "number" }).notNull(),
});

// ─── Fiscal: Retentions ───────────────────────────────────────────────────

export const retentions = pgTable("retentions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => taxDocuments.id, { onDelete: "cascade" }).notNull(),
  retentionType: retentionTypeEnum("retention_type").notNull(),
  base: bigint("base", { mode: "number" }).notNull(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  certificateNumber: varchar("certificate_number", { length: 100 }),
  withheldAt: date("withheld_at").notNull(),
});

// ─── Banking: Bank Accounts ───────────────────────────────────────────────

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).default("PYG"),
  glAccountId: uuid("gl_account_id").references(() => accounts.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
});

// ─── Banking: Bank Movements ──────────────────────────────────────────────

export const bankMovements = pgTable("bank_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(),
  direction: bankMovementDirectionEnum("direction").notNull(),
  ref: varchar("ref", { length: 200 }),
  description: text("description"),
  source: varchar("source", { length: 50 }).default("manual"),
});

// ─── Banking: Bank Statements ─────────────────────────────────────────────

export const bankStatements = pgTable("bank_statements", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "cascade" }).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  fileRef: varchar("file_ref", { length: 500 }),
  parsedAt: timestamp("parsed_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
});

// ─── Banking: Reconciliations ─────────────────────────────────────────────

export const reconciliations = pgTable("reconciliations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "cascade" }).notNull(),
  glTransactionId: uuid("gl_transaction_id"),
  bankMovementId: uuid("bank_movement_id").references(() => bankMovements.id, { onDelete: "cascade" }),
  status: reconciliationStatusEnum("status").default("pending"),
  score: numeric("score", { precision: 5, scale: 2 }),
  matchedBy: varchar("matched_by", { length: 50 }).default("manual"),
  matchedAt: timestamp("matched_at", { withTimezone: true }),
});

// ─── Operations: Closing Checklists ───────────────────────────────────────

export const closingChecklists = pgTable("closing_checklists", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  periodId: uuid("period_id").references(() => fiscalPeriods.id, { onDelete: "cascade" }).notNull(),
  status: checklistStatusEnum("status").default("open"),
  items: jsonb("items"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Idempotency (D4) ─────────────────────────────────────────────────────
// One row per (user, endpoint, Idempotency-Key). User-scoped RLS in migration 0004.

export const idempotencyKeys = pgTable("idempotency_keys", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull(),
  key: text("key").notNull(),
  requestHash: text("request_hash").notNull(),
  response: jsonb("response"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.endpoint, t.key] })]);

// ─── Audit & AI ───────────────────────────────────────────────────────────

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  actorId: uuid("actor_id").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetType: varchar("target_type", { length: 100 }).notNull(),
  targetId: uuid("target_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const aiDecisions = pgTable("ai_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  kind: varchar("kind", { length: 100 }).notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  confidence: integer("confidence"),
  accepted: boolean("accepted").default(false),
  acceptedBy: uuid("accepted_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────

export const entitiesRelations = relations(entities, ({ many }) => ({
  fiscalPeriods: many(fiscalPeriods),
  chartOfAccounts: many(chartOfAccounts),
  journalEntries: many(journalEntries),
  partners: many(partners),
  taxDocuments: many(taxDocuments),
  bankAccounts: many(bankAccounts),
  costCenters: many(costCenters),
  closingChecklists: many(closingChecklists),
  auditEvents: many(auditEvents),
  aiDecisions: many(aiDecisions),
}));

export const fiscalPeriodsRelations = relations(fiscalPeriods, ({ one, many }) => ({
  entity: one(entities, { fields: [fiscalPeriods.entityId], references: [entities.id] }),
  journalEntries: many(journalEntries),
  taxDocuments: many(taxDocuments, { relationName: "periodTaxDocs" }),
  closingChecklists: many(closingChecklists),
}));

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one, many }) => ({
  entity: one(entities, { fields: [chartOfAccounts.entityId], references: [entities.id] }),
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  coa: one(chartOfAccounts, { fields: [accounts.coaId], references: [chartOfAccounts.id] }),
  parent: one(accounts, { fields: [accounts.parentId], references: [accounts.id] }),
  journalLines: many(journalLines),
  taxDocumentLines: many(taxDocumentLines),
  partnerDefaults: many(partners),
}));

export const costCentersRelations = relations(costCenters, ({ one, many }) => ({
  entity: one(entities, { fields: [costCenters.entityId], references: [entities.id] }),
  journalLines: many(journalLines),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  entity: one(entities, { fields: [journalEntries.entityId], references: [entities.id] }),
  period: one(fiscalPeriods, { fields: [journalEntries.periodId], references: [fiscalPeriods.id] }),
  lines: many(journalLines),
  reversal: one(journalEntries, { fields: [journalEntries.reversalOf], references: [journalEntries.id] }),
  taxDocuments: many(taxDocuments),
}));

export const journalLinesRelations = relations(journalLines, ({ one }) => ({
  entry: one(journalEntries, { fields: [journalLines.entryId], references: [journalEntries.id] }),
  account: one(accounts, { fields: [journalLines.accountId], references: [accounts.id] }),
  costCenter: one(costCenters, { fields: [journalLines.costCenterId], references: [costCenters.id] }),
  partner: one(partners, { fields: [journalLines.partnerId], references: [partners.id] }),
  taxDocument: one(taxDocuments, { fields: [journalLines.taxDocumentId], references: [taxDocuments.id] }),
}));

export const partnersRelations = relations(partners, ({ one, many }) => ({
  entity: one(entities, { fields: [partners.entityId], references: [entities.id] }),
  defaultAccount: one(accounts, { fields: [partners.defaultAccountId], references: [accounts.id] }),
  taxDocuments: many(taxDocuments),
  journalLines: many(journalLines),
}));

export const taxDocumentsRelations = relations(taxDocuments, ({ one, many }) => ({
  entity: one(entities, { fields: [taxDocuments.entityId], references: [entities.id] }),
  partner: one(partners, { fields: [taxDocuments.partnerId], references: [partners.id] }),
  ivaBookPeriod: one(fiscalPeriods, { fields: [taxDocuments.ivaBookPeriod], references: [fiscalPeriods.id], relationName: "periodTaxDocs" }),
  journalEntry: one(journalEntries, { fields: [taxDocuments.journalEntryId], references: [journalEntries.id] }),
  lines: many(taxDocumentLines),
  retentions: many(retentions),
}));

export const taxDocumentLinesRelations = relations(taxDocumentLines, ({ one }) => ({
  document: one(taxDocuments, { fields: [taxDocumentLines.documentId], references: [taxDocuments.id] }),
  account: one(accounts, { fields: [taxDocumentLines.accountId], references: [accounts.id] }),
}));

export const retentionsRelations = relations(retentions, ({ one }) => ({
  document: one(taxDocuments, { fields: [retentions.documentId], references: [taxDocuments.id] }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  entity: one(entities, { fields: [bankAccounts.entityId], references: [entities.id] }),
  glAccount: one(accounts, { fields: [bankAccounts.glAccountId], references: [accounts.id] }),
  movements: many(bankMovements),
  statements: many(bankStatements),
  reconciliations: many(reconciliations),
}));

export const bankMovementsRelations = relations(bankMovements, ({ one, many }) => ({
  bankAccount: one(bankAccounts, { fields: [bankMovements.bankAccountId], references: [bankAccounts.id] }),
  reconciliations: many(reconciliations),
}));

export const bankStatementsRelations = relations(bankStatements, ({ one }) => ({
  bankAccount: one(bankAccounts, { fields: [bankStatements.bankAccountId], references: [bankAccounts.id] }),
}));

export const reconciliationsRelations = relations(reconciliations, ({ one }) => ({
  bankAccount: one(bankAccounts, { fields: [reconciliations.bankAccountId], references: [bankAccounts.id] }),
  bankMovement: one(bankMovements, { fields: [reconciliations.bankMovementId], references: [bankMovements.id] }),
}));

export const closingChecklistsRelations = relations(closingChecklists, ({ one }) => ({
  entity: one(entities, { fields: [closingChecklists.entityId], references: [entities.id] }),
  period: one(fiscalPeriods, { fields: [closingChecklists.periodId], references: [fiscalPeriods.id] }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  entity: one(entities, { fields: [auditEvents.entityId], references: [entities.id] }),
}));

export const aiDecisionsRelations = relations(aiDecisions, ({ one }) => ({
  entity: one(entities, { fields: [aiDecisions.entityId], references: [entities.id] }),
}));
