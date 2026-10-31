import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getRaceGuide, raceGuidePath, RACE_GUIDES } from "@/content/races";
import type { Translate } from "@/features/plan-calendar/format";
import { guideData } from "@/features/race-guides/guide-data";
import { RaceGuidePage } from "@/features/race-guides/RaceGuidePage";
import { localePath, OG_LOCALES } from "@/lib/seo";

type Props = PageProps<"/[locale]/plan-entrainement/[slug]">;

/** Guides exist in one language each: only those pages are built. */
export const dynamicParams = false;

export function generateStaticParams() {
  return RACE_GUIDES.map((g) => ({ locale: g.locale, slug: g.slug }));
}

async function load(params: Props["params"]) {
  const { locale, slug } = await params;
  const guide = getRaceGuide(slug);
  if (!guide || guide.locale !== locale) notFound();
  const t = (await getTranslations({ locale })) as unknown as Translate;
  return { locale, guide, t, data: guideData(guide, t, locale) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, guide, t, data } = await load(params);
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

export default async function RaceGuideRoute({ params }: Props) {
  const { locale, guide, t, data } = await load(params);
  setRequestLocale(locale);
  return <RaceGuidePage guide={guide} data={data} t={t} locale={locale} />;
}
