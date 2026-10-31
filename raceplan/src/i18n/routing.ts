import { defineRouting } from "next-intl/routing";

/** Adding a language = add its code here and a `messages/<code>.json` file. */
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
});

export type AppLocale = (typeof routing.locales)[number];
