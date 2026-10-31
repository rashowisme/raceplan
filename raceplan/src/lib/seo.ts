import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

/**
 * Public origin used for canonical URLs, hreflang links, the sitemap and
 * social previews. Set `NEXT_PUBLIC_SITE_URL` once a domain exists; on
 * Vercel the production domain is used automatically.
 */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

export const SITE_NAME = "RacePlan";

/** Open Graph locale codes. */
export const OG_LOCALES: Record<string, string> = { en: "en_GB", fr: "fr_FR" };

/** Locale-prefixed path, e.g. `localePath("fr", "/plan/new")` → `/fr/plan/new`. */
export function localePath(locale: string, path: string): string {
  return `/${locale}${path === "/" ? "" : path}`;
}

/** Canonical URL plus one hreflang alternate per language (x-default → default locale). */
export function alternates(locale: string, path: string): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [l, localePath(l, path)]),
  );
  languages["x-default"] = localePath(routing.defaultLocale, path);
  return { canonical: localePath(locale, path), languages };
}

/** Public, indexable pages (the plan page is personal and stays out of search). */
export const INDEXED_PATHS = ["/", "/plan/new"] as const;
