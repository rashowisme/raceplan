import type { RaceGuide } from "./types";

export const chicagoMarathon: RaceGuide = {
  slug: "chicago-marathon",
  locale: "en",
  unit: "mi",
  name: "Chicago Marathon",
  city: "Chicago",
  race: { type: "marathon" },
  personas: ["first", "4h", "3h"],
  nextEdition: {
    date: "2027-10-10",
    estimatedDate: "2027-10-10",
    usualPeriod: "early to mid-October",
  },
  summary:
    "A flat loop from Grant Park through the city's neighbourhoods in October: a summer build-up in Midwest heat and humidity.",
  intro:
    "The Chicago Marathon is a flat loop that starts and finishes in Grant Park and winds through the city's neighbourhoods along the way. It is one of the fastest big-city marathons, and its flat course and big crowds make it a popular first marathon. The October date means a summer build-up from June to September, in heat and humidity that can be hard on long runs. Here is how to prepare, with sample plans computed for 10 October 2027.",
  facts: [
    { label: "Distance", value: "26.2 miles (42.195 km)" },
    { label: "Course", value: "Loop, start and finish in Grant Park, flat" },
    { label: "Weather", value: "Anything from warm to cold in October" },
    { label: "Training season", value: "Summer (June to September)" },
  ],
  course: [
    {
      title: "Flat, fast, and even all the way",
      body: "There are no real hills, just a few bridges over the river. The race is about running an even pace for 26 miles, so the marathon-pace sessions in the plans are the key workouts. Run them on flat routes, and in hot weeks run them early in the morning so the pace is realistic.",
    },
    {
      title: "Skyscrapers and your GPS",
      body: "The first miles and the finish run among the tall buildings of the Loop, where GPS watches often lose track. Your watch may show a pace that is far off. Use the mile markers and your effort for the first few miles, and know your target split per mile before race day.",
    },
    {
      title: "Plan for the weather of the day",
      body: "October weather in Chicago varies a lot from one year to the next: some editions have been hot, others cold. Prepare two pace plans, one for cool weather and a more conservative one for a warm day, and choose between them that morning. On a warm day, drink early, before you feel thirsty.",
    },
  ],
  calendar: [
    {
      title: "Training through a Midwest summer",
      body: "For an October race, an 18 to 20-week plan starts between late May and mid-June. The biggest weeks fall in August and September, which are often hot and humid. Run long runs at sunrise, plan water stops, and slow your easy pace without guilt: in the heat, keep the effort, not the pace.",
    },
    {
      title: "Holidays and long weekends",
      body: "Independence Day falls in the base phase, and Labor Day weekend comes in the last big weeks: both are good days for an unhurried long run. If summer travel makes you miss sessions, mark them in the app and the next week adapts.",
    },
    {
      title: "Cooler weeks before the race",
      body: "September often brings the first cooler mornings. Use them for your last long runs and marathon-pace work, because they are the closest you will get to race conditions. The taper then cuts volume while keeping a little intensity.",
    },
  ],
  milestones: [
    { date: "2027-07-04", label: "Independence Day: an early long run before the heat" },
    { date: "2027-09-06", label: "Labor Day: one of the last big long runs" },
  ],
  faq: [
    {
      q: "Is Chicago a good first marathon?",
      a: "Yes: it is flat and well supported, with big crowds. The main risk is heat in training and, some years, on race day. Start the build-up early enough that slower summer weeks don't matter.",
    },
  ],
  sources: [
    {
      label: "Future event dates (official site)",
      url: "https://www.chicagomarathon.com/runners/runner-information/future-event-dates/",
    },
    {
      label: "2027 application dates (Marathon Handbook)",
      url: "https://marathonhandbook.com/chicago-marathon-2027-registration/",
    },
  ],
};
