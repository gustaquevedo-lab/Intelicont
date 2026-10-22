import { describe, it, expect } from "vitest";
import { assertMoney, ivaFromGross } from "@intelicont/core";

describe("integer money", () => {
  it("computes IVA from gross, rounded to integer", () => {
    expect(ivaFromGross(58000, 10)).toBe(5273);
    expect(ivaFromGross(11000000, 10)).toBe(1000000);
    expect(ivaFromGross(105000, 5)).toBe(5000);
  });
  it("assertMoney rejects non-integers and unsafe integers", () => {
    expect(assertMoney(1000)).toBe(1000);
    expect(() => assertMoney(1.5)).toThrow();
    expect(() => assertMoney(2 ** 53)).toThrow();
    expect(() => assertMoney(NaN)).toThrow();
  });
});
