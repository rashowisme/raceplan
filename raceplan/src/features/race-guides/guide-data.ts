/**
 * Everything a race guide page shows that is computed rather than written:
 * sample plans, preparation start dates, and the generated FAQ answers.
 */
import type { RaceGuide } from "@/content/races";
import { buildSamples, sampleRaceDate, type Sample } from "@/content/races/samples";
import { formatDateLong, type Translate } from "@/features/plan-calendar/format";
import { formatDistance } from "@/lib/units";

export interface GuideData {
  year: number;
  samples: Sample[];
  /** Samples from the longest to the shortest preparation. */
  byLength: Sample[];
  faq: { q: string; a: string }[];
}

export function guideData(g: RaceGuide, t: Translate, locale: string): GuideData {
  const samples = buildSamples(g);
  const year = Number(sampleRaceDate(g).slice(0, 4));
  const byLength = [...samples].sort((a, b) => b.persona.weeks - a.persona.weeks);
  const km = (m: number) => formatDistance(m, "km", locale, 0);
  const peaks = samples.map((s) => s.peakWeek.plannedVolumeM);
  const longs = samples.map((s) => s.longestRunM);

  const faq = [
    {
      q: t("raceGuide.faqStartQ", { name: g.name, year }),
      a: t(g.nextEdition.date ? "raceGuide.faqStartA" : "raceGuide.faqStartEstimated", {
        year,
        date: formatDateLong(locale, sampleRaceDate(g)),
        list: byLength
          .map((s) =>
            t("raceGuide.faqStartItem", {
              weeks: s.persona.weeks,
              date: formatDateLong(locale, s.startDate),
            }),
          )
          .join(locale === "fr" ? " ; " : "; "),
      }),
    },
    {
      q: t("raceGuide.faqVolumeQ", { name: g.name }),
      a: t("raceGuide.faqVolumeA", {
        minPeak: km(Math.min(...peaks)),
        maxPeak: km(Math.max(...peaks)),
        minLong: km(Math.min(...longs)),
        maxLong: km(Math.max(...longs)),
      }),
    },
    ...g.faq,
  ];
  return { year, samples, byLength, faq };
}
