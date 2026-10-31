import type { Phase, Workout } from "@/engine/types";

/** Phase colours (CSS variables in globals.css, shared with the PDF). */
export const PHASE_CLASSES: Record<Phase, { badge: string; bar: string; accent: string }> = {
  maintenance: {
    badge: "bg-phase-maintenance/15 text-foreground",
    bar: "bg-phase-maintenance",
    accent: "border-l-phase-maintenance",
  },
  base: {
    badge: "bg-phase-base/15 text-foreground",
    bar: "bg-phase-base",
    accent: "border-l-phase-base",
  },
  build: {
    badge: "bg-phase-build/20 text-foreground",
    bar: "bg-phase-build",
    accent: "border-l-phase-build",
  },
  specific: {
    badge: "bg-phase-specific/15 text-foreground",
    bar: "bg-phase-specific",
    accent: "border-l-phase-specific",
  },
  taper: {
    badge: "bg-phase-taper/15 text-foreground",
    bar: "bg-phase-taper",
    accent: "border-l-phase-taper",
  },
};

export type DayKind = "rest" | "easy" | "long" | "quality" | "race";

export function dayKind(w: Workout | null): DayKind {
  if (!w) return "rest";
  if (w.type === "race") return "race";
  if (w.isLongRun) return "long";
  if (w.isHard) return "quality";
  return "easy";
}

/** Dot / chip colour per day kind. */
export const DAY_DOT: Record<DayKind, string> = {
  rest: "bg-muted-foreground/30",
  easy: "bg-success",
  long: "bg-primary",
  quality: "bg-phase-specific",
  race: "bg-phase-race",
};
