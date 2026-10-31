/**
 * Spec §13: adapt the coming weeks to what the runner logged.
 *
 * The stored plan is the original plan plus its log; the plan shown is
 * `adaptPlan(stored)`. Week by week, what the log says about week w decides
 * how week w + 1 is built (the next Monday): weeks before the first change
 * are kept as they are, every later week is rebuilt by the normal builder,
 * which continues the progression from what was really run. Check-ins about
 * pain, sickness or injury also change the days right after them (13.5).
 * Nothing is ever added to make up for missed training, and no week goes
 * above the original.
 */
import {
  assemblePlan,
  type AssembleHooks,
  type DayChange,
  type WeekDirective,
} from "../builder/plan";
import { CONFIG } from "../config";
import { addDays, diffDays, mondayOf } from "../dates";
import {
  CHECK_IN_KINDS,
  WORKOUT_STATUSES,
  type CheckInKind,
  type GenerateOptions,
  type IsoDate,
  type Message,
  type PlanWarning,
  type PlanWeek,
  type TrainingLog,
  type TrainingPlan,
  type WorkoutStatus,
} from "../types";
import {
  backWeekDates,
  checkInEffects,
  isHeldWeek,
  missedShare,
  openPause,
  pauseOn,
  type CheckInEffects,
  type Pause,
} from "./log";

const A = CONFIG.adaptation;

interface Break {
  /** Days without running: last run before → last missed session. */
  days: number;
  /** Week in which the missed streak started. */
  startWeek: number;
}

interface Run {
  date: IsoDate;
  week: number;
  missed: boolean;
}

function runsOf(weeks: readonly PlanWeek[], log: TrainingLog): Run[] {
  const runs: Run[] = [];
  for (const w of weeks)
    for (const d of w.days)
      if (d.workout && d.workout.type !== "race")
        runs.push({ date: d.date, week: w.index, missed: log.workouts[d.date] === "missed" });
  return runs;
}

/** The streak of missed runs ending with `runs[end]` (missed). */
function streakTo(runs: Run[], end: number, planStart: IsoDate) {
  let start = end;
  while (start > 0 && runs[start - 1]!.missed) start--;
  const lastRun = start > 0 ? runs[start - 1]!.date : addDays(planStart, -1);
  return { days: diffDays(lastRun, runs[end]!.date), startWeek: runs[start]!.week };
}

/**
 * The break that ends in week `k` as far as the log tells at the end of that
 * week, if any: a week with more than 50% missed (≥ 7 days), a streak of
 * missed sessions covering more than 7 days, or a sick / injured pause.
 */
function breakEndingIn(
  weeks: readonly PlanWeek[],
  k: number,
  log: TrainingLog,
  planStart: IsoDate,
  effects: CheckInEffects,
): Break | null {
  const runs = runsOf(weeks.slice(0, k + 1), log);
  let end = runs.length - 1;
  while (end >= 0 && !runs[end]!.missed) end--;
  if (end < 0 || runs[end]!.week !== k) return null;
  const streak = streakTo(runs, end, planStart);
  const broken = missedShare(weeks[k]!, log) > A.breakMissedShare;
  if (broken) streak.days = Math.max(streak.days, 7);
  const paused = pauseOn(effects, runs[end]!.date) !== undefined;
  if (!broken && !paused && streak.days <= 7) return null;
  return streak;
}

/** Days off before `I'm back` on `date` (13.4 is counted to the last missed session). */
function daysOffBefore(
  weeks: readonly PlanWeek[],
  date: IsoDate,
  log: TrainingLog,
  start: IsoDate,
) {
  const runs = runsOf(weeks, log).filter((r) => r.date < date);
  const end = runs.length - 1;
  return end >= 0 && runs[end]!.missed ? streakTo(runs, end, start).days : 0;
}

const breakRow = (days: number) => A.breaks.find((r) => days <= r.maxDays) ?? A.breaks.at(-1)!;
const breakKey = (days: number) =>
  days <= 7 ? "short" : days <= 14 ? "medium" : days <= A.newPlanAfterDays ? "long" : "veryLong";

const inWeek = (week: PlanWeek, date: IsoDate) =>
  date >= week.startDate && date < addDays(week.startDate, 7);

const PAUSE_NOTE: Record<Pause["kind"], string> = {
  sick: "adapt.sick",
  injured: "adapt.injured",
};

function needsAdapting(log: TrainingLog | undefined): log is TrainingLog {
  if (!log) return false;
  if (log.checkIns?.length) return true;
  const hardPerWeek = new Map<IsoDate, number>();
  for (const [date, s] of Object.entries(log.workouts)) {
    if (s === "missed") return true;
    if (s === "hard") hardPerWeek.set(mondayOf(date), (hardPerWeek.get(mondayOf(date)) ?? 0) + 1);
  }
  return [...hardPerWeek.values()].some((n) => n >= A.hardPerWeek);
}

