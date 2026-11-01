import type { RaceGuide } from "./types";

export const londonMarathon: RaceGuide = {
  slug: "london-marathon",
  locale: "en",
  unit: "mi",
  name: "London Marathon",
  city: "London",
  race: { type: "marathon" },
  personas: ["first", "4h", "3h30"],
  nextEdition: {
    date: "2027-04-25",
    estimatedDate: "2027-04-25",
    usualPeriod: "late April",
    label: "Two-day edition (24–25 April)",
  },
  summary:
    "A flat point-to-point marathon from Greenwich to The Mall in late April, over two days in 2027: a winter build-up through dark, wet months.",
  intro:
    "The London Marathon runs from south-east London to The Mall, past the Cutty Sark, over Tower Bridge and around Canary Wharf. The course is flat and fast, but crowded. For 2027 the race is a one-off two-day event on Saturday 24 and Sunday 25 April, and each runner is assigned one of the two days. A late-April race means a winter build-up from December to April, with Christmas in the base phase and the last long runs just as the clocks go forward. Here is how to prepare, with sample plans computed for the Sunday race.",
  facts: [
    { label: "Distance", value: "26.2 miles (42.195 km)" },
    { label: "Course", value: "Point to point, flat: Greenwich → The Mall" },
    { label: "2027 format", value: "Two race days; each runner is assigned one" },
    { label: "Training season", value: "Winter (December to April)" },
  ],
  course: [
    {
      title: "Flat, fast, and busy from the start",
      body: "There are no real hills: the challenge is pacing in a dense field. The first miles are packed and slightly downhill, which makes it easy to go off too fast or to waste energy weaving. Accept a slow first mile, settle into your goal pace by mile 3, and only run the tangents where there is space. The marathon-pace sessions in the plans teach you that pace, so you can find it without checking your watch every minute.",
    },
    {
      title: "Canary Wharf and your GPS",
      body: "Between roughly miles 14 and 21 the course loops around the Isle of Dogs and Canary Wharf, where tall buildings often throw GPS watches off. Your watch may show a pace that is far too fast or too slow. Use the mile markers and your effort there, and decide your target split per mile before race day.",
    },
    {
      title: "Tower Bridge, then the long run in",
      body: "Tower Bridge comes before halfway and is one of the loudest moments of the race, so the temptation is to speed up. Save that energy for later: after Canary Wharf, the Embankment towards Westminster is where a well-paced race pays off. Practise finishing your long runs at a steady effort so the last miles feel familiar.",
    },
  ],
  calendar: [
    {
      title: "A winter build-up",
      body: "For a late-April race, an 18 to 20-week plan starts in early or mid-December. Most weekday runs happen in the dark and the cold, so wear lights and reflective kit, pick lit routes, and keep the long run in daylight at the weekend. Wind and rain slow you down; run those days by effort, not pace.",
    },
    {
      title: "Christmas in the base phase",
      body: "The first weeks of the plan fall over Christmas and New Year. That's the easiest part of the plan to keep going while travelling, because it is mostly easy running. If you miss a few days, mark them in the app: the next week adapts without making you catch up.",
    },
    {
      title: "Saturday or Sunday?",
      body: "In 2027 you will be told which of the two days you run. Our samples use Sunday 25 April. If you run on the Saturday, create your plan with that date and the whole plan, taper included, moves back a day. Either way, a spring half marathon in March is a good dress rehearsal for race-day kit, breakfast and pacing.",
    },
  ],
  milestones: [
    { date: "2027-01-01", label: "New Year: the base phase continues" },
    {
      date: "2027-03-28",
      label: "Easter Sunday and the clocks go forward: a long weekend for one of your longest runs",
    },
  ],
  faq: [
    {
      q: "Is the London Marathon a good course for a personal best?",
      a: "Yes: it is flat and the crowd support is huge. The risks are a crowded first few miles and an unreliable GPS around Canary Wharf. Run the first mile slowly, then pace by the mile markers rather than your watch.",
    },
    {
      q: "Does the two-day format change my training?",
      a: "No, only the date. Use the day you are assigned as your race date; the plan, the taper and the final week follow from it.",
    },
  ],
  sources: [
    {
      label: "2027 two-day event (Marathon Handbook)",
      url: "https://marathonhandbook.com/london-marathon-2027-two-days/",
    },
    {
      label: "2027 format and dates (Tom's Guide)",
      url: "https://www.tomsguide.com/wellness/running/tcs-london-marathon-2027-will-be-a-two-day-event-allowing-100-000-runners-to-cross-the-finish-line-in-a-unique-double-format-race",
    },
  ],
};
