# Decisions

Short log of decisions made autonomously (date — decision — reason).

- **2026-10-31 — App lives in `raceplan/`, git repo is the parent folder.** The brief was committed as `raceplan/…` in `raceplan-starter/`; kept that layout instead of moving the repo root.
- **2026-10-31 — Next.js 16.4 without `cacheComponents` / `partialPrefetching`.** create-next-app enables these experimental flags; next-intl's static rendering (`setRequestLocale`) is simpler without them and the app is mostly client-side (form, localStorage, PDF).
- **2026-10-31 — `proxy.ts` instead of `middleware.ts`.** Next 16 renamed the convention; next-intl's `createMiddleware` is exported from `src/proxy.ts`.
- **2026-10-31 — Replaced the `cn` npm package with the classic `clsx` + `tailwind-merge` helper.** The shadcn CLI pulled a new 3.5k-line compiler package for a 2-line helper; both libs it replaces were already in the stack. `shadcn` is a dev dependency (only its CSS is imported at build time).
- **2026-10-31 — Extra dev deps:** `@vitejs/plugin-react`, `jsdom`, `@testing-library/react|dom` (component tests), `eslint-config-prettier` (Prettier + ESLint), `tw-animate-css` + `radix-ui` (pulled in by shadcn/ui components).
- **2026-10-31 — Engine purity enforced by ESLint** (`no-restricted-syntax` on `Date.now()`, `new Date()`, `Math.random()`, banned browser globals and React/Next imports in `src/engine`).
- **2026-10-31 — Weekdays are string codes `mon…sun`; dates are ISO `YYYY-MM-DD` strings** in the engine contract, so plans serialize to JSON/localStorage losslessly and are timezone-free.
- **2026-10-31 — Elevation is shown in feet when the mile unit is selected.** Matches what imperial users expect; conversion still only happens in `lib/units.ts`.
