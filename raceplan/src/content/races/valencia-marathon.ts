import type { RaceGuide } from "./types";

export const valenciaMarathon: RaceGuide = {
  slug: "valencia-marathon",
  locale: "en",
  name: "Valencia Marathon",
  city: "Valencia",
  race: { type: "marathon" },
  personas: ["4h", "3h30", "3h"],
  nextEdition: {
    date: null,
    estimatedDate: "2027-12-05",
    usualPeriod: "the first Sunday of December",
  },
  summary:
    "One of the flattest, fastest marathons in the world, in early December: an autumn build-up for a personal best.",
  intro:
    "The Valencia Marathon is known as one of the fastest marathons in the world. The course is almost perfectly flat, winds through the historic centre and along the Turia gardens, and finishes at the City of Arts and Sciences. Many runners choose it for a personal best, and entries sell out quickly. The 2026 edition, on 6 December 2026, is too close for a full preparation, so this page targets the 2027 edition, with sample plans computed for a reference date until it is announced.",
  facts: [
    { label: "Distance", value: "42.195 km" },
    { label: "Course", value: "Very flat city loop" },
    { label: "Finish", value: "City of Arts and Sciences" },
    { label: "Training season", value: "Late summer and autumn (August to December)" },
  ],
  course: [
    {
      title: "A course built for even pacing",
      body: "With almost no elevation change, Valencia rewards a precise pace plan more than almost any other race. The marathon-pace sessions in the plans are the key workouts: learn the feel of goal pace so you can hold it for 35 km without checking your watch constantly. Large pace groups help, but start in your own corral and settle in.",
    },
    {
      title: "Mild, sometimes humid weather",
      body: "Early-December weather is usually cool and good for running, but the air can be humid and the sun warm by the end of the morning. Drink early at the aid stations, and if the forecast is warm, start a few seconds per kilometre slower than your best-day plan.",
    },
    {
      title: "Negative splits pay off",
      body: "On a flat course with crowds all the way, the fastest strategy is an even first half and a slightly faster second half. Going out fast because it feels easy is the most common mistake. Practise it in training: the last part of some long runs at marathon pace, on tired legs.",
    },
  ],
  calendar: [
    {
      title: "An autumn build-up",
      body: "For an early-December race, a 16 to 20-week plan starts between late July and mid-August. The first weeks are hot in most of Europe: run early, keep easy runs easy, and carry water. The biggest weeks fall in October and November, when cooler weather makes long runs and marathon-pace work much easier.",
    },
    {
      title: "Shorter days from late October",
      body: "The clocks go back at the end of October, in the middle of the build phase. Evening sessions will be in the dark: wear lights and reflective kit, pick lit routes, and keep the long run in daylight at the weekend.",
    },
    {
      title: "Too late for 2026?",
      body: "The 2026 edition is on 6 December 2026. RacePlan can build a short plan, but a few weeks are not enough to prepare a marathon properly from scratch: aim for 2027, and run a half marathon or a 10K in the meantime.",
    },
  ],
  milestones: [
    { date: "2027-08-15", label: "Mid-August: base phase, easy running in the heat" },
    { date: "2027-10-31", label: "Clocks go back: evening sessions in the dark" },
  ],
  faq: [
    {
      q: "Why is Valencia so fast?",
      a: "The course is almost perfectly flat, with wide roads, mild weather and large pace groups. The rest is up to your pacing: an even first half is the best way to use it.",
    },
  ],
  sources: [
    {
      label: "2027 date (Realbuzz)",
      url: "https://www.realbuzz.com/events/valencia-marathon-2027",
    },
    {
      label: "Course and elevation (Marathon Index)",
      url: "https://marathon-index.com/races/valencia-marathon/course/",
    },
    {
      label: "Guide for international runners (Fat Marathoner)",
      url: "https://fatmarathoner.com/?p=7198",
    },
  ],
};
