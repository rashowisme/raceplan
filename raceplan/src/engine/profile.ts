/**
 * Values derived from the runner profile: race distance, effort distance,
 * experience level and risk flags (spec §2, §10).
 */
import { CONFIG, isStandardRace, type StandardRaceType } from "./config";
import type { ExperienceLevel, InjuryType, RiskFlag, RunnerProfile } from "./types";

/** Race distance in meters. */
export function raceDistanceM(profile: RunnerProfile): number {
  const { type, distanceM } = profile.race;
  if (isStandardRace(type)) return CONFIG.standardDistancesM[type];
  return distanceM ?? 0;
}

/** Effort distance in meters: distance + D+ × 10 (i.e. km + D+/100). */
export function effortDistanceM(profile: RunnerProfile): number {
  const base = raceDistanceM(profile);
  if (profile.race.type !== "trail") return base;
  const gain = profile.race.elevationGainM ?? 0;
  return base + (gain / CONFIG.elevationMPerEffortKm) * 1000;
}

export function experienceLevel(profile: RunnerProfile): ExperienceLevel {
  const vol = profile.currentWeeklyVolumeM;
  if (profile.yearsRunning === "lt1" || vol < CONFIG.level.beginnerMaxVolumeM) return "beginner";
  if (profile.yearsRunning === "3plus" && vol >= CONFIG.level.experiencedMinVolumeM) {
    return "experienced";
  }
  return "intermediate";
}

export function riskFlags(profile: RunnerProfile): RiskFlag[] {
  const flags: RiskFlag[] = [];
  if (profile.injuries.some((i) => i.frequency === "often")) flags.push("injuryOften");
  if (new Set(profile.injuries.map((i) => i.type)).size >= 2) flags.push("multipleInjuries");
  if (hasInjury(profile, "stressFracture")) flags.push("stressFractureHistory");
  if (profile.age >= CONFIG.riskAge) flags.push("age50plus");
  return flags;
}

export function hasInjury(profile: RunnerProfile, type: InjuryType): boolean {
  return profile.injuries.some((i) => i.type === type);
}

/**
 * Interpolate a per-standard-distance value by (effort) distance.
 * Below 5K → 5K value; above marathon → marathon value.
 */
export function interpolateByDistance(
  distanceM: number,
  valueFor: (race: StandardRaceType) => number,
): number {
  const points: StandardRaceType[] = ["5k", "10k", "half", "marathon"];
  const d = CONFIG.standardDistancesM;
  if (distanceM <= d["5k"]) return valueFor("5k");
  if (distanceM >= d.marathon) return valueFor("marathon");
  for (let i = 0; i < points.length - 1; i++) {
    const lo = points[i]!;
    const hi = points[i + 1]!;
    if (distanceM <= d[hi]) {
      const t = (distanceM - d[lo]) / (d[hi] - d[lo]);
      return valueFor(lo) + t * (valueFor(hi) - valueFor(lo));
    }
  }
  return valueFor("marathon");
}

/** The standard race whose distance is closest to an (effort) distance. */
export function nearestStandardRace(distanceM: number): StandardRaceType {
  const d = CONFIG.standardDistancesM;
  const races: StandardRaceType[] = ["5k", "10k", "half", "marathon"];
  return races.reduce((best, r) =>
    Math.abs(d[r] - distanceM) < Math.abs(d[best] - distanceM) ? r : best,
  );
}
