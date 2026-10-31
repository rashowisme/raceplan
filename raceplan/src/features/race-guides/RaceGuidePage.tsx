import { CalendarDays, ChevronRight, Info } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { raceGuidePath, RACE_GUIDES_PATH, type RaceGuide } from "@/content/races";
import { sampleRaceDate, type Sample } from "@/content/races/samples";
import { WEEKDAYS } from "@/engine/types";
import {
  formatDate,
  formatDateLong,
  formatMessage,
  type Formatter,
  type Translate,
} from "@/features/plan-calendar/format";
import { Link } from "@/i18n/navigation";
import { localePath, SITE_URL } from "@/lib/seo";
import { formatClock, formatDistance } from "@/lib/units";
import { cn } from "@/lib/utils";
import type { GuideData } from "./guide-data";
import { DateTile, PhaseLegend, phasesIn, PrepTimeline, WeeklyVolumeChart } from "./visuals";

const jsonLd = (data: unknown) => ({
  // `<` is escaped so the JSON can never close the script tag.
  __html: JSON.stringify(data).replace(/</g, "\\u003c"),
});

/** A race landing page: facts, course notes, calendar, sample plans, FAQ. */
export function RaceGuidePage({
  guide: g,
  data,
  t,
  locale,
}: {
  guide: RaceGuide;
  data: GuideData;
  t: Translate;
  locale: string;
}) {
  const f: Formatter = { t, locale, unit: "km", zoneLabels: "daniels" };
  const km = (m: number) => formatDistance(m, "km", locale, 0);
  const abs = (path: string) => new URL(localePath(locale, path), SITE_URL).href;
  const edition = g.nextEdition;
  const dateText = edition.date
    ? formatDateLong(locale, edition.date)
    : t("raceGuide.dateUnknown", { year: data.year, period: edition.usualPeriod });
  const longest = data.byLength[0];
  const shortest = data.byLength.at(-1);
  const ctaHref = `/plan/new?course=${g.slug}`;
  const weeks = data.samples.map((s) => s.persona.weeks);
  const minWeeks = Math.min(...weeks);
  const maxWeeks = Math.max(...weeks);
  const distanceText = formatDistance(
    data.samples[0]?.plan.summary.raceDistanceM ?? 0,
    "km",
    locale,
    3,
  );

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("raceGuide.breadcrumbHome"), item: abs("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: t("raceGuide.breadcrumbHub"),
        item: abs(RACE_GUIDES_PATH),
      },
      { "@type": "ListItem", position: 3, name: g.name, item: abs(raceGuidePath(g)) },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((x) => ({
      "@type": "Question",
      name: x.q,
      acceptedAnswer: { "@type": "Answer", text: x.a },
    })),
  };

  const cta = (
    <Link
      href={ctaHref}
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-auto min-h-12 w-full px-5 py-3 text-base whitespace-normal sm:w-auto",
      )}
    >
      <CalendarDays aria-hidden />
      {t("raceGuide.ctaButton", { name: g.name })}
    </Link>
  );

  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 px-4 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumb)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqLd)} />

      <header className="space-y-5">
        <nav aria-label={t("raceGuide.breadcrumbHub")} className="text-muted-foreground text-sm">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-foreground underline-offset-4 hover:underline">
                {t("raceGuide.breadcrumbHome")}
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden />
            <li>
              <Link
                href={RACE_GUIDES_PATH}
                className="hover:text-foreground underline-offset-4 hover:underline"
              >
                {t("raceGuide.breadcrumbHub")}
              </Link>
            </li>
          </ol>
        </nav>
        <div className="from-primary/10 via-phase-base/5 rounded-2xl bg-gradient-to-br to-transparent p-5 sm:p-7">
          {/* Phones: title full width under the date; wider screens: beside it. */}
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
            {edition.date && (
              <div className="sm:row-span-2">
                <DateTile date={edition.date} locale={locale} />
              </div>
            )}
            <p
              className={cn(
                "text-primary text-sm font-semibold sm:self-end",
                !edition.date && "col-span-2",
              )}
            >
              {g.city}
              {edition.label && ` · ${edition.label}`}
              {!edition.date && ` · ${dateText}`}
            </p>
            <h1
              className={cn(
                "col-span-2 text-3xl font-bold tracking-tight text-balance sm:col-span-1 sm:self-start sm:text-4xl",
                !edition.date && "sm:col-span-2",
              )}
            >
              {t("raceGuide.title", { name: g.name, year: data.year })}
            </h1>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label={t("raceGuide.heroDistance")} value={distanceText} />
            <Stat
              label={t("raceGuide.heroWeeks")}
              value={t("raceGuide.heroWeeksValue", { min: minWeeks, max: maxWeeks })}
            />
            {longest && shortest && (
              <Stat
                className="col-span-2 sm:col-span-1"
                label={t("raceGuide.factStart")}
                value={`${formatDate(locale, longest.startDate, { day: "numeric", month: "short" })} – ${formatDate(locale, shortest.startDate, { day: "numeric", month: "short", year: "numeric" })}`}
              />
            )}
          </dl>
        </div>
        <p className="text-muted-foreground text-base text-pretty sm:text-lg">{g.intro}</p>
        <p className="text-muted-foreground flex gap-2 text-xs">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {t("raceGuide.independent")}
        </p>
      </header>

      <section aria-labelledby="facts-title" className="bg-card rounded-xl border p-5">
        <h2 id="facts-title" className="font-semibold">
          {t("raceGuide.factsTitle")}
        </h2>
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Fact label={t("raceGuide.factDate")} value={dateText} />
          {g.facts.map((x) => (
            <Fact key={x.label} label={x.label} value={x.value} />
          ))}
        </dl>
      </section>

      <section className="bg-primary/5 space-y-3 rounded-xl p-5">
        <h2 className="text-lg font-bold">{t("raceGuide.ctaTitle", { name: g.name })}</h2>
        <p className="text-sm">{t("raceGuide.ctaBody")}</p>
        {cta}
      </section>

      <Prose id="course" title={t("raceGuide.courseTitle")} items={g.course} />
      <section aria-labelledby="calendar-title" className="space-y-4">
        <h2 id="calendar-title" className="text-xl font-bold">
          {t("raceGuide.calendarTitle")}
        </h2>
        <div className="grid gap-6 md:grid-cols-[minmax(0,15rem)_1fr]">
          <div className="bg-card self-start rounded-xl border p-5">
            <PrepTimeline
              g={g}
              samples={data.byLength}
              raceDate={sampleRaceDate(g)}
              t={t}
              locale={locale}
            />
          </div>
          <div className="space-y-4">
            {g.calendar.map((x) => (
              <div key={x.title}>
                <h3 className="font-semibold">{x.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{x.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="samples-title" className="space-y-4">
        <div>
          <h2 id="samples-title" className="text-xl font-bold">
            {t("raceGuide.samplesTitle", { name: g.name })}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("raceGuide.samplesIntro", { year: data.year })}
            {!edition.date &&
              ` ${t("raceGuide.samplesEstimated", { date: formatDateLong(locale, edition.estimatedDate) })}`}
          </p>
        </div>
        <PhaseLegend phases={phasesIn(data.samples)} t={t} />
        {data.byLength.map((s) => (
          <SampleCard key={s.persona.id} s={s} f={f} km={km} />
        ))}
      </section>

      <section aria-labelledby="faq-title" className="space-y-3">
        <h2 id="faq-title" className="text-xl font-bold">
          {t("raceGuide.faqTitle")}
        </h2>
        {data.faq.map((x) => (
          <details key={x.q} className="bg-card group rounded-xl border p-4">
            <summary className="cursor-pointer font-semibold">{x.q}</summary>
            <p className="text-muted-foreground mt-2 text-sm">{x.a}</p>
          </details>
        ))}
      </section>

      <section className="space-y-3 border-t pt-6">
        {cta}
        <div className="text-muted-foreground space-y-2 text-xs">
          <p>
            {g.checkedOn
              ? t("raceGuide.checkedOn", { date: formatDateLong(locale, g.checkedOn) })
              : t("raceGuide.notChecked")}
          </p>
          <h2 className="text-foreground font-semibold">{t("raceGuide.sourcesTitle")}</h2>
          <ul className="list-disc space-y-1 pl-5">
            {g.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  rel="nofollow noopener"
                  target="_blank"
                  className="underline-offset-4 hover:underline"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <p>
            <Link href={RACE_GUIDES_PATH} className="underline-offset-4 hover:underline">
              {t("raceGuide.seeAll")}
            </Link>
          </p>
        </div>
      </section>
    </article>
  );
}

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("bg-card/80 rounded-lg border px-3 py-2", className)}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-base font-bold">{value}</dd>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

function Prose({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: { title: string; body: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4">
      <h2 id={`${id}-title`} className="text-xl font-bold">
        {title}
      </h2>
      {items.map((x) => (
        <div key={x.title}>
          <h3 className="font-semibold">{x.title}</h3>
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{x.body}</p>
        </div>
      ))}
    </section>
  );
}

function SampleCard({ s, f, km }: { s: Sample; f: Formatter; km: (m: number) => string }) {
  const { t, locale } = f;
  const plan = s.plan;
  const byWeekday = new Map(s.peakWeek.days.map((d) => [d.weekday, d]));
  const stats = [
    {
      label: t("raceGuide.statWeeks"),
      value: t("raceGuide.statWeeksValue", { weeks: s.persona.weeks }),
    },
    { label: t("raceGuide.statStart"), value: formatDateLong(locale, s.startDate) },
    { label: t("raceGuide.statRuns"), value: String(plan.summary.runningDaysPerWeek) },
    { label: t("raceGuide.statPeak"), value: km(s.peakWeek.plannedVolumeM) },
    { label: t("raceGuide.statLong"), value: formatDistance(s.longestRunM, "km", locale, 1) },
    {
      label: t("raceGuide.statQuality"),
      value: t("raceGuide.statQualityValue", { count: s.maxQualityPerWeek }),
    },
    ...(plan.summary.fitness
      ? [
          {
            label: t("raceGuide.statPrediction"),
            value: formatClock(plan.summary.fitness.predictedRaceTimeS),
          },
        ]
      : []),
  ];
  return (
    <div className="bg-card rounded-xl border p-5">
      <h3 className="text-lg font-semibold">{s.persona.title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{s.persona.description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {stats.map((x) => (
          <Fact key={x.label} label={x.label} value={x.value} />
        ))}
      </dl>
      <div className="mt-5">
        <WeeklyVolumeChart s={s} t={t} locale={locale} />
      </div>
      <h4 className="mt-5 text-sm font-semibold">
        {t("raceGuide.peakWeekTitle", { n: s.peakWeek.index + 1 })}
      </h4>
      <ul className="mt-2 divide-y rounded-lg border text-sm">
        {WEEKDAYS.map((wd) => {
          const w = byWeekday.get(wd)?.workout;
          return (
            <li key={wd} className="flex items-baseline gap-3 px-3 py-2">
              <span className="w-20 shrink-0 text-xs font-semibold uppercase">
                {t(`common.weekdays.${wd}`)}
              </span>
              {w ? (
                <span className="min-w-0">
                  {formatMessage(f, w.title)}
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatDistance(w.estDistanceM, "km", locale, 1)}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">{t("plan.rest")}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
