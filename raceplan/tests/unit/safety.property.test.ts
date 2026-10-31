/**
 * Spec §7: every safety invariant must hold for every valid profile.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { checkPlan, generatePlan } from "@/engine";
import { CONFIG } from "@/engine/config";
import { scenarioArb } from "./arbitraries";

const RUNS = Number(process.env.PROPERTY_RUNS ?? 400);

describe("safety invariants (property-based)", () => {
  it("every generated plan passes every safety check", () => {
    fc.assert(
      fc.property(scenarioArb, ({ today, profile }) => {
        const r = generatePlan(profile, { today });
        if (!r.ok) {
          // Only legitimate refusals for valid-schema profiles.
          expect(["distance_not_supported", "invalid_input"]).toContain(r.refusal.code);
          return;
        }
        const violations = checkPlan(r.plan);
        if (violations.length > 0) {
          throw new Error(`Violations: ${JSON.stringify(violations.slice(0, 5))}`);
        }
      }),
      { numRuns: RUNS, seed: Number(process.env.PROPERTY_SEED ?? 42) },
    );
  });

  it("is deterministic", () => {
    fc.assert(
      fc.property(scenarioArb, ({ today, profile }) => {
        const a = generatePlan(profile, { today });
        const b = generatePlan(structuredClone(profile), { today });
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      }),
      { numRuns: 50, seed: 7 },
    );
  });

  it("weekly volume never exceeds the runner's max, and the plan ends on race day", () => {
    fc.assert(
      fc.property(scenarioArb, ({ today, profile }) => {
        const r = generatePlan(profile, { today });
        if (!r.ok) return;
        for (const w of r.plan.weeks)
          expect(w.plannedVolumeM).toBeLessThanOrEqual(profile.maxWeeklyVolumeM);
        const lastDay = r.plan.weeks.at(-1)!.days.at(-1)!;
        expect(lastDay.date).toBe(profile.race.date);
        expect(lastDay.workout?.type).toBe("race");
        // Every long run ≤ 3 h.
        for (const d of r.plan.weeks.flatMap((w) => w.days)) {
          if (d.workout?.isLongRun)
            expect(d.workout.estDurationS).toBeLessThanOrEqual(CONFIG.longRunMaxDurationS + 60);
        }
      }),
      { numRuns: 150, seed: 3 },
    );
  });
});
