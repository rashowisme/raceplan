import type { RaceGuide } from "./types";

export const berlinMarathon: RaceGuide = {
  slug: "berlin-marathon",
  locale: "en",
  name: "Berlin Marathon",
  city: "Berlin",
  race: { type: "marathon" },
  personas: ["first", "3h30", "3h"],
  nextEdition: {
    date: "2027-09-26",
    estimatedDate: "2027-09-26",
    usualPeriod: "late September",
  },
  summary:
    "One of the flattest big-city marathons, in late September: a summer build-up and a course made for fast times.",
  intro:
    "The Berlin Marathon is one big loop through the city, starting and finishing near the Tiergarten. It is famously flat: the highest and lowest points are only a few metres apart. Many marathon world records have been set here, which makes it a natural choice for a personal best. A late-September race means a summer build-up from June to September, with the heat and the holidays in the middle of the plan. Here is how to prepare, with sample plans computed for the 2027 race.",
  facts: [
    { label: "Distance", value: "42.195 km" },
    { label: "Course", value: "One large loop, very flat" },
    { label: "Entry", value: "Lottery (2027 draw closes 12 November 2026)" },
    { label: "Training season", value: "Summer (June to September)" },
  ],
  course: [
    {
      title: "Flat enough to race on pace",
      body: "With almost no elevation change, Berlin is a course where your pace plan holds from start to finish, so pacing is the whole job. The marathon-pace sessions in the plans are the key workouts. Run them on flat ground and learn what goal pace feels like when you're fresh, so you don't drift faster in the first half.",
    },
    {
      title: "A big field, and many corners",
      body: "Berlin has tens of thousands of runners and the first kilometres are crowded. Start in your assigned block, accept losing a few seconds early, and run your own race. With so many turns, your watch will usually measure more than 42.2 km. Pace by the kilometre markers, or aim slightly faster than goal pace on your watch.",
    },
    {
      title: "Late-September weather",
      body: "Conditions are often ideal, but some editions have been warm. Have a plan for a warm day: start a few seconds per kilometre slower and drink early. The start is cool, but the sun can be strong in the last hour.",
    },
  ],
  calendar: [
    {
      title: "A summer build-up",
      body: "For a late-September race, a 16 to 20-week plan starts between mid-May and early June. The biggest weeks fall in August and September. Run early in the morning on hot days, slow your easy runs without guilt, and carry water on long runs: what counts is the effort, not the pace on your watch.",
    },
    {
      title: "Holidays in the middle of the plan",
      body: "Summer holidays usually fall in the build phase. The plan still works away from home: move sessions to suit your days and keep the long run. If you miss part of a week, mark it in the app and the next week adapts without making you catch up.",
    },
    {
      title: "The lottery first",
      body: "Most places come from a lottery. For 2027, entries close on 12 November 2026 and results come in early December, so you will know whether you have a place long before you start training. There are charity and tour places too. Until you know, a spring half marathon is a good way to build a base.",
    },
  ],
  milestones: [
    { date: "2027-06-21", label: "Longest day: early-morning runs before the heat" },
    { date: "2027-08-15", label: "Mid-August: the heart of the build" },
  ],
  faq: [
    {
      q: "Is Berlin a good marathon for a personal best?",
      a: "It is one of the best: flat, with big crowds and usually cool weather. What costs time is a crowded start and the extra distance from running wide through the corners. Pace by the markers and start a little slower than goal pace.",
    },
  ],
  sources: [
    {
      label: "2027 date (visitBerlin)",
      url: "https://www.visitberlin.de/en/event/generali-berlin-marathon-2027",
    },
    {
      label: "2027 lottery dates (Marathon Handbook)",
      url: "https://marathonhandbook.com/berlin-marathon-2027-lottery/",
    },
    {
      label: "Course and elevation (Marathon Index)",
      url: "https://marathon-index.com/races/berlin-marathon/course/",
    },
  ],
};
