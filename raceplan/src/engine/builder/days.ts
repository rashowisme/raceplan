/**
 * Spec §6: choose running days and place quality sessions so that hard days
 * are never consecutive (also across week boundaries).
 */
import { WEEKDAYS, type Weekday } from "../types";

export interface LayoutRequest {
  available: Weekday[];
  longRunDay: Weekday;
  runningDays: number;
  qualityCount: number;
  /** Long run has fast segments (counts as a hard day). */
  longRunHard: boolean;
  /** Age ≥ 50: two easy/rest days after the long run before a hard day. */
  twoEasyAfterLong: boolean;
  /** Days that must not be hard (e.g. Monday after a hard Sunday). */
  blocked?: Weekday[];
}

export interface Layout {
  runDays: Weekday[];
  qualityDays: Weekday[];
}

const idx = (d: Weekday) => WEEKDAYS.indexOf(d);
const at = (i: number) => WEEKDAYS[((i % 7) + 7) % 7]!;

function subsets<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [first, ...rest] = items;
  return [...subsets(rest, k - 1).map((s) => [first!, ...s]), ...subsets(rest, k)];
}

/** Cyclic adjacency (Sunday → Monday counts). */
const adjacent = (a: Weekday, b: Weekday) => {
  const d = Math.abs(idx(a) - idx(b));
  return d === 1 || d === 6;
};

function qualityAllowed(day: Weekday, req: LayoutRequest): boolean {
  if (day === req.longRunDay) return false;
  if (req.blocked?.includes(day)) return false;
  const L = idx(req.longRunDay);
  // Never the day after the long run; with a hard long run never adjacent.
  if (day === at(L + 1)) return false;
  if (req.longRunHard && day === at(L - 1)) return false;
  if (req.twoEasyAfterLong && day === at(L + 2)) return false;
  return true;
}

function bestQuality(runDays: Weekday[], req: LayoutRequest): Weekday[] {
  const candidates = runDays.filter((d) => qualityAllowed(d, req));
  for (let q = Math.min(req.qualityCount, candidates.length); q > 0; q--) {
    let best: Weekday[] | null = null;
    let bestScore = -Infinity;
    for (const set of subsets(candidates, q)) {
      const hard = req.longRunHard ? [...set, req.longRunDay] : set;
      if (hard.some((a, i) => hard.slice(i + 1).some((b) => adjacent(a, b)))) continue;
      // Prefer not right before the long run, and spread from each other.
      let score = 0;
      for (const d of set) if (adjacent(d, req.longRunDay)) score -= 2;
      score += spread(set);
      if (score > bestScore) {
        bestScore = score;
        best = set;
      }
    }
    if (best) return best;
  }
  return [];
}

/** Sum of minimal cyclic gaps — larger means better spread. */
function spread(days: Weekday[]): number {
  if (days.length < 2) return 0;
  const sorted = days.map(idx).sort((a, b) => a - b);
  let min = 7;
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length]! + (i + 1 === sorted.length ? 7 : 0);
    min = Math.min(min, next - sorted[i]!);
  }
  return min;
}

/** Number of pairs of consecutive running days (cyclic). */
function consecutivePairs(days: Weekday[]): number {
  let n = 0;
  for (let i = 0; i < days.length; i++)
    for (let j = i + 1; j < days.length; j++) if (adjacent(days[i]!, days[j]!)) n++;
  return n;
}

export function chooseLayout(req: LayoutRequest): Layout {
  const others = req.available.filter((d) => d !== req.longRunDay);
  const k = Math.max(0, Math.min(req.runningDays - 1, others.length));
  let best: Layout | null = null;
  let bestScore = -Infinity;
  for (const set of subsets(others, k)) {
    const runDays = [...set, req.longRunDay].sort((a, b) => idx(a) - idx(b));
    const qualityDays = bestQuality(runDays, req);
    const restAfterLong = !runDays.includes(at(idx(req.longRunDay) + 1)) ? 1 : 0;
    const score =
      qualityDays.length * 100 -
      consecutivePairs(runDays) * 10 +
      restAfterLong * 3 +
      spread(runDays);
    if (score > bestScore) {
      bestScore = score;
      best = { runDays, qualityDays: qualityDays.sort((a, b) => idx(a) - idx(b)) };
    }
  }
  return best ?? { runDays: [req.longRunDay], qualityDays: [] };
}
