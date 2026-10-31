"use client";

import { CircleCheck, CircleX, Flame } from "lucide-react";
import { useState } from "react";
import { setWorkoutStatus } from "@/engine";
import { WORKOUT_STATUSES, type TrainingPlan, type WorkoutStatus } from "@/engine/types";
import { cn } from "@/lib/utils";
import { getPlanRepository, PLAN_CHANGED_EVENT } from "@/storage";
import type { Formatter } from "./format";
import { CURRENT_PLAN_ID } from "./useCurrentPlan";

export const STATUS_ICON = { done: CircleCheck, missed: CircleX, hard: Flame } as const;
export const STATUS_COLOR: Record<WorkoutStatus, string> = {
  done: "text-success",
  missed: "text-destructive",
  hard: "text-phase-build",
};

/**
 * §13.1: "How did it go?" for today's and past workouts. Updates the stored
 * plan's log; the plan shown adapts from the next Monday.
 */
export function WorkoutLogControls({
  f,
  stored,
  date,
  today,
}: {
  f: Formatter;
  /** The stored plan (original + log), not the adapted one. */
  stored: TrainingPlan;
  date: string;
  today: string;
}) {
  const [failed, setFailed] = useState(false);
  if (date > today) return null;
  const current = stored.log?.workouts[date];

  const choose = async (status: WorkoutStatus) => {
    const r = setWorkoutStatus(stored, date, current === status ? null : status, { today });
    if (!r.ok) {
      setFailed(true);
      return;
    }
    setFailed(false);
    await getPlanRepository().save(r.plan, CURRENT_PLAN_ID);
    window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
  };

  return (
    <fieldset className="space-y-2 rounded-lg border p-3">
      <legend className="px-1 text-sm font-semibold">{f.t("log.title")}</legend>
      <div className="grid grid-cols-3 gap-2">
        {WORKOUT_STATUSES.map((s) => {
          const Icon = STATUS_ICON[s];
          const active = current === s;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              onClick={() => void choose(s)}
              className={cn(
                "focus-visible:ring-ring flex h-11 items-center justify-center gap-1.5 rounded-md border px-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                active ? "border-primary bg-primary/10" : "hover:bg-muted",
              )}
            >
              <Icon className={cn("size-4 shrink-0", STATUS_COLOR[s])} aria-hidden />
              {f.t(`log.${s}`)}
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground text-xs">{f.t("log.hint")}</p>
      {failed && (
        <p role="alert" className="text-destructive text-xs">
          {f.t("log.error")}
        </p>
      )}
    </fieldset>
  );
}
