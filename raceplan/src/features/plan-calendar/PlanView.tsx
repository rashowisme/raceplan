"use client";

import { CalendarCheck, CalendarDays, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { buttonVariants, Button } from "@/components/ui/button";
import { diffDays } from "@/engine/dates";
import type { PlanDay, TrainingPlan } from "@/engine/types";
import { Link } from "@/i18n/navigation";
import { localToday } from "@/lib/today";
import { formatClock, formatDistance } from "@/lib/units";
import { cn } from "@/lib/utils";
import { ExportPdfButton } from "@/features/export/pdf/ExportPdfButton";
import { formatDateLong, type Formatter } from "./format";
import { PaceZonesCard, PhaseTimeline, PlanAlerts } from "./PlanSections";
import { TIME_TRIAL_CARD_ID, TimeTrialCard } from "./TimeTrialCard";
import { useCurrentPlan } from "./useCurrentPlan";
import { usePlanFormatter } from "./usePlanFormatter";
import { WeekCard } from "./WeekCard";
import { WorkoutDialog } from "./WorkoutDetail";

export function PlanView() {
  const t = useTranslations("plan");
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
      </div>
    );
  }
  return <PlanContent plan={current.stored.plan} />;
}

function PlanContent({ plan }: { plan: TrainingPlan }) {
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
          />
        ))}
      </div>

      <p className="text-muted-foreground border-t pt-4 text-xs">{f.t(plan.disclaimer.key)}</p>
      <WorkoutDialog
        f={f}
        day={selected}
        onOpenChange={(open) => !open && setSelected(null)}
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
