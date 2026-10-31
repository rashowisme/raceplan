import { describe, expect, it } from "vitest";
import { RUNNER_FIXTURES } from "../../../tests/fixtures/runners";
import type { RunnerProfile } from "../types";
import { estimateFitness } from "./estimate";
import { predictTimeS, riegel, vdotFromPerformance } from "./vdot";

describe("VDOT (Daniels)", () => {
  it.each([
    [5000, 20 * 60, 49.8],
    [10_000, 40 * 60, 51.9],
    [21_097.5, 90 * 60, 51.0],
    [42_195, 3 * 3600, 53.5],
  ])("%d m in %d s ≈ VDOT %d", (d, t, expected) => {
    expect(vdotFromPerformance(d, t)).toBeCloseTo(expected, 0);
  });

  it("predicts times consistent with the VDOT", () => {
    const t = predictTimeS(50, 10_000);
    expect(vdotFromPerformance(10_000, t)).toBeCloseTo(50, 3);
  });

  it("riegel converts between distances", () => {
    expect(riegel(20 * 60, 5000, 10_000)).toBeCloseTo(20 * 60 * 2 ** 1.06);
  });
});

const base: RunnerProfile = { ...RUNNER_FIXTURES.beginner5k! };
const TODAY = "2026-10-31";

describe("estimateFitness", () => {
  it("returns effort-only + warning without data", () => {
    const r = estimateFitness(base, 5000, TODAY, 10);
    expect(r.fitness).toBeNull();
    expect(r.warnings.map((w) => w.code)).toContain("no_performance_data");
  });

  it("slows old PRs by 3% / 6%", () => {
    const pr = (achievedOn: string) =>
      estimateFitness({ ...base, personalRecord: { timeS: 1500, achievedOn } }, 5000, TODAY, 10);
    const fresh = pr("2026-06-01");
    const mid = pr("2025-06-01");
    const old = pr("2023-06-01");
    expect(fresh.fitness!.predictedRaceTimeS).toBeCloseTo(1500, -1);
    expect(mid.fitness!.predictedRaceTimeS).toBeCloseTo(1545, -1);
    expect(old.fitness!.predictedRaceTimeS).toBeCloseTo(1590, -1);
    expect(old.fitness!.lowConfidence).toBe(true);
    expect(mid.warnings.map((w) => w.code)).toContain("old_pr");
    expect(fresh.warnings).toEqual([]);
  });

  it("adds 3% to watch predictions and keeps the slower estimate", () => {
    const r = estimateFitness(
      { ...base, personalRecord: { timeS: 1500 }, watchPrediction: { timeS: 1480 } },
      5000,
      TODAY,
      10,
    );
    // 1480 × 1.03 = 1524 > 1500 → watch wins (more conservative).
    expect(r.fitness!.source).toBe("watchPrediction");
    expect(r.fitness!.predictedRaceTimeS).toBeCloseTo(1524, -1);
  });

  it("warns on ambitious goals and keeps current-fitness race pace", () => {
    const p = { ...base, personalRecord: { timeS: 1500 }, targetTimeS: 1350 };
    const long = estimateFitness(p, 5000, TODAY, 12);
    expect(long.warnings.map((w) => w.code)).toContain("goal_ambitious");
    expect(long.racePaceSPerKm).toBe(300);
  });

  it("uses a realistic target for race pace", () => {
    const p = { ...base, personalRecord: { timeS: 1500 }, targetTimeS: 1480 };
    const r = estimateFitness(p, 5000, TODAY, 12);
    expect(r.warnings).toEqual([]);
    expect(r.racePaceSPerKm).toBe(296);
  });

  it("uses the stricter 2% bound for short plans", () => {
    const p = { ...base, personalRecord: { timeS: 1500 }, targetTimeS: 1460 };
    expect(estimateFitness(p, 5000, TODAY, 12).warnings).toEqual([]);
    expect(estimateFitness(p, 5000, TODAY, 8).warnings.map((w) => w.code)).toContain(
      "goal_ambitious",
    );
  });
});
