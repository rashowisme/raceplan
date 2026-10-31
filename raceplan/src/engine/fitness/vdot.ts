/**
 * Jack Daniels' VDOT formulas (Daniels & Gilbert).
 * Velocity in m/min, time in minutes.
 */
import { CONFIG } from "../config";

export const MIN_VDOT = 20;
export const MAX_VDOT = 85;

/** Oxygen cost (ml/kg/min) of running at velocity `v` m/min. */
export function oxygenCost(v: number): number {
  return -4.6 + 0.182258 * v + 0.000104 * v * v;
}

/** Fraction of VO2max sustainable for `tMin` minutes. */
export function sustainableFraction(tMin: number): number {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * tMin) + 0.2989558 * Math.exp(-0.1932605 * tMin);
}

/** VDOT from a race performance (not clamped). */
export function vdotFromPerformance(distanceM: number, timeS: number): number {
  const tMin = timeS / 60;
  const v = distanceM / tMin;
  return oxygenCost(v) / sustainableFraction(tMin);
}

export function clampVdot(vdot: number): number {
  return Math.min(MAX_VDOT, Math.max(MIN_VDOT, vdot));
}

/** Velocity (m/min) whose oxygen cost equals `vo2`. */
export function velocityForVo2(vo2: number): number {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - vo2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

/** Pace (s/km) when running at `fraction` of VDOT. */
export function paceAtFraction(vdot: number, fraction: number): number {
  return 60_000 / velocityForVo2(vdot * fraction);
}

/** Predicted race time (s) for a distance at a given VDOT (bisection). */
export function predictTimeS(vdot: number, distanceM: number): number {
  let lo = 60; // seconds
  let hi = 24 * 3600;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    // Higher time → lower VDOT; find the time whose VDOT equals the target.
    if (vdotFromPerformance(distanceM, mid) > vdot) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Riegel conversion: T2 = T1 × (D2 / D1)^1.06. */
export function riegel(timeS: number, fromM: number, toM: number): number {
  return timeS * Math.pow(toM / fromM, CONFIG.fitness.riegelExponent);
}
