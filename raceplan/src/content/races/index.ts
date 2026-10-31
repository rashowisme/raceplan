/** All race guides (one page each). Add a guide: write its file and list it here. */
import { vingtKmDeParis } from "./20-km-de-paris";
import { ecotrailParis30 } from "./ecotrail-paris-30-km";
import { marathonDAnnecy } from "./marathon-d-annecy";
import { marathonDeLaRochelle } from "./marathon-de-la-rochelle";
import { marathonDeNantes } from "./marathon-de-nantes";
import { marathonDeParis } from "./marathon-de-paris";
import { marathonDeToulouse } from "./marathon-de-toulouse";
import { marathonNiceCannes } from "./marathon-nice-cannes";
import { marathonRunInLyon } from "./marathon-run-in-lyon";
import { marseilleCassis } from "./marseille-cassis";
import { semiMarathonDeParis } from "./semi-marathon-de-paris";
import type { RaceGuide } from "./types";

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
];

export const getRaceGuide = (slug: string): RaceGuide | undefined =>
  RACE_GUIDES.find((g) => g.slug === slug);

/** Path of the guides section (French URL; guides are French for now). */
export const RACE_GUIDES_PATH = "/plan-entrainement";

export const raceGuidePath = (g: RaceGuide) => `${RACE_GUIDES_PATH}/${g.slug}`;

export type { RaceGuide } from "./types";
