/**
 * Form 104 (IVA monthly return) summary, derived from the Libro IVA totals of both sides.
 *
 * shortcut: not modeled yet: carry-over of the previous month's credit ("saldo a favor anterior"),
 * retentions suffered, and the official casilla numbering of the DNIT 104/106 form. `saldo` is the
 * plain debit minus credit of the month.
 */
export type IvaTotals = { gravado10: number; gravado5: number; exento: number; iva10: number; iva5: number; total: number };
export type Form104Totals = IvaTotals & { base10: number; base5: number };

const withBases = (t: IvaTotals): Form104Totals => ({
  ...t,
  // The Libro stores IVA-included gross; the 104 reports net bases.
  base10: t.gravado10 - t.iva10,
  base5: t.gravado5 - t.iva5,
});

/** Inputs are the SIGNED Libro IVA totals (credit notes already subtract). saldo > 0 = IVA a pagar, < 0 = saldo a favor. */
export function buildForm104(ventas: IvaTotals, compras: IvaTotals) {
  const debitoFiscal = ventas.iva10 + ventas.iva5;
  const creditoFiscal = compras.iva10 + compras.iva5;
  return { ventas: withBases(ventas), compras: withBases(compras), debitoFiscal, creditoFiscal, saldo: debitoFiscal - creditoFiscal };
}
