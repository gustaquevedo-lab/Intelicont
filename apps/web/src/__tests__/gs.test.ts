import { describe, expect, it } from "vitest";
import { formatGs, parseGs, parseGsInput } from "@/lib/gs";

describe("gs", () => {
  it("parseGs handles thousands separators and rejects decimals and letters", () => {
    expect(parseGs("1.234.567")).toBe(1234567);
    expect(parseGs("1500000")).toBe(1500000);
    expect(parseGs(" 0 ")).toBe(0);
    expect(parseGs("")).toBe(0);
    for (const bad of ["1,5", "1.234,5", "12a", "-5", "1.23", "1..234", "99999999999999999999"]) expect(parseGs(bad), bad).toBeNull();
  });
  it("formatGs groups thousands", () => {
    expect(formatGs(1234567)).toBe("1.234.567");
    expect(formatGs(999)).toBe("999");
    expect(formatGs(1000)).toBe("1.000");
    expect(formatGs(0)).toBe("0");
  });

  it("pasting 1.234,50 is rejected and never inflated", () => {
    for (const pasted of ["1.234,50", "1.50", "1,5", "12abc"]) {
      expect(parseGsInput("", pasted), pasted).toBeNull();
      expect(parseGsInput("500", pasted), pasted).toBeNull();
    }
    expect(parseGsInput("1", "1,")).toBeNull();
  });
  it("typing digits one by one keeps the number", () => {
    let shown = "";
    for (const ch of "1234567") {
      const n = parseGsInput(shown, shown + ch);
      expect(n).not.toBeNull();
      shown = formatGs(n!);
    }
    expect(shown).toBe("1.234.567");
    expect(parseGsInput("1.234.567", "1.234.56")).toBe(123456); // Backspace
    expect(parseGsInput("1.234", "1.2345")).toBe(12345);
  });
  it("pasting 1.234.567 is accepted", () => {
    expect(parseGsInput("", "1.234.567")).toBe(1234567);
    expect(parseGsInput("9", "1.234.567")).toBe(1234567);
  });
});
