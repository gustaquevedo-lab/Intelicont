import { Decimal } from "decimal.js";
import type { JournalEntry, JournalLine } from "./domain";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalDebits: Record<string, string>;
    totalCredits: Record<string, string>;
    imbalancesByCurrency: Record<string, string>;
  };
}

const DECIMAL_PLACES = 4;
const MAX_AMOUNT = new Decimal("999999999.9999");

export class JournalValidator {
  /**
   * Validate double-entry bookkeeping: debits = credits per currency
   * - Each line must have debit XOR credit (not both)
   * - Sum(debits) === Sum(credits) per currency
   * - Decimals must be max 4 places
   * - Amounts must be positive
   * - Accounts must exist and be valid
   */
  static validateJournalEntry(
    entry: JournalEntry,
    options?: {
      validateAccounts?: (accountIds: string[]) => Record<string, boolean>;
      throwOnError?: boolean;
    }
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const totalDebits: Record<string, string> = {};
    const totalCredits: Record<string, string> = {};
    const imbalances: Record<string, string> = {};

    if (!entry.lines || entry.lines.length === 0) {
      errors.push("Journal entry must have at least one line");
      return {
        valid: false,
        errors,
        warnings,
        summary: { totalDebits, totalCredits, imbalancesByCurrency: imbalances },
      };
    }

    // Validate each line
    for (let i = 0; i < entry.lines.length; i++) {
      const line = entry.lines[i];
      const lineNum = i + 1;

      // Validate debit/credit mutually exclusive
      const hasDebit = !!line.debit && new Decimal(line.debit).greaterThan(0);
      const hasCredit = !!line.credit && new Decimal(line.credit).greaterThan(0);

      if (hasDebit && hasCredit) {
        errors.push(
          `Line ${lineNum}: Cannot have both debit and credit. Use one or the other.`
        );
      }

      if (!hasDebit && !hasCredit) {
        errors.push(`Line ${lineNum}: Must have either a debit or credit amount.`);
      }

      // Validate decimal places
      if (line.debit) {
        const debitErr = this._validateDecimalPlaces(line.debit, lineNum, "debit");
        if (debitErr) errors.push(debitErr);
      }

      if (line.credit) {
        const creditErr = this._validateDecimalPlaces(
          line.credit,
          lineNum,
          "credit"
        );
        if (creditErr) errors.push(creditErr);
      }

      // Validate positive amounts
      if (line.debit && new Decimal(line.debit).lessThan(0)) {
        errors.push(`Line ${lineNum}: Debit amount cannot be negative.`);
      }

      if (line.credit && new Decimal(line.credit).lessThan(0)) {
        errors.push(`Line ${lineNum}: Credit amount cannot be negative.`);
      }

      // Validate max amount
      if (line.debit && new Decimal(line.debit).greaterThan(MAX_AMOUNT)) {
        errors.push(`Line ${lineNum}: Debit amount exceeds maximum.`);
      }

      if (line.credit && new Decimal(line.credit).greaterThan(MAX_AMOUNT)) {
        errors.push(`Line ${lineNum}: Credit amount exceeds maximum.`);
      }

      // Accumulate debits and credits by currency
      const currency = line.currencyCode || "PYG";

      if (hasDebit) {
        const current = totalDebits[currency]
          ? new Decimal(totalDebits[currency])
          : new Decimal(0);
        totalDebits[currency] = current.plus(line.debit).toString();
      }

      if (hasCredit) {
        const current = totalCredits[currency]
          ? new Decimal(totalCredits[currency])
          : new Decimal(0);
        totalCredits[currency] = current.plus(line.credit).toString();
      }
    }

    // Validate double-entry balance per currency
    const currencies = new Set([
      ...Object.keys(totalDebits),
      ...Object.keys(totalCredits),
    ]);

    for (const currency of currencies) {
      const debit = new Decimal(totalDebits[currency] || "0");
      const credit = new Decimal(totalCredits[currency] || "0");

      if (!debit.equals(credit)) {
        const diff = debit.minus(credit).abs();
        imbalances[currency] = diff.toString();
        errors.push(
          `Double-entry balance failed for ${currency}: ` +
            `Debits (${debit.toString()}) ≠ Credits (${credit.toString()}) ` +
            `[Imbalance: ${diff.toString()}]`
        );
      }
    }

    // Validate accounts exist (if validator provided)
    if (options?.validateAccounts) {
      const accountIds = entry.lines.map((l) => l.accountId).filter(Boolean);
      const validAccounts = options.validateAccounts(accountIds);

      for (let i = 0; i < entry.lines.length; i++) {
        const line = entry.lines[i];
        if (line.accountId && !validAccounts[line.accountId]) {
          errors.push(`Line ${i + 1}: Account ${line.accountId} does not exist.`);
        }
      }
    }

    const valid = errors.length === 0;

    if (!valid && options?.throwOnError) {
      throw new ValidationError(
        `Journal entry validation failed:\n${errors.join("\n")}`,
        errors,
        warnings
      );
    }

    return {
      valid,
      errors,
      warnings,
      summary: {
        totalDebits,
        totalCredits,
        imbalancesByCurrency: imbalances,
      },
    };
  }

  /**
   * Validate a single amount decimal places
   */
  private static _validateDecimalPlaces(
    amount: string | number,
    lineNum: number,
    type: "debit" | "credit"
  ): string | null {
    try {
      const dec = new Decimal(amount);
      const decimalPlaces = dec.decimalPlaces();

      if (decimalPlaces > DECIMAL_PLACES) {
        return (
          `Line ${lineNum}: ${type.charAt(0).toUpperCase() + type.slice(1)} has ` +
          `${decimalPlaces} decimal places. Maximum is ${DECIMAL_PLACES}.`
        );
      }

      return null;
    } catch (e) {
      return `Line ${lineNum}: Invalid ${type} amount "${amount}"`;
    }
  }

  /**
   * Quick check if entry is balanced (boolean)
   */
  static isBalanced(entry: JournalEntry): boolean {
    const result = this.validateJournalEntry(entry);
    return result.valid;
  }

  /**
   * Get detailed validation errors as formatted string
   */
  static getErrorMessage(result: ValidationResult): string {
    if (result.valid) return "Journal entry is valid.";

    const lines = [
      "Journal entry validation errors:",
      ...result.errors.map((e) => `  • ${e}`),
    ];

    if (result.warnings.length > 0) {
      lines.push("\nWarnings:");
      lines.push(...result.warnings.map((w) => `  ⚠ ${w}`));
    }

    return lines.join("\n");
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: string[],
    public warnings: string[] = []
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
