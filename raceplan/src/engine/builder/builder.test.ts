import { describe, expect, it } from "vitest";
import { chooseLayout } from "./days";
import { buildFrame, phaseCounts, weekDates } from "./frame";
import {
  allowedIncrease,
  builderIncrease,
  longRunShareCap,
  Progression,
  startVolume,
} from "./volume";
import { WEEKDAYS, type Weekday } from "../types";
import { CONFIG } from "../config";
import { checkPlan, generatePlan } from "../index";

describe("frame", () => {
  it("counts Monday-based weeks and phases", () => {
    const f = buildFrame("2026-11-02", "2027-03-07", "marathon", 42_195, "experienced");
    expect(f.totalWeeks).toBe(18);
    expect(f.taperWeeks).toBe(3);
    expect(f.phases.at(-1)).toBe("taper");
    expect(f.phases.filter((p) => p === "taper")).toHaveLength(3);
    expect(f.tooShort).toBe(false);
  });

  it("flags short plans and mini plans", () => {
    expect(buildFrame("2026-11-02", "2026-12-06", "half", 21_097.5, "intermediate").tooShort).toBe(
      true,
    );
    const mini = buildFrame("2026-11-02", "2026-11-15", "10k", 10_000, "intermediate");
    expect(mini.mini).toBe(true);
    expect(mini.phases).toEqual(["specific", "taper"]);
  });

  it("adds a maintenance block beyond 24 weeks", () => {
    const f = buildFrame("2026-11-02", "2027-08-08", "half", 21_097.5, "intermediate");
    expect(f.totalWeeks).toBe(40);
    expect(f.maintenanceWeeks).toBe(16);
    expect(f.phases.filter((p) => p === "maintenance")).toHaveLength(16);
  });

  it("splits phases ≈ 35/35/30", () => {
    expect(phaseCounts(10)).toEqual({ base: 4, build: 3, specific: 3 });
    expect(phaseCounts(2)).toEqual({ base: 1, build: 0, specific: 1 });
    expect(phaseCounts(1)).toEqual({ base: 0, build: 0, specific: 1 });
  });

  it("clips dates to the plan range", () => {
    const f = buildFrame("2026-11-05", "2026-12-02", "5k", 5000, "beginner");
    expect(weekDates(f, 0)).toEqual(["2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"]);
    expect(weekDates(f, f.totalWeeks - 1)).toEqual(["2026-11-30", "2026-12-01", "2026-12-02"]);
  });
});

describe("volume rules", () => {
  it("allows +10% or +3 km under 30 km", () => {
    expect(allowedIncrease(50_000, 0.1, 3000)).toBe(5000);
    expect(allowedIncrease(10_000, 0.1, 3000)).toBe(3000);
    expect(builderIncrease(4000, 0.07, 3000)).toBe(2000); // +50% max for tiny weeks
  });

  it("caps long run share at 33% / 40% / an even split for few-run weeks", () => {
    expect(longRunShareCap(50_000)).toBeCloseTo(16_500);
    expect(longRunShareCap(20_000)).toBe(8000);
    expect(longRunShareCap(20_000, 2)).toBe(10_000);
    expect(longRunShareCap(30_000, 3)).toBe(10_000);
    expect(longRunShareCap(30_000, 4)).toBeCloseTo(9900);
  });

  it("starts at current volume (or the allowance from zero)", () => {
    expect(startVolume(25_000, 40_000, 3000)).toBe(25_000);
    expect(startVolume(25_000, 20_000, 3000)).toBe(20_000);
    expect(startVolume(0, 40_000, 3000)).toBe(3000);
  });

  it("progresses with cutbacks and returns to the pre-cutback level", () => {
    const prog = new Progression({
      currentVolumeM: 40_000,
      maxVolumeM: 100_000,
      peakVolumeM: 100_000,
      maintenanceCapM: 0,
      ramp: 0.1,
      smallAllowanceM: 3000,
      cutbackEvery: 4,
      startLongRunM: 12_000,
      longRunCapM: 30_000,
      runsPerWeek: 4,
    });
    const vols: number[] = [];
    const flags: boolean[] = [];
    for (let w = 0; w < 8; w++) {
      const t = prog.next(false);
      vols.push(t.targetVolumeM);
      flags.push(t.isCutback);
      prog.record(t, t.targetVolumeM, t.longRunM);
    }
    expect(flags).toEqual([false, false, false, true, false, false, false, true]);
    expect(vols.slice(0, 5)).toEqual([40_000, 44_000, 48_400, 37_800, 48_400]);
    expect(prog.taper(0, vols[7]!).targetVolumeM).toBeLessThanOrEqual(Math.round(vols[6]! * 0.8));
  });
});

