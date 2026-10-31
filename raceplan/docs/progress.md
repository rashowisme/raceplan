# Progress

## Current milestone

M2 — Input form (next)

## Done

- **M0 Scaffold + contracts:** Next.js 16 (App Router, TS strict, Tailwind 4, shadcn/ui), next-intl with `/en` `/fr`, Vitest + fast-check, Playwright config, ESLint + Prettier, `pnpm check`. Engine contracts in `src/engine/types.ts`, Zod input schemas in `src/engine/schema.ts`, tunables in `src/engine/config.ts`. `lib/units.ts`, `storage/PlanRepository` interface.
- **M1 Engine core:** `generatePlan()` / `validateProfile()` in `src/engine/index.ts`.
  - fitness (VDOT, PR ageing, watch penalty, target ambition), Daniels pace zones, effort-only mode + time trial
  - plan frame (length, maintenance block > 24 weeks, phases, taper, mini plan < 3 weeks)
  - incremental volume progression with cutbacks, long-run progression and caps
  - day layout solver (no back-to-back hard days incl. across weeks, rest days, age ≥ 50 rules)
  - workout library (structured steps) + session selection with substitutions (preferences + injury constraints)
  - safety checker `checkPlan()` = test oracle
  - tests: unit tests per module, fast-check property test of all §7 invariants (400 runs, verified on 10 seeds × 600), 13 runner fixtures with reviewed text snapshots in `tests/fixtures/plans/`.
- **M3 Calendar view:** `/[locale]/plan` reads the stored plan (follows changes across tabs): header with stats and countdown, warnings + coaching notes, phase timeline (tap to jump), pace-zones card with effort descriptions (effort-only variant), week cards (7-column grid on desktop, day list on mobile, phase colours, cutback/race badges, weekly totals, today highlight, "This week" jump), workout dialog with structured steps, paces in the chosen unit, notes. `features/plan-calendar/format.ts` turns engine keys/params into text (shared with the PDF). Tests: formatter, every engine key translated + formatted in EN/FR × km/mi (fixtures + random plans).
- **M4 Methods and preferences:** `methods/vdot.ts` (Daniels-style phase order) and `methods/polarized.ts` (80/20, Z1–Z3 labels) next to Balanced; preferences (likes favoured, dislikes substituted with a similar stimulus, track → road intervals) already applied by the engine and collected by the form. Tests: every style safe on every fixture, styles differ, 80/20 easy share, likes favoured, property test that disliked sessions only appear with a `preference_unmet` warning.
- **M5 PDF export:** "Export PDF" on the plan page renders `features/export/pdf/PlanDocument.tsx` client-side (lazy import), same formatter as the screen (language + km/mi), summary page (stats, paces, warnings, advice, phases) + weekly calendar pages, disclaimer + page numbers in the footer. Tests render EN/km and FR/mi PDFs and check the character set.

## Next

- M2: multi-step form (react-hook-form + Zod), EN/FR.
- M3: calendar view + localStorage.
- M6: trail-specific workouts (time-based long runs, D+ progression, power hiking, downhill practice). Trail/custom already work through effort-km interpolation.

## Dev tools

- Print plans for review: `OUT=plans.txt STEPS=1 pnpm vitest run tests/unit/print-plans.test.ts` (optional `ONLY=<fixture>` or `SCENARIO='{"today":…,"profile":…}'`).
- More property runs: `PROPERTY_RUNS=2000 PROPERTY_SEED=1 pnpm vitest run tests/unit/safety.property.test.ts`.

## Known issues / to confirm with owner

- Two-run weeks use an even 50/50 split instead of the 30/40% long-run share (see decisions.md).
- Long runs plateau at 30% of weekly volume (e.g. 15 km at 50 km/week for a half) — spec-compliant but on the short side for some runners.
