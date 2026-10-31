import type { RaceGuide } from "./types";

export const marathonRunInLyon: RaceGuide = {
  slug: "marathon-run-in-lyon",
  locale: "fr",
  name: "Marathon du Run In Lyon",
  city: "Lyon",
  race: { type: "marathon" },
  likes: ["hills"],
  nextEdition: {
    date: null,
    estimatedDate: "2027-10-03",
    usualPeriod: "début octobre",
  },
  summary:
    "Un marathon urbain début octobre, du Vieux-Lyon à Bellecour, avec près de 300 m de dénivelé : une préparation d'été.",
  intro:
    "Le marathon du Run In Lyon part du Vieux-Lyon et arrive place Bellecour, début octobre. Avec près de 300 m de dénivelé positif sur l'édition 2026, c'est un marathon urbain plus vallonné que la moyenne. La date impose une préparation en plein été, de juin à septembre, avec la chaleur et les vacances au milieu du plan. Voici comment le préparer, avec des exemples de plans calculés sur une date de référence en attendant l'annonce de l'édition 2027.",
  facts: [
    { label: "Distance", value: "42,195 km" },
    { label: "Dénivelé positif", value: "Environ 290 m (édition 2026)" },
    { label: "Départ / arrivée", value: "Vieux-Lyon → place Bellecour" },
    { label: "Saison de préparation", value: "Été (juin à septembre)" },
  ],
  course: [
    {
      title: "Un marathon urbain vallonné",
      body: "Près de 300 m de dénivelé, c'est nettement plus qu'un marathon plat. Les montées coûtent de l'énergie, les descentes fatiguent les cuisses. Les exemples de plans ci-dessous privilégient les séances de côtes ; intégrez aussi des montées à vos sorties longues et courez-les à l'effort constant. En course, acceptez de ralentir dans les montées : vous rattraperez une partie du temps dans les descentes sans forcer.",
    },
    {
      title: "Un parcours qui change",
      body: "Le parcours a été remanié pour l'édition 2026, avec notamment la suppression du passage par le tunnel de la Croix-Rousse. Il peut encore évoluer : consultez le tracé de votre édition sur le site officiel avant de choisir votre allure cible.",
    },
    {
      title: "Une barrière horaire à connaître",
      body: "L'édition 2026 affichait un temps limite de 5 h 30. Si vous visez plus de 5 heures, regardez les barrières horaires intermédiaires de votre édition et entraînez-vous à un rythme qui vous laisse de la marge, en tenant compte des montées.",
    },
  ],
  calendar: [
    {
      title: "Une préparation en été",
      body: "Pour une course début octobre, une préparation de 16 à 20 semaines commence entre mi-mai et mi-juin. Les grosses semaines tombent en août et septembre. Par temps chaud, courez tôt le matin, ralentissez l'allure des footings sans culpabiliser et emportez de l'eau sur les sorties longues : c'est l'effort qui compte, pas l'allure affichée.",
    },
    {
      title: "Les vacances d'août",
      body: "Les congés d'été tombent souvent en pleine phase de développement. Le plan reste faisable en vacances : décalez les séances selon vos journées et gardez la sortie longue. Si vous manquez une partie de la semaine, signalez-le dans l'application : la semaine suivante s'adapte sans vous faire rattraper.",
    },
    {
      title: "La rentrée et l'affûtage",
      body: "Les dernières semaines tombent en septembre, avec la reprise du travail et de l'école. L'affûtage réduit déjà le volume : profitez-en pour soigner le sommeil, et faites votre dernière grosse sortie longue avant que l'agenda de la rentrée ne se remplisse.",
    },
  ],
  milestones: [
    { date: "2027-07-14", label: "Fête nationale : jour férié pour une sortie longue au frais" },
    { date: "2027-08-15", label: "Mi-août : cœur de la préparation" },
  ],
  faq: [
    {
      q: "Comment s'entraîner pour le dénivelé du Run In Lyon ?",
      a: "Ajoutez des côtes à une sortie par semaine et choisissez des parcours vallonnés pour une partie de vos sorties longues. Inutile de chercher de longues montées : ce sont les relances répétées qui comptent sur un marathon urbain vallonné.",
    },
  ],
  sources: [
    {
      label: "Édition 2026 : parcours, dénivelé, temps limite (marathons.com)",
      url: "https://www.marathons.com/en/run-in-lyon/run-in-lyon-2026-36-000-runners-expected-for-record-breaking-edition_o184",
    },
    {
      label: "Tout savoir sur l'édition 2026 (Stadion Actu)",
      url: "https://stadion-actu.fr/run-in-lyon-tout-savoir-sur-ledition-2026-avec-36-000-coureurs-attendus/",
    },
  ],
};
