"use client";

import { Info, Mountain, Repeat2, Timer, Route } from "lucide-react";
import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlanDay, Workout } from "@/engine/types";
import { formatDuration } from "@/lib/units";
import { cn } from "@/lib/utils";
import {
  effortDescription,
  effortLabel,
  formatDateLong,
  formatMessage,
  formatWorkoutDistance,
  formatWorkoutElevation,
  mainEffort,
  stepLines,
  type Formatter,
} from "./format";
import { DAY_DOT, dayKind } from "./styles";

/** Structured workout content (also used inline in tests). */
export function WorkoutBody({
  f,
  workout,
  crossTraining,
}: {
  f: Formatter;
  workout: Workout;
  crossTraining?: boolean;
}) {
  const effort = mainEffort(workout);
  const lines = stepLines(f, workout.steps);
  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Stat icon={Route} label={f.t("plan.distance")} value={formatWorkoutDistance(f, workout)} />
        <Stat
          icon={Timer}
          label={f.t("plan.duration")}
          value={formatDuration(workout.estDurationS)}
        />
        {workout.elevationGainM !== undefined ? (
          <Stat
            icon={Mountain}
            label={f.t("plan.elevation")}
            value={formatWorkoutElevation(f, workout.elevationGainM)}
          />
        ) : (
          <Stat icon={Repeat2} label={f.t("plan.effort")} value={effortLabel(f, effort)} />
        )}
      </dl>

      <p className="bg-muted rounded-lg p-3 text-sm">
        <span className="font-semibold">{effortLabel(f, effort)}:</span>{" "}
        {effortDescription(f, effort)}
      </p>

      <div>
        <h3 className="mb-2 text-sm font-semibold">{f.t("plan.structure")}</h3>
        <ol className="space-y-1.5">
          {lines.map((l, i) => (
            <li
              key={i}
              style={{ marginLeft: `${l.depth * 1.25}rem` }}
              className={cn(
                "rounded-md border px-3 py-2 text-sm",
                l.kind === "repeat" && "bg-muted/60 border-dashed font-semibold",
                l.kind === "work" && "border-l-phase-specific border-l-4",
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="font-medium">
                  {l.kind === "repeat" ? l.label : `${l.label} · ${l.amount}`}
                  {l.terrain && (
                    <span className="text-muted-foreground font-normal"> · {l.terrain}</span>
                  )}
                </span>
                {l.target && (
                  <span className="text-muted-foreground text-xs tabular-nums">{l.target}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {(workout.notes.length > 0 || crossTraining || workout.optional) && (
        <ul className="space-y-2 text-sm">
          {workout.optional && <Note>{f.t("plan.optionalNote")}</Note>}
          {workout.notes.map((n) => (
            <Note key={n.key}>{formatMessage(f, n)}</Note>
          ))}
          {crossTraining && <Note>{f.t("plan.crossTraining")}</Note>}
        </ul>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Route; label: string; value: string }) {
  return (
    <div className="rounded-lg border p-2">
      <dt className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <Info className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

export function WorkoutDialog({
  f,
  day,
  onOpenChange,
  onEnterResult,
  actions,
}: {
  f: Formatter;
  day: PlanDay | null;
  onOpenChange: (open: boolean) => void;
  /** Effort-only plans: jump to the time trial result card. */
  onEnterResult?: () => void;
  /** Rendered below the workout (e.g. the watch download). */
  actions?: React.ReactNode;
}) {
  const workout = day?.workout ?? null;
  // Set when closing via "Enter my result": focus goes to the card, not back to the day.
  const toResult = useRef(false);
  return (
    <Dialog open={!!workout} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
        onCloseAutoFocus={(e) => {
          if (!toResult.current) return;
          toResult.current = false;
          e.preventDefault();
          onEnterResult?.();
        }}
      >
        {day && workout && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span
                  className={cn("size-2.5 rounded-full", DAY_DOT[dayKind(workout)])}
                  aria-hidden
                />
                <DialogDescription className="text-xs font-medium tracking-wide uppercase">
                  {formatDateLong(f.locale, day.date)}
                </DialogDescription>
              </div>
              <DialogTitle className="text-xl">{formatMessage(f, workout.title)}</DialogTitle>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{f.t(`intensity.${workout.intensity}`)}</Badge>
                {workout.optional && <Badge variant="outline">{f.t("plan.optional")}</Badge>}
              </div>
            </DialogHeader>
            <WorkoutBody f={f} workout={workout} crossTraining={day.crossTrainingSuggested} />
            {workout.type === "timeTrial" && onEnterResult && (
              <Button
                onClick={() => {
                  toResult.current = true;
                  onOpenChange(false);
                }}
                className="h-11 w-full"
              >
                <Timer aria-hidden />
                {f.t("plan.enterResult")}
              </Button>
            )}
            {actions}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
