# RacePlan

Personalized, safe training plans for amateur runners (5K → marathon, trail). Deterministic, rules-based, runs entirely in the browser. See `CLAUDE.md` (project brief) and `docs/training-spec.md` (coaching rules).

## Getting started

```bash
corepack enable        # provides pnpm
pnpm install
pnpm dev               # http://localhost:3000/en
```

## Scripts

| Command                     | What it does                                                                     |
| --------------------------- | -------------------------------------------------------------------------------- |
| `pnpm dev`                  | Dev server                                                                       |
| `pnpm build` / `pnpm start` | Production build / serve                                                         |
| `pnpm lint`                 | ESLint                                                                           |
| `pnpm typecheck`            | Route types + `tsc --noEmit`                                                     |
| `pnpm test`                 | Vitest unit + property tests                                                     |
| `pnpm test:e2e`             | Playwright (desktop + mobile); first run `pnpm exec playwright install chromium` |
| `pnpm check`                | lint + typecheck + test — run before every commit                                |
| `pnpm format`               | Prettier                                                                         |

## Layout

- `src/engine` — pure plan engine (`generatePlan`, `validateProfile`)
- `src/features` — form, calendar, PDF export
- `src/lib/units.ts` — the only place unit conversion happens
- `src/storage` — `PlanRepository` interface (localStorage in v1)
- `messages/{en,fr}.json` — translations; add a locale in `src/i18n/routing.ts` + a messages file
- `docs/` — spec, decisions, progress
