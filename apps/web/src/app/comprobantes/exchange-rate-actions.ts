"use server";

/**
 * Exchange Rate Fetcher
 * Fuentes soportadas:
 *   - manual   → el contador ingresa la cotización
 *   - bcp      → Banco Central del Paraguay (www.bcp.gov.py)
 *   - dnit     → Dirección Nacional de Ingresos Tributarios (www.dnit.gov.py)
 */

export type ExchangeRateSource = "manual" | "bcp" | "dnit";

export interface ExchangeRateResult {
  currency: string;
  buyRate: number;   // Gs. por unidad (compra)
  sellRate: number;  // Gs. por unidad (venta)
  date: string;      // YYYY-MM-DD
  source: ExchangeRateSource;
  sourceName: string;
}

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// ── BCP (USD via DolarPy, others via backup) ───────────────────────────────────
async function fetchFromBCP(currency: string): Promise<ExchangeRateResult> {
  const today = new Date().toISOString().split("T")[0];

  if (currency.toUpperCase() === "USD") {
    // Para dólares usamos la API comunitaria y estable DolarPy
    const res = await fetch("https://dolar.melizeche.com/api/1.0/", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      throw new Error(`DolarPy respondió con ${res.status}`);
    }
    const data = await res.json();
    const bcpData = data?.dolarpy?.bcp;
    if (!bcpData || !bcpData.venta) {
      throw new Error("DolarPy: cotización del BCP no disponible");
    }
    return {
      currency: "USD",
      buyRate: Number(bcpData.compra) || 0,
      sellRate: Number(bcpData.venta) || 0,
      date: today,
      source: "bcp",
      sourceName: "Banco Central del Paraguay (vía DolarPy)",
    };
  }

  // Para EUR, BRL, ARS, etc., usamos el CDN de cotizaciones de DNIT/SET que contiene múltiples monedas
  try {
    const res = await fetch("https://cdn.jsdelivr.net/gh/sistemasaguila/cotizaciones-set@main/data/latest.json", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const dates = Object.keys(data);
    if (dates.length === 0) throw new Error("No hay fechas en JSON de cotizaciones");
    const latestDate = dates[0];
    const rates = data[latestDate];
    const key = currency.toLowerCase() === "ars" ? "arp" : currency.toLowerCase();
    const currencyData = rates[key];

    if (!currencyData) {
      throw new Error(`Moneda ${currency} no encontrada en las cotizaciones vigentes.`);
    }

    return {
      currency: currency.toUpperCase(),
      buyRate: Number(currencyData.purchase) || 0,
      sellRate: Number(currencyData.sale) || 0,
      date: latestDate,
      source: "bcp",
      sourceName: `Banco Central del Paraguay (vía SET - ${latestDate})`,
    };
  } catch (err: any) {
    throw new Error(err.message || `No se pudo obtener cotización de ${currency} desde la base de datos de SET.`);
  }
}

// ── DNIT ───────────────────────────────────────────────────────────────────────
async function fetchFromDNIT(currency: string): Promise<ExchangeRateResult> {
  // Para la DNIT (cotización oficial de liquidación) usamos directamente el JSON de la SET/DNIT
  try {
    const res = await fetch("https://cdn.jsdelivr.net/gh/sistemasaguila/cotizaciones-set@main/data/latest.json", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) {
      throw new Error(`API de cotizaciones SET respondió con código ${res.status}`);
    }
    const data = await res.json();
    const dates = Object.keys(data);
    if (dates.length === 0) {
      throw new Error("No se encontraron registros de cotizaciones en DNIT");
    }
    // La cotización más reciente publicada
    const latestDate = dates[0];
    const rates = data[latestDate];
    const key = currency.toLowerCase() === "ars" ? "arp" : currency.toLowerCase();
    const currencyData = rates[key];

    if (!currencyData) {
      throw new Error(`Moneda ${currency} no encontrada para efectos fiscales DNIT.`);
    }

    return {
      currency: currency.toUpperCase(),
      buyRate: Number(currencyData.purchase) || 0,
      sellRate: Number(currencyData.sale) || 0,
      date: latestDate,
      source: "dnit",
      sourceName: `DNIT (Cotización SET al ${latestDate})`,
    };
  } catch (err: any) {
    throw new Error(err.message || "Error al obtener cotización fiscal de la DNIT");
  }
}

// ── Public Action ──────────────────────────────────────────────────────────────
export async function fetchExchangeRate(
  currency: string,
  source: ExchangeRateSource
): Promise<ActionResult<ExchangeRateResult>> {
  if (source === "manual") {
    return {
      ok: false,
      error: "Fuente manual: el contador debe ingresar la cotización",
    };
  }

  try {
    const result =
      source === "bcp"
        ? await fetchFromBCP(currency)
        : await fetchFromDNIT(currency);

    return { ok: true, data: result };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || `No se pudo obtener cotización de ${source.toUpperCase()}`,
    };
  }
}
