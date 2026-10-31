import type { RaceGuide } from "./types";

export const ecotrailParis30: RaceGuide = {
  slug: "ecotrail-paris-30-km",
  locale: "fr",
  name: "EcoTrail Paris 30 km",
  city: "Meudon → Paris",
  race: { type: "trail", distanceM: 30_000, elevationGainM: 500 },
  likes: ["hills"],
  nextEdition: {
    date: "2027-03-20",
    estimatedDate: "2027-03-20",
    usualPeriod: "fin mars",
  },
  summary:
    "30 km et environ 500 m de dénivelé, des forêts de l'ouest parisien jusqu'à la Seine, fin mars : un trail de transition entre route et nature.",
  intro:
    "Le 30 km de l'EcoTrail Paris est une porte d'entrée idéale vers le trail : environ 30 km et 500 m de dénivelé positif, à travers la forêt de Meudon et le domaine de Saint-Cloud, avant de rejoindre la Seine en direction du pont d'Iéna. Le parcours est majoritairement en nature, mais il finit au bord du fleuve, en ville. Il a lieu fin mars : la préparation se fait en hiver, souvent sur des chemins boueux. Voici comment le préparer, avec des exemples de plans calculés pour l'édition 2027.",
  facts: [
    { label: "Distance", value: "Environ 30 km" },
    { label: "Dénivelé positif", value: "Environ 500 m (selon les sources)" },
    { label: "Terrain", value: "Forêts et parcs, puis bords de Seine" },
    { label: "Saison de préparation", value: "Hiver (décembre à mars)" },
  ],
  course: [
    {
      title: "Des côtes courtes et répétées, pas de grande montée",
      body: "Le dénivelé vient d'une succession de bosses en forêt et dans les parcs, pas d'un long col. Ce qui fatigue, ce sont les relances : monter, redescendre, repartir. Le plan privilégie les séances de côtes : courtes montées à bonne allure et retours en trottinant. En sortie longue, cherchez un parcours vallonné, en forêt si vous le pouvez.",
    },
    {
      title: "Des descentes à apprivoiser",
      body: "Après chaque bosse vient une descente, souvent sur terrain humide en mars. Les cuisses travaillent beaucoup plus qu'on ne le croit. Le plan inclut du travail de descente : petites foulées rapides, regard loin devant, sans freiner sur les talons. Commencez sur des pentes douces et des chemins secs.",
    },
    {
      title: "Une fin roulante au bord de la Seine",
      body: "Après les forêts, le parcours rejoint la Seine pour finir sur du plat. C'est souvent là que les coureurs qui sont partis trop vite dans les bosses perdent le plus de temps. Gérez les montées à l'effort, en marchant si besoin, pour garder de quoi courir les derniers kilomètres. Vérifiez le tracé et le lieu d'arrivée exacts de votre édition sur le site officiel.",
    },
  ],
  calendar: [
    {
      title: "L'hiver sur les sentiers",
      body: "Pour le 20 mars, une préparation de 12 à 16 semaines commence entre fin novembre et fin décembre. Les sorties longues tombent en janvier et février, sur des chemins souvent gras. Des chaussures de trail avec un bon crampon, une couche coupe-vent et une frontale si vous partez tôt ou rentrez tard font partie de la préparation.",
    },
    {
      title: "Tester le matériel avant la course",
      body: "Même sur 30 km, testez à l'entraînement ce que vous porterez et mangerez : sac ou ceinture, gourdes, barres ou gels. Le règlement de chaque édition précise le matériel obligatoire : lisez-le tôt, pour courir au moins deux sorties longues avec votre équipement de course.",
    },
    {
      title: "Noël dans la phase de base",
      body: "Les fêtes tombent au début de la préparation, quand le volume est encore modéré. Une semaine plus souple ne compromet rien ; en revanche, profitez des jours de congé pour une sortie longue de jour, en forêt.",
    },
  ],
  milestones: [{ date: "2026-12-25", label: "Noël : sortie longue en forêt, de jour" }],
  faq: [
    {
      q: "Peut-on courir l'EcoTrail 30 km sans expérience du trail ?",
      a: "Oui, si vous courez déjà régulièrement et que vous ajoutez du terrain vallonné à votre préparation. Le premier exemple de plan ci-dessous part de 25 km par semaine sur 16 semaines. Marcher dans les montées les plus raides est normal, y compris pour des coureurs expérimentés.",
    },
  ],
  sources: [
    {
      label: "Date et distances de l'édition 2027 (Reference Trail)",
      url: "https://reference-trail.fr/ecotrail-paris-2027-les-inscriptions-demarrent-doucement-pour-cette-20e-edition/",
    },
    {
      label: "Parcours de l'EcoTrail Paris (Finishers)",
      url: "https://www.finishers.com/articles/quel-est-le-parcours-de-l-ecotrail-paris",
    },
    { label: "Fiche du 30 km (werun.world)", url: "https://werun.world/?p=13541" },
  ],
};
