"use server";

import { eq, and, sql, gte, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  taxDocuments, partners, entities, journalEntries, journalLines, accounts, retenciones,
} from "@/lib/db/schema";

export type ActionResult<T = void> =
  | { ok: true;  data: T }
  | { ok: false; error: string };

// ─── Liquidación de IVA (Formulario 120) ──────────────────────────────────────

export interface LiquidacionIVA {
  periodo: string;
  entityName: string;
  ruc: string;
  ventas: {
    gravado10: number;
    gravado5: number;
    exento: number;
    ivaDebito10: number;
    ivaDebito5: number;
    totalIvaDebito: number;
  };
  compras: {
    gravado10: number;
    gravado5: number;
    exento: number;
    ivaCredito10: number;
    ivaCredito5: number;
    totalIvaCredito: number;
  };
  retencionesRecibidas: number;
  saldoAFavorAnterior: number;
  coeficienteProrrateo: number;
  ivaCreditoComputable: number;
  ivaCreditoNoComputable: number;
  vencimientoFecha: string;
  presentacionTardia: boolean;
  multaContravencion: number;
  recargoMora: number;
  totalAPagar: number;
  saldoAFavor: number;
}

export async function loadLiquidacionIVA(
  entityId: string,
  year: number,
  month: number
): Promise<ActionResult<LiquidacionIVA>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };

  try {
    const db = getDb();
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    // Get entity
    const [entity] = await db
      .select({ legalName: entities.legalName, ruc: entities.ruc })
      .from(entities)
      .where(eq(entities.id, entityId))
      .limit(1);
    if (!entity) return { ok: false, error: "Empresa no encontrada" };

    // Query posted tax documents for the month
    const docs = await db
      .select()
      .from(taxDocuments)
      .where(
        and(
          eq(taxDocuments.entityId, entityId),
          eq(taxDocuments.status, "posted"),
          gte(taxDocuments.issueDate, from),
          lte(taxDocuments.issueDate, to)
        )
      );

    const sales = docs.filter((d) => d.direction === "issued");
    const purchases = docs.filter((d) => d.direction === "received");

    const sum = (arr: typeof docs, field: keyof typeof docs[0]) =>
      arr.reduce((acc, doc) => acc + Number(doc[field] ?? 0), 0);

    const ventas = {
      gravado10: sum(sales, "gravado10"),
      gravado5: sum(sales, "gravado5"),
      exento: sum(sales, "exento"),
      ivaDebito10: sum(sales, "iva10"),
      ivaDebito5: sum(sales, "iva5"),
      totalIvaDebito: sum(sales, "iva10") + sum(sales, "iva5"),
    };

    const compras = {
      gravado10: sum(purchases, "gravado10"),
      gravado5: sum(purchases, "gravado5"),
      exento: sum(purchases, "exento"),
      ivaCredito10: sum(purchases, "iva10"),
      ivaCredito5: sum(purchases, "iva5"),
      totalIvaCredito: sum(purchases, "iva10") + sum(purchases, "iva5"),
    };

    // 1. Prorrateo (Proration of common fiscal credit)
    const totalVentas = ventas.gravado10 + ventas.gravado5 + ventas.exento;
    const coeficienteProrrateo = totalVentas > 0 
      ? (ventas.gravado10 + ventas.gravado5) / totalVentas 
      : 1;

    const ivaCreditoComputable = compras.totalIvaCredito * coeficienteProrrateo;
    const ivaCreditoNoComputable = compras.totalIvaCredito * (1 - coeficienteProrrateo);

    // Retenciones recibidas
    const [retSum] = await db
      .select({ sum: sql<string>`SUM(monto_retencion::numeric)` })
      .from(retenciones)
      .where(
        and(
          eq(retenciones.entityId, entityId),
          eq(retenciones.periodoYear, year),
          eq(retenciones.periodoMonth, month)
        )
      );
    const retencionesRecibidas = Number(retSum?.sum ?? 0);

    // Initial tax calculation
    const saldoIva = ventas.totalIvaDebito - ivaCreditoComputable - retencionesRecibidas;

    // 2. Calendario de Vencimiento (DNIT Calendar)
    // Extract last digit of RUC before hyphen
    const cleanRuc = entity.ruc.split("-")[0];
    const lastDigit = parseInt(cleanRuc.substring(cleanRuc.length - 1)) || 0;
    
    // Day of month due: Digit 0 = day 7, Digit 1 = day 9, etc.
    const dueDay = 7 + lastDigit * 2;
    
    // Due date is in month M+1 (e.g. May taxes due in June)
    // In JS new Date: month 5 is June (since January is 0)
    const vencimiento = new Date(year, month, dueDay, 23, 59, 59);
    const today = new Date();
    
    const presentacionTardia = today > vencimiento;
    const multaContravencion = presentacionTardia ? 50000 : 0;
    
    let recargoMora = 0;
    if (presentacionTardia && saldoIva > 0) {
      // Calculate monthly interest (e.g., approx 1.5% per month or part of month of delay)
      const diffMs = today.getTime() - vencimiento.getTime();
      const diffMonths = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
      recargoMora = Math.round(saldoIva * 0.015 * diffMonths);
    }

    const totalAPagar = saldoIva > 0 ? (saldoIva + multaContravencion + recargoMora) : 0;
    const saldoAFavor = saldoIva < 0 ? Math.abs(saldoIva) : 0;

    const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return {
      ok: true,
      data: {
        periodo: `${MESES[month - 1]} ${year}`,
        entityName: entity.legalName,
        ruc: entity.ruc,
        ventas,
        compras,
        retencionesRecibidas,
        saldoAFavorAnterior: 0,
        coeficienteProrrateo,
        ivaCreditoComputable,
        ivaCreditoNoComputable,
        vencimientoFecha: vencimiento.toLocaleDateString("es-PY"),
        presentacionTardia,
        multaContravencion,
        recargoMora,
        totalAPagar,
        saldoAFavor,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error calculando IVA" };
  }
}

// ─── Liquidación de IRE (Formulario 500) ──────────────────────────────────────

export interface LiquidacionIRE {
  periodo: string;
  entityName: string;
  ruc: string;
  regimen: string;
  ingresosBrutos: number;
  costos: number;
  gastosOperativos: number;
  gastosFinancieros: number;
  utilidadAntesIRE: number;
  ajustes: {
    mas: number; // Gastos no deducibles
    menos: number; // Rentas exentas
  };
  baseImponible: number;
  tasa: number;
  ireDeterminado: number;
  anticipos: number;
  retencionesSufridas: number;
  saldoAPagar: number;
}

export async function loadLiquidacionIRE(
  entityId: string,
  year: number
): Promise<ActionResult<LiquidacionIRE>> {
  if (!entityId) return { ok: false, error: "Seleccioná una empresa" };

  try {
    const db = getDb();
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31, 23, 59, 59);

    const [entity] = await db
      .select({ legalName: entities.legalName, ruc: entities.ruc })
      .from(entities)
      .where(eq(entities.id, entityId))
      .limit(1);
    if (!entity) return { ok: false, error: "Empresa no encontrada" };

    // Fetch account balances for the entire year
    const rows = await db
      .select({
        accountId: journalLines.accountId,
        nature: accounts.nature,
        code: accounts.code,
        name: accounts.name,
        nonDeductible: accounts.nonDeductibleIre,
        totalDebit: sql<string>`SUM(${journalLines.debit}::numeric)`,
        totalCredit: sql<string>`SUM(${journalLines.credit}::numeric)`,
      })
      .from(journalLines)
      .innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id))
      .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
      .where(
        and(
          eq(journalEntries.entityId, entityId),
          eq(journalEntries.status, "posted"),
          gte(journalEntries.date, from),
          lte(journalEntries.date, to)
        )
      )
      .groupBy(journalLines.accountId, accounts.nature, accounts.code, accounts.name, accounts.nonDeductibleIre);

    let ingresosBrutos = 0;
    let costos = 0;
    let gastosOperativos = 0;
    let gastosFinancieros = 0;
    let ajustesMas = 0; // Gastos no deducibles

    rows.forEach((r) => {
      const debit = parseFloat(r.totalDebit ?? "0");
      const credit = parseFloat(r.totalCredit ?? "0");
      const balance = credit - debit; // normal credit balance for incomes
      const debitBalance = debit - credit; // normal debit balance for expenses

      const code = r.code;
      const name = r.name.toLowerCase();

      if (r.nature === "income") {
        ingresosBrutos += balance;
      } else if (r.nature === "expense") {
        // Classify expenses
        if (code.startsWith("5.1") || name.includes("costo") || name.includes("mercaderia")) {
          costos += debitBalance;
        } else if (name.includes("financier") || name.includes("intere") || name.includes("comision")) {
          gastosFinancieros += debitBalance;
        } else {
          gastosOperativos += debitBalance;
        }

        // Check if account is flagged as non-deductible for IRE
        if (r.nonDeductible) {
          ajustesMas += debitBalance;
        }
      }
    });

    const utilidadAntesIRE = ingresosBrutos - costos - gastosOperativos - gastosFinancieros;
    const baseImponible = Math.max(0, utilidadAntesIRE + ajustesMas);
    const tasa = 0.10; // 10% IRE General en Paraguay
    const ireDeterminado = baseImponible * tasa;

    // Anticipos / Retenciones Sufridas de renta
    const [retSum] = await db
      .select({ sum: sql<string>`SUM(monto_retencion::numeric)` })
      .from(retenciones)
      .where(
        and(
          eq(retenciones.entityId, entityId),
          eq(retenciones.periodoYear, year),
          eq(retenciones.tipoRetencion, "ire")
        )
      );
    const retencionesSufridas = Number(retSum?.sum ?? 0);
    const anticipos = 0; // Se podría guardar en base de datos si existiera tabla de anticipos

    const saldoAPagar = Math.max(0, ireDeterminado - anticipos - retencionesSufridas);

    return {
      ok: true,
      data: {
        periodo: `Ejercicio Fiscal ${year}`,
        entityName: entity.legalName,
        ruc: entity.ruc,
        regimen: "General",
        ingresosBrutos,
        costos,
        gastosOperativos,
        gastosFinancieros,
        utilidadAntesIRE,
        ajustes: {
          mas: ajustesMas,
          menos: 0,
        },
        baseImponible,
        tasa,
        ireDeterminado,
        anticipos,
        retencionesSufridas,
        saldoAPagar,
      },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error calculando IRE" };
  }
}

