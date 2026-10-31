import type { PlanStyle } from "../types";
import { balanced } from "./balanced";
import type { TrainingMethod } from "./types";

const METHODS: Record<PlanStyle, TrainingMethod> = {
  balanced,
  // M4 adds dedicated VDOT-style and 80/20 methods.
  vdot: balanced,
  polarized: balanced,
};

export function getMethod(style: PlanStyle): TrainingMethod {
  return METHODS[style];
}

export type { TrainingMethod, MethodWeekInput, MethodWeekPlan, SessionSlot } from "./types";
