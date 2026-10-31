/**
 * Spec §13.5: fatigue ("felt hard", tired check-ins) and pain / sickness /
 * injury check-ins.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { addCheckIn, adaptPlan, checkPlan, generatePlan, openPause, undoCheckIn } from "@/engine";
import { addDays, mondayOf } from "@/engine/dates";
import type {
  CheckInKind,
  IsoDate,
  PlanWeek,
  TrainingPlan,
  Workout,
  WorkoutStatus,
} from "@/engine/types";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../fixtures/runners";
import { scenarioArb } from "./arbitraries";

const RUNS = Number(process.env.PROPERTY_RUNS ?? 150);

const planFor = (name: string): TrainingPlan => {
  const r = generatePlan(RUNNER_FIXTURES[name]!, { today: FIXTURE_TODAY });
  if (!r.ok) throw new Error(r.refusal.code);
  return r.plan;
};

const runDays = (w: PlanWeek) => w.days.filter((d) => d.workout && d.workout.type !== "race");
const noteKeys = (w: PlanWeek) => (w.adaptations ?? []).map((n) => n.key);
const qualityCount = (w: PlanWeek) =>
  w.days.filter((d) => d.workout?.isHard && !d.workout.isLongRun && d.workout.type !== "race")
    .length;

const withLog = (plan: TrainingPlan, entries: Record<string, WorkoutStatus>): TrainingPlan => ({
  ...plan,
  log: { ...plan.log, workouts: { ...plan.log?.workouts, ...entries } },
});

function checkIn(plan: TrainingPlan, kind: CheckInKind, today: IsoDate): TrainingPlan {
  const r = addCheckIn(plan, kind, { today });
  if (!r.ok) throw new Error(`${kind} on ${today}: ${r.code}`);
  return r.plan;
}

function expectSafe(plan: TrainingPlan) {
  const v = checkPlan(plan);
  if (v.length > 0) throw new Error(`Violations: ${JSON.stringify(v.slice(0, 5))}`);
}

const workoutsByDate = (plan: TrainingPlan) =>
  new Map(plan.weeks.flatMap((w) => w.days).map((d) => [d.date, d.workout]));

/** Days on or before `date` are exactly the same in both plans. */
function expectSameUpTo(a: TrainingPlan, b: TrainingPlan, date: IsoDate) {
  const before = workoutsByDate(a);
  const after = workoutsByDate(b);
  for (const [d, wk] of before) if (d <= date) expect([d, after.get(d)]).toEqual([d, wk]);
}

const weekOf = (plan: TrainingPlan, date: IsoDate) =>
  plan.weeks.find((w) => w.startDate === mondayOf(date))!;

describe("fatigue (13.5)", () => {
  const base = planFor("experiencedMarathon");
  const k = 5;
  const week = base.weeks[k]!;

  it("after a tired check-in: no increase next week, one quality session becomes easy", () => {
    const sunday = addDays(week.startDate, 6);
    const adapted = adaptPlan(checkIn(base, "tired", addDays(week.startDate, 3)));
    expectSafe(adapted);
    expect(adapted.weeks.slice(0, k + 1)).toEqual(base.weeks.slice(0, k + 1));
    const next = adapted.weeks[k + 1]!;
    const original = base.weeks[k + 1]!;
    expect(noteKeys(next)).toEqual(["adapt.fatigue"]);
    expect(next.plannedVolumeM).toBeLessThanOrEqual(Math.max(week.plannedVolumeM, 0));
    if (!original.isCutback) expect(qualityCount(next)).toBe(qualityCount(original) - 1);
    expectSameUpTo(base, adapted, sunday);
  });

  it("'felt hard' twice in a week does the same; once doesn't", () => {
    const [a, b] = runDays(week);
    expect(adaptPlan(withLog(base, { [a!.date]: "hard" })).weeks).toEqual(base.weeks);
    const twice = adaptPlan(withLog(base, { [a!.date]: "hard", [b!.date]: "hard" }));
    expectSafe(twice);
    expect(noteKeys(twice.weeks[k + 1]!)).toEqual(["adapt.fatigue"]);
  });

  it("two tiring weeks in a row bring the cutback forward", () => {
    const once = checkIn(base, "tired", addDays(week.startDate, 2));
    const twice = checkIn(once, "tired", addDays(week.startDate, 9));
    const adapted = adaptPlan(twice);
    expectSafe(adapted);
    const target = adapted.weeks[k + 2]!;
    expect(target.isCutback).toBe(true);
    expect(noteKeys(target)).toContain("adapt.fatigueCutback");
  });
});

