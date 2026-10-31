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
  /** Planned runs per week (see `longRunShareCap`). */
  runsPerWeek: number;
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
 * §7.6: long run ≤ 33% of weekly volume (≤ 40% under 30 km/week), or an even
 * split of the week's `runs` if that is larger. The long run is also the
 * longest run, so with n runs it can never be below 1/n of the volume: 2 runs
 * → 50%, 3 runs → 33.3% (see docs/decisions.md).
 */
export function longRunShareCap(volM: number, runs = Infinity): number {
  const t = CONFIG.smallVolumeThresholdM;
  const evenSplit = volM / runs;
  if (volM >= t) return Math.max(volM * CONFIG.longRunShare.normal, evenSplit);
  // Builder smoothing (stricter than §7.6): just below 30 km the cap is also
  // limited to 33% of 30 km, so the long run never shrinks when weekly volume
  // crosses the threshold.
  return Math.max(
    Math.min(
      volM * CONFIG.longRunShare.smallVolume,
      Math.max(volM * CONFIG.longRunShare.normal, t * CONFIG.longRunShare.normal),
    ),
    evenSplit,
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
  /** Next week returns to the last full level (after a cutback, or §13 hold/restart). */
  private hold = false;
  private cutbackForced = false;
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
      Math.max(0, Math.min(long, longRunShareCap(vol, this.p.runsPerWeek), this.p.longRunCapM)),
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
    const isCutback =
      this.week > 0 && (this.cutbackForced || this.sinceReduction >= p.cutbackEvery - 1);
    let vol: number;
    let long: number;
    if (this.week === 0) {
      vol = Math.min(this.start, cap);
      long = this.capLong(p.startLongRunM, vol);
    } else if (isCutback) {
      vol = Math.round((this.lastFull * (1 - CONFIG.cutbackReduction)) / 100) * 100;
      long = this.capLong(this.lastFullLong * (1 - CONFIG.cutbackReduction), vol);
    } else if (this.hold) {
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
    this.hold = target.isCutback;
    this.cutbackForced = false;
    this.week++;
  }

  /**
   * §13.3: a week with too many missed runs doesn't count as a step up. The
   * reference stays the last fully done week and the next week holds there.
   */
  recordPartial(): void {
    this.sinceReduction++;
    this.hold = true;
    this.cutbackForced = false;
    this.week++;
  }

  /** §13.4: restart after a break at a given level (absolute, not compounding). */
  restart(volumeM: number, longRunM: number): void {
    this.lastFull = roundDown(volumeM);
    this.lastFullLong = roundDown(longRunM);
    this.hold = true;
  }

  /** §13.5: no increase in the next week (it stays at the last full level). */
  holdLevel(): void {
    this.hold = true;
  }

  /** §13.3: the next pre-taper week is a cutback; later ones follow the cadence from it. */
  forceCutback(): void {
    this.cutbackForced = true;
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
