/**
 * Public engine API. Pure and deterministic: same input → same output.
 */
import { assemblePlan } from "./builder/plan";
import { CONFIG } from "./config";
import { diffDays, nextMondayOrSame } from "./dates";
import { effortDistanceM, raceDistanceM } from "./profile";
import { runnerProfileSchema } from "./schema";
import type { GenerateOptions, GeneratePlanResult, Refusal, RunnerProfile } from "./types";

export type ValidationResult =
  { ok: true; profile: RunnerProfile } | { ok: false; refusal: Refusal };

/** Validate a profile (schema + date-relative + support checks). */
export function validateProfile(input: unknown, { today }: GenerateOptions): ValidationResult {
  const parsed = runnerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      refusal: {
        code: "invalid_input",
        issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), code: i.message })),
      },
    };
  }
  const profile = parsed.data as RunnerProfile;

  if (profile.currentlyInjured) return { ok: false, refusal: { code: "currently_injured" } };
  if (diffDays(today, profile.race.date) <= 0)
    return { ok: false, refusal: { code: "race_in_past" } };

  const isTrail = profile.race.type === "trail";
  if (
    (!isTrail && raceDistanceM(profile) > CONFIG.maxRoadDistanceM) ||
    effortDistanceM(profile) > CONFIG.maxEffortDistanceM
  ) {
    return { ok: false, refusal: { code: "distance_not_supported" } };
  }

  if (profile.planStartDate !== undefined) {
    if (diffDays(today, profile.planStartDate) < 0) {
      return invalid("planStartDate", "in_past");
    }
    if (diffDays(profile.planStartDate, profile.race.date) <= 0) {
      return invalid("planStartDate", "after_race");
    }
  }
  if (
    profile.personalRecord?.achievedOn &&
    diffDays(profile.personalRecord.achievedOn, today) < 0
  ) {
    return invalid("personalRecord.achievedOn", "in_future");
  }
  return { ok: true, profile };
}

function invalid(path: string, code: string): ValidationResult {
  return { ok: false, refusal: { code: "invalid_input", issues: [{ path, code }] } };
}

/** Default plan start: next Monday, or today if Monday — but never after race day. */
export function defaultStartDate(profile: RunnerProfile, today: string): string {
  const monday = nextMondayOrSame(today);
  return diffDays(monday, profile.race.date) > 0 ? monday : today;
}

export function generatePlan(input: unknown, options: GenerateOptions): GeneratePlanResult {
  const v = validateProfile(input, options);
  if (!v.ok) return v;
  const start = v.profile.planStartDate ?? defaultStartDate(v.profile, options.today);
  return { ok: true, plan: assemblePlan(v.profile, options.today, start) };
}

export {
  adaptPlan,
  addCheckIn,
  openPause,
  setWorkoutStatus,
  undoCheckIn,
  type LogError,
  type LogResult,
  type Pause,
} from "./adapt/adapt";
export { pauseOn, checkInEffects } from "./adapt/log";
export { checkPlan, type Violation } from "./safety/checks";
export { runnerProfileSchema } from "./schema";
export * from "./types";
export { applyTimeTrialResult, findTimeTrial } from "./timeTrial";
