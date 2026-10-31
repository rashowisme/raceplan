/**
 * Form model: values are kept in the user's units as strings (what they
 * typed); `toProfile` converts them to the engine's metric RunnerProfile.
 * Validation messages are translation keys under `form.errors.*`.
 */
import { z } from "zod";
import { CONFIG } from "@/engine/config";
import { validateProfile } from "@/engine";
import {
  INJURY_FREQUENCIES,
  INJURY_TYPES,
  PLAN_STYLES,
  PREFERENCE_TAGS,
  RACE_TYPES,
  SEXES,
  WEEKDAYS,
  YEARS_RUNNING,
  type InjuryFrequency,
  type InjuryType,
  type RunnerProfile,
} from "@/engine/types";
import {
  FEET_PER_METER,
  metersToUnit,
  parseClock,
  parseDecimal,
  unitToMeters,
  type DistanceUnit,
} from "@/lib/units";

export interface PlanFormValues {
  raceType: (typeof RACE_TYPES)[number] | "";
  distance: string;
  elevationGain: string;
  raceDate: string;
  startDate: string;
  prTime: string;
  prDate: string;
  watchTime: string;
  targetTime: string;
  currentVolume: string;
  longestRun: string;
  maxVolume: string;
  yearsRunning: (typeof YEARS_RUNNING)[number] | "";
  availableDays: (typeof WEEKDAYS)[number][];
  longRunDay: (typeof WEEKDAYS)[number] | "";
  injuries: Partial<Record<InjuryType, InjuryFrequency>>;
  currentlyInjured: boolean;
  age: string;
  sex: (typeof SEXES)[number] | "";
  planStyle: (typeof PLAN_STYLES)[number];
  likes: (typeof PREFERENCE_TAGS)[number][];
  dislikes: (typeof PREFERENCE_TAGS)[number][];
}

export const DEFAULT_VALUES: PlanFormValues = {
  raceType: "",
  distance: "",
  elevationGain: "",
  raceDate: "",
  startDate: "",
  prTime: "",
  prDate: "",
  watchTime: "",
  targetTime: "",
  currentVolume: "",
  longestRun: "",
  maxVolume: "",
  yearsRunning: "",
  availableDays: [],
  longRunDay: "",
  injuries: {},
  currentlyInjured: false,
  age: "",
  sex: "",
  planStyle: "balanced",
  likes: [],
  dislikes: [],
};

export const STEPS = ["race", "fitness", "training", "health", "style"] as const;
export type StepId = (typeof STEPS)[number];

export const STEP_FIELDS: Record<StepId, (keyof PlanFormValues)[]> = {
  race: ["raceType", "distance", "elevationGain", "raceDate", "startDate"],
  fitness: ["prTime", "prDate", "watchTime", "targetTime"],
  training: [
    "currentVolume",
    "longestRun",
    "maxVolume",
    "yearsRunning",
    "availableDays",
    "longRunDay",
  ],
  health: ["injuries", "currentlyInjured", "age", "sex"],
  style: ["planStyle", "likes", "dislikes"],
};

// ---------------------------------------------------------------------------
// Per-step schemas
// ---------------------------------------------------------------------------

const L = CONFIG.inputLimits;

const required = z.string().trim().min(1, "required");
const optionalClock = z
  .string()
  .trim()
  .refine((s) => s === "" || parseClock(s) !== null, "time_format");

