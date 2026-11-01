import type { RaceGuide } from "./types";

export const amsterdamMarathon: RaceGuide = {
  slug: "amsterdam-marathon",
  locale: "en",
  name: "Amsterdam Marathon",
  city: "Amsterdam",
  race: { type: "marathon" },
  personas: ["first", "4h", "3h30"],
  nextEdition: {
    date: null,
    estimatedDate: "2027-10-17",
    usualPeriod: "mid to late October",
  },
  summary:
    "A flat October marathon from the 1928 Olympic Stadium, along the Amstel and through the Vondelpark: a summer build-up.",
  intro:
    "The Amsterdam Marathon starts and finishes in the Olympic Stadium, built for the 1928 Games. The course crosses the Vondelpark twice and follows a long stretch of the river Amstel, part of the old Olympic route, past grand houses and windmills. It is flat and fast, with the wind as the main unknown on the open riverside. A race in mid to late October means a summer build-up from June to October. Here is how to prepare, with sample plans computed for a reference date until the 2027 date is announced.",
  facts: [
    { label: "Distance", value: "42.195 km" },
    { label: "Start / finish", value: "Olympic Stadium" },
    { label: "Course", value: "Flat: Vondelpark twice, along the Amstel" },
    { label: "Training season", value: "Summer and early autumn" },
  ],
  course: [
    {
      title: "Flat, and a stadium finish",
      body: "The course is flat, and the finish is a lap inside the Olympic Stadium. That makes it a good course for a goal time, as long as you pace the first half well. The marathon-pace sessions in the plans teach you the feel of goal pace; run them on flat routes.",
    },
    {
      title: "The Amstel and the wind",
      body: "The stretch along the Amstel is long and open, and in October the wind can blow straight down the river. On the way out, stay in a group and accept a slower pace into the wind; you get some of it back on the way back. Long runs on exposed routes in training are a good rehearsal.",
    },
    {
      title: "Narrow sections in the park",
      body: "The Vondelpark and some parts of the city are narrower than the main roads, so the field bunches up. Avoid weaving to pass: a few seconds lost in the park cost less than the energy of zigzagging. Pace by the kilometre markers rather than your watch, which will often measure long.",
    },
  ],
  calendar: [
    {
      title: "A summer build-up",
      body: "For a mid-October race, a 16 to 20-week plan starts between early June and early July. The base phase falls in the summer: mostly easy running, which is easy to keep on holiday. The biggest weeks fall in September and early October, usually in good conditions for long runs.",
    },
    {
      title: "Holidays in the base phase",
      body: "Summer holidays usually fall in the first half of the plan. Keep the long run each week and move the other sessions to suit your days. If you miss part of a week, mark it in the app: the next week adapts without making you catch up.",
    },
    {
      title: "Autumn weather on race day",
      body: "October can be mild or cold and wet. Bring a throwaway layer for the start, and have a plan for a windy or rainy day: a slightly slower goal pace and a group to run with.",
    },
  ],
  milestones: [{ date: "2027-08-15", label: "Mid-August: holidays, keep the long run" }],
  faq: [
    {
      q: "Is Amsterdam a good first marathon?",
      a: "Yes: it is flat and well supported, and you finish in an Olympic stadium. The summer build-up suits runners who prefer to train in long days and warm weather. Plan 18 to 20 weeks if you are starting from around 30 km a week.",
    },
  ],
  sources: [
    {
      label: "Course highlights (official site)",
      url: "https://www.tcsamsterdammarathon.eu/course-highlights",
    },
    {
      label: "Usual date (Run Dream Achieve)",
      url: "https://rundreamachieve.com/amsterdam-marathon-date/",
    },
  ],
};
