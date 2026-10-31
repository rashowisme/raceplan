"use client";

import { useTranslations } from "next-intl";
import { useUnit } from "@/features/units/useUnit";
import { DISTANCE_UNITS } from "@/lib/units";
import { cn } from "@/lib/utils";

/** km | mi segmented switch, persisted in localStorage. */
export function UnitToggle() {
  const t = useTranslations("header");
  const [unit, setUnit] = useUnit();
  return (
    <div
      role="group"
      aria-label={t("units")}
      className="bg-muted flex rounded-lg p-0.5 text-xs font-semibold"
    >
      {DISTANCE_UNITS.map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={u === unit}
          onClick={() => setUnit(u)}
          className={cn(
            "focus-visible:ring-ring min-h-8 min-w-9 rounded-md px-2 transition-colors focus-visible:ring-2 focus-visible:outline-none",
            u === unit
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t(u)}
        </button>
      ))}
    </div>
  );
}