/** Optional/required decimal within [min, max] (in the given unit). */
function decimal(opts: { min: number; max: number; optional?: boolean }) {
  return z
    .string()
    .trim()
    .superRefine((s, ctx) => {
      if (s === "") {
        if (!opts.optional) ctx.addIssue({ code: "custom", message: "required" });
        return;
      }
      const n = parseDecimal(s);
      if (n === null) ctx.addIssue({ code: "custom", message: "number" });
      else if (n < opts.min)
        ctx.addIssue({ code: "custom", message: "too_small", params: { min: opts.min } });
      else if (n > opts.max)
        ctx.addIssue({ code: "custom", message: "too_large", params: { max: opts.max } });
    });
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
const issueParams = (issue: z.core.$ZodIssue) =>
  (issue as { params?: Record<string, number | string> }).params;
const distLimit = (m: number, unit: DistanceUnit) => round1(metersToUnit(m, unit));

export function stepSchemas(unit: DistanceUnit, today: string) {
  const dateAfterToday = (s: string) => s > today;
  return {
    race: z
      .object({
        raceType: z.enum(RACE_TYPES, { message: "required" }),
        distance: z.string(),
        elevationGain: z.string(),
        raceDate: required.refine((s) => /^\d{4}-\d{2}-\d{2}$/.test(s), "date_format"),
        startDate: z.string(),
      })
      .superRefine((v, ctx) => {
        if (v.raceDate && !dateAfterToday(v.raceDate)) {
          ctx.addIssue({ code: "custom", path: ["raceDate"], message: "race_in_past" });
        }
        if (v.raceType === "custom" || v.raceType === "trail") {
          const max = v.raceType === "trail" ? L.maxTrailDistanceM : CONFIG.maxRoadDistanceM;
          const r = decimal({
            min: distLimit(L.minCustomDistanceM, unit),
            max: distLimit(max, unit),
          }).safeParse(v.distance);
          if (!r.success) {
            const issue = r.error.issues[0]!;
            ctx.addIssue({
              code: "custom",
              path: ["distance"],
              message: issue.message,
              params: issueParams(issue),
            });
          }
        }
        if (v.raceType === "trail") {
          const maxGain =
            unit === "km" ? L.maxElevationGainM : Math.round(L.maxElevationGainM * FEET_PER_METER);
          const r = decimal({ min: 0, max: maxGain }).safeParse(v.elevationGain);
          if (!r.success) {
            const issue = r.error.issues[0]!;
            ctx.addIssue({
              code: "custom",
              path: ["elevationGain"],
              message: issue.message,
              params: issueParams(issue),
            });
          }
        }
        if (v.startDate) {
          if (v.startDate < today)
            ctx.addIssue({ code: "custom", path: ["startDate"], message: "start_in_past" });
          else if (v.raceDate && v.startDate >= v.raceDate) {
            ctx.addIssue({ code: "custom", path: ["startDate"], message: "start_after_race" });
          }
        }
      }),
    fitness: z
      .object({
        prTime: optionalClock,
        prDate: z.string(),
        watchTime: optionalClock,
        targetTime: optionalClock,
      })
      .superRefine((v, ctx) => {
        if (v.prDate && v.prDate > today) {
          ctx.addIssue({ code: "custom", path: ["prDate"], message: "date_in_future" });
        }
        if (v.prDate && !v.prTime)
          ctx.addIssue({ code: "custom", path: ["prTime"], message: "required" });
      }),
    training: z
      .object({
        currentVolume: decimal({ min: 0, max: distLimit(L.maxWeeklyVolumeM, unit) }),
        longestRun: decimal({ min: 0, max: distLimit(L.maxTrailDistanceM, unit), optional: true }),
        maxVolume: decimal({
          min: distLimit(L.minMaxWeeklyVolumeM, unit),
          max: distLimit(L.maxWeeklyVolumeM, unit),
        }),
        yearsRunning: z.enum(YEARS_RUNNING, { message: "required" }),
        availableDays: z.array(z.enum(WEEKDAYS)).min(2, "min_days"),
        longRunDay: z.enum(WEEKDAYS, { message: "required" }),
      })
      .superRefine((v, ctx) => {
        if (!v.availableDays.includes(v.longRunDay)) {
          ctx.addIssue({ code: "custom", path: ["longRunDay"], message: "long_day_not_available" });
        }
      }),
    health: z.object({
      age: decimal({ min: L.minAge, max: L.maxAge }).refine(
        (s) => /^\d+$/.test(s.trim()),
        "integer",
      ),
      currentlyInjured: z.literal(false, { message: "currently_injured" }),
      injuries: z.partialRecord(z.enum(INJURY_TYPES), z.enum(INJURY_FREQUENCIES)),
      sex: z.union([z.enum(SEXES), z.literal("")]),
    }),
    style: z.object({
      planStyle: z.enum(PLAN_STYLES),
      likes: z.array(z.enum(PREFERENCE_TAGS)),
      dislikes: z.array(z.enum(PREFERENCE_TAGS)),
    }),
  } satisfies Record<StepId, z.ZodType>;
}

export interface FieldError {
  field: keyof PlanFormValues;
  message: string;
  params?: Record<string, number | string>;
}

export function validateStep(
  step: StepId,
  values: PlanFormValues,
  unit: DistanceUnit,
  today: string,
): FieldError[] {
  const r = stepSchemas(unit, today)[step].safeParse(values);
  if (r.success) return [];
  const seen = new Set<string>();
  const out: FieldError[] = [];
  for (const issue of r.error.issues) {
    const field = issue.path[0] as keyof PlanFormValues;
    if (seen.has(field)) continue;
    seen.add(field);
    const params = issueParams(issue);
    out.push({ field, message: issue.message, ...(params ? { params } : {}) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

const toMeters = (s: string, unit: DistanceUnit) => unitToMeters(parseDecimal(s) ?? 0, unit);
const elevationToMeters = (s: string, unit: DistanceUnit) =>
  unit === "km" ? (parseDecimal(s) ?? 0) : (parseDecimal(s) ?? 0) / FEET_PER_METER;

/** Form values (user units) → engine profile (metric). Assumes steps validated. */
export function toProfile(v: PlanFormValues, unit: DistanceUnit): RunnerProfile {
  const raceType = v.raceType || "10k";
  const profile: RunnerProfile = {
    race: { type: raceType, date: v.raceDate },
    currentWeeklyVolumeM: Math.round(toMeters(v.currentVolume, unit)),
    maxWeeklyVolumeM: Math.round(toMeters(v.maxVolume, unit)),
    availableDays: WEEKDAYS.filter((d) => v.availableDays.includes(d)),
    longRunDay: v.longRunDay || "sun",
    yearsRunning: v.yearsRunning || "1to3",
    injuries: INJURY_TYPES.filter((t) => v.injuries[t]).map((t) => ({
      type: t,
      frequency: v.injuries[t]!,
    })),
    currentlyInjured: v.currentlyInjured,
    age: Number(v.age),
    planStyle: v.planStyle,
    preferences: { likes: [...v.likes], dislikes: [...v.dislikes] },
  };
  if (raceType === "custom" || raceType === "trail") {
    profile.race.distanceM = Math.round(toMeters(v.distance, unit));
  }
  if (raceType === "trail")
    profile.race.elevationGainM = Math.round(elevationToMeters(v.elevationGain, unit));
  if (v.startDate) profile.planStartDate = v.startDate;
  const pr = parseClock(v.prTime);
  if (pr !== null) {
    profile.personalRecord = { timeS: pr };
    if (v.prDate) profile.personalRecord.achievedOn = v.prDate;
  }
  const watch = parseClock(v.watchTime);
  if (watch !== null) profile.watchPrediction = { timeS: watch };
  const target = parseClock(v.targetTime);
  if (target !== null) profile.targetTimeS = target;
  if (v.longestRun.trim() !== "")
    profile.longestRecentRunM = Math.round(toMeters(v.longestRun, unit));
  if (v.sex) profile.sex = v.sex;
  return profile;
}

/** Engine issue paths → form fields. */
const PATH_TO_FIELD: Record<string, keyof PlanFormValues> = {
  "race.distanceM": "distance",
  "race.elevationGainM": "elevationGain",
  "race.date": "raceDate",
  planStartDate: "startDate",
  "personalRecord.timeS": "prTime",
  "personalRecord.achievedOn": "prDate",
  "watchPrediction.timeS": "watchTime",
  targetTimeS: "targetTime",
  currentWeeklyVolumeM: "currentVolume",
  longestRecentRunM: "longestRun",
  maxWeeklyVolumeM: "maxVolume",
  availableDays: "availableDays",
  longRunDay: "longRunDay",
  age: "age",
  preferences: "likes",
};

/** Field → step, to jump back to the step holding an engine-reported error. */
export function stepOfField(field: keyof PlanFormValues): StepId {
  return STEPS.find((s) => STEP_FIELDS[s].includes(field)) ?? "race";
}

/** Final validation with the engine's shared schema. */
export function validateWithEngine(
  v: PlanFormValues,
  unit: DistanceUnit,
  today: string,
): { ok: true; profile: RunnerProfile } | { ok: false; errors: FieldError[]; refusal?: string } {
  const profile = toProfile(v, unit);
  const r = validateProfile(profile, { today });
  if (r.ok) return { ok: true, profile: r.profile };
  if (r.refusal.code !== "invalid_input") return { ok: false, errors: [], refusal: r.refusal.code };
  const errors: FieldError[] = (r.refusal.issues ?? []).map((i) => ({
    field: PATH_TO_FIELD[i.path] ?? "raceType",
    message: i.code,
  }));
  return { ok: false, errors };
}

/** Convert the numeric fields when the user switches km ⇄ mi mid-form. */
export function convertUnits(
  v: PlanFormValues,
  from: DistanceUnit,
  to: DistanceUnit,
): PlanFormValues {
  if (from === to) return v;
  const conv = (s: string) => {
    const n = parseDecimal(s);
    if (n === null) return s;
    return String(round2(metersToUnit(unitToMeters(n, from), to)));
  };
  const gain = (s: string) => {
    const n = parseDecimal(s);
    if (n === null) return s;
    return String(Math.round(to === "mi" ? n * FEET_PER_METER : n / FEET_PER_METER));
  };
  return {
    ...v,
    distance: conv(v.distance),
    currentVolume: conv(v.currentVolume),
    longestRun: conv(v.longestRun),
    maxVolume: conv(v.maxVolume),
    elevationGain: gain(v.elevationGain),
  };
}
