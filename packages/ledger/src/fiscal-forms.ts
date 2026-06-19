/**
 * Fiscal Forms — Formularios SET Paraguay (104, 500, 120)
 *
 * Calculates tax declaration values from tax document data.
 * Forms 104 (IVA mensual), 500 (IVA detallado), 120 (IRE).
 */

import { IVA_RATES, IRE_RATES } from "./fiscal-py";

// ─── Common Types ─────────────────────────────────────────────────────────

export interface PeriodTaxData {
  /** Sum of all issued invoices (sales) */
  issuedGravado10: number;
  issuedGravado5: number;
  issuedExento: number;
  issuedIva10: number;
  issuedIva5: number;
  issuedTotal: number;

  /** Sum of all received invoices (purchases) — positive values */
  receivedGravado10: number;
  receivedGravado5: number;
  receivedExento: number;
  receivedIva10: number;
  receivedIva5: number;
  receivedTotal: number;

  /** Credit notes (negative adjustments) */
  creditNotesGravado10: number;
  creditNotesGravado5: number;
  creditNotesIva10: number;
  creditNotesIva5: number;

  /** Debit notes (positive adjustments) */
  debitNotesGravado10: number;
  debitNotesGravado5: number;
  debitNotesIva10: number;
  debitNotesIva5: number;

  /** Retentions suffered (retenciones sufridas) */
  retentionsSuffered: {
    iva: number;
    ire: number;
    irp: number;
  };

  /** Previous period credit balance */
  creditBalancePrevious: number;

  /** Tax regime */
  regime: "general" | "simple" | "resimple";
}

// ─── Form 104 — IVA Mensual ──────────────────────────────────────────────

export interface Form104 {
  /** IVA Débito — VAT on sales */
  debitoIva10: number;
  debitoIva5: number;
  totalDebito: number;

  /** IVA Crédito — VAT on purchases */
  creditoIva10: number;
  creditoIva5: number;
  totalCredito: number;

  /** Adjustments */
  ajustesDebito: number;
  ajustesCredito: number;

  /** Result */
  vaPagar: number;
  ivaFavor: number;

  /** Retentions */
  retencionesSufridas: number;
  saldoAPagar: number;
  saldoAFavor: number;

  /** Metadata */
  periodYear: number;
  periodMonth: number;
}

export function calculateForm104(
  data: PeriodTaxData,
  year: number,
  month: number
): Form104 {
  // IVA Débito = issued (sales) IVA
  const debitoIva10 = data.issuedIva10;
  const debitoIva5 = data.issuedIva5;

  // IVA Crédito = received (purchases) IVA
  const creditoIva10 = data.receivedIva10;
  const creditoIva5 = data.receivedIva5;

  // Ajustes: credit notes reduce, debit notes increase
  const ajustesDebito =
    data.debitNotesIva10 + data.debitNotesIva5;
  const ajustesCredito =
    data.creditNotesIva10 + data.creditNotesIva5;

  const totalDebito = round(debitoIva10 + debitoIva5 + ajustesDebito);
  const totalCredito = round(creditoIva10 + creditoIva5 + ajustesCredito);

  const resultado = round(totalDebito - totalCredito);

  const vaPagar = resultado > 0 ? resultado : 0;
  const ivaFavor = resultado < 0 ? Math.abs(resultado) : 0;

  // Apply retentions suffered to reduce payment
  const retencionesSufridas = data.retentionsSuffered.iva;
  const saldoAPagar = round(Math.max(0, vaPagar - retencionesSufridas));
  const saldoAFavor = round(ivaFavor);

  return {
    debitoIva10,
    debitoIva5,
    totalDebito,
    creditoIva10,
    creditoIva5,
    totalCredito,
    ajustesDebito,
    ajustesCredito,
    vaPagar,
    ivaFavor,
    retencionesSufridas,
    saldoAPagar,
    saldoAFavor,
    periodYear: year,
    periodMonth: month,
  };
}

// ─── Form 500 — IVA Detallado ─────────────────────────────────────────────

export interface Form500 {
  /** Section 1: Ventas (Sales) */
  ventasGravadas10: number;
  ventasGravadas5: number;
  ventasExentas: number;
  ventasExportacion: number;
  totalVentas: number;
  debitoFiscal10: number;
  debitoFiscal5: number;
  totalDebitoFiscal: number;

  /** Section 2: Compras (Purchases) */
  comprasGravadas10: number;
  comprasGravadas5: number;
  comprasExentas: number;
  comprasImportacion: number;
  totalCompras: number;
  creditoFiscal10: number;
  creditoFiscal5: number;
  totalCreditoFiscal: number;

