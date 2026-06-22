"use server";

import { eq, and, desc, inArray, count as drizzleCount } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  taxDocuments, taxDocumentLines, aiProposals,
  journalEntries, journalLines, accounts,
  globalSettings, entities, partners,
  inventoryItems, stockTransactions, fixedAssets, bankAccounts,
  type TaxDocument,
} from "@/lib/db/schema";
import { parseSifenXML, type SifenInvoice } from "@/lib/sifen-parser";
import { createAIProvider, type AIConfig } from "@/lib/ai/provider-factory";
import type { AIProviderInput } from "@/lib/ai/types";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Load AI config from DB ───────────────────────────────────────────────────

async function loadAIConfig(): Promise<AIConfig> {
  try {
    const db   = getDb();
    const rows = await db.select().from(globalSettings)
      .where(inArray(globalSettings.key, ["ai.provider","ai.model","ai.api_key","ai.base_url","ai.enabled"]));

    const cfg: Record<string, string> = {};
    rows.forEach((r) => { cfg[r.key] = r.value ?? ""; });

    return {
      provider: cfg["ai.provider"] ?? "rules",
      model:    cfg["ai.model"]    ?? "",
      apiKey:   cfg["ai.api_key"]  ?? "",
      baseUrl:  cfg["ai.base_url"] ?? "",
      enabled:  cfg["ai.enabled"]  !== "false",
    };
  } catch {
    return { provider: "rules", model: "", apiKey: "", baseUrl: "", enabled: true };
  }
}

// ─── Map SifenInvoice → normalized doc fields ─────────────────────────────────

function mapDocType(inv: SifenInvoice): "factura" | "nota_credito" | "nota_debito" | "autofactura" | "nota_remision" | "retencion" {
  const t = inv.tipoDoc;
  if (t === "nota_credito") return "nota_credito";
  if (t === "nota_debito")  return "nota_debito";
  if (t === "recibo")       return "retencion";
  return "factura";
}

function mapToDbDocType(type: string): "invoice" | "credit_note" | "debit_note" | "receipt" | "self_invoice" | "remito" | "import" {
  if (type === "nota_credito" || type === "credit_note") return "credit_note";
  if (type === "nota_debito" || type === "debit_note") return "debit_note";
  if (type === "retencion" || type === "receipt") return "receipt";
  if (type === "autofactura" || type === "self_invoice") return "self_invoice";
  if (type === "nota_remision" || type === "remito") return "remito";
  if (type === "import") return "import";
  return "invoice";
}

// ─── Ingest XML → parse → save + AI proposal ─────────────────────────────────

export interface IngestResult {
  docId:      string;
  proposalId: string | null;
  parsed:     {
    docType:     string;
    docNumber:   string | null;
    issuerName:  string;
    total:       number;
    currency:    string;
    linesCount:  number;
  };
  confidence: number;
  reasoning:  string;
  provider:   string;
}

