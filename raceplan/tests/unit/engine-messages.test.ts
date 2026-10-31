/**
 * Every translation key / param the engine can emit must exist and format
 * cleanly in every locale (fixtures + random plans).
 */
import fc from "fast-check";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { generatePlan } from "@/engine";
import type { TrainingPlan, WorkoutStep } from "@/engine/types";
import {
  formatMessage,
  formatWarning,
  stepLines,
  type Formatter,
  type Translate,
} from "@/features/plan-calendar/format";
import { routing } from "@/i18n/routing";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../fixtures/runners";
import { scenarioArb } from "./arbitraries";

const MESSAGES = { en, fr } as const;

function formatterFor(
  locale: keyof typeof MESSAGES,
  unit: "km" | "mi",
  errors: string[],
): Formatter {
  const t = createTranslator({
    locale,
    messages: MESSAGES[locale],
    onError: (e) => errors.push(`${locale}: ${e.message}`),
  });
  return { t: t as unknown as Translate, locale, unit, zoneLabels: "daniels" };
}

function renderEverything(plan: TrainingPlan, f: Formatter): string[] {
  const out: string[] = [f.t(plan.disclaimer.key)];
  plan.warnings.forEach((w) => out.push(formatWarning(f, w)));
  plan.adviceNotes.forEach((n) => out.push(formatMessage(f, n)));
  for (const w of plan.weeks) {
    out.push(f.t(`phase.${w.phase}`));
    for (const d of w.days) {
      if (!d.workout) continue;
      out.push(formatMessage(f, d.workout.title), f.t(`workoutType.${d.workout.type}`));
      out.push(f.t(`intensity.${d.workout.intensity}`));
      d.workout.notes.forEach((n) => out.push(formatMessage(f, n)));
      const walk = (steps: WorkoutStep[]) =>
        steps.forEach((s) =>
          s.kind === "repeat" ? walk(s.steps) : out.push(f.t(`effort.${s.target.effort}.desc`)),
        );
      walk(d.workout.steps);
      stepLines(f, d.workout.steps).forEach((l) => out.push(l.label, l.target ?? "", l.zone ?? ""));
    }
  }
  return out;
}

function check(plan: TrainingPlan) {
  for (const locale of routing.locales) {
    for (const unit of ["km", "mi"] as const) {
      const errors: string[] = [];
      const texts = renderEverything(plan, formatterFor(locale, unit, errors));
      expect(errors).toEqual([]);
      for (const s of texts) {
        // No raw keys or unformatted ICU placeholders leaking into the UI.
        expect(s).not.toMatch(/\{[a-zA-Z]+\}/);
        expect(s).not.toMatch(/^[a-z]+(\.[a-zA-Z0-9_]+)+$/);
      }
    }
  }
}

describe("engine output is fully translated", () => {
  it.each(Object.entries(RUNNER_FIXTURES))("fixture %s", (_name, profile) => {
    const r = generatePlan(profile, { today: FIXTURE_TODAY });
    if (!r.ok) throw new Error(r.refusal.code);
    check(r.plan);
  });

  it("random plans", () => {
    fc.assert(
      fc.property(scenarioArb, ({ today, profile }) => {
        const r = generatePlan(profile, { today });
        if (r.ok) check(r.plan);
      }),
      { numRuns: 60, seed: 11 },
    );
  });
});
