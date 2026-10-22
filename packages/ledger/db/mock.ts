import * as schema from "./schema";

// ─── In-memory mock store ─────────────────────────────────────────────────
// This replaces the DB when DATABASE_URL is not configured.
// All repository functions check isMockMode() and use this store.

type Entity = typeof schema.entities.$inferSelect;
type FiscalPeriod = typeof schema.fiscalPeriods.$inferSelect;
type ChartOfAccount = typeof schema.chartOfAccounts.$inferSelect;
type Account = typeof schema.accounts.$inferSelect;
type CostCenter = typeof schema.costCenters.$inferSelect;
type JournalEntry = typeof schema.journalEntries.$inferSelect;
type JournalLine = typeof schema.journalLines.$inferSelect;
type Partner = typeof schema.partners.$inferSelect;
type TaxDocument = typeof schema.taxDocuments.$inferSelect;
type TaxDocumentLine = typeof schema.taxDocumentLines.$inferSelect;
type Retention = typeof schema.retentions.$inferSelect;
type BankAccount = typeof schema.bankAccounts.$inferSelect;
type BankMovement = typeof schema.bankMovements.$inferSelect;
type BankStatement = typeof schema.bankStatements.$inferSelect;
type Reconciliation = typeof schema.reconciliations.$inferSelect;
type AuditEvent = typeof schema.auditEvents.$inferSelect;
type AiDecision = typeof schema.aiDecisions.$inferSelect;

export interface MockStore {
  entities: Entity[];
  fiscalPeriods: FiscalPeriod[];
  chartOfAccounts: ChartOfAccount[];
  accounts: Account[];
  costCenters: CostCenter[];
  journalEntries: JournalEntry[];
  journalLines: JournalLine[];
  partners: Partner[];
  taxDocuments: TaxDocument[];
  taxDocumentLines: TaxDocumentLine[];
  retentions: Retention[];
  bankAccounts: BankAccount[];
  bankMovements: BankMovement[];
  bankStatements: BankStatement[];
  reconciliations: Reconciliation[];
  auditEvents: AuditEvent[];
  aiDecisions: AiDecision[];
}

