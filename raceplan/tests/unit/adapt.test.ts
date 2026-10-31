/**
 * Spec §13: the plan adapts the coming weeks to what the runner logged.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  adaptPlan,
  applyTimeTrialResult,
  checkPlan,
  findTimeTrial,
  generatePlan,
  setWorkoutStatus,
} from "@/engine";
import { addDays } from "@/engine/dates";
import type { PlanWeek, TrainingPlan, WorkoutStatus } from "@/engine/types";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../fixtures/runners";
import { scenarioArb } from "./arbitraries";

const RUNS = Number(process.env.PROPERTY_RUNS ?? 150);

const planFor = (name: string): TrainingPlan => {
  const r = generatePlan(RUNNER_FIXTURES[name]!, { today: FIXTURE_TODAY });
  if (!r.ok) throw new Error(r.refusal.code);
  return r.plan;
};

const runDays = (w: PlanWeek) => w.days.filter((d) => d.workout && d.workout.type !== "race");

/** Log `status` on the given dates. */
const withLog = (plan: TrainingPlan, entries: Record<string, WorkoutStatus>): TrainingPlan => ({
  ...plan,
  log: { workouts: { ...plan.log?.workouts, ...entries } },
});

/** Miss the shortest runs of week `w` until at least `share` of its volume is missed. */
function missShare(plan: TrainingPlan, w: number, share: number): Record<string, WorkoutStatus> {
  const week = plan.weeks[w]!;
  const out: Record<string, WorkoutStatus> = {};
  let missed = 0;
  for (const d of [...runDays(week)].sort(
    (a, b) => a.workout!.estDistanceM - b.workout!.estDistanceM,
  )) {
    if (missed >= share * week.plannedVolumeM) break;
    out[d.date] = "missed";
    missed += d.workout!.estDistanceM;
  }
  return out;
}

const missWeeks = (plan: TrainingPlan, from: number, to: number) =>
  Object.fromEntries(
    plan.weeks
      .slice(from, to + 1)
      .flatMap(runDays)
      .map((d) => [d.date, "missed" as const]),
  );

const noteKeys = (w: PlanWeek) => (w.adaptations ?? []).map((n) => n.key);
const isQuality = (w: PlanWeek) =>
  w.days.some((d) => d.workout?.isHard && !d.workout.isLongRun && d.workout.type !== "race");

function expectSafe(plan: TrainingPlan) {
  const v = checkPlan(plan);
  if (v.length > 0) throw new Error(`Violations: ${JSON.stringify(v.slice(0, 5))}`);
}

describe("adaptPlan", () => {
  const base = planFor("experiencedMarathon");

  it("changes nothing without missed workouts", () => {
    expect(adaptPlan(base)).toBe(base);
    const ticked = withLog(base, {
      [runDays(base.weeks[1]!)[0]!.date]: "done",
      [runDays(base.weeks[1]!)[1]!.date]: "hard",
    });
    expect(adaptPlan(ticked)).toBe(ticked);
  });

  it("ignores small misses (< 20% of the week)", () => {
    const week = base.weeks[3]!;
    const shortest = [...runDays(week)].sort(
      (a, b) => a.workout!.estDistanceM - b.workout!.estDistanceM,
    )[0]!;
    expect(shortest.workout!.estDistanceM / week.plannedVolumeM).toBeLessThan(0.2);
    const adapted = adaptPlan(withLog(base, { [shortest.date]: "missed" }));
    expect(adapted.weeks).toEqual(base.weeks);
  });

  it("holds the next week after a partly missed week (20–50%)", () => {
    const k = 5;
    const adapted = adaptPlan(withLog(base, missShare(base, k, 0.25)));
    expectSafe(adapted);
    expect(adapted.weeks.slice(0, k + 1)).toEqual(base.weeks.slice(0, k + 1));
    const next = adapted.weeks[k + 1]!;
    expect(noteKeys(next)).toEqual(["adapt.hold"]);
    // Last fully done week = k - 1 (week k didn't count as a step up).
    const ref = base.weeks[k - 1]!.isCutback ? base.weeks[k - 2]! : base.weeks[k - 1]!;
    expect(next.plannedVolumeM).toBeLessThanOrEqual(ref.plannedVolumeM);
  });

  it("schedules a cutback after two partly missed weeks in a row", () => {
    const k = 5;
    const log = { ...missShare(base, k, 0.25) };
    const once = adaptPlan(withLog(base, log));
    Object.assign(log, missShare(once, k + 1, 0.25));
    const adapted = adaptPlan(withLog(base, log));
    expectSafe(adapted);
    expect(adapted.weeks[k + 2]!.isCutback).toBe(true);
    expect(noteKeys(adapted.weeks[k + 2]!)).toEqual(["adapt.cutback"]);
  });

  it("restarts after a break: 8–14 days at 75%, easy running only", () => {
    const k = 5;
    const adapted = adaptPlan(withLog(base, missWeeks(base, k, k)));
    expectSafe(adapted);
    const next = adapted.weeks[k + 1]!;
    const key = noteKeys(next)[0]!;
    expect(key).toMatch(/^adapt\.break\.(short|medium)$/);
    if (key === "adapt.break.medium") {
      expect(isQuality(next)).toBe(false);
      expect(next.plannedVolumeM).toBeLessThanOrEqual(base.weeks[k - 1]!.plannedVolumeM * 0.75);
    }
  });

  it("restarts after 15–28 days at 50% with two easy weeks and slower paces", () => {
    const k = 5;
    const adapted = adaptPlan(withLog(base, missWeeks(base, k, k + 2)));
    expectSafe(adapted);
    const back = adapted.weeks[k + 3]!;
    expect(noteKeys(back)).toEqual(["adapt.break.long"]);
    expect(isQuality(back)).toBe(false);
    expect(isQuality(adapted.weeks[k + 4]!)).toBe(false);
    expect(noteKeys(adapted.weeks[k + 4]!)).toEqual(["adapt.easyOnly"]);
    const ref = base.weeks[k - 1]!.isCutback ? base.weeks[k - 2]! : base.weeks[k - 1]!;
    expect(back.plannedVolumeM).toBeLessThanOrEqual(ref.plannedVolumeM * 0.5 + 100);
    expect(adapted.summary.paceZones!.E.slowSPerKm).toBeCloseTo(
      base.summary.paceZones!.E.slowSPerKm * 1.03,
    );
    expect(adapted.warnings.map((w) => w.code)).not.toContain("long_break");
  });

  it("asks for a new plan after more than 4 weeks off (and stays safe)", () => {
    const adapted = adaptPlan(withLog(base, missWeeks(base, 3, 8)));
    expectSafe(adapted);
    expect(adapted.warnings.map((w) => w.code)).toContain("long_break");
  });

  it("never goes above the original plan, never makes up missed sessions", () => {
    const adapted = adaptPlan(
      withLog(base, { ...missShare(base, 4, 0.4), ...missWeeks(base, 9, 9) }),
    );
    adapted.weeks.forEach((w, i) => {
      expect(w.plannedVolumeM).toBeLessThanOrEqual(base.weeks[i]!.plannedVolumeM);
      expect(w.longRunM).toBeLessThanOrEqual(base.weeks[i]!.longRunM);
    });
  });
});

