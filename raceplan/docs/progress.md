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
- **SEO:** canonical URLs, hreflang, sitemap, robots, translated social preview image, app manifest and icons, JSON-LD; plan page `noindex`. e2e test checks the head tags, robots.txt, sitemap and images.
- **Watch export (FIT):** "Download for my watch (.FIT)" in each workout dialog and "Watch files" (ZIP of upcoming workouts) in the plan header. Structured steps → FIT workout steps (repeats, distance/time durations, pace → speed targets, effort names in the plan language). Tests: `tests/unit/fit-export.test.ts` (independent decoder in `tests/unit/fit-decode.ts`), e2e downloads.
- **Adaptive plans, step 1 (spec §13):** "How did it go?" (done / missed / felt hard) on today's and past workouts; missed share and breaks adapt the following weeks (hold, extra cutback, restart at 100/75/50%, easy-only weeks, slower paces, `long_break` / `goal_reassess` warnings), with a note on each adapted week. Engine: `src/engine/adapt/` + `assemblePlan` hooks; checker log-aware. Backup file save/load ("Your data" card, empty plan page). Tests: `tests/unit/adapt.test.ts` (scenarios + week-by-week property test, verified on 18 seeds × 600), `src/storage/backup.test.ts`, e2e `tests/e2e/adapt.spec.ts`.

- **Adaptive plans, step 2 (spec §13.5):** "How do you feel?" card (tired or sore, pain or niggle, sick, injured, undo today's check-in); sick / injured pause the plan ("Plan paused" card, paused days in the calendar) until "I'm back"; "felt hard" twice in a week or a tired check-in → next week holds and one quality session becomes easy, twice in a row → cutback; pain → 7 days easy at 80%. Engine: `addCheckIn`, `undoCheckIn`, `openPause`; builder per-day adjustments. Tests: `tests/unit/checkins.test.ts` (scenarios + day-by-day property test, verified on 12 seeds × 500; step-1 property test re-run on 6 seeds × 500), backup with check-ins, e2e check-in flow.

## Next (not v1)

- Owner review of the items below, then deploy to Vercel. After choosing a domain, set `NEXT_PUBLIC_SITE_URL` (otherwise the Vercel production domain is used) and submit `/sitemap.xml` in Google Search Console.
- Future: accounts + EU DB (`ApiPlanRepository`), more languages.

## Dev tools

- Print plans for review: `OUT=plans.txt STEPS=1 pnpm vitest run tests/unit/print-plans.test.ts` (optional `ONLY=<fixture>` or `SCENARIO='{"today":…,"profile":…}'`).
- More property runs: `PROPERTY_RUNS=2000 PROPERTY_SEED=1 pnpm vitest run tests/unit/safety.property.test.ts`.

## Known issues / to confirm with owner

- FIT files are validated by tests only: try one on a real watch before announcing the feature.

- Trail long-run distances are flat-road estimates of a time-on-feet prescription.
