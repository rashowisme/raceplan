/**
 * Fixture plans: no safety violations + reviewable text snapshots.
 * Review snapshot diffs deliberately (`pnpm test -u` only after review).
 */
import { describe, expect, it } from "vitest";
import { checkPlan, generatePlan } from "@/engine";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../fixtures/runners";
import { planToText } from "./plan-text";

describe.each(Object.entries(RUNNER_FIXTURES))("fixture %s", (name, profile) => {
  const result = generatePlan(profile, { today: FIXTURE_TODAY });

  it("generates a plan", () => {
    expect(result.ok).toBe(true);
  });

  it("passes all safety checks", () => {
    if (!result.ok) return;
    expect(checkPlan(result.plan)).toEqual([]);
  });

  it("matches the reviewed snapshot", async () => {
    if (!result.ok) return;
    await expect(planToText(result.plan, true)).toMatchFileSnapshot(
      `../fixtures/plans/${name}.txt`,
    );
  });
});

describe("fixture-specific expectations", () => {
  const plan = (name: string) => {
    const r = generatePlan(RUNNER_FIXTURES[name]!, { today: FIXTURE_TODAY });
    if (!r.ok) throw new Error(`refused: ${r.refusal.code}`);
    return r.plan;
  };
  const codes = (name: string) => plan(name).warnings.map((w) => w.code);

  it("warns where expected", () => {
    expect(codes("unrealisticGoal")).toContain("goal_ambitious");
    expect(codes("noPerformanceData")).toContain("no_performance_data");
    expect(codes("raceIn2Weeks")).toEqual(
      expect.arrayContaining(["race_ready_mini_plan", "plan_too_short"]),
    );
    expect(codes("raceIn40Weeks")).toContain("long_base_block");
    expect(codes("zeroVolumeMarathon")).toContain("low_max_volume");
    expect(codes("twoDaysHalf")).toContain("few_days_available");
    expect(codes("minor10k")).toContain("minor_runner");
    expect(codes("senior68Half")).toEqual(expect.arrayContaining(["old_pr", "risk_flagged"]));
    expect(codes("injuryProne55Half")).toContain("risk_flagged");
  });

  it("schedules a time trial in week 2 when there is no performance data", () => {
    const p = plan("noPerformanceData");
    expect(p.weeks[1]!.days.some((d) => d.workout?.type === "timeTrial")).toBe(true);
    expect(p.summary.paceZones).toBeNull();
  });

  it("keeps 40-week plans in maintenance before the structured 24 weeks", () => {
    const p = plan("raceIn40Weeks");
    expect(p.weeks.filter((w) => w.phase === "maintenance")).toHaveLength(p.weeks.length - 24);
    const quality = p.weeks
      .filter((w) => w.phase === "maintenance")
      .flatMap((w) => w.days)
      .filter((d) => d.workout?.isHard && d.workout.type !== "timeTrial");
    expect(quality).toEqual([]);
  });

  it("caps a 17-year-old's volume at intermediate targets", () => {
    expect(plan("minor10k").summary.peakVolumeM).toBeLessThanOrEqual(45_000);
  });

  it("never gives the plantar fasciitis runner hills and speed in the same week", () => {
    for (const w of plan("custom15k").weeks) {
      const types = w.days.map((d) => d.workout?.type);
      const hills = types.some((t) => t === "hillSprints" || t === "hillRepeats");
      const speed = types.some(
        (t) => t === "shortIntervals" || t === "longIntervals" || t === "racePace",
      );
      expect(hills && speed).toBe(false);
    }
  });
});
