import { describe, expect, it } from "vitest";
import { todayInAsuncion } from "@ledger/src/usecases/reverse-entry";

describe("todayInAsuncion", () => {
  it("uses the Paraguay calendar day, not UTC", () => {
    // 01:30 UTC on the 2nd is still the 1st (UTC-3) in Asunción
    expect(todayInAsuncion(new Date("2026-10-02T01:30:00Z")).toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(todayInAsuncion(new Date("2026-10-02T12:00:00Z")).toISOString()).toBe("2026-10-02T00:00:00.000Z");
  });
});
