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

## Next

- M2: multi-step form (react-hook-form + Zod), EN/FR.
- M3: calendar view + localStorage.
- M4: VDOT-style and 80/20 methods (currently aliases of Balanced in `src/engine/methods/index.ts`), preference UI.
- M6: trail-specific workouts (time-based long runs, D+ progression, power hiking, downhill practice). Trail/custom already work through effort-km interpolation.

## Dev tools

- Print plans for review: `OUT=plans.txt STEPS=1 pnpm vitest run tests/unit/print-plans.test.ts` (optional `ONLY=<fixture>` or `SCENARIO='{"today":…,"profile":…}'`).
- More property runs: `PROPERTY_RUNS=2000 PROPERTY_SEED=1 pnpm vitest run tests/unit/safety.property.test.ts`.

## Known issues / to confirm with owner

- Two-run weeks use an even 50/50 split instead of the 30/40% long-run share (see decisions.md).
- Long runs plateau at 30% of weekly volume (e.g. 15 km at 50 km/week for a half) — spec-compliant but on the short side for some runners.
