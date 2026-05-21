/**
 * Paraguay RUC Validation — DNIT módulo 11
 *
 * Algorithm (verified against real RUCs issued by DNIT/SET):
 *  1. Separate number and verifier digit: "80144114-5" → num="80144114", ver=5
 *  2. Traverse digits of num right-to-left, multiply by weights 2,3,4,5,6,7,8,9
 *  3. Sum all products
 *  4. remainder = sum mod 11
 *  5. calculated = 11 - remainder
 *  6. if calculated >= 10 → calculated = 0  (DNIT rule)
 *  7. valid if calculated === ver
 *
 * Example: 80144114-5
 *   reversed digits: 4,1,1,4,4,1,0,8
 *   weights:         2,3,4,5,6,7,8,9
 *   products:        8+3+4+20+24+7+0+72 = 138
 *   138 mod 11 = 6  →  11-6 = 5  ✓
 */

const WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9];

/** Strips spaces, dashes from the raw input and returns "XXXXXXXX-D" or null */
export function normalizeRUC(raw: string): string | null {
  const cleaned = raw.trim().replace(/\s/g, "");
  // Accept "80144114-5" or "801441145" (no dash)
  const withDash    = cleaned.match(/^(\d{1,8})-(\d)$/);
  const withoutDash = cleaned.match(/^(\d{2,9})$/);

  if (withDash)    return `${withDash[1]}-${withDash[2]}`;
  if (withoutDash) return `${withoutDash[1].slice(0, -1)}-${withoutDash[1].slice(-1)}`;
  return null;
}

export interface RUCValidation {
  valid: boolean;
  normalized?: string;   // "80144114-5"
  error?: string;
}

export function validateRUC(raw: string): RUCValidation {
  if (!raw?.trim()) {
    return { valid: false, error: "El RUC es requerido" };
  }

  const normalized = normalizeRUC(raw);
  if (!normalized) {
    return { valid: false, error: "Formato inválido. Usá: 80144114-5" };
  }

  const [numPart, verPart] = normalized.split("-");
  const verifier = parseInt(verPart, 10);

  if (numPart.length < 1 || numPart.length > 8) {
    return { valid: false, error: "El número RUC debe tener entre 1 y 8 dígitos" };
  }

  // Módulo 11 calculation
  const digits   = numPart.split("").reverse().map(Number);
  const sum      = digits.reduce((acc, d, i) => acc + d * WEIGHTS[i], 0);
  let calculated = 11 - (sum % 11);
  if (calculated >= 10) calculated = 0;

  if (calculated !== verifier) {
    return {
      valid: false,
      error: `Dígito verificador incorrecto (esperado: ${calculated})`,
    };
  }

  return { valid: true, normalized };
}
