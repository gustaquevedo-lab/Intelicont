export interface TasaCambio {
  moneda: string;
  simbolo: string;
  nombre: string;
  compra: number;
  venta: number;
  fecha: string;
  variacion: number;
  fuente: string;
}

export interface CalculoDiferenciaInput {
  moneda: string;
  montoME: number;
  tasaOrigen: number;
  tasaCierre: number;
  esActivo: boolean; // true para cuentas a cobrar/caja, false para cuentas a pagar
}

export interface CalculoDiferenciaOutput {
  moneda: string;
  montoME: number;
  tasaOrigen: number;
  tasaCierre: number;
  montoOrigenPYG: number;
  montoCierrePYG: number;
  diferenciaPYG: number;
  esGanancia: boolean;
  descripcion: string;
}

// Fallback rates for Paraguay market (USD, EUR, BRL, ARS)
const FALLBACK_RATES: TasaCambio[] = [
  {
    moneda: "USD",
    simbolo: "US$",
    nombre: "Dólar Estadounidense",
    compra: 7920,
    venta: 7980,
    fecha: new Date().toISOString().slice(0, 10),
    variacion: -15,
    fuente: "BCP / Cotización de Referencia",
  },
  {
    moneda: "EUR",
    simbolo: "€",
    nombre: "Euro",
    compra: 8650,
    venta: 8790,
    fecha: new Date().toISOString().slice(0, 10),
    variacion: 20,
    fuente: "BCP / Cotización de Referencia",
  },
  {
    moneda: "BRL",
    simbolo: "R$",
    nombre: "Real Brasileño",
    compra: 1390,
    venta: 1450,
    fecha: new Date().toISOString().slice(0, 10),
    variacion: -5,
    fuente: "Cambios Asunción",
  },
  {
    moneda: "ARS",
    simbolo: "AR$",
    nombre: "Peso Argentino",
    compra: 6.8,
    venta: 7.4,
    fecha: new Date().toISOString().slice(0, 10),
    variacion: 0.2,
    fuente: "Cambios Asunción",
  },
];

let cachedRates: { rates: TasaCambio[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutos

export async function getExchangeRates(): Promise<TasaCambio[]> {
  const now = Date.now();
  if (cachedRates && now - cachedRates.timestamp < CACHE_TTL_MS) {
    return cachedRates.rates;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("https://dolar.melizeche.com/api/1.0/", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const bcp = data?.dolarpy?.bcp || data?.dolarpy?.cambioschaco;
      const today = new Date().toISOString().slice(0, 10);

      const rates: TasaCambio[] = [
        {
          moneda: "USD",
          simbolo: "US$",
          nombre: "Dólar Estadounidense",
          compra: Number(bcp?.compra) || 7920,
          venta: Number(bcp?.venta) || 7980,
          fecha: today,
          variacion: -10,
          fuente: "DolarPy (BCP / Chaco)",
        },
        ...FALLBACK_RATES.filter((r) => r.moneda !== "USD"),
      ];

      cachedRates = { rates, timestamp: now };
      return rates;
    }
  } catch {
    // API timeout o sin conexión, usar fallback
  }

  return FALLBACK_RATES;
}

/**
 * Calcula la diferencia de cambio por revaluación de moneda extranjera (Art. 38 Ley 6380 / Res. 49/14).
 * Para un activo (caja/banco USD o cuentas por cobrar USD):
 * - Si sube el tipo de cambio: ganancia de cambio.
 * - Si baja el tipo de cambio: pérdida de cambio.
 * Para un pasivo (cuentas por pagar USD):
 * - Si sube el tipo de cambio: pérdida de cambio.
 * - Si baja el tipo de cambio: ganancia de cambio.
 */
export function calcularDiferenciaCambio(input: CalculoDiferenciaInput): CalculoDiferenciaOutput {
  const montoOrigenPYG = Math.round(input.montoME * input.tasaOrigen);
  const montoCierrePYG = Math.round(input.montoME * input.tasaCierre);
  const diff = montoCierrePYG - montoOrigenPYG;

  let esGanancia = false;
  let diferenciaPYG = 0;

  if (input.esActivo) {
    esGanancia = diff >= 0;
    diferenciaPYG = Math.abs(diff);
  } else {
    // Pasivo
    esGanancia = diff <= 0;
    diferenciaPYG = Math.abs(diff);
  }

  const tipoOperacion = input.esActivo ? "Activo en ME" : "Pasivo en ME";
  const resultadoTxt = esGanancia ? "Ganancia de Cambio" : "Pérdida de Cambio";
  const descripcion = `Revaluación ${tipoOperacion} (${input.moneda} ${input.montoME.toLocaleString()} @ ${input.tasaCierre}) - ${resultadoTxt} Gs. ${diferenciaPYG.toLocaleString("es-PY")}`;

  return {
    moneda: input.moneda,
    montoME: input.montoME,
    tasaOrigen: input.tasaOrigen,
    tasaCierre: input.tasaCierre,
    montoOrigenPYG,
    montoCierrePYG,
    diferenciaPYG,
    esGanancia,
    descripcion,
  };
}
