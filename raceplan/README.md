# RacePlan

Personalized, safe training plans for amateur runners — 5K to marathon, custom road distances and trail. Deterministic, rules-based (no AI), runs entirely in the browser: no account, no server-side data.

- Brief: `CLAUDE.md` · Coaching rules: `docs/training-spec.md`
- Decisions log: `docs/decisions.md` · Status: `docs/progress.md`

## Getting started

```bash
corepack enable                          # provides pnpm
pnpm install
pnpm dev                                 # http://localhost:3000/en
pnpm exec playwright install chromium    # once, for e2e tests
```

## Scripts

| Command                     | What it does                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm dev`                  | Dev server                                                                                 |
| `pnpm build` / `pnpm start` | Production build / serve                                                                   |
| `pnpm lint`                 | ESLint (also enforces engine purity: no clock, randomness or browser APIs in `src/engine`) |
| `pnpm typecheck`            | Route types + `tsc --noEmit`                                                               |
| `pnpm test`                 | Vitest: unit, component, property-based safety tests, fixture snapshots                    |
| `pnpm test:e2e`             | Playwright on desktop + mobile (builds and serves on port 3100)                            |
| `pnpm check`                | lint + typecheck + test — run before every commit                                          |
| `pnpm format`               | Prettier                                                                                   |

## How it fits together

- `src/engine` — pure plan engine. `generatePlan(profile, { today })` → plan or structured refusal; `applyTimeTrialResult(plan, result, { today })` adds paces to an effort-only plan; `checkPlan(plan)` checks every safety invariant (also the test oracle). Tunables live in `src/engine/config.ts`.
- `src/features/plan-form` — 5-step form (react-hook-form + Zod, shared engine schema).
- `src/features/plan-calendar` — plan page, calendar, workout details; `format.ts` turns engine translation keys into text.
- `src/features/export/pdf` — client-side PDF (react-pdf, built-in fonts).
- `src/storage` — `PlanRepository` interface; v1 = `LocalStorageRepository`.
- `src/lib/units.ts` — the only place km/mi conversion and formatting happen.
- `messages/{en,fr}.json` — translations. Add a language: add its code in `src/i18n/routing.ts` and a messages file (tests check keys/placeholders match).

## Reviewing plans

Fixture runners live in `tests/fixtures/runners/`; their plans are snapshotted as readable text in `tests/fixtures/plans/*.txt`. Review diffs deliberately, then `pnpm vitest run -u tests/unit/fixtures.test.ts`.

```bash
OUT=plans.txt STEPS=1 pnpm vitest run tests/unit/print-plans.test.ts          # all fixtures
OUT=plans.txt SCENARIO='{"today":"2026-10-31","profile":{...}}' pnpm vitest run tests/unit/print-plans.test.ts
PROPERTY_RUNS=2000 PROPERTY_SEED=1 pnpm vitest run tests/unit/safety.property.test.ts
```

## Deployment (Vercel)

`vercel.json` pins functions to Paris (`cdg1`). No environment variables or secrets are needed; nothing is stored server-side. Deploying is done by the owner (`vercel` / Git integration).
