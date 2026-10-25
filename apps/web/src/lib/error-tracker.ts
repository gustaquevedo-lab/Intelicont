import { createHash, randomUUID } from "node:crypto";
import { getDb, isMockMode } from "@ledger/db";
import { erroresPlataforma } from "@ledger/db/schema";
import { eq, desc } from "drizzle-orm";

export interface ErrorPlataforma {
  id: string;
  fingerprint: string;
  tipoError: string;
  mensaje: string;
  path: string;
  metodo: string;
  statusCode: number;
  stacktrace: string;
  contextoJson: string | null;
  entityId: string | null;
  usuarioEmail: string | null;
  ocurrencias: number;
  primeraVez: Date;
  ultimaVez: Date;
  resuelto: boolean;
  resueltoEn: Date | null;
  notasResolucion: string | null;
}

export interface RegistrarErrorInput {
  tipoError: string;
  mensaje: string;
  path: string;
  metodo: string;
  statusCode?: number;
  stacktrace: string;
  file?: string;
  line?: number | string;
  contexto?: any;
  entityId?: string | null;
  usuarioEmail?: string | null;
}

// In-memory store for tests and mock mode
let mockErrores: ErrorPlataforma[] = [];

export function resetErroresStore() {
  mockErrores = [];
}

/**
 * Calcula un fingerprint SHA-256 determinista basado en tipo de error, archivo y línea del fallo.
 */
export function calcularFingerprint(tipoError: string, file: string = "unknown", line: number | string = 0): string {
  const normFile = file.replace(/\\/g, "/").split("/").slice(-2).join("/"); // normalizar ruta
  const seed = `${tipoError.trim()}:${normFile.trim()}:${line}`;
  return createHash("sha256").update(seed).digest("hex");
}

const REDACT_KEYS = new Set([
  "password",
  "token",
  "authorization",
  "cookie",
  "secret",
  "apikey",
  "api_key",
  "access_token",
  "refresh_token",
  "credential",
  "private_key",
]);

/**
 * Sanitiza recursivamente objetos de contexto (headers, body, query params) ocultando datos sensibles.
 */
