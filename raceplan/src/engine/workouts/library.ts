/**
 * Spec §9: workout library. Every workout is built from structured steps;
 * estimates are derived from the steps. Quality builders size themselves
 * from a `SessionSizing` budget and return `null` when even the minimal
 * version does not fit.
 */
import type { StandardRaceType } from "../config";
import type { Message, PreferenceTag, Workout, WorkoutStep, WorkoutType } from "../types";
import {
  byDistance,
  byTime,
  effortTarget,
  estimateSteps,
  floorTo,
  raceTarget,
  repeat,
  roundTo,
  step,
  timeForDistance,
  zoneTarget,
  type PaceContext,
} from "./steps";

const MIN = 60;

export interface SessionSizing {
  /** Max seconds of hard work (work steps). */
  hardBudgetS: number;
  /** Max total distance for the session, incl. warm-up / cool-down. */
  maxDistanceM: number;
  /** 0..1 position in the plan, drives rep progression. */
  progress: number;
  /** 0..1 volume scale (cutback / taper weeks < 1). */
  scale: number;
}

export interface QualityOptions {
  /** Interval sessions on a track (distance reps) vs road (time reps). */
  onTrack: boolean;
  /** Avoid R-pace (e.g. Achilles/calf early, risk-flagged runners). */
  avoidRPace: boolean;
  race: StandardRaceType;
}

interface WorkoutMeta {
  tags?: PreferenceTag[];
  intensity: Workout["intensity"];
  isHard: boolean;
  isLongRun?: boolean;
  title: Message;
  notes?: Message[];
  optional?: boolean;
  strides?: Workout["strides"];
  elevationGainM?: number;
}

export function makeWorkout(
  ctx: PaceContext,
  type: WorkoutType,
  steps: WorkoutStep[],
  meta: WorkoutMeta,
): Workout {
  const est = estimateSteps(ctx, steps);
  const w: Workout = {
    type,
    tags: meta.tags ?? [],
    intensity: meta.intensity,
    isHard: meta.isHard,
    isLongRun: meta.isLongRun ?? false,
    title: meta.title,
    steps,
    // Floor so planned volumes never exceed their caps through rounding.
    estDistanceM: Math.floor(est.distanceM / 100) * 100,
    estDurationS: Math.round(est.durationS / MIN) * MIN,
    easyDurationS: Math.round(est.easyS / MIN) * MIN,
    notes: meta.notes ?? [],
  };
  if (meta.optional) w.optional = true;
  if (meta.strides) w.strides = meta.strides;
  if (meta.elevationGainM !== undefined) w.elevationGainM = meta.elevationGainM;
  return w;
}

/** Append easy running to a session (fills weekly volume when there are no easy days). */
export function withExtraEasy(ctx: PaceContext, w: Workout, extraM: number): Workout {
  const extra = floorTo(extraM, 500);
  if (extra <= 0) return w;
  return makeWorkout(
    ctx,
    w.type,
    [...w.steps, step("run", byDistance(extra), zoneTarget(ctx, "E"))],
    {
      tags: w.tags,
      intensity: w.intensity,
      isHard: w.isHard,
      isLongRun: w.isLongRun,
      title: w.title,
      notes: w.notes,
      optional: w.optional,
      strides: w.strides,
      elevationGainM: w.elevationGainM,
    },
  );
}

/** Hard (non-easy) seconds of a step list. */
function hardSeconds(ctx: PaceContext, steps: WorkoutStep[]): number {
  const e = estimateSteps(ctx, steps);
  return e.durationS - e.easyS;
}

const warmup = (ctx: PaceContext, seconds: number) =>
  step("warmup", byTime(seconds), zoneTarget(ctx, "E"));
const cooldown = (ctx: PaceContext, seconds: number) =>
  step("cooldown", byTime(seconds), zoneTarget(ctx, "E"));
const jog = (ctx: PaceContext, seconds: number) =>
  step("recovery", byTime(seconds), zoneTarget(ctx, "E", "recovery"));

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

/** Pick warm-up/cool-down lengths from the session distance budget. */
function wuCd(maxDistanceM: number): [number, number] {
  return maxDistanceM >= 9000 ? [15 * MIN, 10 * MIN] : [10 * MIN, 8 * MIN];
}

