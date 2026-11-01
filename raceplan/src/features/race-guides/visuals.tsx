/**
 * Race guide visuals, all drawn from the race's own data: the date tile,
 * the preparation timeline and the weekly-volume chart of a sample plan.
 */
import { Flag } from "lucide-react";
import type { RaceGuide } from "@/content/races";
import type { Sample } from "@/content/races/samples";
import type { Phase } from "@/engine/types";
import { formatDate, formatDateLong, type Translate } from "@/features/plan-calendar/format";
import { PHASE_CLASSES } from "@/features/plan-calendar/styles";
import { formatDistance, metersToUnit, type DistanceUnit } from "@/lib/units";
import { cn } from "@/lib/utils";

/** Big day / month tile for the race date. */
export function DateTile({ date, locale }: { date: string; locale: string }) {
  return (
    <div className="bg-card flex w-24 shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-center shadow-sm">
      <span className="text-primary text-xs font-semibold uppercase">
        {formatDate(locale, date, { weekday: "short" })}
      </span>
      <span className="text-4xl leading-none font-bold">
        {formatDate(locale, date, { day: "numeric" })}
      </span>
      <span className="text-muted-foreground text-xs">
        {formatDate(locale, date, { month: "short", year: "numeric" })}
      </span>
    </div>
  );
}

interface TimelineItem {
  date: string;
  label: string;
  kind: "start" | "milestone" | "race";
}

