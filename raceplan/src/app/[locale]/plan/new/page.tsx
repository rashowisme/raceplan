import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PlanForm } from "@/features/plan-form/PlanForm";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/plan/new">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "form" });
  return { title: `${t("title")} · RacePlan` };
}

export default function NewPlanPage({ params }: PageProps<"/[locale]/plan/new">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <PlanForm />;
}
