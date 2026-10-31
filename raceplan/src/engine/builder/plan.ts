/**
 * Assembles the full training plan week by week.
 */
import { CONFIG, isStandardRace, type StandardRaceType } from "../config";
import { addDays, diffDays, weekdayOf } from "../dates";
import { estimateFitness } from "../fitness/estimate";
import { getMethod, type TrainingMethod } from "../methods";
import { estimationZones, paceZonesFromVdot } from "../paces/zones";
import {
  effortDistanceM,
  experienceLevel,
  hasInjury,
  interpolateByDistance,
  nearestStandardRace,
  raceDistanceM,
  riskFlags,
} from "../profile";
import {
  SCHEMA_VERSION,
  type ExperienceLevel,
  type FitnessEstimate,
  type IsoDate,
  type Message,
  type PaceRange,
  type PaceZones,
  type PlanDay,
  type PlanWarning,
  type PlanWeek,
  type RiskFlag,
  type RunnerProfile,
  type TrainingPlan,
  type Weekday,
  type Workout,
} from "../types";
import {
  buildQuality,
  easyRun,
  fartlek,
  longRun,
  raceDay,
  stridesBlock,
  timeTrial,
  type LongRunVariant,
  type QualityOptions,
  type QualityType,
  type SessionSizing,
  type StridesSpec,
  type TrailLongOptions,
  withExtraEasy,
} from "../workouts/library";
import { selectSession, SESSION_TAGS, type SelectionRules } from "../workouts/selection";
import { estimateSteps, type PaceContext } from "../workouts/steps";
import { chooseLayout } from "./days";
import { buildFrame, weekDates, type PlanFrame } from "./frame";
import { longRunShareCap, Progression, type WeekTarget } from "./volume";

const KM = 1000;
const SPEED_TYPES: QualityType[] = ["shortIntervals", "longIntervals", "racePace"];
const HILL_TYPES: QualityType[] = ["hillSprints", "hillRepeats"];
/** Max share of weekly volume for the work part of each session type (Daniels-style caps). */
const WORK_SHARE: Record<QualityType, number> = {
  tempo: 0.1,
  cruiseIntervals: 0.1,
  longIntervals: 0.08,
  shortIntervals: 0.05,
  hillSprints: 0.05,
  hillRepeats: 0.06,
  fartlek: 0.08,
  racePace: 0.12,
  downhillPractice: 0.06,
};

/** Share of the race's D+/km ratio targeted by long runs, per phase. */
const TRAIL_GAIN_FACTOR: Record<PlanWeek["phase"], number> = {
  maintenance: 0.3,
  base: 0.45,
  build: 0.7,
  specific: 1,
  taper: 0.5,
};

/** Everything derived once from the profile. */
export interface PlanContext {
  profile: RunnerProfile;
  today: IsoDate;
  level: ExperienceLevel;
  flags: RiskFlag[];
  riskFlagged: boolean;
  conservative: boolean;
  frame: PlanFrame;
  method: TrainingMethod;
  pace: PaceContext;
  fitness: FitnessEstimate | null;
  race: StandardRaceType;
  raceDistanceM: number;
  effortDistanceM: number;
  runningDays: number;
  minRestDays: number;
  peakVolumeM: number;
  cutbackEvery: number;
  warnings: PlanWarning[];
  rules: Omit<SelectionRules, "forbidden">;
  qualityOptions: QualityOptions;
  /** Trail race: D+ per km of race and steepness. */
  trail: { gainPerKm: number; raceGainM: number; steep: boolean } | null;
}

export function makeContext(
  profile: RunnerProfile,
  today: IsoDate,
  startDate: IsoDate,
): PlanContext {
  const level = experienceLevel(profile);
  const flags = riskFlags(profile);
  const riskFlagged = flags.length > 0;
  const distM = raceDistanceM(profile);
  const effortM = effortDistanceM(profile);
  const frame = buildFrame(startDate, profile.race.date, profile.race.type, effortM, level);
  const warnings: PlanWarning[] = [];

  // Fitness uses the effort distance for trail (flat-equivalent).
  const fit = estimateFitness(profile, effortM, today, frame.totalWeeks);
  warnings.push(...fit.warnings);
  const zones = fit.fitness ? paceZonesFromVdot(fit.fitness.vdot) : null;
  const estZones = zones ?? estimationZones(level);
  const race = isStandardRace(profile.race.type) ? profile.race.type : nearestStandardRace(effortM);
  const estRace = fit.racePaceSPerKm ?? (estZones.T.fastSPerKm + estZones.I.slowSPerKm) / 2;
  // Trail: no flat race pace — race day is run by effort; its duration is
  // estimated from the predicted time over the actual distance.
  const isTrail = profile.race.type === "trail";
  const trailRacePace = fit.fitness ? fit.fitness.predictedRaceTimeS / (distM / 1000) : null;
  const pace: PaceContext = {
    zones,
    estZones,
    racePaceSPerKm: isTrail ? null : fit.racePaceSPerKm,
    estRacePaceSPerKm: isTrail
      ? (trailRacePace ?? estZones.E.slowSPerKm * 1.4)
      : race === "marathon"
        ? estZones.M.slowSPerKm
        : estRace,
  };

  const minRestDays = level === "beginner" || riskFlagged ? 2 : 1;
  const runningDays = Math.min(
    profile.availableDays.length,
    CONFIG.maxRunningDays[level],
    7 - minRestDays,
  );

  const peakLevel: ExperienceLevel =
    profile.age < CONFIG.minorAge && level === "experienced" ? "intermediate" : level;
  const peakTarget = interpolateByDistance(effortM, (r) => CONFIG.peakVolumeM[r][peakLevel]);
  const peakVolumeM = Math.floor(Math.min(profile.maxWeeklyVolumeM, peakTarget) / 100) * 100;

  const conservative = level === "beginner" || riskFlagged;
  const trail =
    profile.race.type === "trail"
      ? (() => {
          const raceGainM = profile.race.elevationGainM ?? 0;
          const gainPerKm = raceGainM / (distM / 1000);
          return { gainPerKm, raceGainM, steep: gainPerKm > CONFIG.steepTrailMPerKm };
        })()
      : null;
  const cutbackEvery =
    riskFlagged || profile.age >= CONFIG.riskAge
      ? CONFIG.cutbackEvery.conservative
      : CONFIG.cutbackEvery.normal;

  return {
    profile,
    today,
    level,
    flags,
    riskFlagged,
    conservative,
    frame,
    method: getMethod(profile.planStyle),
    pace,
    fitness: fit.fitness,
    race,
    raceDistanceM: distM,
    effortDistanceM: effortM,
    runningDays,
    minRestDays,
    peakVolumeM,
    cutbackEvery,
    warnings,
    rules: { likes: profile.preferences.likes, dislikes: profile.preferences.dislikes },
    qualityOptions: {
      onTrack: !profile.preferences.dislikes.includes("track"),
      avoidRPace: riskFlagged,
      race,
      trail: trail !== null,
      steepTrail: trail?.steep ?? false,
    },
    trail,
  };
}

