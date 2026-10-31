import type { RunnerProfile } from "@/engine/types";

/** Beginner, 3 days/week, no performance data, 5K in ~9 weeks. */
export const beginner5k: RunnerProfile = {
  race: { type: "5k", date: "2027-01-03" },
  currentWeeklyVolumeM: 8_000,
  longestRecentRunM: 4_000,
  maxWeeklyVolumeM: 25_000,
  availableDays: ["tue", "thu", "sun"],
  longRunDay: "sun",
  yearsRunning: "lt1",
  injuries: [],
  currentlyInjured: false,
  age: 34,
  planStyle: "balanced",
  preferences: { likes: [], dislikes: [] },
};
