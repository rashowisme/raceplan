import { describe, expect, it } from "vitest";
import { addDays, diffDays, mondayOf, monthsBetween, nextMondayOrSame, weekdayOf } from "./dates";

describe("dates", () => {
  it("adds days across month and DST boundaries", () => {
    expect(addDays("2026-10-24", 7)).toBe("2026-10-31");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("computes weekdays (Monday first)", () => {
    expect(weekdayOf("2026-11-02")).toBe("mon");
    expect(weekdayOf("2026-10-31")).toBe("sat");
    expect(weekdayOf("2026-11-01")).toBe("sun");
  });

  it("finds Mondays", () => {
    expect(mondayOf("2026-11-01")).toBe("2026-10-26");
    expect(mondayOf("2026-11-02")).toBe("2026-11-02");
    expect(nextMondayOrSame("2026-10-31")).toBe("2026-11-02");
    expect(nextMondayOrSame("2026-11-02")).toBe("2026-11-02");
  });

  it("diffs days and months", () => {
    expect(diffDays("2026-11-02", "2026-11-09")).toBe(7);
    expect(monthsBetween("2025-10-31", "2026-10-31")).toBe(12);
    expect(monthsBetween("2025-11-01", "2026-10-31")).toBe(11);
  });
});
