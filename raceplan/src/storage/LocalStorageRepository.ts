import { SCHEMA_VERSION, type TrainingPlan } from "@/engine/types";
import type { PlanRepository, StoredPlan } from "./PlanRepository";

const KEY = "raceplan.plans.v1";

interface Envelope {
  version: 1;
  plans: StoredPlan[];
}

/** Minimal storage abstraction so tests can inject an in-memory Storage. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * v1 repository: plans live only in this browser's localStorage.
 * Plans with an unknown schema version are ignored (a future migration hook).
 */
export class LocalStorageRepository implements PlanRepository {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly newId: () => string = () =>
      globalThis.crypto?.randomUUID?.() ?? `plan-${Date.now().toString(36)}`,
  ) {}

  private read(): StoredPlan[] {
    try {
      const raw = this.storage.getItem(KEY);
      if (!raw) return [];
      const env = JSON.parse(raw) as Envelope;
      if (env.version !== 1 || !Array.isArray(env.plans)) return [];
      return env.plans.filter((p) => p.plan?.schemaVersion === SCHEMA_VERSION);
    } catch {
      return [];
    }
  }

  private write(plans: StoredPlan[]): void {
    const env: Envelope = { version: 1, plans };
    this.storage.setItem(KEY, JSON.stringify(env));
  }

  async save(plan: TrainingPlan, id?: string): Promise<StoredPlan> {
    const plans = this.read();
    const stored: StoredPlan = { id: id ?? this.newId(), savedAt: this.now(), plan };
    const next = plans.filter((p) => p.id !== stored.id);
    next.unshift(stored);
    this.write(next);
    return stored;
  }

  async load(id: string): Promise<StoredPlan | null> {
    return this.read().find((p) => p.id === id) ?? null;
  }

  async list(): Promise<StoredPlan[]> {
    return this.read().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }

  async delete(id: string): Promise<void> {
    this.write(this.read().filter((p) => p.id !== id));
  }
}
