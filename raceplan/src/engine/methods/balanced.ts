/**
 * Balanced (default): a mix of threshold, intervals, hills and race-pace work
 * that shifts from general (base) to race-specific (specific phase).
 */
import { CONFIG } from "../config";
import type { MethodWeekInput, MethodWeekPlan, SessionSlot, TrainingMethod } from "./types";

function specificSlots(input: MethodWeekInput): SessionSlot[] {
  if (input.level === "beginner") return [["racePace", "tempo"]];
  switch (input.race) {
    case "5k":
      return [
        ["racePace", "shortIntervals", "longIntervals"],
        ["tempo", "cruiseIntervals"],
      ];
    case "10k":
      return [
        ["racePace", "longIntervals"],
        ["cruiseIntervals", "tempo"],
      ];
    case "half":
      return [["racePace"], ["cruiseIntervals", "tempo", "longIntervals"]];
    case "marathon":
      return [["racePace"], ["tempo", "cruiseIntervals"]];
  }
}

export const balanced: TrainingMethod = {
  id: "balanced",
  minEasyShare: CONFIG.minEasyShare,
  zoneLabels: "daniels",
  planWeek(input: MethodWeekInput): MethodWeekPlan {
    const { phase, phaseWeek, level, race } = input;
    switch (phase) {
      case "maintenance":
        return { slots: [], longRun: "plain" };
      case "base":
        return {
          slots:
            level === "beginner"
              ? [["fartlek", "hillSprints"]]
              : level === "experienced"
                ? [["tempo", "fartlek"], ["hillSprints"]]
                : [["fartlek"], ["hillSprints"]],
          longRun: "plain",
        };
      case "build":
        return {
          slots:
            level === "beginner"
              ? [["tempo", "fartlek"]]
              : [
                  ["tempo", "cruiseIntervals"],
                  ["longIntervals", "hillRepeats"],
                ],
          longRun: level === "beginner" ? "plain" : phaseWeek % 2 === 1 ? "progressive" : "plain",
        };
      case "specific": {
        let longRun: MethodWeekPlan["longRun"] = "plain";
        if (level === "experienced") {
          if (phaseWeek % 2 === 0) {
            longRun = race === "half" || race === "marathon" ? "racePace" : "progressive";
          }
        } else if (level === "intermediate" && phaseWeek % 2 === 1) {
          longRun = "progressive";
        }
        return { slots: specificSlots(input), longRun };
      }
      case "taper":
        return { slots: [["racePace"]], longRun: "plain" };
    }
  },
};
