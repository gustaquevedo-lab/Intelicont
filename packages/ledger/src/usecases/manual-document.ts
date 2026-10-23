import { assertMoney, err, ok, type Result } from "@intelicont/core";
import { and, eq, sql } from "drizzle-orm";
import { audited } from "../../db/audit";
import { dbErrorMessage, tenantDb, type Db } from "../../db/index";
import * as schema from "../../db/schema";
import { RuleBasedProvider } from "../ai/rules";
import type { AccountRef, DocFacts } from "../ai/provider";
import { ivaFromGross, validateRuc } from "../fiscal-py";
import { isSupportedInRegistro, TABLA_4 } from "../registro-codes";
import { calculateNetPayable, calculateRetentions, parseRetentionProfile, type RetentionCalculation } from "../retentions";
import { postEntry } from "./post-entry";

/** A non-electronic document typed by the user (Registro de Comprobantes fields, D8). */
export type ManualInput = {
  entityId: string;
  direction: "received" | "issued";
  /** Tabla 4: ventas / compras codes only. */
  docCode: number;
  partnerId?: string;
  /** Inline counterparty, found or created by RUC (like the XML ingest). */
  partner?: { ruc: string; legalName: string };
  timbrado: string;
  number: string;
  issueDate: string;
  condition: "cash" | "credit";
  /** IVA-included gross amounts, integers. */
  gravado10: number;
  gravado5: number;
  exento: number;
  total: number;
  imputaIva: boolean;
  imputaIre: boolean;
  imputaIrp: boolean;
  noImputa?: boolean;
  foreignCurrency?: boolean;
  relatedNumber?: string;
  relatedTimbrado?: string;
  expenseAccountId?: string;
  concept?: string;
};

export type ManualLine = {
  accountId: string | null;
  accountCode: string;
  accountName: string | null;
  debit: number;
  credit: number;
  description: string;
};

