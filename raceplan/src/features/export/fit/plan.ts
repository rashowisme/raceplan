/** Watch files for a plan: names, file names and the whole-plan archive. */
import type { PlanDay, PlanWeek, TrainingPlan } from "@/engine/types";
import { formatDate, formatMessage, type Formatter } from "@/features/plan-calendar/format";
import { downloadBlob } from "@/lib/download";
import { workoutToFit } from "./workout";
import { zip } from "./zip";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Name in the watch's workout list, e.g. "W05 Tue · Tempo run". The padded
 * week number keeps workouts in plan order when the list is sorted by name.
 */
export function watchWorkoutName(f: Formatter, week: PlanWeek, day: PlanDay): string {
  return f.t("watch.workoutName", {
    week: pad(week.index + 1),
    day: formatDate(f.locale, day.date, { weekday: "short" }),
    title: formatMessage(f, day.workout!.title),
  });
}

/** e.g. `w05-2026-12-01-tempo.fit` (ASCII, sorts in plan order). */
export const watchFileName = (week: PlanWeek, day: PlanDay) =>
  `w${pad(week.index + 1)}-${day.date}-${day.workout!.type}.fit`;

export const watchArchiveName = (plan: TrainingPlan) =>
  `raceplan-${plan.profile.race.type}-${plan.raceDate}-watch.zip`;

export function dayToFit(f: Formatter, plan: TrainingPlan, week: PlanWeek, day: PlanDay) {
  return workoutToFit(f, day.workout!, {
    name: watchWorkoutName(f, week, day),
    createdOn: plan.generatedOn,
    trail: plan.profile.race.type === "trail",
  });
}

/** Week and day of a date, if it has a workout. */
export function findWorkoutDay(plan: TrainingPlan, date: string) {
  for (const week of plan.weeks)
    for (const day of week.days) if (day.date === date && day.workout) return { week, day };
  return null;
}

/**
 * Workouts from `fromDate` on (past sessions would only clutter the watch),
 * one FIT file each, in a ZIP archive.
 */
export function planToWatchArchive(f: Formatter, plan: TrainingPlan, fromDate: string): Uint8Array {
  return zip(
    plan.weeks.flatMap((week) =>
      week.days
        .filter((day) => day.workout && day.date >= fromDate)
        .map((day) => {
          const [year, month, d] = day.date.split("-").map(Number) as [number, number, number];
          return {
            name: watchFileName(week, day),
            data: dayToFit(f, plan, week, day),
            date: { year, month, day: d },
          };
        }),
    ),
  );
}

const save = (data: Uint8Array, name: string, type: string) =>
  downloadBlob(new Blob([data as BlobPart], { type }), name);

export function downloadWorkoutFit(f: Formatter, plan: TrainingPlan, date: string): void {
  const found = findWorkoutDay(plan, date);
  if (!found) return;
  save(
    dayToFit(f, plan, found.week, found.day),
    watchFileName(found.week, found.day),
    "application/vnd.ant.fit",
  );
}

export function downloadPlanFit(f: Formatter, plan: TrainingPlan, fromDate: string): void {
  save(planToWatchArchive(f, plan, fromDate), watchArchiveName(plan), "application/zip");
}
