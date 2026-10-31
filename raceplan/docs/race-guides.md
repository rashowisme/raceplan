# Race guides (SEO landing pages)

One page per well-known race, e.g. `/fr/plan-entrainement/marathon-de-paris`, for searches
like "plan d'entraînement marathon de Paris". Hub: `/fr/plan-entrainement`.

## Rules

- **Useful, not doorway pages.** Each page must say things that are only true for that race:
  course demands, its training calendar (season, holidays, tune-up races), and sample plans
  computed by the engine for its next edition. Tests require a minimum amount of race-specific
  text, at least 2 course notes, 2 calendar notes, 1 race FAQ and 1 source.
- **No trademarks beyond the race name in plain text.** No logos, colours, photos, sponsor names
  (tests reject a list of brands) or official wording. Every page says it is independent.
- **Facts from sources, checked by the owner.** Each guide lists its sources. Until `checkedOn`
  is set, the page says the information must be confirmed on the official website.
- **Next edition only.** Pages target the next edition. If its date isn't announced, set
  `date: null`, give the usual period and an `estimatedDate` (used only to compute samples; the
  page shows "date not announced yet").

## Add a race

1. Write `src/content/races/<slug>.ts` (see `marathon-de-paris.ts`) and list it in
   `src/content/races/index.ts`.
2. If the race type has no personas yet (only `marathon` so far), add three in
   `src/content/races/samples.ts`. Check their plans read well (no odd weeks, no warnings).
3. `pnpm test` (content checks, sample plans pass `checkPlan`, sitemap), then look at the page
   at 360px.

Each year: update `nextEdition` once the new date is announced (the test fails once a race date
is in the past relative to the test fixture date).

## Published guides (facts to check before going live)

| Guide | Next edition | Points to verify on the official site |
|---|---|---|
| Marathon de Paris | 4 April 2027 | New 2027 course |
| Semi-marathon de Paris | 7 March 2027 | Course (start/finish), elevation (sources say 60 or 166 m) |
| EcoTrail Paris 30 km | 20 March 2027 | Start, finish point, D+ (sources 437–1,200 m; page says ~500 m) |
| Marathon de Nantes | 25 April 2027 | Elevation (sources 95 or 230 m; page avoids a figure) |
| Marathon du lac d'Annecy | not announced (est. 18 April 2027) | Date; elevation (~80–100 m) |
| Marathon du Run In Lyon | not announced (est. 3 October 2027) | Date; course; time limit |
| 20 km de Paris | not announced (est. 10 October 2027) | Date; the climb near km 6 |
| Marseille-Cassis | not announced (est. 31 October 2027) | Date; D+ (~340 m); time barriers |
| Marathon de Toulouse | not announced (est. 31 October 2027) | Date; course; time limit |
| Marathon Nice-Cannes | not announced (est. 7 November 2027) | Date; D+ (organiser: 100 m) |
| Marathon de La Rochelle | not announced (est. 28 November 2027) | Date; start |

Sample runners: marathon, half marathon, other road distances (`custom`, ~20 km, no time goals) and
trail (~30 km). Hilly courses (Marseille-Cassis, Lyon, EcoTrail) plan the samples with a preference
for hill sessions (`likes`). The six flat marathon pages share the same three sample runners (only
dates differ); their written content is what sets them apart.

Not covered: Marathon de Bordeaux (irregular dates). Out of scope (engine limit ~60 km
flat-equivalent effort): UTMB, SaintéLyon, long Templiers and EcoTrail formats, Grand Raid.
