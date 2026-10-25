import { err, ok, type Result } from "@intelicont/core";
import { and, eq, sql } from "drizzle-orm";
import { audited } from "../../db/audit";
import { tenantDb, isMockMode } from "../../db/index";
import * as schema from "../../db/schema";
import { docCodeFromType } from "../registro-codes";
import type { MarangatuDocumentoRaw } from "../marangatu-rea";

export interface SyncMarangatuResult {
  total: number;
  compras: number;
  ventas: number;
  duplicados: number;
  nuevos: number;
  cdcsValidados: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Procesa e inserta comprobantes obtenidos vía REA (Marangatú) en `tax_documents`.
 * Es idempotente: documentos con el mismo CDC o (timbrado, número, entidad) no se duplican.
 */
export async function syncMarangatuDocuments(
  entityId: string,
  documents: MarangatuDocumentoRaw[],
  explicitDb?: Db,
): Promise<Result<SyncMarangatuResult, string>> {
  if (!UUID.test(entityId)) return err("Empresa no encontrada");

  const runWithDb = async (db: Db): Promise<Result<SyncMarangatuResult, string>> => {
    const [entity] = await db
      .select({ id: schema.entities.id, ruc: schema.entities.ruc })
      .from(schema.entities)
      .where(eq(schema.entities.id, entityId));

    if (!entity) return err("Empresa no encontrada");

    let compras = 0;
    let ventas = 0;
    let duplicados = 0;
    let nuevos = 0;
    let cdcsValidados = 0;

    for (const doc of documents) {
      const direction: "received" | "issued" = doc.tipo === "compra" ? "received" : "issued";
      if (direction === "received") compras++;
      else ventas++;

      if (doc.cdc) cdcsValidados++;

      // Extraer ruc base y dv
      const [rucBase, rucDv] = doc.rucContraparte.split("-");
      const cleanRuc = rucBase?.trim() || "";
      const dv = rucDv?.trim() || null;

      try {
        const [inserted] = await db
          .insert(schema.taxDocuments)
          .values({
            entityId,
            direction,
            docType: "invoice",
            number: doc.numero,
            timbrado: doc.timbrado,
            cdc: doc.cdc || null,
            issueDate: doc.fecha,
            currencyCode: "PYG",
            condition: doc.condicion === "credito" ? "credit" : "cash",
            status: "pending",
            sifenStatus: doc.cdc ? "validated" : "none",
            gravado10: doc.gravada10,
            gravado5: doc.gravada5,
            exento: doc.exenta,
            iva10: doc.iva10,
            iva5: doc.iva5,
            total: doc.total,
            isElectronic: Boolean(doc.cdc),
            docCode: docCodeFromType("invoice", direction),
            counterpartyIdType: cleanRuc ? 11 : null,
            imputaIva: doc.iva10 + doc.iva5 > 0,
            metadata: {
              source: "marangatu_rea",
              nombreContraparte: doc.nombreContraparte,
              rucContraparte: doc.rucContraparte,
            },
          })
          .onConflictDoNothing({
            target: [schema.taxDocuments.entityId, schema.taxDocuments.cdc],
            where: sql`cdc IS NOT NULL`,
          })
          .returning({ id: schema.taxDocuments.id });

        if (!inserted) {
          duplicados++;
          continue;
        }

        nuevos++;

        if (cleanRuc) {
          const [partner] = await db
            .insert(schema.partners)
            .values({
              entityId,
              kind: direction === "received" ? "supplier" : "customer",
              ruc: cleanRuc,
              dvRuc: dv,
              legalName: doc.nombreContraparte || cleanRuc,
              country: "PRY",
            })
            .onConflictDoNothing({ target: [schema.partners.entityId, schema.partners.ruc] })
            .returning({ id: schema.partners.id });

          const partnerId =
            partner?.id ??
            (
              await db
                .select({ id: schema.partners.id })
                .from(schema.partners)
                .where(and(eq(schema.partners.entityId, entityId), eq(schema.partners.ruc, cleanRuc)))
            )[0]?.id;

          if (partnerId) {
            await db
              .update(schema.taxDocuments)
              .set({ partnerId })
              .where(eq(schema.taxDocuments.id, inserted.id));
          }
        }
      } catch {
        duplicados++;
      }
    }

    return ok({
      total: documents.length,
      compras,
      ventas,
      duplicados,
      nuevos,
      cdcsValidados,
    });
  };

  if (explicitDb) return runWithDb(explicitDb);
  return tenantDb(runWithDb);
}
