/**
 * Step helpers: targets, constructors and distance/duration estimation.
 */
import { midPace, racePaceRange, ZONE_EFFORT } from "../paces/zones";
import type {
  Effort,
  PaceRange,
  PaceZone,
  PaceZones,
  RepeatStep,
  SimpleStep,
  StepDuration,
  StepTarget,
  Terrain,
  WorkoutStep,
} from "../types";

/** Everything needed to build and estimate workouts. */
export interface PaceContext {
  /** Real zones (targets) or null for effort-only plans. */
  zones: PaceZones | null;
  /** Zones used to estimate durations (real or assumed by level). */
  estZones: PaceZones;
  /** Real race pace or null. */
  racePaceSPerKm: number | null;
  /** Race pace used for estimation. */
  estRacePaceSPerKm: number;
}

export const isEffortOnly = (ctx: PaceContext): boolean => ctx.zones === null;

export function zoneTarget(ctx: PaceContext, zone: PaceZone, effort?: Effort): StepTarget {
  const t: StepTarget = { zone, effort: effort ?? ZONE_EFFORT[zone] };
  if (ctx.zones) t.pace = ctx.zones[zone];
  return t;
}

export function raceTarget(ctx: PaceContext): StepTarget {
  const t: StepTarget = { zone: "racePace", effort: "race" };
  if (ctx.racePaceSPerKm !== null) t.pace = racePaceRange(ctx.racePaceSPerKm);
  return t;
}

/** Effort-only target (no pace even when zones exist), e.g. fartlek, hills. */
export function effortTarget(zone: PaceZone, effort: Effort): StepTarget {
  return { zone, effort };
}

export const byTime = (seconds: number): StepDuration => ({ type: "time", seconds });
export const byDistance = (meters: number): StepDuration => ({ type: "distance", meters });

export function step(
  kind: SimpleStep["kind"],
  duration: StepDuration,
  target: StepTarget,
  terrain?: Terrain,
): SimpleStep {
  return terrain ? { kind, duration, target, terrain } : { kind, duration, target };
}

export function repeat(count: number, steps: SimpleStep[]): RepeatStep {
  return { kind: "repeat", count, steps };
}

/** Pace (s/km) used to estimate a target. */
export function estimatePace(ctx: PaceContext, target: StepTarget): number {
  if (target.pace) return midPace(target.pace);
  if (target.zone === "racePace") return ctx.estRacePaceSPerKm;
  const range: PaceRange = ctx.estZones[target.zone];
  // Recovery jogs and power hiking are slower than easy pace.
  if (target.effort === "recovery") return range.slowSPerKm * 1.05;
  if (target.effort === "powerHike") return range.slowSPerKm * 1.8;
  return midPace(range);
}

export interface Estimate {
  distanceM: number;
  durationS: number;
  /** Seconds at easy/recovery effort. */
  easyS: number;
}

const isEasyTarget = (t: StepTarget) =>
  t.zone === "E" && (t.effort === "easy" || t.effort === "recovery" || t.effort === "powerHike");

function estimateSimple(ctx: PaceContext, s: SimpleStep): Estimate {
  const pace = estimatePace(ctx, s.target);
  const { distanceM, durationS } =
    s.duration.type === "distance"
      ? { distanceM: s.duration.meters, durationS: (s.duration.meters / 1000) * pace }
      : { distanceM: (s.duration.seconds / pace) * 1000, durationS: s.duration.seconds };
  return { distanceM, durationS, easyS: isEasyTarget(s.target) ? durationS : 0 };
}

export function estimateSteps(ctx: PaceContext, steps: WorkoutStep[]): Estimate {
  const total: Estimate = { distanceM: 0, durationS: 0, easyS: 0 };
  for (const s of steps) {
    if (s.kind === "repeat") {
      const inner = estimateSteps(ctx, s.steps);
      total.distanceM += inner.distanceM * s.count;
      total.durationS += inner.durationS * s.count;
      total.easyS += inner.easyS * s.count;
    } else {
      const e = estimateSimple(ctx, s);
      total.distanceM += e.distanceM;
      total.durationS += e.durationS;
      total.easyS += e.easyS;
    }
  }
  return total;
}

/** Distance (m) covered in `seconds` at a target. */
export function distanceForTime(ctx: PaceContext, target: StepTarget, seconds: number): number {
  return (seconds / estimatePace(ctx, target)) * 1000;
}

/** Duration (s) for `meters` at a target. */
export function timeForDistance(ctx: PaceContext, target: StepTarget, meters: number): number {
  return (meters / 1000) * estimatePace(ctx, target);
}

/** Round a distance down to a multiple of `step` meters. */
export const floorTo = (meters: number, stepM: number): number =>
  Math.floor(meters / stepM) * stepM;
export const roundTo = (value: number, stepV: number): number => Math.round(value / stepV) * stepV;
