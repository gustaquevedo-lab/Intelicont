import { describe, it, expect, beforeEach } from "vitest";
import {
  calcularFingerprint,
  sanitizarContexto,
  generarReporteMarkdown,
  registrarErrorPlataforma,
  resolverErrorPlataforma,
  getErroresPlataforma,
  resetErroresStore,
} from "../lib/error-tracker";

describe("PILAR 2: Sentry-Lite Error Tracker & Deduplication", () => {
  beforeEach(() => {
    resetErroresStore();
  });

  it("calcula un fingerprint SHA-256 determinista de 64 caracteres", () => {
    const fp1 = calcularFingerprint("TypeError", "apps/web/src/routers/test.ts", 42);
    const fp2 = calcularFingerprint("TypeError", "apps/web/src/routers/test.ts", 42);
    const fpDiff = calcularFingerprint("KeyError", "apps/web/src/routers/test.ts", 42);

    expect(fp1).toHaveLength(64);
    expect(fp1).toBe(fp2);
    expect(fp1).not.toBe(fpDiff);
    expect(fp1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("sanitiza contexto redactando credenciales y tokens sensibles", () => {
    const raw = {
      ip: "192.168.1.1",
      headers: {
        authorization: "Bearer eyJhbGciOi...",
        cookie: "session=xyz123",
        "user-agent": "Mozilla/5.0",
      },
      body: {
        email: "admin@empresa.com",
        password: "SuperSecretPassword123!",
        apiKey: "sk_live_9999",
      },
    };

    const sanitized = sanitizarContexto(raw);

    expect(sanitized.ip).toBe("192.168.1.1");
    expect(sanitized.headers.authorization).toBe("[REDACTED]");
    expect(sanitized.headers.cookie).toBe("[REDACTED]");
    expect(sanitized.headers["user-agent"]).toBe("Mozilla/5.0");
    expect(sanitized.body.email).toBe("admin@empresa.com");
    expect(sanitized.body.password).toBe("[REDACTED]");
    expect(sanitized.body.apiKey).toBe("[REDACTED]");
  });

  it("registra un error nuevo y deduplica ocurrencias incrementando contador y reabriendo si estaba resuelto", async () => {
    const errInput = {
      tipoError: "DatabaseConnectionError",
      mensaje: "Connection pool exhausted",
      path: "/api/trpc/entities.list",
      metodo: "POST",
      statusCode: 500,
      stacktrace: "Error: Connection pool exhausted\n    at db.connect (db.ts:15:9)",
      file: "db.ts",
      line: 15,
      contexto: { ip: "127.0.0.1", query: {} },
      entityId: "00000000-0000-0000-0000-000000000001",
      usuarioEmail: "contador@empresa.py",
    };

    // 1. Primera ocurrencia
    const reg1 = await registrarErrorPlataforma(errInput);
    expect(reg1.isNew).toBe(true);
    expect(reg1.error.ocurrencias).toBe(1);
    expect(reg1.error.resuelto).toBe(false);
    expect(reg1.error.fingerprint).toHaveLength(64);

    // 2. Segunda ocurrencia del mismo error (mismo fingerprint)
    const reg2 = await registrarErrorPlataforma(errInput);
    expect(reg2.isNew).toBe(false);
    expect(reg2.error.id).toBe(reg1.error.id);
    expect(reg2.error.ocurrencias).toBe(2);

    // 3. Marcar como resuelto
    const resuelto = await resolverErrorPlataforma(reg1.error.id, "Aumentado pool size a 50");
    expect(resuelto?.resuelto).toBe(true);
    expect(resuelto?.notasResolucion).toBe("Aumentado pool size a 50");
    expect(resuelto?.resueltoEn).toBeInstanceOf(Date);

    // 4. Si el error vuelve a ocurrir, debe reabrirse (resuelto = false) y ocurrencias = 3
    const reg3 = await registrarErrorPlataforma(errInput);
    expect(reg3.isNew).toBe(false);
    expect(reg3.error.ocurrencias).toBe(3);
    expect(reg3.error.resuelto).toBe(false);
  });

  it("genera un reporte Markdown completo para copiar a un Agente AI", async () => {
    const err = await registrarErrorPlataforma({
      tipoError: "ZeroDivisionError",
      mensaje: "division by zero in fiscal calculation",
      path: "/api/cierre/validate",
      metodo: "POST",
      statusCode: 500,
      stacktrace: "ZeroDivisionError: division by zero\n    at calcularIVA (fiscal.ts:88:12)",
      file: "fiscal.ts",
      line: 88,
      contexto: { entityId: "ent-1" },
      entityId: "ent-1",
      usuarioEmail: "admin@estudio.py",
    });

    const md = generarReporteMarkdown(err.error);

    expect(md).toContain("# Incidente de Plataforma 5xx");
    expect(md).toContain("`ZeroDivisionError`");
    expect(md).toContain("`POST /api/cierre/validate`");
    expect(md).toContain(err.error.fingerprint);
    expect(md).toContain("```\nZeroDivisionError: division by zero");
    expect(md).toContain("admin@estudio.py");
  });
});