/**
 * Generic repetition sizer: largest rep count in [minReps, maxReps] whose
 * hard time and total distance fit the budget. Returns null if minReps
 * does not fit.
 */
function fitReps(
  ctx: PaceContext,
  sizing: SessionSizing,
  minReps: number,
  maxReps: number,
  build: (reps: number) => WorkoutStep[],
): { reps: number; steps: WorkoutStep[] } | null {
  const desired = Math.round(lerp(minReps, maxReps, sizing.progress) * sizing.scale);
  for (let reps = Math.max(minReps, Math.min(maxReps, desired)); reps >= minReps; reps--) {
    const steps = build(reps);
    const est = estimateSteps(ctx, steps);
    if (hardSeconds(ctx, steps) <= sizing.hardBudgetS && est.distanceM <= sizing.maxDistanceM) {
      return { reps, steps };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Easy / long / race
// ---------------------------------------------------------------------------

export interface StridesSpec {
  count: number;
  seconds: number;
}

export function stridesBlock(spec: StridesSpec): WorkoutStep {
  return repeat(spec.count, [
    step("work", byTime(spec.seconds), effortTarget("R", "repetition")),
    step("recovery", byTime(60), effortTarget("E", "recovery")),
  ]);
}

/** Distance consumed by a strides block. */
export function stridesDistanceM(ctx: PaceContext, spec: StridesSpec): number {
  return estimateSteps(ctx, [stridesBlock(spec)]).distanceM;
}

export function easyRun(
  ctx: PaceContext,
  distanceM: number,
  opts: { strides?: StridesSpec; recovery?: boolean; notes?: Message[]; optional?: boolean } = {},
): Workout {
  const stridesM = opts.strides ? stridesDistanceM(ctx, opts.strides) : 0;
  const runM = Math.max(500, floorTo(distanceM - stridesM, 100));
  const steps: WorkoutStep[] = [
    step("run", byDistance(runM), zoneTarget(ctx, "E", opts.recovery ? "recovery" : "easy")),
  ];
  if (opts.strides) steps.push(stridesBlock(opts.strides));
  const type = opts.recovery ? "recovery" : "easy";
  return makeWorkout(ctx, type, steps, {
    intensity: "easy",
    isHard: false,
    title: {
      key: opts.strides ? `workout.${type}.titleStrides` : `workout.${type}.title`,
      params: opts.strides ? { count: opts.strides.count } : {},
    },
    notes: opts.notes,
    optional: opts.optional,
    strides: opts.strides,
  });
}

export type LongRunVariant = "plain" | "progressive" | "racePace";

export function longRun(
  ctx: PaceContext,
  distanceM: number,
  variant: LongRunVariant,
  race: StandardRaceType,
  notes: Message[] = [],
): Workout {
  const total = floorTo(distanceM, 500);
  if (variant === "progressive") {
    const fastM = Math.max(1000, roundTo(total * 0.2, 500));
    return makeWorkout(
      ctx,
      "longProgressive",
      [
        step("run", byDistance(total - fastM), zoneTarget(ctx, "E")),
        step("work", byDistance(fastM), zoneTarget(ctx, "M", "steady")),
      ],
      {
        intensity: "moderate",
        isHard: true,
        isLongRun: true,
        title: { key: "workout.longProgressive.title", params: { fastM } },
        notes,
      },
    );
  }
  if (variant === "racePace") {
    const share = race === "marathon" ? 0.4 : 0.3;
    const rpM = Math.max(2000, roundTo(total * share, 1000));
    const firstM = roundTo((total - rpM) * 0.7, 500);
    const lastM = total - rpM - firstM;
    const steps: WorkoutStep[] = [
      step("run", byDistance(firstM), zoneTarget(ctx, "E")),
      step("work", byDistance(rpM), raceTarget(ctx)),
    ];
    if (lastM > 0) steps.push(step("cooldown", byDistance(lastM), zoneTarget(ctx, "E")));
    return makeWorkout(ctx, "longRacePace", steps, {
      intensity: "hard",
      isHard: true,
      isLongRun: true,
      title: { key: "workout.longRacePace.title", params: { rpM } },
      notes,
    });
  }
  return makeWorkout(ctx, "long", [step("run", byDistance(total), zoneTarget(ctx, "E"))], {
    intensity: "easy",
    isHard: false,
    isLongRun: true,
    title: { key: "workout.long.title" },
    notes,
  });
}

export function raceDay(ctx: PaceContext, distanceM: number, elevationGainM?: number): Workout {
  return makeWorkout(ctx, "race", [step("work", byDistance(distanceM), raceTarget(ctx))], {
    intensity: "hard",
    isHard: true,
    title: { key: "workout.race.title" },
    notes: [{ key: "workout.note.raceDay" }],
    elevationGainM,
  });
}

export function timeTrial(ctx: PaceContext, distanceM: number, short = false): Workout {
  return makeWorkout(
    ctx,
    "timeTrial",
    [
      warmup(ctx, (short ? 10 : 15) * MIN),
      step("work", byDistance(distanceM), effortTarget("I", "race")),
      cooldown(ctx, (short ? 5 : 10) * MIN),
    ],
    {
      intensity: "hard",
      isHard: true,
      title: { key: "workout.timeTrial.title", params: { distanceM } },
      notes: [{ key: "workout.note.timeTrial" }],
      optional: true,
    },
  );
}

// ---------------------------------------------------------------------------
// Quality sessions
// ---------------------------------------------------------------------------

export function tempo(ctx: PaceContext, sizing: SessionSizing): Workout | null {
  const [wu, cd] = wuCd(sizing.maxDistanceM);
  const fit = fitReps(ctx, sizing, 2, 6, (blocks) => [
    warmup(ctx, wu),
    step("work", byTime(blocks * 5 * MIN), zoneTarget(ctx, "T")),
    cooldown(ctx, cd),
  ]);
  if (!fit) return null;
  return makeWorkout(ctx, "tempo", fit.steps, {
    tags: ["tempo"],
    intensity: "hard",
    isHard: true,
    title: { key: "workout.tempo.title", params: { minutes: fit.reps * 5 } },
  });
}

export function cruiseIntervals(ctx: PaceContext, sizing: SessionSizing): Workout | null {
  const [wu, cd] = wuCd(sizing.maxDistanceM);
  const repM = 1600;
  const t = zoneTarget(ctx, "T");
  // Distance reps when paces are known; ~6 min reps otherwise.
  const rep = ctx.zones ? byDistance(repM) : byTime(6 * MIN);
  const fit = fitReps(ctx, sizing, 3, 6, (reps) => [
    warmup(ctx, wu),
    repeat(reps, [step("work", rep, t), jog(ctx, 60)]),
    cooldown(ctx, cd),
  ]);
  if (!fit) return null;
  return makeWorkout(ctx, "cruiseIntervals", fit.steps, {
    tags: ["tempo"],
    intensity: "hard",
    isHard: true,
    title: {
      key: ctx.zones
        ? "workout.cruiseIntervals.titleDistance"
        : "workout.cruiseIntervals.titleTime",
      params: { reps: fit.reps, repM, minutes: 6 },
    },
  });
}

export function longIntervals(
  ctx: PaceContext,
  sizing: SessionSizing,
  opts: QualityOptions,
): Workout | null {
  const [wu, cd] = wuCd(sizing.maxDistanceM);
  const t = zoneTarget(ctx, "I");
  const repM = sizing.progress < 0.4 ? 800 : sizing.progress < 0.75 ? 1000 : 1200;
  const distanceReps = opts.onTrack && ctx.zones !== null;
  const repS = distanceReps ? timeForDistance(ctx, t, repM) : Math.round(repM / 250) * MIN;
  const rep = distanceReps ? byDistance(repM) : byTime(repS);
  const recS = Math.max(2 * MIN, roundTo(repS * 0.75, 30));
  const fit = fitReps(ctx, sizing, 3, 6, (reps) => [
    warmup(ctx, wu),
    repeat(reps, [step("work", rep, t), jog(ctx, recS)]),
    cooldown(ctx, cd),
  ]);
  if (!fit) return null;
  return makeWorkout(ctx, "longIntervals", fit.steps, {
    tags: distanceReps ? ["longIntervals", "track"] : ["longIntervals"],
    intensity: "hard",
    isHard: true,
    title: distanceReps
      ? { key: "workout.longIntervals.titleDistance", params: { reps: fit.reps, repM } }
      : { key: "workout.longIntervals.titleTime", params: { reps: fit.reps, minutes: repS / MIN } },
  });
}

export function shortIntervals(
  ctx: PaceContext,
  sizing: SessionSizing,
  opts: QualityOptions,
): Workout | null {
  const [wu, cd] = wuCd(sizing.maxDistanceM);
  // R-pace 200s early, I-pace 400s later (or always when R-pace is avoided).
  const useR = !opts.avoidRPace && sizing.progress < 0.5;
  const zone = useR ? "R" : "I";
  const t = zoneTarget(ctx, zone);
  const repM = useR ? 200 : 400;
  const distanceReps = opts.onTrack && ctx.zones !== null;
  const repS = distanceReps ? timeForDistance(ctx, t, repM) : useR ? 40 : 75;
  const rep = distanceReps ? byDistance(repM) : byTime(repS);
  const rec = distanceReps
    ? step("recovery", byDistance(200), zoneTarget(ctx, "E", "recovery"))
    : jog(ctx, useR ? 80 : 75);
  const fit = fitReps(ctx, sizing, 6, useR ? 12 : 10, (reps) => [
    warmup(ctx, wu),
    repeat(reps, [step("work", rep, t), rec]),
    cooldown(ctx, cd),
  ]);
  if (!fit) return null;
  return makeWorkout(ctx, "shortIntervals", fit.steps, {
    tags: distanceReps ? ["shortIntervals", "track"] : ["shortIntervals"],
    intensity: "hard",
    isHard: true,
    title: distanceReps
      ? { key: "workout.shortIntervals.titleDistance", params: { reps: fit.reps, repM } }
      : { key: "workout.shortIntervals.titleTime", params: { reps: fit.reps, seconds: repS } },
  });
}

export function hillSprints(ctx: PaceContext, sizing: SessionSizing): Workout | null {
  const [wu, cd] = wuCd(sizing.maxDistanceM);
  const fit = fitReps(ctx, sizing, 6, 10, (reps) => [
    warmup(ctx, wu),
    repeat(reps, [
      step("work", byTime(10), effortTarget("R", "repetition"), "uphill"),
      step("recovery", byTime(90), effortTarget("E", "recovery"), "downhill"),
    ]),
    cooldown(ctx, cd),
  ]);
  if (!fit) return null;
  return makeWorkout(ctx, "hillSprints", fit.steps, {
    tags: ["hills"],
    intensity: "moderate",
    isHard: true,
    title: { key: "workout.hillSprints.title", params: { reps: fit.reps } },
    notes: [{ key: "workout.note.hillSprints" }],
  });
}

export function hillRepeats(ctx: PaceContext, sizing: SessionSizing): Workout | null {
  const [wu, cd] = wuCd(sizing.maxDistanceM);
  const repS = sizing.progress < 0.5 ? 60 : 90;
  const fit = fitReps(ctx, sizing, 5, 10, (reps) => [
    warmup(ctx, wu),
    repeat(reps, [
      step("work", byTime(repS), effortTarget("I", "interval"), "uphill"),
      step("recovery", byTime(repS * 2), effortTarget("E", "recovery"), "downhill"),
    ]),
    cooldown(ctx, cd),
  ]);
  if (!fit) return null;
  return makeWorkout(ctx, "hillRepeats", fit.steps, {
    tags: ["hills"],
    intensity: "hard",
    isHard: true,
    title: { key: "workout.hillRepeats.title", params: { reps: fit.reps, seconds: repS } },
    notes: [{ key: "workout.note.hillRepeats" }],
  });
}

export function fartlek(ctx: PaceContext, sizing: SessionSizing): Workout | null {
  const [wu, cd] = wuCd(sizing.maxDistanceM);
  const [onS, offS] =
    sizing.progress < 0.35 ? [60, 60] : sizing.progress < 0.7 ? [120, 60] : [180, 90];
  const fit = fitReps(ctx, sizing, 4, 10, (reps) => [
    warmup(ctx, wu),
    repeat(reps, [
      step("work", byTime(onS), effortTarget("I", "interval")),
      step("recovery", byTime(offS), effortTarget("E", "easy")),
    ]),
    cooldown(ctx, cd),
  ]);
  if (!fit) return null;
  return makeWorkout(ctx, "fartlek", fit.steps, {
    intensity: "moderate",
    isHard: true,
    title: { key: "workout.fartlek.title", params: { reps: fit.reps, onS, offS } },
    notes: [{ key: "workout.note.fartlek" }],
  });
}

const RACE_PACE_REPS: Record<
  StandardRaceType,
  { repM: number; repS: number; recS: number; min: number; max: number }
> = {
  "5k": { repM: 1000, repS: 4 * MIN, recS: 2 * MIN, min: 3, max: 5 },
  "10k": { repM: 2000, repS: 8 * MIN, recS: 2 * MIN, min: 2, max: 4 },
  half: { repM: 3000, repS: 12 * MIN, recS: 2 * MIN, min: 2, max: 4 },
  marathon: { repM: 5000, repS: 20 * MIN, recS: 3 * MIN, min: 1, max: 3 },
};

export function racePaceSession(
  ctx: PaceContext,
  sizing: SessionSizing,
  opts: QualityOptions,
): Workout | null {
  const [wu, cd] = wuCd(sizing.maxDistanceM);
  const spec = RACE_PACE_REPS[opts.race];
  const t = raceTarget(ctx);
  const byDist = ctx.racePaceSPerKm !== null;
  const rep = byDist ? byDistance(spec.repM) : byTime(spec.repS);
  const fit = fitReps(ctx, sizing, spec.min, spec.max, (reps) => [
    warmup(ctx, wu),
    reps === 1 ? step("work", rep, t) : repeat(reps, [step("work", rep, t), jog(ctx, spec.recS)]),
    cooldown(ctx, cd),
  ]);
  if (fit) {
    return makeWorkout(ctx, "racePace", fit.steps, {
      intensity: "hard",
      isHard: true,
      title: byDist
        ? { key: "workout.racePace.titleDistance", params: { reps: fit.reps, repM: spec.repM } }
        : {
            key: "workout.racePace.titleTime",
            params: { reps: fit.reps, minutes: spec.repS / MIN },
          },
    });
  }
  // Short sharpening version (taper / low volume): race-pace reps of 1/2 size.
  const halfRep = byDist ? byDistance(floorTo(spec.repM / 2, 100)) : byTime(spec.repS / 2);
  const small = fitReps(ctx, { ...sizing, progress: 0 }, 2, 4, (reps) => [
    warmup(ctx, wu),
    repeat(reps, [step("work", halfRep, t), jog(ctx, 90)]),
    cooldown(ctx, cd),
  ]);
  if (!small) return null;
  return makeWorkout(ctx, "racePace", small.steps, {
    intensity: "hard",
    isHard: true,
    title: byDist
      ? {
          key: "workout.racePace.titleDistance",
          params: { reps: small.reps, repM: floorTo(spec.repM / 2, 100) },
        }
      : {
          key: "workout.racePace.titleTime",
          params: { reps: small.reps, minutes: spec.repS / 2 / MIN },
        },
  });
}

/** Builders for quality session types, keyed by workout type. */
export type QualityType =
  | "tempo"
  | "cruiseIntervals"
  | "longIntervals"
  | "shortIntervals"
  | "hillSprints"
  | "hillRepeats"
  | "fartlek"
  | "racePace";

export function buildQuality(
  type: QualityType,
  ctx: PaceContext,
  sizing: SessionSizing,
  opts: QualityOptions,
): Workout | null {
  switch (type) {
    case "tempo":
      return tempo(ctx, sizing);
    case "cruiseIntervals":
      return cruiseIntervals(ctx, sizing);
    case "longIntervals":
      return longIntervals(ctx, sizing, opts);
    case "shortIntervals":
      return shortIntervals(ctx, sizing, opts);
    case "hillSprints":
      return hillSprints(ctx, sizing);
    case "hillRepeats":
      return hillRepeats(ctx, sizing);
    case "fartlek":
      return fartlek(ctx, sizing);
    case "racePace":
      return racePaceSession(ctx, sizing, opts);
  }
}
