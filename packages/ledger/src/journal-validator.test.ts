import { describe, it, expect } from "vitest";
import { JournalValidator } from "./journal-validator";
import type { JournalEntry, JournalLine } from "./domain";

describe("JournalValidator", () => {
  const mockEntry = (lines: Partial<JournalLine>[]): JournalEntry => ({
    id: "entry-1",
    entityId: "entity-1",
    date: new Date().toISOString(),
    status: "draft",
    lines: lines.map((l) => ({
      accountId: "acc-1",
      currencyCode: "PYG",
      debit: "0",
      credit: "0",
      ...l,
    })),
  });

  describe("Basic Double-Entry Validation", () => {
    it("should pass: simple 2-line balanced entry (debit/credit)", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.0000", credit: "0.0000" },
        { accountId: "acc-2", debit: "0.0000", credit: "100000.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail: unbalanced entry (debit > credit)", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.0000", credit: "0.0000" },
        { accountId: "acc-2", debit: "0.0000", credit: "95000.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("Double-entry"))).toBe(true);
    });

    it("should pass: multi-line balanced entry", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "50000.0000", credit: "0.0000" },
        { accountId: "acc-2", debit: "50000.0000", credit: "0.0000" },
        { accountId: "acc-3", debit: "0.0000", credit: "100000.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail: empty entry", () => {
      const entry: JournalEntry = {
        id: "entry-1",
        entityId: "entity-1",
        date: new Date().toISOString(),
        status: "draft",
        lines: [],
      };

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("at least one line");
    });
  });

  describe("Debit/Credit Validation", () => {
    it("should fail: both debit and credit on same line", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.0000", credit: "100000.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Cannot have both"))).toBe(
        true
      );
    });

    it("should fail: no debit and no credit on line", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "0.0000", credit: "0.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Must have either"))).toBe(
        true
      );
    });
  });

  describe("Decimal Places Validation", () => {
    it("should pass: exactly 4 decimal places", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.1234", credit: "0.0000" },
        { accountId: "acc-2", debit: "0.0000", credit: "100000.1234" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(true);
    });

    it("should pass: less than 4 decimal places", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.12", credit: "0.0000" },
        { accountId: "acc-2", debit: "0.0000", credit: "100000.12" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(true);
    });

    it("should fail: more than 4 decimal places", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.12345", credit: "0.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("decimal places"))).toBe(
        true
      );
    });

    it("should fail: invalid amount format", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "invalid", credit: "0.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Invalid"))).toBe(true);
    });
  });

  describe("Amount Validation", () => {
    it("should fail: negative debit", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "-100000.0000", credit: "0.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("negative"))).toBe(true);
    });

    it("should fail: negative credit", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "0.0000", credit: "-100000.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("negative"))).toBe(true);
    });

    it("should pass: zero amount is skipped", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.0000", credit: "0.0000" },
        { accountId: "acc-2", debit: "0.0000", credit: "100000.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(true);
    });
  });

  describe("Multi-Currency Support", () => {
    it("should pass: separate balance per currency", () => {
      const entry = mockEntry([
        {
          accountId: "acc-1",
          currencyCode: "PYG",
          debit: "100000.0000",
          credit: "0.0000",
        },
        {
          accountId: "acc-2",
          currencyCode: "PYG",
          debit: "0.0000",
          credit: "100000.0000",
        },
        {
          accountId: "acc-3",
          currencyCode: "USD",
          debit: "1000.0000",
          credit: "0.0000",
        },
        {
          accountId: "acc-4",
          currencyCode: "USD",
          debit: "0.0000",
          credit: "1000.0000",
        },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(true);
    });

    it("should fail: unbalanced in one currency", () => {
      const entry = mockEntry([
        {
          accountId: "acc-1",
          currencyCode: "PYG",
          debit: "100000.0000",
          credit: "0.0000",
        },
        {
          accountId: "acc-2",
          currencyCode: "PYG",
          debit: "0.0000",
          credit: "95000.0000",
        },
        {
          accountId: "acc-3",
          currencyCode: "USD",
          debit: "1000.0000",
          credit: "0.0000",
        },
        {
          accountId: "acc-4",
          currencyCode: "USD",
          debit: "0.0000",
          credit: "1000.0000",
        },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("PYG"))).toBe(true);
      expect(result.errors.some((e) => e.includes("USD"))).toBe(false);
    });
  });

  describe("Real-World Scenarios", () => {
    it("should pass: purchase invoice (3-line entry)", () => {
      // Compra de mercadería con IVA y retención
      const entry = mockEntry([
        { accountId: "acc-cost", debit: "10000000.0000", credit: "0.0000" }, // Costo de compra
        { accountId: "acc-iva", debit: "1000000.0000", credit: "0.0000" }, // IVA crédito
        { accountId: "acc-bank", debit: "0.0000", credit: "11000000.0000" }, // Banco a pagar
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(true);
    });

    it("should pass: depreciation entry", () => {
      // Registro de depreciación
      const entry = mockEntry([
        { accountId: "acc-depr", debit: "50000.0000", credit: "0.0000" }, // Gasto de depreciación
        {
          accountId: "acc-depr-accum",
          debit: "0.0000",
          credit: "50000.0000",
        }, // Depreciación acumulada
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(true);
    });

    it("should pass: payroll entry with retention", () => {
      // Nómina con retenciones
      const entry = mockEntry([
        { accountId: "acc-salary", debit: "1000000.0000", credit: "0.0000" }, // Gasto sueldos
        {
          accountId: "acc-salary-payable",
          debit: "0.0000",
          credit: "850000.0000",
        }, // Sueldos por pagar
        { accountId: "acc-ips", debit: "0.0000", credit: "100000.0000" }, // IPS por pagar
        { accountId: "acc-other", debit: "0.0000", credit: "50000.0000" }, // Otros descuentos
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      expect(result.valid).toBe(true);
    });
  });

  describe("isBalanced shortcut", () => {
    it("should return true for balanced entry", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.0000", credit: "0.0000" },
        { accountId: "acc-2", debit: "0.0000", credit: "100000.0000" },
      ]);

      expect(JournalValidator.isBalanced(entry)).toBe(true);
    });

    it("should return false for unbalanced entry", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.0000", credit: "0.0000" },
        { accountId: "acc-2", debit: "0.0000", credit: "95000.0000" },
      ]);

      expect(JournalValidator.isBalanced(entry)).toBe(false);
    });
  });

  describe("Error Message Generation", () => {
    it("should format error message correctly", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.0000", credit: "0.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      const message = JournalValidator.getErrorMessage(result);

      expect(message).toContain("Journal entry validation errors");
      expect(message).toContain("Double-entry");
    });

    it("should return success message for valid entry", () => {
      const entry = mockEntry([
        { accountId: "acc-1", debit: "100000.0000", credit: "0.0000" },
        { accountId: "acc-2", debit: "0.0000", credit: "100000.0000" },
      ]);

      const result = JournalValidator.validateJournalEntry(entry);
      const message = JournalValidator.getErrorMessage(result);

      expect(message).toContain("valid");
    });
  });
});
