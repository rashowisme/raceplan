# CLAUDE.md — RacePlan

> Working name: **RacePlan** (rename freely). This file is the source of truth for this project. Read it fully before doing anything.

## 1. What we're building

A web app (mobile-first) that generates a **personalized, safe training plan** for an amateur runner who has a race coming up. The runner fills in a short form; the app produces a good-looking **weekly calendar** of workouts that can be **exported to PDF**.

- **Audience:** beginners *and* experienced amateurs preparing for a specific race.
- **Race types:** 5K, 10K, half marathon, marathon, custom road distance, and trail (distance + elevation gain).
- **Languages:** English and French at launch; adding a language must only require adding a messages file.
- **Units:** km / miles toggle everywhere.
- **No LLM / AI features.** Plan generation is 100% deterministic, rules-based code.

The detailed coaching logic (inputs, fitness estimation, safety rules, methods, workouts) lives in **`docs/training-spec.md`**. That spec is authoritative for the plan engine.

## 2. Scope

### v1 (build now)
- Multi-step input form (see spec §1), validated, mobile-friendly.
- Plan engine: deterministic `generatePlan()` producing a fixed plan.
- Plan style choice (Balanced default, VDOT-style, 80/20) + workout preferences (e.g. "I don't like short intervals").
- Weekly calendar view with pace zones, weekly volume, phase labels, warnings.
- PDF export of the plan.
- EN/FR, km/mi toggle.
- Plan kept **only in the browser** (localStorage) so a refresh doesn't lose it. No server-side storage of personal data.

### Not in v1 — but design so it can be added without rewrites
- User accounts + saved plans in a database (EU-hosted), editing and follow-up.
- Adaptive plans (missed runs, fatigue feedback).
- Export of workouts to Garmin (FIT workout files) and other platforms.
- More languages.

"Design for later" means: storage behind an interface, structured workout data (not free text), versioned plan schema, no assumptions that there is never a user.

## 3. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js (latest stable, App Router) + React, TypeScript **strict** |
| Package manager | pnpm |
| Styling / UI | Tailwind CSS + shadcn/ui components; lucide-react icons |
| Forms & validation | react-hook-form + Zod (Zod schemas shared with the engine) |
| i18n | next-intl, locale-prefixed routes (`/en/...`, `/fr/...`) |
| Dates | date-fns (weeks start Monday) |
| PDF | @react-pdf/renderer, generated client-side |
| Unit tests | Vitest + fast-check (property-based tests for safety rules) |
| E2E tests | Playwright (desktop + mobile viewport) |
| Lint/format | ESLint + Prettier |
| Hosting | Vercel, functions pinned to an EU region (Paris `cdg1`) |
| Future DB (not v1) | PostgreSQL in the EU (e.g. Supabase or Neon EU region) via Drizzle ORM; auth TBD |

Don't add dependencies beyond this list unless they clearly earn their place. Log any addition in `docs/decisions.md`.

## 4. Architecture

```
src/
  app/[locale]/              # routes: / (landing), /plan/new (form), /plan (result)
  engine/                    # PURE TypeScript plan engine — no React, no Next, no browser APIs
    types.ts                 # contracts: RunnerProfile, TrainingPlan, Workout, Step… (write first)
    schema.ts                # Zod schemas for inputs
    fitness/                 # performance → fitness (VDOT) estimation
    paces/                   # pace zones from fitness
    builder/                 # phases, weekly volume, day allocation, taper
    methods/                 # balanced, vdot, polarized-80-20
    workouts/                # workout library + preference filtering/substitution
    safety/                  # rule checks + warnings; also used as test oracles
    index.ts                 # public API: generatePlan(), validateProfile()
  features/
    plan-form/               # multi-step form
    plan-calendar/           # weekly calendar UI
    export/pdf/              # PDF document + download
  components/                # shared UI (shadcn lives in components/ui)
  lib/units.ts               # km/mi + pace formatting (the ONLY place conversions happen)
  storage/                   # PlanRepository interface + LocalStorageRepository (v1)
  i18n/                      # next-intl config
messages/en.json, messages/fr.json
tests/e2e/                   # Playwright
tests/fixtures/runners/      # sample runner profiles used across tests
docs/training-spec.md        # coaching logic (authoritative)
docs/decisions.md            # short log of decisions made autonomously
docs/progress.md             # current milestone, done / next, known issues
```

### Non-negotiable engine rules
1. **Pure and deterministic.** `generatePlan(profile, { today, locale-agnostic })` — same input → same output. Never call `Date.now()`, `Math.random()` or browser APIs inside `src/engine`. "Today" is passed in.
2. **Internal units are metric:** distances in **meters**, durations in **seconds**, paces in **seconds per km**. Conversion to miles / formatting happens only in `lib/units.ts` at display time.
3. **Structured workouts.** Every workout is a list of typed steps (warm-up, work, recovery, cool-down, repeat blocks) with a duration (distance or time) and a target (pace range or effort level). Never generate free-text workouts — this is what makes Garmin/FIT export possible later.
4. **No user-facing strings in the engine.** The engine returns translation keys + parameters (e.g. `{ key: "workout.tempo.title", params: {...} }`); the UI translates them.
5. **Versioned output.** `TrainingPlan` carries `schemaVersion`. Bump it on breaking changes.
6. **Warnings, not silent fixes.** When an input is risky or unrealistic, the engine still returns the safest reasonable plan *plus* structured warnings (or a structured refusal for blocking cases — see spec).
7. The engine runs client-side in v1, so no personal data ever leaves the browser.

