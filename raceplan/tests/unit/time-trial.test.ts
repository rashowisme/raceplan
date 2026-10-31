/**
 * Spec §3.4: entering the time trial result turns an effort-only plan into a
 * paced plan without touching weeks already started.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { applyTimeTrialResult, checkPlan, findTimeTrial, generatePlan } from "@/engine";
import { addDays } from "@/engine/dates";
import type { TrainingPlan } from "@/engine/types";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../fixtures/runners";
import { scenarioArb } from "./arbitraries";

const RUNS = Number(process.env.PROPERTY_RUNS ?? 300);

const effortOnlyPlan = (): TrainingPlan => {
  const r = generatePlan(RUNNER_FIXTURES.noPerformanceData!, { today: FIXTURE_TODAY });
  if (!r.ok) throw new Error(r.refusal.code);
  return r.plan;
};

describe("time trial result", () => {
  const plan = effortOnlyPlan();
  const tt = findTimeTrial(plan)!;

  it("the effort-only fixture schedules a time trial", () => {
    expect(plan.summary.paceZones).toBeNull();
    expect(tt.distanceM).toBe(3000);
  });

  it("adds paces to future weeks and keeps started weeks unchanged", () => {
    const today = tt.date;
    const r = applyTimeTrialResult(
      plan,
      { distanceM: 3000, timeS: 15 * 60, date: today },
      { today },
    );
    if (!r.ok) throw new Error(JSON.stringify(r.refusal));
    const next = r.plan;
    expect(checkPlan(next)).toEqual([]);
    expect(next.summary.fitness?.source).toBe("timeTrial");
    expect(next.summary.paceZones).not.toBeNull();
    expect(next.warnings.map((w) => w.code)).not.toContain("no_performance_data");
    const started = plan.weeks.filter((w) => w.startDate <= today).length;
    expect(next.weeks.slice(0, started)).toEqual(plan.weeks.slice(0, started));
    const later = next.weeks.slice(started).flatMap((w) => w.days);
    expect(
      later.some((d) => d.workout?.steps.some((s) => s.kind !== "repeat" && s.target.pace)),
    ).toBe(true);
    expect(next.generatedOn).toBe(plan.generatedOn);
    expect(next.profile.timeTrialResult?.timeS).toBe(900);
  });

  it("rejects implausible times and dates in the future or before the plan", () => {
    const today = tt.date;
    const code = (input: unknown) => {
      const r = applyTimeTrialResult(plan, input, { today });
      return r.ok ? null : r.refusal.issues?.[0]?.code;
    };
    expect(code({ distanceM: 3000, timeS: 200, date: today })).toBe("implausible_time");
    expect(code({ distanceM: 3000, timeS: 900, date: addDays(today, 1) })).toBe("in_future");
    expect(code({ distanceM: 3000, timeS: 900, date: addDays(plan.generatedOn, -1) })).toBe(
      "before_plan",
    );
  });

  it("is safe for any runner, result and entry day (property-based)", () => {
    fc.assert(
      fc.property(
        scenarioArb,
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 210, max: 480 }), // 3:30–8:00 /km
        ({ today, profile }, offset, paceS) => {
          const base = { ...profile, personalRecord: undefined, watchPrediction: undefined };
          const r = generatePlan(base, { today });
          if (!r.ok) return;
          const entry = addDays(r.plan.generatedOn, offset);
          if (entry > r.plan.raceDate) return;
          const applied = applyTimeTrialResult(
            r.plan,
            { distanceM: 3000, timeS: paceS * 3, date: entry },
            { today: entry },
          );
          if (!applied.ok) throw new Error(JSON.stringify(applied.refusal));
          const violations = checkPlan(applied.plan);
          if (violations.length > 0)
            throw new Error(`Violations: ${JSON.stringify(violations.slice(0, 5))}`);
          const keep = r.plan.weeks.filter((w) => w.startDate <= entry).length;
          expect(applied.plan.weeks.slice(0, keep)).toEqual(r.plan.weeks.slice(0, keep));
        },
      ),
      { numRuns: RUNS, seed: Number(process.env.PROPERTY_SEED ?? 42) },
    );
  });
});
