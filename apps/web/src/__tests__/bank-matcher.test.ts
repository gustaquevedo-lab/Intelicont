import { describe, it, expect } from "vitest";
import { matchBankToGL, type BankMovement, type GLTransaction } from "@/lib/bank-matcher";

describe("Bank Matcher", () => {
  const createBankMovement = (overrides: Partial<BankMovement> = {}): BankMovement => ({
    id: `bm-${Date.now()}`,
    date: "2026-05-15",
    amount: 1000000,
    direction: "debit",
    description: "Test movement",
    ref: "REF-001",
    ...overrides,
  });

  const createGLTransaction = (overrides: Partial<GLTransaction> = {}): GLTransaction => ({
    id: `gl-${Date.now()}`,
    date: "2026-05-15",
    amount: 1000000,
    direction: "credit",
    description: "Test GL transaction",
    ...overrides,
  });

  describe("matchBankToGL", () => {
    it("should match exact amount and same date", () => {
      const bankMovements = [createBankMovement({ amount: 5000000, direction: "debit" })];
      const glTransactions = [createGLTransaction({ amount: 5000000, direction: "credit" })];

      const result = matchBankToGL(bankMovements, glTransactions);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].score).toBeGreaterThanOrEqual(45);
    });

    it("should match with date tolerance", () => {
      const bankMovements = [createBankMovement({ date: "2026-05-15", amount: 3000000, direction: "debit" })];
      const glTransactions = [createGLTransaction({ date: "2026-05-17", amount: 3000000, direction: "credit" })];

      const result = matchBankToGL(bankMovements, glTransactions);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].score).toBeGreaterThanOrEqual(45);
    });

    it("should not match same direction transactions", () => {
      const bankMovements = [createBankMovement({ amount: 1000000, direction: "debit" })];
      const glTransactions = [createGLTransaction({ amount: 1000000, direction: "debit" })];

      const result = matchBankToGL(bankMovements, glTransactions);

      expect(result.matches).toHaveLength(0);
      expect(result.unmatchedBank).toHaveLength(1);
      expect(result.unmatchedGL).toHaveLength(1);
    });

    it("should handle unmatched items", () => {
      const bankMovements = [
        createBankMovement({ id: "bm-1", amount: 1000000, direction: "debit" }),
        createBankMovement({ id: "bm-2", amount: 2000000, direction: "credit" }),
      ];
      const glTransactions = [
        createGLTransaction({ id: "gl-1", amount: 500000, direction: "credit" }),
      ];

      const result = matchBankToGL(bankMovements, glTransactions);

      expect(result.matches).toHaveLength(0);
      expect(result.unmatchedBank).toHaveLength(2);
      expect(result.unmatchedGL).toHaveLength(1);
    });

    it("should calculate overall confidence", () => {
      const bankMovements = [
        createBankMovement({ id: "bm-1", amount: 5000000, direction: "debit", date: "2026-05-15" }),
        createBankMovement({ id: "bm-2", amount: 3000000, direction: "credit", date: "2026-05-16" }),
      ];
      const glTransactions = [
        createGLTransaction({ id: "gl-1", amount: 5000000, direction: "credit", date: "2026-05-15" }),
        createGLTransaction({ id: "gl-2", amount: 3000000, direction: "debit", date: "2026-05-16" }),
      ];

      const result = matchBankToGL(bankMovements, glTransactions);

      expect(result.summary.matchedCount).toBe(2);
      expect(result.summary.overallConfidence).toBeGreaterThan(0);
    });

    it("should respect tolerance parameter", () => {
      const bankMovements = [createBankMovement({ amount: 1200000, direction: "debit" })];
      const glTransactions = [createGLTransaction({ amount: 1000000, direction: "credit" })];

      const strictResult = matchBankToGL(bankMovements, glTransactions, 0.1);
      expect(strictResult.matches).toHaveLength(0);

      const looseResult = matchBankToGL(bankMovements, glTransactions, 0.25);
      expect(looseResult.matches).toHaveLength(1);
    });
  });

  describe("summary", () => {
    it("should provide correct summary counts", () => {
      const bankMovements = [
        createBankMovement({ id: "bm-1", amount: 1000000, direction: "debit" }),
        createBankMovement({ id: "bm-2", amount: 2000000, direction: "credit" }),
      ];
      const glTransactions = [
        createGLTransaction({ id: "gl-1", amount: 1000000, direction: "credit" }),
      ];

      const result = matchBankToGL(bankMovements, glTransactions);

      expect(result.summary.totalBank).toBe(2);
      expect(result.summary.totalGL).toBe(1);
      expect(result.summary.matchedCount).toBe(1);
      expect(result.summary.unmatchedBankCount).toBe(1);
      expect(result.summary.unmatchedGLCount).toBe(0);
    });
  });
});
