"use client";

import { useSyncExternalStore } from "react";
import { createBrowserStore } from "@/lib/browser-store";
import type { DistanceUnit } from "@/lib/units";

export const unitStore = createBrowserStore<DistanceUnit>("raceplan.unit", "km", (raw) =>
  raw === "km" || raw === "mi" ? raw : undefined,
);

/** Current distance unit (km / mi), persisted in localStorage. */
export function useUnit(): [DistanceUnit, (unit: DistanceUnit) => void] {
  const unit = useSyncExternalStore(
    unitStore.subscribe,
    unitStore.get,
    () => unitStore.serverValue,
  );
  return [unit, unitStore.set];
}
