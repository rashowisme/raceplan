/**
 * Engine ⇄ UI contract.
 *
 * Internal units (always): distances in meters, durations in seconds,
 * paces in seconds per kilometer. Dates are ISO calendar dates `YYYY-MM-DD`
 * (no time, no timezone). No user-facing strings: the engine returns
 * translation keys + params (`Message`), the UI translates them.
 */

/** Bump on any breaking change to `TrainingPlan` / `RunnerProfile`. */
export const SCHEMA_VERSION = 1 as const;

/** ISO calendar date, `YYYY-MM-DD`. */
export type IsoDate = string;

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export const RACE_TYPES = ["5k", "10k", "half", "marathon", "custom", "trail"] as const;
export type RaceType = (typeof RACE_TYPES)[number];

/** Weekdays, Monday first (weeks start on Monday). */
export const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const YEARS_RUNNING = ["lt1", "1to3", "3plus"] as const;
export type YearsRunning = (typeof YEARS_RUNNING)[number];

export const INJURY_TYPES = [
  "shinSplints",
  "plantarFasciitis",
  "achillesCalf",
  "runnersKnee",
  "itBand",
  "stressFracture",
  "hamstring",
  "ankleSprain",
  "other",
] as const;
export type InjuryType = (typeof INJURY_TYPES)[number];

export const INJURY_FREQUENCIES = ["once", "occasionally", "often"] as const;
export type InjuryFrequency = (typeof INJURY_FREQUENCIES)[number];

export const SEXES = ["female", "male", "other"] as const;
export type Sex = (typeof SEXES)[number];

export const PLAN_STYLES = ["balanced", "vdot", "polarized"] as const;
export type PlanStyle = (typeof PLAN_STYLES)[number];

/** Tags used for workout preferences (likes / dislikes). */
export const PREFERENCE_TAGS = [
  "shortIntervals",
  "longIntervals",
  "hills",
  "track",
  "tempo",
] as const;
export type PreferenceTag = (typeof PREFERENCE_TAGS)[number];

export interface InjuryEntry {
  type: InjuryType;
  frequency: InjuryFrequency;
}

/** Result of the plan's optional time trial, entered after running it. */
export interface TimeTrialResult {
  distanceM: number;
  timeS: number;
  date: IsoDate;
}

export interface RaceInfo {
  type: RaceType;
  /** Required for `custom` and `trail`; derived from type otherwise. */
  distanceM?: number;
  /** Elevation gain (D+), required for `trail`. */
  elevationGainM?: number;
  date: IsoDate;
}

export interface RunnerProfile {
  race: RaceInfo;
  /** Default: next Monday (or `today` if Monday). */
  planStartDate?: IsoDate;
  /** PR for the race distance. */
  personalRecord?: { timeS: number; achievedOn?: IsoDate };
  /** Smartwatch race prediction for the race distance. */
  watchPrediction?: { timeS: number };
  /** Time trial result (any distance), see `applyTimeTrialResult`. */
  timeTrialResult?: TimeTrialResult;
  targetTimeS?: number;
  /** Average over the last 4 weeks. 0 allowed. */
  currentWeeklyVolumeM: number;
  longestRecentRunM?: number;
  /** Hard ceiling the plan must never exceed. */
  maxWeeklyVolumeM: number;
  availableDays: Weekday[];
  longRunDay: Weekday;
  yearsRunning: YearsRunning;
  injuries: InjuryEntry[];
  currentlyInjured: boolean;
  age: number;
  /** Stored for future use; must not change plan structure in v1. */
  sex?: Sex;
  planStyle: PlanStyle;
  preferences: { likes: PreferenceTag[]; dislikes: PreferenceTag[] };
}

