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
  admitsFxAdjustment:  boolean("admits_fx_adjustment").default(false),
  nonDeductibleIre:    boolean("non_deductible_ire").default(false),
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


// ─── Tax Documents (comprobantes SIFEN) ──────────────────────────────────────

export const docTypeEnum = pgEnum("doc_type", [
  "invoice", "credit_note", "debit_note", "receipt", "self_invoice", "remito", "import",
]);

export const taxDocuments = pgTable("tax_documents", {
  id:             uuid("id").primaryKey().defaultRandom(),
  entityId:       uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  direction:      docDirectionEnum("direction").notNull(),
  docType:        docTypeEnum("doc_type").notNull(),
  number:         varchar("number",  { length: 100 }).notNull(),
  timbrado:       varchar("timbrado",    { length: 20 }),
  cdc:            varchar("cdc",         { length: 44 }),
  issueDate:      date("issue_date").notNull(),
  partnerId:      uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  currencyCode:   varchar("currency_code",{ length: 3 }).default("PYG"),
  fxRate:         numeric("fx_rate",     { precision: 20, scale: 6 }).default("1"),
  condition:      docConditionEnum("condition").default("credit"),
  status:         varchar("status",       { length: 50 }).default("pending"),
  sifenStatus:    varchar("sifen_status", { length: 50 }),
  gravado10:      numeric("gravado_10",  { precision: 20, scale: 4 }).default("0"),
  gravado5:       numeric("gravado_5",   { precision: 20, scale: 4 }).default("0"),
  exento:         numeric("exento",      { precision: 20, scale: 4 }).default("0"),
  iva10:          numeric("iva_10",      { precision: 20, scale: 4 }).default("0"),
  iva5:           numeric("iva_5",       { precision: 20, scale: 4 }).default("0"),
  total:          numeric("total",       { precision: 20, scale: 4 }).notNull(),
  ivaBookPeriod:  uuid("iva_book_period").references(() => fiscalPeriods.id, { onDelete: "set null" }),
  journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id, { onDelete: "set null" }),
  documentOrigenId: uuid("document_origen_id").references((): any => taxDocuments.id, { onDelete: "set null" }),
  metadata:       jsonb("metadata"),
  uploadedAt:     timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  processedAt:    timestamp("processed_at", { withTimezone: true }),
  createdAt:      timestamp("created_at").defaultNow(),
});

export type TaxDocument    = typeof taxDocuments.$inferSelect;
export type NewTaxDocument = typeof taxDocuments.$inferInsert;

export const taxDocumentLines = pgTable("tax_document_lines", {
  id:          uuid("id").primaryKey().defaultRandom(),
  documentId:  uuid("document_id").references(() => taxDocuments.id, { onDelete: "cascade" }).notNull(),
  itemCode:    varchar("item_code", { length: 100 }),
  description: text("description"),
  quantity:    numeric("quantity",   { precision: 20, scale: 4 }).default("1"),
  unitPrice:   numeric("unit_price", { precision: 20, scale: 4 }).notNull(),
  ivaRate:     integer("iva_rate").default(10),
  rubroIre:    integer("rubro_ire"),
  rubroIrp:    integer("rubro_irp"),
  incisoIva:   integer("inciso_iva"),
  accountId:   uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  amount:      numeric("amount", { precision: 20, scale: 4 }).notNull(),
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

export const receipts = pgTable("receipts", {
  id:            uuid("id").primaryKey().defaultRandom(),
  entityId:      uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  number:        varchar("number", { length: 100 }).notNull(),
  issueDate:     date("issue_date").notNull(),
  total:         numeric("total", { precision: 20, scale: 4 }).notNull(),
  partnerRuc:    varchar("partner_ruc", { length: 20 }).notNull(),
  partnerName:   text("partner_name").notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(), // 'cash', 'bank', 'card'
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "set null" }),
  journalEntryId:uuid("journal_entry_id").references(() => journalEntries.id, { onDelete: "set null" }),
  metadata:      jsonb("metadata"),
  createdAt:     timestamp("created_at").defaultNow(),
  updatedAt:     timestamp("updated_at").defaultNow(),
});

export const paymentInstallments = pgTable("payment_installments", {
  id:                uuid("id").primaryKey().defaultRandom(),
  documentId:        uuid("document_id").references(() => taxDocuments.id, { onDelete: "cascade" }).notNull(),
  installmentNumber: integer("installment_number").notNull(),
  dueDate:           date("due_date").notNull(),
  amount:            numeric("amount", { precision: 20, scale: 4 }).notNull(),
  status:            varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'paid'
  receiptId:         uuid("receipt_id").references((): any => receipts.id, { onDelete: "set null" }),
  createdAt:         timestamp("created_at").defaultNow(),
  updatedAt:         timestamp("updated_at").defaultNow(),
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

export const bankMovementDirectionEnum = pgEnum("bank_movement_direction", ["credit", "debit"]);
export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "pending", "matched", "flagged", "manual",
]);

