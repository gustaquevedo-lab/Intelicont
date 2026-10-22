"use server";

import { assertMoney } from "@intelicont/core";
import { isMockMode, dbErrorMessage, withTenant } from "@ledger/db/index";
import * as repo from "@ledger/db/repository";
import { postEntry } from "@ledger/src/usecases";
import { revalidatePath } from "next/cache";
import { requireUser } from "./session";
import { loadGuardUser, needs2FA } from "./auth-guard";

/**
 * Runs repository work in the session user's tenant scope. Throws without a session, and for an
 * admin without TOTP (same policy as the tRPC middleware).
 */
async function scoped<T>(fn: () => Promise<T>): Promise<T> {
  const { userId } = await requireUser();
  return withTenant(userId, async (db) => {
    if (needs2FA(await loadGuardUser(db, userId))) throw new Error("2FA requerido");
    return fn();
  });
}

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
  return scoped(() => repo.getEntities());
}

export async function getEmpresa(id: string) {
  return scoped(() => repo.getEntity(id));
}

// ─── Fiscal Periods ───────────────────────────────────────────────────────

export async function getFiscalPeriods(entityId: string) {
  return scoped(() => repo.getFiscalPeriods(entityId));
}

export async function getOpenPeriod(entityId: string) {
  return scoped(() => repo.getOpenPeriod(entityId));
}

// ─── Chart of Accounts ────────────────────────────────────────────────────

export async function getCuentas(entityId: string) {
  return scoped(() => repo.getAllAccounts(entityId));
}

// ─── Journal Entries ──────────────────────────────────────────────────────

export async function getAsientos(entityId?: string) {
  if (!entityId) return [];
  return scoped(() => repo.getJournalEntries(entityId));
}

export async function getAsientoLines(entryId: string) {
  return scoped(() => repo.getJournalLines(entryId));
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
    const res = await scoped(() => postEntry({
      entityId: input.entityId,
      periodId: input.periodId,
      date: new Date(input.date),
      number: `JE-${Date.now().toString().slice(-6)}`,
      description: input.descripcion,
      lines: input.lineas,
    }));
    if (!res.ok) return { success: false, message: res.error };
    revalidatePath("/asientos");
    return { success: true, message: "Asiento creado exitosamente", id: res.value.id };
  } catch (err) {
    return { success: false, message: dbErrorMessage(err) };
  }
}

// ─── Partners ─────────────────────────────────────────────────────────────

export async function getPartners(entityId: string) {
  return scoped(() => repo.getPartners(entityId));
}

export async function getPartner(id: string) {
  return scoped(() => repo.getPartner(id));
}

// ─── Tax Documents ────────────────────────────────────────────────────────

export async function getTaxDocuments(entityId: string) {
  return scoped(() => repo.getTaxDocuments(entityId));
}

export async function getTaxDocument(id: string) {
  return scoped(() => repo.getTaxDocument(id));
}

export async function getPendingTaxDocuments(entityId: string) {
  return scoped(() => repo.getPendingTaxDocuments(entityId));
}

export async function getTaxDocumentLines(documentId: string) {
  return scoped(() => repo.getTaxDocumentLines(documentId));
}

export async function getRetentions(documentId: string) {
  return scoped(() => repo.getRetentions(documentId));
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
    const doc = await scoped(() => repo.createTaxDocument({
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
    }));
    revalidatePath("/sifen");
    return { success: true, message: "Documento creado", id: doc.id };
  } catch (err) {
    return { success: false, message: dbErrorMessage(err) };
  }
}

// ─── Banking ──────────────────────────────────────────────────────────────

export async function getBankMovements(bankAccountId: string) {
  return scoped(() => repo.getBankMovements(bankAccountId));
}

export async function getReconciliations(bankAccountId: string) {
  return scoped(() => repo.getReconciliations(bankAccountId));
}

// ─── Audit ────────────────────────────────────────────────────────────────

export async function getAuditEvents(entityId: string, limit = 50) {
  return scoped(() => repo.getAuditEvents(entityId, limit));
}

// ─── AI Decisions ─────────────────────────────────────────────────────────

export async function getAiDecisions(entityId: string) {
  return scoped(() => repo.getAiDecisions(entityId));
}
