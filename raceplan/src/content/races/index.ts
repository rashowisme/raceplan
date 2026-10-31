/** All race guides (one page each). Add a guide: write its file and list it here. */
import { marathonDeParis } from "./marathon-de-paris";
import type { RaceGuide } from "./types";

export const RACE_GUIDES: readonly RaceGuide[] = [marathonDeParis];

export const getRaceGuide = (slug: string): RaceGuide | undefined =>
  RACE_GUIDES.find((g) => g.slug === slug);

/** Path of the guides section (French URL; guides are French for now). */
export const RACE_GUIDES_PATH = "/plan-entrainement";

export const raceGuidePath = (g: RaceGuide) => `${RACE_GUIDES_PATH}/${g.slug}`;

export type { RaceGuide } from "./types";
