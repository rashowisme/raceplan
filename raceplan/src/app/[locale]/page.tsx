import { CalendarDays, FileDown, Flag, ShieldCheck, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { buttonVariants } from "@/components/ui/button";
import { raceGuidesPath } from "@/content/races";
import { Link } from "@/i18n/navigation";
import { localePath, SITE_NAME, SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";

export default function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("landing");
  const meta = useTranslations("meta");
  const tGuides = useTranslations("raceGuide");
  const guidesPath = raceGuidesPath(locale);

  // schema.org description of the app for search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: new URL(localePath(locale, "/"), SITE_URL).href,
    description: meta("description"),
    applicationCategory: "HealthApplication",
    applicationSubCategory: meta("appCategory"),
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    inLanguage: locale,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
  };

  const features = [
    { icon: ShieldCheck, title: t("features.safeTitle"), body: t("features.safeBody") },
    { icon: UserRound, title: t("features.personalTitle"), body: t("features.personalBody") },
    { icon: FileDown, title: t("features.exportTitle"), body: t("features.exportBody") },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-4">
      <script
        type="application/ld+json"
        // `<` is escaped so the JSON can never close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <section className="py-12 sm:py-20">
        <p className="text-primary text-sm font-semibold tracking-wide">{t("eyebrow")}</p>
        <h1 className="mt-3 max-w-2xl text-3xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
          {t("headline")}
        </h1>
        <p className="text-muted-foreground mt-4 max-w-2xl text-base text-pretty sm:text-lg">
          {t("subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/plan/new"
            className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 text-base")}
          >
            <CalendarDays aria-hidden />
            {t("cta")}
          </Link>
          {guidesPath && (
            <Link
              href={guidesPath}
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-12 px-6 text-base",
              )}
            >
              <Flag aria-hidden />
              {tGuides("hubLink")}
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 pb-12 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-card rounded-xl border p-5">
            <Icon className="text-primary size-6" aria-hidden />
            <h2 className="mt-3 font-semibold">{title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{body}</p>
          </div>
        ))}
      </section>

      <section className="pb-16">
        <h2 className="text-xl font-bold">{t("howTitle")}</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {[t("how1"), t("how2"), t("how3")].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold">
                {i + 1}
              </span>
              <span className="text-sm leading-6">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
