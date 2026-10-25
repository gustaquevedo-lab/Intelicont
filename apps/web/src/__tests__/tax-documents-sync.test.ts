import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncMarangatuDocuments } from "@ledger/src/usecases/sync-marangatu";
import type { MarangatuDocumentoRaw } from "@intelicont/ledger/marangatu-rea";

describe("sync-marangatu usecase", () => {
  const entityId = "e1000000-0000-0000-0000-000000000001";

  const mockDb = {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve([{ id: entityId, ruc: "80144114-5" }]),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => Promise.resolve([{ id: "doc-123" }]),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  } as any;

  it("processes list of Marangatu documents and inserts into tax_documents", async () => {
    const docs: MarangatuDocumentoRaw[] = [
      {
        tipo: "compra",
        timbrado: "12345678",
        numero: "001-001-0001001",
        fecha: "2026-05-10",
        rucContraparte: "80001111-2",
        nombreContraparte: "Distribuidora del Este S.A.",
        gravada10: 500000,
        gravada5: 0,
        exenta: 0,
        iva10: 45455,
        iva5: 0,
        total: 500000,
        condicion: "contado",
        cdc: "01800011112001001000100112345678123456789012",
      },
      {
        tipo: "venta",
        timbrado: "87654321",
        numero: "001-001-0002002",
        fecha: "2026-05-12",
        rucContraparte: "4444111-3",
        nombreContraparte: "Cliente Comercial S.R.L.",
        gravada10: 1000000,
        gravada5: 0,
        exenta: 0,
        iva10: 90909,
        iva5: 0,
        total: 1000000,
        condicion: "credito",
      },
    ];

    const res = await syncMarangatuDocuments(entityId, docs, mockDb);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.total).toBe(2);
      expect(res.value.compras).toBe(1);
      expect(res.value.ventas).toBe(1);
    }
  });

  it("handles empty document list gracefully", async () => {
    const res = await syncMarangatuDocuments(entityId, [], mockDb);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.total).toBe(0);
      expect(res.value.compras).toBe(0);
      expect(res.value.ventas).toBe(0);
    }
  });
});
