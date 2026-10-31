/**
 * 80/20 (polarized): at least 80% of running time very easy (Z1); the rest is
 * genuinely hard (Z3: intervals, hills). Little time at threshold (Z2), long
 * runs stay easy.
 */
import { CONFIG } from "../config";
import type { MethodWeekInput, MethodWeekPlan, SessionSlot, TrainingMethod } from "./types";

function specificSlots({ race, level }: MethodWeekInput): SessionSlot[] {
  if (level === "beginner") return [["longIntervals", "racePace"]];
  // Marathon/half race pace is Z2: one race-pace session, one Z3 session.
  if (race === "half" || race === "marathon")
    return [["longIntervals", "hillRepeats"], ["racePace"]];
  return [
    ["longIntervals", "racePace"],
    ["shortIntervals", "hillRepeats"],
  ];
}

export const polarized: TrainingMethod = {
  id: "polarized",
  minEasyShare: CONFIG.minEasySharePolarized,
  zoneLabels: "polarized",
  planWeek(input: MethodWeekInput): MethodWeekPlan {
    const { phase, level } = input;
    switch (phase) {
      case "maintenance":
        return { slots: [], longRun: "plain" };
      case "base":
        return {
          slots:
            level === "beginner" ? [["fartlek", "hillSprints"]] : [["fartlek"], ["hillSprints"]],
          longRun: "plain",
        };
      case "build":
        return {
          slots:
            level === "beginner"
              ? [["fartlek", "hillRepeats"]]
              : [
                  ["longIntervals", "hillRepeats"],
                  ["shortIntervals", "fartlek"],
                ],
          longRun: "plain",
        };
      case "specific":
        return { slots: specificSlots(input), longRun: "plain" };
      case "taper":
        return { slots: [["racePace"]], longRun: "plain" };
    }
  },
};
