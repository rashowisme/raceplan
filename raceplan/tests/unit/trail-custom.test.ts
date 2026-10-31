/**
 * M6 — spec §10: trail and custom road distances.
 */
import { describe, expect, it } from "vitest";
import { checkPlan, generatePlan } from "@/engine";
import { minimumWeeks } from "@/engine/builder/frame";
import type { RunnerProfile, TrainingPlan, Workout, WorkoutStep } from "@/engine/types";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../fixtures/runners";

const plan = (p: RunnerProfile): TrainingPlan => {
  const r = generatePlan(p, { today: FIXTURE_TODAY });
  if (!r.ok) throw new Error(r.refusal.code);
  return r.plan;
};
const workouts = (p: TrainingPlan): Workout[] =>
  p.weeks.flatMap((w) => w.days.map((d) => d.workout)).filter((w): w is Workout => !!w);
const flat = (steps: WorkoutStep[]): WorkoutStep[] =>
  steps.flatMap((s) => (s.kind === "repeat" ? flat(s.steps) : [s]));

describe("trail plans", () => {
  const steep = plan(RUNNER_FIXTURES.steepTrail25k!);
  const itBand = plan(RUNNER_FIXTURES.trail30k!);

  it("are safe", () => {
    expect(checkPlan(steep)).toEqual([]);
    expect(checkPlan(itBand)).toEqual([]);
  });

  it("prescribe long runs by time with a climbing target", () => {
    for (const w of workouts(steep).filter((x) => x.isLongRun)) {
      expect(w.steps.every((s) => s.kind !== "repeat" && s.duration.type === "time")).toBe(true);
      expect(w.elevationGainM).toBeGreaterThan(0);
      expect(w.elevationGainM).toBeLessThanOrEqual(1500);
    }
  });

  it("progress weekly D+ from base toward the race ratio", () => {
    const longGain = (phase: string) =>
      Math.max(
        ...steep.weeks
          .filter((w) => w.phase === phase && !w.isCutback)
          .flatMap((w) =>
            w.days.map((d) => (d.workout?.isLongRun ? (d.workout.elevationGainM ?? 0) : 0)),
          ),
      );
    expect(longGain("base")).toBeLessThan(longGain("build"));
    expect(longGain("build")).toBeLessThan(longGain("specific"));
    expect(steep.weeks.some((w) => (w.elevationGainM ?? 0) > 0)).toBe(true);
  });

  it("include uphill repeats, downhill practice in the specific phase and power hiking when steep", () => {
    const specific = steep.weeks.filter((w) => w.phase === "specific").flatMap((w) => w.days);
    expect(specific.some((d) => d.workout?.type === "downhillPractice")).toBe(true);
    expect(workouts(steep).some((w) => w.type === "hillRepeats")).toBe(true);
    const efforts = workouts(steep).flatMap((w) =>
      flat(w.steps).map((s) => s.kind !== "repeat" && s.target.effort),
    );
    expect(efforts).toContain("powerHike");
  });

  it("limits downhill work for IT band / knee history", () => {
    expect(workouts(itBand).some((w) => w.type === "downhillPractice")).toBe(false);
  });

  it("never uses flat race pace on a trail", () => {
    for (const p of [steep, itBand]) {
      expect(workouts(p).some((w) => w.type === "racePace" || w.type === "longRacePace")).toBe(
        false,
      );
      const race = workouts(p).find((w) => w.type === "race")!;
      for (const s of flat(race.steps))
        if (s.kind !== "repeat") expect(s.target.pace).toBeUndefined();
      expect(p.summary.racePaceSPerKm).toBeNull();
    }
  });

  it("uses effort-km for plan length (30 km + 1500 m ≈ 45 effort-km → marathon-like)", () => {
    expect(itBand.summary.effortDistanceM).toBe(45_000);
    expect(minimumWeeks("trail", 45_000, "intermediate")).toBe(12);
  });
});

describe("custom road distances", () => {
  it("interpolate between standard distances", () => {
    expect(minimumWeeks("custom", 15_000, "intermediate")).toBe(9);
    const p = plan(RUNNER_FIXTURES.custom15k!);
    const longest = Math.max(
      ...workouts(p)
        .filter((w) => w.isLongRun)
        .map((w) => w.estDistanceM),
    );
    // Long-run cap between 10K (16 km) and half (21 km).
    expect(longest).toBeLessThanOrEqual(18_500);
  });

  it("refuse road races beyond the marathon and trails beyond 60 effort-km", () => {
    const base = { ...RUNNER_FIXTURES.custom15k!, personalRecord: undefined };
    const refusal = (race: RunnerProfile["race"]) => {
      const r = generatePlan({ ...base, race }, { today: FIXTURE_TODAY });
      return r.ok ? null : r.refusal.code;
    };
    expect(refusal({ type: "custom", distanceM: 42_195, date: "2027-03-01" })).toBeNull();
    expect(refusal({ type: "custom", distanceM: 43_000, date: "2027-03-01" })).toBe(
      "distance_not_supported",
    );
    expect(
      refusal({ type: "trail", distanceM: 50_000, elevationGainM: 1000, date: "2027-03-01" }),
    ).toBeNull();
    expect(
      refusal({ type: "trail", distanceM: 50_000, elevationGainM: 1100, date: "2027-03-01" }),
    ).toBe("distance_not_supported");
  });
});
