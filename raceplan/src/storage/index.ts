"use client";

import { LocalStorageRepository } from "./LocalStorageRepository";
import type { PlanRepository } from "./PlanRepository";

let repo: PlanRepository | null = null;

/** The app's plan repository. v1: localStorage. Swap for an API repository later. */
export function getPlanRepository(): PlanRepository {
  repo ??= new LocalStorageRepository(window.localStorage);
  return repo;
}

/** Notifies listeners when the current plan changes (same tab). */
export const PLAN_CHANGED_EVENT = "raceplan:plan-changed";

export type { PlanRepository, StoredPlan } from "./PlanRepository";
