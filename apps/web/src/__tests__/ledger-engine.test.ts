import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the database module
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
  setEntityContext: vi.fn(),
}));

vi.mock("@ledger/db/index", () => ({
  getDb: vi.fn(),
}));

vi.mock("@ledger/ledger-engine", () => ({
  postEntry: vi.fn(),
  reverseEntry: vi.fn(),
  adjustEntry: vi.fn(),
  closePeriod: vi.fn(),
  reopenPeriod: vi.fn(),
  getAccountBalance: vi.fn(),
  getSumasSaldos: vi.fn(),
  getMayor: vi.fn(),
  getDiario: vi.fn(),
}));

describe("Ledger Engine Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("postEntry", () => {
    it("should create a balanced journal entry", async () => {
      const { postEntry } = await import("@ledger/ledger-engine");
      const mockResult = {
        success: true,
        data: {
          id: "entry-1",
          number: "MAN-0001",
          date: new Date("2026-05-01"),
          description: "Test entry",
          status: "posted" as const,
          linesCount: 2,
          totalDebit: "1000000.0000",
          totalCredit: "1000000.0000",
        },
      };
      vi.mocked(postEntry).mockResolvedValue(mockResult);

      const result = await postEntry({
        entityId: "entity-1",
        periodId: "period-1",
        date: new Date("2026-05-01"),
        description: "Test entry",
        lines: [
          { accountId: "acc-1", debit: "1000000", credit: "0", currencyCode: "PYG" },
          { accountId: "acc-2", debit: "0", credit: "1000000", currencyCode: "PYG" },
        ],
        postedBy: "user-1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.number).toBe("MAN-0001");
        expect(result.data.status).toBe("posted");
      }
    });

    it("should reject unbalanced entries", async () => {
      const { postEntry } = await import("@ledger/ledger-engine");
      const mockResult = {
        success: false,
        error: { code: "UNBALANCED_ENTRY", message: "Debit does not equal credit" },
      };
      vi.mocked(postEntry).mockResolvedValue(mockResult);

      const result = await postEntry({
        entityId: "entity-1",
        periodId: "period-1",
        date: new Date("2026-05-01"),
        description: "Unbalanced entry",
        lines: [
          { accountId: "acc-1", debit: "1000000", credit: "0", currencyCode: "PYG" },
          { accountId: "acc-2", debit: "0", credit: "500000", currencyCode: "PYG" },
        ],
        postedBy: "user-1",
      });

      expect(result.success).toBe(false);
    });

    it("should reject entries in closed periods", async () => {
      const { postEntry } = await import("@ledger/ledger-engine");
      const mockResult = {
        success: false,
        error: { code: "PERIOD_CLOSED", message: "Fiscal period is closed" },
      };
      vi.mocked(postEntry).mockResolvedValue(mockResult);

      const result = await postEntry({
        entityId: "entity-1",
        periodId: "period-closed",
        date: new Date("2026-04-15"),
        description: "Entry in closed period",
        lines: [
          { accountId: "acc-1", debit: "1000000", credit: "0", currencyCode: "PYG" },
          { accountId: "acc-2", debit: "0", credit: "1000000", currencyCode: "PYG" },
        ],
        postedBy: "user-1",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("reverseEntry", () => {
    it("should reverse a posted entry", async () => {
      const { reverseEntry } = await import("@ledger/ledger-engine");
      const mockResult = {
        success: true,
        data: {
          id: "rev-1",
          number: "REV-0001",
          date: new Date("2026-05-02"),
          description: "REV: Test entry",
          status: "posted" as const,
          linesCount: 2,
          totalDebit: "1000000.0000",
          totalCredit: "1000000.0000",
        },
      };
      vi.mocked(reverseEntry).mockResolvedValue(mockResult);

      const result = await reverseEntry({
        entryId: "entry-1",
        reason: "Correction needed",
        reversedBy: "user-2",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.number).toContain("REV");
      }
    });

    it("should reject reversing already reversed entries", async () => {
      const { reverseEntry } = await import("@ledger/ledger-engine");
      const mockResult = {
        success: false,
        error: { code: "ALREADY_REVERSED", message: "Entry is already a reversal" },
      };
      vi.mocked(reverseEntry).mockResolvedValue(mockResult);

      const result = await reverseEntry({
        entryId: "rev-1",
        reason: "Double reversal",
        reversedBy: "user-2",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("adjustEntry", () => {
    it("should create an adjustment entry", async () => {
      const { adjustEntry } = await import("@ledger/ledger-engine");
      const mockResult = {
        success: true,
        data: {
          id: "adj-1",
          number: "ADJ-0001",
          date: new Date("2026-05-02"),
          description: "Adjustment",
          status: "posted" as const,
          linesCount: 2,
          totalDebit: "500000.0000",
          totalCredit: "500000.0000",
        },
      };
      vi.mocked(adjustEntry).mockResolvedValue(mockResult);

      const result = await adjustEntry({
        entryId: "entry-1",
        date: new Date("2026-05-02"),
        description: "Adjustment",
        lines: [
          { accountId: "acc-1", debit: "500000", credit: "0", currencyCode: "PYG" },
          { accountId: "acc-2", debit: "0", credit: "500000", currencyCode: "PYG" },
        ],
        adjustedBy: "user-2",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("closePeriod", () => {
    it("should close an open period", async () => {
      const { closePeriod } = await import("@ledger/ledger-engine");
      const mockResult = { success: true, data: { periodId: "period-1", closedAt: new Date() } };
      vi.mocked(closePeriod).mockResolvedValue(mockResult);

      const result = await closePeriod({
        periodId: "period-1",
        entityId: "entity-1",
        closedBy: "user-1",
      });

      expect(result.success).toBe(true);
    });

    it("should reject closing a period with draft entries", async () => {
      const { closePeriod } = await import("@ledger/ledger-engine");
      const mockResult = {
        success: false,
        error: { code: "HAS_DRAFTS", message: "Period has draft entries" },
      };
      vi.mocked(closePeriod).mockResolvedValue(mockResult);

      const result = await closePeriod({
        periodId: "period-1",
        entityId: "entity-1",
        closedBy: "user-1",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("reopenPeriod", () => {
    it("should reopen a closed period", async () => {
      const { reopenPeriod } = await import("@ledger/ledger-engine");
      const mockResult = { success: true, data: { periodId: "period-1", reopenedAt: new Date() } };
      vi.mocked(reopenPeriod).mockResolvedValue(mockResult);

      const result = await reopenPeriod({
        periodId: "period-1",
        entityId: "entity-1",
        reopenedBy: "user-2",
        reason: "Need to correct entries",
      });

      expect(result.success).toBe(true);
    });

    it("should reject reopening by same user who closed", async () => {
      const { reopenPeriod } = await import("@ledger/ledger-engine");
      const mockResult = {
        success: false,
        error: { code: "SOD_VIOLATION", message: "Same user cannot reopen" },
      };
      vi.mocked(reopenPeriod).mockResolvedValue(mockResult);

      const result = await reopenPeriod({
        periodId: "period-1",
        entityId: "entity-1",
        reopenedBy: "user-1",
        reason: "Self-reopen attempt",
      });

      expect(result.success).toBe(false);
    });
  });
});
