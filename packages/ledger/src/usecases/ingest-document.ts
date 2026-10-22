import { err, ok, type Result } from "@intelicont/core";
import { and, eq, sql } from "drizzle-orm";
import { audited } from "../../db/audit";
import { dbErrorMessage, tenantDb } from "../../db/index";
import * as schema from "../../db/schema";
import { ivaFromGross, validateCDC, validateRuc } from "../fiscal-py";
import { docCodeFromType } from "../registro-codes";
import { parseSifenDE, type SifenDocument } from "../sifen";

export type IngestResult = { documentId: string; duplicate: boolean; warnings: string[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rucOf = (p: { ruc: string; dv: number | null }) => (p.dv === null ? p.ruc : `${p.ruc}-${p.dv}`);

/** Hard fiscal validations (Err) and amount consistency checks (warnings). Pure: no DB. */
function check(doc: SifenDocument): Result<string[], string> {
  const issuer = rucOf(doc.issuer);
  if (!validateRuc(issuer).valid) return err(`RUC del emisor inválido: ${issuer}`);
  if (doc.receiver.dv !== null && !validateRuc(rucOf(doc.receiver)).valid) return err(`RUC del receptor inválido: ${rucOf(doc.receiver)}`);
  const cdc = validateCDC(doc.cdc);
  if (!cdc.valid) return err(`CDC inválido: ${cdc.errors.join(", ")}`);
  if (!/^\d{8}$/.test(doc.timbrado)) return err("Timbrado inválido: debe tener 8 dígitos");

  const warnings: string[] = [];
  for (const [rate, iva, gross] of [[10, doc.iva10, doc.gravado10], [5, doc.iva5, doc.gravado5]] as const) {
    const expected = ivaFromGross(gross, rate);
    if (Math.abs(iva - expected) > 1) warnings.push(`IVA ${rate}% inconsistente: declarado ${iva}, esperado ${expected}`);
  }
  if (doc.total !== doc.gravado10 + doc.gravado5 + doc.exento) warnings.push("El total no coincide con gravado 10% + gravado 5% + exento");
  const linesTotal = doc.lines.reduce((s, l) => s + l.amount, 0);
  if (linesTotal !== doc.total) warnings.push(`La suma de las líneas (${linesTotal}) no coincide con el total (${doc.total})`);
  return ok(warnings);
}

/**
 * Parses, validates and stores a SIFEN DE as a pending tax document (+ lines, + partner), audited as
 * `tax_document.ingested`. Dedupes on (entity, CDC): an existing document is returned with
 * `duplicate: true` and nothing is written. Parsing runs before any DB work.
 */
export async function ingestDocument(
  entityId: string,
  direction: "received" | "issued",
  xml: string,
): Promise<Result<IngestResult, string>> {
  const parsed = parseSifenDE(xml);
  if (!parsed.ok) return err(`XML SIFEN inválido: ${parsed.error}`);
  const doc = parsed.value;
  const checked = check(doc);
  if (!checked.ok) return checked;
  const warnings = checked.value;
  if (!UUID.test(entityId)) return err("Empresa no encontrada");

  return tenantDb(async (db) => {
    const [entity] = await db.select({ ruc: schema.entities.ruc }).from(schema.entities).where(eq(schema.entities.id, entityId));
    if (!entity) return err("Empresa no encontrada");

    const addressee = rucOf(direction === "received" ? doc.receiver : doc.issuer);
    if (addressee !== entity.ruc.trim()) warnings.push(`El documento está dirigido a otro RUC (${addressee}), no al de la empresa (${entity.ruc})`);

    const [est, point] = doc.number.split("-");
    const timbrados = await db.select({ from: schema.timbrados.validFrom, to: schema.timbrados.validTo }).from(schema.timbrados)
      .where(and(
        eq(schema.timbrados.entityId, entityId),
        eq(schema.timbrados.number, doc.timbrado),
        eq(schema.timbrados.establishment, est),
        eq(schema.timbrados.point, point),
      ));
    if (timbrados.length === 0) warnings.push("Timbrado no registrado: no se pudo validar su vigencia");
    else if (!timbrados.some((t) => t.from <= doc.issueDate && doc.issueDate <= t.to)) return err("Timbrado fuera de vigencia");

    const counterparty = direction === "received" ? doc.issuer : doc.receiver;
    try {
      // One savepoint: document, partner, lines and audit row persist together or not at all.
      const result = await db.transaction(async (tx) => {
        // Dedupe on the partial unique index; a concurrent identical insert waits here and then gets no row.
        const [created] = await tx.insert(schema.taxDocuments).values({
          entityId,
          direction,
          docType: doc.docType,
          number: doc.number,
          timbrado: doc.timbrado,
          cdc: doc.cdc,
          issueDate: doc.issueDate,
          currencyCode: doc.currency || "PYG",
          condition: doc.condition,
          status: "pending",
          sifenStatus: direction === "received" ? "validated" : "uploaded",
          gravado10: doc.gravado10,
          gravado5: doc.gravado5,
          exento: doc.exento,
          iva10: doc.iva10,
          iva5: doc.iva5,
          total: doc.total,
          isElectronic: true,
          docCode: docCodeFromType(doc.docType, direction),
          counterpartyIdType: counterparty.ruc ? (counterparty.dv === null ? 12 : 11) : null,
          imputaIva: doc.iva10 + doc.iva5 > 0,
          metadata: { sifen: doc },
        }).onConflictDoNothing({
          target: [schema.taxDocuments.entityId, schema.taxDocuments.cdc],
          where: sql`cdc IS NOT NULL`,
        }).returning({ id: schema.taxDocuments.id });

        if (!created) {
          const [existing] = await tx.select({ id: schema.taxDocuments.id }).from(schema.taxDocuments)
            .where(and(eq(schema.taxDocuments.entityId, entityId), eq(schema.taxDocuments.cdc, doc.cdc)));
          return { documentId: existing.id, duplicate: true, warnings: [] };
        }

        return audited(
          tx,
          {
            entityId,
            action: "tax_document.ingested",
            targetType: "tax_document",
            targetId: created.id,
            after: { cdc: doc.cdc, number: doc.number, total: doc.total },
          },
          async () => {
            if (counterparty.ruc) {
              // Task 10 convention: ruc WITHOUT DV, dv_ruc separate. ON CONFLICT keeps concurrent ingests from failing.
              const [inserted] = await tx.insert(schema.partners).values({
                entityId,
                kind: direction === "received" ? "supplier" : "customer",
                ruc: counterparty.ruc,
                dvRuc: counterparty.dv === null ? null : String(counterparty.dv),
                legalName: counterparty.name || counterparty.ruc,
                country: "PRY",
              }).onConflictDoNothing({ target: [schema.partners.entityId, schema.partners.ruc] }).returning({ id: schema.partners.id });
              const partnerId = inserted?.id ?? (await tx.select({ id: schema.partners.id }).from(schema.partners)
                .where(and(eq(schema.partners.entityId, entityId), eq(schema.partners.ruc, counterparty.ruc))))[0].id;
              await tx.update(schema.taxDocuments).set({ partnerId }).where(eq(schema.taxDocuments.id, created.id));
            }
            if (doc.lines.length > 0) {
              await tx.insert(schema.taxDocumentLines).values(doc.lines.map((l) => ({
                documentId: created.id,
                itemCode: l.code || null,
                description: l.description || null,
                quantity: String(l.quantity),
                unitPrice: l.unitPrice,
                ivaRate: l.ivaRate,
                amount: l.amount,
              })));
            }
            return { documentId: created.id, duplicate: false, warnings };
          },
        );
      });
      return ok(result);
    } catch (e) {
      return err(dbErrorMessage(e));
    }
  });
}
