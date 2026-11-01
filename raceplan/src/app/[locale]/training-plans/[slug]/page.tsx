import { RACE_GUIDES_PATHS } from "@/content/races";
import { Guide, guideMetadata, guideStaticParams } from "@/features/race-guides/routes";

type Props = PageProps<"/[locale]/training-plans/[slug]">;

const BASE = RACE_GUIDES_PATHS.en;

/** Guides exist in one language each: only those pages are built. */
export const dynamicParams = false;

export const generateStaticParams = () => guideStaticParams(BASE);

export const generateMetadata = ({ params }: Props) => guideMetadata(BASE, params);

export default function RaceGuideRoute({ params }: Props) {
  return <Guide base={BASE} params={params} />;
}
