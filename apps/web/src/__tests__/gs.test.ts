import { describe, expect, it } from "vitest";
import { formatGs, parseGs } from "@/lib/gs";

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
});
