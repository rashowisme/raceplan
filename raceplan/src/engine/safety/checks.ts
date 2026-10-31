/**
 * Spec §6–§8 safety invariants, checked on a finished plan. Used as the
 * oracle in property tests. Thresholds come straight from the spec (CONFIG);
 * the builder may be stricter.
 */
import { CONFIG } from "../config";
import { addDays } from "../dates";
import { experienceLevel, interpolateByDistance, riskFlags } from "../profile";
import { isHeldWeek } from "../adapt/log";
import { allowedIncrease, startVolume } from "../builder/volume";
import type { PlanWeek, TrainingLog, TrainingPlan, Workout, WorkoutType } from "../types";

export interface Violation {
  rule: string;
  week?: number;
  date?: string;
  detail: string;
}

const EPS = 1;

/** §7.6 exactly as specified (the builder applies a stricter, smoothed cap). */
function specLongRunShareCap(volM: number, runs: number): number {
  const share =
    volM < CONFIG.smallVolumeThresholdM
      ? CONFIG.longRunShare.smallVolume
      : CONFIG.longRunShare.normal;
  return volM * Math.max(share, 1 / runs);
} // meters / ratios tolerance for float noise

const QUALITY_TYPES: WorkoutType[] = [
  "tempo",
  "cruiseIntervals",
  "shortIntervals",
  "longIntervals",
  "hillSprints",
  "hillRepeats",
  "fartlek",
  "racePace",
  "timeTrial",
  "downhillPractice",
];

const isQuality = (w: Workout | null): w is Workout => !!w && QUALITY_TYPES.includes(w.type);
const isPartial = (w: PlanWeek) => w.days.length < 7;
const refVolume = (w: PlanWeek) => (isPartial(w) ? w.targetVolumeM : w.plannedVolumeM);

/**
 * Reference week for increases: the previous week, or the last full week
 * before a cutback. §13: weeks with ≥ 20% missed are skipped the same way
 * (what was really run is the reference; no increase right after them).
 */
function referenceIndex(
  weeks: PlanWeek[],
  i: number,
  log?: TrainingLog,
): { ref: number; afterCutback: boolean } {
  const skip = (w: PlanWeek) => w.isCutback || isHeldWeek(w, log);
  if (!skip(weeks[i - 1]!)) return { ref: i - 1, afterCutback: false };
  let r = i - 1;
  while (r > 0 && skip(weeks[r]!)) r--;
  return { ref: r, afterCutback: true };
}

