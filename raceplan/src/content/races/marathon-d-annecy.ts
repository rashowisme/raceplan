import type { RaceGuide } from "./types";

export const marathonDAnnecy: RaceGuide = {
  slug: "marathon-d-annecy",
  locale: "fr",
  name: "Marathon du lac d'Annecy",
  city: "Annecy",
  race: { type: "marathon" },
  nextEdition: {
    date: null,
    estimatedDate: "2027-04-18",
    usualPeriod: "mi-avril",
  },
  summary:
    "Un marathon au bord du lac, mi-avril, avec un léger dénivelé : une préparation d'hiver au pied des montagnes.",
  intro:
    "Le Marathon du lac d'Annecy longe la rive ouest du lac, entre route, piste cyclable et chemins, avec un départ et une arrivée au Pâquier. Le dénivelé est faible mais réel, autour d'une centaine de mètres selon les sources. Il se court à la mi-avril : la préparation tombe en plein hiver, dans une région où il fait froid et où la neige n'est jamais loin. Voici comment le préparer, avec des exemples de plans calculés sur une date de référence en attendant l'annonce de l'édition 2027.",
  facts: [
    { label: "Distance", value: "42,195 km" },
    { label: "Type de parcours", value: "Bord de lac, léger dénivelé (environ 80 à 100 m)" },
    { label: "Revêtement", value: "Route, piste cyclable et chemins" },
    { label: "Saison de préparation", value: "Hiver (décembre à avril)" },
  ],
  course: [
    {
      title: "Un parcours roulant… avec des relances",
      body: "Avec environ une centaine de mètres de dénivelé, le tracé n'a rien d'une course de montagne, mais il n'est pas parfaitement plat. Les petites bosses reviennent régulièrement : courez-les à l'effort, en raccourcissant la foulée, et relancez progressivement derrière. En sortie longue, alternez parcours plats et parcours légèrement vallonnés.",
    },
    {
      title: "Plusieurs revêtements",
      body: "Route, piste cyclable et passages sur chemin se succèdent. Rien de technique, mais l'appui change : choisissez des chaussures confortables sur la durée plutôt que les plus légères, et testez-les sur une sortie longue mixte.",
    },
    {
      title: "Le cadre aide, l'allure doit rester sage",
      body: "Le décor du lac et des montagnes porte les coureurs, et il est tentant de partir vite. Les séances à allure marathon du plan servent à mémoriser l'allure pour la tenir dès le premier kilomètre. Gardez l'énergie pour la deuxième moitié, où les relances se font sentir.",
    },
  ],
  calendar: [
    {
      title: "S'entraîner en hiver en Haute-Savoie",
      body: "Pour une course à la mi-avril, une préparation de 16 à 20 semaines commence entre fin novembre et fin décembre. Les sorties longues tombent en janvier et février : prévoyez des parcours dégagés et sûrs (bords de lac, pistes cyclables) quand les chemins sont enneigés ou verglacés, et décalez une séance plutôt que de la courir sur la glace.",
    },
    {
      title: "Les vacances d'hiver au milieu du plan",
      body: "Les vacances de février tombent en pleine phase de développement. Une semaine au ski n'est pas incompatible avec la préparation : remplacez une séance par une journée de ski de fond ou de randonnée si besoin, et gardez la sortie longue. Signalez les séances manquées dans l'application : le plan s'adapte.",
    },
    {
      title: "Pâques peu avant la course",
      body: "Le lundi de Pâques (29 mars 2027) tombe environ trois semaines avant la date de référence, en fin de phase spécifique : un jour férié pratique pour la dernière grosse sortie longue avant l'affûtage. La date exacte de la course doit encore être annoncée : vérifiez-la avant de lancer votre plan.",
    },
  ],
  milestones: [
    { date: "2026-12-25", label: "Noël : semaine souple" },
    { date: "2027-03-29", label: "Lundi de Pâques : dernière grosse sortie longue" },
  ],
  faq: [
    {
      q: "Le Marathon d'Annecy est-il plus dur qu'un marathon plat ?",
      a: "Un peu : environ une centaine de mètres de dénivelé et des changements de revêtement coûtent quelques minutes par rapport à un parcours parfaitement plat. Préparez-vous avec des sorties longues légèrement vallonnées, et visez un chrono un peu plus prudent que sur un marathon urbain plat.",
    },
  ],
  sources: [
    {
      label: "Édition 2027 annoncée en avril (marathons.com)",
      url: "https://www.marathons.com/fr/events/marathon-du-lac-d-annecy_m8ZVe",
    },
    {
      label: "Dénivelé du parcours (Reference Trail)",
      url: "https://reference-trail.fr/a-quel-denivele-sattendre-pour-le-marathon-dannecy-2025/",
    },
    {
      label: "Parcours (Campus Coach)",
      url: "https://www.campus.coach/blog/marathon-lac-annecy",
    },
  ],
};
