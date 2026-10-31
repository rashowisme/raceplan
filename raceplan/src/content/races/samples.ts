/**
 * Sample plans for a race guide: typical runners, planned by the real engine
 * for the race's next edition. The generation day is fixed relative to race
 * day, so pages don't change from one build to the next.
 */
import { checkPlan, generatePlan } from "@/engine";
import { addDays, mondayOf } from "@/engine/dates";
import type { IsoDate, PlanWeek, RaceType, RunnerProfile, TrainingPlan } from "@/engine/types";
import type { RaceGuide } from "./types";

export interface Persona {
  id: string;
  /** e.g. "Premier marathon". */
  title: string;
  /** Who this is, in one sentence. */
  description: string;
  weeks: number;
  /** Everything but the race (filled in from the guide). */
  profile: Omit<RunnerProfile, "race">;
}

const common = {
  injuries: [],
  currentlyInjured: false,
  planStyle: "balanced",
  preferences: { likes: [], dislikes: [] },
} satisfies Partial<RunnerProfile>;

const PERSONAS: Partial<Record<RaceType, Persona[]>> = {
  marathon: [
    {
      id: "premier",
      title: "Premier marathon",
      description:
        "Court depuis un ou deux ans, environ 30 km par semaine en 4 à 5 sorties, sortie la plus longue récente de 14 km.",
      weeks: 20,
      profile: {
        ...common,
        watchPrediction: { timeS: 4 * 3600 + 30 * 60 },
        currentWeeklyVolumeM: 30_000,
        longestRecentRunM: 14_000,
        maxWeeklyVolumeM: 50_000,
        availableDays: ["mon", "tue", "thu", "fri", "sun"],
        longRunDay: "sun",
        yearsRunning: "1to3",
        age: 35,
      },
    },
    {
      id: "4h",
      title: "Objectif 4 heures",
      description:
        "Coureur régulier, 35 km par semaine en 5 sorties, sortie longue de 18 km, vise 4 h 00.",
      weeks: 18,
      profile: {
        ...common,
        watchPrediction: { timeS: 3 * 3600 + 58 * 60 },
        targetTimeS: 4 * 3600,
        currentWeeklyVolumeM: 35_000,
        longestRecentRunM: 18_000,
        maxWeeklyVolumeM: 60_000,
        availableDays: ["tue", "wed", "fri", "sat", "sun"],
        longRunDay: "sun",
        yearsRunning: "1to3",
        age: 38,
      },
    },
    {
      id: "3h30",
      title: "Objectif 3 h 30",
      description:
        "Marathonien confirmé (record à 3 h 38), 50 km par semaine en 5 sorties, vise 3 h 30.",
      weeks: 16,
      profile: {
        ...common,
        personalRecord: { timeS: 3 * 3600 + 38 * 60 },
        targetTimeS: 3 * 3600 + 30 * 60,
        currentWeeklyVolumeM: 50_000,
        longestRecentRunM: 22_000,
        maxWeeklyVolumeM: 75_000,
        availableDays: ["mon", "tue", "thu", "sat", "sun"],
        longRunDay: "sun",
        yearsRunning: "3plus",
        age: 42,
      },
    },
  ],
};

export const personasFor = (type: RaceType): Persona[] => PERSONAS[type] ?? [];

export interface Sample {
  persona: Persona;
  plan: TrainingPlan;
  startDate: IsoDate;
  /** The week with the most volume. */
  peakWeek: PlanWeek;
  longestRunM: number;
  /** Most quality sessions in a week (not counting the time trial). */
  maxQualityPerWeek: number;
}

/** Race date used for the samples (the announced date, or an estimate). */
export const sampleRaceDate = (g: RaceGuide): IsoDate =>
  g.nextEdition.date ?? g.nextEdition.estimatedDate;

/** Plan every persona for this race. Throws if a plan breaks a safety rule (never shipped). */
export function buildSamples(g: RaceGuide): Sample[] {
  const raceDate = sampleRaceDate(g);
  return personasFor(g.race.type).map((persona) => {
    const startDate = addDays(mondayOf(raceDate), -7 * (persona.weeks - 1));
    const profile: RunnerProfile = {
      ...persona.profile,
      race: { ...g.race, date: raceDate },
      planStartDate: startDate,
    };
    const r = generatePlan(profile, { today: addDays(startDate, -1) });
    if (!r.ok) throw new Error(`${g.slug}/${persona.id}: ${r.refusal.code}`);
    const violations = checkPlan(r.plan);
    if (violations.length) throw new Error(`${g.slug}/${persona.id}: ${violations[0]!.rule}`);
    const weeks = r.plan.weeks;
    const peakWeek = weeks.reduce((a, b) => (b.plannedVolumeM > a.plannedVolumeM ? b : a));
    const quality = (w: PlanWeek) =>
      w.days.filter(
        (d) =>
          d.workout?.isHard &&
          !d.workout.isLongRun &&
          d.workout.type !== "race" &&
          d.workout.type !== "timeTrial",
      ).length;
    return {
      persona,
      plan: r.plan,
      startDate,
      peakWeek,
      longestRunM: Math.max(...weeks.map((w) => w.longRunM)),
      maxQualityPerWeek: Math.max(...weeks.map(quality)),
    };
  });
}
