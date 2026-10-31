import { Footprints } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { UnitToggle } from "./UnitToggle";

export function AppHeader() {
  const t = useTranslations("nav");
  return (
    <header className="bg-background/90 sticky top-0 z-30 border-b backdrop-blur print:hidden">
      <a
        href="#main"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:px-3 focus:py-2"
      >
        {t("skipToContent")}
      </a>
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-2 px-4">
        <Link
          href="/"
          className="focus-visible:ring-ring mr-auto flex items-center gap-2 rounded-md font-bold tracking-tight focus-visible:ring-2 focus-visible:outline-none"
        >
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
            <Footprints className="size-4" aria-hidden />
          </span>
          <span className="text-lg">RacePlan</span>
        </Link>
        <nav aria-label="Main" className="mr-1 hidden items-center gap-1 text-sm sm:flex">
          <Link href="/plan" className="hover:bg-muted rounded-md px-3 py-2 font-medium">
            {t("myPlan")}
          </Link>
          <Link href="/plan/new" className="hover:bg-muted rounded-md px-3 py-2 font-medium">
            {t("newPlan")}
          </Link>
        </nav>
        <UnitToggle />
        <LocaleSwitcher />
      </div>
    </header>
  );
}
