/**
 * Compact, human-readable rendering of a plan, used for fixture snapshots
 * (reviewable diffs) and for coach-style reviews.
 */
import type { TrainingPlan, Workout, WorkoutStep } from "@/engine/types";

const km = (m: number) => (m / 1000).toFixed(1);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function stepText(s: WorkoutStep): string {
  if (s.kind === "repeat") return `${s.count}×(${s.steps.map(stepText).join(" / ")})`;
  const dur =
    s.duration.type === "distance" ? `${s.duration.meters}m` : `${Math.round(s.duration.seconds)}s`;
  const pace = s.target.pace
    ? `@${mmss(s.target.pace.fastSPerKm)}-${mmss(s.target.pace.slowSPerKm)}`
    : "";
  const terrain = s.terrain ? ` ${s.terrain}` : "";
  return `${s.kind[0]}:${dur} ${s.target.zone}/${s.target.effort}${pace}${terrain}`;
}

function workoutText(w: Workout, withSteps: boolean): string {
  const flags = [w.isHard ? "H" : "", w.optional ? "opt" : ""].filter(Boolean).join(",");
  const base = `${w.type} ${km(w.estDistanceM)}km ${Math.round(w.estDurationS / 60)}min${flags ? ` [${flags}]` : ""}`;
  return withSteps ? `${base} {${w.steps.map(stepText).join("; ")}}` : base;
}

export function planToText(plan: TrainingPlan, withSteps = false): string {
  const s = plan.summary;
  const lines: string[] = [
    `level=${s.level} risk=[${s.riskFlags.join(",")}] weeks=${s.totalWeeks} days/wk=${s.runningDaysPerWeek} peak=${km(s.peakVolumeM)}km taper=${s.taperDays}d`,
    `fitness=${s.fitness ? `vdot ${s.fitness.vdot} (${s.fitness.source}${s.fitness.lowConfidence ? ", low" : ""})` : "none"} racePace=${s.racePaceSPerKm ? mmss(s.racePaceSPerKm) : "-"}`,
    `zones=${
      s.paceZones
        ? Object.entries(s.paceZones)
            .map(([z, r]) => `${z}:${mmss(r.fastSPerKm)}-${mmss(r.slowSPerKm)}`)
            .join(" ")
        : "effort-only"
    }`,
    `warnings=[${plan.warnings.map((w) => w.code).join(",")}] advice=[${plan.adviceNotes.map((n) => n.key).join(",")}]`,
  ];
  for (const w of plan.weeks) {
    const tag = [w.isCutback ? "CUTBACK" : "", w.isRaceWeek ? "RACE" : ""]
      .filter(Boolean)
      .join(" ");
    lines.push(
      `W${String(w.index + 1).padStart(2, "0")} ${w.startDate} ${w.phase.padEnd(11)} ${km(w.plannedVolumeM)}/${km(w.targetVolumeM)}km long ${km(w.longRunM)} ${tag}`.trimEnd(),
    );
    for (const d of w.days) {
      if (!d.workout) continue;
      lines.push(
        `   ${d.weekday} ${workoutText(d.workout, withSteps)}${d.crossTrainingSuggested ? " +XT" : ""}`,
      );
    }
  }
  return lines.join("\n");
}
