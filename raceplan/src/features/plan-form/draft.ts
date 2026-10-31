import type { DistanceUnit } from "@/lib/units";
import { DEFAULT_VALUES, type PlanFormValues } from "./form-model";

const KEY = "raceplan.formDraft.v1";

export interface FormDraft {
  values: PlanFormValues;
  unit: DistanceUnit;
  step: number;
}

/** Form answers are kept locally so a refresh doesn't lose them. */
export function loadDraft(): FormDraft | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as FormDraft;
    if (!d || typeof d !== "object" || !d.values) return null;
    return {
      values: { ...DEFAULT_VALUES, ...d.values },
      unit: d.unit === "mi" ? "mi" : "km",
      step: d.step ?? 0,
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: FormDraft): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    // Ignore quota / privacy-mode errors.
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