export async function ingestXML(
  entityId: string,
  xmlContent: string,
  filename: string,
  perspective: "buyer" | "seller" = "buyer"
): Promise<ActionResult<IngestResult>> {
  if (!entityId)    return { ok: false, error: "Seleccioná una empresa" };
  if (!xmlContent)  return { ok: false, error: "XML vacío" };

  // ── Parse ──────────────────────────────────────────────────────────────────
  const inv = parseSifenXML(xmlContent);
  if (!inv) return { ok: false, error: "No se pudo parsear el XML SIFEN. Verificá el formato." };

  const docType    = mapDocType(inv);
  const docNumber  = inv.numero || null;
  const issuerRuc  = inv.emisor.ruc;
  const issuerName = inv.emisor.nombre;
  const receiverRuc  = inv.receptor.ruc || null;
  const receiverName = inv.receptor.nombre || null;
  const issueDate  = inv.fechaEmision.slice(0, 10);
  const timbrado   = inv.timbrado || null;
  const cdc        = inv.cdc || null;
  const iva10      = inv.montos.iva10;
  const iva5       = inv.montos.iva5;
  const ivaExento  = inv.montos.exento;
  const subtotal   = inv.montos.gravado10 + inv.montos.gravado5 + inv.montos.exento;
  const total      = inv.montos.total;
  const currency   = "PYG";

  const db = getDb();

  // ── Duplicate check (by CDC if present) ────────────────────────────────────
  if (cdc) {
    const [existing] = await db.select({ id: taxDocuments.id })
      .from(taxDocuments)
      .where(and(eq(taxDocuments.entityId, entityId), eq(taxDocuments.cdc, cdc)));
    if (existing) {
      return { ok: false, error: `Este comprobante (CDC: ${cdc}) ya fue ingresado` };
    }
  }

  // ── Load accounts for AI grounding ────────────────────────────────────────
  const acctRows = await db
    .select({ id: accounts.id, code: accounts.code, name: accounts.name, nature: accounts.nature })
    .from(accounts)
    .where(eq(accounts.allowsPosting, true))
    .limit(200);

  // ── AI proposal ────────────────────────────────────────────────────────────
  const aiConfig   = await loadAIConfig();
  const provider   = createAIProvider(aiConfig);

  const aiInput: AIProviderInput = {
    docType,
    issuerRuc,
    issuerName,
    receiverRuc,
    total,
    iva10,
    iva5,
    ivaExento,
    subtotal,
    currency,
    issueDate,
    docNumber,
    lines: inv.items.map((item, i) => ({
      lineNumber:  i + 1,
      description: item.descripcion,
      quantity:    item.cantidad,
      unitPrice:   item.precioUnitario,
      ivaRate:     item.ivaRate,
      ivaAmount:   item.total * (item.ivaRate / (100 + item.ivaRate)),
      lineTotal:   item.total,
    })),
    accounts: acctRows.map((a) => ({
      id: a.id, code: a.code, name: a.name, nature: a.nature,
    })),
    perspective,
  };


  let proposal = null;
  let proposalId: string | null = null;

  try {
    proposal = await provider.propose(aiInput);
  } catch (e) {
    console.error("[AI proposal error]", e);
    // Don't fail ingest if AI errors — fall back to pending_review
  }

  // ── Save to DB (transaction) ───────────────────────────────────────────────
  const mappedLines = inv.items.map((item, i) => ({
    lineNumber:  i + 1,
    description: item.descripcion,
    quantity:    item.cantidad,
    unitPrice:   item.precioUnitario,
    ivaRate:     item.ivaRate,
    ivaAmount:   item.total * (item.ivaRate / (100 + item.ivaRate)),
    lineTotal:   item.total,
  }));

  const result = await db.transaction(async (tx) => {
    // Find or create Partner
    const direction = perspective === "buyer" ? "received" : "issued";
    const partnerRuc = direction === "received" ? issuerRuc : (receiverRuc ?? "44444401-7");
    const partnerName = direction === "received" ? issuerName : (receiverName ?? "Cliente Innominado");

    let partnerRow = await tx.select()
      .from(partners)
      .where(and(eq(partners.entityId, entityId), eq(partners.ruc, partnerRuc)))
      .limit(1);

    let partnerId: string;
    if (partnerRow.length === 0) {
      const [newPartner] = await tx.insert(partners).values({
        entityId,
        kind: direction === "received" ? "supplier" : "customer",
        ruc: partnerRuc,
        legalName: partnerName,
      }).returning();
      partnerId = newPartner.id;
    } else {
      partnerId = partnerRow[0].id;
    }

    // Insert tax document
    const [savedDoc] = await tx.insert(taxDocuments).values({
      entityId,
      direction,
      docType:      mapToDbDocType(docType),
      number:       docNumber ?? "",
      timbrado:     timbrado ?? undefined,
      cdc:          cdc ?? undefined,
      issueDate:    issueDate,
      partnerId,
      gravado10:    String(inv.montos.gravado10),
      gravado5:     String(inv.montos.gravado5),
      exento:       String(inv.montos.exento),
      iva10:        String(iva10),
      iva5:         String(iva5),
      total:        String(total),
      currencyCode: currency,
      status:       proposal ? "proposed" : "pending_review",
      metadata:     {
        sourceXml:    xmlContent,
        sourceFilename: filename,
      },
    }).returning();

    // Insert lines
    if (mappedLines.length > 0) {
      await tx.insert(taxDocumentLines).values(
        mappedLines.map((l) => ({
          documentId:  savedDoc.id,
          description: l.description,
          quantity:    String(l.quantity),
          unitPrice:   String(l.unitPrice),
          ivaRate:     l.ivaRate,
          amount:      String(l.lineTotal),
        }))
      );
    }

    // Insert AI proposal
    if (proposal && proposal.lines.length > 0) {
      const [savedProposal] = await tx.insert(aiProposals).values({
        docId:        savedDoc.id,
        provider:     proposal.provider,
        model:        proposal.model ?? undefined,
        confidence:   String(proposal.confidence),
        reasoning:    proposal.reasoning,
        proposalJson: proposal as unknown as Record<string, unknown>,
        status:       "pending",
      }).returning();
      proposalId = savedProposal.id;
    }

    return savedDoc;
  });

  revalidatePath("/comprobantes");

  return {
    ok: true,
    data: {
      docId:      result.id,
      proposalId,
      parsed: {
        docType,
        docNumber,
        issuerName,
        total,
        currency,
        linesCount: mappedLines.length,
      },

      confidence: proposal?.confidence ?? 0,
      reasoning:  proposal?.reasoning  ?? "Sin propuesta IA",
      provider:   proposal?.provider   ?? "none",
    },
  };
}

