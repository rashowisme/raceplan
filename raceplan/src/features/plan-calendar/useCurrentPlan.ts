"use client";

import { useCallback, useEffect, useState } from "react";
import { getPlanRepository, PLAN_CHANGED_EVENT, type StoredPlan } from "@/storage";

export const CURRENT_PLAN_ID = "current";

export type CurrentPlanState =
  { status: "loading" } | { status: "empty" } | { status: "ready"; stored: StoredPlan };

/** Loads the browser-stored current plan and follows changes (other tabs too). */
export function useCurrentPlan(): CurrentPlanState & { remove: () => Promise<void> } {
  const [state, setState] = useState<CurrentPlanState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    const load = () => {
      void getPlanRepository()
        .load(CURRENT_PLAN_ID)
        .then((stored) => {
          if (alive) setState(stored ? { status: "ready", stored } : { status: "empty" });
        });
    };
    load();
    window.addEventListener(PLAN_CHANGED_EVENT, load);
    window.addEventListener("storage", load);
    return () => {
      alive = false;
      window.removeEventListener(PLAN_CHANGED_EVENT, load);
      window.removeEventListener("storage", load);
    };
  }, []);

  const remove = useCallback(async () => {
    await getPlanRepository().delete(CURRENT_PLAN_ID);
    window.dispatchEvent(new Event(PLAN_CHANGED_EVENT));
  }, []);

  return { ...state, remove };
}