function profileWarnings(c: PlanContext): void {
  const { profile, frame } = c;
  const w = c.warnings;
  if (frame.mini) w.push({ code: "race_ready_mini_plan", params: { weeks: frame.totalWeeks } });
  if (frame.tooShort) {
    w.push({
      code: "plan_too_short",
      params: { weeks: frame.totalWeeks, minWeeks: frame.minWeeks },
    });
  }
  if (frame.maintenanceWeeks > 0) {
    w.push({ code: "long_base_block", params: { weeks: frame.maintenanceWeeks } });
  }
  const beginnerTarget = interpolateByDistance(
    c.effortDistanceM,
    (r) => CONFIG.peakVolumeM[r].beginner,
  );
  if (profile.maxWeeklyVolumeM < beginnerTarget * CONFIG.lowMaxVolumeShare) {
    w.push({
      code: "low_max_volume",
      params: {
        maxM: profile.maxWeeklyVolumeM,
        suggestedM: Math.round(beginnerTarget / KM) * KM,
      },
    });
  }
  if (profile.maxWeeklyVolumeM < profile.currentWeeklyVolumeM)
    w.push({ code: "max_below_current" });
  if (
    profile.availableDays.length < CONFIG.fewDaysThreshold &&
    c.effortDistanceM >= CONFIG.standardDistancesM.half - 100
  ) {
    w.push({ code: "few_days_available", params: { days: profile.availableDays.length } });
  }
  if (profile.age < CONFIG.minorAge) w.push({ code: "minor_runner" });
  if (c.riskFlagged) w.push({ code: "risk_flagged", params: { flags: c.flags.join(",") } });
}

function adviceNotes(c: PlanContext): Message[] {
  const p = c.profile;
  const notes: Message[] = [];
  if (hasInjury(p, "shinSplints") || hasInjury(p, "stressFracture"))
    notes.push({ key: "advice.softSurfaces" });
  if (hasInjury(p, "runnersKnee") || hasInjury(p, "itBand")) notes.push({ key: "advice.cadence" });
  if (hasInjury(p, "achillesCalf")) notes.push({ key: "advice.achilles" });
  if (hasInjury(p, "plantarFasciitis")) notes.push({ key: "advice.plantar" });
  if (c.riskFlagged) notes.push({ key: "advice.crossTraining" });
  if (p.age >= CONFIG.riskAge) notes.push({ key: "advice.recovery50" });
  if (p.age < CONFIG.minorAge) notes.push({ key: "advice.minor" });
  if (c.pace.zones === null) notes.push({ key: "advice.effortOnly" });
  return notes;
}

// ---------------------------------------------------------------------------
// Week building
// ---------------------------------------------------------------------------

interface WeekState {
  /** Quality types used so far (for "no new intensity" in cutback weeks). */
  usedTypes: Set<QualityType>;
  /** Dates (ISO) that must not hold a hard session. */
  blockedDates: Set<IsoDate>;
  timeTrialDone: boolean;
}

function qualityCount(c: PlanContext, w: number, target: WeekTarget): number {
  const phase = c.frame.phases[w]!;
  let q: number = CONFIG.qualitySessions[c.level];
  if (phase === "maintenance") q = 0;
  if (c.level === "beginner" && w < CONFIG.beginnerStridesOnlyWeeks) q = 0;
  if (c.riskFlagged && w < CONFIG.riskFlaggedSingleQualityWeeks) q = Math.min(q, 1);
  if (c.profile.age >= CONFIG.seniorAge) q = Math.min(q, 1);
  if (target.isCutback || phase === "taper" || c.frame.mini) q = Math.min(q, 1);
  return Math.max(0, Math.min(q, c.runningDays - 1));
}

function forbiddenTypes(c: PlanContext, w: number): QualityType[] {
  const out: QualityType[] = [];
  const firstThird = w < Math.ceil(c.frame.totalWeeks / 3);
  if (hasInjury(c.profile, "achillesCalf") && firstThird) out.push("hillSprints");
  if (c.riskFlagged) out.push("shortIntervals");
  // Knee / IT band history: limit downhill work.
  if (hasInjury(c.profile, "runnersKnee") || hasInjury(c.profile, "itBand"))
    out.push("downhillPractice");
  return out;
}

function phaseWeekIndex(c: PlanContext, w: number): number {
  const phase = c.frame.phases[w];
  let i = 0;
  for (let k = w - 1; k >= 0 && c.frame.phases[k] === phase; k--) i++;
  return i;
}

/** 0..1 position within the structured, non-taper part of the plan. */
function progressOf(c: PlanContext, w: number): number {
  const f = c.frame;
  const first = f.maintenanceWeeks;
  const last = f.totalWeeks - f.taperWeeks - 1;
  if (last <= first) return 0.5;
  return Math.min(1, Math.max(0, (w - first) / (last - first)));
}

function chooseSessions(
  c: PlanContext,
  w: number,
  q: number,
  target: WeekTarget,
  state: WeekState,
  longRunVariantOfWeek: LongRunVariant,
): QualityType[] {
  if (q === 0) return [];
  const phase = c.frame.phases[w]!;
  const phaseWeek = phaseWeekIndex(c, w);
  const plan = c.method.planWeek({ phase, phaseWeek, level: c.level, race: c.race });
  const slots = trailSlots(c, phase, c.frame.mini ? [["racePace"] as QualityType[]] : plan.slots);
  const forbidden = forbiddenTypes(c, w);
  // Race pace already in the long run → different stimulus midweek.
  if (longRunVariantOfWeek === "racePace") forbidden.push("racePace");
  const rules: SelectionRules = { ...c.rules, forbidden };
  const chosen: QualityType[] = [];

  if (target.isCutback) {
    // No new intensity: reuse a type already done, preferring the first slot's pick.
    const pick = slots[0] ? selectSession(slots[0], phaseWeek, rules).type : null;
    const reuse = pick && state.usedTypes.has(pick) ? pick : [...state.usedTypes].at(-1);
    return reuse ? [reuse] : [];
  }

  for (const slot of slots.slice(0, q)) {
    const res = selectSession(slot, phaseWeek, rules, chosen);
    if (res.unmet) c.warnings.push({ code: "preference_unmet", params: { tag: res.unmet } });
    if (res.type && !chosen.includes(res.type)) chosen.push(res.type);
  }

  // Plantar fasciitis: never hills and speed in the same week.
  if (hasInjury(c.profile, "plantarFasciitis")) {
    const hasSpeed = chosen.some((t) => SPEED_TYPES.includes(t));
    const hillIdx = chosen.findIndex((t) => HILL_TYPES.includes(t));
    if (hasSpeed && hillIdx >= 0) {
      const replacement = (["tempo", "fartlek"] as const).find(
        (t) =>
          !chosen.includes(t) && !SESSION_TAGS[t].some((tag) => c.rules.dislikes.includes(tag)),
      );
      if (replacement) chosen[hillIdx] = replacement;
      else chosen.splice(hillIdx, 1);
    }
  }
  return chosen;
}

