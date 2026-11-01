import type { RaceGuide } from "./types";

export const barcelonaMarathon: RaceGuide = {
  slug: "barcelona-marathon",
  locale: "en",
  name: "Barcelona Marathon",
  city: "Barcelona",
  race: { type: "marathon" },
  personas: ["first", "4h", "3h30"],
  nextEdition: {
    date: "2027-03-14",
    estimatedDate: "2027-03-14",
    usualPeriod: "mid-March",
  },
  summary:
    "A city-landmarks marathon in mid-March, gently rolling in the first half: a winter build-up for a spring race in the sun.",
  intro:
    "The Barcelona Marathon is a tour of the city's landmarks, from the Sagrada Família to the seafront. The course was redesigned in 2024 and is now mostly flat, with gentle climbs in the first half up to its highest point near the Sagrada Família, around 14 km. The second half is flatter, with a stretch along the sea. A mid-March race means a winter build-up from November to March. Visiting runners often swap a cold winter of training for a sunny race morning. Here is how to prepare, with sample plans computed for the 2027 race.",
  facts: [
    { label: "Distance", value: "42.195 km" },
    { label: "Course", value: "City loop, gentle climbs in the first half" },
    { label: "Highest point", value: "Near the Sagrada Família (about 14 km)" },
    { label: "Training season", value: "Winter (November to March)" },
  ],
  course: [
    {
      title: "Gentle climbs early",
      body: "Most of the climbing comes in the first half, on long gentle slopes towards the Sagrada Família. Run them at an even effort and let your pace drop slightly instead of forcing it: you will get the time back on the flatter second half. Some rolling routes in your long runs are enough preparation.",
    },
    {
      title: "Sun on the seafront",
      body: "The stretch along the seafront in the second half is exposed. On a sunny March morning it can feel warm, especially after a winter of training in the cold. Drink at the early aid stations, wear a cap, and have a plan to slow down a little if the day is warm.",
    },
    {
      title: "A course with many turns",
      body: "A tour of the landmarks means many corners, and your watch will probably measure the course long. Pace by the kilometre markers, and in your marathon-pace sessions practise getting back to pace smoothly after a turn instead of surging.",
    },
  ],
  calendar: [
    {
      title: "A winter build-up",
      body: "For a mid-March race, a 16 to 20-week plan starts between early November and early December. The biggest weeks fall in February. Training through northern winters means dark evenings and bad weather: wear lights, run by effort on windy or icy days, and keep the long run in daylight at the weekend.",
    },
    {
      title: "Christmas and New Year",
      body: "The holidays fall in the base or early build phase. Keep the long run and the easy days; one missed quality session matters far less than a missed week. If you miss days, mark them in the app and the next week adapts.",
    },
    {
      title: "Preparing for a warmer race day",
      body: "If you are travelling from a colder country, race day may be the warmest run of your build-up. In the last weeks, do a few runs in an extra layer to get used to feeling warm, plan your drinks, and arrive a day or two early.",
    },
  ],
  milestones: [
    { date: "2027-01-01", label: "New Year: base phase, easy running" },
    { date: "2027-02-14", label: "Mid-February: the biggest weeks of the plan" },
  ],
  faq: [
    {
      q: "Is the Barcelona Marathon hilly?",
      a: "No, but it isn't completely flat either: the gentle climbs are in the first half, up to the Sagrada Família. Run them by effort and save your best pace for the flatter second half.",
    },
  ],
  sources: [
    {
      label: "2027 entries open (RunRepublic)",
      url: "https://runrepublic.com/latest/marathons/2027-barcelona-marathon-now-open-for-entries",
    },
    {
      label: "Course analysis (marathons.com)",
      url: "https://www.marathons.com/en/miscellaneous/is-the-barcelona-marathon-course-difficult-our-full-analysis_84v5",
    },
    {
      label: "2024 course redesign (Catalan News)",
      url: "https://www.catalannews.com/sports/item/barcelonas-2024-marathon-unveils-new-course-passing-by-15-landmarks",
    },
  ],
};