export const bankMovements = pgTable("bank_movements", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  amount: numeric("amount", { precision: 20, scale: 4 }).notNull(),
  direction: bankMovementDirectionEnum("direction").notNull(),
  ref: varchar("ref", { length: 200 }),
  description: text("description"),
  source: varchar("source", { length: 50 }).default("manual"),
});

export const reconciliations = pgTable("reconciliations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "cascade" }).notNull(),
  glTransactionId: uuid("gl_transaction_id"),
  bankMovementId: uuid("bank_movement_id").references(() => bankMovements.id, { onDelete: "cascade" }),
  status: reconciliationStatusEnum("status").default("pending"),
  score: numeric("score", { precision: 5, scale: 2 }),
  matchedBy: varchar("matched_by", { length: 50 }).default("manual"),
  matchedAt: timestamp("matched_at"),
});

// ─── Fondo Fijo (Caja Chica) ──────────────────────────────────────────────────
export const pettyCashFunds = pgTable("petty_cash_funds", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  custodian: text("custodian").notNull(),
  maxAmount: numeric("max_amount", { precision: 20, scale: 4 }).notNull(),
  glAccountId: uuid("gl_account_id").references(() => accounts.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pettyCashReimbursements = pgTable("petty_cash_reimbursements", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").references(() => pettyCashFunds.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull(),
  totalAmount: numeric("total_amount", { precision: 20, scale: 4 }).notNull(),
  journalEntryId: uuid("journal_entry_id"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, posted
});

export const pettyCashExpenses = pgTable("petty_cash_expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  reimbursementId: uuid("reimbursement_id").references(() => pettyCashReimbursements.id, { onDelete: "cascade" }),
  fundId: uuid("fund_id").references(() => pettyCashFunds.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull(),
  partnerName: text("partner_name").notNull(),
  partnerRuc: varchar("partner_ruc", { length: 20 }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 20 }).notNull(),
  total: numeric("total", { precision: 20, scale: 4 }).notNull(),
  iva10: numeric("iva_10", { precision: 20, scale: 4 }).default("0"),
  iva5: numeric("iva_5", { precision: 20, scale: 4 }).default("0"),
  exento: numeric("exento", { precision: 20, scale: 4 }).default("0"),
  glAccountId: uuid("gl_account_id").references(() => accounts.id, { onDelete: "set null" }),
});

// ─── Despachos de Importacion ─────────────────────────────────────────────────
export const importClearances = pgTable("import_clearances", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  clearanceNumber: varchar("clearance_number", { length: 50 }).notNull(),
  date: timestamp("date").notNull(),
  fobValue: numeric("fob_value", { precision: 20, scale: 4 }).notNull(),
  freightValue: numeric("freight_value", { precision: 20, scale: 4 }).default("0"),
  insuranceValue: numeric("insurance_value", { precision: 20, scale: 4 }).default("0"),
  customsTax: numeric("customs_tax", { precision: 20, scale: 4 }).default("0"),
  ivaAduana: numeric("iva_aduana", { precision: 20, scale: 4 }).default("0"),
  totalGastoLocal: numeric("total_gasto_local", { precision: 20, scale: 4 }).default("0"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, processed
});

export const importClearanceExpenses = pgTable("import_clearance_expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  clearanceId: uuid("clearance_id").references(() => importClearances.id, { onDelete: "cascade" }).notNull(),
  taxDocumentId: uuid("tax_document_id").references(() => taxDocuments.id, { onDelete: "cascade" }).notNull(),
  allocatedAmount: numeric("allocated_amount", { precision: 20, scale: 4 }).notNull(),
});

// ─── OPs y Cheques (Tesoreria) ─────────────────────────────────────────────────
export const paymentOrders = pgTable("payment_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull(),
  number: varchar("number", { length: 50 }).notNull(),
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  totalAmount: numeric("total_amount", { precision: 20, scale: 4 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(), // "cash", "check", "bank_transfer"
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "set null" }),
  journalEntryId: uuid("journal_entry_id"),
  status: varchar("status", { length: 20 }).default("draft"), // draft, approved, paid
});

export const bankChecks = pgTable("bank_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  bankAccountId: uuid("bank_account_id").references(() => bankAccounts.id, { onDelete: "cascade" }).notNull(),
  checkNumber: varchar("check_number", { length: 50 }).notNull(),
  amount: numeric("amount", { precision: 20, scale: 4 }).notNull(),
  checkType: varchar("check_type", { length: 20 }).default("vista"), // vista, diferido
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  payeeName: text("payee_name").notNull(),
  paymentOrderId: uuid("payment_order_id").references(() => paymentOrders.id, { onDelete: "set null" }),
  status: varchar("status", { length: 20 }).default("issued"), // issued, cleared, voided
});