export interface GenerateOptions {
  /** "Today" in the runner's calendar. The engine never reads the clock. */
  today: IsoDate;
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

export type ExperienceLevel = "beginner" | "intermediate" | "experienced";

export type RiskFlag = "injuryOften" | "multipleInjuries" | "stressFractureHistory" | "age50plus";

export type FitnessSource = "personalRecord" | "watchPrediction" | "timeTrial";

export interface FitnessEstimate {
  vdot: number;
  /** Conservative predicted race time for the race distance. */
  predictedRaceTimeS: number;
  source: FitnessSource;
  lowConfidence: boolean;
}

/** Daniels-style training zones. */
export const PACE_ZONES = ["E", "M", "T", "I", "R"] as const;
export type PaceZone = (typeof PACE_ZONES)[number];

/** Pace range in s/km: `fast` < `slow`. */
export interface PaceRange {
  fastSPerKm: number;
  slowSPerKm: number;
}

export type PaceZones = Record<PaceZone, PaceRange>;

/** Effort levels — always shown next to (or instead of) a pace. */
export const EFFORTS = [
  "recovery",
  "easy",
  "steady",
  "marathon",
  "threshold",
  "interval",
  "repetition",
  "race",
  "powerHike",
] as const;
export type Effort = (typeof EFFORTS)[number];

export type Phase = "maintenance" | "base" | "build" | "specific" | "taper";

// ---------------------------------------------------------------------------
// Workouts (structured — never free text)
// ---------------------------------------------------------------------------

/** A translation key with parameters. The UI renders it. */
export interface Message {
  key: string;
  params?: Record<string, string | number>;
}

export type StepDuration = { type: "distance"; meters: number } | { type: "time"; seconds: number };

export interface StepTarget {
  /** Zone the step targets, or race pace. */
  zone: PaceZone | "racePace";
  effort: Effort;
  /** Absent when no performance data is available (effort-only plans). */
  pace?: PaceRange;
}

export type Terrain = "flat" | "uphill" | "downhill" | "rolling";

export interface SimpleStep {
  kind: "warmup" | "work" | "recovery" | "cooldown" | "run";
  duration: StepDuration;
  target: StepTarget;
  terrain?: Terrain;
}

export interface RepeatStep {
  kind: "repeat";
  count: number;
  steps: SimpleStep[];
}

export type WorkoutStep = SimpleStep | RepeatStep;

export const WORKOUT_TYPES = [
  "easy",
  "recovery",
  "long",
  "longProgressive",
  "longRacePace",
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
  "race",
] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export type Intensity = "easy" | "moderate" | "hard";

export interface Workout {
  type: WorkoutType;
  /** Preference tags + descriptive tags. */
  tags: PreferenceTag[];
  intensity: Intensity;
  /** Counts as a hard day (quality session or long run with fast segments). */
  isHard: boolean;
  /** True for long-run variants. */
  isLongRun: boolean;
  title: Message;
  steps: WorkoutStep[];
  /** Rounded estimates computed from steps. */
  estDistanceM: number;
  estDurationS: number;
  /** Seconds of the workout at easy effort (for intensity distribution). */
  easyDurationS: number;
  /** Trail only: target elevation gain for this session. */
  elevationGainM?: number;
  /** Strides appended after the run. */
  strides?: { count: number; seconds: number };
  /** Extra coaching notes (translation keys). */
  notes: Message[];
  optional?: boolean;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export interface PlanDay {
  date: IsoDate;
  weekday: Weekday;
  /** `null` = rest day. */
  workout: Workout | null;
  /** Optional cross-training suggestion on an easy day (risk-flagged runners). */
  crossTrainingSuggested?: boolean;
}

export interface PlanWeek {
  /** 0-based. */
  index: number;
  /** Monday of the week. */
  startDate: IsoDate;
  phase: Phase;
  isCutback: boolean;
  isRaceWeek: boolean;
  /** Target volume from the progression. */
  targetVolumeM: number;
  /** Sum of workout distances actually scheduled. */
  plannedVolumeM: number;
  plannedDurationS: number;
  longRunM: number;
  /** Trail only. */
  elevationGainM?: number;
  /** Days of the week, Monday → Sunday. Days outside the plan are omitted. */
  days: PlanDay[];
  /** §13: why this week was adapted to the training log (translation keys). */
  adaptations?: Message[];
  /**
   * §13.5: the week as planned before check-ins (pain, sickness, injury)
   * changed some of its days. Set only on weeks changed that way.
   */
  adjustedFrom?: { volumeM: number; hardS: number };
}

export const WARNING_CODES = [
  "plan_too_short",
  "goal_ambitious",
  "low_max_volume",
  "few_days_available",
  "no_performance_data",
  "old_pr",
  "preference_unmet",
  "minor_runner",
  "risk_flagged",
  "race_ready_mini_plan",
  "max_below_current",
  "long_base_block",
  "long_break",
  "goal_reassess",
] as const;
export type WarningCode = (typeof WARNING_CODES)[number];

export interface PlanWarning {
  code: WarningCode;
  params?: Record<string, string | number>;
}

export const REFUSAL_CODES = [
  "currently_injured",
  "race_in_past",
  "distance_not_supported",
  "invalid_input",
] as const;
export type RefusalCode = (typeof REFUSAL_CODES)[number];

export interface Refusal {
  code: RefusalCode;
  /** For `invalid_input`: field paths + issue codes. */
  issues?: { path: string; code: string }[];
}

export interface PlanSummary {
  level: ExperienceLevel;
  riskFlags: RiskFlag[];
  raceDistanceM: number;
  /** Distance km + D+/100, in meters-equivalent (= distance for road). */
  effortDistanceM: number;
  fitness: FitnessEstimate | null;
  paceZones: PaceZones | null;
  /** Race pace used for race-pace work (target pace if realistic). */
  racePaceSPerKm: number | null;
  peakVolumeM: number;
  taperDays: number;
  totalWeeks: number;
  runningDaysPerWeek: number;
}

export interface TrainingPlan {
  schemaVersion: typeof SCHEMA_VERSION;
  generatedOn: IsoDate;
  profile: RunnerProfile;
  summary: PlanSummary;
  startDate: IsoDate;
  raceDate: IsoDate;
  weeks: PlanWeek[];
  warnings: PlanWarning[];
  /** Plan-level coaching advice (injury notes, effort-only explanation…). */
  adviceNotes: Message[];
  /** Always shown — key of the disclaimer text. */
  disclaimer: Message;
  /** §13: what the runner logged (stored with the plan; see `adaptPlan`). */
  log?: TrainingLog;
  /**
   * Weeks kept from an earlier version of the plan (time trial result): they
   * already contain any adaptation and are never rebuilt.
   */
  frozenWeeks?: number;
}

// ---------------------------------------------------------------------------
// Training log (§13)
// ---------------------------------------------------------------------------

/** `hard` = done, but it felt hard. Unmarked past workouts count as done. */
export const WORKOUT_STATUSES = ["done", "missed", "hard"] as const;
export type WorkoutStatus = (typeof WORKOUT_STATUSES)[number];

/**
 * §13.1 check-ins, any day: `tired` (tired or sore), `pain` (pain / niggle),
 * `sick`, `injured` (can't run), and `back` to end a sick or injured pause.
 */
export const CHECK_IN_KINDS = ["tired", "pain", "sick", "injured", "back"] as const;
export type CheckInKind = (typeof CHECK_IN_KINDS)[number];

export interface CheckIn {
  date: IsoDate;
  kind: CheckInKind;
}

export interface TrainingLog {
  /** One entry per workout date. */
  workouts: Partial<Record<IsoDate, WorkoutStatus>>;
  /** In date order. */
  checkIns?: CheckIn[];
}

export type GeneratePlanResult = { ok: true; plan: TrainingPlan } | { ok: false; refusal: Refusal };
