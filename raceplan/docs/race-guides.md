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

## Research notes for the next guides (2026-10-31, to verify)

| Race | Next edition | Facts found | Sources |
|---|---|---|---|
| Semi-marathon de Paris | 7 March 2027 | Half marathon, lottery | [Sortir à Paris](https://www.sortiraparis.com/en/what-to-do-in-paris/sport-wellness/articles/210126-paris-half-marathon-2027-when-it-takes-place-and-how-to-register) |
| Marathon de Nantes | 25 April 2027 (sources say 24–26 for the weekend) | Start Machines de l'Île 9:15, finish Parc de la Beaujoire | [Nantes Métropole](https://metropole.nantes.fr/que-faire-a-nantes/agenda/inscriptions-imminentes-marathon-de-nantes-semi-marathon-foulees-de-lelephant-2027), [werun.world](https://werun.world/?p=14226) |
| Marathon du lac d'Annecy | April 2027 (17 or 18, unconfirmed) | Around the lake | [marathons.com](https://www.marathons.com/fr/events/marathon-du-lac-d-annecy_m8ZVe) |
| EcoTrail Paris (30 and 45 km) | 20 March 2027 | 30 km ≈ 500 m D+, 45 km ≈ 800 m D+ (third-party listing) | [werun.world](https://werun.world/?p=13541), [Reference Trail](https://reference-trail.fr/ecotrail-paris-2027-les-inscriptions-demarrent-doucement-pour-cette-20e-edition/) |
| Marseille–Cassis (20 km) | late October 2027, not announced (2026: 25 Oct) | Col de la Gineste 327 m, ~5 km climb, ~340 m D+ (sources vary 340–400), long descent to Cassis | [Stadion Actu](https://stadion-actu.fr/?p=150105), [Finishers](https://www.finishers.com/course/marseille-cassis) |
| Run in Lyon (marathon) | early October 2027, not announced (2026: 4 Oct) | 293 m D+, start Palais de Justice (Vieux-Lyon), finish place Bellecour, 5h30 limit | [marathons.com](https://www.marathons.com/en/run-in-lyon/run-in-lyon-2026-36-000-runners-expected-for-record-breaking-edition_o184) |
| 20 km de Paris | October 2027, not announced (2026: 10 or 11 Oct) | Start pont d'Iéna, Bois de Boulogne, finish near the Eiffel Tower | [Campus Coach](https://www.campus.coach/blog/analyse-du-parcours-des-20-km-de-paris) |
| Marathon de Toulouse | early November 2027, not announced (2026: 1 Nov) | ~130 m D+, 6 h limit | [marathons.com](https://www.marathons.com/en/toulouse-metropole-run-experience/harmonie-mutuelle-toulouse-metropole-run-experience-unveils-a-brand-new-course-for-2026_wv04) |
| Nice–Cannes marathon | November 2027, not announced (2026: 8 Nov) | Point to point along the coast, Promenade des Anglais → Croisette | [Côte d'Azur tourism](https://cotedazurfrance.fr/offres/marathon-des-alpes-maritimes-nice-cannes-cannes-fr-3595911/) |
| Marathon de Bordeaux | unknown (2026: 8 Nov, first since 2019) | Irregular history | [marathons.com](https://www.marathons.com/fr/10-km/marathon-de-bordeaux-le-grand-retour-en-2026-sept-ans-apres_qy5v) |
| Marathon de La Rochelle | late November 2027, not announced (2026: 29 Nov) | Flat, two loops | [Reference Trail](https://reference-trail.fr/marathon-de-la-rochelle-2026-guide-dinscription-complet/) |

Out of scope (engine limit ~60 km flat-equivalent effort): UTMB, SaintéLyon, long Templiers and
EcoTrail formats, Grand Raid. Road races with a climb (Marseille–Cassis) need personas for the
`custom` distance type; trails need `trail` personas.
