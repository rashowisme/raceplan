import type { RaceGuide } from "./types";

export const tokyoMarathon: RaceGuide = {
  slug: "tokyo-marathon",
  locale: "en",
  name: "Tokyo Marathon",
  city: "Tokyo",
  race: { type: "marathon" },
  personas: ["first", "4h", "3h30"],
  nextEdition: {
    date: "2027-03-07",
    estimatedDate: "2027-03-07",
    usualPeriod: "early March",
    label: "20th edition",
  },
  summary:
    "A fast, flat marathon from Shinjuku to Tokyo Station in early March: a winter build-up, and a downhill start to respect.",
  intro:
    "The Tokyo Marathon starts at the Tokyo Metropolitan Government Building in Shinjuku and finishes in front of Tokyo Station. The first 5 km drop gently towards the city centre, and after that the course is very flat, with a few out-and-back sections. A 7-hour time limit makes it open to first-time marathoners. An early-March race means a winter build-up from November to March, with the New Year holidays in the middle. For runners travelling from abroad, the trip itself is part of the preparation. Here is how to prepare, with sample plans computed for the 2027 race.",
  facts: [
    { label: "Distance", value: "42.195 km" },
    { label: "Course", value: "Shinjuku → Tokyo Station, flat after a downhill start" },
    { label: "Time limit", value: "7 hours, with intermediate cut-offs" },
    { label: "Training season", value: "Winter (November to March)" },
  ],
  course: [
    {
      title: "A downhill start: don't bank time",
      body: "The first 5 km lose about 30 metres of height, and with a fresh crowd around you it is easy to run them much faster than goal pace. Time banked there is paid back with interest later. Aim for goal pace or a few seconds slower, and let the downhill do the work without pushing.",
    },
    {
      title: "Flat, with turnarounds",
      body: "After the start, the course is very flat but includes several out-and-back sections with tight turns. Each turn costs a little momentum. In your marathon-pace sessions, practise getting back to pace smoothly after a slowdown instead of surging. Your watch may measure the course long; pace by the kilometre markers.",
    },
    {
      title: "A 7-hour limit, and cut-off points",
      body: "The 7-hour limit is generous, but there are intermediate cut-off points along the course. If you expect to take more than 5 hours, check the cut-off times for your edition and make sure your training pace leaves a margin, including toilet stops and walking breaks.",
    },
  ],
  calendar: [
    {
      title: "A winter build-up",
      body: "For an early-March race, a 16 to 20-week plan starts between late October and mid-November. The biggest weeks fall in January and February, often cold and dry in Tokyo. Wear layers you can take off, warm up indoors on cold mornings, and run your long runs in daylight.",
    },
    {
      title: "New Year in the middle of the plan",
      body: "The New Year holidays fall in the build phase. Keep the long run and the easy days; skipping a quality session over the holidays matters much less than missing a whole week. If you miss days, mark them in the app and the next week adapts.",
    },
    {
      title: "Travelling from abroad",
      body: "Runners usually have to collect their bib in person at the expo in the days before the race. If you travel from another time zone, arrive a few days early, keep easy runs short after the flight, and move your meals and sleep towards local time. The taper in the plan leaves room for this.",
    },
  ],
  milestones: [
    { date: "2027-01-01", label: "New Year holidays: keep the long run" },
    { date: "2027-02-11", label: "National Foundation Day: a day off for a long run in Japan" },
  ],
  faq: [
    {
      q: "Is the Tokyo Marathon suitable for a first marathon?",
      a: "Yes: it is flat after the downhill start, well supported, and the 7-hour limit is generous. Plan 18 to 20 weeks if you are starting from around 30 km a week, and check the intermediate cut-off times.",
    },
  ],
  sources: [
    { label: "20th edition (official site)", url: "https://www.marathon.tokyo/en/20th/" },
    {
      label: "What runners should know (Metropolis Japan)",
      url: "https://metropolisjapan.com/tokyo-marathon-2026-what-runners-should-know/",
    },
    {
      label: "Course guide (Coach Parry)",
      url: "https://blog.coachparry.com/the-tokyo-marathon-route-a-runners-guide/",
    },
  ],
};
