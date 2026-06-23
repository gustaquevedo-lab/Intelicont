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
async function fetchFromBCP(currency: string, targetDate?: string): Promise<ExchangeRateResult> {
  const queryDate = targetDate || new Date().toISOString().split("T")[0];

  if (currency.toUpperCase() === "USD") {
    // Si es hoy, usamos DolarPy
    const todayStr = new Date().toISOString().split("T")[0];
    if (queryDate === todayStr) {
      const res = await fetch("https://dolar.melizeche.com/api/1.0/", {
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const data = await res.json();
        const bcpData = data?.dolarpy?.bcp;
        if (bcpData && bcpData.venta) {
          return {
            currency: "USD",
            buyRate: Number(bcpData.compra) || 0,
            sellRate: Number(bcpData.venta) || 0,
            date: queryDate,
            source: "bcp",
            sourceName: "Banco Central del Paraguay (vía DolarPy)",
          };
        }
      }
    }

    // Si es una fecha específica o DolarPy falló, consultamos el JSON histórico de la SET
    try {
      const res = await fetch("https://cdn.jsdelivr.net/gh/sistemasaguila/cotizaciones-set@main/data/latest.json", {
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const data = await res.json();
        // Buscamos si la fecha exacta existe, o bien tomamos la más cercana
        const dates = Object.keys(data);
        const matchedDate = dates.includes(queryDate) ? queryDate : dates[0];
        const rates = data[matchedDate];
        const usdData = rates?.["usd"];
        if (usdData) {
          return {
            currency: "USD",
            buyRate: Number(usdData.purchase) || 0,
            sellRate: Number(usdData.sale) || 0,
            date: matchedDate,
            source: "bcp",
            sourceName: `Banco Central del Paraguay (vía SET - ${matchedDate})`,
          };
        }
      }
    } catch {}
  }

  // Para EUR, BRL, ARS, etc., usamos el CDN de cotizaciones de la SET
  try {
    const res = await fetch("https://cdn.jsdelivr.net/gh/sistemasaguila/cotizaciones-set@main/data/latest.json", {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    const dates = Object.keys(data);
    if (dates.length === 0) throw new Error("No hay fechas en JSON de cotizaciones");
    const matchedDate = dates.includes(queryDate) ? queryDate : dates[0];
    const rates = data[matchedDate];
    const key = currency.toLowerCase() === "ars" ? "arp" : currency.toLowerCase();
    const currencyData = rates[key];

    if (!currencyData) {
      throw new Error(`Moneda ${currency} no encontrada en las cotizaciones vigentes.`);
    }

    return {
      currency: currency.toUpperCase(),
      buyRate: Number(currencyData.purchase) || 0,
      sellRate: Number(currencyData.sale) || 0,
      date: matchedDate,
      source: "bcp",
      sourceName: `Banco Central del Paraguay (vía SET - ${matchedDate})`,
    };
  } catch (err: any) {
    throw new Error(err.message || `No se pudo obtener cotización de ${currency} desde la base de datos de SET.`);
  }
}

// ── DNIT ───────────────────────────────────────────────────────────────────────
async function fetchFromDNIT(currency: string, targetDate?: string): Promise<ExchangeRateResult> {
  const queryDate = targetDate || new Date().toISOString().split("T")[0];
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
    // Buscamos la fecha exacta solicitada o en su defecto la cotización más reciente
    const matchedDate = dates.includes(queryDate) ? queryDate : dates[0];
    const rates = data[matchedDate];
    const key = currency.toLowerCase() === "ars" ? "arp" : currency.toLowerCase();
    const currencyData = rates[key];

    if (!currencyData) {
      throw new Error(`Moneda ${currency} no encontrada para efectos fiscales DNIT.`);
    }

    return {
      currency: currency.toUpperCase(),
      buyRate: Number(currencyData.purchase) || 0,
      sellRate: Number(currencyData.sale) || 0,
      date: matchedDate,
      source: "dnit",
      sourceName: `DNIT (Cotización SET al ${matchedDate})`,
    };
  } catch (err: any) {
    throw new Error(err.message || "Error al obtener cotización fiscal de la DNIT");
  }
}

// ── Public Action ──────────────────────────────────────────────────────────────
export async function fetchExchangeRate(
  currency: string,
  source: ExchangeRateSource,
  targetDate?: string
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
        ? await fetchFromBCP(currency, targetDate)
        : await fetchFromDNIT(currency, targetDate);

    return { ok: true, data: result };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || `No se pudo obtener cotización de ${source.toUpperCase()}`,
    };
  }
}
