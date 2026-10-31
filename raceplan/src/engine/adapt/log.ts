/** §13 training log helpers (shared by the adapter and the safety checker). */
import { CONFIG } from "../config";
import type { PlanWeek, TrainingLog, WorkoutStatus } from "../types";

export const statusOn = (log: TrainingLog | undefined, date: string): WorkoutStatus | undefined =>
  log?.workouts[date];

/** Missed planned distance ÷ planned distance of the week (race excluded). */
export function missedShare(week: PlanWeek, log: TrainingLog | undefined): number {
  if (!log) return 0;
  let planned = 0;
  let missed = 0;
  for (const d of week.days) {
    const w = d.workout;
    if (!w || w.type === "race") continue;
    planned += w.estDistanceM;
    if (log.workouts[d.date] === "missed") missed += w.estDistanceM;
  }
  return planned > 0 ? missed / planned : 0;
}

/**
 * A week with ≥ 20% missed isn't a step up: it never serves as the reference
 * for the next week's increase (§13.2, §13.3).
 */
export const isHeldWeek = (week: PlanWeek, log: TrainingLog | undefined) =>
  missedShare(week, log) >= CONFIG.adaptation.holdMissedShare;