  /** Section 3: Ajustes */
  ajustesDebito: number;
  ajustesCredito: number;
  remanentePeriodoAnterior: number;

  /** Section 4: Resultado */
  saldoAPagar: number;
  saldoAFavor: number;
  retencionesSufridas: number;
  netoAPagar: number;

  /** Metadata */
  periodYear: number;
  periodMonth: number;
}

export function calculateForm500(
  data: PeriodTaxData,
  year: number,
  month: number
): Form500 {
  // Section 1: Sales breakdown
  const ventasGravadas10 = data.issuedGravado10;
  const ventasGravadas5 = data.issuedGravado5;
  const ventasExentas = data.issuedExento;
  const totalVentas = round(
    data.issuedGravado10 + data.issuedGravado5 + data.issuedExento
  );

  const debitoFiscal10 = data.issuedIva10;
  const debitoFiscal5 = data.issuedIva5;

  // Section 2: Purchases breakdown
  const comprasGravadas10 = data.receivedGravado10;
  const comprasGravadas5 = data.receivedGravado5;
  const comprasExentas = data.receivedExento;
  const totalCompras = round(
    data.receivedGravado10 + data.receivedGravado5 + data.receivedExento
  );

  const creditoFiscal10 = data.receivedIva10;
  const creditoFiscal5 = data.receivedIva5;

  // Section 3: Adjustments
  const ajustesDebito =
    data.debitNotesIva10 + data.debitNotesIva5;
  const ajustesCredito =
    data.creditNotesIva10 + data.creditNotesIva5;

  // Section 4: Result
  const totalDebito = round(
    debitoFiscal10 + debitoFiscal5 + ajustesDebito
  );
  const totalCredito = round(
    creditoFiscal10 + creditoFiscal5 + ajustesCredito
  );

  const resultado = round(totalDebito - totalCredito);
  const saldoAPagar = resultado > 0 ? resultado : 0;
  const saldoAFavor = resultado < 0 ? Math.abs(resultado) : 0;
  const netoAPagar = round(
    Math.max(0, saldoAPagar - data.retentionsSuffered.iva)
  );

  return {
    ventasGravadas10,
    ventasGravadas5,
    ventasExentas,
    ventasExportacion: 0,
    totalVentas,
    debitoFiscal10,
    debitoFiscal5,
    totalDebitoFiscal: round(debitoFiscal10 + debitoFiscal5 + ajustesDebito),
    comprasGravadas10,
    comprasGravadas5,
    comprasExentas,
    comprasImportacion: 0,
    totalCompras,
    creditoFiscal10,
    creditoFiscal5,
    totalCreditoFiscal: round(creditoFiscal10 + creditoFiscal5),
    ajustesDebito,
    ajustesCredito,
    remanentePeriodoAnterior: data.creditBalancePrevious,
    saldoAPagar,
    saldoAFavor,
    retencionesSufridas: data.retentionsSuffered.iva,
    netoAPagar,
    periodYear: year,
    periodMonth: month,
  };
}

// ─── Form 120 — IRE (Renta Empresarial) ───────────────────────────────────

export interface Form120 {
  /** Ingresos */
  ingresosBrutos: number;
  ingresosExentos: number;
  totalIngresos: number;

  /** Egresos */
  costos: number;
  gastosAdministrativos: number;
  gastosVentas: number;
  gastosFinancieros: number;
  gastosExtraordinarios: number;
  totalEgresos: number;

  /** Resultado */
  rentaNeta: number;
  compensacionPerdidas: number;
  rentaImponible: number;

  /** Tasa */
  regimen: string;
  tasa: number;
  impuestoDeterminado: number;

  /** Pagos a cuenta */
  retencionesSufridas: number;
  anticipos: number;
  saldoAPagar: number;
  saldoAFavor: number;

  /** Metadata */
  periodYear: number;
  periodMonth: number;
}

