/**
 * RUC Validator — Paraguay
 *
 * DV algorithm: Módulo 11, Base 11 (official SET/DNIT algorithm).
 * Source: https://github.com/claspina/dv-ruc-py
 * Based on PL/SQL function in Digito Verificador.pdf provided by SET.
 */

export interface RucParsed {
  baseNumber: string;
  dv: number;
  fullRuc: string; // with dash, e.g. "80012345-6"
}

export interface RucValidationResult {
  isValid: boolean;
  ruc: string;
  dv: number;
  calculatedDv: number;
  error?: string;
}

const RUC_REGEX = /^(\d{3,10})-(\d)$/;
const RUC_CLEAN_REGEX = /^(\d{4,11})$/;

function parseRuc(ruc: string): RucParsed | null {
  const trimmed = ruc.trim();

  // Format: XXXXXXXX-X (with dash)
  const matchWithDash = trimmed.match(RUC_REGEX);
  if (matchWithDash) {
    return {
      baseNumber: matchWithDash[1],
      dv: parseInt(matchWithDash[2], 10),
      fullRuc: trimmed,
    };
  }

  // Format: XXXXXXXXX (without dash, implied last digit is DV)
  const matchClean = trimmed.match(RUC_CLEAN_REGEX);
  if (matchClean) {
    const raw = matchClean[1];
    return {
      baseNumber: raw.slice(0, -1),
      dv: parseInt(raw.slice(-1), 10),
      fullRuc: `${raw.slice(0, -1)}-${raw.slice(-1)}`,
    };
  }

  return null;
}

/**
 * Calculates the check digit (DV) for a RUC base number.
 * Official SET algorithm — módulo 11.
 */
export function calculateDV(baseNumber: string, baseMax = 11): number {
  // Convert to string, uppercase, replace letters with ASCII codes
  let processed = "";
  for (const char of baseNumber.toUpperCase()) {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) {
      processed += char; // digit 0-9
    } else {
      processed += code; // letter -> ASCII
    }
  }

  let total = 0;
  let k = 2; // factor starts at 2

  // Process from right to left
  for (let i = processed.length - 1; i >= 0; i--) {
    if (k > baseMax) {
      k = 2; // reset factor
    }
    const digit = parseInt(processed[i], 10);
    total += digit * k;
    k++;
  }

  const remainder = total % 11;
  return remainder > 1 ? 11 - remainder : 0;
}

/**
 * Validates a full RUC (with or without dash).
 * Returns validation result with calculated DV.
 */
export function validateRuc(ruc: string): RucValidationResult {
  const parsed = parseRuc(ruc);

  if (!parsed) {
    return {
      isValid: false,
      ruc,
      dv: 0,
      calculatedDv: 0,
      error: "Formato de RUC inválido. Usá XXXXXXXX-X o XXXXXXXXX",
    };
  }

  const calculatedDv = calculateDV(parsed.baseNumber);

  return {
    isValid: calculatedDv === parsed.dv,
    ruc: parsed.fullRuc,
    dv: parsed.dv,
    calculatedDv,
    error: calculatedDv !== parsed.dv
      ? `DV incorrecto: ingresaste ${parsed.dv}, debe ser ${calculatedDv}`
      : undefined,
  };
}

/**
 * Formats a base number + DV into standard RUC format.
 */
export function formatRuc(baseNumber: string, dv: number | string): string {
  const dvStr = typeof dv === "number" ? dv.toString() : dv;
  return `${baseNumber}-${dvStr}`;
}

/**
 * Extracts the base number from a full RUC string.
 */
export function extractBaseNumber(ruc: string): string | null {
  const parsed = parseRuc(ruc);
  return parsed ? parsed.baseNumber : null;
}
