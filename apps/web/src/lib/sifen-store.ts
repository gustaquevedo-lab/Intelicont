"use client";

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────

export interface AiSuggestion {
  lines: AiSuggestionLine[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  confidence: number;
}

export interface AiSuggestionLine {
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  description: string;
}

export interface TaxDocument {
  id: string;
  entityId: string;
  direction: "issued" | "received";
  docType: "invoice" | "credit_note" | "debit_note" | "receipt" | "self_invoice" | "remito" | "import";
  number: string;
  timbrado: string | null;
  cdc: string | null;
  issueDate: string;
  partnerId: string | null;
  partnerName?: string;
  partnerRuc?: string;
  currencyCode: string | null;
  condition: string | null;
  status: "pending" | "reviewing" | "approved" | "posted" | "error" | "rejected";
  sifenStatus: string | null;
  gravado10: string;
  gravado5: string;
  exento: string;
  iva10: string;
  iva5: string;
  total: string;
  journalEntryId: string | null;
  metadata: Record<string, unknown> | null;
  uploadedAt: string | null;
  processedAt: string | null;
  aiConfidence?: number;
  aiSuggestion?: AiSuggestion;
  lines?: TaxDocumentLine[];
}

export interface TaxDocumentLine {
  id: string;
  documentId: string;
  itemCode: string | null;
  description: string | null;
  quantity: string;
  unitPrice: string;
  ivaRate: number | null;
  rubroIre: number | null;
  rubroIrp: number | null;
  incisoIva: number | null;
  accountId: string | null;
  accountCode?: string;
  accountName?: string;
  amount: string;
}

export interface Partner {
  id: string;
  entityId: string;
  kind: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
}

export interface Entity {
  id: string;
  ruc: string;
  legalName: string;
  tradeName: string | null;
  taxRegimes: string[] | null;
}

// ─── Seed Data ────────────────────────────────────────────────────────────

function seed(): { documents: TaxDocument[]; partners: Partner[]; entities: Entity[] } {
  const e1 = "5b3e8a1e-4c2d-4b6a-8000-000000000001";

  const partners: Partner[] = [
    { id: "p1", entityId: e1, kind: "supplier", ruc: "80012345-1", legalName: "Importadora del Este S.A.", tradeName: "ImportEste" },
    { id: "p2", entityId: e1, kind: "supplier", ruc: "4567890-1", legalName: "Servicios Contables Del Paraguay", tradeName: "SerConPy" },
    { id: "p3", entityId: e1, kind: "supplier", ruc: "80023456-2", legalName: "Tecnología Asunción SRL", tradeName: "TechAsu" },
    { id: "p4", entityId: e1, kind: "supplier", ruc: "1234567-8", legalName: "Distribuciones Ñandutí S.A.", tradeName: "DÑandutí" },
    { id: "p5", entityId: e1, kind: "supplier", ruc: "9876543-2", legalName: "Agropecuaria Guaraní", tradeName: "AgroGuaraní" },
  ];

  const partnerMap = new Map(partners.map((p) => [p.id, p]));

  const docs: TaxDocument[] = [
    {
      id: "td-1", entityId: e1, direction: "received", docType: "invoice",
      number: "001-001-00234", timbrado: "12345678",
      cdc: "5897185478912345678901234567890123456789012345",
      issueDate: "2026-05-01", partnerId: "p1", currencyCode: "PYG", condition: "credit",
      status: "posted", sifenStatus: "validated",
      gravado10: "10000000.0000", gravado5: "0.0000", exento: "0.0000",
      iva10: "1000000.0000", iva5: "0.0000", total: "11000000.0000",
      journalEntryId: "JE-001", metadata: null,
      uploadedAt: "2026-05-01T10:00:00", processedAt: "2026-05-01T10:30:00",
      aiConfidence: 95,
    },
    {
      id: "td-2", entityId: e1, direction: "received", docType: "invoice",
      number: "002-001-00089", timbrado: "23456789",
      cdc: "5897185478912345678901234567890123456789012346",
      issueDate: "2026-05-03", partnerId: "p2", currencyCode: "PYG", condition: "credit",
      status: "posted", sifenStatus: "validated",
      gravado10: "2500000.0000", gravado5: "0.0000", exento: "0.0000",
      iva10: "250000.0000", iva5: "0.0000", total: "2750000.0000",
      journalEntryId: "JE-002", metadata: null,
      uploadedAt: "2026-05-03T14:00:00", processedAt: "2026-05-03T14:15:00",
      aiConfidence: 92,
    },
    {
      id: "td-3", entityId: e1, direction: "received", docType: "invoice",
      number: "001-001-00345", timbrado: "34567890",
      cdc: "5897185478912345678901234567890123456789012347",
      issueDate: "2026-05-02", partnerId: "p3", currencyCode: "PYG", condition: "credit",
      status: "pending", sifenStatus: "validated",
      gravado10: "15000000.0000", gravado5: "0.0000", exento: "0.0000",
      iva10: "1500000.0000", iva5: "0.0000", total: "16500000.0000",
      journalEntryId: null, metadata: null,
      uploadedAt: "2026-05-02T08:00:00", processedAt: null,
      aiConfidence: 88,
      aiSuggestion: {
        lines: [
          { accountCode: "1.2.04", accountName: "Equipo de Computación", debit: "15000000", credit: "0", description: "Compra equipos" },
          { accountCode: "1.1.06", accountName: "IVA Crédito Fiscal", debit: "1500000", credit: "0", description: "IVA 10%" },
          { accountCode: "2.1.01", accountName: "Cuentas a Pagar Proveedores", debit: "0", credit: "16500000", description: "TechAsu a crédito" },
        ],
        totalDebit: 16500000, totalCredit: 16500000, balanced: true, confidence: 88,
      },
    },
    {
      id: "td-4", entityId: e1, direction: "received", docType: "credit_note",
      number: "001-001-00056", timbrado: "34567890",
      cdc: "5897185478912345678901234567890123456789012348",
      issueDate: "2026-05-05", partnerId: "p4", currencyCode: "PYG", condition: "credit",
      status: "pending", sifenStatus: "validated",
      gravado10: "-500000.0000", gravado5: "0.0000", exento: "0.0000",
      iva10: "-50000.0000", iva5: "0.0000", total: "-550000.0000",
      journalEntryId: null, metadata: null,
      uploadedAt: "2026-05-05T09:00:00", processedAt: null,
      aiConfidence: 90,
      aiSuggestion: {
        lines: [
          { accountCode: "2.1.01", accountName: "Cuentas a Pagar Proveedores", debit: "550000", credit: "0", description: "NC devolución" },
          { accountCode: "1.2.01", accountName: "Mercaderías", debit: "0", credit: "500000", description: "Devolución mercadería" },
          { accountCode: "1.1.06", accountName: "IVA Crédito Fiscal", debit: "0", credit: "50000", description: "Reversión IVA" },
        ],
        totalDebit: 550000, totalCredit: 550000, balanced: true, confidence: 90,
      },
    },
    {
      id: "td-5", entityId: e1, direction: "received", docType: "invoice",
      number: "001-001-01123", timbrado: "45678901",
      cdc: "5897185478912345678901234567890123456789012349",
      issueDate: "2026-05-08", partnerId: "p5", currencyCode: "PYG", condition: "credit",
      status: "error", sifenStatus: "rejected",
      gravado10: "3750000.0000", gravado5: "0.0000", exento: "0.0000",
      iva10: "375000.0000", iva5: "0.0000", total: "4125000.0000",
      journalEntryId: null, metadata: { error: "RUC emisor no coincide con timbrado" },
      uploadedAt: "2026-05-08T11:00:00", processedAt: null,
    },
    {
      id: "td-6", entityId: e1, direction: "received", docType: "invoice",
      number: "001-001-01145", timbrado: "56789012",
      cdc: "5897185478912345678901234567890123456789012350",
      issueDate: "2026-05-10", partnerId: "p1", currencyCode: "PYG", condition: "credit",
      status: "pending", sifenStatus: "validated",
      gravado10: "8500000.0000", gravado5: "0.0000", exento: "0.0000",
      iva10: "850000.0000", iva5: "0.0000", total: "9350000.0000",
      journalEntryId: null, metadata: null,
      uploadedAt: "2026-05-12T10:00:00", processedAt: null,
      aiConfidence: 94,
      aiSuggestion: {
        lines: [
          { accountCode: "1.2.01", accountName: "Mercaderías", debit: "8500000", credit: "0", description: "Compra mercadería lote B" },
          { accountCode: "1.1.06", accountName: "IVA Crédito Fiscal", debit: "850000", credit: "0", description: "IVA 10%" },
          { accountCode: "2.1.01", accountName: "Cuentas a Pagar Proveedores", debit: "0", credit: "9350000", description: "ImportEste a crédito" },
        ],
        totalDebit: 9350000, totalCredit: 9350000, balanced: true, confidence: 94,
      },
    },
    {
      id: "td-7", entityId: e1, direction: "received", docType: "credit_note",
      number: "001-001-00012", timbrado: "56789012",
      cdc: "5897185478912345678901234567890123456789012351",
      issueDate: "2026-05-12", partnerId: "p5", currencyCode: "PYG", condition: "credit",
      status: "reviewing", sifenStatus: "validated",
      gravado10: "-1000000.0000", gravado5: "0.0000", exento: "0.0000",
      iva10: "-100000.0000", iva5: "0.0000", total: "-1100000.0000",
      journalEntryId: null, metadata: null,
      uploadedAt: "2026-05-12T14:00:00", processedAt: null,
      aiConfidence: 87,
      aiSuggestion: {
        lines: [
          { accountCode: "2.1.01", accountName: "Cuentas a Pagar Proveedores", debit: "1100000", credit: "0", description: "NC AgroGuaraní" },
          { accountCode: "1.2.01", accountName: "Mercaderías", debit: "0", credit: "1000000", description: "Devolución" },
          { accountCode: "1.1.06", accountName: "IVA Crédito Fiscal", debit: "0", credit: "100000", description: "Reversión IVA" },
        ],
        totalDebit: 1100000, totalCredit: 1100000, balanced: true, confidence: 87,
      },
    },
    {
      id: "td-8", entityId: e1, direction: "received", docType: "invoice",
      number: "001-001-02000", timbrado: "67890123",
      cdc: "5897185478912345678901234567890123456789012352",
      issueDate: "2026-05-15", partnerId: "p3", currencyCode: "PYG", condition: "contado",
      status: "pending", sifenStatus: "uploaded",
      gravado10: "3500000.0000", gravado5: "0.0000", exento: "0.0000",
      iva10: "350000.0000", iva5: "0.0000", total: "3850000.0000",
      journalEntryId: null, metadata: { xml_raw: true },
      uploadedAt: "2026-05-15T09:00:00", processedAt: null,
      aiConfidence: 91,
      aiSuggestion: {
        lines: [
          { accountCode: "1.2.04", accountName: "Equipo de Computación", debit: "3500000", credit: "0", description: "Compra de licencias" },
          { accountCode: "1.1.06", accountName: "IVA Crédito Fiscal", debit: "350000", credit: "0", description: "IVA 10%" },
          { accountCode: "2.1.01", accountName: "Cuentas a Pagar Proveedores", debit: "0", credit: "3850000", description: "TechAsu contado" },
        ],
        totalDebit: 3850000, totalCredit: 3850000, balanced: true, confidence: 91,
      },
    },
  ];

  // Attach partner info
  for (const doc of docs) {
    if (doc.partnerId) {
      const p = partnerMap.get(doc.partnerId);
      if (p) {
        doc.partnerName = p.legalName;
        doc.partnerRuc = p.ruc;
      }
    }
  }

  const entities: Entity[] = [
    { id: e1, ruc: "80012345-1", legalName: "Importadora del Este S.A.", tradeName: "ImportEste", taxRegimes: ["IVA_GRAL", "IRE_GRAL"] },
  ];

  return { documents: docs, partners, entities };
}

// ─── Store ────────────────────────────────────────────────────────────────

interface SifenStore {
  documents: TaxDocument[];
  selectedIds: Set<string>;
  filter: {
    search: string;
    status: string;
    docType: string;
  };

