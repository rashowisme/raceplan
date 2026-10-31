/**
 * Spec §5 + §11: plan length, phases and taper length.
 */
import { CONFIG, isStandardRace } from "../config";
import { addDays, diffDays, mondayOf } from "../dates";
import { interpolateByDistance } from "../profile";
import type { ExperienceLevel, IsoDate, Phase, RaceType } from "../types";

export interface PlanFrame {
  startDate: IsoDate;
  raceDate: IsoDate;
  /** Monday of week 0. */
  firstMonday: IsoDate;
  totalWeeks: number;
  maintenanceWeeks: number;
  /** Taper weeks including race week. */
  taperWeeks: number;
  taperDays: number;
  minWeeks: number;
  /** n < minimum. */
  tooShort: boolean;
  /** n < 3: race-ready mini plan. */
  mini: boolean;
  phases: Phase[];
}

export function minimumWeeks(
  type: RaceType,
  effortDistanceM: number,
  level: ExperienceLevel,
): number {
  const valueFor = (r: "5k" | "10k" | "half" | "marathon") =>
    r === "marathon" && level === "beginner" ? CONFIG.marathonBeginnerMinWeeks : CONFIG.minWeeks[r];
  if (isStandardRace(type)) return valueFor(type);
  return Math.ceil(interpolateByDistance(effortDistanceM, valueFor));
}

export function taperDays(type: RaceType, effortDistanceM: number, level: ExperienceLevel): number {
  if (isStandardRace(type)) return CONFIG.taperDays[type][level];
  return Math.round(interpolateByDistance(effortDistanceM, (r) => CONFIG.taperDays[r][level]));
}

/** Split `m` non-taper structured weeks into base / build / specific counts. */
export function phaseCounts(m: number): { base: number; build: number; specific: number } {
  if (m <= 0) return { base: 0, build: 0, specific: 0 };
  const shares = CONFIG.phaseShares;
  const specific = Math.max(1, Math.round(m * shares.specific));
  const base = Math.min(Math.round(m * shares.base), m - specific);
  return { base, build: m - base - specific, specific };
}

export function buildFrame(
  startDate: IsoDate,
  raceDate: IsoDate,
  type: RaceType,
  effortDistanceM: number,
  level: ExperienceLevel,
): PlanFrame {
  const firstMonday = mondayOf(startDate);
  const totalWeeks = diffDays(firstMonday, mondayOf(raceDate)) / 7 + 1;
  const minWeeks = minimumWeeks(type, effortDistanceM, level);
  const days = taperDays(type, effortDistanceM, level);
  const mini = totalWeeks <= CONFIG.miniPlanMaxWeeks;

  // Week granularity: 7 → 1 week, 10 → 1, 14 → 2, 21 → 3. Short plans keep
  // at least two thirds of their weeks for training.
  let taperWeeks = Math.max(1, Math.round(days / 7));
  if (mini) taperWeeks = 1;
  else taperWeeks = Math.min(taperWeeks, Math.max(1, Math.floor(totalWeeks / 3)));

  const maintenanceWeeks = Math.max(0, totalWeeks - CONFIG.maxStructuredWeeks);
  const structured = totalWeeks - maintenanceWeeks;
  const phases: Phase[] = Array.from({ length: maintenanceWeeks }, () => "maintenance" as const);

  if (mini) {
    // Sharpening week (if any) then race week.
    for (let i = 0; i < structured - 1; i++) phases.push("specific");
  } else {
    const c = phaseCounts(structured - taperWeeks);
    for (let i = 0; i < c.base; i++) phases.push("base");
    for (let i = 0; i < c.build; i++) phases.push("build");
    for (let i = 0; i < c.specific; i++) phases.push("specific");
  }
  for (let i = 0; i < taperWeeks; i++) phases.push("taper");

  return {
    startDate,
    raceDate,
    firstMonday,
    totalWeeks,
    maintenanceWeeks,
    taperWeeks,
    taperDays: days,
    minWeeks,
    tooShort: totalWeeks < minWeeks,
    mini,
    phases,
  };
}

/** Dates of week `index` that fall within [start, race]. */
export function weekDates(frame: PlanFrame, index: number): IsoDate[] {
  const monday = addDays(frame.firstMonday, index * 7);
  const out: IsoDate[] = [];
  for (let d = 0; d < 7; d++) {
    const date = addDays(monday, d);
    if (diffDays(frame.startDate, date) >= 0 && diffDays(date, frame.raceDate) >= 0) out.push(date);
  }
  return out;
}
