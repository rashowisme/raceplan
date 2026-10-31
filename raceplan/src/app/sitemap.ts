import type { MetadataRoute } from "next";
import { raceGuidePath, RACE_GUIDES, RACE_GUIDES_PATH } from "@/content/races";
import { routing } from "@/i18n/routing";
import { INDEXED_PATHS, localePath, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (locale: string, path: string) => new URL(localePath(locale, path), SITE_URL).href;
  // Race guides exist in one language each (no alternates).
  const guideLocales = [...new Set(RACE_GUIDES.map((g) => g.locale))];
  const guides: MetadataRoute.Sitemap = [
    ...guideLocales.map((locale) => ({
      url: url(locale, RACE_GUIDES_PATH),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...RACE_GUIDES.map((g) => ({
      url: url(g.locale, raceGuidePath(g)),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  return [...pages(url), ...guides];
}

function pages(url: (locale: string, path: string) => string): MetadataRoute.Sitemap {
  return INDEXED_PATHS.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: url(locale, path),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(routing.locales.map((l) => [l, url(l, path)])),
      },
    })),
  );
}
