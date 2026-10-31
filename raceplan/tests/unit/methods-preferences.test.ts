/**
 * M4: plan styles produce different, valid plans; preferences are honoured.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { checkPlan, generatePlan } from "@/engine";
import type { PlanStyle, RunnerProfile, TrainingPlan, WorkoutType } from "@/engine/types";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../fixtures/runners";
import { scenarioArb } from "./arbitraries";

const plan = (p: RunnerProfile): TrainingPlan => {
  const r = generatePlan(p, { today: FIXTURE_TODAY });
  if (!r.ok) throw new Error(r.refusal.code);
  return r.plan;
};
const types = (p: TrainingPlan): WorkoutType[] =>
  p.weeks.flatMap((w) => w.days.map((d) => d.workout?.type)).filter((t): t is WorkoutType => !!t);
const count = (p: TrainingPlan, t: WorkoutType) => types(p).filter((x) => x === t).length;
const withStyle = (name: string, planStyle: PlanStyle) =>
  plan({ ...RUNNER_FIXTURES[name]!, planStyle });

describe("plan styles", () => {
  it.each(Object.keys(RUNNER_FIXTURES))("every style is safe for fixture %s", (name) => {
    for (const style of ["balanced", "vdot", "polarized"] as const) {
      expect(checkPlan(withStyle(name, style))).toEqual([]);
    }
  });

  it("produce different plans", () => {
    const b = JSON.stringify(withStyle("experiencedMarathon", "balanced").weeks);
    const v = JSON.stringify(withStyle("experiencedMarathon", "vdot").weeks);
    const p = JSON.stringify(withStyle("experiencedMarathon", "polarized").weeks);
    expect(new Set([b, v, p]).size).toBe(3);
  });

  it("VDOT-style starts with repetitions for non-beginners", () => {
    const p = withStyle("unrealisticGoal", "vdot");
    const base = p.weeks
      .filter((w) => w.phase === "base")
      .flatMap((w) => w.days.map((d) => d.workout?.type));
    expect(base).toContain("shortIntervals");
  });

  it("80/20 keeps ≥ 80% easy time every week and avoids threshold work", () => {
    // (custom15k likes tempo runs, so it is not part of this comparison.)
    for (const name of ["experiencedMarathon", "minor10k", "raceIn40Weeks"]) {
      const p = withStyle(name, "polarized");
      for (const w of p.weeks.filter((x) => !x.isRaceWeek)) {
        const total = w.days.reduce((s, d) => s + (d.workout?.estDurationS ?? 0), 0);
        const easy = w.days.reduce((s, d) => s + (d.workout?.easyDurationS ?? 0), 0);
        expect(easy / total).toBeGreaterThanOrEqual(0.795);
      }
      const balanced = withStyle(name, "balanced");
      const threshold = (x: TrainingPlan) => count(x, "tempo") + count(x, "cruiseIntervals");
      expect(threshold(p)).toBeLessThan(threshold(balanced));
      expect(types(p)).not.toContain("longProgressive");
    }
  });
});

describe("preferences", () => {
  it("favours liked sessions", () => {
    const base = RUNNER_FIXTURES.unrealisticGoal!;
    const neutral = plan(base);
    const likesHills = plan({ ...base, preferences: { likes: ["hills"], dislikes: [] } });
    expect(count(likesHills, "hillRepeats")).toBeGreaterThan(count(neutral, "hillRepeats"));
  });

  it("uses road intervals when the track is disliked", () => {
    const p = plan({
      ...RUNNER_FIXTURES.minor10k!,
      preferences: { likes: [], dislikes: ["track"] },
    });
    const tags = p.weeks.flatMap((w) => w.days.flatMap((d) => d.workout?.tags ?? []));
    expect(tags).not.toContain("track");
    expect(types(p)).toContain("longIntervals");
  });

  it("never schedules a disliked session without a preference_unmet warning (property)", () => {
    fc.assert(
      fc.property(scenarioArb, ({ today, profile }) => {
        const r = generatePlan(profile, { today });
        if (!r.ok) return;
        const unmet = new Set(
          r.plan.warnings
            .filter((w) => w.code === "preference_unmet")
            .map((w) => String(w.params?.tag)),
        );
        for (const d of r.plan.weeks.flatMap((w) => w.days)) {
          for (const tag of d.workout?.tags ?? []) {
            if (profile.preferences.dislikes.includes(tag)) expect(unmet.has(tag)).toBe(true);
          }
        }
      }),
      { numRuns: 300, seed: 21 },
    );
  });
});
