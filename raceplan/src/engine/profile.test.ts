import { describe, expect, it } from "vitest";
import { RUNNER_FIXTURES } from "../../tests/fixtures/runners";
import {
  effortDistanceM,
  experienceLevel,
  interpolateByDistance,
  nearestStandardRace,
  raceDistanceM,
  riskFlags,
} from "./profile";
import type { RunnerProfile } from "./types";

const base = RUNNER_FIXTURES.beginner5k!;
const with_ = (p: Partial<RunnerProfile>): RunnerProfile => ({ ...base, ...p });

describe("experienceLevel", () => {
  it("beginner when < 1 year or < 15 km/week", () => {
    expect(experienceLevel(with_({ yearsRunning: "lt1", currentWeeklyVolumeM: 50_000 }))).toBe(
      "beginner",
    );
    expect(experienceLevel(with_({ yearsRunning: "3plus", currentWeeklyVolumeM: 14_000 }))).toBe(
      "beginner",
    );
  });
  it("experienced needs 3+ years and ≥ 40 km/week", () => {
    expect(experienceLevel(with_({ yearsRunning: "3plus", currentWeeklyVolumeM: 40_000 }))).toBe(
      "experienced",
    );
    expect(experienceLevel(with_({ yearsRunning: "3plus", currentWeeklyVolumeM: 39_000 }))).toBe(
      "intermediate",
    );
    expect(experienceLevel(with_({ yearsRunning: "1to3", currentWeeklyVolumeM: 60_000 }))).toBe(
      "intermediate",
    );
  });
});

describe("riskFlags", () => {
  it("flags frequent, multiple, stress fracture and age ≥ 50", () => {
    expect(riskFlags(base)).toEqual([]);
    expect(riskFlags(with_({ injuries: [{ type: "itBand", frequency: "often" }] }))).toEqual([
      "injuryOften",
    ]);
    expect(
      riskFlags(
        with_({
          injuries: [
            { type: "itBand", frequency: "once" },
            { type: "stressFracture", frequency: "once" },
          ],
          age: 50,
        }),
      ),
    ).toEqual(["multipleInjuries", "stressFractureHistory", "age50plus"]);
  });
});

describe("distances", () => {
  it("uses standard distances and effort-km for trail", () => {
    expect(raceDistanceM(with_({ race: { type: "half", date: "2027-01-01" } }))).toBe(21_097.5);
    const trail = with_({
      race: { type: "trail", distanceM: 30_000, elevationGainM: 1500, date: "2027-01-01" },
    });
    expect(effortDistanceM(trail)).toBe(45_000);
  });

  it("interpolates between standard distances", () => {
    const v = (r: string) => ({ "5k": 5, "10k": 10, half: 20, marathon: 40 })[r]!;
    expect(interpolateByDistance(3000, v)).toBe(5);
    expect(interpolateByDistance(7500, v)).toBeCloseTo(7.5);
    expect(interpolateByDistance(60_000, v)).toBe(40);
    expect(nearestStandardRace(15_000)).toBe("10k");
    expect(nearestStandardRace(45_000)).toBe("marathon");
  });
});
