/**
 * All tunable coaching numbers (docs/training-spec.md). Logic must read
 * values from here rather than hard-coding them.
 */
import type { ExperienceLevel, RaceType } from "./types";

type StandardRace = "5k" | "10k" | "half" | "marathon";
type PerLevel = Record<ExperienceLevel, number>;

const KM = 1000;

export const CONFIG = {
  standardDistancesM: {
    "5k": 5 * KM,
    "10k": 10 * KM,
    half: 21_097.5,
    marathon: 42_195,
  } satisfies Record<StandardRace, number>,

  /** §10: road > 42.2 km or effort-km > 60 → refusal. */
  maxRoadDistanceM: 42_200,
  maxEffortDistanceM: 60 * KM,
  /** effort-km = km + D+ / 100 */
  elevationMPerEffortKm: 100,
  /** Steep trail (> 50 m D+/km) → power hiking. */
  steepTrailMPerKm: 50,

  inputLimits: {
    minAge: 16,
    maxAge: 90,
    maxWeeklyVolumeM: 250 * KM,
    minMaxWeeklyVolumeM: 5 * KM,
    minCustomDistanceM: 1 * KM,
    maxTrailDistanceM: 60 * KM,
    maxElevationGainM: 6000,
    /** Plausible pace window for times entered (s/km). */
    fastestPaceSPerKm: 150,
    slowestPaceSPerKm: 15 * 60,
  },

  // §2 experience level
  level: {
    beginnerMaxVolumeM: 15 * KM,
    experiencedMinVolumeM: 40 * KM,
  },
  riskAge: 50,
  seniorAge: 65,
  minorAge: 18,

  // §3 fitness
  fitness: {
    prFullWeightMonths: 12,
    prOldMonths: 24,
    prSlowdownMid: 0.03,
    prSlowdownOld: 0.06,
    watchPenalty: 0.03,
    riegelExponent: 1.06,
    /** Goal ambition thresholds (fitness gain). */
    ambitiousGainLong: 0.05,
    ambitiousGainShort: 0.02,
    longPlanWeeks: 12,
    timeTrialDistanceM: 3 * KM,
    timeTrialWeek: 1, // 0-based index → week 2
  },

  // §5 plan length
  minWeeks: { "5k": 6, "10k": 8, half: 10, marathon: 12 } satisfies Record<StandardRace, number>,
  marathonBeginnerMinWeeks: 16,
  idealWeeks: { "5k": 9, "10k": 11, half: 14, marathon: 18 } satisfies Record<StandardRace, number>,
  maxStructuredWeeks: 24,
  miniPlanMaxWeeks: 2, // n < 3
  phaseShares: { base: 0.35, build: 0.35, specific: 0.3 },

  // §6 weekly structure
  maxRunningDays: { beginner: 4, intermediate: 5, experienced: 6 } satisfies PerLevel,
  qualitySessions: { beginner: 1, intermediate: 2, experienced: 2 } satisfies PerLevel,
  beginnerStridesOnlyWeeks: 2,
  riskFlaggedSingleQualityWeeks: 4,
  minEasyShare: 0.78,
  minEasySharePolarized: 0.8,
  /** Hard floor checked on every week (spec: ≥ 75–80%). */
  minEasyShareFloor: 0.75,

  // §7 safety
  ramp: { normal: 0.1, conservative: 0.07 },
  smallVolumeThresholdM: 30 * KM,
  smallVolumeAllowanceM: 3 * KM,
  /** Builder-only (stricter than spec): tiny weeks grow by at most +50%. */
  smallVolumeMaxGrowth: 0.5,
  cutbackEvery: { normal: 4, conservative: 3 },
  /** Cutback reduces volume by 20–25%; we use 22%. */
  cutbackReduction: 0.22,
  cutbackReductionRange: [0.2, 0.25] as const,
  longRunShare: { normal: 0.33, smallVolume: 0.4 },
  longRunMaxIncreaseM: 2 * KM,
  longRunMaxIncreaseS: 15 * 60,
  longRunCapM: { "5k": 14 * KM, "10k": 16 * KM, half: 21 * KM, marathon: 32 * KM } satisfies Record<
    StandardRace,
    number
  >,
  longRunMaxDurationS: 3 * 3600,
  minRunM: 1 * KM,
  /** Strides only on runs at least this long. */
  minStridesRunM: 2500,
  /** Recovery runs get this share of a normal easy run. */
  recoveryRunWeight: 0.7,
  /** Long runs with fast segments need a long enough run. */
  minProgressiveLongRunM: 10 * KM,
  minRacePaceLongRunM: 12 * KM,
  /** Smallest per-type work cap (s) so low-volume runners still get a session. */
  minQualityWorkS: 6 * 60,

  peakVolumeM: {
    "5k": { beginner: 25 * KM, intermediate: 35 * KM, experienced: 50 * KM },
    "10k": { beginner: 30 * KM, intermediate: 45 * KM, experienced: 60 * KM },
    half: { beginner: 35 * KM, intermediate: 50 * KM, experienced: 70 * KM },
    marathon: { beginner: 45 * KM, intermediate: 65 * KM, experienced: 90 * KM },
  } satisfies Record<StandardRace, PerLevel>,
  /** `low_max_volume` if user max < this share of the beginner target. */
  lowMaxVolumeShare: 0.67,

  // §11 taper (days)
  taperDays: {
    "5k": { beginner: 7, intermediate: 7, experienced: 7 },
    "10k": { beginner: 7, intermediate: 10, experienced: 10 },
    half: { beginner: 10, intermediate: 14, experienced: 14 },
    marathon: { beginner: 14, intermediate: 14, experienced: 21 },
  } satisfies Record<StandardRace, PerLevel>,
  /** Volume factor of each taper week relative to the previous week (−20…−30%). */
  taperWeekFactor: 0.75,
  taperReductionRange: [0.2, 0.3] as const,
  raceWeekEasyRuns: { min: 2, max: 3 },

  fewDaysThreshold: 3,

  // §13 adaptation to the training log
  adaptation: {
    /** Missed share of a week at or above which the next week holds. */
    holdMissedShare: 0.2,
    /** Above this missed share, the week counts as a break of ≥ 7 days. */
    breakMissedShare: 0.5,
    /** Breaks (days without running) → restart level and easy-only weeks. */
    breaks: [
      { maxDays: 7, restartFactor: 1, easyOnlyWeeks: 0, easyFirstRuns: 2, paceFactor: 1 },
      { maxDays: 14, restartFactor: 0.75, easyOnlyWeeks: 1, easyFirstRuns: 0, paceFactor: 1 },
      { maxDays: 28, restartFactor: 0.5, easyOnlyWeeks: 2, easyFirstRuns: 0, paceFactor: 1.03 },
    ],
    /** Longer breaks: the runner should get a new plan (13.4). */
    newPlanAfterDays: 28,
  },
} as const;

export type StandardRaceType = StandardRace;

export const isStandardRace = (t: RaceType): t is StandardRace =>
  t === "5k" || t === "10k" || t === "half" || t === "marathon";