describe("setWorkoutStatus", () => {
  const base = planFor("beginner5k");
  const day = runDays(base.weeks[1]!)[0]!;

  it("records, changes and clears a status", () => {
    const today = addDays(day.date, 2);
    const a = setWorkoutStatus(base, day.date, "missed", { today });
    if (!a.ok) throw new Error(a.code);
    expect(a.plan.log?.workouts[day.date]).toBe("missed");
    expect(base.log).toBeUndefined();
    const b = setWorkoutStatus(a.plan, day.date, null, { today });
    if (!b.ok) throw new Error(b.code);
    expect(b.plan.log?.workouts[day.date]).toBeUndefined();
  });

  it("rejects future days, rest days and race day", () => {
    const code = (date: string, today: string) => {
      const r = setWorkoutStatus(base, date, "done", { today });
      return r.ok ? null : r.code;
    };
    expect(code(day.date, addDays(day.date, -1))).toBe("in_future");
    const rest = base.weeks[1]!.days.find((d) => !d.workout)!;
    expect(code(rest.date, addDays(rest.date, 1))).toBe("no_workout");
    expect(code(base.raceDate, base.raceDate)).toBe("no_workout");
  });
});

describe("time trial result after adaptation", () => {
  it("keeps the log and the adapted weeks", () => {
    const base = planFor("noPerformanceData");
    const tt = findTimeTrial(base)!;
    const ttWeek = base.weeks.findIndex((w) => w.days.some((d) => d.date === tt.date));
    const logged = withLog(base, missShare(base, ttWeek - 1, 0.3));
    const shown = adaptPlan(logged);
    const today = addDays(tt.date, 1);
    const r = applyTimeTrialResult(
      shown,
      { distanceM: 3000, timeS: 900, date: tt.date },
      { today },
    );
    if (!r.ok) throw new Error(JSON.stringify(r.refusal));
    expect(r.plan.log).toEqual(logged.log);
    const frozen = r.plan.frozenWeeks!;
    expect(frozen).toBe(ttWeek + 1);
    const after = adaptPlan(r.plan);
    expectSafe(after);
    expect(after.weeks.slice(0, frozen)).toEqual(shown.weeks.slice(0, frozen));
  });
});

/** Per-week logging behaviour: all done, a few misses, many, or everything missed. */
const weekBehaviour = fc.constantFrom(0, 0, 0, 0.15, 0.3, 0.45, 0.7, 1);

describe("adaptation safety (property-based)", () => {
  it("logging week by week: always safe, past weeks never change, never above the original", () => {
    fc.assert(
      fc.property(
        scenarioArb,
        fc.array(weekBehaviour, { minLength: 1, maxLength: 10 }),
        fc.nat({ max: 20 }),
        fc.integer({ min: 0, max: 2 ** 31 }),
        ({ today, profile }, behaviours, firstWeek, seed) => {
          const r = generatePlan(profile, { today });
          if (!r.ok) return;
          const base = r.plan;
          let stored = base;
          let shown = base;
          let rnd = seed;
          const next = () => (rnd = (rnd * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
          behaviours.forEach((missRate, i) => {
            const w = firstWeek + i;
            if (w >= shown.weeks.length) return;
            const entries: Record<string, WorkoutStatus> = {};
            for (const d of runDays(shown.weeks[w]!)) {
              const x = next();
              if (x < missRate) entries[d.date] = "missed";
              else if (x < missRate + 0.1) entries[d.date] = "hard";
            }
            stored = withLog(stored, entries);
            const adapted = adaptPlan(stored);
            expectSafe(adapted);
            // Weeks up to the one just logged are unchanged.
            expect(adapted.weeks.slice(0, w + 1)).toEqual(shown.weeks.slice(0, w + 1));
            adapted.weeks.forEach((wk, j) => {
              expect(wk.plannedVolumeM).toBeLessThanOrEqual(base.weeks[j]!.plannedVolumeM);
            });
            shown = adapted;
          });
        },
      ),
      { numRuns: RUNS, seed: Number(process.env.PROPERTY_SEED ?? 42) },
    );
  });
});