### Storage
`storage/PlanRepository` is an interface (`save`, `load`, `list`, `delete`). v1 implements it with localStorage. A future `ApiPlanRepository` will talk to the DB — UI code must only depend on the interface.

## 5. Commands

```bash
pnpm dev            # local dev server
pnpm build          # production build
pnpm lint           # eslint
pnpm typecheck      # tsc --noEmit
pnpm test           # vitest (unit + property tests)
pnpm test:e2e       # playwright
pnpm check          # lint + typecheck + test (run before every commit)
```
Create these scripts during scaffolding if they don't exist.

## 6. How to work (autonomous mode)

The owner wants this project to run **on autopilot**. Don't ask for confirmation on routine decisions.

- Make sensible decisions yourself and record non-obvious ones in `docs/decisions.md` (date, decision, reason — 2–4 lines each).
- Only stop and ask the human for the items in **§8 Never** or when the spec is genuinely contradictory.
- Keep changes small and focused; finish one feature end-to-end before starting the next.
- **Definition of done** for any task: `pnpm check` passes, new logic has tests, UI works at 360px width, all new strings exist in both `en.json` and `fr.json`.

### Testing
- Engine: unit tests for every module **and** property-based tests (fast-check) asserting every safety invariant from spec §7 across random valid profiles.
- Fixtures: a set of sample runners in `tests/fixtures/runners/` (beginner 5K, experienced marathon, injury-prone 55-year-old half, trail 30 km / 1500 m D+, race in 2 weeks, race in 40 weeks, unrealistic goal, no performance data…). Snapshot their plans and review diffs deliberately.
- UI: component tests for non-trivial logic; Playwright smoke test of the full flow (form → plan → PDF download) on desktop and a mobile viewport.

### Git
- Commit after each working feature, only when `pnpm check` passes.
- Conventional commits: `feat(engine): …`, `fix(ui): …`, `test(engine): …`, `docs: …`.
- **Never push** and never force-push or rewrite history. The human pushes.

### UI / UX standards
- Mobile-first; must look polished on phones (360–430px) and desktop. The calendar is the hero of the product — make it genuinely nice: clear phase colors, today/race-day highlight, weekly totals, tap a day to see workout details.
- Accessible: real labels, visible focus, sufficient contrast, keyboard navigable.
- Paces and distances always respect the km/mi toggle, including in the PDF.
- Show a short, friendly disclaimer (not medical advice) on the plan and in the PDF.
- Beginners see effort descriptions ("easy, conversational") alongside paces.

## 7. Workflow and milestones

A single Claude Code session builds this project, one milestone at a time, in this order. Each milestone ends with `pnpm check` passing and a commit.

- **M0 Scaffold + contracts:** set up the Next.js app, tooling, scripts and folder structure. Write `src/engine/types.ts` and the Zod schemas first, and treat them as the contract between the engine and the UI. Add empty EN/FR message files and a first runner fixture.
- **M1 Engine core:** fitness estimate, pace zones, plan length and phases, volume progression, day allocation, taper and safety checks, with unit and property tests.
- **M2 Input form:** all steps, validation, EN/FR.
- **M3 Calendar view:** plus localStorage persistence.
- **M4 Methods and preferences:** Balanced / VDOT-style / 80-20, and workout preferences.
- **M5 PDF export.**
- **M6 Trail and custom distance.**
- **M7 QA pass:** review the fixture plans the way a coach would, run the full e2e tests on desktop and mobile, check that FR/EN are complete, polish the UI, and prepare for Vercel (EU region config, no secrets in the repo).

### Progress tracking
- Keep `docs/progress.md` up to date: the current milestone, what's done, what's next, and any known issues. Update it at the end of every milestone so a new session can pick up where the last one stopped.
- When starting a new session, read `docs/progress.md` and `docs/decisions.md` first, then continue with the next unfinished milestone.
- Plan a milestone briefly before coding it. For the engine milestones, re-read the relevant sections of `docs/training-spec.md` first.
- After finishing the engine (M1) and again at M7, review the plans for every fixture against the spec's safety rules, as if you were a running coach. Fix anything that looks wrong for a real runner, even if the tests pass.

## 8. Never (ask the human first)
- Add paid services, API keys, analytics, tracking or third-party cookies.
- Add any LLM/AI feature.
- Send or store runner data on a server (v1 is browser-only).
- `git push`, deploy, or change hosting settings.
- Delete files outside this project, or delete large parts of the project.
- Weaken or remove a safety rule in `docs/training-spec.md`.
- Use real brand logos/trademarks (Garmin, Strava…) in the UI.
- Commit secrets or `.env` files.
