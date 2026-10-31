"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createBrowserStore } from "@/lib/browser-store";
import { isTheme, resolveDark, THEME_STORAGE_KEY, type Theme } from "./theme";

export const themeStore = createBrowserStore<Theme>(THEME_STORAGE_KEY, "system", (raw) =>
  isTheme(raw) ? raw : undefined,
);

const DARK_QUERY = "(prefers-color-scheme: dark)";

function applyTheme(theme: Theme) {
  const dark = resolveDark(theme, window.matchMedia(DARK_QUERY).matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

/** Current theme preference, persisted in localStorage and applied to <html>. */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.get,
    () => themeStore.serverValue,
  );

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  return [theme, themeStore.set];
}
