import type { RunnerProfile } from "@/engine/types";
import { beginner5k } from "./beginner-5k";
import * as road from "./road";
import { steepTrail25k, trail30k } from "./trail";

export { FIXTURE_TODAY } from "./today";

/** All sample runners, keyed by a stable name (used for snapshots). */
export const RUNNER_FIXTURES: Record<string, RunnerProfile> = {
  beginner5k,
  ...road,
  trail30k,
  steepTrail25k,
};
