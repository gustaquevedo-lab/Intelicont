/**
 * Minimal schema mirror for apps/web — only the tables queried by the web app.
 * Source of truth (migrations) lives in packages/ledger/db/schema.ts.
 * Keep in sync when the ledger schema changes.
 */
import {
  pgTable, uuid, varchar, text, integer, numeric,
  timestamp, jsonb, boolean, pgEnum, date,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const entityStatusEnum      = pgEnum("entity_status",       ["active", "inactive", "closed"]);
export const journalEntryStatusEnum = pgEnum("journal_entry_status", ["draft", "posted", "reversed"]);
export const journalSourceEnum      = pgEnum("journal_source", [
  "manual", "sales", "purchase", "payment", "collection",
  "bank", "depreciation", "fx_adjustment", "payroll", "import",
]);
export const accountNatureEnum = pgEnum("account_nature", [
  "asset", "liability", "equity", "income", "expense",
]);
export const fiscalPeriodStatusEnum = pgEnum("fiscal_period_status", [
  "open", "closing", "closed", "reopened",
]);

export const docDirectionEnum = pgEnum("doc_direction", ["issued", "received"]);
export const docConditionEnum = pgEnum("doc_condition", ["cash", "credit"]);

// ─── Entities ─────────────────────────────────────────────────────────────────

export const entities = pgTable("entities", {
  id:           uuid("id").primaryKey().defaultRandom(),
  ruc:          varchar("ruc", { length: 20 }).notNull().unique(),
  legalName:    text("legal_name").notNull(),
  tradeName:    text("trade_name"),
  taxRegimes:   text("tax_regimes").array(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("PYG"),
  status:       entityStatusEnum("status").default("active"),
  createdAt:    timestamp("created_at").defaultNow(),
  updatedAt:    timestamp("updated_at").defaultNow(),
});

export type Entity    = typeof entities.$inferSelect;
export type NewEntity = typeof entities.$inferInsert;

// ─── Fiscal Periods ───────────────────────────────────────────────────────────

export const fiscalPeriods = pgTable("fiscal_periods", {
  id:       uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  year:     integer("year").notNull(),
  month:    integer("month").notNull(),
  status:   fiscalPeriodStatusEnum("status").default("open"),
  closedAt: timestamp("closed_at"),
  closedBy: uuid("closed_by"),
});

export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;

// ─── Chart of Accounts ────────────────────────────────────────────────────────

export const chartOfAccounts = pgTable("chart_of_accounts", {
  id:       uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  kind:     varchar("kind", { length: 50 }).notNull(),
  name:     text("name").notNull(),
});

export type ChartOfAccounts = typeof chartOfAccounts.$inferSelect;

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  coaId:               uuid("coa_id").references(() => chartOfAccounts.id, { onDelete: "cascade" }).notNull(),
  code:                varchar("code", { length: 50 }).notNull(),
  name:                text("name").notNull(),
  nature:              accountNatureEnum("nature"),
  parentId:            uuid("parent_id"),
  allowsPosting:       boolean("allows_posting").default(true),
  costCenterRequired:  boolean("cost_center_required").default(false),
  taxMappings:         jsonb("tax_mappings"),
  eefLineId:           varchar("eef_line_id", { length: 50 }),
});

export type Account = typeof accounts.$inferSelect;

// ─── Journal Entries (IMMUTABLE once posted) ──────────────────────────────────

export const journalEntries = pgTable("journal_entries", {
  id:          uuid("id").primaryKey().defaultRandom(),
  entityId:    uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  periodId:    uuid("period_id").references(() => fiscalPeriods.id, { onDelete: "set null" }),
  date:        timestamp("date").notNull(),
  number:      varchar("number", { length: 100 }),
  source:      journalSourceEnum("source").default("manual"),
  sourceRef:   varchar("source_ref", { length: 100 }),
  description: text("description"),
  status:      journalEntryStatusEnum("status").default("draft"),
  postedAt:    timestamp("posted_at"),
  postedBy:    uuid("posted_by"),
  reversalOf:  uuid("reversal_of"),
  versionOf:   uuid("version_of"),
  metadata:    jsonb("metadata"),
  createdAt:   timestamp("created_at").defaultNow(),
});

export type JournalEntry    = typeof journalEntries.$inferSelect;
export type NewJournalEntry = typeof journalEntries.$inferInsert;

// ─── Journal Lines ────────────────────────────────────────────────────────────

export const journalLines = pgTable("journal_lines", {
  id:            uuid("id").primaryKey().defaultRandom(),
  entryId:       uuid("entry_id").references(() => journalEntries.id, { onDelete: "cascade" }).notNull(),
  accountId:     uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  debit:         numeric("debit",       { precision: 20, scale: 4 }).default("0").notNull(),
  credit:        numeric("credit",      { precision: 20, scale: 4 }).default("0").notNull(),
  currencyCode:  varchar("currency_code", { length: 3 }).notNull(),
  fxRate:        numeric("fx_rate",     { precision: 20, scale: 6 }).default("1"),
  amountBase:    numeric("amount_base", { precision: 20, scale: 4 }).default("0"),
  costCenterId:  uuid("cost_center_id"),
  partnerId:     uuid("partner_id"),
  taxDocumentId: uuid("tax_document_id"),
  description:   text("description"),
});

