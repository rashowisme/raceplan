"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import type { TrainingPlan } from "@/engine/types";
import { Link } from "@/i18n/navigation";
import { getPlanRepository } from "@/storage";

/** Placeholder until the calendar (M3). */
export function PlanView() {
  const t = useTranslations("plan");
  const [plan, setPlan] = useState<TrainingPlan | null | undefined>(undefined);
  useEffect(() => {
    void getPlanRepository()
      .load("current")
      .then((s) => setPlan(s?.plan ?? null));
  }, []);
  if (plan === undefined) return null;
  if (plan === null) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("empty")}</p>
        <Link href="/plan/new" className={buttonVariants({ className: "mt-4" })}>
          {t("createOne")}
        </Link>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        {plan.startDate} → {plan.raceDate} · {plan.weeks.length}
      </p>
      <p className="text-muted-foreground mt-6 text-xs">{t("disclaimer")}</p>
    </div>
  );
}
