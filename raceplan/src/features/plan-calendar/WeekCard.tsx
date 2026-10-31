"use client";

import { ChevronRight, Flag, Info } from "lucide-react";
import { addDays } from "@/engine/dates";
import {
  WEEKDAYS,
  type PlanDay,
  type PlanWeek,
  type TrainingLog,
  type WorkoutStatus,
} from "@/engine/types";
import { formatDistance, formatDuration, formatElevation } from "@/lib/units";
import { cn } from "@/lib/utils";
import { formatDayShort, formatMessage, type Formatter } from "./format";
import { DAY_DOT, dayKind, PHASE_CLASSES } from "./styles";
import { STATUS_COLOR, STATUS_ICON } from "./WorkoutLog";

interface WeekCardProps {
  f: Formatter;
  week: PlanWeek;
  today: string;
  isCurrent: boolean;
  onSelect: (day: PlanDay) => void;
  log?: TrainingLog;
}

export function WeekCard({ f, week, today, isCurrent, onSelect, log }: WeekCardProps) {
  const phase = PHASE_CLASSES[week.phase];
  const byWeekday = new Map(week.days.map((d) => [d.weekday, d]));
  const end = addDays(week.startDate, 6);
  return (
    <section
      id={`week-${week.index + 1}`}
      aria-labelledby={`week-${week.index + 1}-title`}
      className={cn(
        "bg-card scroll-mt-20 overflow-hidden rounded-xl border border-l-4",
        phase.accent,
        isCurrent && "ring-primary/40 ring-2",
      )}
    >
      <header className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border-b px-4 py-3 sm:flex sm:flex-wrap">
        <div className="sm:mr-auto">
          <h3 id={`week-${week.index + 1}-title`} className="font-semibold">
            {f.t("plan.week", { n: week.index + 1 })}
            {isCurrent && (
              <span className="text-primary ml-2 text-xs font-semibold">
                · {f.t("plan.thisWeek")}
              </span>
            )}
          </h3>
          <p className="text-muted-foreground text-xs">
            {formatDayShort(f.locale, week.startDate)} – {formatDayShort(f.locale, end)}
          </p>
        </div>
        <div className="col-span-2 row-start-2 flex flex-wrap items-center gap-1.5 sm:order-none">
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", phase.badge)}>
            {f.t(`phase.${week.phase}`)}
          </span>
          {week.isCutback && (
            <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-semibold">
              {f.t("plan.cutback")}
            </span>
          )}
          {week.isRaceWeek && (
            <span className="bg-phase-race/15 rounded-full px-2 py-0.5 text-xs font-semibold">
              {f.t("plan.raceWeek")}
            </span>
          )}
        </div>
        <div className="col-start-2 row-start-1 text-right tabular-nums">
          <p className="text-sm font-semibold">
            {formatDistance(week.plannedVolumeM, f.unit, f.locale, 0)}
          </p>
          <p className="text-muted-foreground text-xs">
            {formatDuration(week.plannedDurationS)}
            {week.elevationGainM
              ? ` · ${f.t("plan.weekClimb", { gainM: formatElevation(week.elevationGainM, f.unit, f.locale) })}`
              : ""}
          </p>
        </div>
      </header>
      {week.adaptations && week.adaptations.length > 0 && (
        <div className="bg-primary/5 border-b px-4 py-2.5 text-sm">
          <p className="text-primary flex items-center gap-1.5 text-xs font-semibold">
            <Info className="size-3.5" aria-hidden />
            {f.t("adapt.title")}
          </p>
          {week.adaptations.map((n) => (
            <p key={n.key} className="mt-1">
              {formatMessage(f, n)}
            </p>
          ))}
        </div>
      )}
      <ol className="divide-y md:grid md:grid-cols-7 md:divide-x md:divide-y-0">
        {WEEKDAYS.map((wd, i) => {
          const day = byWeekday.get(wd);
          const date = addDays(week.startDate, i);
          return (
            <li key={wd} className="md:min-h-28">
              <DayCell
                f={f}
                day={day}
                date={date}
                isToday={date === today}
                onSelect={onSelect}
                status={log?.workouts[date]}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function DayCell({
  f,
  day,
  date,
  isToday,
  onSelect,
  status,
}: {
  f: Formatter;
  day: PlanDay | undefined;
  date: string;
  isToday: boolean;
  onSelect: (day: PlanDay) => void;
  status?: WorkoutStatus;
}) {
  const wd = WEEKDAYS[(new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7]!;
  const dateLabel = (
    <span className="flex items-baseline gap-1.5 md:flex-col md:gap-0">
      <span className={cn("text-xs font-semibold uppercase", isToday && "text-primary")}>
        {f.t(`common.weekdaysShort.${wd}`)}
      </span>
      <span className="text-muted-foreground text-xs">{formatDayShort(f.locale, date)}</span>
    </span>
  );

  if (!day) {
    // Outside the plan (before start / after race).
    return (
      <div className="text-muted-foreground/60 flex h-full items-center gap-3 px-4 py-2.5 opacity-60 md:flex-col md:items-start md:px-2.5">
        {dateLabel}
      </div>
    );
  }

  const w = day.workout;
  const kind = dayKind(w);
  if (!w) {
    return (
      <div
        className={cn(
          "flex h-full items-center gap-3 px-4 py-2.5 md:flex-col md:items-start md:px-2.5",
          isToday && "bg-primary/5",
        )}
      >
        <div className="w-16 shrink-0 md:w-auto">{dateLabel}</div>
        <span className="text-muted-foreground text-sm">{f.t("plan.rest")}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      aria-label={`${f.t(`common.weekdays.${wd}`)} ${formatDayShort(f.locale, date)}: ${formatMessage(f, w.title)}${status ? ` (${f.t(`log.status.${status}`)})` : ""}`}
      className={cn(
        "hover:bg-muted/60 focus-visible:ring-ring flex h-full w-full items-center gap-3 px-4 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset md:flex-col md:items-start md:gap-1.5 md:px-2.5",
        isToday && "bg-primary/5",
        kind === "race" && "bg-phase-race/10 hover:bg-phase-race/15",
      )}
    >
      <div className="w-16 shrink-0 md:w-auto">{dateLabel}</div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm leading-tight font-semibold">
          {kind === "race" ? (
            <Flag className="text-phase-race size-3.5 shrink-0" aria-hidden />
          ) : (
            <span className={cn("size-2 shrink-0 rounded-full", DAY_DOT[kind])} aria-hidden />
          )}
          <span
            className={cn(
              "truncate md:whitespace-normal",
              status === "missed" && "text-muted-foreground line-through",
            )}
          >
            {f.t(`workoutType.${w.type}`)}
          </span>
          {status && <StatusIcon status={status} />}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
          {formatDistance(w.estDistanceM, f.unit, f.locale)} · {formatDuration(w.estDurationS)}
          {w.optional && ` · ${f.t("plan.optional")}`}
        </p>
      </div>
      <ChevronRight className="text-muted-foreground size-4 shrink-0 md:hidden" aria-hidden />
    </button>
  );
}

function StatusIcon({ status }: { status: WorkoutStatus }) {
  const Icon = STATUS_ICON[status];
  return <Icon className={cn("size-3.5 shrink-0", STATUS_COLOR[status])} aria-hidden />;
}