/** Trail races: climbs and descents replace flat race-pace work (spec §10). */
function trailSlots(
  c: PlanContext,
  phase: PlanWeek["phase"],
  slots: QualityType[][],
): QualityType[][] {
  if (!c.trail) return slots;
  const noFlatRacePace = (slot: QualityType[]) => {
    const s = slot.map((t) => (t === "racePace" ? "tempo" : t));
    return [...new Set(s)];
  };
  if (phase === "taper" || c.frame.mini) return [["fartlek"]];
  const out = slots.map(noFlatRacePace);
  if (phase === "build") {
    if (out.length >= 2) out[1] = ["hillRepeats", ...out[1]!.filter((t) => t !== "hillRepeats")];
    else if (out[0]) out[0] = [...out[0], "hillRepeats"];
  }
  if (phase === "specific" && out[0]) out[0] = ["hillRepeats", "downhillPractice"];
  return out;
}

function longRunVariant(c: PlanContext, w: number, target: WeekTarget): LongRunVariant {
  const phase = c.frame.phases[w]!;
  if (target.isCutback || phase === "taper" || phase === "maintenance") return "plain";
  if (c.level === "beginner") return "plain";
  const variant = c.method.planWeek({
    phase,
    phaseWeek: phaseWeekIndex(c, w),
    level: c.level,
    race: c.race,
  }).longRun;
  if (variant === "progressive" && target.longRunM < CONFIG.minProgressiveLongRunM) return "plain";
  if (variant === "racePace" && c.trail) return "progressive";
  if (variant === "racePace" && target.longRunM < CONFIG.minRacePaceLongRunM) return "plain";
  return variant;
}

/** Climbing target of a trail long run, progressing toward the race's D+/km. */
function trailLong(
  c: PlanContext,
  phase: PlanWeek["phase"],
  distanceM: number,
): TrailLongOptions | undefined {
  if (!c.trail) return undefined;
  const gain = (distanceM / 1000) * c.trail.gainPerKm * TRAIL_GAIN_FACTOR[phase];
  return { gainM: Math.min(c.trail.raceGainM, Math.round(gain / 10) * 10), steep: c.trail.steep };
}

function stridesSpec(c: PlanContext): StridesSpec {
  return { count: c.level === "beginner" ? 4 : 6, seconds: 20 };
}

function stridesHardS(c: PlanContext): number {
  const e = estimateSteps(c.pace, [stridesBlock(stridesSpec(c))]);
  return e.durationS - e.easyS;
}

function planDay(date: IsoDate, workout: Workout | null): PlanDay {
  return { date, weekday: weekdayOf(date), workout };
}

interface BuiltWeek {
  week: PlanWeek;
  hardDates: IsoDate[];
  longDate: IsoDate | null;
}

function summarizeWeek(
  index: number,
  monday: IsoDate,
  phase: PlanWeek["phase"],
  target: WeekTarget,
  days: PlanDay[],
  isRaceWeek: boolean,
): PlanWeek {
  let vol = 0;
  let dur = 0;
  let long = 0;
  let gain = 0;
  for (const d of days) {
    const wk = d.workout;
    if (!wk || wk.type === "race") continue;
    gain += wk.elevationGainM ?? 0;
    vol += wk.estDistanceM;
    dur += wk.estDurationS;
    if (wk.isLongRun) long = Math.max(long, wk.estDistanceM);
  }
  return {
    index,
    startDate: monday,
    phase,
    isCutback: target.isCutback,
    isRaceWeek,
    targetVolumeM: target.targetVolumeM,
    plannedVolumeM: vol,
    plannedDurationS: dur,
    longRunM: long,
    ...(gain > 0 ? { elevationGainM: gain } : {}),
    days,
  };
}

/** §13 adjustments for a rebuilt week. */
interface WeekOptions {
  /** No quality sessions or time trial: easy running + strides. */
  easyOnly?: boolean;
  /** The first N runs of the week are easy. */
  easyFirstRuns?: number;
  /** §13.5 tiring week: the first N quality sessions become easy runs. */
  easyQuality?: number;
}

