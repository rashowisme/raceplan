import type { RunnerProfile } from "@/engine/types";

const base = {
  injuries: [],
  currentlyInjured: false,
  planStyle: "balanced",
  preferences: { likes: [], dislikes: [] },
} satisfies Partial<RunnerProfile>;

/** Experienced marathoner, 7 days available, recent PR + watch prediction, 18 weeks out. */
export const experiencedMarathon: RunnerProfile = {
  ...base,
  race: { type: "marathon", date: "2027-03-07" },
  personalRecord: { timeS: 3 * 3600 + 15 * 60, achievedOn: "2026-04-12" },
  watchPrediction: { timeS: 3 * 3600 + 8 * 60 },
  targetTimeS: 3 * 3600 + 10 * 60,
  currentWeeklyVolumeM: 55_000,
  longestRecentRunM: 22_000,
  maxWeeklyVolumeM: 85_000,
  availableDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  longRunDay: "sun",
  yearsRunning: "3plus",
  age: 41,
  sex: "male",
};

/** 55-year-old, frequent shin splints + Achilles history, half marathon in 14 weeks. */
export const injuryProne55Half: RunnerProfile = {
  ...base,
  race: { type: "half", date: "2027-02-07" },
  personalRecord: { timeS: 2 * 3600 + 5 * 60, achievedOn: "2025-10-05" },
  currentWeeklyVolumeM: 25_000,
  longestRecentRunM: 12_000,
  maxWeeklyVolumeM: 40_000,
  availableDays: ["mon", "wed", "thu", "sat", "sun"],
  longRunDay: "sat",
  yearsRunning: "3plus",
  injuries: [
    { type: "shinSplints", frequency: "often" },
    { type: "achillesCalf", frequency: "occasionally" },
  ],
  age: 55,
  sex: "female",
};

/** 10K in 2 weeks (race-ready mini plan). */
export const raceIn2Weeks: RunnerProfile = {
  ...base,
  race: { type: "10k", date: "2026-11-15" },
  personalRecord: { timeS: 52 * 60 },
  currentWeeklyVolumeM: 30_000,
  longestRecentRunM: 12_000,
  maxWeeklyVolumeM: 40_000,
  availableDays: ["mon", "wed", "fri", "sun"],
  longRunDay: "sun",
  yearsRunning: "1to3",
  age: 29,
};

/** Intermediate, half marathon 40 weeks out → base maintenance block + 24-week plan. */
export const raceIn40Weeks: RunnerProfile = {
  ...base,
  race: { type: "half", date: "2027-08-08" },
  personalRecord: { timeS: 1 * 3600 + 58 * 60, achievedOn: "2026-05-01" },
  currentWeeklyVolumeM: 28_000,
  maxWeeklyVolumeM: 50_000,
  availableDays: ["tue", "thu", "sat", "sun"],
  longRunDay: "sun",
  yearsRunning: "1to3",
  age: 38,
};

/** 10K PR 55:00, target 45:00 in 10 weeks → goal_ambitious. */
export const unrealisticGoal: RunnerProfile = {
  ...base,
  race: { type: "10k", date: "2027-01-10" },
  personalRecord: { timeS: 55 * 60, achievedOn: "2026-09-20" },
  targetTimeS: 45 * 60,
  currentWeeklyVolumeM: 25_000,
  longestRecentRunM: 10_000,
  maxWeeklyVolumeM: 40_000,
  availableDays: ["tue", "thu", "sat", "sun"],
  longRunDay: "sun",
  yearsRunning: "1to3",
  age: 31,
};

/** Intermediate with no PR / watch data, 10K in 12 weeks. */
export const noPerformanceData: RunnerProfile = {
  ...base,
  race: { type: "10k", date: "2027-01-24" },
  currentWeeklyVolumeM: 20_000,
  maxWeeklyVolumeM: 35_000,
  availableDays: ["mon", "wed", "fri", "sun"],
  longRunDay: "sun",
  yearsRunning: "1to3",
  age: 45,
};

/** Starts from zero, beginner marathon with a low max → low_max_volume, plan_too_short. */
export const zeroVolumeMarathon: RunnerProfile = {
  ...base,
  race: { type: "marathon", date: "2027-03-14" },
  currentWeeklyVolumeM: 0,
  maxWeeklyVolumeM: 25_000,
  availableDays: ["tue", "thu", "sat"],
  longRunDay: "sat",
  yearsRunning: "lt1",
  age: 27,
};

/** 17-year-old experienced 10K runner (volume capped at intermediate targets). */
export const minor10k: RunnerProfile = {
  ...base,
  race: { type: "10k", date: "2027-02-28" },
  personalRecord: { timeS: 36 * 60 + 30, achievedOn: "2026-06-15" },
  currentWeeklyVolumeM: 50_000,
  longestRecentRunM: 15_000,
  maxWeeklyVolumeM: 80_000,
  availableDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
  longRunDay: "sun",
  yearsRunning: "3plus",
  age: 17,
};

/** 68-year-old, half marathon, 4 days, old PR (> 24 months). */
export const senior68Half: RunnerProfile = {
  ...base,
  race: { type: "half", date: "2027-03-21" },
  personalRecord: { timeS: 2 * 3600 + 10 * 60, achievedOn: "2023-09-10" },
  currentWeeklyVolumeM: 30_000,
  longestRecentRunM: 14_000,
  maxWeeklyVolumeM: 40_000,
  availableDays: ["mon", "wed", "fri", "sun"],
  longRunDay: "sun",
  yearsRunning: "3plus",
  age: 68,
};

/** Intermediate, only 2 days available, half marathon → few_days_available. */
export const twoDaysHalf: RunnerProfile = {
  ...base,
  race: { type: "half", date: "2027-02-14" },
  watchPrediction: { timeS: 1 * 3600 + 55 * 60 },
  currentWeeklyVolumeM: 20_000,
  longestRecentRunM: 12_000,
  maxWeeklyVolumeM: 30_000,
  availableDays: ["wed", "sun"],
  longRunDay: "sun",
  yearsRunning: "1to3",
  age: 33,
};

/** Custom 15 km road race, starts mid-week, plantar fasciitis, dislikes short intervals + track. */
export const custom15k: RunnerProfile = {
  ...base,
  race: { type: "custom", distanceM: 15_000, date: "2027-01-31" },
  planStartDate: "2026-11-05",
  personalRecord: { timeS: 1 * 3600 + 12 * 60 },
  currentWeeklyVolumeM: 32_000,
  longestRecentRunM: 13_000,
  maxWeeklyVolumeM: 50_000,
  availableDays: ["mon", "tue", "thu", "fri", "sun"],
  longRunDay: "sun",
  yearsRunning: "3plus",
  injuries: [{ type: "plantarFasciitis", frequency: "occasionally" }],
  age: 47,
  preferences: { likes: ["tempo"], dislikes: ["shortIntervals", "track"] },
};
