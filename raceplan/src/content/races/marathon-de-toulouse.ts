import type { RaceGuide } from "./types";

export const marathonDeToulouse: RaceGuide = {
  slug: "marathon-de-toulouse",
  locale: "fr",
  name: "Marathon de Toulouse",
  city: "Toulouse",
  race: { type: "marathon" },
  nextEdition: {
    date: null,
    estimatedDate: "2027-10-31",
    usualPeriod: "fin octobre ou début novembre",
  },
  summary:
    "Un marathon plat dans Toulouse, autour de la Toussaint : une préparation d'été, avec la fin de saison chaude du Sud-Ouest.",
  intro:
    "Le Marathon de Toulouse se court autour de la Toussaint, sur un parcours plat qui relie les grands sites de la ville. L'édition 2026 annonçait environ 130 m de dénivelé positif et un parcours remanié, avec un passage inédit par le stadium de l'île du Ramier. La date impose une préparation d'été, de juin à octobre, dans une région où la chaleur peut durer jusqu'en septembre. Voici comment le préparer, avec des exemples de plans calculés sur une date de référence en attendant l'annonce de l'édition 2027.",
  facts: [
    { label: "Distance", value: "42,195 km" },
    { label: "Type de parcours", value: "Urbain et plat (environ 130 m de D+)" },
    { label: "Temps limite", value: "6 h (édition 2026)" },
    { label: "Saison de préparation", value: "Été et début d'automne" },
  ],
  course: [
    {
      title: "Un parcours plat pour viser un chrono",
      body: "Avec environ 130 m de dénivelé, Toulouse fait partie des marathons rapides. La difficulté n'est pas le relief mais la régularité : tenir la même allure du 5e au 35e kilomètre. Les séances à allure marathon du plan sont la clé : courez-les sur du plat, sans montre si vous le pouvez une fois sur deux, pour apprendre la sensation de l'allure.",
    },
    {
      title: "Un parcours qui évolue",
      body: "L'édition 2026 a inauguré un nouveau tracé, de la Cité de l'Espace au Pont-Neuf. Le parcours peut encore changer : consultez celui de votre édition, notamment la zone d'arrivée, pour planifier ravitaillements et gels.",
    },
    {
      title: "Six heures de temps limite",
      body: "Avec un temps limite de 6 h en 2026, Toulouse est accessible à un premier marathon en marchant une partie du parcours si besoin. Une stratégie course-marche dès le départ (par exemple 9 minutes de course, 1 minute de marche) est une option prudente à tester en sortie longue.",
    },
  ],
  calendar: [
    {
      title: "S'entraîner pendant l'été toulousain",
      body: "Pour une course fin octobre, une préparation de 16 à 20 semaines commence entre mi-juin et mi-juillet. Les grosses semaines tombent en septembre, parfois encore chaud. Courez tôt le matin ou en soirée, emportez de l'eau et ralentissez sans hésiter : par forte chaleur, gardez l'effort, pas l'allure.",
    },
    {
      title: "Les vacances d'été en phase de base",
      body: "Juillet et août correspondent à la phase de base : beaucoup d'endurance facile, peu d'intensité. C'est la partie la plus facile à garder en vacances. Gardez la sortie longue chaque semaine ; si vous manquez des séances, signalez-les dans l'application, le plan s'adapte.",
    },
    {
      title: "Les vacances de la Toussaint autour de la course",
      body: "La course tombe généralement pendant les vacances de la Toussaint. Pratique pour l'affûtage et la récupération, à condition de ne pas multiplier les déplacements la semaine de course.",
    },
  ],
  milestones: [
    { date: "2027-07-14", label: "Fête nationale : sortie longue tôt le matin" },
    { date: "2027-08-15", label: "Mi-août : chaleur, effort plutôt qu'allure" },
  ],
  faq: [
    {
      q: "Le Marathon de Toulouse est-il adapté à un premier marathon ?",
      a: "Oui : parcours plat, temps limite de 6 h (édition 2026) et une préparation qui se cale sur l'été. Comptez 18 à 20 semaines si vous partez de 25 à 30 km par semaine.",
    },
  ],
  sources: [
    {
      label: "Nouveau parcours 2026 (marathons.com)",
      url: "https://www.marathons.com/fr/toulouse-metropole-run-experience/harmonie-mutuelle-toulouse-metropole-run-experience-un-parcours-inedit-pour-l-edition-2026_wv04",
    },
    {
      label: "Fiche de l'édition 2026 (Tourisme Occitanie)",
      url: "https://www.tourisme-occitanie.com/fr/fiche/fete-et-manifestation/toulouse-metropole-run-experience-marathon-de-toulouse-toulouse_TFOFMACRTL1740564158/",
    },
  ],
};
