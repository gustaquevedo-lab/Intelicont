// Registro de Comprobantes (DNIT): Tabla 3 (counterparty id types) and Tabla 4 (document codes).
// The SQL CHECKs in migration 0005 are verified against TABLA_4 by documents-schema.test.ts.

export type RegistroSide = "ventas" | "compras";
export type RegistroKind = RegistroSide | "ingresos" | "egresos";

export const TABLA_3 = {
  11: "RUC",
  12: "CÉDULA DE IDENTIDAD",
  13: "PASAPORTE",
  14: "CÉDULA DE IDENTIDAD EXTRANJERO",
  15: "SIN NOMBRE",
  16: "DIPLOMÁTICO",
  17: "IDENTIFICACIÓN TRIBUTARIA",
} as const satisfies Record<number, string>;

const v = (name: string, ...registers: RegistroKind[]) => ({ name, registers });
const VC: RegistroKind[] = ["ventas", "compras"];

export const TABLA_4: Record<number, { name: string; registers: RegistroKind[] }> = {
  101: v("AUTOFACTURA", "compras"),
  102: v("BOLETA DE TRANSPORTE PÚBLICO DE PASAJEROS", ...VC),
  103: v("BOLETA DE VENTA", ...VC),
  104: v("BOLETA RESIMPLE", "compras"),
  105: v("BOLETOS DE LOTERÍAS, JUEGOS DE AZAR", ...VC),
  106: v("BOLETO O TICKET DE TRANSPORTE AÉREO", ...VC),
  107: v("DESPACHO DE IMPORTACIÓN", "compras"),
  108: v("ENTRADA A ESPECTÁCULOS PÚBLICOS", ...VC),
  109: v("FACTURA", ...VC),
  110: v("NOTA DE CRÉDITO", ...VC),
  111: v("NOTA DE DÉBITO", ...VC),
  112: v("TICKET MÁQUINA REGISTRADORA", ...VC),
  201: v("COMPROBANTE DE EGRESOS POR COMPRAS A CRÉDITO", "egresos"),
  202: v("COMPROBANTE DEL EXTERIOR LEGALIZADO", "egresos"),
  203: v("COMPROBANTE DE INGRESO POR VENTAS A CRÉDITO", "ingresos"),
  204: v("COMPROBANTE DE INGRESOS ENTIDADES PÚBLICAS, RELIGIOSAS O DE BENEFICIO PÚBLICO", "egresos"),
  205: v("EXTRACTO DE CUENTA – BILLETAJE ELECTRÓNICO", "egresos"),
  206: v("EXTRACTO DE CUENTA DE IPS", "egresos"),
  207: v("EXTRACTO DE CUENTA TC/TD", "egresos"),
  208: v("LIQUIDACIÓN DE SALARIO", "ingresos", "egresos"),
  209: v("OTROS COMPROBANTES DE EGRESOS", "egresos"),
  210: v("OTROS COMPROBANTES DE INGRESOS", "ingresos"),
  211: v("TRANSFERENCIAS O GIROS BANCARIOS/BOLETA DE DEPÓSITO", "egresos"),
};

export type DocType = "invoice" | "credit_note" | "debit_note" | "self_invoice" | "remito" | "receipt" | "import";

const BY_TYPE: Partial<Record<DocType, number>> = {
  invoice: 109,
  credit_note: 110,
  debit_note: 111,
  self_invoice: 101,
  import: 107,
};

/** Tabla 4 code for an internal document type; null when it has no Registro equivalent (remito, receipt). */
export function docCodeFromType(docType: DocType, _direction: "issued" | "received"): number | null {
  return BY_TYPE[docType] ?? null;
}

export function isSupportedInRegistro(code: number, side: RegistroSide): boolean {
  return TABLA_4[code]?.registers.includes(side) ?? false;
}