// ─── Importador de planillas de Marangatú (CSV) ─────────────────────────────────

export async function importMarangatuCsv(
  entityId: string,
  csvContent: string,
  tipo: "compras" | "ventas" | "retenciones"
): Promise<ActionResult<{ importedCount: number; duplicateCount: number }>> {
  if (!entityId) return { ok: false, error: "entityId requerido" };

  try {
    const db = getDb();
    const lines = csvContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return { ok: false, error: "El archivo no contiene registros" };

    // Find first active chart of accounts of the entity to link accounts
    const [coa] = await db.select().from(entities).innerJoin(accounts, eq(accounts.id, entities.id)).where(eq(entities.id, entityId)).limit(1); // fallback check
    
    // We will parse the lines
    let importedCount = 0;
    let duplicateCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(";");
      if (parts.length < 8) continue; // Skip invalid lines

      if (tipo === "compras" || tipo === "ventas") {
        // Format: TIPO_REGISTRO;FECHA;TIMBRADO;NUMERO;RUC;NOMBRE;GRAVADO_10;GRAVADO_5;EXENTO;IVA_10;IVA_5;TOTAL;CDC
        const regType = parts[0]; // C or V
        const rawDate = parts[1]; // YYYYMMDD
        const timbrado = parts[2];
        const numero = parts[3];
        const ruc = parts[4];
        const nombre = parts[5]?.replace(/"/g, "") ?? "";
        const gravado10 = parseFloat(parts[6] ?? "0") || 0;
        const gravado5 = parseFloat(parts[7] ?? "0") || 0;
        const exento = parseFloat(parts[8] ?? "0") || 0;
        const iva10 = parseFloat(parts[9] ?? "0") || 0;
        const iva5 = parseFloat(parts[10] ?? "0") || 0;
        const total = parseFloat(parts[11] ?? "0") || 0;
        const cdc = parts[12] || null;

        // Parse date
        if (!rawDate || rawDate.length !== 8) continue;
        const dateObj = new Date(
          parseInt(rawDate.substring(0, 4)),
          parseInt(rawDate.substring(4, 6)) - 1,
          parseInt(rawDate.substring(6, 8))
        );

        // Check duplicates
        const existing = await db
          .select()
          .from(taxDocuments)
          .where(
            and(
              eq(taxDocuments.entityId, entityId),
              eq(taxDocuments.docNumber, numero),
              eq(taxDocuments.timbrado, timbrado)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          duplicateCount++;
          continue;
        }

        // Insert Partner (Proveedor/Cliente)
        let [partner] = await db
          .select()
          .from(partners)
          .where(and(eq(partners.entityId, entityId), eq(partners.ruc, ruc)))
          .limit(1);

        if (!partner) {
          [partner] = await db
            .insert(partners)
            .values({
              entityId,
              ruc,
              legalName: nombre,
              kind: tipo === "compras" ? "supplier" : "customer",
            })
            .returning();
        }

        // Insert Tax Document
        await db.insert(taxDocuments).values({
          entityId,
          direction: tipo === "compras" ? "received" : "issued",
          condition: "cash",
          docNumber: numero,
          timbrado,
          cdc,
          issueDate: dateObj,
          issuerRuc: tipo === "compras" ? ruc : "80012345-1", // mock entity ruc for sales
          issuerName: tipo === "compras" ? nombre : "Nuestra Empresa",
          receiverRuc: tipo === "compras" ? "80012345-1" : ruc,
          receiverName: tipo === "compras" ? "Nuestra Empresa" : nombre,
          gravado10: String(gravado10),
          gravado5: String(gravado5),
          exento: String(exento),
          iva10: String(iva10),
          iva5: String(iva5),
          total: String(total),
          status: "posted", // directly posted
          partnerId: partner.id,
        });

        importedCount++;
      } else if (tipo === "retenciones") {
        // Reporte de Retenciones Recibidas
        // FECHA;TIMBRADO;NUMERO;RUC;NOMBRE;MONTO_BASE;TASA;MONTO_RETENCION;COMPROBANTE
        const rawDate = parts[0];
        const ruc = parts[3];
        const nombre = parts[4]?.replace(/"/g, "") ?? "";
        const base = parseFloat(parts[5] ?? "0") || 0;
        const tasa = parseFloat(parts[6] ?? "0") || 0;
        const retencionVal = parseFloat(parts[7] ?? "0") || 0;
        const comprobante = parts[8] || "";

        if (!rawDate) continue;
        const dateObj = new Date(rawDate);

        // Check if already registered
        const existing = await db
          .select()
          .from(retenciones)
          .where(
            and(
              eq(retenciones.entityId, entityId),
              eq(retenciones.comprobanteRet, comprobante)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          duplicateCount++;
          continue;
        }

        await db.insert(retenciones).values({
          entityId,
          periodoYear: dateObj.getFullYear(),
          periodoMonth: dateObj.getMonth() + 1,
          fecha: dateObj,
          terceroRuc: ruc,
          terceroNombre: nombre,
          montoBase: String(base),
          tipoRetencion: "iva",
          tasa: String(tasa),
          montoRetencion: String(retencionVal),
          comprobanteRet: comprobante,
          status: "aprobado",
        });

        importedCount++;
      }
    }

    return { ok: true, data: { importedCount, duplicateCount } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error importando CSV" };
  }
}

// ─── Parser de XML de SIFEN (Comprobante Electrónico) ───────────────────────────

export async function importSifenXml(
  entityId: string,
  xmlContent: string
): Promise<ActionResult<string>> {
  if (!entityId) return { ok: false, error: "entityId requerido" };

  try {
    const db = getDb();

    // Regex extraction to avoid external XML library issues
    const extractTag = (tag: string) => {
      const match = xmlContent.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
      return match ? match[1].trim() : null;
    };

    const cdc = extractTag("dCDC");
    const numDoc = extractTag("dNumDoc");
    const timbrado = extractTag("dNumTim");
    const rucEm = extractTag("dRucEm");
    const nomEmi = extractTag("dNomEmi");
    const totalGral = extractTag("dTotGralOpe") || extractTag("dTotOpe") || "0";
    const dateStr = extractTag("dFeEmiDE");

    if (!cdc || !numDoc || !rucEm) {
      return { ok: false, error: "El archivo XML no es un documento SIFEN válido o le faltan campos obligatorios." };
    }

    const issueDate = dateStr ? new Date(dateStr) : new Date();
    const total = parseFloat(totalGral);

    // Default calculations for standard 10% tax in SIFEN invoices
    const gravado10 = Math.round(total / 1.1);
    const iva10 = total - gravado10;

    // Check duplicates
    const [existing] = await db
      .select()
      .from(taxDocuments)
      .where(eq(taxDocuments.cdc, cdc))
      .limit(1);

    if (existing) {
      return { ok: false, error: `El documento con CDC ${cdc} ya se encuentra registrado.` };
    }

    // Insert Partner
    let [partner] = await db
      .select()
      .from(partners)
      .where(and(eq(partners.entityId, entityId), eq(partners.ruc, rucEm)))
      .limit(1);

    if (!partner) {
      [partner] = await db
        .insert(partners)
        .values({
          entityId,
          ruc: rucEm,
          legalName: nomEmi ?? "Proveedor Electrónico",
          kind: "supplier",
        })
        .returning();
    }

    // Insert Tax Document
    await db.insert(taxDocuments).values({
      entityId,
      direction: "received",
      condition: "credit",
      docNumber: numDoc,
      timbrado: timbrado ?? "12345678",
      cdc,
      issueDate,
      issuerRuc: rucEm,
      issuerName: nomEmi ?? "Proveedor SIFEN",
      receiverRuc: "80012345-1",
      receiverName: "Nuestra Empresa",
      gravado10: String(gravado10),
      gravado5: "0",
      exento: "0",
      iva10: String(iva10),
      iva5: "0",
      total: String(total),
      status: "posted",
      partnerId: partner.id,
      sourceFilename: "sifen_import.xml",
      sourceXml: xmlContent,
    });

    return { ok: true, data: `Factura Electrónica ${numDoc} de ${nomEmi} importada y asentada con éxito.` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error al procesar XML" };
  }
}

export async function loadEntidadesParaFiscal(): Promise<ActionResult<Array<{ id: string; legalName: string; ruc: string }>>> {
  try {
    const db = getDb();
    const rows = await db
      .select({ id: entities.id, legalName: entities.legalName, ruc: entities.ruc })
      .from(entities)
      .where(eq(entities.status, "active"))
      .orderBy(entities.legalName);
    return { ok: true, data: rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Error" };
  }
}

