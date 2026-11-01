import type { RaceGuide } from "./types";

export const newYorkCityMarathon: RaceGuide = {
  slug: "new-york-city-marathon",
  locale: "en",
  unit: "mi",
  name: "New York City Marathon",
  city: "New York",
  race: { type: "marathon" },
  likes: ["hills"],
  personas: ["first", "4h", "3h30"],
  nextEdition: {
    date: null,
    estimatedDate: "2027-11-07",
    usualPeriod: "the first Sunday of November",
  },
  summary:
    "Five boroughs and five bridges in early November: a rolling course with its hardest climbs late, after a summer build-up.",
  intro:
    "The New York City Marathon starts on Staten Island, crosses the Verrazzano-Narrows Bridge and runs through all five boroughs before finishing in Central Park. It is not a flat course. The bridges add up to a few hundred feet of climbing, and the hardest parts come late: the long Queensboro Bridge around mile 15, then the gradual climb up Fifth Avenue and the rolling hills of Central Park. The race is usually on the first Sunday of November, so the build-up runs through the summer. Here is how to prepare, with sample plans computed for a reference date until the 2027 date is confirmed.",
  facts: [
    { label: "Distance", value: "26.2 miles (42.195 km)" },
    { label: "Course", value: "Staten Island → Central Park, five boroughs" },
    { label: "Terrain", value: "Rolling: five bridges, climbs in the last 10K" },
    { label: "Training season", value: "Summer (June to October)" },
  ],
  course: [
    {
      title: "Bridges are the hills",
      body: "The course starts with the longest climb, up the Verrazzano-Narrows Bridge in the first mile, then crosses four more bridges. The Queensboro Bridge, around mile 15, is a long, quiet incline without crowds before the noise of First Avenue. The sample plans favour hill sessions; in your long runs, include a few long, steady climbs and run them at an even effort rather than an even pace.",
    },
    {
      title: "Fifth Avenue and Central Park",
      body: "Around miles 22 to 24, Fifth Avenue climbs gradually towards the park, and Central Park itself rolls up and down to the finish. It is where the race is won or lost. Hold back in Brooklyn, where the crowds make it easy to speed up, so you still have legs for the last 10K. Finishing some long runs with a hilly section is the best rehearsal.",
    },
    {
      title: "A long morning before the start",
      body: "Getting to the start on Staten Island takes time: an early ferry or bus, then a wait in the start village, sometimes for hours before a mid-morning wave. Bring warm throwaway layers and a breakfast you have tested, and plan a snack for the wait. Rehearse an early wake-up before one or two long runs.",
    },
  ],
  calendar: [
    {
      title: "A summer build-up in the heat",
      body: "For an early-November race, an 18 to 20-week plan starts in late June or early July. Long runs in July and August are often hot and humid. Run at sunrise, plan water, and slow down without guilt: in the heat, keep the effort, not the pace. The biggest weeks fall in September and October, when it gets cooler.",
    },
    {
      title: "Labor Day and the last big weeks",
      body: "Labor Day weekend falls around the end of the build phase, a good moment for an unhurried long run. If you miss sessions over the summer, mark them in the app and the next week adapts without making you catch up.",
    },
    {
      title: "An extra hour on race night",
      body: "The race is usually held on the day the clocks go back in the United States, which means an extra hour of sleep the night before. Check the date of your edition and adjust your alarm, breakfast and transport times accordingly.",
    },
  ],
  milestones: [
    { date: "2027-07-04", label: "Independence Day: an early long run before the heat" },
    { date: "2027-09-06", label: "Labor Day: a long weekend for a long run" },
  ],
  faq: [
    {
      q: "Is the New York City Marathon hilly?",
      a: "It is rolling rather than hilly: the bridges and the last 10K, from Fifth Avenue through Central Park, add a few hundred feet of climbing. Train with some hills and plan a conservative first half.",
    },
    {
      q: "What pace should I aim for in New York?",
      a: "Expect to run a little slower than on a flat course. Use your training to set a realistic goal, start slightly slower than that through Brooklyn, and save energy for the last 10K.",
    },
  ],
  sources: [
    {
      label: "2027 dates of the big marathons (The Running Channel)",
      url: "https://therunningchannel.com/world-marathon-majors-2027/",
    },
    {
      label: "Mile-by-mile course breakdown (Marathon Handbook)",
      url: "https://marathonhandbook.com/new-york-city-marathon-course-breakdown/",
    },
    {
      label: "Five bridges and the traps to avoid (marathons.com)",
      url: "https://www.marathons.com/en/new-york-marathon/inside-the-new-york-city-marathon-course-five-bridges-and-the-traps-to-avoid_m403",
    },
  ],
};
