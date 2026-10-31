/**
 * Race guides (SEO landing pages): enough race-specific substance per page,
 * no brand names, and sample plans that pass every safety rule.
 */
import { describe, expect, it } from "vitest";
import { RACE_GUIDES, raceGuidePath } from "@/content/races";
import { buildSamples, personasFor, sampleRaceDate } from "@/content/races/samples";
import { checkPlan } from "@/engine";
import { diffDays } from "@/engine/dates";
import { DEFAULT_VALUES } from "@/features/plan-form/form-model";
import { racePrefill } from "@/features/plan-form/race-prefill";
import sitemap from "@/app/sitemap";
import { FIXTURE_TODAY } from "../fixtures/runners";

/** Sponsors and brands seen in race names: never on our pages. */
const BRANDS =
  /asics|schneider|hoka|harmonie mutuelle|ag2r|vredestein|brooks|salomon|adidas|nike|garmin|strava/i;

const allText = (g: (typeof RACE_GUIDES)[number]) =>
  [
    g.name,
    g.summary,
    g.intro,
    ...g.facts.flatMap((f) => [f.label, f.value]),
    ...g.course.flatMap((c) => [c.title, c.body]),
    ...g.calendar.flatMap((c) => [c.title, c.body]),
    ...g.faq.flatMap((f) => [f.q, f.a]),
    g.nextEdition.label ?? "",
  ].join("\n");

describe("race guides", () => {
  it("have unique, URL-safe slugs and distinct texts", () => {
    const slugs = RACE_GUIDES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(RACE_GUIDES.map((g) => g.intro)).size).toBe(RACE_GUIDES.length);
    expect(new Set(RACE_GUIDES.map((g) => g.summary)).size).toBe(RACE_GUIDES.length);
  });

  it.each(RACE_GUIDES.map((g) => [g.slug, g] as const))(
    "%s: race-specific substance, sources, no brand names",
    (_, g) => {
      expect(g.intro.length).toBeGreaterThan(300);
      expect(g.course.length).toBeGreaterThanOrEqual(2);
      expect(g.calendar.length).toBeGreaterThanOrEqual(2);
      expect(g.faq.length).toBeGreaterThanOrEqual(1);
      expect(allText(g).length).toBeGreaterThan(2500);
      expect(g.sources.length).toBeGreaterThanOrEqual(1);
      for (const s of g.sources) expect(s.url).toMatch(/^https:\/\//);
      expect(allText(g)).not.toMatch(BRANDS);
      // The next edition is ahead (dates are kept up to date).
      expect(diffDays(FIXTURE_TODAY, sampleRaceDate(g))).toBeGreaterThan(0);
    },
  );

  it.each(RACE_GUIDES.map((g) => [g.slug, g] as const))(
    "%s: sample plans pass every safety rule",
    (_, g) => {
      const samples = buildSamples(g);
      expect(samples.length).toBe(personasFor(g.race.type).length);
      expect(samples.length).toBeGreaterThanOrEqual(3);
      for (const s of samples) {
        expect(checkPlan(s.plan)).toEqual([]);
        expect(s.plan.weeks).toHaveLength(s.persona.weeks);
        expect(s.plan.raceDate).toBe(sampleRaceDate(g));
        // No "ambitious goal" or "too short" warning on a showcase plan.
        expect(s.plan.warnings.map((w) => w.code)).toEqual([]);
      }
    },
  );

  it("are in the sitemap, in their own language only", () => {
    const urls = sitemap().map((e) => e.url);
    for (const g of RACE_GUIDES) {
      expect(urls.some((u) => u.endsWith(`/${g.locale}${raceGuidePath(g)}`))).toBe(true);
      // Guides are French only for now.
      expect(urls.some((u) => u.endsWith(`/en${raceGuidePath(g)}`))).toBe(false);
    }
  });
});

describe("racePrefill", () => {
  const g = RACE_GUIDES[0]!;

  it("fills the race step and keeps the rest", () => {
    const r = racePrefill({ ...DEFAULT_VALUES, age: "40" }, g.slug, "km", FIXTURE_TODAY)!;
    expect(r.guide.slug).toBe(g.slug);
    expect(r.values.raceType).toBe(g.race.type);
    expect(r.values.raceDate).toBe(g.nextEdition.date ?? "");
    expect(r.values.age).toBe("40");
  });

  it("ignores unknown races and dates already past", () => {
    expect(racePrefill(DEFAULT_VALUES, "nope", "km", FIXTURE_TODAY)).toBeNull();
    expect(racePrefill(DEFAULT_VALUES, null, "km", FIXTURE_TODAY)).toBeNull();
    expect(racePrefill(DEFAULT_VALUES, g.slug, "km", "2030-01-01")!.values.raceDate).toBe("");
  });
});