export function calculateForm120(
  data: PeriodTaxData,
  ingresos: number,
  costos: number,
  gastos: number,
  compensacionPerdidas: number,
  anticipos: number,
  year: number,
  month: number
): Form120 {
  const totalIngresos = round(ingresos + data.issuedExento);
  const totalEgresos = round(costos + gastos);
  const rentaNeta = round(Math.max(0, totalIngresos - totalEgresos));
  const rentaImponible = round(Math.max(0, rentaNeta - compensacionPerdidas));

  const tasa = IRE_RATES[data.regime];
  const impuestoDeterminado = round(rentaImponible * tasa);

  const retencionesSufridas = data.retentionsSuffered.ire;
  const totalPagosCuenta = round(retencionesSufridas + anticipos);
  const saldo = round(impuestoDeterminado - totalPagosCuenta);

  return {
    ingresosBrutos: ingresos,
    ingresosExentos: data.issuedExento,
    totalIngresos,
    costos,
    gastosAdministrativos: round(gastos * 0.4),
    gastosVentas: round(gastos * 0.3),
    gastosFinancieros: round(gastos * 0.2),
    gastosExtraordinarios: round(gastos * 0.1),
    totalEgresos,
    rentaNeta,
    compensacionPerdidas,
    rentaImponible,
    regimen: data.regime,
    tasa,
    impuestoDeterminado,
    retencionesSufridas,
    anticipos,
    saldoAPagar: saldo > 0 ? saldo : 0,
    saldoAFavor: saldo < 0 ? Math.abs(saldo) : 0,
    periodYear: year,
    periodMonth: month,
  };
}

// ─── Build PeriodTaxData from tax documents ───────────────────────────────

export interface TaxDocRow {
  direction: string;
  docType: string;
  gravado10: string | null;
  gravado5: string | null;
  exento: string | null;
  iva10: string | null;
  iva5: string | null;
  total: string | null;
}

export function buildPeriodTaxData(
  docs: TaxDocRow[]
): PeriodTaxData {
  const data: PeriodTaxData = {
    issuedGravado10: 0,
    issuedGravado5: 0,
    issuedExento: 0,
    issuedIva10: 0,
    issuedIva5: 0,
    issuedTotal: 0,
    receivedGravado10: 0,
    receivedGravado5: 0,
    receivedExento: 0,
    receivedIva10: 0,
    receivedIva5: 0,
    receivedTotal: 0,
    creditNotesGravado10: 0,
    creditNotesGravado5: 0,
    creditNotesIva10: 0,
    creditNotesIva5: 0,
    debitNotesGravado10: 0,
    debitNotesGravado5: 0,
    debitNotesIva10: 0,
    debitNotesIva5: 0,
    retentionsSuffered: { iva: 0, ire: 0, irp: 0 },
    creditBalancePrevious: 0,
    regime: "general",
  };

  for (const doc of docs) {
    const g10 = parseFloat(doc.gravado10 ?? "0") || 0;
    const g5 = parseFloat(doc.gravado5 ?? "0") || 0;
    const exe = parseFloat(doc.exento ?? "0") || 0;
    const i10 = parseFloat(doc.iva10 ?? "0") || 0;
    const i5 = parseFloat(doc.iva5 ?? "0") || 0;
    const tot = parseFloat(doc.total ?? "0") || 0;
    const isCreditNote = doc.docType === "credit_note";
    const isDebitNote = doc.docType === "debit_note";

    if (doc.direction === "issued") {
      if (isCreditNote) {
        data.creditNotesGravado10 += Math.abs(g10);
        data.creditNotesGravado5 += Math.abs(g5);
        data.creditNotesIva10 += Math.abs(i10);
        data.creditNotesIva5 += Math.abs(i5);
      } else if (isDebitNote) {
        data.debitNotesGravado10 += Math.abs(g10);
        data.debitNotesGravado5 += Math.abs(g5);
        data.debitNotesIva10 += Math.abs(i10);
        data.debitNotesIva5 += Math.abs(i5);
      } else {
        data.issuedGravado10 += g10;
        data.issuedGravado5 += g5;
        data.issuedExento += exe;
        data.issuedIva10 += i10;
        data.issuedIva5 += i5;
        data.issuedTotal += tot;
      }
    } else {
      // received
      if (isCreditNote) {
        data.creditNotesGravado10 += Math.abs(g10);
        data.creditNotesGravado5 += Math.abs(g5);
        data.creditNotesIva10 += Math.abs(i10);
        data.creditNotesIva5 += Math.abs(i5);
      } else if (isDebitNote) {
        data.debitNotesGravado10 += Math.abs(g10);
        data.debitNotesGravado5 += Math.abs(g5);
        data.debitNotesIva10 += Math.abs(i10);
        data.debitNotesIva5 += Math.abs(i5);
      } else {
        data.receivedGravado10 += g10;
        data.receivedGravado5 += g5;
        data.receivedExento += exe;
        data.receivedIva10 += i10;
        data.receivedIva5 += i5;
        data.receivedTotal += tot;
      }
    }
  }

  return data;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
