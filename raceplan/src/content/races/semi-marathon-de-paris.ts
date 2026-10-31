import type { RaceGuide } from "./types";

export const semiMarathonDeParis: RaceGuide = {
  slug: "semi-marathon-de-paris",
  locale: "fr",
  name: "Semi-marathon de Paris",
  city: "Paris",
  race: { type: "half" },
  nextEdition: {
    date: "2027-03-07",
    estimatedDate: "2027-03-07",
    usualPeriod: "début mars",
  },
  summary:
    "21,1 km dans Paris début mars, avec un passage par le bois de Vincennes : une préparation d'hiver, souvent en route vers le marathon.",
  intro:
    "Le Semi-marathon de Paris est l'un des semis les plus courus de France. Il se dispute début mars : la préparation tombe donc en plein hiver, de décembre à février, avec Noël dans les premières semaines. Le parcours part du centre de Paris, passe par le bois de Vincennes et revient dans la ville. Pour beaucoup de coureurs, c'est aussi une étape vers le Marathon de Paris, quatre semaines plus tard. Voici comment le préparer, avec des exemples de plans calculés pour l'édition 2027.",
  facts: [
    { label: "Distance", value: "21,097 km" },
    { label: "Type de parcours", value: "Urbain, avec des faux plats dans le bois de Vincennes" },
    { label: "Saison de préparation", value: "Hiver (décembre à février)" },
    { label: "Inscriptions", value: "Par tirage au sort ces dernières années" },
  ],
  course: [
    {
      title: "Des faux plats dans le bois de Vincennes",
      body: "Le parcours récent part du boulevard Saint-Germain et arrive place de la Bastille, avec un passage par le bois de Vincennes en première partie. On y trouve des faux plats qui cassent le rythme. À l'entraînement, gardez votre sortie longue sur un terrain légèrement vallonné de temps en temps, et apprenez à courir à l'effort plutôt qu'à l'allure exacte dans les montées. Le tracé peut changer d'une année à l'autre : vérifiez-le sur le site officiel.",
    },
    {
      title: "Un départ par vagues, très dense",
      body: "Des dizaines de milliers de coureurs partent par vagues. Les premiers kilomètres sont souvent encombrés, et c'est là que se perd une course : on zigzague et on part trop vite. Sur un semi, deux ou trois kilomètres trop rapides au début se paient dans les cinq derniers. Les séances à allure semi du plan servent à mémoriser cette allure pour la tenir dès le départ.",
    },
    {
      title: "Le froid de mars",
      body: "Début mars, le départ peut se faire au frais, parfois sous la pluie. Prévoyez une couche à abandonner au départ et des gants légers. Vous vous serez entraîné tout l'hiver dans ces conditions : c'est un avantage, à condition d'avoir testé votre tenue de course lors d'une sortie longue.",
    },
  ],
  calendar: [
    {
      title: "Une préparation de décembre à février",
      body: "Pour le 7 mars, une préparation de 12 semaines commence mi-décembre et une préparation de 14 semaines fin novembre. Les séances de qualité tombent en janvier et février : courez-les de jour si possible, échauffez-vous plus longtemps par temps froid, et décalez une séance d'un jour plutôt que de la courir sur le verglas.",
    },
    {
      title: "Noël et le Nouvel An dans les premières semaines",
      body: "Les fêtes tombent dans la phase de base, quand le volume est encore modéré. Une semaine un peu plus légère à ce moment-là ne compromet rien. Si vous manquez des séances, signalez-les dans l'application : le plan s'adapte sans vous faire rattraper.",
    },
    {
      title: "Si vous préparez aussi le Marathon de Paris",
      body: "Le Marathon de Paris a lieu le 4 avril 2027, quatre semaines après le semi. Dans ce cas, suivez un plan marathon et courez le semi comme une séance clé, à allure marathon ou un peu plus vite, plutôt qu'à fond. Un semi couru à bloc à quatre semaines du marathon coûte souvent plus de récupération qu'il n'apporte.",
    },
  ],
  milestones: [
    { date: "2026-12-25", label: "Noël : semaine souple bienvenue" },
    { date: "2027-04-04", label: "Marathon de Paris, quatre semaines après" },
  ],
  faq: [
    {
      q: "Combien de semaines pour préparer le Semi de Paris ?",
      a: "Comptez 12 semaines si vous courez déjà 3 à 4 fois par semaine, et 14 semaines ou plus pour un premier semi. En dessous de 10 semaines, RacePlan vous prévient que la préparation est courte et reste prudent sur le volume.",
    },
    {
      q: "Faut-il courir le Semi de Paris à fond si je fais le marathon ensuite ?",
      a: "Non : à quatre semaines du marathon, courez-le à allure marathon ou légèrement plus vite, et gardez la semaine suivante facile. C'est une excellente répétition (matériel, ravitaillement, allure) sans entamer votre fin de préparation.",
    },
  ],
  sources: [
    {
      label: "Date de l'édition 2027 (Sortir à Paris)",
      url: "https://www.sortiraparis.com/en/what-to-do-in-paris/sport-wellness/articles/210126-paris-half-marathon-2027-when-it-takes-place-and-how-to-register",
    },
    {
      label: "Parcours du Semi de Paris (Campus Coach)",
      url: "https://www.campus.coach/blog/parcours-semi-marathon-de-paris",
    },
    {
      label: "Changements 2027 et loterie (Reference Trail)",
      url: "https://reference-trail.fr/semi-marathon-de-paris-2027-les-nouveaux-changements-loterie/",
    },
  ],
};
