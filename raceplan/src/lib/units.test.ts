import { describe, expect, it } from "vitest";
import {
  formatClock,
  formatDistance,
  formatDuration,
  formatPace,
  formatPaceRange,
  metersToUnit,
  parseClock,
  parseDecimal,
  unitToMeters,
} from "./units";

describe("units", () => {
  it("round-trips km and miles", () => {
    expect(unitToMeters(metersToUnit(12_345, "mi"), "mi")).toBeCloseTo(12_345);
    expect(metersToUnit(1609.344, "mi")).toBeCloseTo(1);
  });

  it("formats distances per locale", () => {
    expect(formatDistance(12_500, "km", "en")).toBe("12.5 km");
    expect(formatDistance(12_500, "km", "fr")).toBe("12,5 km");
  });

  it("formats paces in the selected unit", () => {
    expect(formatPace(300, "km")).toBe("5:00 /km");
    expect(formatPace(300, "mi")).toBe("8:03 /mi");
    expect(formatPaceRange({ fastSPerKm: 290, slowSPerKm: 310 }, "km")).toBe("4:50–5:10 /km");
  });

  it("formats clock and durations", () => {
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatClock(1500)).toBe("25:00");
    expect(formatDuration(45 * 60)).toBe("45 min");
    expect(formatDuration(90 * 60)).toBe("1 h 30");
    expect(formatDuration(20)).toBe("20 s");
  });

  it("parses clock input", () => {
    expect(parseClock("1:45:30")).toBe(6330);
    expect(parseClock("25:00")).toBe(1500);
    expect(parseClock("45")).toBe(2700);
    expect(parseClock("25:75")).toBeNull();
    expect(parseClock("abc")).toBeNull();
    expect(parseClock("")).toBeNull();
  });

  it("parses decimals with comma or dot", () => {
    expect(parseDecimal("12,5")).toBe(12.5);
    expect(parseDecimal("12.5")).toBe(12.5);
    expect(parseDecimal("x")).toBeNull();
  });
});
