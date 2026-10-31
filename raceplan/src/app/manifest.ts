import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    start_url: `/${routing.defaultLocale}`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2848c7",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
