/**
 * Cliente HTTP nativo para Marangatú (Protocolo REA - Reverse Engineering API).
 * Permite verificar sesiones tributarias activas, listar talones de la RG 90
 * y descargar comprobantes de compras y ventas sin necesidad de Chromium/Playwright.
 */

export const MARANGATU_BASE_URL = "https://marangatu.dnit.gov.py";
export const ENDPOINT_SESION = `${MARANGATU_BASE_URL}/eset/publico/consultarSesion.do`;
export const ENDPOINT_TALONES = `${MARANGATU_BASE_URL}/eset/rg90/talones`;
export const ENDPOINT_DESCARGA = `${MARANGATU_BASE_URL}/eset/rg90/descargar`;

export interface MarangatuSessionInfo {
  valido: boolean;
  ruc?: string;
  nombre?: string;
  error?: string;
  detalles?: any;
}

export interface MarangatuDocumentoRaw {
  tipo: "compra" | "venta";
  cdc?: string;
  timbrado: string;
  numero: string;
  fecha: string;
  rucContraparte: string;
  nombreContraparte: string;
  gravada10: number;
  gravada5: number;
  exenta: number;
  iva10: number;
  iva5: number;
  total: number;
  condicion: "contado" | "credito";
}

/**
 * Normaliza y formatea la cookie de sesión tributaria.
 */
export function cleanCookie(cookieRaw: string): string {
  if (!cookieRaw) return "";
  const trimmed = cookieRaw.trim();
  if (!trimmed) return "";
  if (!trimmed.startsWith("JSESSIONID=") && !trimmed.includes("=")) {
    return `JSESSIONID=${trimmed}`;
  }
  return trimmed;
}

/**
 * Convierte registros crudos desde la API interna de Marangatú al esquema estándar.
 * Todos los montos se redondean a enteros Guaraníes (sin decimales).
 */
export function parsearRegistrosMarangatu(payload: any): MarangatuDocumentoRaw[] {
  if (!Array.isArray(payload)) return [];

  const items: MarangatuDocumentoRaw[] = [];
  for (const item of payload) {
    const tipoRaw = String(item.tipo || "compra").toLowerCase();
    const tipo: "compra" | "venta" = tipoRaw.includes("venta") ? "venta" : "compra";
    const condicionRaw = String(item.condicion || "contado").toLowerCase();
    const condicion: "contado" | "credito" = condicionRaw.includes("credito") ? "credito" : "contado";

    const total = Math.round(Number(item.total || 0));
    const gravada10 = Math.round(Number(item.gravada10 ?? item.gravada_10 ?? 0));
    const gravada5 = Math.round(Number(item.gravada5 ?? item.gravada_5 ?? 0));
    const exenta = Math.round(Number(item.exenta || 0));
    const iva10 = Math.round(Number(item.iva10 ?? item.iva_10 ?? 0));
    const iva5 = Math.round(Number(item.iva5 ?? item.iva_5 ?? 0));

    items.push({
      tipo,
      cdc: item.cdc ? String(item.cdc).trim() : undefined,
      timbrado: String(item.timbrado || "").trim(),
      numero: String(item.numero || "").trim(),
      fecha: String(item.fecha || "").slice(0, 10),
      rucContraparte: String(item.rucContraparte || item.ruc_contraparte || item.ruc || "").trim(),
      nombreContraparte: String(item.nombreContraparte || item.nombre_contraparte || item.razonSocial || "").trim(),
      gravada10,
      gravada5,
      exenta,
      iva10,
      iva5,
      total,
      condicion,
    });
  }
  return items;
}

export class MarangatuHttpClient {
  private timeoutMs: number;
  private defaultHeaders: Record<string, string>;

  constructor(timeoutMs = 15000) {
    this.timeoutMs = timeoutMs;
    this.defaultHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Referer: `${MARANGATU_BASE_URL}/`,
      Origin: MARANGATU_BASE_URL,
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "es-419,es;q=0.9,en;q=0.8",
    };
  }

  /**
   * Verifica si la cookie/token provisto corresponde a una sesión activa en Marangatú.
   */
  async verificarSesion(cookie: string): Promise<MarangatuSessionInfo> {
    const cookieHeader = cleanCookie(cookie);
    if (!cookieHeader) {
      return { valido: false, error: "Token de sesión vacío" };
    }

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.timeoutMs);
      const res = await fetch(ENDPOINT_SESION, {
        headers: { ...this.defaultHeaders, Cookie: cookieHeader },
        signal: controller.signal,
      });
      clearTimeout(id);

      if (res.status === 200) {
        const data = (await res.json()) as any;
        const autenticado = data.autenticado !== false;
        const rucBase = data.ruc || data.rucContribuyente || "";
        const dv = data.dv || "";
        const rucCompleto = dv ? `${rucBase}-${dv}` : String(rucBase);
        const nombre = data.razonSocial || data.nombreContribuyente || "Usuario Marangatú";

        return {
          valido: Boolean(autenticado && rucBase),
          ruc: rucCompleto,
          nombre,
          detalles: data,
        };
      }

      if (res.status === 401 || res.status === 403) {
        return {
          valido: false,
          error: "Sesión expirada o inválida. Por favor renueve su acceso a Marangatú.",
        };
      }

      return {
        valido: false,
        error: `Respuesta inesperada de Marangatú: HTTP ${res.status}`,
      };
    } catch (e) {
      return {
        valido: false,
        error: `Error de conectividad con la DNIT: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }

  /**
   * Lista los talones de presentación de la RG 90 confirmados ante la DNIT para el período dado.
   */
  async listarTalones(cookie: string, ruc: string, periodo: string): Promise<any[]> {
    const cookieHeader = cleanCookie(cookie);
    const url = new URL(ENDPOINT_TALONES);
    url.searchParams.set("ruc", ruc);
    url.searchParams.set("periodo", periodo);

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.timeoutMs);
      const res = await fetch(url.toString(), {
        headers: { ...this.defaultHeaders, Cookie: cookieHeader },
        signal: controller.signal,
      });
      clearTimeout(id);

      if (res.status === 200) {
        const data = (await res.json()) as any;
        return Array.isArray(data.talones) ? data.talones : [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Descarga y parsea el payload de comprobantes asociado a un talón de presentación.
   */
  async descargarComprobantes(cookie: string, idTalon: string): Promise<MarangatuDocumentoRaw[]> {
    const cookieHeader = cleanCookie(cookie);
    const url = new URL(ENDPOINT_DESCARGA);
    url.searchParams.set("idTalon", idTalon);

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.timeoutMs);
      const res = await fetch(url.toString(), {
        headers: { ...this.defaultHeaders, Cookie: cookieHeader },
        signal: controller.signal,
      });
      clearTimeout(id);

      if (res.status === 200) {
        const data = await res.json();
        return parsearRegistrosMarangatu(data);
      }
      return [];
    } catch {
      return [];
    }
  }
}
