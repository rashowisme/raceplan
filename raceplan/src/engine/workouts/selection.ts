/**
 * Picks a concrete session type for each method slot, honouring preferences
 * (likes / dislikes) and injury constraints by substituting a session with a
 * similar stimulus (spec §8, §9).
 */
import type { PreferenceTag } from "../types";
import type { QualityType } from "./library";

/** Preference tags each session type carries (track is decided at build time). */
export const SESSION_TAGS: Record<QualityType, PreferenceTag[]> = {
  tempo: ["tempo"],
  cruiseIntervals: ["tempo"],
  longIntervals: ["longIntervals"],
  shortIntervals: ["shortIntervals"],
  hillSprints: ["hills"],
  hillRepeats: ["hills"],
  fartlek: [],
  racePace: [],
  downhillPractice: ["hills"],
};

/** Ordered substitutes giving a similar stimulus. */
export const SUBSTITUTES: Record<QualityType, QualityType[]> = {
  shortIntervals: ["fartlek", "longIntervals", "hillRepeats"],
  longIntervals: ["fartlek", "hillRepeats", "cruiseIntervals"],
  hillSprints: ["fartlek", "tempo"],
  hillRepeats: ["tempo", "longIntervals", "fartlek"],
  tempo: ["fartlek", "longIntervals"],
  cruiseIntervals: ["fartlek", "longIntervals"],
  fartlek: ["tempo", "longIntervals"],
  racePace: ["longIntervals", "cruiseIntervals", "tempo"],
  downhillPractice: ["fartlek", "tempo"],
};

export interface SelectionRules {
  likes: PreferenceTag[];
  dislikes: PreferenceTag[];
  /** Types forbidden this week (injury constraints). */
  forbidden: QualityType[];
}

export interface SelectionResult {
  type: QualityType | null;
  /** Set when a disliked/forbidden session was replaced or dropped. */
  substitutedFrom?: QualityType;
  unmet?: PreferenceTag;
}

const isAllowed = (t: QualityType, r: SelectionRules) =>
  !r.forbidden.includes(t) && !SESSION_TAGS[t].some((tag) => r.dislikes.includes(tag));

/**
 * @param rotation week counter used to rotate through candidates.
 * @param taken types already chosen this week (avoid duplicates).
 */
export function selectSession(
  candidates: QualityType[],
  rotation: number,
  rules: SelectionRules,
  taken: QualityType[] = [],
): SelectionResult {
  const fresh = (list: QualityType[]) => {
    const notTaken = list.filter((t) => !taken.includes(t));
    return notTaken.length > 0 ? notTaken : list;
  };
  const allowed = fresh(candidates.filter((t) => isAllowed(t, rules)));
  if (allowed.length > 0) {
    const liked = allowed.filter((t) => SESSION_TAGS[t].some((tag) => rules.likes.includes(tag)));
    const pool = liked.length > 0 ? liked : allowed;
    return { type: pool[rotation % pool.length]! };
  }
  // Every candidate is disliked/forbidden → substitute the rotated one.
  const original = candidates[rotation % candidates.length]!;
  const subs = fresh(SUBSTITUTES[original].filter((t) => isAllowed(t, rules)));
  const unmetTag = SESSION_TAGS[original].find((tag) => rules.dislikes.includes(tag));
  if (subs.length > 0) {
    const liked = subs.filter((t) => SESSION_TAGS[t].some((tag) => rules.likes.includes(tag)));
    return { type: (liked[0] ?? subs[0])!, substitutedFrom: original };
  }
  return unmetTag
    ? { type: null, substitutedFrom: original, unmet: unmetTag }
    : { type: null, substitutedFrom: original };
}
