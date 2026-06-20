import { validateRuc, calculateDV, extractBaseNumber, formatRuc, type RucValidationResult } from "@intelicont/ledger/ruc-validator";

// ─── Types ────────────────────────────────────────────────────────────────

export interface RucLookupResult {
  /** Normalised RUC with DV (e.g. "80012345-6") */
  ruc: string;
  /** Razón Social / Nombre */
  nombre: string;
  /** Estado: ACTIVO, BLOQUEADO, SUSPENSION_TEMPORAL, CANCELADO, CANCELADO_DEFINITIVO */
  estado: string;
  /** DV extraído o calculado */
  dv: number;
  /** Whether the RUC is currently active */
  activo: boolean;
  /** DV validation result (local algorithm) */
  dvValidation: RucValidationResult;
  /** Source of the lookup */
  source: "cache" | "api" | "local-only";
  /** Whether the lookup came from live API vs local DV check */
  fromLive: boolean;
  /** Raw API response (for debugging) */
  raw?: Record<string, unknown>;
}

export interface RucSearchResult {
  /** Normalised RUC with DV */
  ruc: string;
  /** Razón Social */
  nombre: string;
  /** Estado */
  estado: string;
  /** DV */
  dv: number;
  /** Whether the RUC is active */
  activo: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────

const API_BASE = "https://ruc.sun.com.py/api";
const CACHE_PREFIX = "intelicont_ruc_";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  result: RucLookupResult;
  timestamp: number;
}

// ─── Cache Layer ──────────────────────────────────────────────────────────

function getCacheKey(ruc: string): string {
  return `${CACHE_PREFIX}${ruc.replace(/\D/g, "")}`;
}

function getFromCache(ruc: string): RucLookupResult | null {
  try {
    const key = getCacheKey(ruc);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    entry.result.source = "cache";
    return entry.result;
  } catch {
    return null;
  }
}

function setCache(ruc: string, result: RucLookupResult): void {
  try {
    const key = getCacheKey(ruc);
    const entry: CacheEntry = { result, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or disabled — silently skip
  }
}

// ─── API Client ───────────────────────────────────────────────────────────

async function fetchFromSunApi(baseNumber: string): Promise<{
  nombre: string;
  estado: string;
  dv: number;
  ruc: string;
} | null> {
  try {
    const url = `${API_BASE}/ruc/${baseNumber}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout?.(5000) ?? undefined,
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      name?: string;
      ruc?: string;
      dv?: number;
      state?: string;
      fullRuc?: string;
      publicationDateText?: string;
    };

    if (!data.name && !data.ruc) return null;

    return {
      nombre: data.name || "",
      estado: data.state || "DESCONOCIDO",
      dv: typeof data.dv === "number" ? data.dv : 0,
      ruc: data.fullRuc || data.ruc || "",
    };
  } catch {
    return null;
  }
}

async function fetchFromRucParaguayApi(baseNumber: string): Promise<{
  nombre: string;
  estado: string;
  dv: number;
  ruc: string;
} | null> {
  // rucparaguay.info fallback — requires token
  try {
    // Skip if no token configured (free tier operates via browser, not API key)
    const token = process.env.NEXT_PUBLIC_RUC_API_TOKEN;
    if (!token) return null;

    const url = `https://rucparaguay.info/api/contribuyente/${baseNumber}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout?.(5000) ?? undefined,
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      data?: {
        razonSocial?: string;
        ruc?: string;
        dv?: number;
        estado?: string;
      };
    };

    if (!data.data?.razonSocial) return null;

    return {
      nombre: data.data.razonSocial,
      estado: data.data.estado || "DESCONOCIDO",
      dv: data.data.dv ?? 0,
      ruc: data.data.ruc || "",
    };
  } catch {
    return null;
  }
}

// ─── Main lookup ──────────────────────────────────────────────────────────

/**
 * Looks up a RUC by validating its DV locally and optionally fetching
 * razón social / estado from an external API.
 *
 * @param rawRuc - RUC in any format (80012345-6, 800123456, 80012345)
 * @param options.fetchRemote - Whether to attempt remote lookup (default true)
 */
export async function lookupRuc(
  rawRuc: string,
  options: { fetchRemote?: boolean } = {}
): Promise<RucLookupResult> {
  const { fetchRemote = true } = options;

  // 1. DV validation always runs locally
  const dvValidation = validateRuc(rawRuc);

  // If we have a base number, calculate correct DV
  const baseNumber = extractBaseNumber(rawRuc) || rawRuc.replace(/\D/g, "").replace(/^(\d+)\d$/, "$1");
  const correctDv = dvValidation.isValid ? dvValidation.dv : calculateDV(baseNumber);
  const fullRuc = dvValidation.isValid ? dvValidation.ruc : formatRuc(baseNumber, correctDv);

  // 2. Check cache
  if (fetchRemote) {
    const cached = getFromCache(fullRuc);
    if (cached) return cached;
  }

  // 3. Build base result from local validation
  const baseResult: RucLookupResult = {
    ruc: fullRuc,
    nombre: "",
    estado: "DESCONOCIDO",
    dv: correctDv,
    activo: false,
    dvValidation,
    source: "local-only",
    fromLive: false,
  };

  // 4. If DV is invalid, skip remote lookup (avoid wasting calls on bad RUCs)
  if (!dvValidation.isValid && dvValidation.error?.includes("DV incorrecto")) {
    baseResult.source = "local-only";
    return baseResult;
  }

  // 5. Fetch from external API
  if (fetchRemote) {
    const apiResult =
      (await fetchFromSunApi(baseNumber)) ||
      (await fetchFromRucParaguayApi(baseNumber));

    if (apiResult) {
      const result: RucLookupResult = {
        ...baseResult,
        nombre: apiResult.nombre || baseResult.nombre,
        estado: apiResult.estado || baseResult.estado,
        dv: apiResult.dv || baseResult.dv,
        activo: apiResult.estado === "ACTIVO",
        source: "api",
        fromLive: true,
      };
      setCache(fullRuc, result);
      return result;
    }
  }

  // Cache even local-only results to avoid repeated lookups
  setCache(fullRuc, baseResult);
  return baseResult;
}

/**
 * Searches for RUCs by name or partial RUC.
 * Uses ruc.sun.com.py public search API.
 */
export async function searchRuc(
  query: string,
  options: {
    estado?: string;
    limit?: number;
  } = {}
): Promise<RucSearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const params = new URLSearchParams({ q: query });
    if (options.estado) params.set("state", options.estado);

    const url = `${API_BASE}/search?${params.toString()}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout?.(5000) ?? undefined,
    });

    if (!response.ok) return [];

    const data = (await response.json()) as Array<{
      name?: string;
      ruc?: string;
      dv?: number;
      fullRuc?: string;
      state?: string;
    }>;

    if (!Array.isArray(data)) return [];

    const results: RucSearchResult[] = data.slice(0, options.limit ?? 10).map((item) => ({
      ruc: item.fullRuc || item.ruc || "",
      nombre: item.name || "",
      estado: item.state || "DESCONOCIDO",
      dv: item.dv ?? 0,
      activo: item.state === "ACTIVO",
    }));

    return results;
  } catch {
    return [];
  }
}

/**
 * Quick local-only DV validation. No API calls.
 */
export function quickValidate(ruc: string): RucValidationResult {
  return validateRuc(ruc);
}
