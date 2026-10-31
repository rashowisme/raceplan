import type { RaceGuide } from "./types";

export const vingtKmDeParis: RaceGuide = {
  slug: "20-km-de-paris",
  locale: "fr",
  name: "20 km de Paris",
  city: "Paris",
  race: { type: "custom", distanceM: 20_000 },
  nextEdition: {
    date: null,
    estimatedDate: "2027-10-10",
    usualPeriod: "mi-octobre",
  },
  summary:
    "20 km autour de la tour Eiffel et dans le bois de Boulogne, mi-octobre : une préparation d'été pour une distance entre 10 km et semi.",
  intro:
    "Les 20 km de Paris partent du pont d'Iéna, au pied de la tour Eiffel, traversent le bois de Boulogne et reviennent vers la tour Eiffel. Le parcours est globalement roulant, avec une montée marquée dans le bois. La course a lieu à la mi-octobre : la préparation se fait en été, de juillet à septembre. Une distance un peu plus courte qu'un semi, idéale pour une première longue course ou pour viser un chrono à la rentrée. Voici comment la préparer, avec des exemples de plans calculés sur une date de référence en attendant l'annonce de l'édition 2027.",
  facts: [
    { label: "Distance", value: "20 km" },
    { label: "Type de parcours", value: "Roulant, avec une montée dans le bois de Boulogne" },
    { label: "Départ / arrivée", value: "Pont d'Iéna, tour Eiffel" },
    { label: "Saison de préparation", value: "Été (juillet à septembre)" },
  ],
  course: [
    {
      title: "Une montée vers le 6e kilomètre",
      body: "Le parcours est réputé roulant, mais la traversée du bois de Boulogne comporte une montée marquée, autour du 6e kilomètre selon les comptes rendus de course. Elle arrive tôt : grimpez-la à l'effort, sans chercher à tenir votre allure, pour ne pas le payer dans les dix derniers kilomètres.",
    },
    {
      title: "Quelques passages sur chemin stabilisé",
      body: "Dans le bois, une partie du parcours emprunte des allées et des chemins stabilisés. Rien de technique, mais l'appui est moins franc que sur l'asphalte : faites une partie de vos sorties dans un parc, sur ce type de revêtement.",
    },
    {
      title: "Ni un 10 km, ni un semi",
      body: "Sur 20 km, l'allure se situe entre celle du 10 km et celle du semi. Les exemples de plans ci-dessous sont calculés pour 20 km : la sortie longue approche la distance de course chez les coureurs confirmés, et les séances de seuil construisent l'endurance à allure soutenue.",
    },
  ],
  calendar: [
    {
      title: "Une préparation d'été",
      body: "Pour une course mi-octobre, une préparation de 12 à 14 semaines commence début ou mi-juillet. Les séances les plus dures tombent fin août et en septembre. Par forte chaleur, courez tôt, ralentissez les footings et décalez une séance de qualité à un jour plus frais plutôt que de la forcer.",
    },
    {
      title: "Les vacances au milieu du plan",
      body: "Les vacances d'été tombent pendant la phase de base et de développement. Courir en vacances, c'est souvent découvrir de nouveaux parcours : gardez trois à quatre sorties par semaine, dont la sortie longue. Signalez les séances manquées dans l'application : le plan s'adapte.",
    },
    {
      title: "La rentrée, phase spécifique",
      body: "Septembre correspond à la phase spécifique et à l'affûtage. Avec la reprise, fixez vos séances clés dans l'agenda comme des rendez-vous, et gardez au moins une sortie à allure course par semaine sur un parcours plat.",
    },
  ],
  milestones: [
    { date: "2027-07-14", label: "Fête nationale : sortie au frais du matin" },
    { date: "2027-09-01", label: "Rentrée : place aux séances spécifiques" },
  ],
  faq: [
    {
      q: "Peut-on préparer les 20 km de Paris en 8 semaines ?",
      a: "C'est possible si vous courez déjà régulièrement, avec une sortie longue d'au moins 12 km. Pour une première course de cette distance, prévoyez plutôt 12 à 14 semaines, comme dans les exemples ci-dessous.",
    },
  ],
  sources: [
    {
      label: "Analyse du parcours (Campus Coach)",
      url: "https://www.campus.coach/blog/analyse-du-parcours-des-20-km-de-paris",
    },
    {
      label: "Édition 2026 (Paris je t'aime)",
      url: "https://parisjetaime.com/evenement/20km-de-paris-e054",
    },
    {
      label: "Une course monumentale (Finishers)",
      url: "https://www.finishers.com/blog/vredestein-20-km-de-paris-une-course-monumentale",
    },
  ],
};
