import { describe, expect, it } from "vitest";
import { generatePlan } from "@/engine";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../../tests/fixtures/runners";
import { backupFileName, parseBackup, serializeBackup } from "./backup";

const plan = (() => {
  const r = generatePlan(RUNNER_FIXTURES.experiencedMarathon, { today: FIXTURE_TODAY });
  if (!r.ok) throw new Error();
  const day = r.plan.weeks[1]!.days.find((d) => d.workout)!;
  return { ...r.plan, log: { workouts: { [day.date]: "missed" as const } } };
})();

describe("backup file", () => {
  it("round-trips the plan and its log", () => {
    const r = parseBackup(serializeBackup(plan, "2026-11-10T08:00:00Z"));
    if (!r.ok) throw new Error(r.code);
    expect(r.plan).toEqual(plan);
    expect(backupFileName(plan)).toMatch(/^raceplan-marathon-\d{4}-\d{2}-\d{2}-backup\.json$/);
  });

  it("rejects files that aren't backups, or were tampered with", () => {
    const code = (text: string) => {
      const r = parseBackup(text);
      return r.ok ? null : r.code;
    };
    expect(code("not json")).toBe("invalid_file");
    expect(code(JSON.stringify({ hello: "world" }))).toBe("invalid_file");
    const file = JSON.parse(serializeBackup(plan, "x"));

    // Unsafe edit: a week far above the runner's maximum.
    const unsafe = structuredClone(file);
    unsafe.plan.weeks[3].plannedVolumeM = 500_000;
    expect(code(JSON.stringify(unsafe))).toBe("invalid_file");

    // Broken structure deep inside.
    const broken = structuredClone(file);
    broken.plan.weeks[2].days[0].workout = { type: "easy" };
    expect(code(JSON.stringify(broken))).toBe("invalid_file");

    const badLog = structuredClone(file);
    badLog.plan.log.workouts["2026-11-03"] = "skipped";
    expect(code(JSON.stringify(badLog))).toBe("invalid_file");

    const future = structuredClone(file);
    future.plan.schemaVersion = 2;
    expect(code(JSON.stringify(future))).toBe("unsupported_version");
  });
});
