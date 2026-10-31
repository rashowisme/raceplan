import type { RaceGuide } from "./types";

export const marathonDeParis: RaceGuide = {
  slug: "marathon-de-paris",
  locale: "fr",
  name: "Marathon de Paris",
  city: "Paris",
  race: { type: "marathon" },
  nextEdition: {
    date: "2027-04-04",
    estimatedDate: "2027-04-04",
    usualPeriod: "début avril",
    label: "50e édition",
  },
  summary:
    "42,195 km dans les rues de Paris, début avril : une préparation qui se fait en plein hiver.",
  intro:
    "Le Marathon de Paris est l'un des plus grands marathons du monde : des dizaines de milliers de coureurs au départ, un parcours urbain globalement plat et une date de début avril. Pour la plupart des coureurs, cela veut dire une préparation de décembre à mars, avec des sorties longues dans le froid et des fêtes de fin d'année au milieu du plan. Voici comment s'y préparer, avec des exemples de plans calculés pour l'édition 2027.",
  facts: [
    { label: "Type de parcours", value: "Urbain, globalement plat" },
    { label: "Saison de préparation", value: "Hiver (décembre à mars)" },
    { label: "Participants", value: "Plusieurs dizaines de milliers" },
  ],
  course: [
    {
      title: "Un départ très dense : ne partez pas trop vite",
      body: "Avec autant de coureurs, le départ se fait par vagues et les premiers kilomètres sont souvent encombrés. C'est le piège classique : on slalome, on accélère pour rattraper le temps perdu et on le paie après le 30e km. Visez une allure régulière dès le premier kilomètre, quitte à être quelques secondes plus lent au début. À l'entraînement, les séances à allure marathon du plan servent exactement à mémoriser cette allure.",
    },
    {
      title: "Un parcours plat, mais pas sans relances",
      body: "Le tracé est globalement plat, ce qui en fait un bon parcours pour viser un chrono. Comme sur tout marathon urbain, il y a des virages, des faux plats et des relances : l'endurance à allure régulière compte plus que la vitesse pure. Le parcours a été remanié pour l'édition 2027 : consultez le tracé définitif sur le site officiel avant la course.",
    },
    {
      title: "Une météo de début avril difficile à prévoir",
      body: "Début avril, les matinées peuvent être fraîches et la journée nettement plus douce au soleil. Prévoyez une tenue de départ que vous pouvez abandonner (vieux pull, poncho), et testez à l'entraînement ce que vous boirez et mangerez pendant la course, surtout si le temps est doux : vous vous serez entraîné tout l'hiver au frais.",
    },
  ],
  calendar: [
    {
      title: "Une préparation en plein hiver",
      body: "Pour un départ le 4 avril, une préparation de 16 à 20 semaines commence entre mi-novembre et mi-décembre. Les sorties longues tombent en janvier et février : courez-les de jour quand c'est possible, couvrez-vous en conséquence, et n'hésitez pas à décaler une séance d'un jour en cas de verglas plutôt que de la forcer.",
    },
    {
      title: "Les fêtes de fin d'année au début du plan",
      body: "Noël tombe dans les premières semaines de la préparation, pendant la phase de base. C'est le bon moment pour une semaine plus souple : les plans prévoient de toute façon des semaines allégées régulières, et une séance manquée à cette période ne compromet rien. Dans l'application, signalez-la : le plan s'adapte sans vous faire rattraper.",
    },
    {
      title: "Le Semi de Paris, quatre semaines avant",
      body: "Le Semi-marathon de Paris a lieu le 7 mars 2027, quatre semaines avant le marathon. Si vous y êtes inscrit, courez-le comme une séance clé plutôt qu'à fond : à allure marathon, ou un peu plus vite sur la fin si vous êtes en forme. Courir un semi à bloc à quatre semaines du marathon coûte souvent plus de récupération qu'il n'apporte.",
    },
    {
      title: "Le lundi de Pâques en semaine de course",
      body: "Le lundi de Pâques tombe le 29 mars 2027, dans la semaine du marathon. Un jour férié bienvenu pour se reposer, mais attention aux repas de Pâques la veille et aux déplacements du week-end : la semaine de course se joue sur le sommeil et la régularité, pas sur de nouvelles habitudes.",
    },
  ],
  milestones: [
    { date: "2026-12-25", label: "Noël : semaine souple bienvenue" },
    { date: "2027-03-07", label: "Semi-marathon de Paris, à allure marathon" },
    { date: "2027-03-29", label: "Lundi de Pâques, en semaine de course" },
  ],
  faq: [
    {
      q: "Peut-on préparer le Marathon de Paris en 12 semaines ?",
      a: "Oui si vous courez déjà régulièrement, avec une sortie longue d'au moins 15 km et 30 km ou plus par semaine. Pour un premier marathon, comptez plutôt 16 à 20 semaines : en dessous, RacePlan vous prévient que la préparation est courte et reste prudent sur le volume.",
    },
    {
      q: "Faut-il courir le Semi de Paris pendant la préparation ?",
      a: "C'est une bonne répétition générale (ravitaillement, matériel, allure), à condition de ne pas le courir à fond. Courez-le à allure marathon ou légèrement plus vite, et gardez la semaine suivante facile.",
    },
  ],
  sources: [
    {
      label: "Date de l'édition 2027 (Sortir à Paris)",
      url: "https://www.sortiraparis.com/en/what-to-do-in-paris/sport-wellness/articles/50290-paris-marathon-2027-the-date-of-the-city-s-biggest-race-and-the-registration-details",
    },
    {
      label: "Date du Semi de Paris 2027 (Sortir à Paris)",
      url: "https://www.sortiraparis.com/en/what-to-do-in-paris/sport-wellness/articles/210126-paris-half-marathon-2027-when-it-takes-place-and-how-to-register",
    },
    {
      label: "Nouveau parcours 2027 (Reference Trail)",
      url: "https://reference-trail.fr/marathon-de-paris-2027-inscriptions-tirage-au-sort-prix-date-et-nouveau-parcours/",
    },
  ],
};
