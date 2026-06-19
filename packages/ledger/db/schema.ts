import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  jsonb,
  boolean,
  pgEnum,
  date,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
export const membershipRoleEnum = pgEnum("membership_role", ["admin", "accountant", "assistant", "auditor", "client"]);

// ─── Core: Entities ───────────────────────────────────────────────────────

export const entities = pgTable("entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  ruc: varchar("ruc", { length: 20 }).notNull().unique(),
  legalName: text("legal_name").notNull(),
  tradeName: text("trade_name"),
  taxRegimes: text("tax_regimes").array(),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("PYG"),
  status: entityStatusEnum("status").default("active"),
  aiProvider: varchar("ai_provider", { length: 50 }).notNull().default("gemini"),
  aiApiKey: text("ai_api_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

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
  status: journalEntryStatusEnum("status").default("draft"),
  postedAt: timestamp("posted_at", { withTimezone: true }),
  postedBy: uuid("posted_by"),
  reversalOf: uuid("reversal_of"),
  versionOf: uuid("version_of"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Core: Journal Lines ──────────────────────────────────────────────────

export const journalLines = pgTable("journal_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id").references(() => journalEntries.id, { onDelete: "cascade" }).notNull(),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }).notNull(),
  debit: numeric("debit", { precision: 20, scale: 4 }).default("0").notNull(),
  credit: numeric("credit", { precision: 20, scale: 4 }).default("0").notNull(),
  currencyCode: varchar("currency_code", { length: 3 }).notNull(),
  fxRate: numeric("fx_rate", { precision: 20, scale: 6 }).default("1"),
  amountBase: numeric("amount_base", { precision: 20, scale: 4 }).default("0"),
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
  gravado10: numeric("gravado_10", { precision: 20, scale: 4 }).default("0"),
  gravado5: numeric("gravado_5", { precision: 20, scale: 4 }).default("0"),
  exento: numeric("exento", { precision: 20, scale: 4 }).default("0"),
  iva10: numeric("iva_10", { precision: 20, scale: 4 }).default("0"),
  iva5: numeric("iva_5", { precision: 20, scale: 4 }).default("0"),
  total: numeric("total", { precision: 20, scale: 4 }).notNull(),
  ivaBookPeriod: uuid("iva_book_period").references(() => fiscalPeriods.id, { onDelete: "set null" }),
  journalEntryId: uuid("journal_entry_id").references(() => journalEntries.id, { onDelete: "set null" }),
  metadata: jsonb("metadata"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

// ─── Fiscal: Tax Document Lines ───────────────────────────────────────────

export const taxDocumentLines = pgTable("tax_document_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => taxDocuments.id, { onDelete: "cascade" }).notNull(),
  itemCode: varchar("item_code", { length: 100 }),
  description: text("description"),
  quantity: numeric("quantity", { precision: 20, scale: 4 }).default("1"),
  unitPrice: numeric("unit_price", { precision: 20, scale: 4 }).notNull(),
  ivaRate: integer("iva_rate").default(10),
  rubroIre: integer("rubro_ire"),
  rubroIrp: integer("rubro_irp"),
  incisoIva: integer("inciso_iva"),
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 20, scale: 4 }).notNull(),
});

// ─── Fiscal: Retentions ───────────────────────────────────────────────────

export const retentions = pgTable("retentions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => taxDocuments.id, { onDelete: "cascade" }).notNull(),
  retentionType: retentionTypeEnum("retention_type").notNull(),
  base: numeric("base", { precision: 20, scale: 4 }).notNull(),
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 20, scale: 4 }).notNull(),
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
  amount: numeric("amount", { precision: 20, scale: 4 }).notNull(),
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

// ─── Auth: Memberships ─────────────────────────────────────────────────────

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  entityId: uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }).notNull(),
  role: membershipRoleEnum("role").notNull().default("accountant"),
  invitedBy: varchar("invited_by", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  unique("memberships_user_entity_unique").on(table.userId, table.entityId),
  index("memberships_user_id_idx").on(table.userId),
  index("memberships_entity_id_idx").on(table.entityId),
]);

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
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  entity: one(entities, { fields: [memberships.entityId], references: [entities.id] }),
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