describe("chooseLayout", () => {
  const isAdjacent = (a: Weekday, b: Weekday) => {
    const d = Math.abs(WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));
    return d === 1 || d === 6;
  };

  it("keeps the long run day and never puts quality next to each other", () => {
    const l = chooseLayout({
      available: [...WEEKDAYS],
      longRunDay: "sun",
      runningDays: 6,
      qualityCount: 2,
      longRunHard: true,
      twoEasyAfterLong: false,
    });
    expect(l.runDays).toContain("sun");
    expect(l.runDays).toHaveLength(6);
    expect(l.qualityDays).toHaveLength(2);
    const hard = [...l.qualityDays, "sun" as Weekday];
    for (const a of hard) for (const b of hard) if (a !== b) expect(isAdjacent(a, b)).toBe(false);
    expect(l.qualityDays).not.toContain("mon");
  });

  it("respects blocked days and age ≥ 50 recovery after the long run", () => {
    const l = chooseLayout({
      available: ["mon", "tue", "wed", "thu", "sat"],
      longRunDay: "sat",
      runningDays: 5,
      qualityCount: 2,
      longRunHard: false,
      twoEasyAfterLong: true,
      blocked: ["wed"],
    });
    expect(l.qualityDays).not.toContain("sun");
    expect(l.qualityDays).not.toContain("mon");
    expect(l.qualityDays).not.toContain("wed");
  });
});

describe("easy runs in 4-day weeks", () => {
  it("are never as long as the long run (and recovery runs stay shorter still)", () => {
    // Found on the race guide samples: 4 days, two quality sessions → the one
    // easy day used to get everything left (a 16 km "recovery" after a 16 km long run).
    const r = generatePlan(
      {
        race: { type: "marathon", date: "2027-04-04" },
        watchPrediction: { timeS: 4 * 3600 + 30 * 60 },
        currentWeeklyVolumeM: 30_000,
        longestRecentRunM: 14_000,
        maxWeeklyVolumeM: 50_000,
        availableDays: ["mon", "wed", "fri", "sun"],
        longRunDay: "sun",
        yearsRunning: "1to3",
        injuries: [],
        currentlyInjured: false,
        age: 35,
        planStyle: "balanced",
        preferences: { likes: [], dislikes: [] },
        planStartDate: "2026-11-16",
      },
      { today: "2026-11-15" },
    );
    if (!r.ok) throw new Error(r.refusal.code);
    expect(checkPlan(r.plan)).toEqual([]);
    let checked = 0;
    for (const w of r.plan.weeks) {
      if (w.longRunM < 12_000) continue;
      for (const d of w.days) {
        const wk = d.workout;
        if (!wk || (wk.type !== "easy" && wk.type !== "recovery")) continue;
        checked++;
        expect(wk.estDistanceM).toBeLessThan(w.longRunM);
        // Up to 60% of the long run, plus a leftover too small to go elsewhere (< 1 km).
        if (wk.type === "recovery")
          expect(wk.estDistanceM).toBeLessThan(w.longRunM * 0.6 + CONFIG.minRunM);
      }
    }
    expect(checked).toBeGreaterThan(5);
  });
});