function buildTrainingWeek(
  c: PlanContext,
  w: number,
  target: WeekTarget,
  state: WeekState,
  opts: WeekOptions = {},
): BuiltWeek {
  const f = c.frame;
  const dates = weekDates(f, w);
  const monday = addDays(f.firstMonday, w * 7);
  const phase = f.phases[w]!;
  const p = c.profile;

  let variant: LongRunVariant = opts.easyOnly ? "plain" : longRunVariant(c, w, target);
  let sessions = chooseSessions(
    c,
    w,
    opts.easyOnly ? 0 : qualityCount(c, w, target),
    target,
    state,
    variant,
  );

  // Optional time trial when there is no performance data (week 2; week 3 for beginners).
  let withTimeTrial = false;
  const ttWeek =
    c.level === "beginner" ? CONFIG.beginnerStridesOnlyWeeks : CONFIG.fitness.timeTrialWeek;
  if (
    c.pace.zones === null &&
    !state.timeTrialDone &&
    !opts.easyOnly &&
    w >= ttWeek &&
    !target.isCutback &&
    phase !== "taper" &&
    !f.mini
  ) {
    withTimeTrial = true;
    sessions = sessions.slice(0, Math.max(0, sessions.length - 1));
  }

  const blocked = dates.filter((d) => state.blockedDates.has(d)).map(weekdayOf);
  const hardCount = sessions.length + (withTimeTrial ? 1 : 0);
  let layout = chooseLayout({
    available: p.availableDays,
    longRunDay: p.longRunDay,
    runningDays: c.runningDays,
    qualityCount: hardCount,
    longRunHard: variant !== "plain",
    twoEasyAfterLong: p.age >= CONFIG.riskAge,
    blocked,
  });
  if (variant !== "plain" && layout.qualityDays.length < hardCount) {
    // A hard long run costs a quality slot → keep the long run easy instead.
    variant = "plain";
    layout = chooseLayout({
      available: p.availableDays,
      longRunDay: p.longRunDay,
      runningDays: c.runningDays,
      qualityCount: hardCount,
      longRunHard: false,
      twoEasyAfterLong: p.age >= CONFIG.riskAge,
      blocked,
    });
  }

  const inWeek = (d: Weekday) => dates.find((date) => weekdayOf(date) === d);
  // No long run in the last days before the race; always rest the day before.
  const dayBeforeRace = addDays(f.raceDate, -1);
  const daysToRace = (d: IsoDate) => diffDays(d, f.raceDate);
  const noLongWithin = p.age >= CONFIG.riskAge ? 3 : 2;
  const longCandidate = inWeek(p.longRunDay);
  const longDate =
    target.longRunM >= CONFIG.minRunM && longCandidate && daysToRace(longCandidate) > noLongWithin
      ? longCandidate
      : null;
  const qualityDates = layout.qualityDays.map(inWeek).filter((d): d is IsoDate => d !== undefined);
  const runDates = layout.runDays
    .map(inWeek)
    .filter((d): d is IsoDate => d !== undefined && d !== dayBeforeRace);
  // Partial first week: only the share of the week's runs that fall inside the plan
  // (the runner keeps their usual running before the start date).
  const volumeM =
    dates.length < 7
      ? Math.floor(
          (target.targetVolumeM * runDates.length) / Math.max(1, layout.runDays.length) / 100,
        ) * 100
      : target.targetVolumeM;

  const workouts = new Map<IsoDate, Workout>();

  // 1. Long run.
  let longW: Workout | null = null;
  if (longDate) {
    longW = longRun(c.pace, target.longRunM, variant, c.race, trailLong(c, phase, target.longRunM));
    workouts.set(longDate, longW);
  }
  const longM = longW?.estDistanceM ?? 0;

  // 2. Quality sessions (and the time trial).
  const easyDatesPlanned = runDates.filter((d) => d !== longDate && !qualityDates.includes(d));
  const weekEasyPace = c.pace.estZones.E.slowSPerKm;
  const weekDurationEst = (volumeM / KM) * weekEasyPace;
  // Small margin: actual durations are a bit shorter than this all-easy estimate.
  const minEasy = Math.max(c.method.minEasyShare, CONFIG.minEasyShare) + 0.01;
  const longHardS = longW ? longW.estDurationS - longW.easyDurationS : 0;
  const stridesBudget = Math.min(2, easyDatesPlanned.length) * stridesHardS(c);
  let hardBudget = Math.max(0, (1 - minEasy) * weekDurationEst - longHardS - stridesBudget);
  const qualityDatesUsed = qualityDates.slice(0, hardCount);
  let remaining = volumeM - longM - easyDatesPlanned.length * CONFIG.minRunM;
  const progress = progressOf(c, w);
  const scale = target.isCutback ? 0.75 : phase === "taper" ? 0.6 : 1;

  let ttDate = withTimeTrial ? qualityDatesUsed.at(-1) : undefined;
  if (ttDate) {
    const tt = timeTrial(c.pace, CONFIG.fitness.timeTrialDistanceM, volumeM < 20 * KM);
    const ttHard = tt.estDurationS - tt.easyDurationS;
    if (tt.estDistanceM <= remaining && ttHard <= hardBudget) {
      workouts.set(ttDate, tt);
      state.timeTrialDone = true;
      remaining -= tt.estDistanceM;
      hardBudget -= ttHard;
    } else {
      ttDate = undefined; // retry next week
    }
  }
  const sessionDates = qualityDatesUsed.filter((d) => d !== ttDate);
  sessions.slice(0, sessionDates.length).forEach((type, i) => {
    const left = sessions.length - i;
    const zonePace = c.pace.estZones.T.fastSPerKm;
    const typeCapS = Math.max(CONFIG.minQualityWorkS, (WORK_SHARE[type] * volumeM * zonePace) / KM);
    const sizing: SessionSizing = {
      hardBudgetS: Math.min(hardBudget / left, typeCapS),
      maxDistanceM: Math.min(remaining / left, longM > 0 ? longM : Infinity),
      progress,
      scale,
    };
    // Fallbacks: the entry-level version of the same session, then a short fartlek.
    const workout =
      buildQuality(type, c.pace, sizing, c.qualityOptions) ??
      buildQuality(type, c.pace, { ...sizing, progress: 0, scale: 1 }, c.qualityOptions) ??
      (!target.isCutback || state.usedTypes.has("fartlek")
        ? fartlek(c.pace, { ...sizing, progress: 0, scale: 1 })
        : null);
    if (workout) {
      workouts.set(sessionDates[i]!, workout);
      remaining -= workout.estDistanceM;
      hardBudget -= workout.estDurationS - workout.easyDurationS;
    }
  });

  // 3. Easy runs fill the remaining volume.
  const used = [...workouts.values()].reduce((s, wk) => s + wk.estDistanceM, 0);
  let easyDates = runDates.filter((d) => !workouts.has(d));
  let easyLeft = volumeM - used;
  while (easyDates.length > 0 && easyLeft / easyDates.length < CONFIG.minRunM) {
    // Drop the easy day with the most neighbouring run days.
    const busiest = [...easyDates].sort(
      (a, b) => neighbours(b, runDates) - neighbours(a, runDates) || diffDays(a, b),
    )[0]!;
    easyDates = easyDates.filter((d) => d !== busiest);
  }
  const easyCap = longM > 0 ? longM : Math.max(CONFIG.minRunM, target.longRunM);
  const strides = stridesSpec(c);
  let stridesLeft = phase === "taper" ? 1 : 2;
  const hardDatesSoFar = [...workouts.entries()].filter(([, wk]) => wk.isHard).map(([d]) => d);
  let crossTrainingDate: IsoDate | null = null;
  // Recovery runs (day after a hard day / long run) get a smaller share.
  const isRecovery = (date: IsoDate) =>
    c.level !== "beginner" &&
    (hardDatesSoFar.includes(addDays(date, -1)) ||
      (longDate !== null && date === addDays(longDate, 1)) ||
      // Day after last week's hard day / long run (blocked for quality).
      (state.blockedDates.has(date) && diffDays(date, f.raceDate) > 2));
  const weightOf = (date: IsoDate) => (isRecovery(date) ? CONFIG.recoveryRunWeight : 1);
  let weightLeft = easyDates.reduce((s, d) => s + weightOf(d), 0);
  easyDates.forEach((date) => {
    const weight = weightOf(date);
    const share = Math.floor((easyLeft * weight) / weightLeft / 100) * 100;
    weightLeft -= weight;
    const dist = Math.min(share, easyCap);
    const afterHard =
      hardDatesSoFar.includes(addDays(date, -1)) ||
      (longDate !== null && date === addDays(longDate, 1));
    const beforeHard = hardDatesSoFar.includes(addDays(date, 1));
    // Never strides on a recovery run.
    const giveStrides =
      !isRecovery(date) &&
      stridesLeft > 0 &&
      !afterHard &&
      !beforeHard &&
      dist >= CONFIG.minStridesRunM;
    const run = easyRun(c.pace, dist, {
      recovery: isRecovery(date),
      strides: giveStrides ? strides : undefined,
    });
    if (giveStrides) stridesLeft--;
    workouts.set(date, run);
    easyLeft -= run.estDistanceM;
    if (c.riskFlagged && !crossTrainingDate && !afterHard) crossTrainingDate = date;
  });

  // 3b. Volume left over (no easy days, or easy runs capped) → easy running
  // appended to quality sessions, never making them longer than the long run.
  let leftover = volumeM - [...workouts.values()].reduce((s, wk) => s + wk.estDistanceM, 0);
  for (const [date, wk] of workouts) {
    if (leftover < CONFIG.minRunM) break;
    if (!wk.isHard || wk.isLongRun || wk.type === "timeTrial") continue;
    const room = easyCap - wk.estDistanceM;
    if (room < CONFIG.minRunM) continue;
    const extended = withExtraEasy(c.pace, wk, Math.min(room, leftover));
    workouts.set(date, extended);
    leftover -= extended.estDistanceM - wk.estDistanceM;
  }

  const total = () => [...workouts.values()].reduce((s, wk) => s + wk.estDistanceM, 0);

  // 4. Minimum run lengths can overshoot tiny weeks: drop the smallest easy runs.
  while (total() > volumeM) {
    const easy = [...workouts.entries()]
      .filter(([, wk]) => wk.type === "easy" || wk.type === "recovery")
      .sort((a, b) => a[1].estDistanceM - b[1].estDistanceM)[0];
    const victim =
      easy ?? [...workouts.entries()].sort((a, b) => a[1].estDistanceM - b[1].estDistanceM)[0];
    if (!victim) break;
    workouts.delete(victim[0]);
  }

  // 5. Long run ≤ share of the *planned* volume (easy runs may have been capped):
  // long ≤ s / (1 − s) × (other runs).
  if (longDate) {
    for (let i = 0; i < 8; i++) {
      const current = workouts.get(longDate);
      if (!current) break;
      const planned = total();
      // Few-run weeks get the even-split rule (see longRunShareCap).
      const runs = workouts.size;
      if (current.estDistanceM <= longRunShareCap(planned, runs)) break;
      const s = longRunShareCap(planned, runs) / planned;
      const maxLong = (s / (1 - s)) * (planned - current.estDistanceM);
      if (maxLong < CONFIG.minRunM) {
        workouts.delete(longDate);
        break;
      }
      const shorter = longRun(c.pace, maxLong, variant, c.race, trailLong(c, phase, maxLong));
      workouts.set(longDate, shorter);
      // Even split binding (2 runs, or 3 runs ≥ 30 km): one shortening is enough.
      // Re-capping the other runs to the rounded long run would shrink the
      // whole week pass after pass; they may stay up to one rounding step longer.
      if (1 / runs >= s - 1e-9) continue;
      for (const [date, wk] of workouts) {
        if (
          (wk.type === "easy" || wk.type === "recovery") &&
          wk.estDistanceM > shorter.estDistanceM
        ) {
          workouts.set(
            date,
            easyRun(c.pace, shorter.estDistanceM, {
              recovery: wk.type === "recovery",
              strides: shorter.estDistanceM >= CONFIG.minStridesRunM ? wk.strides : undefined,
            }),
          );
        }
      }
    }
  }

  // 6. Safety net for the intensity distribution: downgrade quality sessions
  // (largest hard time first) to easy runs until the easy share holds.
  const minShare =
    p.planStyle === "polarized" ? CONFIG.minEasySharePolarized : CONFIG.minEasyShareFloor;
  for (let i = 0; i < 4; i++) {
    const all = [...workouts.values()];
    const dur = all.reduce((s, wk) => s + wk.estDurationS, 0);
    const easy = all.reduce((s, wk) => s + wk.easyDurationS, 0);
    if (dur === 0 || easy / dur >= minShare + 0.005) break;
    const hardest = [...workouts.entries()]
      .filter(([, wk]) => wk.isHard)
      .sort(
        (a, b) => b[1].estDurationS - b[1].easyDurationS - (a[1].estDurationS - a[1].easyDurationS),
      )[0];
    if (!hardest) break;
    const [date, wk] = hardest;
    workouts.set(
      date,
      wk.isLongRun
        ? longRun(c.pace, wk.estDistanceM, "plain", c.race, trailLong(c, phase, wk.estDistanceM))
        : easyRun(c.pace, wk.estDistanceM),
    );
  }

  // 7. §13.4: the first runs back after a short break are easy.
  if (opts.easyFirstRuns) {
    for (const date of [...workouts.keys()].sort().slice(0, opts.easyFirstRuns)) {
      const wk = workouts.get(date)!;
      if (!wk.isHard) continue;
      if (wk.type === "timeTrial") state.timeTrialDone = false; // retry next week
      workouts.set(
        date,
        wk.isLongRun
          ? longRun(c.pace, wk.estDistanceM, "plain", c.race, trailLong(c, phase, wk.estDistanceM))
          : easyRun(c.pace, wk.estDistanceM),
      );
    }
  }

  // 7b. §13.5: after a tiring week, quality sessions become easy runs
  // (the time trial last: it is the only way to get paces).
  if (opts.easyQuality) {
    const quality = [...workouts.entries()]
      .filter(([, wk]) => wk.isHard && !wk.isLongRun)
      .sort(
        ([a, x], [b, y]) =>
          Number(x.type === "timeTrial") - Number(y.type === "timeTrial") || diffDays(b, a),
      );
    for (const [date, wk] of quality.slice(0, opts.easyQuality)) {
      if (wk.type === "timeTrial") state.timeTrialDone = false; // retry next week
      workouts.set(date, easyRun(c.pace, wk.estDistanceM));
    }
  }

  const days = dates.map((date) => {
    const day = planDay(date, workouts.get(date) ?? null);
    if (date === crossTrainingDate) day.crossTrainingSuggested = true;
    return day;
  });
  // Record the session types actually scheduled ("no new intensity" in cutbacks).
  for (const d of days) {
    if (d.workout?.isHard && !d.workout.isLongRun && d.workout.type !== "timeTrial") {
      state.usedTypes.add(d.workout.type as QualityType);
    }
  }
  const week = summarizeWeek(w, monday, phase, target, days, false);
  return {
    week,
    hardDates: days.filter((d) => d.workout?.isHard).map((d) => d.date),
    longDate,
  };
}