  // Actions
  setFilter: (filter: Partial<SifenStore["filter"]>) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setDocumentStatus: (id: string, status: TaxDocument["status"]) => void;
  approveDocument: (id: string) => void;
  rejectDocument: (id: string) => void;
  batchApprove: () => void;
  batchReject: () => void;
  batchStartReview: () => void;
  getFilteredDocuments: () => TaxDocument[];
  getStats: () => {
    total: number;
    pending: number;
    reviewing: number;
    posted: number;
    errors: number;
    totalPendiente: number;
    totalIva: number;
  };
}

const { documents: seedDocs } = seed();

export const useSifenStore = create<SifenStore>((set, get) => ({
  documents: seedDocs,
  selectedIds: new Set<string>(),
  filter: { search: "", status: "all", docType: "all" },

  setFilter: (filter) =>
    set((s) => ({ filter: { ...s.filter, ...filter } })),

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectAll: () =>
    set((s) => {
      const filtered = get().getFilteredDocuments();
      return { selectedIds: new Set(filtered.map((d) => d.id)) };
    }),

  clearSelection: () => set({ selectedIds: new Set() }),

  setDocumentStatus: (id, status) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id ? { ...d, status, processedAt: status === "posted" ? new Date().toISOString() : d.processedAt, journalEntryId: status === "posted" ? `JE-${Date.now().toString(36).slice(-6).toUpperCase()}` : d.journalEntryId } : d
      ),
    })),

  approveDocument: (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc || doc.status !== "pending" && doc.status !== "reviewing") return;
    // Transition: pending → approved → posted
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id
          ? { ...d, status: "posted" as const, processedAt: new Date().toISOString(), journalEntryId: `JE-${Date.now().toString(36).slice(-6).toUpperCase()}` }
          : d
      ),
    }));
  },

  rejectDocument: (id) =>
    set((s) => ({
      documents: s.documents.map((d) =>
        d.id === id ? { ...d, status: "rejected" as const } : d
      ),
    })),

  batchApprove: () => {
    const { selectedIds } = get();
    const now = new Date().toISOString();
    set((s) => ({
      documents: s.documents.map((d) =>
        selectedIds.has(d.id) && (d.status === "pending" || d.status === "reviewing")
          ? { ...d, status: "posted" as const, processedAt: now, journalEntryId: `JE-${Date.now().toString(36).slice(-6).toUpperCase()}` }
          : d
      ),
      selectedIds: new Set<string>(),
    }));
  },

  batchReject: () => {
    const { selectedIds } = get();
    set((s) => ({
      documents: s.documents.map((d) =>
        selectedIds.has(d.id) && (d.status === "pending" || d.status === "reviewing")
          ? { ...d, status: "rejected" as const }
          : d
      ),
      selectedIds: new Set<string>(),
    }));
  },

  batchStartReview: () => {
    const { selectedIds } = get();
    set((s) => ({
      documents: s.documents.map((d) =>
        selectedIds.has(d.id) && d.status === "pending"
          ? { ...d, status: "reviewing" as const }
          : d
      ),
      selectedIds: new Set<string>(),
    }));
  },

  getFilteredDocuments: () => {
    const { documents, filter } = get();
    return documents.filter((d) => {
      const s = filter.search.toLowerCase();
      const matchesSearch =
        !s ||
        d.number.toLowerCase().includes(s) ||
        (d.partnerName || "").toLowerCase().includes(s) ||
        (d.partnerRuc || "").includes(s) ||
        (d.cdc || "").includes(s);
      const matchesStatus = filter.status === "all" || d.status === filter.status || (filter.status === "pending_reviewing" && (d.status === "pending" || d.status === "reviewing"));
      const matchesType = filter.docType === "all" || d.docType === filter.docType;
      return matchesSearch && matchesStatus && matchesType;
    });
  },

  getStats: () => {
    const { documents } = get();
    const pending = documents.filter((d) => d.status === "pending");
    const reviewing = documents.filter((d) => d.status === "reviewing");
    const posted = documents.filter((d) => d.status === "posted");
    const errors = documents.filter((d) => d.status === "error" || d.status === "rejected");
    return {
      total: documents.length,
      pending: pending.length,
      reviewing: reviewing.length,
      posted: posted.length,
      errors: errors.length,
      totalPendiente: [...pending, ...reviewing].reduce((s, d) => s + Math.abs(parseFloat(d.total)), 0),
      totalIva: documents.reduce((s, d) => s + Math.abs(parseFloat(d.iva10 || "0")) + Math.abs(parseFloat(d.iva5 || "0")), 0),
    };
  },
}));
