"use client";

import { Watch } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TrainingPlan } from "@/engine/types";
import type { Formatter } from "@/features/plan-calendar/format";
import { downloadPlanFit, downloadWorkoutFit } from "./plan";

function useSafeAction() {
  const [failed, setFailed] = useState(false);
  const run = (action: () => void) => {
    setFailed(false);
    try {
      action();
    } catch (e) {
      console.error(e);
      setFailed(true);
    }
  };
  return { failed, run };
}

/** Plan header: upcoming workouts as a ZIP of FIT files. */
export function WatchPlanButton({
  plan,
  f,
  today,
}: {
  plan: TrainingPlan;
  f: Formatter;
  today: string;
}) {
  const hintId = useId();
  const { failed, run } = useSafeAction();
  const upcoming = plan.weeks.some((w) => w.days.some((d) => d.workout && d.date >= today));
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        disabled={!upcoming}
        title={f.t("watch.exportPlanHint")}
        aria-describedby={hintId}
        onClick={() => run(() => downloadPlanFit(f, plan, today))}
      >
        <Watch aria-hidden />
        {f.t("watch.exportPlan")}
      </Button>
      <span id={hintId} className="sr-only">
        {f.t("watch.exportPlanHint")}
      </span>
      {failed && (
        <p role="alert" className="text-destructive text-xs">
          {f.t("watch.error")}
        </p>
      )}
    </div>
  );
}

/** Workout dialog: this workout as one FIT file, with how to load it. */
export function WatchWorkoutButton({
  plan,
  f,
  date,
}: {
  plan: TrainingPlan;
  f: Formatter;
  date: string;
}) {
  const { failed, run } = useSafeAction();
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="h-11 w-full"
        onClick={() => run(() => downloadWorkoutFit(f, plan, date))}
      >
        <Watch aria-hidden />
        {f.t("watch.exportWorkout")}
      </Button>
      <p className="text-muted-foreground text-xs">{f.t("watch.help")}</p>
      {failed && (
        <p role="alert" className="text-destructive text-xs">
          {f.t("watch.error")}
        </p>
      )}
    </div>
  );
}
