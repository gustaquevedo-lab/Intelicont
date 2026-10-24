import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

describe("Paso 3: Motor de Cierre Mensual y Anual Real", () => {
  let repo: typeof import("@ledger/db/repository");
  let mockStore: typeof import("@ledger/db/mock").mockStore;
  const prevUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    vi.resetModules();
    const db = await import("@ledger/db/index");
    db.getDb();
    repo = await import("@ledger/db/repository");
    const mockModule = await import("@ledger/db/mock");
    mockStore = mockModule.mockStore;
  });

  afterAll(() => {
    if (prevUrl) process.env.DATABASE_URL = prevUrl;
  });

  it("valida la checklist del período contable", async () => {
    const result = await repo.validatePeriodChecklist("00000000-0000-0000-0000-000000000001", 2026, 5);

    expect(result).toBeDefined();
    expect(result.year).toBe(2026);
    expect(result.month).toBe(5);
    expect(result.checks).toBeDefined();
    expect(result.checks.balanceCuadrado).toBeDefined();
    expect(result.checks.asientosPosteados).toBeDefined();
    expect(typeof result.canClose).toBe("boolean");
  });

  it("cierra y reabre un período fiscal correctamente", async () => {
    const period = mockStore.fiscalPeriods[0];
    expect(period).toBeDefined();

    // Cerrar período
    const closed = await repo.closeFiscalPeriod(period.id, "user-admin-123");
    expect(closed).toBe(true);
    expect(period.status).toBe("closed");
    expect(period.closedAt).toBeInstanceOf(Date);
    expect(period.closedBy).toBe("user-admin-123");

    // Reabrir período
    const reopened = await repo.reopenFiscalPeriod(period.id);
    expect(reopened).toBe(true);
    expect(period.status).toBe("open");
    expect(period.closedAt).toBeNull();
    expect(period.closedBy).toBeNull();
  });

  it("genera asiento de refundición de resultados contables", async () => {
    const period = mockStore.fiscalPeriods[0];

    const result = await repo.generateClosingJournalEntry("00000000-0000-0000-0000-000000000001", period.id, "user-admin-123");
    expect(result.success).toBe(true);
    expect(result.entryId).toBeDefined();

    const entry = mockStore.journalEntries.find((e) => e.id === result.entryId);
    expect(entry).toBeDefined();
    expect(entry?.description).toContain("Refundición de Resultados");
  });
});