export type ManualPreview = {
  iva10: number;
  iva5: number;
  retentions: RetentionCalculation[];
  totalRetentions: number;
  /** total - retentions: what is paid to / collected from the counterparty. */
  netPayable: number;
  lines: ManualLine[];
  /** Missing accounts etc. (Spanish). */
  notes: string[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMBER = /^\d{3}-\d{3}-\d{7}$/;
const TIMBRADO = /^\d{8}$/;
/** Registro exceptions: these codes only carry the total. */
const TOTAL_ONLY = new Set([101, 104, 105, 112]);
const DOC_TYPE: Record<number, "self_invoice" | "import" | "credit_note" | "debit_note"> = {
  101: "self_invoice", 107: "import", 110: "credit_note", 111: "debit_note",
};
const docTypeOf = (code: number) => DOC_TYPE[code] ?? "invoice";

type Checked = { iva10: number; iva5: number; ruc?: { body: string; dv: string | null } };

/** Registro + fiscal rules that need no DB. */
function validate(input: ManualInput): Result<Checked, string> {
  if (!UUID.test(input.entityId)) return err("Empresa no encontrada");
  const side = input.direction === "received" ? "compras" : "ventas";
  if (!Number.isInteger(input.docCode) || !isSupportedInRegistro(input.docCode, side)) {
    return err(`Tipo de comprobante ${input.docCode} no admitido en ${side}`);
  }
  if (!!input.partnerId === !!input.partner) return err("Indicá un tercero existente o un RUC y razón social");
  if (input.partnerId && !UUID.test(input.partnerId)) return err("Tercero no encontrado");
  let ruc: Checked["ruc"];
  if (input.partner) {
    const raw = input.partner.ruc.trim();
    const check = validateRuc(raw);
    if (!check.valid) return err(`RUC inválido: ${check.errors[0] ?? raw}`);
    if (!input.partner.legalName.trim()) return err("La razón social es obligatoria");
    const [body, dv] = raw.split("-");
    ruc = { body, dv: dv ?? null };
  }
  if (!TIMBRADO.test(input.timbrado)) return err("Timbrado inválido: debe tener 8 dígitos");
  if (!NUMBER.test(input.number)) return err("Número inválido: formato ###-###-#######");
  const d = new Date(`${input.issueDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.issueDate) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== input.issueDate) {
    return err("Fecha inválida");
  }
  if (input.issueDate < "2021-01-01" && input.condition !== "credit") {
    return err("Fecha anterior al 01/01/2021: solo se admiten comprobantes a crédito");
  }
  const { gravado10, gravado5, exento, total } = input;
  try {
    for (const n of [gravado10, gravado5, exento, total]) if (assertMoney(n) < 0) throw new Error();
  } catch {
    return err("Importe inválido: debe ser un entero no negativo");
  }
  if (TOTAL_ONLY.has(input.docCode)) {
    if (gravado10 || gravado5 || exento) return err(`El tipo ${input.docCode} (${TABLA_4[input.docCode].name}) solo informa el total`);
  } else if (total !== gravado10 + gravado5 + exento) {
    return err("El total debe ser igual a gravado 10 % + gravado 5 % + exento");
  }
  if (total <= 0) return err("El total debe ser mayor a cero");
  if (input.docCode === 110 || input.docCode === 111) {
    if (!input.relatedNumber || !input.relatedTimbrado) {
      return err("Las notas de crédito y débito requieren el comprobante asociado (número y timbrado)");
    }
    if (!NUMBER.test(input.relatedNumber) || !TIMBRADO.test(input.relatedTimbrado)) return err("Comprobante asociado inválido");
  }
  const imputa = input.imputaIva || input.imputaIre || input.imputaIrp;
  if (input.noImputa) {
    if (input.direction === "issued") return err("\"No imputa\" solo aplica a compras");
    if (imputa) return err("\"No imputa\" excluye las imputaciones IVA, IRE e IRP");
  } else if (!imputa) {
    return err("Seleccioná al menos una obligación (IVA, IRE o IRP)");
  }
  if (input.expenseAccountId && !UUID.test(input.expenseAccountId)) return err("Cuenta de gasto inválida");
  return ok({ iva10: ivaFromGross(gravado10, 10), iva5: ivaFromGross(gravado5, 5), ruc });
}

type Prepared = ManualPreview & {
  periodId: string;
  /** Existing partner, or the inline one still to be created. */
  partner: { id: string | null; ruc: string; dv: string | null; legalName: string };
};

/** Read-only part shared by preview and create: entity, partner profile, accounts, period, lines. */
async function prepare(db: Db, input: ManualInput, v: Checked): Promise<Result<Prepared, string>> {
  const [entity] = await db.select({ ruc: schema.entities.ruc, legalName: schema.entities.legalName })
    .from(schema.entities).where(eq(schema.entities.id, input.entityId));
  if (!entity) return err("Empresa no encontrada");

  const cols = { id: schema.partners.id, entityId: schema.partners.entityId, ruc: schema.partners.ruc, dv: schema.partners.dvRuc, legalName: schema.partners.legalName, profile: schema.partners.retentionProfile };
  let partner: Prepared["partner"];
  let rawProfile: unknown = null;
  if (input.partnerId) {
    const [p] = await db.select(cols).from(schema.partners).where(eq(schema.partners.id, input.partnerId));
    if (!p || p.entityId !== input.entityId) return err("Tercero no encontrado");
    partner = { id: p.id, ruc: p.ruc, dv: p.dv, legalName: p.legalName };
    rawProfile = p.profile;
  } else {
    const [p] = await db.select(cols).from(schema.partners)
      .where(and(eq(schema.partners.entityId, input.entityId), eq(schema.partners.ruc, v.ruc!.body)));
    partner = p
      ? { id: p.id, ruc: p.ruc, dv: p.dv, legalName: p.legalName }
      : { id: null, ruc: v.ruc!.body, dv: v.ruc!.dv, legalName: input.partner!.legalName.trim() };
    rawProfile = p?.profile ?? null;
  }
  const profile = parseRetentionProfile(rawProfile);
  if (!profile.ok) return err(`${profile.error} del tercero ${partner.legalName}`);

  const [year, month] = input.issueDate.split("-").map(Number);
  const [period] = await db.select({ id: schema.fiscalPeriods.id }).from(schema.fiscalPeriods).where(and(
    eq(schema.fiscalPeriods.entityId, input.entityId),
    eq(schema.fiscalPeriods.year, year),
    eq(schema.fiscalPeriods.month, month),
    eq(schema.fiscalPeriods.status, "open"),
  ));
  if (!period) return err(`No hay período abierto para ${String(month).padStart(2, "0")}/${year}`);

  const rows = await db.select({
    id: schema.accounts.id, code: schema.accounts.code, name: schema.accounts.name,
    nature: schema.accounts.nature, allowsPosting: schema.accounts.allowsPosting,
  })
    .from(schema.accounts)
    .innerJoin(schema.chartOfAccounts, eq(schema.accounts.coaId, schema.chartOfAccounts.id))
    .where(and(eq(schema.chartOfAccounts.entityId, input.entityId), eq(schema.accounts.allowsPosting, true)));
  const accounts: AccountRef[] = rows.map((a) => ({ ...a, nature: String(a.nature), allowsPosting: true }));
  const expenseAccount = input.expenseAccountId ? accounts.find((a) => a.id === input.expenseAccountId) : undefined;
  if (input.expenseAccountId && !expenseAccount) return err("Cuenta de gasto inválida");

  const totalOnly = TOTAL_ONLY.has(input.docCode);
  const amounts = {
    gravado10: input.gravado10, gravado5: input.gravado5, exento: totalOnly ? input.total : input.exento,
    iva10: v.iva10, iva5: v.iva5, total: input.total,
  };
  // Withholdings: purchases only, never on a credit note (it reverses the purchase).
  const retentions = input.direction === "received" && input.docCode !== 110
    ? calculateRetentions({ ...amounts, profile: profile.value })
    : [];

  const counterparty = { ruc: partner.ruc, dv: partner.dv === null ? 0 : Number(partner.dv), name: partner.legalName };
  const self = { ruc: entity.ruc.split("-")[0], dv: Number(entity.ruc.split("-")[1] ?? 0), name: entity.legalName };
  const docType = docTypeOf(input.docCode);
  const facts: DocFacts = {
    cdc: "",
    docType: docType === "import" ? "invoice" : docType,
    timbrado: input.timbrado,
    number: input.number,
    issueDate: input.issueDate,
    currency: "PYG",
    condition: input.condition,
    issuer: input.direction === "received" ? counterparty : self,
    receiver: input.direction === "received" ? self : counterparty,
    ...amounts,
    lines: [],
    isElectronic: false,
  };
  const suggestion = await new RuleBasedProvider().suggestEntry(facts, accounts, input.direction, { expenseAccount, retentions });
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const lines = suggestion.lines.map((l) => ({ ...l, accountName: (l.accountId && byId.get(l.accountId)?.name) || null }));
  const notes = lines.filter((l) => !l.accountId).map((l) => `Falta la cuenta ${l.accountCode} (${l.description}) en el plan de cuentas`);
  const totalRetentions = retentions.reduce((s, r) => s + r.amount, 0);
  return ok({
    iva10: v.iva10, iva5: v.iva5, retentions, totalRetentions, netPayable: calculateNetPayable(input.total, retentions),
    lines, notes, periodId: period.id, partner,
  });
}

/** Computes IVA, withholdings and the proposed entry without writing anything. */
export async function previewManual(input: ManualInput): Promise<Result<ManualPreview, string>> {
  const v = validate(input);
  if (!v.ok) return v;
  return tenantDb(async (db) => {
    const p = await prepare(db, input, v.value);
    if (!p.ok) return p;
    const { periodId: _p, partner: _q, ...preview } = p.value;
    return ok(preview);
  });
}

class Rejected extends Error {}

/**
 * Stores the manual document (+ line, + withholdings, + partner if inline) and posts its entry, in
 * one savepoint audited as `tax_document.created_manual`.
 *
 * Duplicates (entity, partner, doc_code, timbrado, number): non-electronic documents have no
 * unique index (and migrations are frozen), so the check runs under a transaction-scoped advisory
 * lock keyed on a hash of that tuple. A concurrent identical submission blocks on the lock until
 * the first transaction ends, then sees the committed row. The lock is held to the end of the
 * request transaction (not just the savepoint), which is exactly the window that matters.
 */
export type ManualCreated = { documentId: string; entryId: string };

export async function createManual(input: ManualInput): Promise<Result<ManualCreated, string>> {
  const v = validate(input);
  if (!v.ok) return v;
  return tenantDb(async (db) => {
    const prepared = await prepare(db, input, v.value);
    if (!prepared.ok) return prepared;
    const p = prepared.value;
    if (p.notes.length > 0) return err(p.notes.join(". "));
    const docType = docTypeOf(input.docCode);
    const description = input.concept?.trim() || TABLA_4[input.docCode].name;
    try {
      const result = await db.transaction((tx) => audited(
        tx,
        {
          entityId: input.entityId,
          action: "tax_document.created_manual",
          targetType: "tax_document",
          targetId: (r: ManualCreated) => r.documentId,
          after: (r: ManualCreated) => ({ docCode: input.docCode, number: input.number, total: input.total, retentions: p.totalRetentions, entryId: r.entryId }),
        },
        async (): Promise<ManualCreated> => {
          let partnerId = p.partner.id;
          if (!partnerId) {
            // Same convention as the XML ingest: ruc WITHOUT DV, dv_ruc separate; ON CONFLICT for concurrent creators.
            const [inserted] = await tx.insert(schema.partners).values({
              entityId: input.entityId,
              kind: input.direction === "received" ? "supplier" : "customer",
              ruc: p.partner.ruc,
              dvRuc: p.partner.dv,
              legalName: p.partner.legalName,
              country: "PRY",
            }).onConflictDoNothing({ target: [schema.partners.entityId, schema.partners.ruc] }).returning({ id: schema.partners.id });
            partnerId = inserted?.id ?? (await tx.select({ id: schema.partners.id }).from(schema.partners)
              .where(and(eq(schema.partners.entityId, input.entityId), eq(schema.partners.ruc, p.partner.ruc))))[0].id;
          }

          const key = ["manual", input.entityId, partnerId, input.docCode, input.timbrado, input.number].join(":");
          await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
          const [dup] = await tx.select({ id: schema.taxDocuments.id }).from(schema.taxDocuments).where(and(
            eq(schema.taxDocuments.entityId, input.entityId),
            eq(schema.taxDocuments.partnerId, partnerId),
            eq(schema.taxDocuments.docCode, input.docCode),
            eq(schema.taxDocuments.timbrado, input.timbrado),
            eq(schema.taxDocuments.number, input.number),
          )).limit(1);
          if (dup) throw new Rejected("Comprobante duplicado");

          const [doc] = await tx.insert(schema.taxDocuments).values({
            entityId: input.entityId,
            direction: input.direction,
            docType,
            number: input.number,
            timbrado: input.timbrado,
            issueDate: input.issueDate,
            partnerId,
            currencyCode: "PYG",
            condition: input.condition,
            status: "posted",
            sifenStatus: "validated",
            gravado10: input.gravado10,
            gravado5: input.gravado5,
            exento: input.exento,
            iva10: p.iva10,
            iva5: p.iva5,
            total: input.total,
            metadata: { manual: true, concept: input.concept?.trim() || null },
            processedAt: new Date(),
            docCode: input.docCode,
            counterpartyIdType: p.partner.dv === null ? 12 : 11,
            imputaIva: input.imputaIva,
            imputaIre: input.imputaIre,
            imputaIrp: input.imputaIrp,
            noImputa: input.noImputa ?? false,
            foreignCurrency: input.foreignCurrency ?? false,
            relatedNumber: input.relatedNumber ?? null,
            relatedTimbrado: input.relatedTimbrado ?? null,
            isElectronic: false,
          }).returning({ id: schema.taxDocuments.id });

          const ivaRate = input.gravado10 > 0 ? 10 : input.gravado5 > 0 ? 5 : 0;
          await tx.insert(schema.taxDocumentLines).values({
            documentId: doc.id, description, quantity: "1", unitPrice: input.total, ivaRate, amount: input.total,
          });
          if (p.retentions.length > 0) {
            await tx.insert(schema.retentions).values(p.retentions.map((r) => ({
              documentId: doc.id,
              retentionType: r.type,
              base: r.base,
              rate: (r.rate * 100).toFixed(2), // stored as a percentage: 30.00
              amount: r.amount,
              certificateNumber: null,
              withheldAt: input.issueDate,
            })));
          }

          const entry = await postEntry({
            entityId: input.entityId,
            periodId: p.periodId,
            date: new Date(input.issueDate),
            number: `AS-${input.number}`,
            source: input.direction === "received" ? "purchase" : "sales",
            sourceRef: input.number,
            description: `${TABLA_4[input.docCode].name} ${input.number} — ${p.partner.legalName}`,
            lines: p.lines.map((l) => ({
              accountId: l.accountId!, debit: l.debit, credit: l.credit, currencyCode: "PYG",
              description: l.description, partnerId, taxDocumentId: doc.id,
            })),
          });
          if (!entry.ok) throw new Rejected(entry.error);
          await tx.update(schema.taxDocuments).set({ journalEntryId: entry.value.id }).where(eq(schema.taxDocuments.id, doc.id));
          return { documentId: doc.id, entryId: entry.value.id };
        },
      ));
      return ok(result);
    } catch (e) {
      return err(e instanceof Rejected ? e.message : dbErrorMessage(e));
    }
  });
}
