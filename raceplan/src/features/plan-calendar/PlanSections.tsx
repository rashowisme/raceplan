"use client";

import { AlertTriangle, Gauge, Lightbulb } from "lucide-react";
import { PACE_ZONES, type Effort, type Phase, type TrainingPlan } from "@/engine/types";
import { formatClock, formatDistance } from "@/lib/units";
import { cn } from "@/lib/utils";
import {
  effortDescription,
  effortLabel,
  formatDateLong,
  formatMessage,
  formatPace,
  formatWarning,
  zoneLabel,
  type Formatter,
} from "./format";
import { PHASE_CLASSES } from "./styles";

const ZONE_EFFORT: Record<(typeof PACE_ZONES)[number], Effort> = {
  E: "easy",
  M: "marathon",
  T: "threshold",
  I: "interval",
  R: "repetition",
};

export function PlanAlerts({ f, plan }: { f: Formatter; plan: TrainingPlan }) {
  if (plan.warnings.length === 0 && plan.adviceNotes.length === 0) return null;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {plan.warnings.length > 0 && (
        <section
          className="bg-warning text-warning-foreground rounded-xl p-4"
          aria-labelledby="warnings-title"
        >
          <h2 id="warnings-title" className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="size-4" aria-hidden />
            {f.t("plan.warningsTitle")}
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            {plan.warnings.map((w, i) => (
              <li key={`${w.code}-${i}`}>{formatWarning(f, w)}</li>
            ))}
          </ul>
        </section>
      )}
      {plan.adviceNotes.length > 0 && (
        <section className="bg-primary/5 rounded-xl p-4" aria-labelledby="advice-title">
          <h2 id="advice-title" className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="text-primary size-4" aria-hidden />
            {f.t("plan.adviceTitle")}
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            {plan.adviceNotes.map((n) => (
              <li key={n.key}>{formatMessage(f, n)}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function PaceZonesCard({ f, plan }: { f: Formatter; plan: TrainingPlan }) {
  const zones = plan.summary.paceZones;
  const tt = plan.profile.timeTrialResult;
  return (
    <section className="bg-card rounded-xl border p-4" aria-labelledby="zones-title">
      <h2 id="zones-title" className="flex items-center gap-2 font-semibold">
        <Gauge className="text-primary size-4" aria-hidden />
        {zones ? f.t("plan.zonesTitle") : f.t("plan.effortsTitle")}
      </h2>
      {!zones && (
        <p className="text-muted-foreground mt-1 text-sm">{f.t("plan.effortOnlyIntro")}</p>
      )}
      {tt && plan.summary.fitness?.source === "timeTrial" && (
        <p className="text-muted-foreground mt-1 text-sm">
          {f.t("plan.zonesFromTimeTrial", {
            distance: formatDistance(tt.distanceM, f.unit, f.locale),
            time: formatClock(tt.timeS),
            date: formatDateLong(f.locale, tt.date),
          })}
        </p>
      )}
      <ul className="mt-3 divide-y">
        {PACE_ZONES.map((z) => {
          const effort = ZONE_EFFORT[z];
          return (
            <li
              key={z}
              className="grid grid-cols-[auto_1fr] gap-x-3 py-2.5 sm:grid-cols-[8rem_9rem_1fr]"
            >
              <span className="text-sm font-semibold">{zoneLabel(f, z)}</span>
              <span className="text-right text-sm font-semibold tabular-nums sm:text-left">
                {zones ? formatPace(f, zones[z]) : effortLabel(f, effort)}
              </span>
              <span className="text-muted-foreground col-span-2 text-xs sm:col-span-1 sm:text-sm">
                {zones && (
                  <span className="text-foreground font-medium">{effortLabel(f, effort)} — </span>
                )}
                {effortDescription(f, effort)}
              </span>
            </li>
          );
        })}
        {plan.summary.racePaceSPerKm !== null && (
          <li className="grid grid-cols-[auto_1fr] gap-x-3 py-2.5 sm:grid-cols-[8rem_9rem_1fr]">
            <span className="text-sm font-semibold">{zoneLabel(f, "racePace")}</span>
            <span className="text-right text-sm font-semibold tabular-nums sm:text-left">
              {formatPace(f, {
                fastSPerKm: plan.summary.racePaceSPerKm,
                slowSPerKm: plan.summary.racePaceSPerKm,
              })}
            </span>
            <span className="text-muted-foreground col-span-2 text-xs sm:col-span-1 sm:text-sm">
              {effortDescription(f, "race")}
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}

export function PhaseTimeline({
  f,
  plan,
  onJump,
}: {
  f: Formatter;
  plan: TrainingPlan;
  onJump: (weekIndex: number) => void;
}) {
  const segments: { phase: Phase; start: number; count: number }[] = [];
  for (const w of plan.weeks) {
    const last = segments.at(-1);
    if (last && last.phase === w.phase) last.count++;
    else segments.push({ phase: w.phase, start: w.index, count: 1 });
  }
  return (
    <section aria-labelledby="phases-title">
      <h2 id="phases-title" className="sr-only">
        {f.t("plan.phasesTitle")}
      </h2>
      <div className="flex h-3 overflow-hidden rounded-full">
        {segments.map((s) => (
          <button
            key={`${s.phase}-${s.start}`}
            type="button"
            onClick={() => onJump(s.start)}
            style={{ flexGrow: s.count }}
            className={cn(
              "focus-visible:ring-ring min-w-1 focus-visible:ring-2 focus-visible:outline-none",
              PHASE_CLASSES[s.phase].bar,
            )}
            aria-label={`${f.t(`phase.${s.phase}`)}: ${f.t("plan.weeksCount", { count: s.count })}`}
          />
        ))}
      </div>
      <ul className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {segments
          .filter((s, i) => segments.findIndex((x) => x.phase === s.phase) === i)
          .map((s) => (
            <li key={s.phase} className="flex items-center gap-1.5">
              <span
                className={cn("size-2.5 rounded-full", PHASE_CLASSES[s.phase].bar)}
                aria-hidden
              />
              {f.t(`phase.${s.phase}`)}
            </li>
          ))}
      </ul>
    </section>
  );
}
