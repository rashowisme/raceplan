"use client";

import { Timer } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { applyTimeTrialResult, findTimeTrial } from "@/engine";
import { diffDays } from "@/engine/dates";
import type { TrainingPlan } from "@/engine/types";
import { inputClass } from "@/features/plan-form/fields";
import { formatDistance, parseClock } from "@/lib/units";
import { getPlanRepository, PLAN_CHANGED_EVENT } from "@/storage";
import type { Formatter } from "./format";
import { CURRENT_PLAN_ID } from "./useCurrentPlan";

export const TIME_TRIAL_CARD_ID = "time-trial-result";

const ERRORS = new Set(["time_format", "implausible_time", "in_future", "before_plan"]);

/** Effort-only plans: enter the time trial result to get paces (spec §3.4). */
export function TimeTrialCard({
  f,
  plan,
  today,
}: {
  f: Formatter;
  plan: TrainingPlan;
  today: string;
}) {
  const id = useId();
  const tt = findTimeTrial(plan);
  const [time, setTime] = useState("");
  const [date, setDate] = useState(() => (tt && diffDays(tt.date, today) >= 0 ? tt.date : today));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  if (plan.summary.paceZones || !tt) return null;

  const distance = formatDistance(tt.distanceM, f.unit, f.locale);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const timeS = parseClock(time);
    if (timeS === null) return setError("time_format");
    const result = applyTimeTrialResult(plan, { distanceM: tt.distanceM, timeS, date }, { today });
    if (!result.ok) return setError(result.refusal.issues?.[0]?.code ?? "generic");
    setError(null);
    setSaving(true);
    await getPlanRepository().save(result.plan, CURRENT_PLAN_ID);
    window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
  };

  return (
    <section
      id={TIME_TRIAL_CARD_ID}
      className="bg-card scroll-mt-20 rounded-xl border p-4"
      aria-labelledby={`${id}-title`}
    >
      <h2 id={`${id}-title`} className="flex items-center gap-2 font-semibold">
        <Timer className="text-primary size-4" aria-hidden />
        {f.t("plan.timeTrial.title")}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        {f.t("plan.timeTrial.intro", { distance })}
      </p>
      <form onSubmit={submit} noValidate className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-32 flex-1 space-y-1.5">
          <label htmlFor={`${id}-time`} className="block text-sm font-semibold">
            {f.t("plan.timeTrial.time", { distance })}
          </label>
          <input
            id={`${id}-time`}
            className={inputClass}
            inputMode="numeric"
            placeholder="15:30"
            autoComplete="off"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
          />
        </div>
        <div className="min-w-36 flex-1 space-y-1.5">
          <label htmlFor={`${id}-date`} className="block text-sm font-semibold">
            {f.t("plan.timeTrial.date")}
          </label>
          <input
            id={`${id}-date`}
            type="date"
            className={inputClass}
            value={date}
            min={plan.generatedOn}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-11" disabled={saving}>
          {f.t("plan.timeTrial.submit")}
        </Button>
      </form>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-destructive mt-2 text-sm font-medium">
          {f.t(`plan.timeTrial.errors.${ERRORS.has(error) ? error : "generic"}`)}
        </p>
      )}
      <p className="text-muted-foreground mt-2 text-xs">{f.t("plan.timeTrial.keepsPast")}</p>
    </section>
  );
}
