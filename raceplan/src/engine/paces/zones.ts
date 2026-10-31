/**
 * Spec §4: Daniels-style pace zones from VDOT. Each zone is a range of
 * fractions of VO2max (fast end = higher fraction).
 */
import { CONFIG } from "../config";
import { paceAtFraction, predictTimeS } from "../fitness/vdot";
import type { Effort, ExperienceLevel, PaceRange, PaceZone, PaceZones } from "../types";

/** [slow fraction, fast fraction] of VDOT. M is derived from marathon prediction. */
const ZONE_FRACTIONS: Record<Exclude<PaceZone, "M">, readonly [number, number]> = {
  E: [0.62, 0.7],
  T: [0.86, 0.89],
  I: [0.96, 1.0],
  R: [1.04, 1.08],
};

/** Effort description paired with every zone. */
export const ZONE_EFFORT: Record<PaceZone, Effort> = {
  E: "easy",
  M: "marathon",
  T: "threshold",
  I: "interval",
  R: "repetition",
};

const round = (s: number) => Math.round(s);

export function paceZonesFromVdot(vdot: number): PaceZones {
  const range = (z: Exclude<PaceZone, "M">): PaceRange => {
    const [slowF, fastF] = ZONE_FRACTIONS[z];
    return {
      fastSPerKm: round(paceAtFraction(vdot, fastF)),
      slowSPerKm: round(paceAtFraction(vdot, slowF)),
    };
  };
  const mPace = predictTimeS(vdot, CONFIG.standardDistancesM.marathon) / 42.195;
  return {
    E: range("E"),
    M: { fastSPerKm: round(mPace * 0.985), slowSPerKm: round(mPace * 1.015) },
    T: range("T"),
    I: range("I"),
    R: range("R"),
  };
}

/** Assumed VDOT by level, used ONLY to estimate durations of effort-only plans. */
const ASSUMED_VDOT: Record<ExperienceLevel, number> = {
  beginner: 30,
  intermediate: 38,
  experienced: 45,
};

export function estimationZones(level: ExperienceLevel): PaceZones {
  return paceZonesFromVdot(ASSUMED_VDOT[level]);
}

/** Midpoint of a pace range (s/km). */
export const midPace = (r: PaceRange): number => (r.fastSPerKm + r.slowSPerKm) / 2;

/** Race pace range: ±1% around the target race pace. */
export function racePaceRange(racePaceSPerKm: number): PaceRange {
  return {
    fastSPerKm: round(racePaceSPerKm * 0.99),
    slowSPerKm: round(racePaceSPerKm * 1.01),
  };
}
