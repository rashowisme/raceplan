import type { TrainingPlan } from "@/engine/types";

/** A stored plan plus storage metadata. */
export interface StoredPlan {
  id: string;
  /** ISO timestamp of the last save. */
  savedAt: string;
  plan: TrainingPlan;
}

/**
 * Storage abstraction. v1 = localStorage; a future `ApiPlanRepository`
 * will talk to an EU-hosted DB. UI code depends only on this interface.
 */
export interface PlanRepository {
  save(plan: TrainingPlan, id?: string): Promise<StoredPlan>;
  load(id: string): Promise<StoredPlan | null>;
  list(): Promise<StoredPlan[]>;
  delete(id: string): Promise<void>;
}
