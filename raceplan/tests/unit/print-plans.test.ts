/**
 * Dev tool (skipped unless OUT is set): renders fixture plans — or a JSON
 * scenario `{ today, profile }` from SCENARIO — to a text file for review.
 *
 *   OUT=plans.txt STEPS=1 pnpm vitest run tests/unit/print-plans.test.ts
 */
import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { checkPlan, generatePlan } from "@/engine";
import type { RunnerProfile } from "@/engine/types";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../fixtures/runners";
import { planToText } from "./plan-text";

it.skipIf(!process.env.OUT)("print plans", () => {
  const out: string[] = [];
  const scenario = process.env.SCENARIO
    ? (JSON.parse(process.env.SCENARIO) as { today: string; profile: RunnerProfile })
    : null;
  const entries: [string, RunnerProfile, string][] = scenario
    ? [["scenario", scenario.profile, scenario.today]]
    : Object.entries(RUNNER_FIXTURES)
        .filter(([name]) => !process.env.ONLY || process.env.ONLY === name)
        .map(([name, p]) => [name, p, FIXTURE_TODAY]);
  for (const [name, profile, today] of entries) {
    const r = generatePlan(profile, { today });
    if (!r.ok) {
      out.push(`=== ${name} REFUSED ${JSON.stringify(r.refusal)}`);
      continue;
    }
    out.push(`=== ${name}\n${planToText(r.plan, process.env.STEPS === "1")}`);
    out.push(`violations ${JSON.stringify(checkPlan(r.plan), null, 1)}`);
  }
  writeFileSync(process.env.OUT!, out.join("\n"));
});
