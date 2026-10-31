import type { RaceGuide } from "./types";

export const marathonDeNantes: RaceGuide = {
  slug: "marathon-de-nantes",
  locale: "fr",
  name: "Marathon de Nantes",
  city: "Nantes",
  race: { type: "marathon" },
  nextEdition: {
    date: "2027-04-25",
    estimatedDate: "2027-04-25",
    usualPeriod: "fin avril",
  },
  summary:
    "Un marathon 100 % urbain fin avril, des Machines de l'Île à la Beaujoire : une préparation de janvier à avril, un peu plus tardive que Paris.",
  intro:
    "Le Marathon de Nantes se court fin avril, dans un parcours entièrement urbain qui part des Machines de l'Île et arrive au parc de la Beaujoire. Trois semaines après Paris, il permet une préparation qui démarre après les fêtes pour un plan de 16 semaines, et laisse le temps de profiter des journées qui rallongent pour les sorties longues de mars et avril. Voici comment le préparer, avec des exemples de plans calculés pour l'édition 2027.",
  facts: [
    { label: "Distance", value: "42,195 km" },
    { label: "Type de parcours", value: "Urbain, globalement roulant" },
    { label: "Départ / arrivée", value: "Machines de l'Île → parc de la Beaujoire" },
    { label: "Saison de préparation", value: "Hiver et printemps (janvier à avril)" },
  ],
  course: [
    {
      title: "Roulant, mais pas tout plat",
      body: "Le parcours est souvent décrit comme roulant et adapté pour viser un chrono, mais pas totalement plat : les sources ne s'accordent pas sur le dénivelé exact, et les retours de coureurs évoquent un départ plutôt plat puis un parcours plus vallonné ensuite. Incluez régulièrement des faux plats dans vos sorties longues et courez les montées à l'effort, sans chercher à tenir l'allure à la seconde.",
    },
    {
      title: "Un parcours point à point",
      body: "Départ au cœur de la ville, sur l'île de Nantes, arrivée à la Beaujoire : le tracé ne boucle pas. Pensez à la logistique la veille (accès au départ, retour depuis l'arrivée, consigne) pour arriver serein le matin. Le tracé définitif de chaque édition est publié par l'organisateur.",
    },
    {
      title: "Une météo de fin avril souvent douce",
      body: "Fin avril, il peut faire nettement plus doux que pendant vos sorties d'hiver. Si la journée s'annonce chaude, buvez dès les premiers ravitaillements et acceptez de partir un peu plus lentement. Faites au moins une sortie longue par temps doux en avril pour tester votre hydratation.",
    },
  ],
  calendar: [
    {
      title: "Commencer après les fêtes, ou juste avant",
      body: "Pour le 25 avril, un plan de 16 semaines démarre le 4 janvier : idéal pour éviter les fêtes. Un plan de 18 à 20 semaines démarre en décembre et laisse plus de marge, notamment pour un premier marathon.",
    },
    {
      title: "Pâques au milieu de la préparation",
      body: "Le week-end de Pâques (28 et 29 mars 2027) tombe pendant la phase spécifique, quand les sorties longues sont les plus longues. Profitez du lundi férié pour la sortie longue de la semaine si le dimanche est pris par la famille, plutôt que de la sauter.",
    },
    {
      title: "Des sorties longues qui profitent du jour",
      body: "Le changement d'heure du 28 mars 2027 donne des soirées plus claires pour les séances de semaine pendant les dernières semaines. C'est le moment des séances à allure marathon : courez-les sur un parcours plat que vous connaissez, pour vous concentrer sur l'allure.",
    },
  ],
  milestones: [
    { date: "2027-03-28", label: "Changement d'heure et Pâques" },
    { date: "2027-03-29", label: "Lundi de Pâques : jour idéal pour une sortie longue" },
  ],
  faq: [
    {
      q: "Le Marathon de Nantes est-il un bon premier marathon ?",
      a: "Oui : parcours urbain, date de fin avril qui permet de préparer après les fêtes, et une ambiance de grande course. Prévoyez 18 à 20 semaines si vous partez de 25 à 30 km par semaine, comme dans le premier exemple ci-dessous.",
    },
  ],
  sources: [
    {
      label: "Édition 2027 (Nantes Métropole)",
      url: "https://metropole.nantes.fr/que-faire-a-nantes/agenda/inscriptions-imminentes-marathon-de-nantes-semi-marathon-foulees-de-lelephant-2027",
    },
    {
      label: "Parcours 2026 et infos pratiques (Nantes Métropole)",
      url: "https://metropole.nantes.fr/actualites/5-choses-savoir-sur-le-marathon-de-nantes",
    },
    {
      label: "Avis sur le parcours (Reference Trail)",
      url: "https://reference-trail.fr/que-vaut-le-marathon-de-nantes-mon-avis-sur-cette-course-mythique-de-2025/",
    },
  ],
};
