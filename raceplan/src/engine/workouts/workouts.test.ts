import { describe, expect, it } from "vitest";
import { estimationZones, paceZonesFromVdot } from "../paces/zones";
import type { SimpleStep, WorkoutStep } from "../types";
import {
  buildQuality,
  easyRun,
  longRun,
  raceDay,
  timeTrial,
  withExtraEasy,
  type QualityOptions,
  type QualityType,
  type SessionSizing,
} from "./library";
import { selectSession, SESSION_TAGS } from "./selection";
import type { PaceContext } from "./steps";

const zones = paceZonesFromVdot(45);
const withPaces: PaceContext = {
  zones,
  estZones: zones,
  racePaceSPerKm: 280,
  estRacePaceSPerKm: 280,
};
const effortOnly: PaceContext = {
  zones: null,
  estZones: estimationZones("intermediate"),
  racePaceSPerKm: null,
  estRacePaceSPerKm: 330,
};
const generous: SessionSizing = {
  hardBudgetS: 3600,
  maxDistanceM: 20_000,
  progress: 0.5,
  scale: 1,
};
const opts: QualityOptions = { onTrack: true, avoidRPace: false, race: "10k" };
const TYPES: QualityType[] = [
  "tempo",
  "cruiseIntervals",
  "longIntervals",
  "shortIntervals",
  "hillSprints",
  "hillRepeats",
  "fartlek",
  "racePace",
];

function flat(steps: WorkoutStep[]): SimpleStep[] {
  return steps.flatMap((s) => (s.kind === "repeat" ? flat(s.steps) : [s]));
}

describe("workout library", () => {
  it.each(TYPES)("%s is structured, hard and within budget", (type) => {
    const w = buildQuality(type, withPaces, generous, opts)!;
    expect(w).not.toBeNull();
    expect(w.isHard).toBe(true);
    expect(w.steps.length).toBeGreaterThan(0);
    expect(w.estDistanceM).toBeGreaterThan(0);
    expect(w.estDistanceM).toBeLessThanOrEqual(generous.maxDistanceM);
    expect(w.title.key).toMatch(/^workout\./);
    for (const s of flat(w.steps)) expect(s.target.effort).toBeTruthy();
  });

  it("omits paces in effort-only plans", () => {
    for (const type of TYPES) {
      const w = buildQuality(type, effortOnly, generous, opts)!;
      for (const s of flat(w.steps)) expect(s.target.pace).toBeUndefined();
    }
  });

  it("returns null when the minimal session does not fit", () => {
    expect(buildQuality("tempo", withPaces, { ...generous, hardBudgetS: 60 }, opts)).toBeNull();
  });

  it("uses road (time) reps when the runner dislikes the track", () => {
    const track = buildQuality("longIntervals", withPaces, generous, opts)!;
    const road = buildQuality("longIntervals", withPaces, generous, { ...opts, onTrack: false })!;
    expect(track.tags).toContain("track");
    expect(road.tags).not.toContain("track");
  });

  it("avoids R-pace when asked", () => {
    const early = { ...generous, progress: 0 };
    const w = buildQuality("shortIntervals", withPaces, early, { ...opts, avoidRPace: true })!;
    expect(flat(w.steps).some((s) => s.target.zone === "R")).toBe(false);
  });

  it("builds easy, long, race and time trial workouts", () => {
    const e = easyRun(withPaces, 8000, { strides: { count: 6, seconds: 20 } });
    expect(e.estDistanceM).toBeLessThanOrEqual(8000);
    expect(e.isHard).toBe(false);
    expect(longRun(withPaces, 18_000, "plain", "half").isHard).toBe(false);
    expect(longRun(withPaces, 18_000, "racePace", "half").isHard).toBe(true);
    expect(longRun(withPaces, 18_000, "progressive", "half").estDistanceM).toBe(18_000);
    expect(raceDay(withPaces, 10_000).type).toBe("race");
    expect(timeTrial(effortOnly, 3000).optional).toBe(true);
  });

  it("appends easy running", () => {
    const w = buildQuality("tempo", withPaces, generous, opts)!;
    const x = withExtraEasy(withPaces, w, 3000);
    expect(x.estDistanceM).toBeGreaterThanOrEqual(w.estDistanceM + 2900);
    expect(x.easyDurationS).toBeGreaterThan(w.easyDurationS);
  });
});

describe("selectSession", () => {
  const rules = { likes: [], dislikes: [], forbidden: [] };

  it("rotates through candidates", () => {
    expect(selectSession(["tempo", "fartlek"], 0, rules).type).toBe("tempo");
    expect(selectSession(["tempo", "fartlek"], 1, rules).type).toBe("fartlek");
  });

  it("prefers liked tags", () => {
    expect(
      selectSession(["longIntervals", "hillRepeats"], 0, { ...rules, likes: ["hills"] }).type,
    ).toBe("hillRepeats");
  });

  it("substitutes a similar stimulus for disliked sessions", () => {
    const r = selectSession(["shortIntervals"], 0, { ...rules, dislikes: ["shortIntervals"] });
    expect(r.type).toBe("fartlek");
    expect(r.substitutedFrom).toBe("shortIntervals");
    const hills = selectSession(["hillRepeats"], 0, { ...rules, dislikes: ["hills"] });
    expect(hills.type).toBe("tempo");
  });

  it("reports unmet preferences when no substitute is allowed", () => {
    const r = selectSession(["hillSprints"], 0, {
      likes: [],
      dislikes: ["hills", "tempo"],
      forbidden: ["fartlek"],
    });
    expect(r.type).toBeNull();
    expect(r.unmet).toBe("hills");
  });

  it("never returns a disliked tag", () => {
    for (const t of TYPES) {
      for (const tag of SESSION_TAGS[t]) {
        const r = selectSession([t], 0, { ...rules, dislikes: [tag] });
        if (r.type) expect(SESSION_TAGS[r.type]).not.toContain(tag);
      }
    }
  });
});
