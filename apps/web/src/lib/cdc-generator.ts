/**
 * CDC Generator — Código de Control 44 dígitos (SIFEN Paraguay)
 *
 * Generates the 44-digit CDC required for electronic invoices.
 * Algorithm based on DNIT specification (Anexo B).
 *
 * CDC structure: dRUCEmis(8) + dDVEmi(1) + dTipoDoc(2) + dEstab(3) +
 *                dPuntoExp(3) + dNroDoc(7) + dCodCons(2) + dCodSeg(1) +
 *                dFecProc(10) + dDigVal(1) + dCodCon(6) = 44
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

  // Calculate verification digit (module 11)
  const dv = calculateModule11(concatenado);

  // Build final CDC: first 38 + dv + 6-digit random code
  const cdc = concatenado + String(dv) + codCon;

  return cdc;
}

function calculateModule11(value: string): number {
  const weights = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5, 6];
  let sum = 0;
  let w = 0;

  for (let i = value.length - 1; i >= 0; i--) {
    sum += parseInt(value[i], 10) * weights[w % weights.length];
    w++;
  }

  const remainder = sum % 11;
  if (remainder === 0) return 0;
  if (remainder === 1) return 1;
  return 11 - remainder;
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

  // Body = first 37 chars (8+1+2+3+3+7+2+1+10), DV = pos 37, Security = pos 38-43
  const body = cdc.substring(0, 37);
  const dv = cdc.substring(37, 38);
  const calculatedDV = String(calculateModule11(body));

  if (dv !== calculatedDV) {
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