/** The plan to show: the stored plan adapted to its log (§13). Pure and deterministic. */
export function adaptPlan(plan: TrainingPlan): TrainingPlan {
  const log = plan.log;
  if (!needsAdapting(log)) return plan;

  const effects = checkInEffects(log);
  // Planned runs during a pause count as missed (13.4 breaks, 13.3 holds).
  const eff: TrainingLog = { workouts: { ...log.workouts } };
  for (const p of effects.pauses)
    for (let d = p.from; d < (p.until ?? plan.raceDate); d = addDays(d, 1))
      eff.workouts[d] = "missed";

  const tiring = (week: PlanWeek) =>
    week.days.filter((d) => d.workout && log.workouts[d.date] === "hard").length >= A.hardPerWeek ||
    effects.tiredDates.some((t) => inWeek(week, t));
  const strained = (week: PlanWeek) => isHeldWeek(week, eff) || tiring(week);
  const backIn = (week: PlanWeek) =>
    effects.pauses.find((p) => backWeekDates(p).length > 0 && inWeek(week, p.until!));

  const refBefore: { volumeM: number; longRunM: number }[] = [];
  let easyOnlyLeft = 0;
  let paceFactor = 1;
  let longestBreak = 0;

  const hooks: AssembleHooks = {
    frozenWeeks: plan.frozenWeeks ?? 0,
    isFullWeek: (week) => !isHeldWeek(week, eff),
    capOf: (w) => {
      const original = plan.weeks[w];
      return (
        original && {
          targetM: original.targetVolumeM,
          plannedM: original.plannedVolumeM,
          longRunM: original.longRunM,
        }
      );
    },
    directive(w, weeks, reference) {
      refBefore[w] = reference;
      const notes: Message[] = [];
      const d: WeekDirective = { notes };
      if (w === 0) {
        // Tired in the week before the plan starts: the first week adapts.
        const monday = plan.weeks[0]!.startDate;
        const tired = effects.tiredDates.some((t) => t >= addDays(monday, -7) && t < monday);
        if (!tired) return undefined;
        notes.push({ key: "adapt.fatigue" });
        return { ...d, hold: true, easyQuality: 1 };
      }
      const prev = weeks[w - 1]!;

      // Still sick or injured on Monday: nothing to decide yet (13.4 applies once back).
      if (pauseOn(effects, addDays(prev.startDate, 7))) return undefined;
      const brk = breakEndingIn(weeks, w - 1, eff, plan.startDate, effects);
      if (brk) {
        const row = breakRow(brk.days);
        // Restart from the level before the break (never compounding).
        const ref = refBefore[brk.startWeek] ?? reference;
        d.restart = {
          volumeM: ref.volumeM * row.restartFactor,
          longRunM: ref.longRunM * row.restartFactor,
        };
        // Back mid-week: those first runs were already easy (see adjustWeek).
        const backedEarly = backIn(prev) !== undefined;
        if (row.easyFirstRuns && !backedEarly) d.easyFirstRuns = row.easyFirstRuns;
        if (row.paceFactor > paceFactor) {
          d.paceFactor = row.paceFactor / paceFactor;
          paceFactor = row.paceFactor;
        }
        easyOnlyLeft = row.easyOnlyWeeks;
        longestBreak = Math.max(longestBreak, brk.days);
        const key = breakKey(brk.days);
        notes.push({
          key: `adapt.break.${key === "short" && backedEarly ? "shortBack" : key}`,
          params: { days: brk.days },
        });
      } else if (strained(prev)) {
        const held = isHeldWeek(prev, eff);
        const tired = tiring(prev);
        if (w >= 2 && strained(weeks[w - 2]!)) {
          d.forceCutback = true;
          notes.push({ key: held ? "adapt.cutback" : "adapt.fatigueCutback" });
        } else if (held) {
          notes.push({ key: "adapt.hold", params: { distanceM: reference.volumeM } });
        } else {
          d.hold = true;
          notes.push({ key: "adapt.fatigue" });
        }
        if (tired) d.easyQuality = 1;
      }
      if (easyOnlyLeft > 0) {
        d.easyOnly = true;
        easyOnlyLeft--;
        if (!brk) notes.push({ key: "adapt.easyOnly" });
      }
      return notes.length > 0 ? d : undefined;
    },
    adjustWeek(_w, planned, before) {
      const days = new Map<IsoDate, DayChange[]>();
      const notes: Message[] = [];
      const note = (m: Message) => {
        if (!notes.some((n) => n.key === m.key)) notes.push(m);
      };
      const back = backIn(planned);
      let backRuns: { factor: number; firstRuns: number; since: IsoDate } | null = null;
      if (back) {
        const daysOff = daysOffBefore([...before, planned], back.until!, eff, plan.startDate);
        const row = breakRow(daysOff);
        const since = addDays(back.until!, -1);
        backRuns = row.easyOnlyWeeks
          ? { factor: row.restartFactor, firstRuns: Infinity, since }
          : { factor: 1, firstRuns: row.easyFirstRuns, since };
        note({ key: "adapt.back", params: { days: daysOff } });
      }
      const backDates = new Set(back ? backWeekDates(back) : []);
      let backSeen = 0;
      // Every change of a day is kept with its date: what was known before a
      // given day must not depend on later check-ins (see adjustBuiltWeek).
      for (const d of planned.days) {
        if (!d.workout || d.workout.type === "race") continue;
        const changes: DayChange[] = [];
        if (backRuns && backDates.has(d.date) && backSeen++ < backRuns.firstRuns)
          changes.push({ factor: backRuns.factor, since: backRuns.since });
        const pain = effects.painDates.get(d.date);
        if (pain) changes.push({ factor: A.painVolumeFactor, since: pain });
        const pause = pauseOn(effects, d.date);
        if (pause) {
          changes.push({ factor: 0, since: pause.since });
          note({ key: PAUSE_NOTE[pause.kind] });
        } else if (pain) note({ key: "adapt.pain" });
        if (changes.length) days.set(d.date, changes);
      }
      return days.size > 0 ? { days, notes } : undefined;
    },
  };

  const fresh = assemblePlan(plan.profile, plan.generatedOn, plan.startDate, plan.weeks, hooks);
  const sameFrame =
    fresh.weeks.length === plan.weeks.length &&
    fresh.weeks.every((w, i) => w.startDate === plan.weeks[i]!.startDate);
  if (!sameFrame) return plan; // cannot happen with an unchanged profile

  // A hold that lands on a cutback week: the cutback says it already.
  const weeks = fresh.weeks.map((w) => {
    if (!w.isCutback || !w.adaptations?.some((n) => n.key === "adapt.hold")) return w;
    const adaptations = w.adaptations.filter((n) => n.key !== "adapt.hold");
    const out: PlanWeek = { ...w, adaptations };
    if (adaptations.length === 0) delete out.adaptations;
    return out;
  });

  const warnings: PlanWarning[] = [...plan.warnings];
  if (longestBreak > A.newPlanAfterDays)
    warnings.push({ code: "long_break", params: { days: longestBreak } });
  const peakM = Math.max(...weeks.map((w) => w.plannedVolumeM));
  // While paused nothing is planned: wait for "I'm back" to judge the goal.
  if (plan.profile.targetTimeS && peakM < plan.summary.peakVolumeM && !openPause(log))
    warnings.push({ code: "goal_reassess" });

  return {
    ...plan,
    summary: { ...plan.summary, peakVolumeM: peakM, paceZones: fresh.summary.paceZones },
    weeks,
    warnings,
  };
}

