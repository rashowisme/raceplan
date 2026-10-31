/**
 * Spec §3: turn PR / watch prediction / target into a conservative fitness
 * estimate, race pace and warnings.
 */
import { CONFIG } from "../config";
import { monthsBetween } from "../dates";
import type { FitnessEstimate, IsoDate, PlanWarning, RunnerProfile } from "../types";
import { clampVdot, predictTimeS, riegel, vdotFromPerformance } from "./vdot";

export interface FitnessResult {
  fitness: FitnessEstimate | null;
  /** Race pace (s/km) for race-pace work, or null when effort-only. */
  racePaceSPerKm: number | null;
  warnings: PlanWarning[];
}

interface Candidate {
  timeS: number;
  source: FitnessEstimate["source"];
  lowConfidence: boolean;
}

/**
 * @param distanceM distance used for fitness: race distance (road) or
 *   effort distance (trail), so trail times map to flat-equivalent fitness.
 */
export function estimateFitness(
  profile: RunnerProfile,
  distanceM: number,
  today: IsoDate,
  totalWeeks: number,
): FitnessResult {
  const cfg = CONFIG.fitness;
  const warnings: PlanWarning[] = [];
  const candidates: Candidate[] = [];

  /** §3.1 ageing: slow down old performances (and flag them as low confidence). */
  const age = (on: IsoDate | undefined, warn: boolean) => {
    if (!on) return { factor: 1, lowConfidence: false };
    const months = monthsBetween(on, today);
    if (warn && months >= cfg.prFullWeightMonths)
      warnings.push({ code: "old_pr", params: { months } });
    if (months > cfg.prOldMonths) return { factor: 1 + cfg.prSlowdownOld, lowConfidence: true };
    if (months >= cfg.prFullWeightMonths)
      return { factor: 1 + cfg.prSlowdownMid, lowConfidence: false };
    return { factor: 1, lowConfidence: false };
  };

  const pr = profile.personalRecord;
  if (pr) {
    const { factor, lowConfidence } = age(pr.achievedOn, true);
    candidates.push({ timeS: pr.timeS * factor, source: "personalRecord", lowConfidence });
  }
  const tt = profile.timeTrialResult;
  if (tt) {
    // §3.5: convert the time trial to the race distance with Riegel.
    const { factor, lowConfidence } = age(tt.date, false);
    candidates.push({
      timeS: riegel(tt.timeS, tt.distanceM, distanceM) * factor,
      source: "timeTrial",
      lowConfidence,
    });
  }
  if (profile.watchPrediction) {
    candidates.push({
      timeS: profile.watchPrediction.timeS * (1 + cfg.watchPenalty),
      source: "watchPrediction",
      lowConfidence: false,
    });
  }

  if (candidates.length === 0) {
    warnings.push({ code: "no_performance_data" });
    return { fitness: null, racePaceSPerKm: null, warnings };
  }

  // Slower (more conservative) candidate wins.
  const chosen = candidates.reduce((a, b) => (b.timeS > a.timeS ? b : a));
  const vdot = clampVdot(vdotFromPerformance(distanceM, chosen.timeS));
  const predictedRaceTimeS = Math.round(predictTimeS(vdot, distanceM));
  const fitness: FitnessEstimate = {
    vdot: Math.round(vdot * 10) / 10,
    predictedRaceTimeS,
    source: chosen.source,
    lowConfidence: chosen.lowConfidence,
  };

  let raceTimeS = predictedRaceTimeS;
  if (profile.targetTimeS !== undefined) {
    const targetVdot = vdotFromPerformance(distanceM, profile.targetTimeS);
    const gain = targetVdot / vdot - 1;
    const limit = totalWeeks >= cfg.longPlanWeeks ? cfg.ambitiousGainLong : cfg.ambitiousGainShort;
    if (gain > limit) {
      warnings.push({
        code: "goal_ambitious",
        params: { gainPct: Math.round(gain * 1000) / 10, limitPct: limit * 100 },
      });
    } else if (profile.targetTimeS < predictedRaceTimeS) {
      raceTimeS = profile.targetTimeS;
    }
  }

  return {
    fitness,
    racePaceSPerKm: Math.round(raceTimeS / (distanceM / 1000)),
    warnings,
  };
}
