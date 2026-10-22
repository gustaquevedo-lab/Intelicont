import { mod11Dv } from "@intelicont/ledger/fiscal-py";

/**
 * CDC Generator — Código de Control 44 dígitos (SIFEN Paraguay)
 *
 * Generates the 44-digit CDC required for electronic invoices.
 * Algorithm based on DNIT specification (Anexo B).
 *
 * CDC structure: dRUCEmis(8) + dDVEmi(1) + dTipoDoc(2) + dEstab(3) +
 *                dPuntoExp(3) + dNroDoc(7) + dCodCons(2) + dCodSeg(1) +
 *                dFecProc(10) + dCodCon(6) = 43, then dDigVal(1) = mod 11
 */

export interface CDCInput {
  rucEmisor: string;       // Without DV
  dvEmisor: string;         // Single digit
  tipoDocumento: number;    // 1=Factura, 2=NC, 3=ND, 4=Recibo, 5=AutoFactura
  establecimiento: string;  // 3 digits
  puntoEmision: string;     // 3 digits
  numeroDocumento: string;  // 7 digits, zero-padded
  fechaProcesamiento: string; // YYYY-MM-DD
  codigoSeguridad: string;  // Random 6-digit code
}

/**
 * Generates the full 44-digit CDC for an electronic invoice.
 */
export function generateCDC(input: CDCInput): string {
  // Pad fields
  const tipoDoc = String(input.tipoDocumento).padStart(2, "0");
  const nroDoc = input.numeroDocumento.padStart(7, "0");
  const fecha = input.fechaProcesamiento.replace(/-/g, "");
  // dFecProc requires DDMMYYYYHH (10 digits)
  // From YYYYMMDD → rearrange to DDMMYYYY + "00" (midnight)
  const fecha10 = fecha.length === 8
    ? fecha.substring(6, 8) + fecha.substring(4, 6) + fecha.substring(0, 4) + "00"
    : fecha.padEnd(10, "0");
  const codCon = input.codigoSeguridad.padStart(6, "0");

  // Build first 38 digits
  const concatenado =
    input.rucEmisor +
    input.dvEmisor +
    tipoDoc +
    input.establecimiento +
    input.puntoEmision +
    nroDoc +
    "01" + // dCodCons — control code version
    "1" +  // dCodSeg — security indicator
    fecha10;

  // 43 digits + DV (mod 11 of the first 43) as the 44th digit
  const first43 = concatenado + codCon;
  return first43 + String(mod11Dv(first43));
}

/**
 * Generates a random 6-digit security code.
 */
export function generateSecurityCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Validates a CDC structure.
 */
export function validateCDCStructure(cdc: string): { valid: boolean; error?: string } {
  if (cdc.length !== 44) return { valid: false, error: "CDC debe tener 44 dígitos" };
  if (!/^\d{44}$/.test(cdc)) return { valid: false, error: "CDC debe contener solo dígitos" };

  const calculatedDV = String(mod11Dv(cdc.substring(0, 43)));
  if (cdc[43] !== calculatedDV) {
    return { valid: false, error: `Dígito verificador inválido: esperado ${calculatedDV}` };
  }

  return { valid: true };
}

/**
 * Generates the QR data string for the SIFEN QR code.
 * Format: URL base + CDC + parameters
 */
export function generateQRData(cdc: string, ruc: string, total: number, fecha: string): string {
  const params = new URLSearchParams({
    cdc,
    ruc,
    total: String(total),
    fecha: fecha.replace(/-/g, ""),
  });
  return `https://ekuatia.set.gov.py/consultas/qr?${params.toString()}`;
}

/**
 * Generates a complete invoice data object ready for emission.
 */
export function generateInvoiceData(params: {
  rucEmisor: string;
  dvEmisor: string;
  tipoDocumento: number;
  establecimiento: string;
  puntoEmision: string;
  numeroDocumento: string;
  fecha: string;
}) {
  const securityCode = generateSecurityCode();

  const cdc = generateCDC({
    rucEmisor: params.rucEmisor,
    dvEmisor: params.dvEmisor,
    tipoDocumento: params.tipoDocumento,
    establecimiento: params.establecimiento,
    puntoEmision: params.puntoEmision,
    numeroDocumento: params.numeroDocumento,
    fechaProcesamiento: params.fecha,
    codigoSeguridad: securityCode,
  });

  return {
    cdc,
    numero: `${params.establecimiento}-${params.puntoEmision}-${params.numeroDocumento}`,
    securityCode,
  };
}