describe("pain / niggle (13.5)", () => {
  const base = planFor("experiencedMarathon");
  const week = base.weeks[6]!;
  const day = addDays(week.startDate, 2); // Wednesday

  it("the next 7 days are easy, 20% shorter; earlier days don't change", () => {
    const adapted = adaptPlan(checkIn(base, "pain", day));
    expectSafe(adapted);
    expectSameUpTo(base, adapted, day);
    const before = workoutsByDate(base);
    const after = workoutsByDate(adapted);
    let changed = 0;
    for (let i = 1; i <= 7; i++) {
      const d = addDays(day, i);
      const was = before.get(d);
      const now = after.get(d);
      if (!was) continue;
      changed++;
      if (now) {
        expect(now.isHard).toBe(false);
        expect(now.estDistanceM).toBeLessThanOrEqual(was.estDistanceM * 0.8 + 1);
      }
    }
    expect(changed).toBeGreaterThan(0);
    expect(noteKeys(weekOf(adapted, addDays(day, 1)))).toContain("adapt.pain");
    expect(noteKeys(weekOf(adapted, addDays(day, 7)))).toContain("adapt.pain");
  });
});

describe("sick / injured (13.5)", () => {
  const base = planFor("experiencedMarathon");
  const week = base.weeks[6]!;
  const day = addDays(week.startDate, 1); // Tuesday

  it("pauses the plan until 'I'm back' (the race stays)", () => {
    const sick = checkIn(base, "sick", day);
    expect(openPause(sick.log)).toMatchObject({ kind: "sick", since: day });
    const adapted = adaptPlan(sick);
    expectSafe(adapted);
    expectSameUpTo(base, adapted, day);
    const later = adapted.weeks.flatMap((w) => w.days).filter((d) => d.date > day);
    expect(later.filter((d) => d.workout && d.workout.type !== "race")).toEqual([]);
    expect(later.find((d) => d.date === base.raceDate)?.workout?.type).toBe("race");
    expect(noteKeys(weekOf(adapted, day))).toContain("adapt.sick");
    expect(adapted.warnings.map((w) => w.code)).not.toContain("goal_reassess");
  });

  it("back mid-week after 10 days: easy at 75% for the rest of the week, then a restart", () => {
    const backOn = addDays(day, 11); // Saturday of the next week
    const back = checkIn(checkIn(base, "sick", day), "back", backOn);
    expect(openPause(back.log)).toBeNull();
    const adapted = adaptPlan(back);
    expectSafe(adapted);
    expectSameUpTo(base, adapted, day);
    const before = workoutsByDate(base);
    for (const d of weekOf(adapted, backOn).days) {
      if (d.date < backOn) expect(d.workout).toBeNull();
      else if (d.workout) {
        expect(d.workout.isHard).toBe(false);
        expect(d.workout.estDistanceM).toBeLessThanOrEqual(before.get(d.date)!.estDistanceM);
      }
    }
    expect(noteKeys(weekOf(adapted, backOn))).toContain("adapt.back");
    const next = weekOf(adapted, addDays(mondayOf(backOn), 7));
    expect(noteKeys(next)[0]).toMatch(/^adapt\.break\./);
    expect(qualityCount(next)).toBe(0);
  });

  it("back on a Monday: that week restarts (13.4)", () => {
    const monday = addDays(week.startDate, 21); // ~20 days off
    const adapted = adaptPlan(checkIn(checkIn(base, "injured", day), "back", monday));
    expectSafe(adapted);
    expect(noteKeys(weekOf(adapted, day))).toContain("adapt.injured");
    expect(noteKeys(weekOf(adapted, monday))).toEqual(["adapt.break.long"]);
  });
});

describe("check-ins never change earlier days (regressions)", () => {
  it("back, then sick again the same day: that day's long run stays as shown", () => {
    const r = generatePlan(
      {
        race: { type: "custom", distanceM: 14000, date: "2027-10-25" },
        currentWeeklyVolumeM: 0,
        maxWeeklyVolumeM: 15000,
        availableDays: ["tue", "sat", "sun"],
        longRunDay: "tue",
        yearsRunning: "lt1",
        injuries: [],
        currentlyInjured: false,
        age: 16,
        planStyle: "balanced",
        preferences: { likes: [], dislikes: [] },
      },
      { today: "2027-02-15" },
    );
    if (!r.ok) throw new Error(r.refusal.code);
    const back = checkIn(checkIn(r.plan, "sick", "2027-05-31"), "back", "2027-06-22");
    const shown = adaptPlan(back);
    const again = adaptPlan(checkIn(back, "sick", "2027-06-22"));
    expectSafe(shown);
    expectSafe(again);
    expectSameUpTo(shown, again, "2027-06-22");
    // While still sick, paused weeks only say so.
    const paused = weekOf(adaptPlan(checkIn(r.plan, "sick", "2027-05-31")), "2027-06-22");
    expect(noteKeys(paused)).toEqual(["adapt.sick"]);
  });
});