export function checkPlan(plan: TrainingPlan): Violation[] {
  const out: Violation[] = [];
  const p = plan.profile;
  const level = experienceLevel(p);
  const flags = riskFlags(p);
  const risk = flags.length > 0;
  const conservative = level === "beginner" || risk;
  const ramp = conservative ? CONFIG.ramp.conservative : CONFIG.ramp.normal;
  const every =
    risk || p.age >= CONFIG.riskAge ? CONFIG.cutbackEvery.conservative : CONFIG.cutbackEvery.normal;
  const minRest = level === "beginner" || risk ? 2 : 1;
  const effortM = plan.summary.effortDistanceM;
  const weeks = plan.weeks;
  const v = (rule: string, detail: string, week?: number, date?: string) =>
    out.push({ rule, detail, week, date });

  // R1 + R8: never above max; peak ≤ min(max, target for level).
  const peakLevel = p.age < CONFIG.minorAge && level === "experienced" ? "intermediate" : level;
  const peakTarget = interpolateByDistance(effortM, (r) => CONFIG.peakVolumeM[r][peakLevel]);
  for (const w of weeks) {
    if (w.plannedVolumeM > p.maxWeeklyVolumeM + EPS) {
      v("max_volume", `${w.plannedVolumeM} > max ${p.maxWeeklyVolumeM}`, w.index);
    }
    if (w.plannedVolumeM > Math.min(p.maxWeeklyVolumeM, peakTarget) + EPS) {
      v("peak_volume", `${w.plannedVolumeM} > peak ${Math.round(peakTarget)}`, w.index);
    }
  }

  // R10: plan never starts above current (+ allowed increase).
  if (weeks[0]) {
    const limit =
      p.currentWeeklyVolumeM +
      allowedIncrease(p.currentWeeklyVolumeM, ramp, CONFIG.smallVolumeAllowanceM);
    if (weeks[0].plannedVolumeM > limit + EPS)
      v("start_volume", `${weeks[0].plannedVolumeM} > ${limit}`, 0);
  }

  // R2 + R6 increase rules.
  for (let i = 1; i < weeks.length; i++) {
    const w = weeks[i]!;
    const { ref, afterCutback } = referenceIndex(weeks, i, plan.log);
    const r = weeks[ref]!;
    // §13: if even week 0 was held, the last fully done level is what the
    // runner ran before the plan.
    const preplan = ref === 0 && isHeldWeek(r, plan.log);
    const rv = preplan
      ? startVolume(p.currentWeeklyVolumeM, p.maxWeeklyVolumeM, CONFIG.smallVolumeAllowanceM)
      : refVolume(r);
    const limit = afterCutback ? rv : rv + allowedIncrease(rv, ramp, CONFIG.smallVolumeAllowanceM);
    if (w.plannedVolumeM > limit + EPS) {
      v("ramp", `week ${i}: ${w.plannedVolumeM} > ${Math.round(limit)} (ref week ${ref})`, i);
    }
    const refLong = isPartial(r) || preplan ? 0 : r.longRunM;
    if (refLong > 0) {
      const longLimit = afterCutback ? refLong : refLong + CONFIG.longRunMaxIncreaseM;
      if (w.longRunM > longLimit + EPS) v("long_run_increase", `${w.longRunM} > ${longLimit}`, i);
    }
  }

  // R3: cutbacks.
  const preTaper = weeks.filter((w) => w.phase !== "taper");
  let run = 0;
  const usedBefore = new Set<WorkoutType>();
  for (const w of weeks) {
    const quality = w.days.map((d) => d.workout).filter(isQuality);
    if (w.phase !== "taper") {
      if (w.isCutback) {
        run = 0;
        const { ref } = referenceIndex(weeks, w.index, plan.log);
        const rv = refVolume(weeks[ref]!);
        if (w.plannedVolumeM > rv * (1 - CONFIG.cutbackReductionRange[0]) + EPS) {
          v("cutback_depth", `${w.plannedVolumeM} vs ref ${rv}`, w.index);
        }
        // "Not too deep" is a training-quality rule, not a safety limit: once
        // the plan has adapted to missed training (§13), rebuilt weeks may cut
        // deeper (they also never plan more than the original week).
        const adapted = weeks
          .slice(0, w.index + 1)
          .some((x) => x.adaptations?.length || isHeldWeek(x, plan.log));
        if (!adapted && w.targetVolumeM < rv * (1 - CONFIG.cutbackReductionRange[1]) - 100) {
          v("cutback_too_deep", `${w.targetVolumeM} vs ref ${rv}`, w.index);
        }
        if (quality.length > 1)
          v("cutback_intensity", `${quality.length} quality sessions`, w.index);
        for (const q of quality) {
          if (!usedBefore.has(q.type)) v("cutback_new_intensity", q.type, w.index);
        }
      } else {
        run++;
        if (run > every - 1 && preTaper.length >= every) {
          v("cutback_missing", `${run} weeks without cutback`, w.index);
        }
      }
    }
    for (const q of quality) usedBefore.add(q.type);
  }

  // R4: rest days (full weeks).
  for (const w of weeks) {
    if (isPartial(w)) continue;
    const rest = w.days.filter((d) => d.workout === null).length;
    if (rest < minRest) v("rest_days", `${rest} rest days < ${minRest}`, w.index);
  }

  // R5: no back-to-back hard days (whole plan); age ≥ 50: 2 easy days after long run.
  const allDays = weeks.flatMap((w) => w.days);
  const byDate = new Map(allDays.map((d) => [d.date, d]));
  for (const d of allDays) {
    const next = byDate.get(addDays(d.date, 1));
    if (d.workout?.isHard && next?.workout?.isHard)
      v("hard_back_to_back", d.date, undefined, d.date);
    if (d.workout?.isLongRun && p.age >= CONFIG.riskAge) {
      for (const k of [1, 2]) {
        const after = byDate.get(addDays(d.date, k));
        if (after?.workout?.isHard) v("hard_after_long_50", after.date, undefined, after.date);
      }
    }
  }

  // R6 + R7: long run share and caps.
  const longCap = interpolateByDistance(effortM, (r) => CONFIG.longRunCapM[r]);
  for (const w of weeks) {
    for (const d of w.days) {
      const wk = d.workout;
      if (!wk?.isLongRun) continue;
      const runs = w.days.filter((x) => x.workout && x.workout.type !== "race").length;
      if (wk.estDistanceM > specLongRunShareCap(w.plannedVolumeM, runs) + EPS) {
        v("long_run_share", `${wk.estDistanceM} of ${w.plannedVolumeM}`, w.index, d.date);
      }
      if (wk.estDistanceM > longCap + EPS)
        v("long_run_cap", `${wk.estDistanceM} > ${longCap}`, w.index);
      if (wk.estDurationS > CONFIG.longRunMaxDurationS + 60) {
        v("long_run_duration", `${wk.estDurationS}s`, w.index, d.date);
      }
    }
  }

  // R9: taper present (n ≥ 2), each taper week −20% or more.
  const last = weeks.at(-1);
  if (weeks.length >= 2) {
    if (!last?.isRaceWeek || last.phase !== "taper")
      v("taper_missing", "last week is not a taper week");
  }
  for (let i = 1; i < weeks.length; i++) {
    const w = weeks[i]!;
    if (w.phase !== "taper") continue;
    const prev = weeks[i - 1]!;
    const ref = prev.phase === "taper" ? prev : weeks[referenceIndex(weeks, i, plan.log).ref]!;
    const rv = w.isRaceWeek ? prev.plannedVolumeM : refVolume(ref);
    if (w.plannedVolumeM > rv * (1 - CONFIG.taperReductionRange[0]) + EPS) {
      v("taper_reduction", `${w.plannedVolumeM} vs ${rv}`, i);
    }
  }

  // §6: quality session counts and intensity distribution.
  const maxQ = CONFIG.qualitySessions[level];
  const minEasy =
    p.planStyle === "polarized" ? CONFIG.minEasySharePolarized : CONFIG.minEasyShareFloor;
  for (const w of weeks) {
    const quality = w.days.map((d) => d.workout).filter(isQuality);
    const q = quality.filter((x) => x.type !== "timeTrial").length;
    if (q > maxQ) v("quality_count", `${q} > ${maxQ}`, w.index);
    if (level === "beginner" && w.index < CONFIG.beginnerStridesOnlyWeeks && quality.length > 0) {
      v("beginner_strides_only", `${quality.length} quality`, w.index);
    }
    if (risk && w.index < CONFIG.riskFlaggedSingleQualityWeeks && q > 1) {
      v("risk_single_quality", `${q} quality`, w.index);
    }
    if (p.age >= CONFIG.seniorAge && q > 1) v("senior_single_quality", `${q} quality`, w.index);
    if (w.isRaceWeek) continue;
    let total = 0;
    let easy = 0;
    for (const d of w.days) {
      if (!d.workout) continue;
      total += d.workout.estDurationS;
      easy += d.workout.easyDurationS;
    }
    if (total > 0 && easy / total < minEasy - 0.005) {
      v("easy_share", `${(easy / total).toFixed(3)} < ${minEasy}`, w.index);
    }
  }

  return out;
}
