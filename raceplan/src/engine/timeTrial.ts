/**
 * Spec §3.4: once the runner enters their time trial result, paces can be
 * computed. Weeks already started stay exactly as planned (the runner may
 * have run them); every later week is rebuilt with real paces from the same
 * profile, start date and generation day.
 */
import { assemblePlan } from "./builder/plan";
import { diffDays } from "./dates";
import { validateProfile } from "./index";
import { timeTrialResultSchema } from "./schema";
import type {
  GenerateOptions,
  GeneratePlanResult,
  IsoDate,
  RunnerProfile,
  TimeTrialResult,
  TrainingPlan,
} from "./types";

/** The plan's time trial workout date and distance, if it has one. */
export function findTimeTrial(plan: TrainingPlan): { date: IsoDate; distanceM: number } | null {
  for (const w of plan.weeks)
    for (const d of w.days)
      if (d.workout?.type === "timeTrial") {
        const work = d.workout.steps.find((s) => s.kind === "work");
        const distanceM =
          work?.kind === "work" && work.duration.type === "distance" ? work.duration.meters : 0;
        return distanceM > 0 ? { date: d.date, distanceM } : null;
      }
  return null;
}

/** First week that hasn't started yet on `today` (weeks before it are kept). */
function firstFutureWeek(plan: TrainingPlan, today: IsoDate): number {
  const i = plan.weeks.findIndex((w) => diffDays(today, w.startDate) > 0);
  return i === -1 ? plan.weeks.length : i;
}

export function applyTimeTrialResult(
  plan: TrainingPlan,
  input: unknown,
  { today }: GenerateOptions,
): GeneratePlanResult {
  const parsed = timeTrialResultSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      refusal: {
        code: "invalid_input",
        issues: parsed.error.issues.map((i) => ({
          path: ["timeTrialResult", ...i.path].join("."),
          code: i.message,
        })),
      },
    };
  }
  const result: TimeTrialResult = parsed.data;
  if (diffDays(result.date, today) < 0) return invalid("date", "in_future");
  if (diffDays(plan.generatedOn, result.date) < 0) return invalid("date", "before_plan");

  const profile: RunnerProfile = {
    ...plan.profile,
    timeTrialResult: result,
    planStartDate: plan.startDate,
  };
  // Rebuild as of the original generation day so the plan frame is unchanged.
  const v = validateProfile(profile, { today: plan.generatedOn });
  if (!v.ok) return v;
  const kept = plan.weeks.slice(0, firstFutureWeek(plan, today));
  const fresh = assemblePlan(v.profile, plan.generatedOn, plan.startDate, kept);
  const sameFrame =
    fresh.weeks.length === plan.weeks.length &&
    fresh.weeks.every((w, i) => w.startDate === plan.weeks[i]!.startDate);
  if (!sameFrame) return invalid("plan", "frame_changed");
  return { ok: true, plan: fresh };
}

function invalid(field: string, code: string): GeneratePlanResult {
  return {
    ok: false,
    refusal: { code: "invalid_input", issues: [{ path: `timeTrialResult.${field}`, code }] },
  };
}
