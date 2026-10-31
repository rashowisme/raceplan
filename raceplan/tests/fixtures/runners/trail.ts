import type { RunnerProfile } from "@/engine/types";

/** Intermediate trail runner: 30 km / 1500 m D+ in 16 weeks, IT band history, likes hills. */
export const trail30k: RunnerProfile = {
  race: { type: "trail", distanceM: 30_000, elevationGainM: 1500, date: "2027-02-21" },
  watchPrediction: { timeS: 3 * 3600 + 50 * 60 },
  currentWeeklyVolumeM: 35_000,
  longestRecentRunM: 16_000,
  maxWeeklyVolumeM: 60_000,
  availableDays: ["tue", "wed", "thu", "sat", "sun"],
  longRunDay: "sun",
  yearsRunning: "1to3",
  injuries: [{ type: "itBand", frequency: "once" }],
  currentlyInjured: false,
  age: 36,
  planStyle: "balanced",
  preferences: { likes: ["hills"], dislikes: [] },
};
