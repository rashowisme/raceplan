import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { INDEXED_PATHS, localePath, SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (locale: string, path: string) => new URL(localePath(locale, path), SITE_URL).href;
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
