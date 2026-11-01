import type { RaceGuide } from "./types";

export const rotterdamMarathon: RaceGuide = {
  slug: "rotterdam-marathon",
  locale: "en",
  name: "Rotterdam Marathon",
  city: "Rotterdam",
  race: { type: "marathon" },
  personas: ["first", "3h30", "3h"],
  nextEdition: {
    date: null,
    estimatedDate: "2027-04-11",
    usualPeriod: "mid-April",
  },
  summary:
    "A flat, fast spring marathon over the Erasmus Bridge in April: a winter build-up in Dutch wind and rain.",
  intro:
    "The Rotterdam Marathon is one of Europe's classic fast spring marathons. It starts near the Erasmus Bridge and finishes on the Coolsingel in the city centre, on a course with almost no hills. What can slow you down is the wind, on the bridge and the open stretches. The race is held in April, so the build-up runs through the winter, from December to April, often in wind and rain. Here is how to prepare, with sample plans computed for a reference date until the 2027 date is confirmed.",
  facts: [
    { label: "Distance", value: "42.195 km" },
    { label: "Course", value: "Flat, start near the Erasmus Bridge" },
    { label: "Finish", value: "Coolsingel, city centre" },
    { label: "Training season", value: "Winter (December to April)" },
  ],
  course: [
    {
      title: "Flat, with the bridge early",
      body: "The Erasmus Bridge is the only real climb, and it comes early, when legs are fresh and the crowd is loud. Run it at an even effort rather than an even pace. After that, the course is flat, which makes it ideal for a goal pace you have rehearsed in your marathon-pace sessions.",
    },
    {
      title: "Wind is the variable",
      body: "In April the wind off the river and across open sections can cost more time than any hill. On a windy day, tuck in behind a group on the exposed stretches and accept a slower pace there. Prepare two goals, one for a calm day and one for a windy day, and choose on the morning.",
    },
    {
      title: "Spring weather can surprise",
      body: "Most editions are cool, but a sunny April day can feel warm after a winter of training in the cold. Drink early, and have a plan for slowing down a few seconds per kilometre if it is warm.",
    },
  ],
  calendar: [
    {
      title: "A winter build-up in the wind",
      body: "For a mid-April race, a 16 to 20-week plan starts between early December and early January. Many sessions will be windy and wet: run by effort, start long runs into the wind so it is behind you on the way back, and keep the long run in daylight at the weekend.",
    },
    {
      title: "Christmas in the base phase",
      body: "The first weeks of the plan fall over the holidays. They are mostly easy running, which is the easiest part to keep while travelling. If you miss days, mark them in the app and the next week adapts without making you catch up.",
    },
    {
      title: "Easter and the clocks in late March",
      body: "In 2027 the clocks go forward on Easter Sunday, 28 March, a couple of weeks before the race. The long weekend suits one of your last long runs, and evening runs are back in daylight for the taper.",
    },
  ],
  milestones: [
    { date: "2027-01-01", label: "New Year: base phase, easy running" },
    { date: "2027-03-28", label: "Easter Sunday and clocks forward: one of the last long runs" },
  ],
  faq: [
    {
      q: "Is Rotterdam a good marathon for a personal best?",
      a: "Yes: it is flat and well organised, with a cool spring climate. The wind is the main unknown, so prepare a pace plan for a calm day and a more cautious one for a windy day.",
    },
  ],
  sources: [
    {
      label: "2027 date (My Best Runs)",
      url: "https://mybestruns.com/RotterdamMarathon?details=Y",
    },
    {
      label: "Event page (marathons.com)",
      url: "https://www.marathons.com/evenements/marathon-de-rotterdam",
    },
  ],
};
