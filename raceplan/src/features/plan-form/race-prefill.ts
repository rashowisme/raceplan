/**
 * "Create my plan for this race" links (`/plan/new?course=<slug>`) fill in
 * the race step from a race guide. Everything else the runner already
 * typed is kept.
 */
import { getRaceGuide, type RaceGuide } from "@/content/races";
import { diffDays } from "@/engine/dates";
import { FEET_PER_METER, metersToUnit, type DistanceUnit } from "@/lib/units";
import type { PlanFormValues } from "./form-model";

export function racePrefill(
  values: PlanFormValues,
  slug: string | null,
  unit: DistanceUnit,
  today: string,
): { values: PlanFormValues; guide: RaceGuide } | null {
  const guide = slug ? getRaceGuide(slug) : undefined;
  if (!guide) return null;
  const { type, distanceM, elevationGainM } = guide.race;
  const date = guide.nextEdition.date;
  return {
    guide,
    values: {
      ...values,
      raceType: type,
      distance: distanceM ? String(Math.round(metersToUnit(distanceM, unit) * 100) / 100) : "",
      elevationGain: elevationGainM
        ? String(Math.round(unit === "mi" ? elevationGainM * FEET_PER_METER : elevationGainM))
        : "",
      // Only an announced date that is still ahead; otherwise the runner enters it.
      raceDate: date && diffDays(today, date) > 0 ? date : "",
      startDate: "",
    },
  };
}
