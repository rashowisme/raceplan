import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PlanView } from "@/features/plan-calendar/PlanView";

export async function generateMetadata({ params }: PageProps<"/[locale]/plan">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan" });
  return { title: `${t("title")} · RacePlan` };
}

export default function PlanPage({ params }: PageProps<"/[locale]/plan">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <PlanView />;
}
