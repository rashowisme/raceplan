import { renderToBuffer } from "@react-pdf/renderer";
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { generatePlan } from "@/engine";
import type { Formatter, Translate } from "@/features/plan-calendar/format";
import en from "../../../../messages/en.json";
import fr from "../../../../messages/fr.json";
import { FIXTURE_TODAY, RUNNER_FIXTURES } from "../../../../tests/fixtures/runners";
import { pdfFileName } from "./download";
import { PlanDocument } from "./PlanDocument";

const make = (locale: "en" | "fr", unit: "km" | "mi"): Formatter => ({
  t: createTranslator({ locale, messages: locale === "en" ? en : fr }) as unknown as Translate,
  locale,
  unit,
  zoneLabels: "daniels",
});

const planOf = (name: string) => {
  const r = generatePlan(RUNNER_FIXTURES[name]!, { today: FIXTURE_TODAY });
  if (!r.ok) throw new Error();
  return r.plan;
};

/** Characters the built-in Helvetica (WinAnsi) can render. */
const WIN_ANSI_EXTRA = "€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ";
const renderable = (s: string) =>
  [...s].every((ch) => ch.charCodeAt(0) <= 0xff || WIN_ANSI_EXTRA.includes(ch));

describe("PDF export", () => {
  it.each([
    ["experiencedMarathon", "en", "km"],
    ["noPerformanceData", "fr", "mi"],
  ] as const)(
    "renders %s (%s, %s)",
    async (name, locale, unit) => {
      const buf = await renderToBuffer(<PlanDocument plan={planOf(name)} f={make(locale, unit)} />);
      expect(buf.subarray(0, 4).toString()).toBe("%PDF");
      expect(buf.length).toBeGreaterThan(5_000);
    },
    30_000,
  );

  it("only uses characters the built-in font supports", () => {
    const walk = (v: unknown): string[] =>
      typeof v === "string"
        ? [v]
        : v && typeof v === "object"
          ? Object.values(v).flatMap(walk)
          : [];
    for (const [locale, messages] of [
      ["en", en],
      ["fr", fr],
    ] as const) {
      for (const s of walk(messages)) expect(renderable(s), `${locale}: ${s}`).toBe(true);
    }
  });

  it("names the file after the race", () => {
    expect(pdfFileName(planOf("beginner5k"))).toBe("raceplan-5k-2027-01-03.pdf");
  });
});
