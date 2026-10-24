import { describe, expect, it } from "vitest";
import { validateEntryForm, type EntryFormState } from "@/lib/entry-form";

const base = (over: Partial<EntryFormState> = {}): EntryFormState => ({
  entityId: "e1",
  period: { id: "p1", year: 2026, month: 10 },
  date: "2026-10-15",
  description: "Aporte de capital",
  lines: [
    { accountId: "a1", debit: 1_500_000, credit: 0, description: "" },
    { accountId: "a2", debit: 0, credit: 1_500_000, description: "" },
  ],
  ...over,
});
const has = (s: EntryFormState, re: RegExp) => validateEntryForm(s).errors.some((e) => re.test(e));

describe("validateEntryForm", () => {
  it("valid entry returns ok with totals", () => {
    expect(validateEntryForm(base())).toEqual({ ok: true, errors: [], totals: { debit: 1_500_000, credit: 1_500_000, diff: 0 } });
  });
  it("needs at least two lines with an account", () => {
    const s = base({ lines: [{ accountId: "a1", debit: 10, credit: 0, description: "" }, { accountId: "", debit: 0, credit: 0, description: "" }] });
    expect(validateEntryForm(s).ok).toBe(false);
    expect(has(s, /al menos dos líneas/)).toBe(true);
  });
  it("a line cannot have both debit and credit", () => {
    const s = base({ lines: [{ accountId: "a1", debit: 5, credit: 5, description: "" }, { accountId: "a2", debit: 0, credit: 5, description: "" }, { accountId: "a3", debit: 5, credit: 0, description: "" }] });
    expect(has(s, /Debe o en el Haber, no en ambos/)).toBe(true);
  });
  it("totals must balance", () => {
    const s = base({ lines: [{ accountId: "a1", debit: 100, credit: 0, description: "" }, { accountId: "a2", debit: 0, credit: 60, description: "" }] });
    const r = validateEntryForm(s);
    expect(r.ok).toBe(false);
    expect(r.totals).toEqual({ debit: 100, credit: 60, diff: 40 });
    expect(has(s, /no está balanceado/)).toBe(true);
  });
  it("date must be inside the period month", () => {
    expect(has(base({ date: "2026-09-30" }), /fecha.*período/i)).toBe(true);
    expect(has(base({ date: "" }), /fecha/i)).toBe(true);
    expect(validateEntryForm(base({ date: "2026-10-31" })).ok).toBe(true);
  });
  it("description is required", () => {
    expect(has(base({ description: "   " }), /descripción es obligatoria/)).toBe(true);
    expect(has(base({ description: "x".repeat(501) }), /500/)).toBe(true);
  });
  it("ignores fully blank lines and flags amounts without account", () => {
    const blank = { accountId: "", debit: 0, credit: 0, description: "" };
    expect(validateEntryForm(base({ lines: [...base().lines, blank] })).ok).toBe(true);
    expect(has(base({ lines: [...base().lines, { ...blank, debit: 3 }] }), /cuenta/)).toBe(true);
  });
});
