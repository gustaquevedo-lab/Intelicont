/**
 * Fiscal PY Rules Engine — Paraguay Tax Compliance
 *
 * Validates RUC, timbrado, CDC, and enforces SET/DNIT rules.
 * All validation logic specific to Paraguay tax authority requirements.
 */

export const IVA_RATES = {
  general: 0.10,
  reducido: 0.05,
  exento: 0,
} as const;

export const IRE_RATES = {
  general: 0.30,
  simple: 0.10,
  resimple: 0.06,
} as const;

export const IRP_RETENTION_RATES = {
  honorarios: 0.10,
  alquileres: 0.10,
  dividendos: 0.06,
  intereses: 0.06,
  iere: 0.02,
  fletes: 0.06,
  seguros: 0.06,
} as const;

export const RUC_FORMATS = {
  juridico: { pattern: /^\d{8}-\d$/, length: 10, label: "Persona Jurídica" },
  natural: { pattern: /^[0-9]{7,8}-\d$/, length: null, label: "Persona Natural" },
  cedula: { pattern: /^\d{6,8}$/, length: null, label: "Cédula de Identidad" },
} as const;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateRuc(ruc: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const cleaned = ruc.trim();

  if (!cleaned) {
    result.valid = false;
    result.errors.push("El RUC es obligatorio");
    return result;
  }

  const isJuridico = /^\d{8}-\d$/.test(cleaned);
  const isNatural = /^[0-9]{6,7}-\d$/.test(cleaned);
  const isCedula = /^\d{6,8}$/.test(cleaned);

  if (!isJuridico && !isNatural && !isCedula) {
    result.valid = false;
    result.errors.push("Formato de RUC inválido. Ej: 80012345-1 (jurídico) o 1234567-8 (natural)");
    return result;
  }

  // Validate check digit for juridico
  if (isJuridico) {
    const [body, checkDigitStr] = cleaned.split("-");
    const checkDigit = parseInt(checkDigitStr, 10);
    const calculated = calculateRucCheckDigit(body);
    if (calculated !== checkDigit) {
      result.valid = false;
      result.errors.push(`Dígito verificador inválido. Esperado: ${calculated}`);
    }
  }

  // RUC starting with specific prefixes
  if (cleaned.startsWith("800")) {
    // Valid prefix for sociedades anónimas
  } else if (cleaned.startsWith("600")) {
    result.warnings.push("RUC de persona física con actividad comercial");
  }

  return result;
}

function calculateRucCheckDigit(body: string): number {
  const weights = [2, 3, 4, 5, 6, 7, 2, 3];
  const reversed = body.split("").reverse();
  let sum = 0;

  for (let i = 0; i < reversed.length && i < weights.length; i++) {
    sum += parseInt(reversed[i], 10) * weights[i];
  }

  const remainder = sum % 11;
  if (remainder === 0) return 0;
  if (remainder === 1) return 1;
  return 11 - remainder;
}

export function validateTimbrado(timbrado: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const cleaned = timbrado.trim();

  if (!cleaned) {
    result.valid = false;
    result.errors.push("El timbrado es obligatorio");
    return result;
  }

  if (!/^\d{8}$/.test(cleaned)) {
    result.valid = false;
    result.errors.push("El timbrado debe tener 8 dígitos numéricos");
    return result;
  }

  return result;
}

export function validateCDC(cdc: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };
  const cleaned = cdc.trim();

  if (!cleaned) {
    result.valid = false;
    result.errors.push("El CDC es obligatorio");
    return result;
  }

  if (cleaned.length !== 44) {
    result.valid = false;
    result.errors.push(`El CDC debe tener 44 dígitos. Tiene ${cleaned.length}`);
    return result;
  }

  if (!/^\d{44}$/.test(cleaned)) {
    result.valid = false;
    result.errors.push("El CDC debe contener solo dígitos numéricos");
    return result;
  }

  // Validate RUC portion (positions 0-7)
  const rucPortion = cleaned.substring(0, 8);
  const rucValidation = validateRuc(rucPortion);
  if (!rucValidation.valid) {
    result.warnings.push("El RUC dentro del CDC parece inválido");
  }

  return result;
}

