"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import type { TrainingPlan } from "@/engine/types";
import { useUnit } from "@/features/units/useUnit";
import type { Formatter, Translate } from "./format";

/** Formatter bound to the current locale, unit and the plan's zone labels. */
export function usePlanFormatter(plan: TrainingPlan): Formatter {
  const t = useTranslations();
  const locale = useLocale();
  const [unit] = useUnit();
  return useMemo(
    () => ({
      t: t as unknown as Translate,
      locale,
      unit,
      zoneLabels: plan.profile.planStyle === "polarized" ? "polarized" : "daniels",
    }),
    [t, locale, unit, plan.profile.planStyle],
  );
}
