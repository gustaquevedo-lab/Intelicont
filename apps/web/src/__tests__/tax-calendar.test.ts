import { describe, expect, it } from "vitest";
import { buildCalendar, daysLeft, dueDateFor, levelFor } from "@intelicont/ledger/tax-calendar";

describe("tax calendar rule (unverified formula, see tax-calendar.ts)", () => {
  it("dueDateFor puts the due date in the month after the period", () => {
    // RUC body ends in 1 -> day 11; 2026-09 is due in October, 2026-12 in January of the next year.
    expect(dueDateFor(2026, 9, "1234561-0")).toBe("2026-10-12"); // Oct 11 2026 is a Sunday -> Monday 12
    expect(dueDateFor(2026, 12, "1234561-0")).toBe("2027-01-11"); // Monday
  });

  it("dueDateFor uses 10 plus the last digit of the RUC body", () => {
    expect(dueDateFor(2026, 9, "80014066-4")).toBe("2026-10-16"); // body ends in 6, not the DV 4
    expect(dueDateFor(2026, 9, "80014066")).toBe("2026-10-16"); // body only
    expect(dueDateFor(2026, 9, "1234567-9")).toBe("2026-10-19"); // Oct 17 is a Saturday -> Monday 19
  });

  it("dueDateFor rejects a month outside 1..12", () => {
    expect(() => dueDateFor(2026, 0, "1234567-9")).toThrow(RangeError);
    expect(() => dueDateFor(2026, 13, "1234567-9")).toThrow(RangeError);
  });

  it("weekend due dates move forward to Monday", () => {
    expect(dueDateFor(2026, 9, "1234560-0")).toBe("2026-10-12"); // Sat Oct 10 -> Mon 12
    expect(dueDateFor(2026, 9, "1234561-0")).toBe("2026-10-12"); // Sun Oct 11 -> Mon 12
    expect(dueDateFor(2026, 9, "1234562-0")).toBe("2026-10-12"); // Mon Oct 12 stays
  });

  it("dueDateFor does not depend on the process timezone", () => {
    const original = process.env.TZ;
    try {
      const results = ["Pacific/Auckland", "America/Asuncion", "Pacific/Honolulu"].map((tz) => {
        process.env.TZ = tz;
        return [dueDateFor(2026, 9, "80014066-4"), dueDateFor(2026, 12, "1234567-9"), dueDateFor(2027, 2, "1234560-0")];
      });
      for (const r of results) expect(r).toEqual(["2026-10-16", "2027-01-18", "2027-03-10"]);
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });

  it("buildCalendar generates 104 and 955 for IVA_GRAL only", () => {
    const rows = buildCalendar({ ruc: "80014066-4", regimes: ["IVA_GRAL", "IRE_GRAL"], fromYear: 2026, fromMonth: 11, months: 3 });
    expect(rows).toEqual([
      { obligation: "104", period: "2026-11", dueDate: "2026-12-16" },
      { obligation: "955", period: "2026-11", dueDate: "2026-12-16" },
      { obligation: "104", period: "2026-12", dueDate: "2027-01-18" }, // Jan 16 2027 is a Saturday
      { obligation: "955", period: "2026-12", dueDate: "2027-01-18" },
      { obligation: "104", period: "2027-01", dueDate: "2027-02-16" },
      { obligation: "955", period: "2027-01", dueDate: "2027-02-16" },
    ]);
    expect(buildCalendar({ ruc: "80014066-4", regimes: ["IRE_GRAL"], fromYear: 2026, fromMonth: 11, months: 3 })).toEqual([]);
    expect(buildCalendar({ ruc: "80014066-4", regimes: [], fromYear: 2026, fromMonth: 11, months: 3 })).toEqual([]);
  });

  it("daysLeft counts calendar days between date strings", () => {
    expect(daysLeft("2026-10-16", "2026-10-09")).toBe(7);
    expect(daysLeft("2026-10-16", "2026-10-16")).toBe(0);
    expect(daysLeft("2026-10-16", "2026-10-17")).toBe(-1);
    expect(daysLeft("2027-01-02", "2026-12-30")).toBe(3); // across a year
    expect(daysLeft("2026-03-30", "2026-03-27")).toBe(3);
  });

  it("levelFor maps 7, 3, 1 days and overdue", () => {
    expect(levelFor(-1)).toBe("overdue");
    expect(levelFor(0)).toBe("1");
    expect(levelFor(1)).toBe("1");
    expect(levelFor(2)).toBe("3");
    expect(levelFor(3)).toBe("3");
    expect(levelFor(4)).toBe("7");
    expect(levelFor(7)).toBe("7");
    expect(levelFor(8)).toBeNull();
  });
});
