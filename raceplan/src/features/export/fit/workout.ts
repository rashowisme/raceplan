/**
 * Structured workout → FIT workout file (file type 5): one `workout` message
 * and one `workout_step` per step, repeats as "repeat until steps complete".
 * Paces become speed ranges; steps without a pace (effort-only plans, hills,
 * strides) get an open target with the effort as the step name.
 */
import type { IsoDate, SimpleStep, Workout, WorkoutStep } from "@/engine/types";
import { effortDescription, effortLabel, type Formatter } from "@/features/plan-calendar/format";
import { FIT_EPOCH_OFFSET_S, FitWriter, type Field } from "./encoder";

/** Global message numbers and enum values from the FIT profile. */
const MESG = { fileId: 0, workout: 26, workoutStep: 27 } as const;
const FILE_TYPE_WORKOUT = 5;
const MANUFACTURER_DEVELOPMENT = 255;
const SPORT_RUNNING = 1;
const SUB_SPORT = { generic: 0, trail: 3 } as const;
const DURATION = { time: 0, distance: 1, repeatUntilStepsComplete: 6 } as const;
const TARGET = { speed: 0, open: 2 } as const;
const INTENSITY: Record<SimpleStep["kind"], number> = {
  run: 0, // active
  work: 0, // active
  warmup: 2,
  cooldown: 3,
  recovery: 4,
};

export interface FitWorkoutOptions {
  /** Name shown in the watch's workout list. */
  name: string;
  /** Recorded as the file's creation time (keeps exports deterministic). */
  createdOn: IsoDate;
  trail: boolean;
}

const fitTime = (iso: IsoDate) => Date.parse(`${iso}T00:00:00Z`) / 1000 - FIT_EPOCH_OFFSET_S;

/** Number of `workout_step` messages a step list produces. */
export const fitStepCount = (steps: readonly WorkoutStep[]): number =>
  steps.reduce((n, s) => n + (s.kind === "repeat" ? s.steps.length + 1 : 1), 0);

function stepFields(f: Formatter, index: number, s: SimpleStep): Field[] {
  const duration: Field[] =
    s.duration.type === "time"
      ? [
          { num: 1, type: "enum", value: DURATION.time },
          { num: 2, type: "uint32", value: s.duration.seconds * 1000 },
        ]
      : [
          { num: 1, type: "enum", value: DURATION.distance },
          { num: 2, type: "uint32", value: s.duration.meters * 100 },
        ];
  const pace = s.target.pace;
  const target: Field[] = pace
    ? [
        { num: 3, type: "enum", value: TARGET.speed },
        { num: 4, type: "uint32", value: 0 },
        // Speed in mm/s: the slow end of the pace range is the low speed.
        { num: 5, type: "uint32", value: 1e6 / pace.slowSPerKm },
        { num: 6, type: "uint32", value: 1e6 / pace.fastSPerKm },
      ]
    : [{ num: 3, type: "enum", value: TARGET.open }];
  const terrain = s.terrain && s.terrain !== "flat" ? ` (${f.t(`terrain.${s.terrain}`)})` : "";
  return [
    { num: 254, type: "uint16", value: index },
    { num: 0, type: "string", value: effortLabel(f, s.target.effort) + terrain },
    ...duration,
    ...target,
    { num: 7, type: "enum", value: INTENSITY[s.kind] },
    { num: 8, type: "string", value: effortDescription(f, s.target.effort) },
  ];
}

export function workoutToFit(f: Formatter, workout: Workout, opts: FitWorkoutOptions): Uint8Array {
  const w = new FitWriter();
  w.write(MESG.fileId, [
    { num: 0, type: "enum", value: FILE_TYPE_WORKOUT },
    { num: 1, type: "uint16", value: MANUFACTURER_DEVELOPMENT },
    { num: 2, type: "uint16", value: 0 },
    { num: 4, type: "uint32", value: fitTime(opts.createdOn) },
  ]);
  w.write(MESG.workout, [
    { num: 4, type: "enum", value: SPORT_RUNNING },
    { num: 11, type: "enum", value: opts.trail ? SUB_SPORT.trail : SUB_SPORT.generic },
    { num: 6, type: "uint16", value: fitStepCount(workout.steps) },
    { num: 8, type: "string", value: opts.name },
  ]);
  let index = 0;
  for (const s of workout.steps) {
    if (s.kind !== "repeat") {
      w.write(MESG.workoutStep, stepFields(f, index++, s));
      continue;
    }
    const first = index;
    for (const child of s.steps) w.write(MESG.workoutStep, stepFields(f, index++, child));
    w.write(MESG.workoutStep, [
      { num: 254, type: "uint16", value: index++ },
      { num: 1, type: "enum", value: DURATION.repeatUntilStepsComplete },
      { num: 2, type: "uint32", value: first },
      // `target_value` reads as `repeat_steps` for this duration type.
      { num: 4, type: "uint32", value: s.count },
    ]);
  }
  return w.bytes();
}