export type JournalLine    = typeof journalLines.$inferSelect;
export type NewJournalLine = typeof journalLines.$inferInsert;

// ─── Terceros (clientes / proveedores) ───────────────────────────────────────

export const terceroKindEnum = pgEnum("tercero_kind", ["cliente", "proveedor", "ambos"]);

export const terceros = pgTable("terceros", {
  id:        uuid("id").primaryKey().defaultRandom(),
  entityId:  uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  ruc:       varchar("ruc", { length: 20 }),
  name:      text("name").notNull(),
  kind:      terceroKindEnum("kind").default("ambos"),
  email:     text("email"),
  phone:     text("phone"),
  address:   text("address"),
  notes:     text("notes"),
  isActive:  boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Tercero    = typeof terceros.$inferSelect;
export type NewTercero = typeof terceros.$inferInsert;

// ─── Tax Documents (comprobantes SIFEN) ──────────────────────────────────────

export const taxDocTypeEnum   = pgEnum("tax_doc_type",   ["factura","nota_credito","nota_debito","autofactura","nota_remision","retencion"]);
export const taxDocStatusEnum = pgEnum("tax_doc_status", ["pending_review","proposed","approved","rejected","posted"]);

export const taxDocuments = pgTable("tax_documents", {
  id:             uuid("id").primaryKey().defaultRandom(),
  entityId:       uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  direction:      docDirectionEnum("direction").default("received").notNull(),
  condition:      docConditionEnum("condition").default("credit"),
  cdc:            varchar("cdc",         { length: 44 }),
  timbrado:       varchar("timbrado",    { length: 20 }),
  docType:        taxDocTypeEnum("doc_type").default("factura"),
  docNumber:      varchar("doc_number",  { length: 20 }),
  issueDate:      timestamp("issue_date").notNull(),
  issuerRuc:      varchar("issuer_ruc",  { length: 20 }).notNull(),
  issuerName:     text("issuer_name").notNull(),
  receiverRuc:    varchar("receiver_ruc",{ length: 20 }),
  receiverName:   text("receiver_name"),
  gravado10:      numeric("gravado_10",  { precision: 20, scale: 4 }).default("0"),
  gravado5:       numeric("gravado_5",   { precision: 20, scale: 4 }).default("0"),
  exento:         numeric("exento",      { precision: 20, scale: 4 }).default("0"),
  iva10:          numeric("iva_10",      { precision: 20, scale: 4 }).default("0"),
  iva5:           numeric("iva_5",       { precision: 20, scale: 4 }).default("0"),
  total:          numeric("total",       { precision: 20, scale: 4 }).notNull(),
  currencyCode:   varchar("currency_code",{ length: 3 }).default("PYG"),
  status:         taxDocStatusEnum("status").default("pending_review"),
  aiProvider:     varchar("ai_provider", { length: 50 }),
  aiConfidence:   numeric("ai_confidence",{ precision: 4, scale: 3 }),
  aiReasoning:    text("ai_reasoning"),
  sourceXml:      text("source_xml"),
  sourceFilename: text("source_filename"),
  journalEntryId: uuid("journal_entry_id"),
  partnerId:      uuid("partner_id"),
  createdAt:      timestamp("created_at").defaultNow(),
  updatedAt:      timestamp("updated_at").defaultNow(),
});

export type TaxDocument    = typeof taxDocuments.$inferSelect;
export type NewTaxDocument = typeof taxDocuments.$inferInsert;

export const taxDocumentLines = pgTable("tax_document_lines", {
  id:          uuid("id").primaryKey().defaultRandom(),
  docId:       uuid("doc_id").references(() => taxDocuments.id, { onDelete: "cascade" }).notNull(),
  lineNumber:  integer("line_number").notNull(),
  description: text("description").notNull(),
  quantity:    numeric("quantity",   { precision: 20, scale: 4 }).default("1"),
  unitPrice:   numeric("unit_price", { precision: 20, scale: 4 }).notNull(),
  ivaRate:     integer("iva_rate").default(10),
  ivaAmount:   numeric("iva_amount", { precision: 20, scale: 4 }).default("0"),
  lineTotal:   numeric("line_total", { precision: 20, scale: 4 }).notNull(),
});

export const aiProposals = pgTable("ai_proposals", {
  id:           uuid("id").primaryKey().defaultRandom(),
  docId:        uuid("doc_id").references(() => taxDocuments.id, { onDelete: "cascade" }).notNull(),
  provider:     varchar("provider",     { length: 50 }).notNull(),
  model:        varchar("model",        { length: 100 }),
  confidence:   numeric("confidence",   { precision: 4, scale: 3 }),
  reasoning:    text("reasoning"),
  proposalJson: jsonb("proposal_json").notNull(),
  status:       varchar("status",       { length: 20 }).default("pending"),
  reviewedAt:   timestamp("reviewed_at"),
  createdAt:    timestamp("created_at").defaultNow(),
});

// ─── Global Settings ──────────────────────────────────────────────────────────

export const globalSettings = pgTable("global_settings", {
  key:         varchar("key", { length: 100 }).primaryKey(),
  value:       text("value"),
  description: text("description"),
  updatedAt:   timestamp("updated_at").defaultNow(),
});

// ─── Timbrados ────────────────────────────────────────────────────────────────

export const timbrados = pgTable("timbrados", {
  id:             uuid("id").primaryKey().defaultRandom(),
  entityId:       uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  numero:         varchar("numero",         { length: 20 }).notNull(),
  tipo:           varchar("tipo",           { length: 50 }).default("factura"),
  puntoEmision:   varchar("punto_emision",  { length: 10 }),
  establecimiento:varchar("establecimiento",{ length: 10 }),
  rangoDesde:     varchar("rango_desde",    { length: 20 }),
  rangoHasta:     varchar("rango_hasta",    { length: 20 }),
  validoDesde:    timestamp("valido_desde").notNull(),
  validoHasta:    timestamp("valido_hasta").notNull(),
  isActive:       boolean("is_active").default(true),
  notas:          text("notas"),
  createdAt:      timestamp("created_at").defaultNow(),
  updatedAt:      timestamp("updated_at").defaultNow(),
});

export type Timbrado    = typeof timbrados.$inferSelect;
export type NewTimbrado = typeof timbrados.$inferInsert;

// ─── Retenciones (Tesaka) ─────────────────────────────────────────────────────

export const retenciones = pgTable("retenciones", {
  id:             uuid("id").primaryKey().defaultRandom(),
  entityId:       uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  periodoYear:    integer("periodo_year").notNull(),
  periodoMonth:   integer("periodo_month").notNull(),
  fecha:          timestamp("fecha").notNull(),
  terceroRuc:     varchar("tercero_ruc",   { length: 20 }).notNull(),
  terceroNombre:  text("tercero_nombre").notNull(),
  docTipo:        varchar("doc_tipo",      { length: 30 }).default("factura"),
  docNumero:      varchar("doc_numero",    { length: 20 }),
  montoBase:      numeric("monto_base",    { precision: 20, scale: 4 }).notNull(),
  tipoRetencion:  varchar("tipo_retencion",{ length: 50 }).notNull(),
  tasa:           numeric("tasa",          { precision: 6,  scale: 4 }).notNull(),
  montoRetencion: numeric("monto_retencion",{ precision: 20, scale: 4 }).notNull(),
  comprobanteRet: varchar("comprobante_ret",{ length: 20 }),
  status:         varchar("status",        { length: 20 }).default("borrador"),
  taxDocumentId:  uuid("tax_document_id").references(() => taxDocuments.id, { onDelete: "set null" }),
  createdAt:      timestamp("created_at").defaultNow(),
  updatedAt:      timestamp("updated_at").defaultNow(),
});

export type Retencion    = typeof retenciones.$inferSelect;
export type NewRetencion = typeof retenciones.$inferInsert;

// ─── New Tables (Vanguard Operations) ───────────────────────────────────────

export const partnerKindEnum = pgEnum("partner_kind", ["customer", "supplier", "both"]);

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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  description: text("description").notNull(),
  sku: varchar("sku", { length: 50 }),
  stockActual: numeric("stock_actual", { precision: 20, scale: 4 }).default("0").notNull(),
  costoPromedio: numeric("costo_promedio", { precision: 20, scale: 4 }).default("0").notNull(),
  glAccountId: uuid("gl_account_id").references(() => accounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stockTransactions = pgTable("stock_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id").references(() => inventoryItems.id, { onDelete: "cascade" }).notNull(),
  taxDocumentId: uuid("tax_document_id").references(() => taxDocuments.id, { onDelete: "set null" }),
  type: varchar("type", { length: 20 }).notNull(), // "purchase_in", "sale_out", "adjustment"
  quantity: numeric("quantity", { precision: 20, scale: 4 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 20, scale: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fixedAssets = pgTable("fixed_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  taxDocumentId: uuid("tax_document_id").references(() => taxDocuments.id, { onDelete: "set null" }),
  code: varchar("code", { length: 50 }).notNull(),
  name: text("name").notNull(),
  serialNumber: varchar("serial_number", { length: 100 }),
  adquisitionDate: date("adquisition_date" as any).notNull(),
  costValue: numeric("cost_value", { precision: 20, scale: 4 }).notNull(),
  usefulLifeMonths: integer("useful_life_months").notNull(),
  depreciatedValue: numeric("depreciated_value", { precision: 20, scale: 4 }).default("0"),
  glAccountId: uuid("gl_account_id").references(() => accounts.id, { onDelete: "set null" }),
  depreciationAccountId: uuid("depreciation_account_id").references(() => accounts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: varchar("account_number", { length: 50 }).notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).default("PYG"),
  glAccountId: uuid("gl_account_id").references(() => accounts.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
});
