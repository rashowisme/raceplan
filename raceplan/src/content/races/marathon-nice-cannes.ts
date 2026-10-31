import type { RaceGuide } from "./types";

export const marathonNiceCannes: RaceGuide = {
  slug: "marathon-nice-cannes",
  locale: "fr",
  name: "Marathon Nice-Cannes",
  city: "Nice → Cannes",
  race: { type: "marathon" },
  nextEdition: {
    date: null,
    estimatedDate: "2027-11-07",
    usualPeriod: "début novembre",
  },
  summary:
    "42 km au bord de la Méditerranée, de la Promenade des Anglais à la Croisette, début novembre : un marathon point à point exposé au vent.",
  intro:
    "Le marathon Nice-Cannes relie la Promenade des Anglais à la Croisette, presque entièrement en bord de mer. Le parcours est plat, avec environ 100 m de dénivelé annoncés par l'organisation, mais exposé : selon les éditions, le vent de face a parfois empêché les records, ou au contraire rafraîchi les coureurs. La course a lieu début novembre : la préparation se fait en été et au début de l'automne, souvent sous la chaleur. Voici comment le préparer, avec des exemples de plans calculés sur une date de référence en attendant l'annonce de l'édition 2027.",
  facts: [
    { label: "Distance", value: "42,195 km" },
    { label: "Type de parcours", value: "Bord de mer, plat (environ 100 m de D+)" },
    { label: "Départ / arrivée", value: "Promenade des Anglais → la Croisette" },
    { label: "Saison de préparation", value: "Été et début d'automne" },
  ],
  course: [
    {
      title: "Le vent, l'inconnue du jour",
      body: "Presque tout le parcours longe la mer, et le vent peut changer la course : de face, il coûte plusieurs minutes ; de côté, il rafraîchit. Le jour J, si le vent est de face, abritez-vous dans un groupe et acceptez une allure un peu plus lente sur les portions exposées. À l'entraînement, courez une partie de vos sorties longues avec un vent contraire pour apprendre à garder l'effort constant.",
    },
    {
      title: "Un point à point au bord de la mer",
      body: "Départ à Nice, arrivée à Cannes : il faut organiser l'accès au départ et le retour. Des offres de transport sont proposées chaque année pour les coureurs : renseignez-vous à l'avance. Le tracé traverse plusieurs communes de la côte ; quelques portions plus exigeantes sont signalées en fin de parcours par certains comptes rendus.",
    },
    {
      title: "Plat ne veut pas dire facile",
      body: "Sans relief pour casser le rythme, l'effort est continu du début à la fin. Les séances à allure marathon du plan apprennent à tenir cette allure, et les sorties longues à gérer la fatigue des derniers kilomètres le long de la Croisette.",
    },
  ],
  calendar: [
    {
      title: "Une préparation sous le soleil",
      body: "Pour une course début novembre, une préparation de 16 à 20 semaines commence entre fin juin et mi-juillet. Sur la Côte d'Azur, juillet et août sont chauds : courez tôt, ralentissez l'allure des footings, et buvez pendant les sorties longues. L'objectif de l'été, c'est la régularité, pas la vitesse.",
    },
    {
      title: "Septembre et octobre, le cœur du plan",
      body: "Les grosses semaines et les séances spécifiques tombent en septembre et octobre, quand la chaleur baisse. Profitez des premiers matins frais pour les séances à allure marathon, et faites une ou deux sorties longues sur le front de mer pour reconnaître les conditions de course.",
    },
    {
      title: "L'affûtage avec les vacances de la Toussaint",
      body: "L'affûtage tombe autour des vacances de la Toussaint. Moins de volume, plus de sommeil : c'est le bon moment pour régler la logistique (transport, hébergement, ravitaillement).",
    },
  ],
  milestones: [
    { date: "2027-08-15", label: "Mi-août : footings tôt, avant la chaleur" },
    { date: "2027-10-01", label: "Octobre : séances spécifiques au frais" },
  ],
  faq: [
    {
      q: "Le marathon Nice-Cannes est-il rapide ?",
      a: "Le parcours est plat, ce qui en fait un bon terrain pour un chrono, mais le vent décide souvent. Préparez une allure cible et une allure « jour de vent » quelques secondes plus lente, et choisissez le jour même selon la météo.",
    },
  ],
  sources: [
    {
      label: "Dossier de presse 2024 de l'organisateur (PDF)",
      url: "https://marathon06.com/2024/dl/MAM2024-Dossier-de-presse.pdf",
    },
    {
      label: "Édition 2026 (Côte d'Azur France)",
      url: "https://cotedazurfrance.fr/offres/marathon-des-alpes-maritimes-nice-cannes-cannes-fr-3595911/",
    },
    {
      label: "Une édition dans le vent (Sportmag)",
      url: "https://sportmag.fr/running-le-marathon-nice-cannes-dans-le-vent",
    },
    {
      label: "Récit de l'édition 2025 (Running.life)",
      url: "https://running.life/courses/marathon-nice-cannes-recit-de-course",
    },
  ],
};
