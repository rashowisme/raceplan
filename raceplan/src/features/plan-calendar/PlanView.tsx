"use client";

import { CalendarCheck, CalendarDays, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { buttonVariants, Button } from "@/components/ui/button";
import { adaptPlan } from "@/engine";
import { diffDays } from "@/engine/dates";
import type { PlanDay, TrainingPlan } from "@/engine/types";
import { Link } from "@/i18n/navigation";
import { localToday } from "@/lib/today";
import { formatClock, formatDistance } from "@/lib/units";
import { cn } from "@/lib/utils";
import { WatchPlanButton, WatchWorkoutButton } from "@/features/export/fit/WatchExportButtons";
import { BackupCard, LoadBackupButton } from "@/features/backup/BackupControls";
import { ExportPdfButton } from "@/features/export/pdf/ExportPdfButton";
import { CheckInCard } from "./CheckIn";
import { formatDateLong, type Formatter } from "./format";
import { PaceZonesCard, PhaseTimeline, PlanAlerts } from "./PlanSections";
import { TIME_TRIAL_CARD_ID, TimeTrialCard } from "./TimeTrialCard";
import { useCurrentPlan } from "./useCurrentPlan";
import { usePlanFormatter } from "./usePlanFormatter";
import { WeekCard } from "./WeekCard";
import { WorkoutDialog } from "./WorkoutDetail";
import { WorkoutLogControls } from "./WorkoutLog";

export function PlanView() {
  const t = useTranslations("plan");
  const tAll = useTranslations();
  const current = useCurrentPlan();
  if (current.status === "loading") {
    return <div className="mx-auto h-96 w-full max-w-5xl animate-pulse px-4 py-10" aria-busy />;
  }
  if (current.status === "empty") {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-20 text-center">
        <CalendarDays className="text-muted-foreground mx-auto size-10" aria-hidden />
        <h1 className="mt-4 text-xl font-bold">{t("empty")}</h1>
        <Link href="/plan/new" className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11")}>
          {t("createOne")}
        </Link>
        <div className="mt-4 flex justify-center">
          <LoadBackupButton t={tAll} confirmReplace={false} variant="ghost" />
        </div>
      </div>
    );
  }
  return <PlanContent stored={current.stored.plan} />;
}

/** `stored` = original plan + training log; the plan shown is adapted to the log (§13). */
function PlanContent({ stored }: { stored: TrainingPlan }) {
  const plan = useMemo(() => adaptPlan(stored), [stored]);
  const f = usePlanFormatter(plan);
  const [today] = useState(() => localToday());
  const [selected, setSelected] = useState<PlanDay | null>(null);
  const currentWeek = plan.weeks.find(
    (w) => diffDays(w.startDate, today) >= 0 && diffDays(w.startDate, today) < 7,
  );

  const jumpTo = (index: number) =>
    document
      .getElementById(`week-${index + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:py-8">
      <PlanHeader f={f} plan={plan} today={today} />
      <PlanAlerts f={f} plan={plan} />
      <CheckInCard f={f} stored={stored} today={today} />
      <PhaseTimeline f={f} plan={plan} onJump={jumpTo} />
      <PaceZonesCard f={f} plan={plan} />
      <TimeTrialCard f={f} plan={plan} today={today} />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{f.t("plan.calendarTitle")}</h2>
        {currentWeek && (
          <Button variant="outline" size="sm" onClick={() => jumpTo(currentWeek.index)}>
            <CalendarCheck aria-hidden />
            {f.t("plan.thisWeek")}
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {plan.weeks.map((w) => (
          <WeekCard
            key={w.index}
            f={f}
            week={w}
            today={today}
            isCurrent={w.index === currentWeek?.index}
            onSelect={setSelected}
            log={stored.log}
          />
        ))}
      </div>

      <BackupCard t={f.t} stored={stored} />
      <p className="text-muted-foreground border-t pt-4 text-xs">{f.t(plan.disclaimer.key)}</p>
      <WorkoutDialog
        f={f}
        day={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        log={
          selected && (
            <WorkoutLogControls f={f} stored={stored} date={selected.date} today={today} />
          )
        }
        actions={selected && <WatchWorkoutButton plan={plan} f={f} date={selected.date} />}
        onEnterResult={
          plan.summary.paceZones
            ? undefined
            : () => {
                const card = document.getElementById(TIME_TRIAL_CARD_ID);
                card?.scrollIntoView({ behavior: "smooth", block: "start" });
                card?.querySelector("input")?.focus({ preventScroll: true });
              }
        }
      />
    </div>
  );
}

function PlanHeader({ f, plan, today }: { f: Formatter; plan: TrainingPlan; today: string }) {
  const s = plan.summary;
  const race = plan.profile.race;
  const daysLeft = diffDays(today, plan.raceDate);
  const raceName =
    race.type === "custom" || race.type === "trail"
      ? `${f.t(`form.raceType.${race.type}`)} · ${formatDistance(s.raceDistanceM, f.unit, f.locale)}`
      : f.t(`form.raceType.${race.type}`);

  const stats = [
    { label: f.t("plan.stats.weeks"), value: String(s.totalWeeks) },
    { label: f.t("plan.stats.runsPerWeek"), value: String(s.runningDaysPerWeek) },
    { label: f.t("plan.stats.peak"), value: formatDistance(s.peakVolumeM, f.unit, f.locale, 0) },
    {
      label: s.fitness ? f.t("plan.stats.prediction") : f.t("plan.stats.style"),
      value: s.fitness
        ? formatClock(s.fitness.predictedRaceTimeS)
        : f.t(`form.planStyle.${plan.profile.planStyle}`),
    },
  ];

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-primary text-sm font-semibold">{raceName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {f.t("plan.title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatDateLong(f.locale, plan.raceDate)}
            {daysLeft > 0 && ` · ${f.t("plan.daysToGo", { count: daysLeft })}`}
            {` · ${f.t(`form.planStyle.${plan.profile.planStyle}`)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden" data-slot="plan-actions">
          <ExportPdfButton plan={plan} f={f} />
          <WatchPlanButton plan={plan} f={f} today={today} />
          <Link href="/plan/new" className={buttonVariants({ variant: "outline" })}>
            <Pencil aria-hidden />
            {f.t("plan.edit")}
          </Link>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((st) => (
          <div key={st.label} className="bg-card rounded-xl border p-3">
            <dt className="text-muted-foreground text-xs">{st.label}</dt>
            <dd className="mt-0.5 text-lg font-bold tabular-nums">{st.value}</dd>
          </div>
        ))}
      </dl>
    </header>
  );
}
