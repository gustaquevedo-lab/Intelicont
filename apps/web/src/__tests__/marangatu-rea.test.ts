import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cleanCookie,
  parsearRegistrosMarangatu,
  MarangatuHttpClient,
  type MarangatuDocumentoRaw,
} from "@intelicont/ledger/marangatu-rea";

describe("marangatu-rea: Clean Cookie", () => {
  it("normalizes cookie without JSESSIONID prefix", () => {
    expect(cleanCookie("abc123xyz")).toBe("JSESSIONID=abc123xyz");
  });

  it("preserves cookie with JSESSIONID prefix", () => {
    expect(cleanCookie("JSESSIONID=abc123xyz")).toBe("JSESSIONID=abc123xyz");
  });

  it("handles whitespace and empty input", () => {
    expect(cleanCookie("  ")).toBe("");
    expect(cleanCookie("  mytoken  ")).toBe("JSESSIONID=mytoken");
  });
});

describe("marangatu-rea: Parser de Comprobantes", () => {
  it("converts raw Marangatu purchase payload into integers and standard schema", () => {
    const raw = [
      {
        tipo: "COMPRA",
        timbrado: "12345678",
        numero: "001-001-0000123",
        fecha: "2026-05-15",
        rucContraparte: "80012345-6",
        nombreContraparte: "Proveedor Central S.A.",
        gravada10: 100000,
        gravada5: 0,
        exenta: 0,
        iva10: 9091,
        iva5: 0,
        total: 100000,
        condicion: "CONTADO",
        cdc: "01800123456001001000012312345678123456789012",
      },
    ];

    const result = parsearRegistrosMarangatu(raw);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      tipo: "compra",
      timbrado: "12345678",
      numero: "001-001-0000123",
      fecha: "2026-05-15",
      rucContraparte: "80012345-6",
      nombreContraparte: "Proveedor Central S.A.",
      gravada10: 100000,
      gravada5: 0,
      exenta: 0,
      iva10: 9091,
      iva5: 0,
      total: 100000,
      condicion: "contado",
      cdc: "01800123456001001000012312345678123456789012",
    });
  });

  it("handles decimal floats by rounding to nearest integer Guaraní", () => {
    const raw = [
      {
        tipo: "VENTA",
        timbrado: "87654321",
        numero: "001-002-0000999",
        fecha: "2026-05-16",
        rucContraparte: "5551234-1",
        nombreContraparte: "Cliente Final",
        gravada10: 100000.4,
        gravada5: 0,
        exenta: 0,
        iva10: 9090.9,
        iva5: 0,
        total: 100000.4,
      },
    ];

    const result = parsearRegistrosMarangatu(raw);
    expect(result[0].gravada10).toBe(100000);
    expect(result[0].iva10).toBe(9091);
    expect(result[0].total).toBe(100000);
    expect(result[0].tipo).toBe("venta");
  });
});

describe("marangatu-rea: MarangatuHttpClient", () => {
  let client: MarangatuHttpClient;

  beforeEach(() => {
    client = new MarangatuHttpClient();
    vi.restoreAllMocks();
  });

  it("verificarSesion returns valid session details on 200", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        autenticado: true,
        ruc: "80144114",
        dv: "5",
        razonSocial: "IntelliHouse Soluciones E.A.S.",
      }),
    } as any);

    const res = await client.verificarSesion("test-token");
    expect(res.valido).toBe(true);
    expect(res.ruc).toBe("80144114-5");
    expect(res.nombre).toBe("IntelliHouse Soluciones E.A.S.");
  });

  it("verificarSesion handles expired/invalid session", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    } as any);

    const res = await client.verificarSesion("expired-token");
    expect(res.valido).toBe(false);
    expect(res.error).toMatch(/expirada/i);
  });
});
