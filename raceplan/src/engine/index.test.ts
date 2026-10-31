import { describe, expect, it } from "vitest";
import { RUNNER_FIXTURES } from "../../tests/fixtures/runners";
import { defaultStartDate, generatePlan, validateProfile } from "./index";
import { SCHEMA_VERSION, type RunnerProfile } from "./types";

const TODAY = "2026-10-31";
const base = RUNNER_FIXTURES.beginner5k!;
const refusal = (p: unknown, today = TODAY) => {
  const r = generatePlan(p, { today });
  return r.ok ? null : r.refusal.code;
};

describe("generatePlan refusals", () => {
  it("refuses currently injured runners", () => {
    expect(refusal({ ...base, currentlyInjured: true })).toBe("currently_injured");
  });

  it("refuses races today or in the past", () => {
    expect(refusal({ ...base, race: { ...base.race, date: TODAY } })).toBe("race_in_past");
    expect(refusal({ ...base, race: { ...base.race, date: "2026-01-01" } })).toBe("race_in_past");
  });

  it("refuses ultras", () => {
    expect(
      refusal({ ...base, race: { type: "custom", distanceM: 50_000, date: "2027-03-01" } }),
    ).toBe("distance_not_supported");
    expect(
      refusal({
        ...base,
        race: { type: "trail", distanceM: 45_000, elevationGainM: 2000, date: "2027-03-01" },
      }),
    ).toBe("distance_not_supported");
  });

  it("refuses invalid input with issue paths", () => {
    const r = generatePlan({ ...base, age: 12 }, { today: TODAY });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.refusal.code).toBe("invalid_input");
      expect(r.refusal.issues?.[0]?.path).toBe("age");
    }
    expect(refusal("nonsense")).toBe("invalid_input");
    expect(refusal({ ...base, planStartDate: "2026-10-01" })).toBe("invalid_input");
    expect(refusal({ ...base, planStartDate: base.race.date })).toBe("invalid_input");
  });
});

describe("generatePlan output", () => {
  it("carries schema version, disclaimer and starts next Monday by default", () => {
    const r = generatePlan(base, { today: TODAY });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.plan.schemaVersion).toBe(SCHEMA_VERSION);
    expect(r.plan.disclaimer.key).toBe("plan.disclaimer");
    expect(r.plan.startDate).toBe("2026-11-02");
    expect(r.plan.weeks[0]!.startDate).toBe("2026-11-02");
  });

  it("only returns translation keys, never prose", () => {
    const r = generatePlan(RUNNER_FIXTURES.experiencedMarathon, { today: TODAY });
    if (!r.ok) throw new Error();
    const keys: string[] = [];
    JSON.stringify(r.plan, (k, v) => {
      if (k === "key") keys.push(v);
      return v;
    });
    expect(keys.length).toBeGreaterThan(10);
    for (const key of keys) expect(key).toMatch(/^[a-z]+(\.[a-zA-Z0-9]+)+$/);
  });

  it("ignores sex for plan structure", () => {
    const p: RunnerProfile = RUNNER_FIXTURES.experiencedMarathon!;
    const a = generatePlan({ ...p, sex: "female" }, { today: TODAY });
    const b = generatePlan({ ...p, sex: "male" }, { today: TODAY });
    if (!a.ok || !b.ok) throw new Error();
    expect(a.plan.weeks).toEqual(b.plan.weeks);
  });

  it("starts today when the next Monday is race day or later", () => {
    expect(defaultStartDate({ ...base, race: { ...base.race, date: "2026-11-01" } }, TODAY)).toBe(
      TODAY,
    );
  });

  it("validateProfile passes all fixtures", () => {
    for (const p of Object.values(RUNNER_FIXTURES))
      expect(validateProfile(p, { today: TODAY }).ok).toBe(true);
  });
});
