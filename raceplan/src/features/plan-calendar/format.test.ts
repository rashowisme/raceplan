import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import en from "../../../messages/en.json";
import fr from "../../../messages/fr.json";
import {
  formatDate,
  formatMessage,
  formatParams,
  formatWarning,
  stepLines,
  zoneLabel,
  type Formatter,
  type Translate,
} from "./format";

const make = (
  locale: "en" | "fr",
  unit: "km" | "mi",
  zoneLabels: Formatter["zoneLabels"] = "daniels",
): Formatter => ({
  t: createTranslator({ locale, messages: locale === "en" ? en : fr }) as unknown as Translate,
  locale,
  unit,
  zoneLabels,
});

describe("format", () => {
  it("formats distance params in the selected unit, reps stay in meters", () => {
    const mi = make("en", "mi");
    expect(formatParams(mi, { rpM: 8000, repM: 400, reps: 6 })).toEqual({
      rpM: "5 mi",
      repM: "400 m",
      reps: 6,
    });
    expect(
      formatMessage(make("en", "km"), { key: "workout.longRacePace.title", params: { rpM: 8000 } }),
    ).toBe("Long run with 8 km at race pace");
    expect(
      formatMessage(make("fr", "km"), { key: "workout.longRacePace.title", params: { rpM: 8000 } }),
    ).toBe("Sortie longue avec 8 km à allure course");
  });

  it("translates warning params (tags, risk flags, volumes)", () => {
    const f = make("en", "mi");
    expect(formatWarning(f, { code: "preference_unmet", params: { tag: "hills" } })).toContain(
      '"Hills"',
    );
    expect(
      formatWarning(f, { code: "risk_flagged", params: { flags: "age50plus,injuryOften" } }),
    ).toContain("age 50+, frequent injuries");
    expect(
      formatWarning(f, { code: "low_max_volume", params: { maxM: 20_000, suggestedM: 45_000 } }),
    ).toContain("12.4 mi");
  });

  it("uses Z1–Z3 labels for 80/20 plans", () => {
    expect(zoneLabel(make("en", "km", "polarized"), "T")).toBe("Zone 2 (moderate)");
    expect(zoneLabel(make("en", "km"), "T")).toBe("Threshold");
  });

  it("flattens repeats into indented step lines with paces", () => {
    const lines = stepLines(make("en", "km"), [
      {
        kind: "warmup",
        duration: { type: "time", seconds: 900 },
        target: { zone: "E", effort: "easy" },
      },
      {
        kind: "repeat",
        count: 5,
        steps: [
          {
            kind: "work",
            duration: { type: "distance", meters: 1000 },
            target: { zone: "I", effort: "interval", pace: { fastSPerKm: 240, slowSPerKm: 245 } },
          },
        ],
      },
    ]);
    expect(lines.map((l) => [l.depth, l.label, l.amount])).toEqual([
      [0, "Warm-up", "15 min"],
      [0, "Repeat 5 times", "5 ×"],
      [1, "Work", "1000 m"],
    ]);
    expect(lines[2]!.target).toBe("Hard · 4:00–4:05 /km");
  });

  it("formats ISO dates without timezone drift", () => {
    expect(formatDate("en", "2027-03-14", { weekday: "long" })).toBe("Sunday");
    expect(formatDate("fr", "2027-03-14", { day: "numeric", month: "long" })).toBe("14 mars");
  });
});
