/**
 * VDOT-style (Daniels-inspired): pace-driven quality in a fixed phase order —
 * repetitions (R) for economy, then intervals (I) for VO2max, then threshold
 * (T) and race-specific work.
 */
import { CONFIG } from "../config";
import type { MethodWeekInput, MethodWeekPlan, SessionSlot, TrainingMethod } from "./types";

function specificSlots({ race, level }: MethodWeekInput): SessionSlot[] {
  if (level === "beginner") return [["cruiseIntervals", "racePace"]];
  if (race === "5k" || race === "10k") {
    return [["longIntervals", "racePace"], ["cruiseIntervals"]];
  }
  return [["cruiseIntervals", "tempo"], ["racePace"]];
}

export const vdot: TrainingMethod = {
  id: "vdot",
  minEasyShare: CONFIG.minEasyShare,
  zoneLabels: "daniels",
  planWeek(input: MethodWeekInput): MethodWeekPlan {
    const { phase, phaseWeek, level, race } = input;
    switch (phase) {
      case "maintenance":
        return { slots: [], longRun: "plain" };
      case "base":
        // Phase I/II: economy — short R repetitions and hill sprints.
        return {
          slots:
            level === "beginner" ? [["fartlek"]] : [["shortIntervals"], ["hillSprints", "fartlek"]],
          longRun: "plain",
        };
      case "build":
        // Phase III: VO2max intervals + threshold.
        return {
          slots:
            level === "beginner"
              ? [["cruiseIntervals", "tempo"]]
              : [["longIntervals"], ["cruiseIntervals", "tempo"]],
          longRun: "plain",
        };
      case "specific": {
        const marathonish = race === "half" || race === "marathon";
        const longRun: MethodWeekPlan["longRun"] =
          level === "experienced" && marathonish && phaseWeek % 2 === 0 ? "racePace" : "plain";
        return { slots: specificSlots(input), longRun };
      }
      case "taper":
        return { slots: [["racePace"]], longRun: "plain" };
    }
  },
};
