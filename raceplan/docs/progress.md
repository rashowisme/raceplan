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
- **M6 Trail and custom distance:** time-based trail long runs with progressive D+ targets, uphill repeats (power hiking on steep courses), downhill practice in the specific phase (not with knee/ITB history), effort-based trail race day, week D+ in calendar + PDF. Custom road distances interpolate between standard distances. New fixture `steepTrail25k`; tests in `tests/unit/trail-custom.test.ts`.
- **M7 QA pass:** coach review of all fixture plans (fixed: long run dropping at the 30 km threshold, taper sharpening, recovery runs without strides, trail race-day pace); Playwright e2e on desktop + mobile (form → plan → dialog → PDF download, reload persistence, km/mi, FR, injured block, empty state, no overflow at 360px); EN/FR completeness tests; unused deps removed; mobile "My plan" link; security headers; `vercel.json` (cdg1).
- **Dark mode (post-v1):** header toggle cycling system → light → dark (localStorage `raceplan.theme`), applied before first paint by an inline script, live OS-preference following in system mode; dark values for brand, phase, success and warning colours. PDF stays light (print). Tests: `tests/unit/theme.test.ts`, e2e theme test; messages test now parses ICU `select`.
- **Owner review (2026-10-31):** two-run 50/50 split and post-cutback rule confirmed; long-run share raised 30% → 33% (spec §7.6 updated); even-split rule generalised to any run count (fixes 3-day runners losing volume).
- **Time trial result entry:** effort-only plans show a "Ran your time trial?" card (also reachable from the time trial workout). The result becomes a fitness source (`profile.timeTrialResult`, Riegel to race distance, aged like a PR); `applyTimeTrialResult()` keeps started weeks and rebuilds later ones with paces, the builder continuing from the kept weeks (`assemblePlan(..., keptWeeks)`). The result is kept when answers are edited. Tests: `tests/unit/time-trial.test.ts` (incl. property test), e2e flow.

## Next (not v1)

- Owner review of the items below, then deploy to Vercel.
- Future: accounts + EU DB (`ApiPlanRepository`), adaptive plans, FIT export, more languages.

## Dev tools

- Print plans for review: `OUT=plans.txt STEPS=1 pnpm vitest run tests/unit/print-plans.test.ts` (optional `ONLY=<fixture>` or `SCENARIO='{"today":…,"profile":…}'`).
- More property runs: `PROPERTY_RUNS=2000 PROPERTY_SEED=1 pnpm vitest run tests/unit/safety.property.test.ts`.

## Known issues / to confirm with owner

- Trail long-run distances are flat-road estimates of a time-on-feet prescription.
