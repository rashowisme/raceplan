import type { RaceGuide } from "./types";

export const marseilleCassis: RaceGuide = {
  slug: "marseille-cassis",
  locale: "fr",
  name: "Marseille-Cassis",
  city: "Marseille → Cassis",
  race: { type: "custom", distanceM: 20_000 },
  likes: ["hills"],
  nextEdition: {
    date: null,
    estimatedDate: "2027-10-31",
    usualPeriod: "fin octobre",
  },
  summary:
    "20 km de Marseille à Cassis fin octobre, par le col de la Gineste : une longue montée, une longue descente, et une préparation d'été.",
  intro:
    "Marseille-Cassis est une course mythique de 20 km entre le Vélodrome et le port de Cassis. Tout se joue autour du col de la Gineste, à 327 m d'altitude : environ 5 km de montée en première partie, puis une longue descente vers Cassis. Le dénivelé positif total tourne autour de 340 m selon les sources. La course a lieu fin octobre : la préparation se fait en été, souvent sous la chaleur. Voici comment la préparer, avec des exemples de plans calculés sur une date de référence en attendant l'annonce de l'édition 2027.",
  facts: [
    { label: "Distance", value: "20 km" },
    { label: "Point haut", value: "Col de la Gineste (327 m)" },
    { label: "Dénivelé positif", value: "Environ 340 m (selon les sources)" },
    { label: "Saison de préparation", value: "Été (fin juillet à octobre)" },
  ],
  course: [
    {
      title: "Cinq kilomètres de montée vers la Gineste",
      body: "La montée vers le col dure environ 5 km. C'est une course dans la course : partez à l'effort, pas à l'allure, avec une respiration qui reste contrôlée. Ceux qui grimpent trop vite le paient dans la descente, quand les jambes ne répondent plus. Les exemples de plans ci-dessous privilégient les séances de côtes (montées répétées), et vos sorties longues doivent inclure des montées longues et régulières.",
    },
    {
      title: "Une longue descente vers Cassis",
      body: "Après le col, la descente est longue, une dizaine de kilomètres selon les comptes rendus. Elle est rapide, mais elle use les cuisses, surtout si on freine. Entraînez-vous à descendre : foulée courte et rapide, buste légèrement en avant, en commençant sur des pentes douces. Des sorties avec une longue descente quelques semaines avant la course évitent les mauvaises surprises.",
    },
    {
      title: "Des barrières horaires",
      body: "Les comptes rendus récents évoquent une barrière au col et un temps limite à l'arrivée. Si vous visez autour de 2 h 30 ou plus, consultez les barrières de votre édition et calculez votre marge à l'entraînement, en tenant compte de la montée.",
    },
  ],
  calendar: [
    {
      title: "Une préparation sous la chaleur",
      body: "Pour une course fin octobre, une préparation de 12 à 14 semaines commence entre fin juillet et début août. Les premières semaines sont souvent chaudes : courez tôt le matin, ralentissez l'allure des footings et buvez régulièrement. Gardez les séances de côtes pour les jours plus frais.",
    },
    {
      title: "Septembre pour les côtes longues",
      body: "Le mois de septembre correspond à la phase où les séances deviennent plus spécifiques. C'est le moment des montées longues et des sorties avec une vraie descente. Si vous vivez dans la région, reconnaître la montée de la Gineste en sortie longue est le meilleur entraînement possible.",
    },
    {
      title: "La logistique d'une course point à point",
      body: "Départ à Marseille, arrivée à Cassis : prévoyez le retour depuis l'arrivée et l'accès au départ avant le jour J. L'organisation communique ces informations pour chaque édition : lisez-les tôt, pour arriver serein le matin.",
    },
  ],
  milestones: [
    { date: "2027-08-15", label: "Mi-août : chaleur, footings tôt le matin" },
    { date: "2027-09-01", label: "Rentrée : côtes longues et descentes" },
  ],
  faq: [
    {
      q: "Comment s'entraîner pour la montée de la Gineste ?",
      a: "Une séance de côtes par semaine (montées de 1 à 3 minutes, retour en trottinant) et des sorties longues avec des montées de plusieurs kilomètres. Courez-les à l'effort : sur la Gineste, l'allure au kilomètre n'a plus beaucoup de sens.",
    },
    {
      q: "Faut-il travailler la descente ?",
      a: "Oui. La longue descente vers Cassis fatigue les cuisses autant que la montée fatigue le souffle. Intégrez régulièrement des descentes à vos sorties, en commençant doucement, pour habituer les muscles.",
    },
  ],
  sources: [
    {
      label: "Le col de la Gineste et l'édition 2026 (Stadion Actu)",
      url: "https://stadion-actu.fr/?p=150105",
    },
    {
      label: "Fiche de la course (Finishers)",
      url: "https://www.finishers.com/course/marseille-cassis",
    },
    {
      label: "Maintien de l'édition 2026 (Reference Trail)",
      url: "https://reference-trail.fr/marseille-cassis-2026-la-course-est-maintenue-malgre-les-rumeurs-dannulation/",
    },
  ],
};