describe("addCheckIn / undoCheckIn", () => {
  const base = planFor("beginner5k");
  const today = addDays(base.startDate, 10);

  it("only accepts check-ins that make sense", () => {
    const code = (plan: TrainingPlan, kind: string, on = today) => {
      const r = addCheckIn(plan, kind as CheckInKind, { today: on });
      return r.ok ? null : r.code;
    };
    expect(code(base, "back")).toBe("not_paused");
    expect(code(base, "hungry")).toBe("invalid_check_in");
    expect(code(base, "tired", base.raceDate)).toBe("plan_over");
    const sick = checkIn(base, "sick", today);
    expect(code(sick, "tired")).toBe("paused");
    expect(code(sick, "pain")).toBe("paused");
    expect(code(sick, "injured")).toBeNull();
  });

  it("undoes today's last check-in only", () => {
    const sick = checkIn(base, "sick", today);
    const r = undoCheckIn(sick, { today });
    if (!r.ok) throw new Error(r.code);
    expect(r.plan.log?.checkIns).toBeUndefined();
    expect(adaptPlan(r.plan).weeks).toEqual(base.weeks);
    const later = undoCheckIn(sick, { today: addDays(today, 1) });
    expect(later.ok ? null : later.code).toBe("nothing_to_undo");
  });
});

type Event = "none" | "tired" | "pain" | "sick" | "injured";
const weekEvent = fc.record({
  missRate: fc.constantFrom(0, 0, 0, 0.15, 0.4, 1),
  event: fc.constantFrom<Event>("none", "none", "tired", "pain", "sick", "injured"),
  day: fc.integer({ min: 0, max: 6 }),
  /** Days until "I'm back" after sick / injured. */
  away: fc.integer({ min: 1, max: 35 }),
});

const sameWorkout = (a: Workout | null | undefined, b: Workout | null | undefined) =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

describe("check-in safety (property-based)", () => {
  it("logging and checking in day by day: always safe, earlier days never change", () => {
    fc.assert(
      fc.property(
        scenarioArb,
        fc.array(weekEvent, { minLength: 1, maxLength: 10 }),
        fc.nat({ max: 16 }),
        fc.integer({ min: 0, max: 2 ** 31 }),
        ({ today, profile }, events, firstWeek, seed) => {
          const r = generatePlan(profile, { today });
          if (!r.ok) return;
          const base = r.plan;
          let stored = base;
          let shown = base;
          let rnd = seed;
          const next = () => (rnd = (rnd * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
          let backOn: IsoDate | null = null;
          let lastCheckIn = "";

          /** Adapt and check: safe, never above the original, nothing on or before `upTo` changed. */
          const step = (upTo: IsoDate) => {
            const adapted = adaptPlan(stored);
            expectSafe(adapted);
            const was = workoutsByDate(shown);
            const now = workoutsByDate(adapted);
            for (const [d, wk] of was)
              if (d <= upTo && !sameWorkout(wk, now.get(d)))
                throw new Error(`${d} changed (up to ${upTo})`);
            adapted.weeks.forEach((wk, j) => {
              expect(wk.plannedVolumeM).toBeLessThanOrEqual(base.weeks[j]!.plannedVolumeM);
              expect(wk.longRunM).toBeLessThanOrEqual(base.weeks[j]!.longRunM);
            });
            shown = adapted;
          };
          const logDays = (w: number, from: IsoDate, to: IsoDate, missRate: number) => {
            const entries: Record<string, WorkoutStatus> = {};
            for (const d of runDays(shown.weeks[w]!)) {
              if (d.date < from || d.date > to) continue;
              const x = next();
              if (x < missRate) entries[d.date] = "missed";
              else if (x < missRate + 0.15) entries[d.date] = "hard";
            }
            stored = withLog(stored, entries);
          };

          events.forEach(({ missRate, event, day, away }, i) => {
            const w = firstWeek + i;
            if (w >= shown.weeks.length) return;
            const monday = shown.weeks[w]!.startDate;
            const sunday = addDays(monday, 6);
            // "I'm back" this week: earlier days stay as they were.
            if (backOn && backOn <= sunday) {
              const on = backOn < monday ? monday : backOn;
              if (on < shown.raceDate) {
                stored = checkIn(stored, "back", on);
                lastCheckIn = on;
                step(addDays(on, -1));
                backOn = null;
              }
            }
            const ciDate = addDays(monday, day);
            const canCheckIn =
              event !== "none" &&
              !openPause(stored.log) &&
              ciDate < shown.raceDate &&
              ciDate >= lastCheckIn;
            if (canCheckIn) {
              logDays(w, monday, ciDate, missRate);
              stored = checkIn(stored, event, ciDate);
              lastCheckIn = ciDate;
              step(ciDate);
              if (event === "sick" || event === "injured") backOn = addDays(ciDate, away);
              logDays(w, addDays(ciDate, 1), sunday, missRate);
            } else logDays(w, monday, sunday, missRate);
            step(sunday);
          });
        },
      ),
      { numRuns: RUNS, seed: Number(process.env.PROPERTY_SEED ?? 42) },
    );
  }, 600_000);
});