export function validateInvoiceData(data: {
  timbrado: string;
  establecimiento: string;
  puntoEmision: string;
  numeroDocumento: string;
  fechaEmision: string;
  cdc?: string;
}): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] };

  // Timbrado
  const timbradoResult = validateTimbrado(data.timbrado);
  if (!timbradoResult.valid) {
    result.errors.push(...timbradoResult.errors.map((e) => `Timbrado: ${e}`));
    result.valid = false;
  }

  // Establishment number (3 digits)
  if (!/^\d{3}$/.test(data.establecimiento)) {
    result.valid = false;
    result.errors.push("El establecimiento debe tener 3 dígitos (ej: 001)");
  }

  // Point of emission (3 digits)
  if (!/^\d{3}$/.test(data.puntoEmision)) {
    result.valid = false;
    result.errors.push("El punto de emisión debe tener 3 dígitos (ej: 001)");
  }

  // Document number (up to 10 digits)
  if (!/^\d{1,10}$/.test(data.numeroDocumento)) {
    result.valid = false;
    result.errors.push("El número de documento debe tener entre 1 y 10 dígitos");
  }

  // Date validation
  const fecha = new Date(data.fechaEmision);
  if (isNaN(fecha.getTime())) {
    result.valid = false;
    result.errors.push("La fecha de emisión no es válida");
  } else if (fecha > new Date()) {
    result.warnings.push("La fecha de emisión es futura");
  } else if (fecha < new Date("2022-01-01")) {
    result.warnings.push("La fecha de emisión es anterior a 2022. Verificar vigencia del timbrado");
  }

  // CDC if provided
  if (data.cdc) {
    const cdcResult = validateCDC(data.cdc);
    if (!cdcResult.valid) {
      result.errors.push(...cdcResult.errors.map((e) => `CDC: ${e}`));
      result.valid = false;
    }
    result.warnings.push(...cdcResult.warnings);
  }

  return result;
}

export interface TaxCalculation {
  gravado10: number;
  gravado5: number;
  exento: number;
  iva10: number;
  iva5: number;
  totalIva: number;
  subtotal: number;
  total: number;
}

export function calculateTaxFromTotal(total: number, ivaRate: 10 | 5 | 0): TaxCalculation {
  if (ivaRate === 0) {
    return {
      gravado10: 0,
      gravado5: 0,
      exento: total,
      iva10: 0,
      iva5: 0,
      totalIva: 0,
      subtotal: total,
      total,
    };
  }

  const rate = ivaRate === 10 ? IVA_RATES.general : IVA_RATES.reducido;
  const gravado = Math.round(total / (1 + rate));
  const iva = total - gravado;

  return {
    gravado10: ivaRate === 10 ? gravado : 0,
    gravado5: ivaRate === 5 ? gravado : 0,
    exento: 0,
    iva10: ivaRate === 10 ? iva : 0,
    iva5: ivaRate === 5 ? iva : 0,
    totalIva: iva,
    subtotal: gravado,
    total,
  };
}

export function calculateTaxFromBase(gravado10: number, gravado5: number, exento: number): TaxCalculation {
  const iva10 = Math.round(gravado10 * IVA_RATES.general);
  const iva5 = Math.round(gravado5 * IVA_RATES.reducido);
  const totalIva = iva10 + iva5;
  const total = gravado10 + gravado5 + exento + totalIva;

  return {
    gravado10,
    gravado5,
    exento,
    iva10,
    iva5,
    totalIva,
    subtotal: gravado10 + gravado5 + exento,
    total,
  };
}

export function calculateIre(ingresos: number, costos: number, gastos: number, regimen: "general" | "simple"): {
  baseImponible: number;
  tasa: number;
  impuesto: number;
} {
  const baseImponible = Math.max(0, ingresos - costos - gastos);
  const tasa = IRE_RATES[regimen];
  const impuesto = Math.round(baseImponible * tasa);

  return { baseImponible, tasa, impuesto };
}

export function getIvaConditionDescription(condition: string): string {
  const descriptions: Record<string, string> = {
    responsable: "Responsable ante el IVA — Debe declarar y pagar IVA mensualmente",
    exento: "Exento de IVA — No está obligado a cobrar ni declarar IVA",
    no_responsable: "No Responsable — No realiza actividades gravadas",
    exportador: "Exportador — Régimen especial para operaciones de exportación",
  };
  return descriptions[condition] || condition;
}

export function getRegimenDescription(regimen: string): string {
  const descriptions: Record<string, string> = {
    general: "Régimen General — IVA 10%/5% + IRE 30%",
    simple: "Régimen Simple — IVA 10%/5% + IRE 10%",
    resimple: "ReSimple — IRE 6% sobre ingresos brutos",
    exportador: "Exportador — IVA 0% para exportaciones",
  };
  return descriptions[regimen] || regimen;
}

// VAT return periods according to SET calendar
export function getVencimientoIVA(year: number, month: number, ruc: string): Date {
  const rucLastDigit = parseInt(ruc.replace(/[^0-9]/g, "").slice(-1), 10);
  const baseDate = new Date(year, month, 10 + rucLastDigit);

  // If it falls on a weekend, move to next business day
  const dayOfWeek = baseDate.getDay();
  if (dayOfWeek === 0) {
    baseDate.setDate(baseDate.getDate() + 1);
  } else if (dayOfWeek === 6) {
    baseDate.setDate(baseDate.getDate() + 2);
  }

  return baseDate;
}

// Hechauka submission deadline (25th of following month)
export function getVencimientoHechauka(year: number, month: number): Date {
  return new Date(year, month + 1, 25);
}
