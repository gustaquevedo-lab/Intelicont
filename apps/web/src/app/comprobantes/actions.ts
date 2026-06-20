"use server";

import { eq, and, desc, inArray, count as drizzleCount } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  taxDocuments, taxDocumentLines, aiProposals,
  journalEntries, journalLines, accounts,
  globalSettings, entities,
  type TaxDocument,
} from "@/lib/db/schema";
import { parseSifenXML, type SifenInvoice } from "@/lib/sifen-parser";
import { createAIProvider, type AIConfig } from "@/lib/ai/provider-factory";
import type { AIProviderInput } from "@/lib/ai/types";

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
    // Insert tax document
    const [savedDoc] = await tx.insert(taxDocuments).values({
      entityId,
      cdc:          cdc ?? undefined,
      timbrado:     timbrado ?? undefined,
      docType:      docType as "factura" | "nota_credito" | "nota_debito" | "autofactura" | "nota_remision" | "retencion",
      docNumber:    docNumber ?? undefined,
      issueDate:    new Date(issueDate + "T12:00:00"),
      issuerRuc,
      issuerName,
      receiverRuc:  receiverRuc ?? undefined,
      receiverName: receiverName ?? undefined,
      subtotal:     String(subtotal),
      iva10:        String(iva10),
      iva5:         String(iva5),
      ivaExento:    String(ivaExento),
      total:        String(total),
      currencyCode: currency,
      status:       proposal ? "proposed" : "pending_review",
      aiProvider:   proposal?.provider ?? undefined,
      aiConfidence: proposal ? String(proposal.confidence) : undefined,
      aiReasoning:  proposal?.reasoning ?? undefined,
      sourceXml:    xmlContent,
      sourceFilename: filename,
    }).returning();

    // Insert lines
    if (mappedLines.length > 0) {
      await tx.insert(taxDocumentLines).values(
        mappedLines.map((l) => ({
          docId:       savedDoc.id,
          lineNumber:  l.lineNumber,
          description: l.description,
          quantity:    String(l.quantity),
          unitPrice:   String(l.unitPrice),
          ivaRate:     l.ivaRate,
          ivaAmount:   String(l.ivaAmount),
          lineTotal:   String(l.lineTotal),
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
        docType:      taxDocuments.docType,
        docNumber:    taxDocuments.docNumber,
        issuerName:   taxDocuments.issuerName,
        issuerRuc:    taxDocuments.issuerRuc,
        issueDate:    taxDocuments.issueDate,
        total:        taxDocuments.total,
        currencyCode: taxDocuments.currencyCode,
        status:       taxDocuments.status,
        aiProvider:   taxDocuments.aiProvider,
        aiConfidence: taxDocuments.aiConfidence,
        createdAt:    taxDocuments.createdAt,
      })
      .from(taxDocuments)
      .innerJoin(entities, eq(taxDocuments.entityId, entities.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(taxDocuments.createdAt))
      .limit(200);

    return {
      ok: true,
      data: rows.map((r) => ({
        id:           r.id,
        entityId:     r.entityId,
        entityName:   r.entityName,
        docType:      r.docType ?? "factura",
        docNumber:    r.docNumber,
        issuerName:   r.issuerName,
        issuerRuc:    r.issuerRuc,
        issueDate:    r.issueDate instanceof Date
                        ? r.issueDate.toISOString().split("T")[0]
                        : String(r.issueDate).slice(0, 10),
        total:        Number(r.total),
        currency:     r.currencyCode ?? "PYG",
        status:       r.status ?? "pending_review",
        aiProvider:   r.aiProvider,
        aiConfidence: r.aiConfidence ? Number(r.aiConfidence) : null,
        createdAt:    r.createdAt instanceof Date
                        ? r.createdAt.toISOString()
                        : String(r.createdAt),
      })),
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
      .select()
      .from(taxDocuments)
      .innerJoin(entities, eq(taxDocuments.entityId, entities.id))
      .where(eq(taxDocuments.id, docId));

    if (!doc) return { ok: false, error: "Comprobante no encontrado" };

    const docLines = await db.select().from(taxDocumentLines)
      .where(eq(taxDocumentLines.docId, docId))
      .orderBy(taxDocumentLines.lineNumber);

    const [latestProposal] = await db.select().from(aiProposals)
      .where(and(eq(aiProposals.docId, docId), eq(aiProposals.status, "pending")))
      .orderBy(desc(aiProposals.createdAt))
      .limit(1);

    const td = doc.tax_documents;
    const en = doc.entities;

    const docRow: ComprobanteRow & { iva10: number; iva5: number; ivaExento: number; lines: Array<{ description: string; quantity: number; unitPrice: number; ivaRate: number; lineTotal: number }> } = {
      id:           td.id,
      entityId:     td.entityId,
      entityName:   en.legalName,
      docType:      td.docType ?? "factura",
      docNumber:    td.docNumber,
      issuerName:   td.issuerName,
      issuerRuc:    td.issuerRuc,
      issueDate:    td.issueDate instanceof Date ? td.issueDate.toISOString().split("T")[0] : String(td.issueDate).slice(0, 10),
      total:        Number(td.total),
      currency:     td.currencyCode ?? "PYG",
      status:       td.status ?? "pending_review",
      aiProvider:   td.aiProvider,
      aiConfidence: td.aiConfidence ? Number(td.aiConfidence) : null,
      createdAt:    td.createdAt instanceof Date ? td.createdAt.toISOString() : String(td.createdAt),
      iva10:        Number(td.iva10 ?? 0),
      iva5:         Number(td.iva5 ?? 0),
      ivaExento:    Number(td.ivaExento ?? 0),
      lines:        docLines.map((l) => ({
        description: l.description,
        quantity:    Number(l.quantity ?? 0),
        unitPrice:   Number(l.unitPrice ?? 0),
        ivaRate:     Number(l.ivaRate ?? 0),
        lineTotal:   Number(l.lineTotal ?? 0),
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
        await db.update(globalSettings).set({ value, updatedAt: new Date() }).where(eq(globalSettings.key, key));
      }
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al guardar" };
  }
}
