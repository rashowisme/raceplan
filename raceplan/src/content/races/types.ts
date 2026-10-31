/**
 * Race guides: landing pages for well-known races ("plan d'entraînement
 * marathon de Paris"). Facts come from public sources (listed per race) and
 * must be checked by the owner before publishing; sample plans are computed
 * by the engine at build time, so every number on a page is real.
 *
 * Race names are used as plain text only: no logos, colours, sponsor names
 * or official wording, and every page says it is independent.
 */
import type { IsoDate, RaceType } from "@/engine/types";

export interface RaceGuide {
  /** URL segment, e.g. `marathon-de-paris`. */
  slug: string;
  /** Language of the page (guides are written for one language). */
  locale: "fr";
  /** Race name as written in text, e.g. "Marathon de Paris". */
  name: string;
  city: string;
  race: { type: RaceType; distanceM?: number; elevationGainM?: number };
  /** Next edition. `date` is null until it is announced. */
  nextEdition: {
    date: IsoDate | null;
    /** Used to compute sample plans when the date isn't announced yet. */
    estimatedDate: IsoDate;
    /** e.g. "début avril". */
    usualPeriod: string;
    /** e.g. "50e édition". */
    label?: string;
  };
  /** Short summary used in the hub and the meta description. */
  summary: string;
  /** Opening paragraph. */
  intro: string;
  /** Key facts shown as a list (label → value). */
  facts: { label: string; value: string }[];
  /** What this course asks of you, with how to train for it. */
  course: { title: string; body: string }[];
  /** Notes about the training calendar for this race (season, holidays, tune-up races). */
  calendar: { title: string; body: string }[];
  /** Race-specific questions (the generic ones are generated from the sample plans). */
  faq: { q: string; a: string }[];
  /** Where the facts come from. */
  sources: { label: string; url: string }[];
  /** Date the owner checked the facts; pages show it. Missing = not checked yet. */
  checkedOn?: IsoDate;
}
