/** §13 training log helpers (shared by the adapter and the safety checker). */
import { CONFIG } from "../config";
import { addDays, weekdayIndex } from "../dates";
import type { CheckIn, IsoDate, PlanWeek, TrainingLog, WorkoutStatus } from "../types";

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

// ---------------------------------------------------------------------------
// §13.5 check-ins
// ---------------------------------------------------------------------------

/** Sick or injured: no running from the day after the check-in until `I'm back`. */
export interface Pause {
  kind: "sick" | "injured";
  /** Date of the check-in. */
  since: IsoDate;
  /** First paused day. */
  from: IsoDate;
  /** Date of `I'm back` (first day running again), or null while paused. */
  until: IsoDate | null;
}

export interface CheckInEffects {
  pauses: Pause[];
  /** Days after a `pain` check-in (the next 7 days): easy running, −20% → first check-in date. */
  painDates: Map<IsoDate, IsoDate>;
  /** Dates of `tired or sore` check-ins. */
  tiredDates: IsoDate[];
}

const byDate = (a: CheckIn, b: CheckIn) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

/**
 * What the check-ins mean, day by day. Check-ins change days from the next
 * day on: the check-in day itself is left to the runner (they can mark it).
 */
export function checkInEffects(log: TrainingLog | undefined): CheckInEffects {
  const pauses: Pause[] = [];
  const painDates = new Map<IsoDate, IsoDate>();
  const tiredDates: IsoDate[] = [];
  let open: Pause | null = null;
  for (const c of [...(log?.checkIns ?? [])].sort(byDate)) {
    if (c.kind === "sick" || c.kind === "injured") {
      if (open) open.kind = c.kind;
      else {
        open = { kind: c.kind, since: c.date, from: addDays(c.date, 1), until: null };
        pauses.push(open);
      }
    } else if (c.kind === "back") {
      if (open) open.until = c.date;
      open = null;
    } else if (c.kind === "pain") {
      for (let i = 1; i <= CONFIG.adaptation.painDays; i++) {
        const d = addDays(c.date, i);
        if (!painDates.has(d)) painDates.set(d, c.date);
      }
    } else tiredDates.push(c.date);
  }
  return { pauses: pauses.filter((p) => !p.until || p.until > p.from), painDates, tiredDates };
}

export const pauseOn = (e: CheckInEffects, date: IsoDate): Pause | undefined =>
  e.pauses.find((p) => date >= p.from && (p.until === null || date < p.until));

/** The pause going on (no `I'm back` yet), if any. */
export const openPause = (log: TrainingLog | undefined): Pause | null =>
  checkInEffects(log).pauses.find((p) => p.until === null) ?? null;

/** After `I'm back` mid-week: the days left in that week (the next week restarts, 13.4). */
export function backWeekDates(p: Pause): IsoDate[] {
  if (!p.until || weekdayIndex(p.until) === 0) return [];
  return Array.from({ length: 7 - weekdayIndex(p.until) }, (_, i) => addDays(p.until!, i));
}

/** Days whose workouts check-ins change (paused, pain, rest of the week back). */
export function adjustedDates(e: CheckInEffects): Set<IsoDate> {
  const out = new Set(e.painDates.keys());
  for (const p of e.pauses) for (const d of backWeekDates(p)) out.add(d);
  return out;
}

/** True if check-ins change any day of the week (it is then never a reference, like 13.3). */
export function isAdjustedWeek(week: PlanWeek, e: CheckInEffects): boolean {
  const adjusted = adjustedDates(e);
  return week.days.some((d) => adjusted.has(d.date) || pauseOn(e, d.date) !== undefined);
}
