import type { StandardRaceType } from "../config";
import type { ExperienceLevel, Phase, PlanStyle } from "../types";
import type { LongRunVariant, QualityType } from "../workouts/library";

export interface MethodWeekInput {
  phase: Phase;
  /** 0-based index of the week within its phase. */
  phaseWeek: number;
  level: ExperienceLevel;
  race: StandardRaceType;
}

/**
 * A slot is a list of interchangeable candidate session types; by default
 * the method rotates through them week by week.
 */
export type SessionSlot = QualityType[];

export interface MethodWeekPlan {
  slots: SessionSlot[];
  longRun: LongRunVariant;
}

export interface TrainingMethod {
  id: PlanStyle;
  /** Minimum share of weekly running time at easy effort. */
  minEasyShare: number;
  /** Labels shown for zones (polarized shows Z1/Z2/Z3). */
  zoneLabels: "daniels" | "polarized";
  planWeek(input: MethodWeekInput): MethodWeekPlan;
}
