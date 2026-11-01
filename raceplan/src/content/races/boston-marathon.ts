import type { RaceGuide } from "./types";

export const bostonMarathon: RaceGuide = {
  slug: "boston-marathon",
  locale: "en",
  unit: "mi",
  name: "Boston Marathon",
  city: "Hopkinton → Boston",
  race: { type: "marathon" },
  likes: ["hills"],
  personas: ["4h", "3h30", "3h"],
  nextEdition: {
    date: "2027-04-19",
    estimatedDate: "2027-04-19",
    usualPeriod: "the third Monday of April",
  },
  summary:
    "A net-downhill point-to-point marathon on a Monday in April, with the Newton hills late in the race: train your quads, not just your lungs.",
  intro:
    "The Boston Marathon runs point to point from Hopkinton to Boylston Street on Patriots' Day, the third Monday of April. On paper the course drops about 140 m (roughly 460 ft), but it is not an easy downhill race. The early miles pound the quads, and the Newton hills come between miles 16 and 21, with Heartbreak Hill last. Most runners enter with a qualifying time, so this is often a race you train for very specifically. The build-up runs through a northern winter, from December to April. Here is how to prepare, with sample plans computed for the 2027 race.",
  facts: [
    { label: "Distance", value: "26.2 miles (42.195 km)" },
    { label: "Course", value: "Point to point, net downhill (about 460 ft / 140 m)" },
    { label: "Key section", value: "Newton hills, miles 16 to 21" },
    { label: "Entry", value: "Qualifying time or charity place" },
  ],
  course: [
    {
      title: "Downhill early: the quads pay later",
      body: "The first miles out of Hopkinton drop steadily. It feels easy, so many runners go too fast, and the pounding on the quads comes back in the second half. Run the first 5 miles slightly slower than goal pace. In training, include some downhill running: easy runs on rolling routes, and a few long runs with long descents in the last eight weeks.",
    },
    {
      title: "The Newton hills, on tired legs",
      body: "There are four climbs between roughly miles 16 and 21, and the last one is Heartbreak Hill. None is long, but they come when your legs are already tired. The sample plans favour hill sessions; add hilly sections late in your long runs too, so you practise climbing at the right effort when you are fatigued. In the race, keep the effort steady and let the pace drop on the climbs.",
    },
    {
      title: "Downhill to Boylston Street",
      body: "After Boston College, the course drops again towards the city. If you have saved your legs, these miles are fast; if not, every downhill step hurts. That's why the quads matter more here than on a flat marathon: strength work and downhill practice are part of the plan, not extras.",
    },
  ],
  calendar: [
    {
      title: "Training through a northern winter",
      body: "For a mid-April race, an 18-week plan starts in mid-December. Many runners train in snow, ice and cold. Run by effort when the footing is bad, use a treadmill on icy days if you need to (a slight incline helps with hill work), and wear layers you can open up. Don't chase pace on bad days: the fitness comes from consistency.",
    },
    {
      title: "A Monday race and a late-morning start",
      body: "The race is on a Monday and starts in waves from mid-morning. Plan your travel for the weekend, and rehearse a late breakfast and a start several hours after waking in one or two long runs. After a winter of cold training, race day can feel warm: carry a little extra fluid and adjust your pace if it is.",
    },
    {
      title: "Qualifying and entry",
      body: "Registration for 2027 took place in September 2026, using times run in the qualifying window that ended then. If you are already entered, this page is for you. If you are aiming for a later edition, the 2028 window is already open: a fast spring or autumn marathon comes first, and Boston the year after.",
    },
  ],
  milestones: [
    { date: "2027-02-15", label: "Presidents' Day: a long weekend for a long run" },
    { date: "2027-03-14", label: "Clocks go forward: evening runs in daylight again" },
  ],
  faq: [
    {
      q: "How do I train for the Newton hills?",
      a: "Do a weekly hill session (1 to 3-minute climbs, jogging back down) and long runs with climbs in their second half. The goal is to climb at a steady effort on tired legs, then run the descents relaxed.",
    },
    {
      q: "Is Boston a fast course?",
      a: "It can be, but it is harder to run well than a flat course. The net downhill only helps if your quads hold up and you don't run the first miles too fast. Plan a conservative first half.",
    },
  ],
  sources: [
    {
      label: "2027 registration and qualifying window (Marathon Handbook)",
      url: "https://marathonhandbook.com/boston-marathon-2027-registration-opens/",
    },
    { label: "Qualifying (B.A.A.)", url: "https://www.baa.org/races/boston-marathon/qualify" },
    {
      label: "Mile-by-mile course guide (The Running Channel)",
      url: "https://therunningchannel.com/boston-marathon-mile-by-mile/",
    },
  ],
};
