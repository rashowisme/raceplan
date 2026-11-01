/** All race guides (one page each). Add a guide: write its file and list it here. */
import { vingtKmDeParis } from "./20-km-de-paris";
import { amsterdamMarathon } from "./amsterdam-marathon";
import { barcelonaMarathon } from "./barcelona-marathon";
import { berlinMarathon } from "./berlin-marathon";
import { bostonMarathon } from "./boston-marathon";
import { chicagoMarathon } from "./chicago-marathon";
import { ecotrailParis30 } from "./ecotrail-paris-30-km";
import { londonMarathon } from "./london-marathon";
import { marathonDAnnecy } from "./marathon-d-annecy";
import { marathonDeLaRochelle } from "./marathon-de-la-rochelle";
import { marathonDeNantes } from "./marathon-de-nantes";
import { marathonDeParis } from "./marathon-de-paris";
import { marathonDeToulouse } from "./marathon-de-toulouse";
import { marathonNiceCannes } from "./marathon-nice-cannes";
import { marathonRunInLyon } from "./marathon-run-in-lyon";
import { marseilleCassis } from "./marseille-cassis";
import { newYorkCityMarathon } from "./new-york-city-marathon";
import { rotterdamMarathon } from "./rotterdam-marathon";
import { semiMarathonDeParis } from "./semi-marathon-de-paris";
import { tokyoMarathon } from "./tokyo-marathon";
import type { GuideLocale, RaceGuide } from "./types";
import { valenciaMarathon } from "./valencia-marathon";

export const RACE_GUIDES: readonly RaceGuide[] = [
  marathonDeParis,
  semiMarathonDeParis,
  ecotrailParis30,
  marathonDeNantes,
  marathonDAnnecy,
  marathonRunInLyon,
  vingtKmDeParis,
  marseilleCassis,
  marathonDeToulouse,
  marathonNiceCannes,
  marathonDeLaRochelle,
  // English: international marathons.
  londonMarathon,
  bostonMarathon,
  berlinMarathon,
  chicagoMarathon,
  newYorkCityMarathon,
  tokyoMarathon,
  valenciaMarathon,
  rotterdamMarathon,
  amsterdamMarathon,
  barcelonaMarathon,
];

export const getRaceGuide = (slug: string): RaceGuide | undefined =>
  RACE_GUIDES.find((g) => g.slug === slug);

/** Path of the guides section in each language that has guides. */
export const RACE_GUIDES_PATHS: Record<GuideLocale, string> = {
  fr: "/plan-entrainement",
  en: "/training-plans",
};

export const isGuideLocale = (locale: string): locale is GuideLocale => locale in RACE_GUIDES_PATHS;

/** Guides section path for a language, or undefined if it has no guides. */
export const raceGuidesPath = (locale: string): string | undefined =>
  isGuideLocale(locale) && RACE_GUIDES.some((g) => g.locale === locale)
    ? RACE_GUIDES_PATHS[locale]
    : undefined;

export const raceGuidePath = (g: RaceGuide) => `${RACE_GUIDES_PATHS[g.locale]}/${g.slug}`;

export type { GuideLocale, RaceGuide } from "./types";
