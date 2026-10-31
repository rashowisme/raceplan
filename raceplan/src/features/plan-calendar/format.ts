/**
 * Turns engine output (translation keys + metric params) into display text.
 * Framework-agnostic so both the calendar (next-intl hooks) and the PDF
 * (next-intl `createTranslator`) can use it.
 */
import type {
  Effort,
  IsoDate,
  Message,
  PaceRange,
  PaceZone,
  PlanWarning,
  StepDuration,
  StepTarget,
  Workout,
  WorkoutStep,
} from "@/engine/types";
import {
  formatDistance,
  formatDuration,
  formatElevation,
  formatPaceRange,
  formatRepDistance,
  type DistanceUnit,
} from "@/lib/units";

export type Translate = (key: string, params?: Record<string, string | number>) => string;
export type ZoneLabels = "daniels" | "polarized";

export interface Formatter {
  t: Translate;
  unit: DistanceUnit;
  locale: string;
  zoneLabels: ZoneLabels;
}

/** Param names (engine convention) → how to display them. */
const REP_DISTANCE_PARAMS = new Set(["repM"]);
const DISTANCE_PARAMS = new Set(["distanceM", "fastM", "rpM", "maxM", "suggestedM"]);
const DURATION_PARAMS = new Set(["onS", "offS", "seconds"]);
const ELEVATION_PARAMS = new Set(["gainM"]);

export function formatParams(
  f: Formatter,
  params: Record<string, string | number> = {},
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "number" && REP_DISTANCE_PARAMS.has(k))
      out[k] = formatRepDistance(v, f.unit, f.locale);
    else if (typeof v === "number" && DISTANCE_PARAMS.has(k))
      out[k] = formatDistance(v, f.unit, f.locale);
    else if (typeof v === "number" && DURATION_PARAMS.has(k)) out[k] = formatDuration(v);
    else if (typeof v === "number" && ELEVATION_PARAMS.has(k))
      out[k] = formatElevation(v, f.unit, f.locale);
    else if (k === "tag" && typeof v === "string") out[k] = f.t(`form.preferences.${v}`);
    else if (k === "flags" && typeof v === "string") {
      out[k] = v
        .split(",")
        .filter(Boolean)
        .map((flag) => f.t(`riskFlag.${flag}`))
        .join(", ");
    } else out[k] = v;
  }
  return out;
}

export const formatMessage = (f: Formatter, m: Message): string =>
  f.t(m.key, formatParams(f, m.params));

export const formatWarning = (f: Formatter, w: PlanWarning): string =>
  f.t(`warning.${w.code}`, formatParams(f, w.params));

export function zoneLabel(f: Formatter, zone: PaceZone | "racePace"): string {
  if (zone === "racePace") return f.t("zone.racePace");
  if (f.zoneLabels === "polarized") {
    return f.t(zone === "E" ? "zone.z1" : zone === "M" || zone === "T" ? "zone.z2" : "zone.z3");
  }
  return f.t(`zone.${zone}`);
}

export const effortLabel = (f: Formatter, e: Effort) => f.t(`effort.${e}.label`);
export const effortDescription = (f: Formatter, e: Effort) => f.t(`effort.${e}.desc`);

export const formatPace = (f: Formatter, r: PaceRange) => formatPaceRange(r, f.unit);

export function formatStepDuration(f: Formatter, d: StepDuration): string {
  return d.type === "distance"
    ? formatRepDistance(d.meters, f.unit, f.locale)
    : formatDuration(d.seconds);
}

export function formatTarget(f: Formatter, t: StepTarget): string {
  const parts = [effortLabel(f, t.effort)];
  if (t.pace) parts.push(formatPace(f, t.pace));
  return parts.join(" · ");
}

export interface StepLine {
  depth: number;
  kind: WorkoutStep["kind"];
  label: string;
  /** e.g. "6 ×" for repeats, "15 min" for simple steps. */
  amount: string;
  target?: string;
  terrain?: string;
  zone?: string;
  effort?: Effort;
}

/** Flatten structured steps into display lines (repeats indent their children). */
export function stepLines(f: Formatter, steps: WorkoutStep[], depth = 0): StepLine[] {
  return steps.flatMap((s): StepLine[] => {
    if (s.kind === "repeat") {
      return [
        {
          depth,
          kind: "repeat",
          label: f.t("step.repeat", { count: s.count }),
          amount: `${s.count} ×`,
        },
        ...stepLines(f, s.steps, depth + 1),
      ];
    }
    return [
      {
        depth,
        kind: s.kind,
        label: f.t(`step.${s.kind}`),
        amount: formatStepDuration(f, s.duration),
        target: formatTarget(f, s.target),
        terrain: s.terrain ? f.t(`terrain.${s.terrain}`) : undefined,
        zone: zoneLabel(f, s.target.zone),
        effort: s.target.effort,
      },
    ];
  });
}

/** Main effort of a workout (for the short description). */
export function mainEffort(w: Workout): Effort {
  const all: StepTarget[] = [];
  const walk = (steps: WorkoutStep[]) =>
    steps.forEach((s) => (s.kind === "repeat" ? walk(s.steps) : all.push(s.target)));
  walk(w.steps);
  const work = all.find((t) => t.effort !== "easy" && t.effort !== "recovery");
  return work?.effort ?? all[0]?.effort ?? "easy";
}

export const formatWorkoutDistance = (f: Formatter, w: Workout) =>
  formatDistance(w.estDistanceM, f.unit, f.locale);
export const formatWorkoutElevation = (f: Formatter, m: number) =>
  formatElevation(m, f.unit, f.locale);

// ---------------------------------------------------------------------------
// Dates (ISO calendar dates, rendered timezone-free)
// ---------------------------------------------------------------------------

const utc = (iso: IsoDate) => new Date(`${iso}T00:00:00Z`);

export function formatDate(locale: string, iso: IsoDate, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(utc(iso));
}

export const formatDayShort = (locale: string, iso: IsoDate) =>
  formatDate(locale, iso, { day: "numeric", month: "short" });

export const formatDateLong = (locale: string, iso: IsoDate) =>
  formatDate(locale, iso, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