/** Plan starts, the guide's milestones and race day, in date order. */
export function PrepTimeline({
  g,
  samples,
  raceDate,
  t,
  locale,
}: {
  g: RaceGuide;
  samples: Sample[];
  raceDate: string;
  t: Translate;
  locale: string;
}) {
  const items: TimelineItem[] = [
    ...samples.map((s) => ({
      date: s.startDate,
      label: t("raceGuide.timelineStart", { weeks: s.persona.weeks }),
      kind: "start" as const,
    })),
    ...g.milestones.map((m) => ({ ...m, kind: "milestone" as const })),
    { date: raceDate, label: t("raceGuide.timelineRace", { name: g.name }), kind: "race" as const },
  ].sort((a, b) => a.date.localeCompare(b.date));
  // De-duplicate identical start dates (two personas, same length).
  const unique = items.filter(
    (x, i) => items.findIndex((y) => y.date === x.date && y.label === x.label) === i,
  );
  return (
    <ol className="relative ml-1 space-y-4 border-l-2 pl-5">
      {unique.map((x) => (
        <li key={`${x.date}-${x.label}`} className="relative">
          <span
            aria-hidden
            className={cn(
              "border-card absolute top-1 -left-[29px] size-4 rounded-full border-2",
              x.kind === "race"
                ? "bg-phase-race"
                : x.kind === "start"
                  ? "bg-primary"
                  : "bg-muted-foreground",
            )}
          />
          <p className="text-muted-foreground text-xs font-semibold uppercase">
            {formatDateLong(locale, x.date)}
          </p>
          <p className={cn("text-sm", x.kind === "race" && "flex items-center gap-1.5 font-bold")}>
            {x.kind === "race" && <Flag className="text-phase-race size-4" aria-hidden />}
            {x.label}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Which phases appear in a set of samples, in plan order (for one shared legend). */
const PHASE_ORDER: Phase[] = ["maintenance", "base", "build", "specific", "taper"];

export const phasesIn = (samples: Sample[]): Phase[] =>
  PHASE_ORDER.filter((p) => samples.some((s) => s.plan.weeks.some((w) => w.phase === p)));

export function PhaseLegend({ phases, t }: { phases: Phase[]; t: Translate }) {
  return (
    <ul aria-label={t("raceGuide.chartLegend")} className="flex flex-wrap gap-x-4 gap-y-1.5">
      {phases.map((p) => (
        <li key={p} className="flex items-center gap-1.5 text-xs">
          <span className={cn("size-2.5 rounded-sm", PHASE_CLASSES[p].bar)} aria-hidden />
          {t(`phase.${p}`)}
        </li>
      ))}
    </ul>
  );
}

/** Clean axis maximum: the next multiple of 20 km (or 10 mi) above the peak. */
const axisMax = (peakM: number, unit: DistanceUnit) => {
  const step = unit === "mi" ? 10 : 20;
  return Math.max(step, Math.ceil(metersToUnit(peakM, unit) / step) * step);
};

/**
 * Weekly planned volume, one column per week coloured by phase. Race week
 * shows its training runs (the race itself isn't training volume).
 */
export function WeeklyVolumeChart({
  s,
  t,
  locale,
  unit,
}: {
  s: Sample;
  t: Translate;
  locale: string;
  unit: DistanceUnit;
}) {
  const weeks = s.plan.weeks;
  const max = axisMax(s.peakWeek.plannedVolumeM, unit);
  const ticks = [0, max / 2, max];
  const dist = (m: number) => formatDistance(m, unit, locale, 0);
  const label = (i: number) => {
    const w = weeks[i]!;
    const phase = t(`phase.${w.phase}`) + (w.isCutback ? `, ${t("raceGuide.chartCutback")}` : "");
    return t("raceGuide.chartBar", { n: i + 1, distance: dist(w.plannedVolumeM), phase });
  };
  const xLabels = new Set([0, Math.floor((weeks.length - 1) / 2), weeks.length - 1]);

  return (
    <figure className="space-y-2">
      <figcaption className="text-sm font-semibold">{t(unit === "mi" ? "raceGuide.chartTitleMi" : "raceGuide.chartTitle")}</figcaption>
      <div className="flex gap-2 pt-2">
        {/* Y axis */}
        <div className="text-muted-foreground relative h-36 w-8 shrink-0 text-right text-[10px] tabular-nums">
          {ticks.map((v) => (
            <span
              key={v}
              className="absolute right-0 -translate-y-1/2"
              style={{ bottom: `${(v / max) * 100}%` }}
            >
              {v}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative h-36">
            {ticks.map((v) => (
              <div
                key={v}
                aria-hidden
                className="bg-border absolute inset-x-0 h-px"
                style={{ bottom: `${(v / max) * 100}%` }}
              />
            ))}
            <ul className="absolute inset-0 flex items-end gap-[2px]">
              {weeks.map((w, i) => {
                const pct = (metersToUnit(w.plannedVolumeM, unit) / max) * 100;
                const isPeak = w.index === s.peakWeek.index;
                return (
                  <li
                    key={w.index}
                    className="group relative flex h-full flex-1 items-end justify-center"
                    title={label(i)}
                    aria-label={label(i)}
                  >
                    {isPeak && (
                      <span
                        className="absolute text-[10px] font-semibold whitespace-nowrap tabular-nums"
                        style={{ bottom: `calc(${pct}% + 2px)` }}
                      >
                        {dist(w.plannedVolumeM)}
                      </span>
                    )}
                    <span
                      className={cn(
                        "block w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-80",
                        PHASE_CLASSES[w.phase].bar,
                      )}
                      style={{ height: `${pct}%` }}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
          {/* X axis */}
          <div className="text-muted-foreground mt-1 flex gap-[2px] text-[10px]">
            {weeks.map((w, i) => (
              <span key={w.index} className="flex-1 text-center whitespace-nowrap">
                {xLabels.has(i)
                  ? w.isRaceWeek
                    ? t("raceGuide.chartRace")
                    : t("raceGuide.chartWeekShort", { n: i + 1 })
                  : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <details className="text-sm">
        <summary className="text-muted-foreground cursor-pointer text-xs">
          {t("raceGuide.chartTable")}
        </summary>
        <table className="mt-2 w-full text-xs tabular-nums">
          <thead>
            <tr className="text-muted-foreground text-left">
              <th className="py-1 font-medium">{t("raceGuide.chartWeek")}</th>
              <th className="py-1 font-medium">{t("raceGuide.chartPhase")}</th>
              <th className="py-1 text-right font-medium">{t("raceGuide.chartVolume")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {weeks.map((w, i) => (
              <tr key={w.index}>
                <td className="py-1">{i + 1}</td>
                <td className="py-1">
                  {t(`phase.${w.phase}`)}
                  {w.isCutback && ` (${t("raceGuide.chartCutback")})`}
                </td>
                <td className="py-1 text-right">{dist(w.plannedVolumeM)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