// ─── List comprobantes ────────────────────────────────────────────────────────

export interface ComprobanteRow {
  id:          string;
  entityId:    string;
  entityName:  string;
  docType:     string;
  docNumber:   string | null;
  issuerName:  string;
  issuerRuc:   string;
  issueDate:   string;
  total:       number;
  currency:    string;
  status:      string;
  aiProvider:  string | null;
  aiConfidence:number | null;
  createdAt:   string;
}

export async function loadComprobantes(filters?: {
  entityId?: string;
  status?:   string;
}): Promise<ActionResult<ComprobanteRow[]>> {
  try {
    const db = getDb();
    const conditions = [];
    if (filters?.entityId) conditions.push(eq(taxDocuments.entityId, filters.entityId));
    if (filters?.status && filters.status !== "todos") {
      conditions.push(eq(taxDocuments.status, filters.status as "posted" | "rejected" | "pending_review" | "proposed" | "approved"));
    }

    const rows = await db
      .select({
        id:           taxDocuments.id,
        entityId:     taxDocuments.entityId,
        entityName:   entities.legalName,
        entityRuc:    entities.ruc,
        direction:    taxDocuments.direction,
        docType:      taxDocuments.docType,
        docNumber:    taxDocuments.number,
        partnerName:  partners.legalName,
        partnerRuc:   partners.ruc,
        issueDate:    taxDocuments.issueDate,
        total:        taxDocuments.total,
        currencyCode: taxDocuments.currencyCode,
        status:       taxDocuments.status,
        aiProvider:   aiProposals.provider,
        aiConfidence: aiProposals.confidence,
        createdAt:    taxDocuments.uploadedAt,
      })
      .from(taxDocuments)
      .innerJoin(entities, eq(taxDocuments.entityId, entities.id))
      .leftJoin(partners, eq(taxDocuments.partnerId, partners.id))
      .leftJoin(aiProposals, eq(taxDocuments.id, aiProposals.docId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(taxDocuments.uploadedAt))
      .limit(200);

    return {
      ok: true,
      data: rows.map((r) => {
        const isReceived = r.direction === "received";
        return {
          id:           r.id,
          entityId:     r.entityId,
          entityName:   r.entityName,
          docType:      r.docType ?? "factura",
          docNumber:    r.docNumber,
          issuerName:   isReceived ? (r.partnerName ?? "Desconocido") : r.entityName,
          issuerRuc:    isReceived ? (r.partnerRuc ?? "") : r.entityRuc,
          issueDate:    String(r.issueDate).slice(0, 10),
          total:        Number(r.total),
          currency:     r.currencyCode ?? "PYG",
          status:       r.status ?? "pending_review",
          aiProvider:   r.aiProvider,
          aiConfidence: r.aiConfidence ? Number(r.aiConfidence) : null,
          createdAt:    r.createdAt instanceof Date
                          ? r.createdAt.toISOString()
                          : String(r.createdAt),
        };
      }),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar comprobantes" };
  }
}

// ─── Load proposal for a doc ──────────────────────────────────────────────────

export async function loadProposal(docId: string): Promise<ActionResult<{
  proposal: import("@/lib/ai/types").JournalProposal | null;
  doc:      ComprobanteRow & { iva10: number; iva5: number; ivaExento: number; lines: Array<{ description: string; quantity: number; unitPrice: number; ivaRate: number; lineTotal: number; }> };
}>> {
  try {
    const db = getDb();

    const [doc] = await db
      .select({
        id:           taxDocuments.id,
        entityId:     taxDocuments.entityId,
        entityName:   entities.legalName,
        entityRuc:    entities.ruc,
        direction:    taxDocuments.direction,
        docType:      taxDocuments.docType,
        docNumber:    taxDocuments.number,
        partnerName:  partners.legalName,
        partnerRuc:   partners.ruc,
        issueDate:    taxDocuments.issueDate,
        total:        taxDocuments.total,
        currencyCode: taxDocuments.currencyCode,
        status:       taxDocuments.status,
        createdAt:    taxDocuments.uploadedAt,
        iva10:        taxDocuments.iva10,
        iva5:         taxDocuments.iva5,
        exento:       taxDocuments.exento,
      })
      .from(taxDocuments)
      .innerJoin(entities, eq(taxDocuments.entityId, entities.id))
      .leftJoin(partners, eq(taxDocuments.partnerId, partners.id))
      .where(eq(taxDocuments.id, docId));

    if (!doc) return { ok: false, error: "Comprobante no encontrado" };

    const docLines = await db.select().from(taxDocumentLines)
      .where(eq(taxDocumentLines.documentId, docId));

    const [latestProposal] = await db.select().from(aiProposals)
      .where(and(eq(aiProposals.docId, docId), eq(aiProposals.status, "pending")))
      .orderBy(desc(aiProposals.createdAt))
      .limit(1);

    const isReceived = doc.direction === "received";
    const docRow = {
      id:           doc.id,
      entityId:     doc.entityId,
      entityName:   doc.entityName,
      docType:      doc.docType ?? "factura",
      docNumber:    doc.docNumber,
      issuerName:   isReceived ? (doc.partnerName ?? "Desconocido") : doc.entityName,
      issuerRuc:    isReceived ? (doc.partnerRuc ?? "") : doc.entityRuc,
      issueDate:    String(doc.issueDate).slice(0, 10),
      total:        Number(doc.total),
      currency:     doc.currencyCode ?? "PYG",
      status:       doc.status ?? "pending_review",
      aiProvider:   latestProposal?.provider ?? null,
      aiConfidence: latestProposal?.confidence ? Number(latestProposal.confidence) : null,
      createdAt:    doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
      iva10:        Number(doc.iva10 ?? 0),
      iva5:         Number(doc.iva5 ?? 0),
      ivaExento:    Number(doc.exento ?? 0),
      lines:        docLines.map((l) => ({
        description: l.description ?? "",
        quantity:    Number(l.quantity ?? 0),
        unitPrice:   Number(l.unitPrice ?? 0),
        ivaRate:     Number(l.ivaRate ?? 0),
        lineTotal:   Number(l.amount ?? 0),
      })),
    };

    const proposal = latestProposal
      ? (latestProposal.proposalJson as import("@/lib/ai/types").JournalProposal)
      : null;

    return { ok: true, data: { proposal, doc: docRow } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar propuesta" };
  }
}

// ─── Approve proposal → create + post journal entry ───────────────────────────

export async function approveProposal(
  docId:    string,
  lines:    Array<{ accountId: string; debit: number; credit: number; description: string }>,
  entityId: string,
  date:     string,
  description: string,
): Promise<ActionResult<{ entryId: string; number: string }>> {
  if (lines.length < 2) return { ok: false, error: "Mínimo 2 líneas" };

  const totalDebit  = lines.reduce((s, l) => s + l.debit,  0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    return { ok: false, error: `Asiento desbalanceado: débito ${totalDebit.toFixed(2)} ≠ crédito ${totalCredit.toFixed(2)}` };
  }

  try {
    const db   = getDb();
    const entryDate = new Date(date + "T12:00:00");
    const year  = entryDate.getFullYear();

    const result = await db.transaction(async (tx) => {
      // Sequence number
      const [{ cnt }] = await tx.select({ cnt: drizzleCount() })
        .from(journalEntries).where(eq(journalEntries.entityId, entityId));
      const seq    = (Number(cnt) || 0) + 1;
      const number = `${String(seq).padStart(5, "0")}-${year}`;

      const [entry] = await tx.insert(journalEntries).values({
        entityId, date: entryDate, number, source: "purchase" as const,
        description, status: "draft",
      }).returning();

      await tx.insert(journalLines).values(
        lines.map((l) => ({
          entryId:      entry.id,
          accountId:    l.accountId,
          debit:        String(l.debit),
          credit:       String(l.credit),
          currencyCode: "PYG",
          description:  l.description || null,
        }))
      );

      // Link doc to entry + mark as approved
      await tx.update(taxDocuments)
        .set({ status: "posted", journalEntryId: entry.id })
        .where(eq(taxDocuments.id, docId));

      await tx.update(aiProposals)
        .set({ status: "approved", reviewedAt: new Date() })
        .where(and(eq(aiProposals.docId, docId), eq(aiProposals.status, "pending")));

      return { entryId: entry.id, number };
    });

    revalidatePath("/comprobantes");
    revalidatePath("/asientos");
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al aprobar propuesta" };
  }
}

// ─── Reject / discard proposal ────────────────────────────────────────────────

export async function rejectProposal(docId: string): Promise<ActionResult<void>> {
  try {
    const db = getDb();
    await db.update(taxDocuments).set({ status: "rejected" }).where(eq(taxDocuments.id, docId));
    await db.update(aiProposals)
      .set({ status: "rejected", reviewedAt: new Date() })
      .where(and(eq(aiProposals.docId, docId), eq(aiProposals.status, "pending")));
    revalidatePath("/comprobantes");
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al rechazar" };
  }
}

// ─── Load entities for selector ──────────────────────────────────────────────

export async function loadEntidadesParaComprobantes(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
  try {
    const db   = getDb();
    const rows = await db.select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities).where(eq(entities.status, "active")).orderBy(entities.legalName);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

// ─── Load global settings ──────────────────────────────────────────────────

export async function loadAISettings(): Promise<ActionResult<Record<string, string>>> {
  try {
    const db   = getDb();
    const rows = await db.select().from(globalSettings);
    const cfg: Record<string, string> = {};
    rows.forEach((r) => { cfg[r.key] = r.value ?? ""; });
    return { ok: true, data: cfg };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function saveAISettings(settings: Record<string, string>): Promise<ActionResult<void>> {
  try {
    const db = getDb();
    for (const [key, value] of Object.entries(settings)) {
      if (key.startsWith("ai.")) {
        await db.insert(globalSettings)
          .values({ key, value, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: globalSettings.key,
            set: { value, updatedAt: new Date() }
          });
      }
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar" };
  }
}

// ─── Manual Voucher Entry action with Side Effects (Vanguard) ───────────────

export interface ManualLineInput {
  description: string;
  quantity: number;
  unitPrice: number;
  ivaRate: number;
  lineTotal: number;
  destination: "gasto" | "mercaderia" | "activo_fijo";
  productId?: string;
  productCode?: string;
  productDescription?: string;
  usefulLifeMonths?: number;
}

export interface ManualComprobanteInput {
  entityId: string;
  direction: "issued" | "received";
  docType: "factura" | "nota_credito" | "nota_debito" | "autofactura" | "nota_remision" | "retencion";
  number: string;
  timbrado: string;
  issueDate: string; // YYYY-MM-DD
  partnerRuc: string;
  partnerName: string;
  condition: "cash" | "credit";
  gravado10: number;
  gravado5: number;
  exento: number;
  iva10: number;
  iva5: number;
  total: number;
  lines: ManualLineInput[];
  paymentMethod: "cash" | "bank" | "card" | "credit";
  bankAccountId?: string;
  documentOrigenId?: string; // NC/ND: UUID of the originating tax document
}

export async function createManualComprobante(
  input: ManualComprobanteInput
): Promise<ActionResult<{ docId: string; entryId: string; entryNumber: string }>> {
  const {
    entityId, direction, docType, number, timbrado, issueDate,
    partnerRuc, partnerName, condition, gravado10, gravado5,
    exento, iva10, iva5, total, lines, paymentMethod, bankAccountId,
    documentOrigenId,
  } = input;

  if (!entityId) return { ok: false, error: "Falta empresa" };
  if (!number) return { ok: false, error: "Falta número de comprobante" };
  if (!partnerRuc || !partnerName) return { ok: false, error: "Falta datos del proveedor/cliente" };

  try {
    const db = getDb();
    const parsedDate = new Date(issueDate + "T12:00:00");
    const year = parsedDate.getFullYear();

    // Fetch Entity for RUC/Name mapping
    const entityRow = await db.select().from(entities).where(eq(entities.id, entityId)).limit(1);
    if (entityRow.length === 0) return { ok: false, error: "Empresa no encontrada" };
    const entityRuc = entityRow[0].ruc;
    const entityLegalName = entityRow[0].legalName;

    const result = await db.transaction(async (tx) => {
      // 1. Find or create Partner
      let partnerRow = await tx.select()
        .from(partners)
        .where(and(eq(partners.entityId, entityId), eq(partners.ruc, partnerRuc)))
        .limit(1);

      let partnerId: string;
      if (partnerRow.length === 0) {
        const [newPartner] = await tx.insert(partners).values({
          entityId,
          kind: direction === "received" ? "supplier" : "customer",
          ruc: partnerRuc,
          legalName: partnerName,
        }).returning();
        partnerId = newPartner.id;
      } else {
        partnerId = partnerRow[0].id;
      }

      // Determine issuer and receiver
      const issuerRuc = direction === "received" ? partnerRuc : entityRuc;
      const issuerName = direction === "received" ? partnerName : entityLegalName;
      const receiverRuc = direction === "received" ? entityRuc : partnerRuc;
      const receiverName = direction === "received" ? entityLegalName : partnerName;

      // 2. Insert Tax Document
      const [savedDoc] = await tx.insert(taxDocuments).values({
        entityId,
        direction,
        docType: mapToDbDocType(docType),
        number,
        timbrado,
        issueDate: issueDate,
        partnerId,
        condition: condition === "cash" ? "cash" : "credit",
        gravado10: String(gravado10),
        gravado5: String(gravado5),
        exento: String(exento),
        iva10: String(iva10),
        iva5: String(iva5),
        total: String(total),
        status: "posted",
        ...(documentOrigenId ? { documentOrigenId } : {}),
      }).returning();

      // Insert Tax Document Lines
      if (lines.length > 0) {
        await tx.insert(taxDocumentLines).values(
          lines.map((l) => ({
            documentId: savedDoc.id,
            description: l.description,
            quantity: String(l.quantity),
            unitPrice: String(l.unitPrice),
            ivaRate: l.ivaRate,
            amount: String(l.lineTotal),
          }))
        );
      }

      // 3. Process Side Effects: Stock & Fixed Assets
      for (const l of lines) {
        if (l.destination === "mercaderia" && l.productCode) {
          // Find or create inventory item
          let [invItem] = await tx.select()
            .from(inventoryItems)
            .where(and(eq(inventoryItems.entityId, entityId), eq(inventoryItems.code, l.productCode)))
            .limit(1);

          if (!invItem) {
            const [newItem] = await tx.insert(inventoryItems).values({
              entityId,
              code: l.productCode,
              description: l.productDescription || l.description,
              stockActual: "0",
              costoPromedio: "0",
            }).returning();
            invItem = newItem;
          }

          // Insert stock transaction
          await tx.insert(stockTransactions).values({
            itemId: invItem.id,
            taxDocumentId: savedDoc.id,
            type: direction === "received" ? "purchase_in" : "sale_out",
            quantity: String(l.quantity),
            unitPrice: String(l.unitPrice),
          });

          // Update actual stock
          const currentStock = Number(invItem.stockActual);
          const currentAvgCost = Number(invItem.costoPromedio);
          const transQty = l.quantity;
          const transPrice = l.unitPrice;

          let nextStock = currentStock;
          let nextAvgCost = currentAvgCost;

          if (direction === "received") {
            // Purchase increases stock & updates average cost
            nextStock = currentStock + transQty;
            const currentTotalValue = currentStock * currentAvgCost;
            const newAddedValue = transQty * transPrice;
            nextAvgCost = nextStock > 0 ? (currentTotalValue + newAddedValue) / nextStock : 0;
          } else {
            // Sale decreases stock
            nextStock = Math.max(0, currentStock - transQty);
          }

          await tx.update(inventoryItems)
            .set({
              stockActual: String(nextStock),
              costoPromedio: String(nextAvgCost),
              updatedAt: new Date(),
            })
            .where(eq(inventoryItems.id, invItem.id));
        }

        if (l.destination === "activo_fijo" && direction === "received") {
          // Insert Fixed Asset entry
          await tx.insert(fixedAssets).values({
            entityId,
            taxDocumentId: savedDoc.id,
            code: `AF-${String(Math.random()).slice(2, 7)}`,
            name: l.description,
            adquisitionDate: issueDate,
            costValue: String(l.lineTotal),
            usefulLifeMonths: l.usefulLifeMonths || 60, // Default 5 years
            depreciatedValue: "0",
          });
        }
      }

      // 4. Generate Journal Entry
      // Sequence number
      const [{ cnt }] = await tx.select({ cnt: drizzleCount() })
        .from(journalEntries).where(eq(journalEntries.entityId, entityId));
      const seq = (Number(cnt) || 0) + 1;
      const entryNumber = `${String(seq).padStart(5, "0")}-${year}`;

      const [entry] = await tx.insert(journalEntries).values({
        entityId,
        date: parsedDate,
        number: entryNumber,
        source: direction === "received" ? "purchase" : "sales",
        description: `${direction === "received" ? "Compra" : "Venta"} s/ ${docType.toUpperCase()} Nro. ${number} — ${partnerName}`,
        status: "posted",
        postedAt: new Date(),
      }).returning();

      // Update tax document relation
      await tx.update(taxDocuments)
        .set({ journalEntryId: entry.id })
        .where(eq(taxDocuments.id, savedDoc.id));

      // Construct Journal Lines
      const jeLines: Array<{ accountId: string; debit: string; credit: string; description: string }> = [];

      // Query default accounts
      const defaultInventoryAcc = await tx.select().from(accounts).where(and(eq(accounts.code, "1.2.01"))).limit(1);
      const defaultAssetAcc = await tx.select().from(accounts).where(and(eq(accounts.code, "1.2.02"))).limit(1);
      const defaultExpenseAcc = await tx.select().from(accounts).where(and(eq(accounts.code, "5.1.10"))).limit(1);
      const defaultIvaCredito = await tx.select().from(accounts).where(and(eq(accounts.code, "1.1.06"))).limit(1);
      const defaultIvaDebito = await tx.select().from(accounts).where(and(eq(accounts.code, "2.1.02"))).limit(1);
      const defaultAccountsPayable = await tx.select().from(accounts).where(and(eq(accounts.code, "2.1.01"))).limit(1);
      const defaultAccountsReceivable = await tx.select().from(accounts).where(and(eq(accounts.code, "1.1.05"))).limit(1);
      const defaultSalesRevenue = await tx.select().from(accounts).where(and(eq(accounts.code, "4.1.01"))).limit(1);
      const defaultCashAcc = await tx.select().from(accounts).where(and(eq(accounts.code, "1.1.01"))).limit(1);

      // Debit/Credit placement depends on received (purchase) vs issued (sale)
      if (direction === "received") {
        // Purchase (Compras)
        // Debit: items + IVA
        for (const l of lines) {
          let accId = defaultExpenseAcc[0]?.id;
          if (l.destination === "mercaderia") accId = defaultInventoryAcc[0]?.id || accId;
          if (l.destination === "activo_fijo") accId = defaultAssetAcc[0]?.id || accId;

          if (accId) {
            jeLines.push({
              accountId: accId,
              debit: String(l.lineTotal - (l.lineTotal * (l.ivaRate / (100 + l.ivaRate)))),
              credit: "0",
              description: l.description,
            });
          }
        }

        // Debit IVA
        const totalIva = iva10 + iva5;
        if (totalIva > 0 && defaultIvaCredito[0]?.id) {
          jeLines.push({
            accountId: defaultIvaCredito[0].id,
            debit: String(totalIva),
            credit: "0",
            description: `IVA Crédito Fiscal s/ compra Nro ${number}`,
          });
        }

        // Credit payment leg
        let payAccId = defaultAccountsPayable[0]?.id;
        if (paymentMethod === "cash") payAccId = defaultCashAcc[0]?.id || payAccId;
        if (paymentMethod === "bank" && bankAccountId) {
          const [bankAcc] = await tx.select().from(bankAccounts).where(eq(bankAccounts.id, bankAccountId)).limit(1);
          if (bankAcc?.glAccountId) payAccId = bankAcc.glAccountId;
        }

        if (payAccId) {
          jeLines.push({
            accountId: payAccId,
            debit: "0",
            credit: String(total),
            description: `Pago s/ compra ${number} - ${paymentMethod}`,
          });
        }

      } else {
        // Sales (Ventas)
        // Debit payment leg
        let recAccId = defaultAccountsReceivable[0]?.id;
        if (paymentMethod === "cash") recAccId = defaultCashAcc[0]?.id || recAccId;
        if (paymentMethod === "bank" && bankAccountId) {
          const [bankAcc] = await tx.select().from(bankAccounts).where(eq(bankAccounts.id, bankAccountId)).limit(1);
          if (bankAcc?.glAccountId) recAccId = bankAcc.glAccountId;
        }

        if (recAccId) {
          jeLines.push({
            accountId: recAccId,
            debit: String(total),
            credit: "0",
            description: `Cobro s/ venta ${number} - ${paymentMethod}`,
          });
        }

        // Credit Revenue
        const subtotal = total - (iva10 + iva5);
        if (defaultSalesRevenue[0]?.id) {
          jeLines.push({
            accountId: defaultSalesRevenue[0].id,
            debit: "0",
            credit: String(subtotal),
            description: `Ingreso por venta s/ fac ${number}`,
          });
        }

        // Credit IVA
        const totalIva = iva10 + iva5;
        if (totalIva > 0 && defaultIvaDebito[0]?.id) {
          jeLines.push({
            accountId: defaultIvaDebito[0].id,
            debit: "0",
            credit: String(totalIva),
            description: `IVA Débito Fiscal s/ venta Nro ${number}`,
          });
        }
      }

      // Save Journal Lines
      await tx.insert(journalLines).values(
        jeLines.map((jl) => ({
          entryId: entry.id,
          accountId: jl.accountId,
          debit: jl.debit,
          credit: jl.credit,
          currencyCode: "PYG",
          description: jl.description,
        }))
      );

      return { docId: savedDoc.id, entryId: entry.id, entryNumber };
    });

    revalidatePath("/comprobantes");
    revalidatePath("/asientos");
    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al registrar comprobante manual" };
  }
}

// ─── Gemini Multimodal OCR (Free Tier) ───────────────────────────────────────

export async function processInvoiceOCR(
  base64Data: string,
  mimeType: string
): Promise<ActionResult<{
  docNumber?: string;
  timbrado?: string;
  issueDate?: string;
  partnerRuc?: string;
  partnerName?: string;
  gravado10?: number;
  gravado5?: number;
  exento?: number;
  total?: number;
  lines?: Array<{ description: string; quantity: number; unitPrice: number; ivaRate: number; lineTotal: number }>;
}>> {
  try {
    const aiConfig = await loadAIConfig();
    const key = aiConfig.apiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!key) {
      return { ok: false, error: "La clave API de Gemini no está configurada. Por favor, agregala en Configuración." };
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analiza la imagen o PDF de esta factura de Paraguay y extrae los siguientes datos en formato JSON estricto:
{
  "docNumber": "número de factura formateado como XXX-XXX-XXXXXXX si es legible",
  "timbrado": "número de timbrado de 8 dígitos",
  "issueDate": "fecha de emisión en formato YYYY-MM-DD",
  "partnerRuc": "RUC del emisor sin dígito verificador, o completo XXXXXX-X",
  "partnerName": "Razón social del emisor/proveedor",
  "gravado10": 100000, // número sin IVA
  "gravado5": 0,       // número sin IVA
  "exento": 0,
  "total": 110000,     // número total de la factura
  "lines": [
    { "description": "descripción del ítem", "quantity": 1, "unitPrice": 110000, "ivaRate": 10, "lineTotal": 110000 }
  ]
}

Responde únicamente con el objeto JSON estructurado, sin markdown ni bloques de código o explicaciones.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text();
    const cleanJsonText = text.substring(
      text.indexOf("{"),
      text.lastIndexOf("}") + 1
    );
    const data = JSON.parse(cleanJsonText);

    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al procesar el OCR con Gemini" };
  }
}

// ─── Inline Creation Helpers ───────────────────────────────────────────────

export async function createInlineProduct(
  entityId: string,
  code: string,
  description: string
): Promise<ActionResult<{ id: string; code: string; description: string }>> {
  try {
    const db = getDb();
    const [existing] = await db.select()
      .from(inventoryItems)
      .where(and(eq(inventoryItems.entityId, entityId), eq(inventoryItems.code, code)))
      .limit(1);

    if (existing) {
      return { ok: true, data: existing };
    }

    const [newItem] = await db.insert(inventoryItems).values({
      entityId,
      code,
      description,
      stockActual: "0",
      costoPromedio: "0",
    }).returning();

    return { ok: true, data: newItem };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear producto inline" };
  }
}

export async function createInlineFixedAsset(
  entityId: string,
  code: string,
  name: string,
  costValue: number,
  usefulLifeMonths: number
): Promise<ActionResult<{ id: string; code: string; name: string }>> {
  try {
    const db = getDb();
    const [existing] = await db.select()
      .from(fixedAssets)
      .where(and(eq(fixedAssets.entityId, entityId), eq(fixedAssets.code, code)))
      .limit(1);

    if (existing) {
      return { ok: true, data: existing };
    }

    const [newAsset] = await db.insert(fixedAssets).values({
      entityId,
      code,
      name,
      adquisitionDate: new Date().toISOString().split("T")[0],
      costValue: String(costValue),
      usefulLifeMonths,
      depreciatedValue: "0",
    }).returning();

    return { ok: true, data: newAsset };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al crear activo fijo inline" };
  }
}

export async function loadInventoryItems(entityId: string): Promise<ActionResult<Array<{ id: string; code: string; description: string; stockActual: number; costoPromedio: number }>>> {
  try {
    const db = getDb();
    const rows = await db.select()
      .from(inventoryItems)
      .where(eq(inventoryItems.entityId, entityId))
      .orderBy(inventoryItems.code);

    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        code: r.code,
        description: r.description,
        stockActual: Number(r.stockActual),
        costoPromedio: Number(r.costoPromedio),
      }))
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar mercaderías" };
  }
}

export async function loadFixedAssets(entityId: string): Promise<ActionResult<Array<{ id: string; code: string; name: string; costValue: number }>>> {
  try {
    const db = getDb();
    const rows = await db.select()
      .from(fixedAssets)
      .where(eq(fixedAssets.entityId, entityId))
      .orderBy(fixedAssets.code);

    return {
      ok: true,
      data: rows.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        costValue: Number(r.costValue),
      }))
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar activos fijos" };
  }
}
// ─── Load recent documents for NC/ND origin linking ─────────────────────────────────

export async function loadRecentDocuments(
  entityId: string,
  direction: "issued" | "received",
): Promise<ActionResult<Array<{ id: string; number: string; docType: string; issueDate: string; total: number; partnerName: string }>>> {
  if (!entityId) return { ok: false, error: "entityId requerido" };
  try {
    const db = getDb();
    const rows = await db
      .select({
        id:          taxDocuments.id,
        docNumber:   taxDocuments.number,
        docType:     taxDocuments.docType,
        issueDate:   taxDocuments.issueDate,
        total:       taxDocuments.total,
        partnerName: partners.legalName,
      })
      .from(taxDocuments)
      .leftJoin(partners, eq(taxDocuments.partnerId, partners.id))
      .where(and(
        eq(taxDocuments.entityId, entityId),
        eq(taxDocuments.direction, direction),
      ))
      .orderBy(desc(taxDocuments.uploadedAt))
      .limit(50);
    return {
      ok: true,
      data: rows.map((r) => ({
        id:          r.id,
        number:      r.docNumber ?? "",
        docType:     r.docType   ?? "",
        issueDate:   r.issueDate ? String(r.issueDate).slice(0, 10) : "",
        total:       Number(r.total),
        partnerName: r.partnerName ?? "",
      })),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al cargar documentos" };
  }
}
