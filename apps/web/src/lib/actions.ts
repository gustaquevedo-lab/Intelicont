"use server";

import { withTenant, type Db } from "@ledger/db/index";
import * as repo from "@ledger/db/repository";
import { requireUser } from "./session";
import { loadGuardUser, needs2FA } from "./auth-guard";
import { logger, safeErrorInfo } from "./logger";

/**
 * Runs repository work in the session user's tenant scope. Throws without a session, and for an
 * admin without TOTP (same policy as the tRPC middleware).
 */
async function scoped<T>(fn: (db: Db, userId: string) => Promise<T>, action?: string): Promise<T> {
  let userId: string | undefined;
  try {
    ({ userId } = await requireUser());
    const uid = userId;
    return await withTenant(uid, async (db) => {
      if (needs2FA(await loadGuardUser(db, uid))) throw new Error("2FA requerido");
      return fn(db, uid);
    });
  } catch (err) {
    // Server actions have no request context; log who/what failed (never the input) and rethrow.
    // Next control-flow errors (redirect/notFound) are not failures.
    const digest = (err as { digest?: unknown } | null)?.digest;
    if (!(typeof digest === "string" && /^NEXT_(REDIRECT|NOT_FOUND)/.test(digest))) {
      logger.warn({ action: action ?? (fn.name || "unknown"), userId, ...safeErrorInfo(err) }, "action failed");
    }
    throw err;
  }
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
