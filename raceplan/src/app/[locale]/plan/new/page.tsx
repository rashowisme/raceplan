import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { alternates } from "@/lib/seo";
import { PlanForm } from "@/features/plan-form/PlanForm";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/plan/new">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "form" });
  const meta = await getTranslations({ locale, namespace: "meta" });
  const title = t("title");
  const description = meta("newPlanDescription");
  return {
    title,
    description,
    alternates: alternates(locale, "/plan/new"),
    openGraph: { title, description, url: `/${locale}/plan/new` },
  };
}

export default function NewPlanPage({ params }: PageProps<"/[locale]/plan/new">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  return <PlanForm />;
}
