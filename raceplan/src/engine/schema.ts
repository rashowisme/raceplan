/**
 * Zod schemas for engine inputs. Shared with the UI form (which converts
 * user units to metric before validating with `runnerProfileSchema`).
 * Date-relative checks (race in the past) live in `validateProfile`, since
 * schemas must not know "today".
 */
import { z } from "zod";
import { CONFIG } from "./config";
import {
  INJURY_FREQUENCIES,
  INJURY_TYPES,
  PLAN_STYLES,
  PREFERENCE_TAGS,
  RACE_TYPES,
  SEXES,
  WEEKDAYS,
  YEARS_RUNNING,
} from "./types";

const L = CONFIG.inputLimits;

export const isoDateSchema = z.iso.date();

export const raceTypeSchema = z.enum(RACE_TYPES);
export const weekdaySchema = z.enum(WEEKDAYS);
export const preferenceTagSchema = z.enum(PREFERENCE_TAGS);

const timeSchema = z
  .number()
  .int()
  .positive()
  .max(24 * 3600);

export const raceInfoSchema = z
  .object({
    type: raceTypeSchema,
    distanceM: z.number().positive().max(L.maxTrailDistanceM).optional(),
    elevationGainM: z.number().min(0).max(L.maxElevationGainM).optional(),
    date: isoDateSchema,
  })
  .superRefine((race, ctx) => {
    if ((race.type === "custom" || race.type === "trail") && race.distanceM === undefined) {
      ctx.addIssue({ code: "custom", path: ["distanceM"], message: "required" });
    }
    if (race.type === "trail" && race.elevationGainM === undefined) {
      ctx.addIssue({ code: "custom", path: ["elevationGainM"], message: "required" });
    }
    if (race.distanceM !== undefined && race.distanceM < L.minCustomDistanceM) {
      ctx.addIssue({ code: "custom", path: ["distanceM"], message: "too_small" });
    }
  });

export const injuryEntrySchema = z.object({
  type: z.enum(INJURY_TYPES),
  frequency: z.enum(INJURY_FREQUENCIES),
});

export const runnerProfileSchema = z
  .object({
    race: raceInfoSchema,
    planStartDate: isoDateSchema.optional(),
    personalRecord: z
      .object({ timeS: timeSchema, achievedOn: isoDateSchema.optional() })
      .optional(),
    watchPrediction: z.object({ timeS: timeSchema }).optional(),
    targetTimeS: timeSchema.optional(),
    currentWeeklyVolumeM: z.number().min(0).max(L.maxWeeklyVolumeM),
    longestRecentRunM: z.number().min(0).max(L.maxTrailDistanceM).optional(),
    maxWeeklyVolumeM: z.number().min(L.minMaxWeeklyVolumeM).max(L.maxWeeklyVolumeM),
    availableDays: z.array(weekdaySchema).min(2).max(7),
    longRunDay: weekdaySchema,
    yearsRunning: z.enum(YEARS_RUNNING),
    injuries: z.array(injuryEntrySchema).max(INJURY_TYPES.length),
    currentlyInjured: z.boolean(),
    age: z.number().int().min(L.minAge).max(L.maxAge),
    sex: z.enum(SEXES).optional(),
    planStyle: z.enum(PLAN_STYLES),
    preferences: z.object({
      likes: z.array(preferenceTagSchema),
      dislikes: z.array(preferenceTagSchema),
    }),
  })
  .superRefine((p, ctx) => {
    if (new Set(p.availableDays).size !== p.availableDays.length) {
      ctx.addIssue({ code: "custom", path: ["availableDays"], message: "duplicate" });
    }
    if (!p.availableDays.includes(p.longRunDay)) {
      ctx.addIssue({ code: "custom", path: ["longRunDay"], message: "not_available" });
    }
    if (new Set(p.injuries.map((i) => i.type)).size !== p.injuries.length) {
      ctx.addIssue({ code: "custom", path: ["injuries"], message: "duplicate" });
    }
    if (p.preferences.likes.some((t) => p.preferences.dislikes.includes(t))) {
      ctx.addIssue({ code: "custom", path: ["preferences"], message: "conflict" });
    }
    if (p.longestRecentRunM !== undefined && p.longestRecentRunM > p.currentWeeklyVolumeM * 4 + 1) {
      // Longest run can't exceed the whole 4-week volume.
      ctx.addIssue({ code: "custom", path: ["longestRecentRunM"], message: "inconsistent" });
    }
    const distanceM = raceDistanceForValidation(p.race.type, p.race.distanceM);
    const checkTime = (timeS: number | undefined, path: string[]) => {
      if (timeS === undefined || distanceM === undefined) return;
      const pace = timeS / (distanceM / 1000);
      // Trail paces can be very slow; only bound the fast side for trail.
      const slowLimit = p.race.type === "trail" ? Infinity : L.slowestPaceSPerKm;
      if (pace < L.fastestPaceSPerKm || pace > slowLimit) {
        ctx.addIssue({ code: "custom", path, message: "implausible_time" });
      }
    };
    checkTime(p.personalRecord?.timeS, ["personalRecord", "timeS"]);
    checkTime(p.watchPrediction?.timeS, ["watchPrediction", "timeS"]);
    checkTime(p.targetTimeS, ["targetTimeS"]);
  });

function raceDistanceForValidation(
  type: z.infer<typeof raceTypeSchema>,
  distanceM: number | undefined,
): number | undefined {
  if (type === "custom" || type === "trail") return distanceM;
  return CONFIG.standardDistancesM[type];
}

export type RunnerProfileInput = z.input<typeof runnerProfileSchema>;
