"use server";

import { eq, and, sql, gte, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  pettyCashFunds, pettyCashExpenses, pettyCashReimbursements,
  importClearances, importClearanceExpenses, paymentOrders, bankChecks,
  entities, accounts, journalEntries, journalLines, retenciones, taxDocuments, partners,
} from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Fondo Fijo (Caja Chica) Actions ──────────────────────────────────────────

export async function loadPettyCashFunds(entityId: string): Promise<ActionResult<any[]>> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(pettyCashFunds)
      .where(eq(pettyCashFunds.entityId, entityId));
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function createPettyCashFund(
  entityId: string,
  name: string,
  custodian: string,
  maxAmount: number,
  glAccountId: string
): Promise<ActionResult<any>> {
  try {
    const db = getDb();
    const [row] = await db
      .insert(pettyCashFunds)
      .values({
        entityId,
        name,
        custodian,
        maxAmount: String(maxAmount),
        glAccountId,
      })
      .returning();
    return { ok: true, data: row };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function addPettyCashExpense(
  fundId: string,
  dateStr: string,
  partnerName: string,
  partnerRuc: string,
  invoiceNumber: string,
  total: number,
  iva10: number,
  iva5: number,
  exento: number,
  glAccountId: string
): Promise<ActionResult<any>> {
  try {
    const db = getDb();
    const [row] = await db
      .insert(pettyCashExpenses)
      .values({
        fundId,
        date: new Date(dateStr),
        partnerName,
        partnerRuc,
        invoiceNumber,
        total: String(total),
        iva10: String(iva10),
        iva5: String(iva5),
        exento: String(exento),
        glAccountId,
      })
      .returning();
    return { ok: true, data: row };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function loadPendingPettyExpenses(fundId: string): Promise<ActionResult<any[]>> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(pettyCashExpenses)
      .where(
        and(
          eq(pettyCashExpenses.fundId, fundId),
          sql`${pettyCashExpenses.reimbursementId} IS NULL`
        )
      );
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function reimbursePettyCashFund(
  fundId: string,
  dateStr: string
): Promise<ActionResult<string>> {
  try {
    const db = getDb();
    
    // Get pending expenses
    const expenses = await db
      .select()
      .from(pettyCashExpenses)
      .where(
        and(
          eq(pettyCashExpenses.fundId, fundId),
          sql`${pettyCashExpenses.reimbursementId} IS NULL`
        )
      );
    if (expenses.length === 0) {
      return { ok: false, error: "No hay gastos pendientes de reembolso en este fondo." };
    }

    const [fund] = await db
      .select()
      .from(pettyCashFunds)
      .where(eq(pettyCashFunds.id, fundId))
      .limit(1);

    if (!fund) return { ok: false, error: "Fondo no encontrado" };

    const totalAmount = expenses.reduce((s, e) => s + parseFloat(e.total), 0);

    const result = await db.transaction(async (tx) => {
      // 1. Create reimbursement record
      const [reimb] = await tx
        .insert(pettyCashReimbursements)
        .values({
          fundId,
          date: new Date(dateStr),
          totalAmount: String(totalAmount),
          status: "posted",
        })
        .returning();

      // 2. Link expenses to this reimbursement
      await tx
        .update(pettyCashExpenses)
        .set({ reimbursementId: reimb.id })
        .where(
          and(
            eq(pettyCashExpenses.fundId, fundId),
            sql`reimbursement_id IS NULL`
          )
        );

      // 3. Generate automatic journal entry
      const [entry] = await tx
        .insert(journalEntries)
        .values({
          entityId: fund.entityId,
          date: new Date(dateStr),
          description: `Reposición de Fondo Fijo: ${fund.name} - Rendición del ${new Date(dateStr).toLocaleDateString("es-PY")}`,
          source: "manual",
          status: "posted",
          postedAt: new Date(),
        })
        .returning();

      // Debits: Specific expense accounts for each ticket
      const lines = expenses.map((exp) => ({
        entryId: entry.id,
        accountId: exp.glAccountId || fund.glAccountId || "", // fallback to fund default account
        debit: exp.total,
        credit: "0",
        currencyCode: "PYG",
        description: `Gasto Fondo Fijo: Fac. ${exp.invoiceNumber} - ${exp.partnerName}`,
      }));

      // Credit: Fund's asset account
      lines.push({
        entryId: entry.id,
        accountId: fund.glAccountId || "",
        debit: "0",
        credit: String(totalAmount),
        currencyCode: "PYG",
        description: `Reposición de efectivo Fondo Fijo`,
      });

      await tx.insert(journalLines).values(lines);

      // Update reimbursement with entry ID
      await tx
        .update(pettyCashReimbursements)
        .set({ journalEntryId: entry.id })
        .where(eq(pettyCashReimbursements.id, reimb.id));

      return `Fondo Fijo reembolsado por Gs. ${Math.round(totalAmount).toLocaleString("es-PY")}. Asiento contable generado.`;
    });

    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al procesar reposición" };
  }
}

// ─── Despachos de Importacion Actions ─────────────────────────────────────────

export async function loadImportClearances(entityId: string): Promise<ActionResult<any[]>> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(importClearances)
      .where(eq(importClearances.entityId, entityId));
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function createImportClearance(
  entityId: string,
  clearanceNumber: string,
  dateStr: string,
  fobValue: number,
  freightValue: number,
  insuranceValue: number,
  customsTax: number,
  ivaAduana: number,
  expensesIds: string[] // List of tax documents that form part of the local expense (fletes, despachante)
): Promise<ActionResult<any>> {
  try {
    const db = getDb();

    // Query details of expenses documents to calculate sum
    let totalGastoLocal = 0;
    if (expensesIds.length > 0) {
      const expDocs = await db
        .select({ total: taxDocuments.total })
        .from(taxDocuments)
        .where(sql`id IN (${sql.join(expensesIds, sql`, `)})`);
      totalGastoLocal = expDocs.reduce((s, d) => s + parseFloat(d.total), 0);
    }

    const result = await db.transaction(async (tx) => {
      // 1. Create Clearance
      const [clearance] = await tx
        .insert(importClearances)
        .values({
          entityId,
          clearanceNumber,
          date: new Date(dateStr),
          fobValue: String(fobValue),
          freightValue: String(freightValue),
          insuranceValue: String(insuranceValue),
          customsTax: String(customsTax),
          ivaAduana: String(ivaAduana),
          totalGastoLocal: String(totalGastoLocal),
          status: "processed",
        })
        .returning();

      // 2. Link local expense invoices
      if (expensesIds.length > 0) {
        await tx.insert(importClearanceExpenses).values(
          expensesIds.map((docId) => ({
            clearanceId: clearance.id,
            taxDocumentId: docId,
            allocatedAmount: sql`(SELECT total FROM tax_documents WHERE id = ${docId})`,
          }))
        );
      }

      // 3. Generate journal entry for customs tax & aduana
      const [entry] = await tx
        .insert(journalEntries)
        .values({
          entityId,
          date: new Date(dateStr),
          description: `Despacho de Importación N° ${clearanceNumber} - Liquidación aduanera`,
          source: "manual",
          status: "posted",
          postedAt: new Date(),
        })
        .returning();

      // Find typical accounts
      const [mercanciasCta] = await tx
        .select()
        .from(accounts)
        .where(and(sql`LOWER(name) LIKE '%mercaderia%' OR LOWER(name) LIKE '%stock%'`, eq(accounts.allowsPosting, true)))
        .limit(1);

      const [ivaCta] = await tx
        .select()
        .from(accounts)
        .where(and(sql`LOWER(name) LIKE '%iva crédito%' OR LOWER(name) LIKE '%iva credito%'`, eq(accounts.allowsPosting, true)))
        .limit(1);

      const [cajaCta] = await tx
        .select()
        .from(accounts)
        .where(and(sql`LOWER(name) LIKE '%caja%' OR LOWER(name) LIKE '%banco%'`, eq(accounts.allowsPosting, true)))
        .limit(1);

      if (mercanciasCta && ivaCta && cajaCta) {
        // Cost = FOB + Freight + Insurance + Customs tax
        const totalCostValue = fobValue + freightValue + insuranceValue + customsTax;
        
        await tx.insert(journalLines).values([
          {
            entryId: entry.id,
            accountId: mercanciasCta.id,
            debit: String(totalCostValue),
            credit: "0",
            currencyCode: "PYG",
            description: `Valor CIF + Gravamen Aduanero - Despacho ${clearanceNumber}`,
          },
          {
            entryId: entry.id,
            accountId: ivaCta.id,
            debit: String(ivaAduana),
            credit: "0",
            currencyCode: "PYG",
            description: `IVA Aduana pagado - Despacho ${clearanceNumber}`,
          },
          {
            entryId: entry.id,
            accountId: cajaCta.id,
            debit: "0",
            credit: String(totalCostValue + ivaAduana),
            currencyCode: "PYG",
            description: `Pago aduana y flete internacional`,
          },
        ]);
      }

      return clearance;
    });

    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al procesar despacho" };
  }
}

// ─── Tesorería: OPs y Cheques Actions ─────────────────────────────────────────

export async function loadPaymentOrders(entityId: string): Promise<ActionResult<any[]>> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: paymentOrders.id,
        date: paymentOrders.date,
        number: paymentOrders.number,
        totalAmount: paymentOrders.totalAmount,
        paymentMethod: paymentOrders.paymentMethod,
        status: paymentOrders.status,
        partnerName: partners.legalName,
      })
      .from(paymentOrders)
      .leftJoin(partners, eq(paymentOrders.partnerId, partners.id))
      .where(eq(paymentOrders.entityId, entityId))
      .orderBy(paymentOrders.date);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function createPaymentOrder(
  entityId: string,
  dateStr: string,
  number: string,
  partnerId: string,
  totalAmount: number,
  paymentMethod: "cash" | "check" | "bank_transfer",
  bankAccountId?: string,
  checkNumber?: string,
  checkType?: "vista" | "diferido",
  checkDueDate?: string,
  payeeName?: string
): Promise<ActionResult<any>> {
  try {
    const db = getDb();
    const result = await db.transaction(async (tx) => {
      // 1. Create Payment Order
      const [po] = await tx
        .insert(paymentOrders)
        .values({
          entityId,
          date: new Date(dateStr),
          number,
          partnerId,
          totalAmount: String(totalAmount),
          paymentMethod,
          bankAccountId: bankAccountId || null,
          status: "paid",
        })
        .returning();

      // 2. If check, insert check record
      if (paymentMethod === "check" && bankAccountId && checkNumber && payeeName) {
        await tx.insert(bankChecks).values({
          entityId,
          bankAccountId,
          checkNumber,
          amount: String(totalAmount),
          checkType: checkType || "vista",
          issueDate: new Date(dateStr),
          dueDate: checkDueDate ? new Date(checkDueDate) : null,
          payeeName,
          paymentOrderId: po.id,
          status: "issued",
        });
      }

      // 3. Create payment journal entry
      const [partner] = await tx
        .select({ legalName: partners.legalName })
        .from(partners)
        .where(eq(partners.id, partnerId))
        .limit(1);

      const [entry] = await tx
        .insert(journalEntries)
        .values({
          entityId,
          date: new Date(dateStr),
          description: `Orden de Pago N° ${number} - Proveedor: ${partner?.legalName ?? "Varios"}`,
          source: "payment",
          status: "posted",
          postedAt: new Date(),
        })
        .returning();

      // Impute typical accounts
      const [provCta] = await tx
        .select()
        .from(accounts)
        .where(and(sql`LOWER(name) LIKE '%proveedor%'`, eq(accounts.allowsPosting, true)))
        .limit(1);

      const [cajaCta] = await tx
        .select()
        .from(accounts)
        .where(and(sql`LOWER(name) LIKE '%caja%' OR LOWER(name) LIKE '%banco%'`, eq(accounts.allowsPosting, true)))
        .limit(1);

      if (provCta && cajaCta) {
        await tx.insert(journalLines).values([
          {
            entryId: entry.id,
            accountId: provCta.id,
            debit: String(totalAmount),
            credit: "0",
            currencyCode: "PYG",
            description: `Cancelación de deuda - OP ${number}`,
          },
          {
            entryId: entry.id,
            accountId: cajaCta.id,
            debit: "0",
            credit: String(totalAmount),
            currencyCode: "PYG",
            description: `Pago por ${paymentMethod} - OP ${number}`,
          },
        ]);
      }

      // Link entry to payment order
      await tx
        .update(paymentOrders)
        .set({ journalEntryId: entry.id })
        .where(eq(paymentOrders.id, po.id));

      return po;
    });

    return { ok: true, data: result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

// ─── DNIT Exporters ───────────────────────────────────────────────────────────

export async function generateTesakaJson(
  entityId: string,
  year: number,
  month: number
): Promise<ActionResult<string>> {
  try {
    const db = getDb();
    
    // Fetch all retenciones emitted in the period
    const list = await db
      .select()
      .from(retenciones)
      .where(
        and(
          eq(retenciones.entityId, entityId),
          eq(retenciones.periodoYear, year),
          eq(retenciones.periodoMonth, month)
        )
      );

    const payload = {
      version: "1.0",
      tipoFormulario: "tesaka",
      periodo: `${year}-${String(month).padStart(2, "0")}`,
      cantidadRegistros: list.length,
      detalles: list.map((r) => ({
        fechaRetencion: r.fecha.toISOString().split("T")[0],
        rucRetenido: r.terceroRuc,
        razonSocialRetenido: r.terceroNombre,
        comprobanteTipo: r.docTipo,
        comprobanteNumero: r.docNumero,
        montoBase: parseFloat(r.montoBase),
        tasaRetencion: parseFloat(r.tasa) * 100,
        montoRetencion: parseFloat(r.montoRetencion),
        numeroCertificado: r.comprobanteRet,
      })),
    };

    return { ok: true, data: JSON.stringify(payload, null, 2) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error exportando Tesakã" };
  }
}

export async function exportArandukaJson(
  entityId: string,
  year: number
): Promise<ActionResult<string>> {
  try {
    const db = getDb();

    // Query posted sales of services (IRP typical income)
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);

    const sales = await db
      .select({
        issueDate: taxDocuments.issueDate,
        docType: taxDocuments.docType,
        number: taxDocuments.number,
        timbrado: taxDocuments.timbrado,
        total: taxDocuments.total,
        partnerRuc: partners.ruc,
        partnerName: partners.legalName,
        entityRuc: entities.ruc,
        entityName: entities.legalName,
      })
      .from(taxDocuments)
      .innerJoin(entities, eq(taxDocuments.entityId, entities.id))
      .leftJoin(partners, eq(taxDocuments.partnerId, partners.id))
      .where(
        and(
          eq(taxDocuments.entityId, entityId),
          eq(taxDocuments.direction, "issued"),
          eq(taxDocuments.status, "posted"),
          gte(taxDocuments.issueDate, from.toISOString().split("T")[0]),
          lte(taxDocuments.issueDate, to.toISOString().split("T")[0])
        )
      );

    const purchases = await db
      .select({
        issueDate: taxDocuments.issueDate,
        docType: taxDocuments.docType,
        number: taxDocuments.number,
        timbrado: taxDocuments.timbrado,
        total: taxDocuments.total,
        partnerRuc: partners.ruc,
        partnerName: partners.legalName,
        entityRuc: entities.ruc,
        entityName: entities.legalName,
      })
      .from(taxDocuments)
      .innerJoin(entities, eq(taxDocuments.entityId, entities.id))
      .leftJoin(partners, eq(taxDocuments.partnerId, partners.id))
      .where(
        and(
          eq(taxDocuments.entityId, entityId),
          eq(taxDocuments.direction, "received"),
          eq(taxDocuments.status, "posted"),
          gte(taxDocuments.issueDate, from.toISOString().split("T")[0]),
          lte(taxDocuments.issueDate, to.toISOString().split("T")[0])
        )
      );

    const payload = {
      sistema: "aranduka",
      ejercicio: year,
      identificacion: {
        ruc: sales[0]?.entityRuc ?? purchases[0]?.entityRuc ?? "80012345-1",
      },
      ingresos: sales.map((s) => ({
        fecha: new Date(s.issueDate).toISOString().split("T")[0],
        tipoComprobante: s.docType,
        numero: s.number,
        timbrado: s.timbrado,
        rucEmisor: s.entityRuc,
        razonSocialEmisor: s.entityName,
        totalIngreso: parseFloat(s.total),
      })),
      egresos: purchases.map((p) => ({
        fecha: new Date(p.issueDate).toISOString().split("T")[0],
        tipoComprobante: p.docType,
        numero: p.number,
        timbrado: p.timbrado,
        rucEmisor: p.partnerRuc ?? "",
        razonSocialEmisor: p.partnerName ?? "",
        totalEgreso: parseFloat(p.total),
        clasificacionEgreso: "gasto_deducible",
      })),
    };

    return { ok: true, data: JSON.stringify(payload, null, 2) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error exportando Aranduka" };
  }
}