const weekTargetOf = (w: PlanWeek): WeekTarget => ({
  targetVolumeM: w.targetVolumeM,
  longRunM: w.longRunM,
  isCutback: w.isCutback,
});

const cloneState = (s: WeekState): WeekState => ({
  usedTypes: new Set(s.usedTypes),
  blockedDates: new Set(s.blockedDates),
  timeTrialDone: s.timeTrialDone,
});

/**
 * §13.5: why a day changes. `factor` × the planned distance, as an easy run
 * (0 = day off); `since` = the last day that stayed as planned (the
 * check-in day, or the day before "I'm back").
 */
export interface DayChange {
  factor: number;
  since: IsoDate;
}

/** All the check-ins changing one day; the strongest wins. */
export type DayAdjust = readonly DayChange[];

export interface WeekAdjust {
  days: ReadonlyMap<IsoDate, DayAdjust>;
  notes: Message[];
}

const easyVersion = (c: PlanContext, phase: PlanWeek["phase"], wk: Workout, distM: number) =>
  wk.isLongRun
    ? longRun(c.pace, distM, "plain", c.race, trailLong(c, phase, distM))
    : easyRun(c.pace, distM, { recovery: wk.type === "recovery" });

const hardS = (wk: Workout) => wk.estDurationS - wk.easyDurationS;

