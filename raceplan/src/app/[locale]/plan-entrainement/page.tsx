import { RACE_GUIDES_PATHS } from "@/content/races";
import { GuideHub, hubMetadata } from "@/features/race-guides/routes";

type Props = PageProps<"/[locale]/plan-entrainement">;

const BASE = RACE_GUIDES_PATHS.fr;

export const generateMetadata = ({ params }: Props) => hubMetadata(BASE, params);

/** The list of race guides (languages whose guides live under this path). */
export default function RaceGuidesHub({ params }: Props) {
  return <GuideHub base={BASE} params={params} />;
}
