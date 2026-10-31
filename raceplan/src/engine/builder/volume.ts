/**
 * Spec §7: weekly volume and long-run progression, computed week by week
 * from what was actually *planned* the week before.
 *
 * Week-over-week increases are measured against the last full (non-cutback)
 * week. The week after a cutback returns to the pre-cutback level and never
 * goes above it (see docs/decisions.md).
 */
import { CONFIG } from "../config";

export interface ProgressionParams {
  currentVolumeM: number;
  maxVolumeM: number;
  peakVolumeM: number;
  /** Volume cap during the maintenance block. */
  maintenanceCapM: number;
  ramp: number;
  smallAllowanceM: number;
  cutbackEvery: number;
  /** Starting long run (before caps). */
  startLongRunM: number;
  /** Absolute long-run cap (race cap ∧ 3 h cap). */
  longRunCapM: number;
  /** Runner has only 2 available days (see `longRunShareCap`). */
  twoDayRunner: boolean;
}

export interface WeekTarget {
  targetVolumeM: number;
  longRunM: number;
  isCutback: boolean;
}

const roundDown = (m: number) => Math.floor(m / 100) * 100;

/**
 * Max allowed increase over a reference week's volume (§7.2): the ramp %,
 * or up to +3 km under 30 km/week.
 */
export function allowedIncrease(volM: number, ramp: number, smallAllowanceM: number): number {
  const pct = volM * ramp;
  return volM < CONFIG.smallVolumeThresholdM ? Math.max(pct, smallAllowanceM) : pct;
}

/**
 * The builder's (stricter) increase: the small-volume allowance is limited
 * to +50% of a tiny week (3 → 4.5 km, not 6 km).
 */
export function builderIncrease(volM: number, ramp: number, smallAllowanceM: number): number {
  const pct = volM * ramp;
  if (volM >= CONFIG.smallVolumeThresholdM) return pct;
  return Math.max(pct, Math.min(smallAllowanceM, volM * CONFIG.smallVolumeMaxGrowth));
}

/**
 * §7.6: long run ≤ 30% of weekly volume (≤ 40% under 30 km/week).
 * With only 2 runs in a week (2 available days, or a partial first week) the
 * rule cannot be met by a long run that is also the longest run, so the
 * runs are capped at an even 50% split — the least concentrated split
 * possible (see docs/decisions.md).
 */
export function longRunShareCap(volM: number, fewRuns = false): number {
  const t = CONFIG.smallVolumeThresholdM;
  if (fewRuns) {
    const share = volM < t ? CONFIG.longRunShare.smallVolume : CONFIG.longRunShare.normal;
    return volM * Math.max(share, 0.5);
  }
  if (volM >= t) return volM * CONFIG.longRunShare.normal;
  // Builder smoothing (stricter than §7.6): just below 30 km the cap is also
  // limited to 30% of 30 km, so the long run never shrinks when weekly volume
  // crosses the threshold.
  return Math.min(
    volM * CONFIG.longRunShare.smallVolume,
    Math.max(volM * CONFIG.longRunShare.normal, t * CONFIG.longRunShare.normal),
  );
}

/** Starting volume: current volume (capped by max); allowance when starting from 0. */
export function startVolume(
  currentVolumeM: number,
  maxVolumeM: number,
  smallAllowanceM: number,
): number {
  const base = currentVolumeM > 0 ? currentVolumeM : smallAllowanceM;
  return roundDown(Math.min(base, maxVolumeM));
}

export class Progression {
  private readonly start: number;
  private lastFull: number;
  private lastFullLong: number;
  private sinceReduction = 0;
  private prevCutback = false;
  private week = 0;

  constructor(private readonly p: ProgressionParams) {
    this.start = startVolume(p.currentVolumeM, p.maxVolumeM, p.smallAllowanceM);
    this.lastFull = this.start;
    this.lastFullLong = 0;
  }

  get startVolumeM(): number {
    return this.start;
  }

  /** Last full (non-cutback) week's planned volume and long run. */
  get reference(): { volumeM: number; longRunM: number } {
    return { volumeM: this.lastFull, longRunM: this.lastFullLong };
  }

  private capLong(long: number, vol: number): number {
    return roundDown(
      Math.max(0, Math.min(long, longRunShareCap(vol, this.p.twoDayRunner), this.p.longRunCapM)),
    );
  }

  /** Target for the next pre-taper week. */
  next(maintenance: boolean): WeekTarget {
    const p = this.p;
    const cap = Math.min(
      p.maxVolumeM,
      maintenance
        ? Math.max(Math.min(this.start, p.peakVolumeM), p.maintenanceCapM)
        : p.peakVolumeM,
    );
    const isCutback = this.week > 0 && this.sinceReduction >= p.cutbackEvery - 1;
    let vol: number;
    let long: number;
    if (this.week === 0) {
      vol = Math.min(this.start, cap);
      long = this.capLong(p.startLongRunM, vol);
    } else if (isCutback) {
      vol = Math.round((this.lastFull * (1 - CONFIG.cutbackReduction)) / 100) * 100;
      long = this.capLong(this.lastFullLong * (1 - CONFIG.cutbackReduction), vol);
    } else if (this.prevCutback) {
      vol = Math.min(this.lastFull, cap);
      long = this.capLong(this.lastFullLong, vol);
    } else {
      vol = roundDown(
        Math.min(cap, this.lastFull + builderIncrease(this.lastFull, p.ramp, p.smallAllowanceM)),
      );
      long = this.capLong(this.lastFullLong + CONFIG.longRunMaxIncreaseM, vol);
    }
    return { targetVolumeM: vol, longRunM: long, isCutback };
  }

  /**
   * Record what was actually planned. For partial weeks pass the target
   * (the runner keeps their normal volume before the plan starts).
   */
  record(target: WeekTarget, plannedVolumeM: number, plannedLongM: number): void {
    if (target.isCutback) {
      this.sinceReduction = 0;
    } else {
      this.lastFull = plannedVolumeM;
      this.lastFullLong = plannedLongM;
      this.sinceReduction++;
    }
    this.prevCutback = target.isCutback;
    this.week++;
  }

  /**
   * Taper week `t` (0-based, excluding race week): −25% from the last full
   * week, then −25% from the previous taper week as actually planned.
   */
  taper(t: number, prevPlannedM: number): WeekTarget {
    const ref = t === 0 ? this.lastFull : Math.min(prevPlannedM, this.lastFull);
    const vol = roundDown(ref * CONFIG.taperWeekFactor);
    const long = this.capLong(this.lastFullLong * (t === 0 ? 0.7 : 0.55), vol);
    return { targetVolumeM: vol, longRunM: long, isCutback: false };
  }
}