/**
 * Apply check-in changes to a built week: days off, or easy running at a
 * lower volume. Never adds anything (hard sessions are only taken out).
 */
function adjustBuiltWeek(
  c: PlanContext,
  built: BuiltWeek,
  adjust: WeekAdjust,
  target: WeekTarget,
): BuiltWeek {
  const old = built.week;
  /** The week's workouts, counting only changes from check-ins before `day`. */
  const workoutsKnownOn = (day: IsoDate | null) => {
    const out = new Map<IsoDate, Workout>();
    for (const d of old.days) {
      const wk = d.workout;
      if (!wk) continue;
      const known = (adjust.days.get(d.date) ?? []).filter((x) => day === null || x.since < day);
      if (known.length === 0 || wk.type === "race") {
        out.set(d.date, wk);
        continue;
      }
      const factor = Math.min(...known.map((x) => x.factor));
      const distM = Math.floor((wk.estDistanceM * factor) / 100) * 100;
      if (distM >= CONFIG.minRunM) out.set(d.date, easyVersion(c, old.phase, wk, distM));
    }
    return out;
  };
  const workouts = workoutsKnownOn(null);

  // A long run still to come when the runner checked in keeps its share of
  // what is left (§7.6). Only check-ins before its day count, so it never
  // changes again once run.
  const longDate = [...workouts].find(([, wk]) => wk.isLongRun)?.[0];
  if (longDate) {
    const known = workoutsKnownOn(longDate);
    for (let i = 0; i < 8 && known.has(longDate); i++) {
      const long = known.get(longDate)!;
      const runs = [...known.values()].filter((wk) => wk.type !== "race");
      const planned = runs.reduce((s, wk) => s + wk.estDistanceM, 0);
      const cap = longRunShareCap(planned, runs.length);
      if (long.estDistanceM <= cap) break;
      const s = cap / planned;
      const maxLong = Math.floor(((s / (1 - s)) * (planned - long.estDistanceM)) / 100) * 100;
      if (maxLong < CONFIG.minRunM) known.delete(longDate);
      else known.set(longDate, easyVersion(c, old.phase, long, maxLong));
    }
    const resized = known.get(longDate);
    if (!resized) workouts.delete(longDate);
    else if (workouts.has(longDate) && resized.estDistanceM < workouts.get(longDate)!.estDistanceM)
      workouts.set(longDate, resized);
  }

  const days = old.days.map((d) => {
    const day = planDay(d.date, workouts.get(d.date) ?? null);
    if (d.crossTrainingSuggested && day.workout) day.crossTrainingSuggested = true;
    return day;
  });
  const week: PlanWeek = {
    ...summarizeWeek(old.index, old.startDate, old.phase, target, days, old.isRaceWeek),
    adjustedFrom: {
      volumeM: old.plannedVolumeM,
      hardS: old.days.reduce((s, d) => s + (d.workout ? hardS(d.workout) : 0), 0),
    },
  };
  return {
    week,
    hardDates: days.filter((d) => d.workout?.isHard).map((d) => d.date),
    longDate: days.find((d) => d.workout?.isLongRun)?.date ?? null,
  };
}

/** Reuse an already-planned week, updating the builder state like buildTrainingWeek. */
function adoptWeek(week: PlanWeek, state: WeekState): BuiltWeek {
  for (const d of week.days) {
    const wk = d.workout;
    if (wk?.type === "timeTrial") state.timeTrialDone = true;
    else if (wk?.isHard && !wk.isLongRun && wk.type !== "race")
      state.usedTypes.add(wk.type as QualityType);
  }
  return {
    week,
    hardDates: week.days.filter((d) => d.workout?.isHard).map((d) => d.date),
    longDate: week.days.find((d) => d.workout?.isLongRun)?.date ?? null,
  };
}

function neighbours(date: IsoDate, runDates: IsoDate[]): number {
  return [addDays(date, -1), addDays(date, 1)].filter((d) => runDates.includes(d)).length;
}

