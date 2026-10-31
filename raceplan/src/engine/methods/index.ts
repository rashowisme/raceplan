import type { PlanStyle } from "../types";
import { balanced } from "./balanced";
import { polarized } from "./polarized";
import type { TrainingMethod } from "./types";
import { vdot } from "./vdot";

const METHODS: Record<PlanStyle, TrainingMethod> = { balanced, vdot, polarized };

export function getMethod(style: PlanStyle): TrainingMethod {
  return METHODS[style];
}

export type { TrainingMethod, MethodWeekInput, MethodWeekPlan, SessionSlot } from "./types";
