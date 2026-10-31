import { describe, expect, it } from "vitest";
import { RUNNER_FIXTURES } from "../../tests/fixtures/runners";
import { runnerProfileSchema } from "./schema";

describe("runnerProfileSchema", () => {
  it.each(Object.entries(RUNNER_FIXTURES))("accepts fixture %s", (_name, profile) => {
    expect(runnerProfileSchema.safeParse(profile).success).toBe(true);
  });

  const base = RUNNER_FIXTURES.beginner5k!;

  it("requires distance for custom races", () => {
    const r = runnerProfileSchema.safeParse({
      ...base,
      race: { type: "custom", date: "2027-01-01" },
    });
    expect(r.success).toBe(false);
  });

  it("requires elevation for trail races", () => {
    const r = runnerProfileSchema.safeParse({
      ...base,
      race: { type: "trail", distanceM: 30_000, date: "2027-01-01" },
    });
    expect(r.success).toBe(false);
  });

  it("requires the long-run day to be an available day", () => {
    const r = runnerProfileSchema.safeParse({ ...base, longRunDay: "mon" });
    expect(r.success).toBe(false);
  });

  it("rejects ages outside 16–90", () => {
    expect(runnerProfileSchema.safeParse({ ...base, age: 15 }).success).toBe(false);
    expect(runnerProfileSchema.safeParse({ ...base, age: 91 }).success).toBe(false);
  });

  it("rejects implausible times", () => {
    // 5K in 5 minutes.
    expect(runnerProfileSchema.safeParse({ ...base, personalRecord: { timeS: 300 } }).success).toBe(
      false,
    );
  });

  it("rejects a tag both liked and disliked", () => {
    const r = runnerProfileSchema.safeParse({
      ...base,
      preferences: { likes: ["hills"], dislikes: ["hills"] },
    });
    expect(r.success).toBe(false);
  });
});
