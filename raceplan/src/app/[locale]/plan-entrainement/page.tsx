import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { raceGuidePath, RACE_GUIDES, RACE_GUIDES_PATH } from "@/content/races";
import { sampleRaceDate } from "@/content/races/samples";
import { formatDateLong } from "@/features/plan-calendar/format";
import { Link } from "@/i18n/navigation";
import { localePath } from "@/lib/seo";

type Props = PageProps<"/[locale]/plan-entrainement">;

const guidesFor = (locale: string) => RACE_GUIDES.filter((g) => g.locale === locale);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "raceGuide" });
  const title = t("hubTitle");
  const description = t("hubMetaDescription");
  const url = localePath(locale, RACE_GUIDES_PATH);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
  };
}

/** The list of race guides (only languages that have guides). */
export default async function RaceGuidesHub({ params }: Props) {
  const { locale } = await params;
  const guides = guidesFor(locale);
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