export type LogResult = { ok: true; plan: TrainingPlan } | { ok: false; code: LogError };
export type LogError =
  | "in_future"
  | "no_workout"
  | "invalid_status"
  | "invalid_check_in"
  | "plan_over"
  | "paused"
  | "not_paused"
  | "nothing_to_undo";

/**
 * Record (or clear, with `null`) the status of the workout on `date`. Only
 * today or past days, and only days with a workout in the adapted plan.
 * Returns the stored plan with its updated log (adapt it to display).
 */
export function setWorkoutStatus(
  plan: TrainingPlan,
  date: IsoDate,
  status: WorkoutStatus | null,
  { today }: GenerateOptions,
): LogResult {
  if (status !== null && !WORKOUT_STATUSES.includes(status))
    return { ok: false, code: "invalid_status" };
  if (diffDays(date, today) < 0) return { ok: false, code: "in_future" };
  const shown = adaptPlan(plan);
  const workout = shown.weeks.flatMap((w) => w.days).find((d) => d.date === date)?.workout;
  if (!workout || workout.type === "race") return { ok: false, code: "no_workout" };

  const workouts = { ...plan.log?.workouts };
  if (status === null) delete workouts[date];
  else workouts[date] = status;
  return { ok: true, plan: { ...plan, log: { ...plan.log, workouts } } };
}

/**
 * §13.1: a check-in today. `sick` / `injured` pause the plan until `back`;
 * while paused, only `back` (or switching sick ↔ injured) makes sense.
 */
export function addCheckIn(
  plan: TrainingPlan,
  kind: CheckInKind,
  { today }: GenerateOptions,
): LogResult {
  if (!CHECK_IN_KINDS.includes(kind)) return { ok: false, code: "invalid_check_in" };
  if (diffDays(plan.raceDate, today) >= 0) return { ok: false, code: "plan_over" };
  const paused = openPause(plan.log) !== null;
  if (kind === "back" && !paused) return { ok: false, code: "not_paused" };
  if ((kind === "tired" || kind === "pain") && paused) return { ok: false, code: "paused" };
  const checkIns = [...(plan.log?.checkIns ?? []), { date: today, kind }];
  return {
    ok: true,
    plan: { ...plan, log: { workouts: { ...plan.log?.workouts }, checkIns } },
  };
}

/** Take back the last check-in, if it was made today. */
export function undoCheckIn(plan: TrainingPlan, { today }: GenerateOptions): LogResult {
  const list = plan.log?.checkIns ?? [];
  if (list.at(-1)?.date !== today) return { ok: false, code: "nothing_to_undo" };
  const checkIns = list.slice(0, -1);
  const log: TrainingLog = { workouts: { ...plan.log?.workouts } };
  if (checkIns.length) log.checkIns = checkIns;
  return { ok: true, plan: { ...plan, log } };
}

export { openPause, type Pause } from "./log";
