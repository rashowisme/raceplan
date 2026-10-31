import { describe, expect, it } from "vitest";
import { generatePlan } from "@/engine";
import {
  convertUnits,
  DEFAULT_VALUES,
  stepOfField,
  toProfile,
  validateStep,
  validateWithEngine,
  type PlanFormValues,
} from "./form-model";

const TODAY = "2026-10-31";

const filled: PlanFormValues = {
  ...DEFAULT_VALUES,
  raceType: "half",
  raceDate: "2027-03-14",
  prTime: "1:58:30",
  prDate: "2026-05-01",
  targetTime: "1:55:00",
  currentVolume: "30",
  longestRun: "14",
  maxVolume: "50",
  yearsRunning: "1to3",
  availableDays: ["tue", "thu", "sat", "sun"],
  longRunDay: "sun",
  injuries: { itBand: "once" },
  age: "38",
  sex: "female",
  planStyle: "balanced",
  likes: ["hills"],
  dislikes: ["track"],
};

const codes = (
  step: Parameters<typeof validateStep>[0],
  v: PlanFormValues,
  unit: "km" | "mi" = "km",
) => Object.fromEntries(validateStep(step, v, unit, TODAY).map((e) => [e.field, e.message]));

describe("step validation", () => {
  it("accepts a complete form", () => {
    for (const step of ["race", "fitness", "training", "health", "style"] as const) {
      expect(codes(step, filled)).toEqual({});
    }
  });

  it("requires the race fields", () => {
    expect(codes("race", DEFAULT_VALUES)).toMatchObject({
      raceType: "required",
      raceDate: "required",
    });
    expect(codes("race", { ...filled, raceDate: "2026-10-01" })).toEqual({
      raceDate: "race_in_past",
    });
  });

  it("validates custom and trail distances in the current unit", () => {
    expect(codes("race", { ...filled, raceType: "custom", distance: "" })).toEqual({
      distance: "required",
    });
    expect(codes("race", { ...filled, raceType: "custom", distance: "50" })).toEqual({
      distance: "too_large",
    });
    // 30 miles = 48 km → too long for a road race.
    expect(codes("race", { ...filled, raceType: "custom", distance: "30" }, "mi")).toEqual({
      distance: "too_large",
    });
    expect(
      codes("race", { ...filled, raceType: "trail", distance: "30", elevationGain: "" }),
    ).toEqual({
      elevationGain: "required",
    });
  });

  it("checks start date bounds", () => {
    expect(codes("race", { ...filled, startDate: "2026-10-01" })).toEqual({
      startDate: "start_in_past",
    });
    expect(codes("race", { ...filled, startDate: "2027-03-14" })).toEqual({
      startDate: "start_after_race",
    });
  });

  it("validates time formats", () => {
    expect(codes("fitness", { ...filled, prTime: "1h58" })).toEqual({ prTime: "time_format" });
    expect(codes("fitness", { ...filled, prTime: "", prDate: "2026-01-01" })).toEqual({
      prTime: "required",
    });
  });

  it("validates training inputs", () => {
    expect(codes("training", { ...filled, availableDays: ["sun"] })).toMatchObject({
      availableDays: "min_days",
    });
    expect(codes("training", { ...filled, longRunDay: "mon" })).toEqual({
      longRunDay: "long_day_not_available",
    });
    expect(codes("training", { ...filled, currentVolume: "abc" })).toEqual({
      currentVolume: "number",
    });
    expect(codes("training", { ...filled, maxVolume: "1" })).toEqual({ maxVolume: "too_small" });
  });

  it("blocks currently injured runners and checks age", () => {
    expect(codes("health", { ...filled, currentlyInjured: true })).toEqual({
      currentlyInjured: "currently_injured",
    });
    expect(codes("health", { ...filled, age: "12" })).toEqual({ age: "too_small" });
    expect(codes("health", { ...filled, age: "30.5" })).toEqual({ age: "integer" });
  });
});

describe("toProfile", () => {
  it("converts to a metric profile the engine accepts", () => {
    const p = toProfile(filled, "km");
    expect(p).toMatchObject({
      race: { type: "half", date: "2027-03-14" },
      personalRecord: { timeS: 7110, achievedOn: "2026-05-01" },
      targetTimeS: 6900,
      currentWeeklyVolumeM: 30_000,
      longestRecentRunM: 14_000,
      maxWeeklyVolumeM: 50_000,
      injuries: [{ type: "itBand", frequency: "once" }],
      age: 38,
      preferences: { likes: ["hills"], dislikes: ["track"] },
    });
    expect(generatePlan(p, { today: TODAY }).ok).toBe(true);
  });

  it("converts miles and feet", () => {
    const p = toProfile(
      {
        ...filled,
        raceType: "trail",
        distance: "20",
        elevationGain: "3281",
        currentVolume: "20",
        maxVolume: "30",
      },
      "mi",
    );
    expect(p.race.distanceM).toBe(32_187);
    expect(p.race.elevationGainM).toBe(1000);
    expect(p.currentWeeklyVolumeM).toBe(32_187);
  });

  it("round-trips unit conversion of typed values", () => {
    const mi = convertUnits(filled, "km", "mi");
    expect(mi.currentVolume).toBe("18.64");
    expect(convertUnits(mi, "mi", "km").currentVolume).toBe("30");
  });
});

describe("validateWithEngine", () => {
  it("maps engine issues to form fields", () => {
    // 5 minutes for a half marathon is implausible.
    const r = validateWithEngine({ ...filled, prTime: "5:00" }, "km", TODAY);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors[0]).toMatchObject({ field: "prTime", message: "implausible_time" });
      expect(stepOfField(r.errors[0]!.field)).toBe("fitness");
    }
  });

  it("returns refusals", () => {
    const r = validateWithEngine({ ...filled, raceType: "custom", distance: "45" }, "km", TODAY);
    expect(r).toMatchObject({ ok: false, refusal: "distance_not_supported" });
  });
});