// Stable UUIDs generated from deterministic strings for reproducibility
function stableId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(12, "0");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4000-8${hex.slice(13, 16)}-${hex.slice(16, 28)}`;
}

const E1 = stableId("entity-importadora-este");
const E2 = stableId("entity-tech-ausncion");
const COA1 = stableId("coa-importadora-fiscal");
const COA2 = stableId("coa-tech-fiscal");
const P_MAY = stableId("period-2026-05");
const P_JUN = stableId("period-2026-06");
const P_ABR = stableId("period-2026-04");

// For Drizzle pgDate columns — $inferSelect returns string
function dateVal(d: string): string {
  return d;
}

function tsVal(d: string): Date {
  return new Date(d + "-04:00");
}

// ─── Accounts ─────────────────────────────────────────────────────────────

const ACCOUNTS: Account[] = [
  { id: stableId("acct-1.1.01"), coaId: COA1, code: "1.1.01", name: "Caja", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-1.1.02"), coaId: COA1, code: "1.1.02", name: "Banco Galicia Cta. Cte.", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-1.1.03"), coaId: COA1, code: "1.1.03", name: "Banco Itaú Cta. Cte.", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-1.1.05"), coaId: COA1, code: "1.1.05", name: "Cuentas a Cobrar Clientes", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-1.1.06"), coaId: COA1, code: "1.1.06", name: "IVA Crédito Fiscal", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: { iva: "credito_10" }, eefLineId: null },
  { id: stableId("acct-1.1.07"), coaId: COA1, code: "1.1.07", name: "IVA Crédito Fiscal 5%", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: { iva: "credito_5" }, eefLineId: null },
  { id: stableId("acct-1.2.01"), coaId: COA1, code: "1.2.01", name: "Mercaderías", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-1.2.02"), coaId: COA1, code: "1.2.02", name: "Rodados", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-1.2.03"), coaId: COA1, code: "1.2.03", name: "Mobiliario y Útiles", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-1.2.04"), coaId: COA1, code: "1.2.04", name: "Equipo de Computación", nature: "asset", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-2.1.01"), coaId: COA1, code: "2.1.01", name: "Cuentas a Pagar Proveedores", nature: "liability", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-2.1.02"), coaId: COA1, code: "2.1.02", name: "IVA Débito Fiscal", nature: "liability", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: { iva: "debito_10" }, eefLineId: null },
  { id: stableId("acct-2.1.03"), coaId: COA1, code: "2.1.03", name: "IVA Débito Fiscal 5%", nature: "liability", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: { iva: "debito_5" }, eefLineId: null },
  { id: stableId("acct-2.1.05"), coaId: COA1, code: "2.1.05", name: "Retenciones a Pagar", nature: "liability", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-2.1.06"), coaId: COA1, code: "2.1.06", name: "IRE a Pagar", nature: "liability", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-3.1.01"), coaId: COA1, code: "3.1.01", name: "Capital Social", nature: "equity", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-3.1.02"), coaId: COA1, code: "3.1.02", name: "Reserva Legal", nature: "equity", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-3.1.03"), coaId: COA1, code: "3.1.03", name: "Resultados Acumulados", nature: "equity", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-3.1.04"), coaId: COA1, code: "3.1.04", name: "Resultado del Ejercicio", nature: "equity", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-4.1.01"), coaId: COA1, code: "4.1.01", name: "Ventas de Mercaderías", nature: "income", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-4.1.02"), coaId: COA1, code: "4.1.02", name: "Prestación de Servicios", nature: "income", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-4.1.03"), coaId: COA1, code: "4.1.03", name: "Otros Ingresos", nature: "income", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.01"), coaId: COA1, code: "5.1.01", name: "Costo de Mercaderías Vendidas", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.02"), coaId: COA1, code: "5.1.02", name: "Sueldos y Salarios", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.03"), coaId: COA1, code: "5.1.03", name: "Seguridad Social", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.04"), coaId: COA1, code: "5.1.04", name: "Honorarios Profesionales", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.05"), coaId: COA1, code: "5.1.05", name: "Alquileres", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.06"), coaId: COA1, code: "5.1.06", name: "Servicios Públicos", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.07"), coaId: COA1, code: "5.1.07", name: "Depreciación de Rodados", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.08"), coaId: COA1, code: "5.1.08", name: "Depreciación Eq. Computación", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.09"), coaId: COA1, code: "5.1.09", name: "Gastos Financieros", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
  { id: stableId("acct-5.1.10"), coaId: COA1, code: "5.1.10", name: "Otros Gastos", nature: "expense", parentId: null, allowsPosting: true, costCenterRequired: false, taxMappings: null, eefLineId: null },
];

// Duplicate accounts for entity 2
const ACCOUNTS_E2: Account[] = ACCOUNTS.map((a) => ({
  ...a,
  id: stableId("e2-" + a.code),
  coaId: COA2,
}));

// ─── Partners ─────────────────────────────────────────────────────────────

const PARTNERS: Partner[] = [
  {
    id: stableId("partner-importadora-este"),
    entityId: E1,
    kind: "supplier",
    ruc: "80012345-1",
    legalName: "Importadora del Este S.A.",
    tradeName: "ImportEste",
    contacts: { email: "compras@importeste.com.py", phone: "+595 21 500 100", address: "Av. Mcal. López 1234, Asunción" },
    defaultPaymentTerms: 30,
    defaultAccountId: stableId("acct-2.1.01"),
    retentionProfile: null,
    country: "PRY",
    dvRuc: "1",
    createdAt: tsVal("2024-01-15T10:00:00"),
    updatedAt: tsVal("2025-03-01T14:30:00"),
  },
  {
    id: stableId("partner-servicios-contables"),
    entityId: E1,
    kind: "supplier",
    ruc: "4567890-1",
    legalName: "Servicios Contables Del Paraguay",
    tradeName: "SerConPy",
    contacts: { email: "info@serconpy.com.py", phone: "+595 21 300 400" },
    defaultPaymentTerms: 15,
    defaultAccountId: stableId("acct-5.1.04"),
    retentionProfile: { iva: true, ire: true, rate_ire: 0.5 },
    country: "PRY",
    dvRuc: "1",
    createdAt: tsVal("2024-03-01T10:00:00"),
    updatedAt: tsVal("2025-04-10T09:00:00"),
  },
  {
    id: stableId("partner-tecnologia-asuncion"),
    entityId: E1,
    kind: "supplier",
    ruc: "80023456-2",
    legalName: "Tecnología Asunción SRL",
    tradeName: "TechAsu",
    contacts: { email: "ventas@techasu.com.py", phone: "+595 21 600 700" },
    defaultPaymentTerms: 45,
    defaultAccountId: stableId("acct-2.1.01"),
    retentionProfile: null,
    country: "PRY",
    dvRuc: "2",
    createdAt: tsVal("2024-06-15T10:00:00"),
    updatedAt: tsVal("2025-02-20T11:00:00"),
  },
  {
    id: stableId("partner-distribuciones-nanduti"),
    entityId: E1,
    kind: "supplier",
    ruc: "1234567-8",
    legalName: "Distribuciones Ñandutí S.A.",
    tradeName: "DÑandutí",
    contacts: { email: "pedidos@nanduti.com.py", phone: "+595 21 800 900" },
    defaultPaymentTerms: 60,
    defaultAccountId: stableId("acct-2.1.01"),
    retentionProfile: null,
    country: "PRY",
    dvRuc: "8",
    createdAt: tsVal("2024-02-10T10:00:00"),
    updatedAt: tsVal("2025-01-15T16:00:00"),
  },
  {
    id: stableId("partner-agropecuaria-guarani"),
    entityId: E1,
    kind: "supplier",
    ruc: "9876543-2",
    legalName: "Agropecuaria Guaraní",
    tradeName: "AgroGuaraní",
    contacts: { email: "ventas@agroguarani.com.py", phone: "+595 521 100 200" },
    defaultPaymentTerms: 7,
    defaultAccountId: stableId("acct-2.1.01"),
    retentionProfile: { iva: true, ire: false },
    country: "PRY",
    dvRuc: "2",
    createdAt: tsVal("2024-04-01T10:00:00"),
    updatedAt: tsVal("2025-05-01T08:00:00"),
  },
  {
    id: stableId("partner-cliente-1"),
    entityId: E1,
    kind: "customer",
    ruc: "3456789-0",
    legalName: "Comercial Paraguaya S.A.",
    tradeName: "ComerPar",
    contacts: { email: "pagos@comercialpar.com.py" },
    defaultPaymentTerms: 30,
    defaultAccountId: stableId("acct-1.1.05"),
    retentionProfile: null,
    country: "PRY",
    dvRuc: "0",
    createdAt: tsVal("2024-01-10T10:00:00"),
    updatedAt: tsVal("2025-03-01T10:00:00"),
  },
];

// ─── Entities ─────────────────────────────────────────────────────────────

const ENTITIES: Entity[] = [
  {
    id: E1,
    ruc: "80012345-1",
    legalName: "Importadora del Este S.A.",
    tradeName: "ImportEste",
    taxRegimes: ["IVA_GRAL", "IRE_GRAL"],
    baseCurrency: "PYG",
    status: "active",
    createdAt: tsVal("2024-01-01T00:00:00"),
    updatedAt: tsVal("2025-05-01T00:00:00"),
  },
  {
    id: E2,
    ruc: "5001234-0",
    legalName: "Tech Asunción S.A.",
    tradeName: "TechAsu",
    taxRegimes: ["IVA_GRAL", "IRE_RESIMPLE"],
    baseCurrency: "PYG",
    status: "active",
    createdAt: tsVal("2024-06-01T00:00:00"),
    updatedAt: tsVal("2025-05-01T00:00:00"),
  },
];

// ─── Fiscal Periods ───────────────────────────────────────────────────────

const FISCAL_PERIODS: FiscalPeriod[] = [
  { id: P_ABR, entityId: E1, year: 2026, month: 4, status: "closed", closedAt: tsVal("2026-05-02T10:00:00"), closedBy: null },
  { id: P_MAY, entityId: E1, year: 2026, month: 5, status: "open", closedAt: null, closedBy: null },
  { id: P_JUN, entityId: E1, year: 2026, month: 6, status: "open", closedAt: null, closedBy: null },
  { id: stableId("period-e2-05"), entityId: E2, year: 2026, month: 5, status: "open", closedAt: null, closedBy: null },
];

// ─── Chart of Accounts ────────────────────────────────────────────────────

const COAS: ChartOfAccount[] = [
  { id: COA1, entityId: E1, kind: "fiscal_py", name: "Plan de Cuentas Fiscal PY" },
  { id: COA2, entityId: E2, kind: "fiscal_py", name: "Plan de Cuentas Fiscal PY" },
];

// ─── Journal Entries & Lines ──────────────────────────────────────────────

const JE1 = stableId("je-compra-mercaderia");
const JE2 = stableId("je-honorarios-contables");
const JE3 = stableId("je-compra-tecnologia");
const JE4 = stableId("je-venta-mercaderia");

const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: JE1,
    entityId: E1,
    periodId: P_MAY,
    date: tsVal("2026-05-01T00:00:00"),
    number: "001-2026",
    source: "purchase",
    sourceRef: "001-001-00234",
    description: "Compra mercadería Factura 001-001-00234 Importadora del Este",
    status: "posted",
    postedAt: tsVal("2026-05-01T10:30:00"),
    postedBy: null,
    reversalOf: null,
    versionOf: null,
    metadata: { cdc: "5897185478912345678901234567890123456789012345", tipo: "factura", timbrado: "12345678" },
    createdAt: tsVal("2026-05-01T10:00:00"),
  },
  {
    id: JE2,
    entityId: E1,
    periodId: P_MAY,
    date: tsVal("2026-05-03T00:00:00"),
    number: "002-2026",
    source: "purchase",
    sourceRef: "002-001-00089",
    description: "Honorarios contables Factura 002-001-00089 SerConPy",
    status: "posted",
    postedAt: tsVal("2026-05-03T14:15:00"),
    postedBy: null,
    reversalOf: null,
    versionOf: null,
    metadata: { cdc: "5897185478912345678901234567890123456789012346", tipo: "factura", timbrado: "23456789" },
    createdAt: tsVal("2026-05-03T14:00:00"),
  },
  {
    id: JE3,
    entityId: E1,
    periodId: P_MAY,
    date: tsVal("2026-05-05T00:00:00"),
    number: "003-2026",
    source: "purchase",
    sourceRef: "001-001-00056",
    description: "Nota de crédito por devolución - Distribuciones Ñandutí",
    status: "posted",
    postedAt: tsVal("2026-05-05T09:45:00"),
    postedBy: null,
    reversalOf: null,
    versionOf: null,
    metadata: { cdc: "5897185478912345678901234567890123456789012348", tipo: "nota_credito", timbrado: "34567890" },
    createdAt: tsVal("2026-05-05T09:30:00"),
  },
  {
    id: JE4,
    entityId: E1,
    periodId: P_MAY,
    date: tsVal("2026-05-10T00:00:00"),
    number: "004-2026",
    source: "sales",
    sourceRef: "001-001-00001",
    description: "Venta de mercadería factura 001-001-00001 a Comercial Paraguaya",
    status: "posted",
    postedAt: tsVal("2026-05-10T16:00:00"),
    postedBy: null,
    reversalOf: null,
    versionOf: null,
    metadata: null,
    createdAt: tsVal("2026-05-10T15:00:00"),
  },
];

const JOURNAL_LINES: JournalLine[] = [
  // JE1: Compra mercadería (10% IVA) ₲ 10,000,000 + IVA 1,000,000 = 11,000,000
  { id: stableId("jl-1a"), entryId: JE1, accountId: stableId("acct-1.2.01"), debit: "10000000.0000", credit: "0.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "10000000.0000", costCenterId: null, partnerId: stableId("partner-importadora-este"), taxDocumentId: stableId("td-1"), description: "Compra de mercadería gravada 10%" },
  { id: stableId("jl-1b"), entryId: JE1, accountId: stableId("acct-1.1.06"), debit: "1000000.0000", credit: "0.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "1000000.0000", costCenterId: null, partnerId: stableId("partner-importadora-este"), taxDocumentId: stableId("td-1"), description: "IVA Crédito 10%" },
  { id: stableId("jl-1c"), entryId: JE1, accountId: stableId("acct-2.1.01"), debit: "0.0000", credit: "11000000.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "11000000.0000", costCenterId: null, partnerId: stableId("partner-importadora-este"), taxDocumentId: stableId("td-1"), description: "Proveedores a pagar" },

  // JE2: Honorarios contables (IVA 10%, retención IRE 0.5%) ₲ 2,500,000 + IVA 250,000 = 2,750,000
  { id: stableId("jl-2a"), entryId: JE2, accountId: stableId("acct-5.1.04"), debit: "2500000.0000", credit: "0.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "2500000.0000", costCenterId: null, partnerId: stableId("partner-servicios-contables"), taxDocumentId: stableId("td-2"), description: "Honorarios profesionales" },
  { id: stableId("jl-2b"), entryId: JE2, accountId: stableId("acct-1.1.06"), debit: "250000.0000", credit: "0.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "250000.0000", costCenterId: null, partnerId: stableId("partner-servicios-contables"), taxDocumentId: stableId("td-2"), description: "IVA Crédito 10%" },
  { id: stableId("jl-2c"), entryId: JE2, accountId: stableId("acct-2.1.01"), debit: "0.0000", credit: "2737500.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "2737500.0000", costCenterId: null, partnerId: stableId("partner-servicios-contables"), taxDocumentId: stableId("td-2"), description: "Proveedores a pagar" },
  { id: stableId("jl-2d"), entryId: JE2, accountId: stableId("acct-2.1.05"), debit: "0.0000", credit: "12500.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "12500.0000", costCenterId: null, partnerId: stableId("partner-servicios-contables"), taxDocumentId: stableId("td-2"), description: "Retención IRE 0.5%" },

  // JE3: Nota de crédito (devolución de compra) ₲ -550,000
  { id: stableId("jl-3a"), entryId: JE3, accountId: stableId("acct-2.1.01"), debit: "550000.0000", credit: "0.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "550000.0000", costCenterId: null, partnerId: stableId("partner-distribuciones-nanduti"), taxDocumentId: stableId("td-4"), description: "NC - débito a proveedores" },
  { id: stableId("jl-3b"), entryId: JE3, accountId: stableId("acct-1.2.01"), debit: "0.0000", credit: "500000.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "500000.0000", costCenterId: null, partnerId: stableId("partner-distribuciones-nanduti"), taxDocumentId: stableId("td-4"), description: "NC - devolución mercadería" },
  { id: stableId("jl-3c"), entryId: JE3, accountId: stableId("acct-1.1.06"), debit: "0.0000", credit: "50000.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "50000.0000", costCenterId: null, partnerId: stableId("partner-distribuciones-nanduti"), taxDocumentId: stableId("td-4"), description: "NC - devolución IVA crédito" },

  // JE4: Venta de mercadería ₲ 5,500,000 + IVA 500,000 = 6,050,000
  { id: stableId("jl-4a"), entryId: JE4, accountId: stableId("acct-1.1.05"), debit: "6050000.0000", credit: "0.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "6050000.0000", costCenterId: null, partnerId: stableId("partner-cliente-1"), taxDocumentId: stableId("td-5"), description: "Clientes a cobrar" },
  { id: stableId("jl-4b"), entryId: JE4, accountId: stableId("acct-4.1.01"), debit: "0.0000", credit: "5500000.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "5500000.0000", costCenterId: null, partnerId: stableId("partner-cliente-1"), taxDocumentId: stableId("td-5"), description: "Ventas de mercaderías" },
  { id: stableId("jl-4c"), entryId: JE4, accountId: stableId("acct-2.1.02"), debit: "0.0000", credit: "550000.0000", currencyCode: "PYG", fxRate: "1.000000", amountBase: "550000.0000", costCenterId: null, partnerId: stableId("partner-cliente-1"), taxDocumentId: stableId("td-5"), description: "IVA Débito 10%" },
];

// ─── Tax Documents ────────────────────────────────────────────────────────

const TAX_DOCS: TaxDocument[] = [
  {
    id: stableId("td-1"), entityId: E1, direction: "received", docType: "invoice",
    number: "001-001-00234", timbrado: "12345678",
    cdc: "5897185478912345678901234567890123456789012345",
    issueDate: dateVal("2026-05-01"), partnerId: stableId("partner-importadora-este"),
    currencyCode: "PYG", fxRate: "1.000000", condition: "credit",
    status: "posted", sifenStatus: "validated",
    gravado10: "10000000.0000", gravado5: "0.0000", exento: "0.0000",
    iva10: "1000000.0000", iva5: "0.0000", total: "11000000.0000",
    ivaBookPeriod: P_MAY, journalEntryId: JE1,
    metadata: { sifen_xml_hash: "abc123", processed_by: "rule-engine" },
    uploadedAt: tsVal("2026-05-01T10:00:00"),
    processedAt: tsVal("2026-05-01T10:30:00"),
  },
  {
    id: stableId("td-2"), entityId: E1, direction: "received", docType: "invoice",
    number: "002-001-00089", timbrado: "23456789",
    cdc: "5897185478912345678901234567890123456789012346",
    issueDate: dateVal("2026-05-03"), partnerId: stableId("partner-servicios-contables"),
    currencyCode: "PYG", fxRate: "1.000000", condition: "credit",
    status: "posted", sifenStatus: "validated",
    gravado10: "2500000.0000", gravado5: "0.0000", exento: "0.0000",
    iva10: "250000.0000", iva5: "0.0000", total: "2750000.0000",
    ivaBookPeriod: P_MAY, journalEntryId: JE2,
    metadata: { sifen_xml_hash: "def456", processed_by: "rule-engine", retention_ire: "0.5" },
    uploadedAt: tsVal("2026-05-03T14:00:00"),
    processedAt: tsVal("2026-05-03T14:15:00"),
  },
  {
    id: stableId("td-3"), entityId: E1, direction: "received", docType: "invoice",
    number: "001-001-00345", timbrado: "34567890",
    cdc: "5897185478912345678901234567890123456789012347",
    issueDate: dateVal("2026-05-02"), partnerId: stableId("partner-tecnologia-asuncion"),
    currencyCode: "PYG", fxRate: "1.000000", condition: "credit",
    status: "pending", sifenStatus: "validated",
    gravado10: "15000000.0000", gravado5: "0.0000", exento: "0.0000",
    iva10: "1500000.0000", iva5: "0.0000", total: "16500000.0000",
    ivaBookPeriod: P_MAY, journalEntryId: null,
    metadata: { sifen_xml_hash: "ghi789", ai_suggestion: true, ai_confidence: 88 },
    uploadedAt: tsVal("2026-05-02T08:00:00"),
    processedAt: null,
  },
  {
    id: stableId("td-4"), entityId: E1, direction: "received", docType: "credit_note",
    number: "001-001-00056", timbrado: "34567890",
    cdc: "5897185478912345678901234567890123456789012348",
    issueDate: dateVal("2026-05-05"), partnerId: stableId("partner-distribuciones-nanduti"),
    currencyCode: "PYG", fxRate: "1.000000", condition: "credit",
    status: "pending", sifenStatus: "validated",
    gravado10: "-500000.0000", gravado5: "0.0000", exento: "0.0000",
    iva10: "-50000.0000", iva5: "0.0000", total: "-550000.0000",
    ivaBookPeriod: P_MAY, journalEntryId: JE3,
    metadata: { sifen_xml_hash: "jkl012", ai_suggestion: true, ai_confidence: 90 },
    uploadedAt: tsVal("2026-05-05T09:00:00"),
    processedAt: tsVal("2026-05-05T09:45:00"),
  },
  {
    id: stableId("td-5"), entityId: E1, direction: "issued", docType: "invoice",
    number: "001-001-00001", timbrado: "11111111",
    cdc: "5897185478912345678901234567890123456789012350",
    issueDate: dateVal("2026-05-10"), partnerId: stableId("partner-cliente-1"),
    currencyCode: "PYG", fxRate: "1.000000", condition: "credit",
    status: "posted", sifenStatus: "validated",
    gravado10: "5500000.0000", gravado5: "0.0000", exento: "0.0000",
    iva10: "550000.0000", iva5: "0.0000", total: "6050000.0000",
    ivaBookPeriod: P_MAY, journalEntryId: JE4,
    metadata: { sifen_xml_hash: "mno345" },
    uploadedAt: tsVal("2026-05-10T15:00:00"),
    processedAt: tsVal("2026-05-10T16:00:00"),
  },
  {
    id: stableId("td-6"), entityId: E1, direction: "received", docType: "invoice",
    number: "001-001-01123", timbrado: "45678901",
    cdc: "5897185478912345678901234567890123456789012349",
    issueDate: dateVal("2026-05-08"), partnerId: stableId("partner-agropecuaria-guarani"),
    currencyCode: "PYG", fxRate: "1.000000", condition: "credit",
    status: "error", sifenStatus: "rejected",
    gravado10: "3750000.0000", gravado5: "0.0000", exento: "0.0000",
    iva10: "375000.0000", iva5: "0.0000", total: "4125000.0000",
    ivaBookPeriod: P_MAY, journalEntryId: null,
    metadata: { error: "RUC emisor no coincide con timbrado", sifen_xml_hash: "pqr678" },
    uploadedAt: tsVal("2026-05-08T11:00:00"),
    processedAt: null,
  },
  {
    id: stableId("td-7"), entityId: E1, direction: "received", docType: "invoice",
    number: "001-001-01145", timbrado: "56789012",
    cdc: "5897185478912345678901234567890123456789012351",
    issueDate: dateVal("2026-05-12"), partnerId: stableId("partner-importadora-este"),
    currencyCode: "PYG", fxRate: "1.000000", condition: "credit",
    status: "pending", sifenStatus: "validated",
    gravado10: "8500000.0000", gravado5: "0.0000", exento: "0.0000",
    iva10: "850000.0000", iva5: "0.0000", total: "9350000.0000",
    ivaBookPeriod: P_MAY, journalEntryId: null,
    metadata: { sifen_xml_hash: "stu901", ai_suggestion: true, ai_confidence: 94 },
    uploadedAt: tsVal("2026-05-12T10:00:00"),
    processedAt: null,
  },
];

const TAX_DOC_LINES: TaxDocumentLine[] = [
  { id: stableId("tdl-1a"), documentId: stableId("td-1"), itemCode: "MER-001", description: "Mercadería variada lote A", quantity: "100.0000", unitPrice: "100000.0000", ivaRate: 10, rubroIre: null, rubroIrp: null, incisoIva: 1, accountId: stableId("acct-1.2.01"), amount: "10000000.0000" },
  { id: stableId("tdl-2a"), documentId: stableId("td-2"), itemCode: "SERV-CONT", description: "Servicios contables mayo 2026", quantity: "1.0000", unitPrice: "2500000.0000", ivaRate: 10, rubroIre: 500, rubroIrp: null, incisoIva: 1, accountId: stableId("acct-5.1.04"), amount: "2500000.0000" },
  { id: stableId("tdl-3a"), documentId: stableId("td-3"), itemCode: "TECH-001", description: "Equipos de computación y software", quantity: "5.0000", unitPrice: "3000000.0000", ivaRate: 10, rubroIre: null, rubroIrp: null, incisoIva: 1, accountId: stableId("acct-1.2.04"), amount: "15000000.0000" },
  { id: stableId("tdl-4a"), documentId: stableId("td-4"), itemCode: "DEV-001", description: "Devolución mercadería defectuosa", quantity: "5.0000", unitPrice: "100000.0000", ivaRate: 10, rubroIre: null, rubroIrp: null, incisoIva: 1, accountId: stableId("acct-1.2.01"), amount: "-500000.0000" },
  { id: stableId("tdl-5a"), documentId: stableId("td-5"), itemCode: "VENTA-001", description: "Venta de mercaderías", quantity: "50.0000", unitPrice: "110000.0000", ivaRate: 10, rubroIre: null, rubroIrp: null, incisoIva: 1, accountId: stableId("acct-4.1.01"), amount: "5500000.0000" },
  { id: stableId("tdl-6a"), documentId: stableId("td-6"), itemCode: "AGR-001", description: "Productos agrícolas", quantity: "100.0000", unitPrice: "37500.0000", ivaRate: 10, rubroIre: null, rubroIrp: null, incisoIva: 1, accountId: stableId("acct-1.2.01"), amount: "3750000.0000" },
  { id: stableId("tdl-7a"), documentId: stableId("td-7"), itemCode: "MER-002", description: "Mercadería variada lote B", quantity: "85.0000", unitPrice: "100000.0000", ivaRate: 10, rubroIre: null, rubroIrp: null, incisoIva: 1, accountId: stableId("acct-1.2.01"), amount: "8500000.0000" },
];

// ─── Retentions ───────────────────────────────────────────────────────────

const RETENTIONS: Retention[] = [
  {
    id: stableId("ret-je2-ire"),
    documentId: stableId("td-2"),
    retentionType: "ire",
    base: "2500000.0000",
    rate: "0.50",
    amount: "12500.0000",
    certificateNumber: "RET-2026-0001",
    withheldAt: dateVal("2026-05-03"),
  },
];

// ─── Bank Accounts ────────────────────────────────────────────────────────

const BANK_ACCOUNTS: BankAccount[] = [
  { id: stableId("bank-gnp-cte"), entityId: E1, bankName: "Banco GNB", accountNumber: "001-0123456-78", currencyCode: "PYG", glAccountId: stableId("acct-1.1.03"), isActive: true },
  { id: stableId("bank-conti-cte"), entityId: E1, bankName: "Banco Continental", accountNumber: "002-0234567-89", currencyCode: "PYG", glAccountId: stableId("acct-1.1.03"), isActive: true },
];

// ─── Bank Movements ───────────────────────────────────────────────────────

const BANK_MOVEMENTS: BankMovement[] = [
  { id: stableId("bm-1"), bankAccountId: stableId("bank-gnp-cte"), date: dateVal("2026-05-02"), amount: "11000000.0000", direction: "debit", ref: "PAGO-001", description: "Pago a Importadora del Este", source: "statement" },
  { id: stableId("bm-2"), bankAccountId: stableId("bank-gnp-cte"), date: dateVal("2026-05-04"), amount: "2737500.0000", direction: "debit", ref: "PAGO-002", description: "Pago a SerConPy", source: "statement" },
  { id: stableId("bm-3"), bankAccountId: stableId("bank-conti-cte"), date: dateVal("2026-05-11"), amount: "6050000.0000", direction: "credit", ref: "COBRO-001", description: "Cobro de Comercial Paraguaya", source: "statement" },
  { id: stableId("bm-4"), bankAccountId: stableId("bank-gnp-cte"), date: dateVal("2026-05-01"), amount: "2500000.0000", direction: "debit", ref: "ALU-2026-05", description: "Pago alquiler local", source: "manual" },
];

// ─── Reconciliations ──────────────────────────────────────────────────────

const RECONCILIATIONS: Reconciliation[] = [
  { id: stableId("rec-1"), bankAccountId: stableId("bank-gnp-cte"), glTransactionId: JE1, bankMovementId: stableId("bm-1"), status: "matched", score: "98.00", matchedBy: "ai", matchedAt: tsVal("2026-05-03T08:00:00") },
  { id: stableId("rec-2"), bankAccountId: stableId("bank-gnp-cte"), glTransactionId: JE2, bankMovementId: stableId("bm-2"), status: "matched", score: "95.00", matchedBy: "ai", matchedAt: tsVal("2026-05-04T08:00:00") },
  { id: stableId("rec-3"), bankAccountId: stableId("bank-conti-cte"), glTransactionId: JE4, bankMovementId: stableId("bm-3"), status: "matched", score: "99.00", matchedBy: "ai", matchedAt: tsVal("2026-05-12T08:00:00") },
  { id: stableId("rec-4"), bankAccountId: stableId("bank-gnp-cte"), glTransactionId: null, bankMovementId: stableId("bm-4"), status: "pending", score: null, matchedBy: "manual", matchedAt: null },
];

// ─── Audit Events ─────────────────────────────────────────────────────────

const AUDIT_EVENTS: AuditEvent[] = [
  { id: stableId("audit-1"), entityId: E1, actorId: "user-1", action: "create_journal", targetType: "journal_entry", targetId: JE1, before: null, after: { status: "posted" }, reason: "Asiento generado desde SIFEN XML", createdAt: tsVal("2026-05-01T10:30:00") },
  { id: stableId("audit-2"), entityId: E1, actorId: "user-1", action: "create_journal", targetType: "journal_entry", targetId: JE2, before: null, after: { status: "posted" }, reason: "Asiento generado desde SIFEN XML", createdAt: tsVal("2026-05-03T14:15:00") },
  { id: stableId("audit-3"), entityId: E1, actorId: "user-1", action: "close_period", targetType: "fiscal_period", targetId: P_ABR, before: { status: "open" }, after: { status: "closed" }, reason: "Cierre mensual abril 2026", createdAt: tsVal("2026-05-02T10:00:00") },
];

// ─── AI Decisions ─────────────────────────────────────────────────────────

const AI_DECISIONS: AiDecision[] = [
  {
    id: stableId("ai-td-3"), entityId: E1, kind: "sifen_journal_suggestion",
    input: { documentId: stableId("td-3") },
    output: { account: "Equipo de Computación", debit: "15000000", credit: "0", confidence: 88 },
    confidence: 88, accepted: false, acceptedBy: null,
    createdAt: tsVal("2026-05-02T08:01:00"),
  },
  {
    id: stableId("ai-td-7"), entityId: E1, kind: "sifen_journal_suggestion",
    input: { documentId: stableId("td-7") },
    output: { account: "Mercaderías", debit: "8500000", credit: "0", confidence: 94 },
    confidence: 94, accepted: false, acceptedBy: null,
    createdAt: tsVal("2026-05-12T10:01:00"),
  },
];

// ─── Assemble ─────────────────────────────────────────────────────────────

export const mockStore: MockStore = {
  entities: ENTITIES,
  fiscalPeriods: FISCAL_PERIODS,
  chartOfAccounts: COAS,
  accounts: [...ACCOUNTS, ...ACCOUNTS_E2],
  costCenters: [],
  journalEntries: JOURNAL_ENTRIES,
  journalLines: JOURNAL_LINES,
  partners: PARTNERS,
  taxDocuments: TAX_DOCS,
  taxDocumentLines: TAX_DOC_LINES,
  retentions: RETENTIONS,
  bankAccounts: BANK_ACCOUNTS,
  bankMovements: BANK_MOVEMENTS,
  bankStatements: [],
  reconciliations: RECONCILIATIONS,
  auditEvents: AUDIT_EVENTS,
  aiDecisions: AI_DECISIONS,
};
