"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { nextTheme } from "@/features/theme/theme";
import { useTheme } from "@/features/theme/useTheme";

const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;

/** One button cycling system → light → dark; the label names the current theme. */
export function ThemeToggle() {
  const t = useTranslations("header");
  const [theme, setTheme] = useTheme();
  const Icon = ICONS[theme];
  const label = t("theme", { theme });
  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme(theme))}
      aria-label={label}
      title={label}
      className="hover:bg-muted focus-visible:ring-ring grid size-9 shrink-0 place-items-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
