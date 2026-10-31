/**
 * Colour theme: "system" follows the OS setting; "light"/"dark" override it.
 * The `dark` class on <html> is set before first paint by THEME_INIT_SCRIPT
 * (no flash), then kept in sync by `useTheme`.
 */

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "raceplan.theme";

export function isTheme(raw: unknown): raw is Theme {
  return typeof raw === "string" && (THEMES as readonly string[]).includes(raw);
}

/** The next theme when the toggle is pressed (system → light → dark → system). */
export function nextTheme(theme: Theme): Theme {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]!;
}

export function resolveDark(theme: Theme, systemDark: boolean): boolean {
  return theme === "dark" || (theme === "system" && systemDark);
}

/** Inline <head> script: applies the stored theme before the page renders. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
