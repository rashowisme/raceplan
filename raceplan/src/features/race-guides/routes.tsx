/**
 * Shared logic of the race guide routes. Each language has its own URL
 * (`/fr/plan-entrainement/…`, `/en/training-plans/…`); a route folder only
 * serves the guides whose language uses that path, everything else is a 404.
 */
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getRaceGuide, raceGuidePath, RACE_GUIDES, RACE_GUIDES_PATHS } from "@/content/races";
import { sampleRaceDate } from "@/content/races/samples";
import { formatDateLong, type Translate } from "@/features/plan-calendar/format";
import { Link } from "@/i18n/navigation";
import { localePath, OG_LOCALES } from "@/lib/seo";
import { guideData } from "./guide-data";
import { RaceGuidePage } from "./RaceGuidePage";

/** Guides served under `base` for this language. */
const guidesAt = (base: string, locale: string) =>
  RACE_GUIDES.filter((g) => g.locale === locale && RACE_GUIDES_PATHS[g.locale] === base);

type HubParams = Promise<{ locale: string }>;
type GuideParams = Promise<{ locale: string; slug: string }>;

export async function hubMetadata(base: string, params: HubParams): Promise<Metadata> {
  const { locale } = await params;
  if (guidesAt(base, locale).length === 0) return {};
  const t = await getTranslations({ locale, namespace: "raceGuide" });
  const title = t("hubTitle");
  const description = t("hubMetaDescription");
  const url = localePath(locale, base);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

/** The list of race guides of one language. */
export async function GuideHub({ base, params }: { base: string; params: HubParams }) {
  const { locale } = await params;
  const guides = guidesAt(base, locale);
  if (guides.length === 0) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "raceGuide" });
  const sorted = [...guides].sort((a, b) => sampleRaceDate(a).localeCompare(sampleRaceDate(b)));
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {t("hubTitle")}
        </h1>
        <p className="text-muted-foreground text-base text-pretty">{t("hubIntro")}</p>
      </header>
      <ul className="space-y-3">
        {sorted.map((g) => (
          <li key={g.slug}>
            <Link
              href={raceGuidePath(g)}
              className="bg-card hover:bg-muted/60 focus-visible:ring-ring flex items-center gap-3 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{g.name}</span>
                <span className="text-muted-foreground block text-sm">
                  {g.nextEdition.date
                    ? formatDateLong(locale, g.nextEdition.date)
                    : t("dateUnknown", {
                        year: sampleRaceDate(g).slice(0, 4),
                        period: g.nextEdition.usualPeriod,
                      })}
                </span>
                <span className="text-muted-foreground mt-1 block text-sm">{g.summary}</span>
              </span>
              <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Only the guides of this path are built (`dynamicParams = false` in the routes). */
export const guideStaticParams = (base: string) =>
  RACE_GUIDES.filter((g) => RACE_GUIDES_PATHS[g.locale] === base).map((g) => ({
    locale: g.locale,
    slug: g.slug,
  }));

async function load(base: string, params: GuideParams) {
  const { locale, slug } = await params;
  const guide = getRaceGuide(slug);
  if (!guide || guide.locale !== locale || RACE_GUIDES_PATHS[guide.locale] !== base) notFound();
  const t = (await getTranslations({ locale })) as unknown as Translate;
  return { locale, guide, t, data: guideData(guide, t, locale) };
}

export async function guideMetadata(base: string, params: GuideParams): Promise<Metadata> {
  const { locale, guide, t, data } = await load(base, params);
  const weeks = data.samples.map((s) => s.persona.weeks);
  const title = t("raceGuide.title", { name: guide.name, year: data.year });
  const description = t("raceGuide.metaDescription", {
    summary: guide.summary,
    minWeeks: Math.min(...weeks),
    maxWeeks: Math.max(...weeks),
    year: data.year,
  });
  const url = localePath(locale, raceGuidePath(guide));
  return {
    title,
    description,
    // One language only: canonical, no hreflang alternates.
    alternates: { canonical: url },
    openGraph: { title, description, url, locale: OG_LOCALES[locale], type: "article" },
  };
}

export async function Guide({ base, params }: { base: string; params: GuideParams }) {
  const { locale, guide, t, data } = await load(base, params);
  setRequestLocale(locale);
  return <RaceGuidePage guide={guide} data={data} t={t} locale={locale} />;
}
