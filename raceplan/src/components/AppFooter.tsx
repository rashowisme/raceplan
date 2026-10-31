import { useTranslations } from "next-intl";

export function AppFooter() {
  const t = useTranslations("footer");
  return (
    <footer className="text-muted-foreground mt-auto border-t text-xs print:hidden">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 sm:flex-row sm:justify-between">
        <p>
          {t("disclaimer")} {t("privacy")}
        </p>
        <p>{t("madeWith")}</p>
      </div>
    </footer>
  );
}
