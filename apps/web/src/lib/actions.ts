"use server";

import { assertMoney } from "@intelicont/core";
import { isMockMode, dbErrorMessage } from "@ledger/db/index";
import * as repo from "@ledger/db/repository";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────

interface CreateAsientoInput {
  entityId: string;
  periodId: string;
  date: string;
  descripcion: string;
  lineas: {
    accountId: string;
    debit: number;
    credit: number;
    currencyCode: string;
    description: string;
  }[];
}

interface CreateTaxDocumentInput {
  entityId: string;
  direction: "issued" | "received";
  docType: string;
  number: string;
  timbrado?: string;
  cdc?: string;
  issueDate: string;
  partnerId?: string;
  currencyCode?: string;
  gravado10?: number;
  gravado5?: number;
  exento?: number;
  iva10?: number;
  iva5?: number;
  total: number;
  metadata?: Record<string, unknown>;
}

// ─── Entities ─────────────────────────────────────────────────────────────

export async function getEmpresas() {
  return repo.getEntities();
}

export async function getEmpresa(id: string) {
  return repo.getEntity(id);
}

// ─── Fiscal Periods ───────────────────────────────────────────────────────

export async function getFiscalPeriods(entityId: string) {
  return repo.getFiscalPeriods(entityId);
}

export async function getOpenPeriod(entityId: string) {
  return repo.getOpenPeriod(entityId);
}

// ─── Chart of Accounts ────────────────────────────────────────────────────

export async function getCuentas(entityId: string) {
  return repo.getAllAccounts(entityId);
}

// ─── Journal Entries ──────────────────────────────────────────────────────

export async function getAsientos(entityId?: string) {
  if (!entityId) return [];
  return repo.getJournalEntries(entityId);
}

export async function getAsientoLines(entryId: string) {
  return repo.getJournalLines(entryId);
}

export async function createAsiento(input: CreateAsientoInput) {
  // Validate balance
  let totalDebito = 0;
  let totalCredito = 0;
  try {
    for (const l of input.lineas) {
      totalDebito += assertMoney(l.debit);
      totalCredito += assertMoney(l.credit);
    }
  } catch {
    return { success: false, message: "Importe inválido: debe ser un entero en guaraníes" };
  }
  if (totalDebito !== totalCredito) {
    return { success: false, message: "El asiento no está balanceado" };
  }

  if (isMockMode()) {
    return {
      success: true,
      message: "Asiento creado (modo simulación)",
      id: "mock-" + Math.random().toString(36).slice(2, 10),
    };
  }

  try {
    const entry = await repo.createPostedEntry({
      entityId: input.entityId,
      periodId: input.periodId,
      date: new Date(input.date),
      number: `JE-${Date.now().toString().slice(-6)}`,
      description: input.descripcion,
      lines: input.lineas,
    });
    revalidatePath("/asientos");
    return { success: true, message: "Asiento creado exitosamente", id: entry.id };
  } catch (err) {
    return { success: false, message: dbErrorMessage(err) };
  }
}

// ─── Partners ─────────────────────────────────────────────────────────────

export async function getPartners(entityId: string) {
  return repo.getPartners(entityId);
}

export async function getPartner(id: string) {
  return repo.getPartner(id);
}

// ─── Tax Documents ────────────────────────────────────────────────────────

export async function getTaxDocuments(entityId: string) {
  return repo.getTaxDocuments(entityId);
}

export async function getTaxDocument(id: string) {
  return repo.getTaxDocument(id);
}

export async function getPendingTaxDocuments(entityId: string) {
  return repo.getPendingTaxDocuments(entityId);
}

export async function getTaxDocumentLines(documentId: string) {
  return repo.getTaxDocumentLines(documentId);
}

export async function getRetentions(documentId: string) {
  return repo.getRetentions(documentId);
}

export async function createTaxDocument(input: CreateTaxDocumentInput) {
  if (isMockMode()) {
    return {
      success: true,
      message: "Documento tributario creado (modo simulación)",
      id: "mock-td-" + Math.random().toString(36).slice(2, 10),
    };
  }

  try {
    const doc = await repo.createTaxDocument({
      entityId: input.entityId,
      direction: input.direction,
      docType: input.docType as any,
      number: input.number,
      timbrado: input.timbrado,
      cdc: input.cdc,
      issueDate: input.issueDate,
      partnerId: input.partnerId,
      currencyCode: input.currencyCode || "PYG",
      gravado10: input.gravado10 ?? 0,
      gravado5: input.gravado5 ?? 0,
      exento: input.exento ?? 0,
      iva10: input.iva10 ?? 0,
      iva5: input.iva5 ?? 0,
      total: assertMoney(input.total),
      status: "pending",
      sifenStatus: "pending_upload",
      metadata: input.metadata || null,
    });
    revalidatePath("/sifen");
    return { success: true, message: "Documento creado", id: doc.id };
  } catch (err) {
    return { success: false, message: dbErrorMessage(err) };
  }
}

// ─── Banking ──────────────────────────────────────────────────────────────

export async function getBankMovements(bankAccountId: string) {
  return repo.getBankMovements(bankAccountId);
}

export async function getReconciliations(bankAccountId: string) {
  return repo.getReconciliations(bankAccountId);
}

// ─── Audit ────────────────────────────────────────────────────────────────

export async function getAuditEvents(entityId: string, limit = 50) {
  return repo.getAuditEvents(entityId, limit);
}

// ─── AI Decisions ─────────────────────────────────────────────────────────

export async function getAiDecisions(entityId: string) {
  return repo.getAiDecisions(entityId);
}