function buildRaceWeek(c: PlanContext, w: number, prevPlannedM: number): BuiltWeek {
  const f = c.frame;
  const dates = weekDates(f, w);
  const monday = addDays(f.firstMonday, w * 7);
  const p = c.profile;
  const workouts = new Map<IsoDate, Workout>();
  workouts.set(f.raceDate, raceDay(c.pace, c.raceDistanceM, p.race.elevationGainM));

  const dayBefore = addDays(f.raceDate, -1);
  const layout = chooseLayout({
    available: p.availableDays,
    longRunDay: p.longRunDay,
    runningDays: c.runningDays,
    qualityCount: 0,
    longRunHard: false,
    twoEasyAfterLong: false,
  });
  const candidates = dates.filter(
    (d) => d !== f.raceDate && d !== dayBefore && layout.runDays.includes(weekdayOf(d)),
  );
  // Rest-day budget for the full week: race day counts as a running day.
  const maxRuns = Math.min(
    c.level === "beginner" ? CONFIG.raceWeekEasyRuns.min : CONFIG.raceWeekEasyRuns.max,
    7 - c.minRestDays - 1,
  );
  // Keep the runs closest to the race? No — spread: take the earliest ones,
  // leaving the last days before the race light.
  let runDates = candidates.slice(0, maxRuns);
  const budget = prevPlannedM * (1 - CONFIG.taperReductionRange[0]);
  let each = Math.min(8 * KM, Math.max(3 * KM, prevPlannedM * 0.15));
  while (runDates.length > 0 && runDates.length * each > budget) {
    if (each > CONFIG.minRunM) each = Math.max(CONFIG.minRunM, budget / runDates.length);
    if (runDates.length * each > budget) runDates = runDates.slice(0, -1);
  }
  each = Math.floor(each / 100) * 100;
  runDates.forEach((d, i) =>
    workouts.set(
      d,
      easyRun(c.pace, each, {
        strides: i < 2 && each >= CONFIG.minStridesRunM ? { count: 4, seconds: 20 } : undefined,
      }),
    ),
  );
  if (c.level === "experienced" && dates.includes(dayBefore) && c.minRestDays === 1) {
    const total = [...workouts.values()]
      .filter((x) => x.type !== "race")
      .reduce((s, x) => s + x.estDistanceM, 0);
    if (total + 3 * KM <= budget) {
      workouts.set(
        dayBefore,
        easyRun(c.pace, 3 * KM, { optional: true, notes: [{ key: "workout.note.shakeout" }] }),
      );
    }
  }
  const days = dates.map((date) => planDay(date, workouts.get(date) ?? null));
  const target: WeekTarget = {
    targetVolumeM: Math.floor(budget / 100) * 100,
    longRunM: 0,
    isCutback: false,
  };
  const week = summarizeWeek(w, monday, "taper", target, days, true);
  return { week, hardDates: [f.raceDate], longDate: null };
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

/** §13: what to change from a given week on (see `adaptPlan`). */
export interface WeekDirective extends WeekOptions {
  /** Restart the progression at this level (after a break). */
  restart?: { volumeM: number; longRunM: number };
  forceCutback?: boolean;
  /** Multiply every pace (s/km) from this week on. */
  paceFactor?: number;
  /** No increase this week (§13.5 tiring week). */
  hold?: boolean;
  /** Why (shown on the week). */
  notes: Message[];
}

export interface AssembleHooks {
  /**
   * Called before week `w` with the weeks built so far (as planned, before
   * check-in changes) and the progression's
   * reference (last full week). `undefined` = nothing changes.
   */
  directive(
    w: number,
    weeks: readonly PlanWeek[],
    reference: { volumeM: number; longRunM: number },
  ): WeekDirective | undefined;
  /**
   * False = the week doesn't count as a step up (§13.3 hold). Gets the week
   * as planned; weeks changed by `adjustWeek` never count either.
   */
  isFullWeek(week: PlanWeek): boolean;
  /** §13.5: check-in changes to the days of week `w` (built as planned), if any. */
  adjustWeek(w: number, planned: PlanWeek, before: readonly PlanWeek[]): WeekAdjust | undefined;
  /** Upper bounds for rebuilt weeks (the original plan's target, planned volume and long run). */
  capOf(w: number): { targetM: number; plannedM: number; longRunM: number } | undefined;
  /** Weeks before this index are never rebuilt. */
  frozenWeeks: number;
}

const scaleRange = (r: PaceRange, f: number): PaceRange => ({
  fastSPerKm: r.fastSPerKm * f,
  slowSPerKm: r.slowSPerKm * f,
});
const scaleZones = (z: PaceZones, f: number): PaceZones =>
  Object.fromEntries(Object.entries(z).map(([k, r]) => [k, scaleRange(r, f)])) as PaceZones;

/** All paces `f` times slower (s/km × f). */
export function slowPaces(p: PaceContext, f: number): PaceContext {
  return {
    zones: p.zones && scaleZones(p.zones, f),
    estZones: scaleZones(p.estZones, f),
    racePaceSPerKm: p.racePaceSPerKm && p.racePaceSPerKm * f,
    estRacePaceSPerKm: p.estRacePaceSPerKm * f,
  };
}

/**
 * @param keptWeeks weeks already planned, adopted as-is (see applyTimeTrialResult,
 *   adaptPlan): the progression and cross-week rules continue from what they
 *   actually contain.
 * @param hooks §13 adaptation: from the first week with a directive on, weeks
 *   are rebuilt instead of adopted.
 */
export function assemblePlan(
  profile: RunnerProfile,
  today: IsoDate,
  startDate: IsoDate,
  keptWeeks: readonly PlanWeek[] = [],
  hooks?: AssembleHooks,
): TrainingPlan {
  const c = makeContext(profile, today, startDate);
  profileWarnings(c);
  const f = c.frame;
  const p = profile;

  const slowGrowth = hasInjury(p, "shinSplints") || hasInjury(p, "stressFracture");
  const ramp = slowGrowth ? 0.05 : c.conservative ? CONFIG.ramp.conservative : CONFIG.ramp.normal;
  const smallAllowanceM = slowGrowth ? 2 * KM : CONFIG.smallVolumeAllowanceM;
  const longCapByRace = interpolateByDistance(c.effortDistanceM, (r) => CONFIG.longRunCapM[r]);
  const longCapByTime = (CONFIG.longRunMaxDurationS / c.pace.estZones.E.slowSPerKm) * KM;
  const startVol = Math.min(
    p.currentWeeklyVolumeM > 0 ? p.currentWeeklyVolumeM : smallAllowanceM,
    p.maxWeeklyVolumeM,
  );
  const progression = new Progression({
    currentVolumeM: p.currentWeeklyVolumeM,
    maxVolumeM: p.maxWeeklyVolumeM,
    peakVolumeM: c.peakVolumeM,
    maintenanceCapM: Math.max(Math.min(startVol, c.peakVolumeM), c.peakVolumeM * 0.7),
    ramp,
    smallAllowanceM,
    cutbackEvery: c.cutbackEvery,
    // A longest run of 0 next to a non-zero volume is treated as "not provided".
    startLongRunM: p.longestRecentRunM || longRunShareCap(startVol, c.runningDays),
    longRunCapM: Math.min(longCapByRace, longCapByTime),
    runsPerWeek: c.runningDays,
  });

  const state: WeekState = {
    usedTypes: new Set(),
    blockedDates: new Set([addDays(f.raceDate, -1), addDays(f.raceDate, -2)]),
    timeTrialDone: false,
  };
  const weeks: PlanWeek[] = [];
  /** Weeks as built before check-in changes: what the runner was asked to run. */
  const plannedWeeks: PlanWeek[] = [];
  const preTaper = f.totalWeeks - f.taperWeeks;
  let rebuilding = false;

  for (let w = 0; w < f.totalWeeks; w++) {
    const isRaceWeek = w === f.totalWeeks - 1;
    const found = hooks?.directive(w, plannedWeeks, progression.reference);
    const directive = found && w >= hooks!.frozenWeeks ? found : undefined;
    if (directive) {
      rebuilding = true;
      if (directive.restart)
        progression.restart(directive.restart.volumeM, directive.restart.longRunM);
      if (directive.forceCutback) progression.forceCutback();
      if (directive.hold) progression.holdLevel();
      if (directive.paceFactor && directive.paceFactor !== 1)
        c.pace = slowPaces(c.pace, directive.paceFactor);
    }
    const adopt = w < keptWeeks.length && !rebuilding;
    const stateBefore = cloneState(state);
    let target: WeekTarget | undefined;
    let built: BuiltWeek;
    if (isRaceWeek && adopt) {
      built = adoptWeek(keptWeeks[w]!, state);
    } else if (isRaceWeek) {
      const prev = plannedWeeks.at(-1);
      let prevM = prev ? prev.plannedVolumeM : progression.startVolumeM;
      // §13: after a week with many missed runs, size from what was really run.
      if (prev && hooks && (!hooks.isFullWeek(prev) || weeks.at(-1)!.adjustedFrom !== undefined))
        prevM = Math.min(prevM, progression.reference.volumeM);
      built = buildRaceWeek(c, w, prevM);
    } else {
      target =
        w < preTaper
          ? progression.next(f.phases[w] === "maintenance")
          : progression.taper(w - preTaper, plannedWeeks.at(-1)?.plannedVolumeM ?? 0);
      const cap = rebuilding ? hooks?.capOf(w) : undefined;
      if (cap) {
        target.targetVolumeM = Math.min(target.targetVolumeM, cap.targetM);
        target.longRunM = Math.min(target.longRunM, cap.longRunM);
      }
      if (adopt) built = adoptWeek(keptWeeks[w]!, state);
      else {
        // Rebuilt weeks never plan more than the original week (rounding can
        // differ): retry with a lower target, from the same state.
        const before = cloneState(state);
        built = buildTrainingWeek(c, w, target, state, directive);
        for (let i = 0; cap && i < 8 && built.week.plannedVolumeM > cap.plannedM; i++) {
          target.targetVolumeM =
            Math.min(target.targetVolumeM, built.week.plannedVolumeM) -
            Math.max(100, built.week.plannedVolumeM - cap.plannedM);
          Object.assign(state, cloneState(before));
          built = buildTrainingWeek(c, w, target, state, directive);
        }
      }
    }

    // §13.5: check-ins change days of this week (and later weeks are rebuilt).
    const planned = built.week;
    const adjust =
      hooks && w >= hooks.frozenWeeks ? hooks.adjustWeek(w, planned, plannedWeeks) : undefined;
    if (adjust) {
      rebuilding = true;
      built = adjustBuiltWeek(c, built, adjust, target ?? weekTargetOf(planned));
      // Sessions taken out don't count as done ("no new intensity", time trial retry).
      state.usedTypes = new Set(stateBefore.usedTypes);
      state.timeTrialDone = stateBefore.timeTrialDone;
      adoptWeek(built.week, state);
    }

    if (target && w < preTaper) {
      const partial = planned.days.length < 7;
      // A cutback with missed runs still counts as the cutback (keeps the cadence).
      // Weeks changed by check-ins aren't a step up either.
      const full = !hooks || (hooks.isFullWeek(planned) && !adjust);
      if (!target.isCutback && !full) progression.recordPartial();
      else
        progression.record(
          target,
          partial ? target.targetVolumeM : planned.plannedVolumeM,
          partial ? target.longRunM : planned.longRunM,
        );
    }
    const notes = [...(directive?.notes ?? []), ...(adjust?.notes ?? [])];
    if (notes.length) built.week = { ...built.week, adaptations: notes };
    // Block hard sessions right after hard days (cross-week) and after long runs (age ≥ 50).
    for (const d of built.hardDates) state.blockedDates.add(addDays(d, 1));
    if (built.longDate) {
      state.blockedDates.add(addDays(built.longDate, 1));
      if (p.age >= CONFIG.riskAge) state.blockedDates.add(addDays(built.longDate, 2));
    }
    weeks.push(built.week);
    plannedWeeks.push(planned);
  }

  const dedupedWarnings = dedupeWarnings(c.warnings);
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedOn: today,
    profile,
    summary: {
      level: c.level,
      riskFlags: c.flags,
      raceDistanceM: c.raceDistanceM,
      effortDistanceM: c.effortDistanceM,
      fitness: c.fitness,
      paceZones: c.pace.zones,
      racePaceSPerKm: c.pace.racePaceSPerKm,
      peakVolumeM: Math.max(...weeks.map((wk) => wk.plannedVolumeM)),
      taperDays: f.taperDays,
      totalWeeks: f.totalWeeks,
      runningDaysPerWeek: c.runningDays,
    },
    startDate: f.startDate,
    raceDate: f.raceDate,
    weeks,
    warnings: dedupedWarnings,
    adviceNotes: adviceNotes(c),
    disclaimer: { key: "plan.disclaimer" },
  };
}

function dedupeWarnings(list: PlanWarning[]): PlanWarning[] {
  const seen = new Set<string>();
  return list.filter((w) => {
    const k = `${w.code}:${JSON.stringify(w.params ?? {})}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
