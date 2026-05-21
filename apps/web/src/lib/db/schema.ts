/**
 * Minimal schema mirror for apps/web — only the tables queried by the web app.
 * Source of truth (migrations) lives in packages/ledger/db/schema.ts.
 * Keep in sync when the ledger schema changes.
 */
import {
  pgTable, uuid, varchar, text, integer, numeric,
  timestamp, jsonb, boolean, pgEnum,
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
  periodId:    uuid("period_id").references(() => fiscalPeriods.id, { onDelete: "set_null" }),
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
  cdc:            varchar("cdc",         { length: 44 }),
  timbrado:       varchar("timbrado",    { length: 20 }),
  docType:        taxDocTypeEnum("doc_type").default("factura"),
  docNumber:      varchar("doc_number",  { length: 20 }),
  issueDate:      timestamp("issue_date").notNull(),
  issuerRuc:      varchar("issuer_ruc",  { length: 20 }).notNull(),
  issuerName:     text("issuer_name").notNull(),
  receiverRuc:    varchar("receiver_ruc",{ length: 20 }),
  receiverName:   text("receiver_name"),
  subtotal:       numeric("subtotal",    { precision: 20, scale: 4 }).default("0"),
  iva10:          numeric("iva_10",      { precision: 20, scale: 4 }).default("0"),
  iva5:           numeric("iva_5",       { precision: 20, scale: 4 }).default("0"),
  ivaExento:      numeric("iva_exento",  { precision: 20, scale: 4 }).default("0"),
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
