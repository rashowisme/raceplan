import type { RunnerProfile } from "@/engine/types";
import { beginner5k } from "./beginner-5k";

export { FIXTURE_TODAY } from "./today";

/** All sample runners, keyed by a stable name (used for snapshots). */
export const RUNNER_FIXTURES: Record<string, RunnerProfile> = {
  beginner5k,
};
