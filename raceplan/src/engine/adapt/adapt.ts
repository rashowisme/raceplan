/**
 * Spec §13: adapt the coming weeks to what the runner logged.
 *
 * The stored plan is the original plan plus its log; the plan shown is
 * `adaptPlan(stored)`. Week by week, what the log says about week w decides
 * how week w + 1 is built (the next Monday): weeks before the first change
 * are kept as they are, every later week is rebuilt by the normal builder,
 * which continues the progression from what was really run. Nothing is ever
 * added to make up for missed training, and no week goes above the original.
 */
import { assemblePlan, type AssembleHooks, type WeekDirective } from "../builder/plan";
import { CONFIG } from "../config";
import { addDays, diffDays } from "../dates";
import {
  WORKOUT_STATUSES,
  type GenerateOptions,
  type IsoDate,
  type Message,
  type PlanWarning,
  type PlanWeek,
  type TrainingLog,
  type TrainingPlan,
  type WorkoutStatus,
} from "../types";
import { isHeldWeek, missedShare } from "./log";

const A = CONFIG.adaptation;

interface Break {
  /** Days without running: last run before → last missed session. */
  days: number;
  /** Week in which the missed streak started. */
  startWeek: number;
}

/**
 * The break that ends in week `k` as far as the log tells at the end of that
 * week, if any: a week with more than 50% missed (≥ 7 days), or a streak of
 * missed sessions covering more than 7 days.
 */
function breakEndingIn(
  weeks: readonly PlanWeek[],
  k: number,
  log: TrainingLog,
  planStart: IsoDate,
) {
  const runs: { date: IsoDate; week: number; missed: boolean }[] = [];
  for (const w of weeks.slice(0, k + 1))
    for (const d of w.days)
      if (d.workout && d.workout.type !== "race")
        runs.push({ date: d.date, week: w.index, missed: log.workouts[d.date] === "missed" });

  let end = runs.length - 1;
  while (end >= 0 && !runs[end]!.missed) end--;
  if (end < 0 || runs[end]!.week !== k) return null;
  let start = end;
  while (start > 0 && runs[start - 1]!.missed) start--;
  const lastRun = start > 0 ? runs[start - 1]!.date : addDays(planStart, -1);

  let days = diffDays(lastRun, runs[end]!.date);
  const broken = missedShare(weeks[k]!, log) > A.breakMissedShare;
  if (broken) days = Math.max(days, 7);
  if (!broken && days <= 7) return null;
  return { days, startWeek: runs[start]!.week } satisfies Break;
}

const breakKey = (days: number) =>
  days <= 7 ? "short" : days <= 14 ? "medium" : days <= A.newPlanAfterDays ? "long" : "veryLong";

/** The plan to show: the stored plan adapted to its log (§13). Pure and deterministic. */
export function adaptPlan(plan: TrainingPlan): TrainingPlan {
  const log = plan.log;
  if (!log || !Object.values(log.workouts).includes("missed")) return plan;

  const refBefore: { volumeM: number; longRunM: number }[] = [];
  let easyOnlyLeft = 0;
  let paceFactor = 1;
  let longestBreak = 0;

  const hooks: AssembleHooks = {
    frozenWeeks: plan.frozenWeeks ?? 0,
    isFullWeek: (week) => !isHeldWeek(week, log),
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
      if (w === 0) return undefined;
      const notes: Message[] = [];
      const d: WeekDirective = { notes };

      const brk = breakEndingIn(weeks, w - 1, log, plan.startDate);
      if (brk) {
        const row = A.breaks.find((r) => brk.days <= r.maxDays) ?? A.breaks.at(-1)!;
        // Restart from the level before the break (never compounding).
        const ref = refBefore[brk.startWeek] ?? reference;
        d.restart = {
          volumeM: ref.volumeM * row.restartFactor,
          longRunM: ref.longRunM * row.restartFactor,
        };
        if (row.easyFirstRuns) d.easyFirstRuns = row.easyFirstRuns;
        if (row.paceFactor > paceFactor) {
          d.paceFactor = row.paceFactor / paceFactor;
          paceFactor = row.paceFactor;
        }
        easyOnlyLeft = row.easyOnlyWeeks;
        longestBreak = Math.max(longestBreak, brk.days);
        notes.push({ key: `adapt.break.${breakKey(brk.days)}`, params: { days: brk.days } });
      } else if (isHeldWeek(weeks[w - 1]!, log)) {
        if (w >= 2 && isHeldWeek(weeks[w - 2]!, log)) {
          d.forceCutback = true;
          notes.push({ key: "adapt.cutback" });
        } else {
          notes.push({ key: "adapt.hold", params: { distanceM: reference.volumeM } });
        }
      }
      if (easyOnlyLeft > 0) {
        d.easyOnly = true;
        easyOnlyLeft--;
        if (!brk) notes.push({ key: "adapt.easyOnly" });
      }
      return notes.length > 0 ? d : undefined;
    },
  };

  const fresh = assemblePlan(plan.profile, plan.generatedOn, plan.startDate, plan.weeks, hooks);
  const sameFrame =
    fresh.weeks.length === plan.weeks.length &&
    fresh.weeks.every((w, i) => w.startDate === plan.weeks[i]!.startDate);
  if (!sameFrame) return plan; // cannot happen with an unchanged profile

  const warnings: PlanWarning[] = [...plan.warnings];
  if (longestBreak > A.newPlanAfterDays)
    warnings.push({ code: "long_break", params: { days: longestBreak } });
  const peakM = Math.max(...fresh.weeks.map((w) => w.plannedVolumeM));
  if (plan.profile.targetTimeS && peakM < plan.summary.peakVolumeM)
    warnings.push({ code: "goal_reassess" });

  return {
    ...plan,
    summary: { ...plan.summary, peakVolumeM: peakM, paceZones: fresh.summary.paceZones },
    weeks: fresh.weeks,
    warnings,
  };
}

export type LogResult = { ok: true; plan: TrainingPlan } | { ok: false; code: LogError };
export type LogError = "in_future" | "no_workout" | "invalid_status";

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
  return { ok: true, plan: { ...plan, log: { workouts } } };
}