export function sanitizarContexto(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizarContexto);
  }

  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const lowerKey = k.toLowerCase().replace(/[-_]/g, "");
    if ([...REDACT_KEYS].some((rk) => lowerKey.includes(rk.replace(/[-_]/g, "")))) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "object") {
      out[k] = sanitizarContexto(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Registra un error no controlado en la plataforma con deduplicación por fingerprint SHA-256.
 */
export async function registrarErrorPlataforma(
  input: RegistrarErrorInput
): Promise<{ error: ErrorPlataforma; isNew: boolean }> {
  // Extraer archivo y línea del stacktrace si no fueron provistos
  let file = input.file || "unknown";
  let line = input.line || 0;

  if (!input.file && input.stacktrace) {
    const match = input.stacktrace.match(/\((.*?):(\d+):\d+\)/) || input.stacktrace.match(/at (.*?):(\d+):\d+/);
    if (match) {
      file = match[1];
      line = match[2];
    }
  }

  const fingerprint = calcularFingerprint(input.tipoError, file, line);
  const sanitizedCtx = input.contexto ? JSON.stringify(sanitizarContexto(input.contexto)) : null;
  const now = new Date();

  // Modo Mock o Tests
  if (isMockMode() || process.env.NODE_ENV === "test") {
    const existing = mockErrores.find((e) => e.fingerprint === fingerprint);
    if (existing) {
      existing.ocurrencias += 1;
      existing.ultimaVez = now;
      existing.mensaje = input.mensaje;
      existing.stacktrace = input.stacktrace;
      existing.resuelto = false; // reabrir si estaba resuelto
      return { error: existing, isNew: false };
    }

    const nuevo: ErrorPlataforma = {
      id: randomUUID(),
      fingerprint,
      tipoError: input.tipoError,
      mensaje: input.mensaje,
      path: input.path,
      metodo: input.metodo,
      statusCode: input.statusCode || 500,
      stacktrace: input.stacktrace,
      contextoJson: sanitizedCtx,
      entityId: input.entityId ?? null,
      usuarioEmail: input.usuarioEmail ?? null,
      ocurrencias: 1,
      primeraVez: now,
      ultimaVez: now,
      resuelto: false,
      resueltoEn: null,
      notasResolucion: null,
    };
    mockErrores.push(nuevo);
    return { error: nuevo, isNew: true };
  }

  // Modo DB Real
  try {
    const db = getDb();
    const existingRows = await db
      .select()
      .from(erroresPlataforma)
      .where(eq(erroresPlataforma.fingerprint, fingerprint))
      .limit(1);

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      const [updated] = await db
        .update(erroresPlataforma)
        .set({
          ocurrencias: existing.ocurrencias + 1,
          ultimaVez: now,
          mensaje: input.mensaje,
          stacktrace: input.stacktrace,
          resuelto: false,
        })
        .where(eq(erroresPlataforma.id, existing.id))
        .returning();

      return { error: updated as ErrorPlataforma, isNew: false };
    }

    const [inserted] = await db
      .insert(erroresPlataforma)
      .values({
        fingerprint,
        tipoError: input.tipoError,
        mensaje: input.mensaje,
        path: input.path,
        metodo: input.metodo,
        statusCode: input.statusCode || 500,
        stacktrace: input.stacktrace,
        contextoJson: sanitizedCtx,
        entityId: input.entityId ?? null,
        usuarioEmail: input.usuarioEmail ?? null,
        ocurrencias: 1,
        primeraVez: now,
        ultimaVez: now,
        resuelto: false,
      })
      .returning();

    return { error: inserted as ErrorPlataforma, isNew: true };
  } catch (dbErr) {
    console.error("[Sentry-Lite] Error al persistir incidente en DB:", dbErr);
    // Fallback in-memory
    const fallback: ErrorPlataforma = {
      id: randomUUID(),
      fingerprint,
      tipoError: input.tipoError,
      mensaje: input.mensaje,
      path: input.path,
      metodo: input.metodo,
      statusCode: input.statusCode || 500,
      stacktrace: input.stacktrace,
      contextoJson: sanitizedCtx,
      entityId: input.entityId ?? null,
      usuarioEmail: input.usuarioEmail ?? null,
      ocurrencias: 1,
      primeraVez: now,
      ultimaVez: now,
      resuelto: false,
      resueltoEn: null,
      notasResolucion: null,
    };
    return { error: fallback, isNew: true };
  }
}

/**
 * Resuelve un incidente de error guardando notas y fecha de resolución.
 */
export async function resolverErrorPlataforma(id: string, notas?: string): Promise<ErrorPlataforma | null> {
  const now = new Date();
  if (isMockMode() || process.env.NODE_ENV === "test") {
    const item = mockErrores.find((e) => e.id === id);
    if (!item) return null;
    item.resuelto = true;
    item.resueltoEn = now;
    item.notasResolucion = notas || null;
    return item;
  }

  const db = getDb();
  const [updated] = await db
    .update(erroresPlataforma)
    .set({
      resuelto: true,
      resueltoEn: now,
      notasResolucion: notas || null,
    })
    .where(eq(erroresPlataforma.id, id))
    .returning();

  return (updated as ErrorPlataforma) || null;
}

/**
 * Obtiene el listado de errores de plataforma con filtro opcional de resuelto.
 */
export async function getErroresPlataforma(options?: { resuelto?: boolean; limit?: number }): Promise<ErrorPlataforma[]> {
  const limit = options?.limit || 50;

  if (isMockMode() || process.env.NODE_ENV === "test") {
    let list = [...mockErrores];
    if (options?.resuelto !== undefined) {
      list = list.filter((e) => e.resuelto === options.resuelto);
    }
    return list.sort((a, b) => b.ultimaVez.getTime() - a.ultimaVez.getTime()).slice(0, limit);
  }

  const db = getDb();
  let query = db.select().from(erroresPlataforma);
  if (options?.resuelto !== undefined) {
    query = query.where(eq(erroresPlataforma.resuelto, options.resuelto)) as any;
  }
  const rows = await query.orderBy(desc(erroresPlataforma.ultimaVez)).limit(limit);
  return rows as ErrorPlataforma[];
}

export { generarReporteMarkdown } from "./error-report";
