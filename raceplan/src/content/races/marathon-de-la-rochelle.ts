import type { RaceGuide } from "./types";

export const marathonDeLaRochelle: RaceGuide = {
  slug: "marathon-de-la-rochelle",
  locale: "fr",
  name: "Marathon de La Rochelle",
  city: "La Rochelle",
  race: { type: "marathon" },
  nextEdition: {
    date: null,
    estimatedDate: "2027-11-28",
    usualPeriod: "fin novembre",
  },
  summary:
    "Un marathon plat en deux boucles, fin novembre, au bord de l'Atlantique : l'un des derniers grands marathons de l'année.",
  intro:
    "Le Marathon de La Rochelle se court fin novembre, sur un parcours plat en deux boucles au départ du Vieux-Port. C'est l'un des derniers grands marathons de la saison, et une bonne cible pour les coureurs qui préfèrent s'entraîner à la fin de l'été et en automne. L'édition 2026 a lieu le 29 novembre 2026, trop tôt pour une préparation complète si vous la découvrez en novembre : cette page vise l'édition 2027, avec des exemples de plans calculés sur une date de référence en attendant son annonce.",
  facts: [
    { label: "Distance", value: "42,195 km" },
    { label: "Type de parcours", value: "Plat, deux boucles" },
    { label: "Départ", value: "Vieux-Port (quais)" },
    { label: "Saison de préparation", value: "Été et automne" },
  ],
  course: [
    {
      title: "Deux boucles : un avantage, si on part sage",
      body: "Courir deux fois la même boucle permet de connaître le terrain au deuxième passage, mais c'est aussi un piège : on passe à mi-course devant l'arrivée, et la deuxième boucle paraît longue si on est parti trop vite. Visez une première moitié légèrement plus lente que la seconde. Les séances à allure marathon du plan vous apprennent cette allure.",
    },
    {
      title: "Un parcours plat, au bord de l'océan",
      body: "Sans dénivelé notable, le parcours est propice au chrono. En bord de mer, le vent peut en revanche jouer fin novembre. Préparez une allure cible et une allure plus prudente pour un jour venté, et décidez le matin même.",
    },
    {
      title: "Le froid de fin novembre",
      body: "Fin novembre, le départ peut se faire au frais et l'humidité de l'océan accentue la sensation de froid. Une couche à abandonner au départ, des gants et un échauffement plus long que d'habitude aident à partir à la bonne allure dès le premier kilomètre.",
    },
  ],
  calendar: [
    {
      title: "Une préparation de la fin de l'été à l'automne",
      body: "Pour une course fin novembre, une préparation de 16 à 20 semaines commence entre mi-juillet et début août. La phase de base tombe pendant les vacances, et les grosses semaines en octobre et début novembre, quand il fait plus frais : de bonnes conditions pour les sorties longues.",
    },
    {
      title: "Les jours qui raccourcissent",
      body: "Le passage à l'heure d'hiver, fin octobre, tombe en pleine phase spécifique. Les séances du soir se courent de nuit : gilet réfléchissant, frontale et parcours éclairés. Gardez les sorties longues le week-end, de jour.",
    },
    {
      title: "Trop tard pour l'édition 2026 ?",
      body: "L'édition 2026 a lieu le 29 novembre 2026. RacePlan peut construire un plan court, mais pour un marathon, quelques semaines ne suffisent pas à préparer correctement la distance : visez plutôt l'édition 2027, ou un 10 km en attendant.",
    },
  ],
  milestones: [
    { date: "2027-08-15", label: "Mi-août : phase de base, endurance facile" },
    { date: "2027-10-31", label: "Passage à l'heure d'hiver : séances du soir de nuit" },
  ],
  faq: [
    {
      q: "Le Marathon de La Rochelle est-il un bon marathon pour faire un chrono ?",
      a: "Oui : le parcours est plat et en deux boucles. Le vent de bord de mer est la seule vraie inconnue. Préparez deux allures cibles et choisissez selon la météo du matin.",
    },
  ],
  sources: [
    {
      label: "Édition 2026 : date et départ (Reference Trail)",
      url: "https://reference-trail.fr/marathon-de-la-rochelle-2026-guide-dinscription-complet/",
    },
    {
      label: "Parcours plat en deux boucles (Festival en France)",
      url: "https://www.festivalenfrance.com/festival/marathon-de-la-rochelle",
    },
  ],
};
